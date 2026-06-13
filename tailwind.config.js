/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Wayline light theme: navy + amber on a cool light canvas.
        canvas: "#eef1f5", // page background
        surface: "#ffffff", // cards
        panel: "#f7f9fb", // subtle alt surface (alt rows, skeleton)
        line: {
          DEFAULT: "#e3e7ec", // borders / dividers
          strong: "#d9dee4", // input outlines
        },
        // brand navy
        navy: {
          DEFAULT: "#0f2747",
          600: "#16335a",
          400: "#284a72",
          200: "#cdd9e6",
        },
        // signage amber (CTAs, primary accent)
        amber: {
          DEFAULT: "#f59e0b",
          dark: "#e8920a",
          soft: "#fff8ee",
        },
        // text scale (dark on light)
        fg: {
          DEFAULT: "#11181c",
          soft: "#3a444d",
          muted: "#5b6770",
          faint: "#94a0ab",
        },
        good: { DEFAULT: "#15803d", bg: "#ecfdf3", border: "#bbf0cd" },
        // duty-status row accents (log grid + legend)
        duty: {
          off: "#64748b",
          sleeper: "#7c5cff",
          driving: "#d97706",
          onduty: "#0d9488",
        },
        // map markers / stop events
        stop: {
          start: "#0f2747",
          pickup: "#d97706",
          dropoff: "#16a34a",
          fuel: "#0d9488",
          brk: "#8b5cf6",
          reset: "#5b6b80",
          restart: "#e11d48",
        },
        gridline: "#c4ccd3", // log grid lines
      },
      fontFamily: {
        display: ["Archivo", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontWeight: {
        400: "400",
        500: "500",
        600: "600",
        700: "700",
        800: "800",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,39,71,0.06)",
        lift: "0 12px 28px rgba(15,39,71,0.14)",
        glow: "0 4px 14px rgba(245,158,11,0.28)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "pulse-soft": "pulse-soft 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
