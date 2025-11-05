import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  // === INIZIO MODIFICA ===
  // I percorsi devono puntare alla cartella 'client'
  content: [
    './client/pages/**/*.{ts,tsx}',
    './client/components/**/*.{ts,tsx}',
    './client/app/**/*.{ts,tsx}',
    './client/src/**/*.{ts,tsx}',
  ],
  // === FINE MODIFICA ===
  prefix: "",
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
        // === INIZIO MODIFICA ===
        // Aggiunti colori 'dark' e 'light'
        dark: {
          DEFAULT: "#333333", // Un grigio scuro
          light: "#555555"    // Un grigio leggermente più chiaro
        },
        light: {
          DEFAULT: "#f4f4f4", // Un grio molto chiaro
          medium: "#e0e0e0"   // Un grigio medio-chiaro
        }
        // === FINE MODIFICA ===
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
