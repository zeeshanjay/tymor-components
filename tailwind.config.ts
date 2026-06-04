import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#05030a",
        void: "#0a0612",
        haze: "#d9cfe6",
        cyan: "#5fe9ff",
        violet: "#9a6bff",
        magenta: "#ff5fd2",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        widest2: "0.35em",
      },
    },
  },
  plugins: [],
};

export default config;
