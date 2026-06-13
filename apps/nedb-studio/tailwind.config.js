/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "./routes/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          950: "#06080f",
          900: "#0a0e1a",
          850: "#0e1322",
          800: "#141a2e",
          700: "#1e2740",
        },
        accent: {
          DEFAULT: "#6366f1",
          soft: "#818cf8",
          glow: "#a78bfa",
        },
        signal: {
          green: "#34d399",
          amber: "#fbbf24",
          red: "#f87171",
          cyan: "#22d3ee",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(99,102,241,0.25), 0 8px 40px -12px rgba(99,102,241,0.45)",
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.08) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
