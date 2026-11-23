import type { Config } from "tailwindcss";

const v = (name: string) => `var(--${name})`;
const type = (name: string): [string, { lineHeight: string; letterSpacing: string }] => [
  v(`text-${name}`),
  { lineHeight: v(`text-${name}--line`), letterSpacing: v(`text-${name}--track`) },
];

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  // Preflight is replaced by the reset layer in src/styles/base.css.
  corePlugins: { preflight: false },
  theme: {
    // Defaults are removed so only tokens are reachable.
    fontFamily: {
      display: v("font-display"),
      sans: v("font-sans"),
      mono: v("font-mono"),
    },
    fontSize: {
      "2xs": type("2xs"),
      xs: type("xs"),
      sm: type("sm"),
      base: type("base"),
      lg: type("lg"),
      xl: type("xl"),
      "2xl": type("2xl"),
      "3xl": type("3xl"),
      "4xl": type("4xl"),
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      paper: v("paper"),
      "paper-sunk": v("paper-sunk"),
      surface: v("surface"),
      ink: v("ink"),
      "ink-muted": v("ink-muted"),
      "ink-inverse": v("ink-inverse"),
      line: v("line"),
      "line-strong": v("line-strong"),
      "line-control": v("line-control"),
      accent: {
        DEFAULT: v("accent"),
        hover: v("accent-hover"),
        soft: v("accent-soft"),
        "on-dark": v("accent-on-dark"),
      },
      success: { DEFAULT: v("success"), soft: v("success-soft") },
      danger: { DEFAULT: v("danger"), soft: v("danger-soft") },
      band: {
        DEFAULT: v("band"),
        ink: v("band-ink"),
        muted: v("band-muted"),
        line: v("band-line"),
      },
    },
    spacing: {
      0: "0",
      px: "1px",
      1: v("space-1"), 2: v("space-2"), 3: v("space-3"), 4: v("space-4"),
      5: v("space-5"), 6: v("space-6"), 8: v("space-8"), 10: v("space-10"),
      12: v("space-12"), 16: v("space-16"), 20: v("space-20"), 24: v("space-24"),
    },
    borderRadius: {
      none: "0",
      sm: v("radius-sm"),
      md: v("radius-md"),
      lg: v("radius-lg"),
      full: v("radius-full"),
    },
    boxShadow: {
      none: "none",
      pop: v("shadow-pop"),
    },
    zIndex: {
      header: v("z-header"),
      drawer: v("z-drawer"),
      palette: v("z-palette"),
      toast: v("z-toast"),
    },
    transitionTimingFunction: {
      DEFAULT: v("ease-out"),
      out: v("ease-out"),
      "in-out": v("ease-in-out"),
      drawer: v("ease-drawer"),
    },
    transitionDuration: {
      DEFAULT: v("dur-hover"),
      press: v("dur-press"),
      hover: v("dur-hover"),
      ui: v("dur-ui"),
      enter: v("dur-enter"),
      drawer: v("dur-drawer"),
      reveal: v("dur-reveal"),
    },
    extend: {
      maxWidth: { content: v("container-max"), prose: "62ch" },
      aspectRatio: { product: "4 / 5" },
      minHeight: { control: v("control") },
      height: { nav: v("nav-height"), "nav-compact": v("nav-height-compact") },
    },
  },
  plugins: [],
} satisfies Config;
