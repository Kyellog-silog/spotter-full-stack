/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // diesel navy app chrome
        ink: {
          DEFAULT: "#16202E",
          800: "#1B2838",
          700: "#243348",
          600: "#33455E",
          500: "#4A5D78",
        },
        // DOT signage amber, used with restraint
        signal: {
          DEFAULT: "#E8A317",
          bright: "#F6B82E",
          dim: "#B47F10",
        },
        // log paper
        paper: {
          DEFAULT: "#FBF8F0",
          line: "#D8CFB8",
          edge: "#E7E0CC",
        },
        // duty status accents (map + legend, not the grid line)
        duty: {
          off: "#6B7A8F",
          sleeper: "#3B5BA5",
          driving: "#E8A317",
          onduty: "#B5651D",
        },
        grid: "#2C6E9B", // log grid blue, matches the real form
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
