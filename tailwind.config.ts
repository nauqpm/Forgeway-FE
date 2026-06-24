// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/common/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ---------- BREAKPOINTS ---------- */
      screens: {
        "xl-custom": "1001px", // PC lớn hơn iPad Pro một chút
      },

      /* ---------- COLOR PALETTE ---------- */
      colors: {
        // legacy — giữ để không break code cũ
        primary: "#2563EB",
        secondary: "#14B8A6",
        accent: "#FACC15",
        dark: "#1F2937",
        light: "#6B7280",

        // design tokens mới
        canvas: "#F2FAFF",
        surface: "#FFFFFF",
        "surface-subtle": "#F9F9F8",
        "app-border": "#EAEAEA",
        ink: "#111111",
        "ink-2": "#787774",
        "ink-3": "#ABABAB",
        "cta": "#111111",
      },

      /* ---------- SHADOWS ---------- */
      boxShadow: {
        float: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)",
      },

      /* ---------- TYPOGRAPHY ---------- */
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Helvetica Neue", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "SF Mono", "JetBrains Mono", "monospace"],
        montserrat: ["Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
