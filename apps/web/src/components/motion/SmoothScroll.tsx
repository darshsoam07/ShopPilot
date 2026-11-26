import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useReducedMotionPreference } from "../../lib/motion";

/**
 * Smooth wheel scrolling is scoped to pages that tell a scroll-linked story.
 * Everywhere else (catalog, PDP, checkout, account, admin) the browser scrolls
 * natively, so sticky galleries, scroll-linked sections and find-in-page stay
 * exact with no interpolation lag.
 */
const SMOOTH_ROUTES = new Set(["/"]);

/** Fraction of the remaining distance covered each frame. Higher is crisper (0.1 default, 1 is off). */
const SMOOTH_LERP = 0.18;

type ScrollTarget = number | string | HTMLElement;
interface ScrollToOptions {
  offset?: number;
  immediate?: boolean;
}
interface SmoothScrollApi {
  scrollTo: (target: ScrollTarget, options?: ScrollToOptions) => void;
}

function nativeScrollTo(target: ScrollTarget, { offset = 0, immediate = false }: ScrollToOptions = {}) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior: ScrollBehavior = immediate || reduced ? "auto" : "smooth";
  if (typeof target === "number") {
    window.scrollTo({ top: target + offset, behavior });
    return;
  }
  const element = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (!element) return;
  window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY + offset, behavior });
}

const SmoothScrollContext = createContext<SmoothScrollApi>({ scrollTo: nativeScrollTo });

export const useSmoothScroll = () => useContext(SmoothScrollContext);

export function SmoothScroll({ children, paused = false }: { children: ReactNode; paused?: boolean }) {
  const { pathname } = useLocation();
  const reduced = useReducedMotionPreference();
  const smooth = !reduced && SMOOTH_ROUTES.has(pathname);
  const instance = useRef<Lenis | null>(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (!smooth) return;
    const lenis = new Lenis({
      lerp: SMOOTH_LERP,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: true,
      anchors: false,
      // Dialogs and drawers own their own scrolling.
      prevent: (node) => node.closest("[role='dialog'], [data-lenis-prevent]") !== null,
    });
    instance.current = lenis;
    return () => {
      lenis.destroy();
      instance.current = null;
    };
  }, [smooth]);

  // The router does not restore scroll on navigation. Reset on path change only,
  // so changing filters (search params) never throws the reader back to the top.
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    instance.current?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (!paused) return;
    document.documentElement.classList.add("store-scroll-locked");
    instance.current?.stop();
    return () => {
      document.documentElement.classList.remove("store-scroll-locked");
      instance.current?.start();
    };
  }, [paused, smooth]);

  const api = useMemo<SmoothScrollApi>(
    () => ({
      scrollTo: (target, options = {}) => {
        const lenis = instance.current;
        if (!lenis) return nativeScrollTo(target, options);
        lenis.scrollTo(target, { offset: options.offset ?? 0, immediate: options.immediate ?? false });
      },
    }),
    [],
  );

  return <SmoothScrollContext.Provider value={api}>{children}</SmoothScrollContext.Provider>;
}
