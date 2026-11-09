import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Rydvanta Signature Brand Palette
        forest: {
          DEFAULT: "#123B2F",
          dark: "#0B2921",
          deep: "#071B16",
          light: "#1C5443",
          surface: "#184B3C",
          border: "#1d5242",
        },
        ivory: {
          DEFAULT: "#F8F4EC",
          soft: "#F2EADF",
          light: "#FDFBF7",
          dark: "#E8DEC9",
          border: "#E2DDD5",
        },
        terracotta: {
          DEFAULT: "#C94B18",
          hover: "#B33E10",
          light: "#FFF1EB",
          muted: "#E06A3B",
          border: "#F7C7B3",
        },
        charcoal: {
          DEFAULT: "#202923",
          muted: "#4A554D",
          light: "#69776E",
          border: "#E2DDD5",
        },
        sage: {
          DEFAULT: "#A8B5A0",
          light: "#E5ECE0",
          surface: "#EFF4EC",
          dark: "#7E8E77",
        },
        brand: {
          50: "#FFF5F0",
          100: "#FFE6DB",
          200: "#FFC8B3",
          300: "#FFA385",
          400: "#F07345",
          500: "#C94B18", // Rydvanta Terracotta
          600: "#B33E10",
          700: "#8F2E08",
          800: "#6B2003",
          900: "#4D1500",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        warm: "0 10px 30px -5px rgba(32, 41, 35, 0.08), 0 4px 6px -2px rgba(32, 41, 35, 0.04)",
        "warm-lg": "0 20px 40px -10px rgba(18, 59, 47, 0.12), 0 8px 12px -3px rgba(18, 59, 47, 0.06)",
        card: "0 2px 10px rgba(32, 41, 35, 0.04), 0 1px 3px rgba(32, 41, 35, 0.06)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
