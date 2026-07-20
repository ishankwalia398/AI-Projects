import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#fdfbf7",
          100: "#faf6ed",
          200: "#f5ecd6",
          300: "#ede0bc",
        },
        terracotta: {
          400: "#c17f59",
          500: "#b56a3e",
          600: "#9a5a35",
        },
        ink: {
          800: "#2d2a26",
          900: "#1a1816",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
