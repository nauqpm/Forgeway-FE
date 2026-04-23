// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/common/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ---------- BREAKPOINTS ---------- */
      screens: {
        "xl-custom": "1001px", // PC lớn hơn iPad Pro một chút
      },

      /* ---------- COLOR PALETTE ---------- */
      colors: {
        primary: "#2563EB", // indigo‑600
        secondary: "#14B8A6", // teal‑500
        accent: "#FACC15", // yellow‑400
        dark: "#1F2937", // gray‑800
        light: "#6B7280", // gray‑500
      },

      /* ---------- TYPOGRAPHY ---------- */
      fontFamily: {
        montserrat: ["Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
