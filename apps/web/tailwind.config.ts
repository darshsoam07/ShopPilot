import type { Config } from "tailwindcss";

const v = (name: string) => `var(--${name})`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // Nuke defaults so only tokens are reachable.
    fontFamily: {
      display: v("font-display").replace("var(", "").slice(0, -1),
      sans: v("font-sans").replace("var(", "").slice(0, -1),
      mono: v("font-mono").replace("var(", "").slice(0, -1),
    },
    fontSize: {
      "2xs": [v("text-2xs"), { lineHeight: v("text-2xs--line"),
                               letterSpacing: v("text-2xs--track") }],
      xs:    [v("text-xs"),  { lineHeight: v("text-xs--line"),
                               letterSpacing: v("text-xs--track") }],
      sm:    [v("text-sm"),  { lineHeight: v("text-sm--line"),
                               letterSpacing: v("text-sm--track") }],
      base:  [v("text-base"),{ lineHeight: v("text-base--line"),
                               letterSpacing: v("text-base--track") }],
      lg:    [v("text-lg"),  { lineHeight: v("text-lg--line"),
                               letterSpacing: v("text-lg--track") }],
      xl:    [v("text-xl"),  { lineHeight: v("text-xl--line"),
                               letterSpacing: v("text-xl--track") }],
      "2xl": [v("text-2xl"), { lineHeight: v("text-2xl--line"),
                               letterSpacing: v("text-2xl--track") }],
      "3xl": [v("text-3xl"), { lineHeight: v("text-3xl--line"),
                               letterSpacing: v("text-3xl--track") }],
      "4xl": [v("text-4xl"), { lineHeight: v("text-4xl--line"),
                               letterSpacing: v("text-4xl--track") }],
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      paper: v("paper"),
      "paper-sunk": v("paper-sunk"),
      ink: v("ink"),
      "ink-muted": v("ink-muted"),
      line: v("line"),
      "line-strong": v("line-strong"),
      accent: {
        DEFAULT: v("accent"),
        hover: v("accent-hover"),
        soft: v("accent-soft"),
      },
      danger: v("danger"),
      white: "#fff",
    },
    spacing: {
      0: "0", px: "1px",
      1: v("space-1"), 2: v("space-2"), 3: v("space-3"), 4: v("space-4"),
      5: v("space-5"), 6: v("space-6"), 8: v("space-8"), 10: v("space-10"),
      12: v("space-12"), 16: v("space-16"), 20: v("space-20"),
      24: v("space-24"),
    },
    borderRadius: {
      none: "0",
      sm: v("radius-sm"),
      md: v("radius-md"),
      full: v("radius-full"),
    },
    boxShadow: {
      none: "none",
      pop: v("shadow-pop"),
    },
    extend: {
      maxWidth: { content: "1200px", prose: "62ch" },
      aspectRatio: { product: "4 / 5" },
      transitionTimingFunction: { DEFAULT: v("ease") },
      transitionDuration: {
        DEFAULT: v("dur-hover"),
        enter: v("dur-enter"),
      },
    },
  },
  plugins: [],
} satisfies Config;
