/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Diesel navy chrome — deeper and more layered than before so cards
        // lift off the page. Page = ink, surfaces = ink-800, raised = ink-700.
        ink: {
          DEFAULT: "#0E1622", // page background
          900: "#0A111B", // deepest wells / inputs
          800: "#16212F", // cards / surfaces
          700: "#22303F", // raised surfaces / dividers
          600: "#32445A", // strong borders / input outline
          500: "#7E8DA3", // muted text
        },
        // DOT signage amber — refined, a touch warmer and brighter
        signal: {
          DEFAULT: "#F5A524",
          bright: "#FFB840",
          dim: "#B97D17",
        },
        // Secondary sky accent for links, secondary stats, info states
        sky: {
          DEFAULT: "#38BDF8",
          bright: "#7DD3FC",
          dim: "#0EA5E9",
        },
        // status / feedback
        good: { DEFAULT: "#34D399", dim: "#10B981" },
        // log paper (unchanged — the sheets keep their authentic look)
        paper: {
          DEFAULT: "#FBF8F0",
          line: "#D8CFB8",
          edge: "#E7E0CC",
        },
        // duty status accents (map + legend, not the grid line)
        duty: {
          off: "#6B7A8F",
          sleeper: "#3B5BA5",
          driving: "#F5A524",
          onduty: "#B5651D",
        },
        grid: "#2C6E9B", // log grid blue, matches the real form
      },
      fontFamily: {
        display: ["Archivo", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      // Numeric weight utilities (font-500 … font-800) used throughout the UI.
      fontWeight: {
        400: "400",
        500: "500",
        600: "600",
        700: "700",
        800: "800",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.02) inset",
        lift: "0 8px 30px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(245,165,36,0.25), 0 8px 30px -10px rgba(245,165,36,0.18)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
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
