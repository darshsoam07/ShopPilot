import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

const motionPreference = () => window.matchMedia("(prefers-reduced-motion: reduce)");
function subscribe(listener: () => void) {
  const preference = motionPreference();
  preference.addEventListener("change", listener);
  return () => preference.removeEventListener("change", listener);
}

export function SmoothScroll({ children, paused = false }: { children: ReactNode; paused?: boolean }) {
  const instance = useRef<Lenis | null>(null);
  const reduced = useSyncExternalStore(subscribe, () => motionPreference().matches, () => true);

  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({
      duration: 1.1,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      autoRaf: true,
    });
    instance.current = lenis;
    return () => {
      lenis.destroy();
      instance.current = null;
    };
  }, [reduced]);

  useEffect(() => {
    if (!paused) return;
    document.documentElement.classList.add("store-scroll-locked");
    instance.current?.stop();
    return () => {
      document.documentElement.classList.remove("store-scroll-locked");
      instance.current?.start();
    };
  }, [paused, reduced]);

  return <>{children}</>;
}
