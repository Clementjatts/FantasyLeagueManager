import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}", ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter var", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // Apex Design System Colors
        "apex-green": "hsl(var(--primary))",
        "volt-magenta": "hsl(var(--secondary))",
        "slate-echo": "hsl(var(--background))",
        "frosted-glass": "hsl(var(--card))",
        "inkwell": "hsl(var(--foreground))",
        "slate-gray": "hsl(var(--muted))",
        "slate-border": "hsl(var(--border))",
        "success": "hsl(var(--success))",
        "warning": "hsl(var(--warning))",
        "info": "hsl(var(--info))",
        // Apex Gradients
        "apex-gradient": "var(--apex-gradient)",
        "apex-glow": "var(--apex-glow)",
        // Glass effects
        "glass-bg": "var(--glass-bg)",
        "glass-border": "var(--glass-border)",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
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
        "gradient-y": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "center top"
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "center center"
          }
        },
        "float": {
          "0%, 100%": {
            transform: "translateY(0)"
          },
          "50%": {
            transform: "translateY(-10px)"
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gradient-y": "gradient-y 6s ease infinite",
        "float": "float 3s ease-in-out infinite"
      },
      boxShadow: {
        // Apex Design System Shadows
        'apex': '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2)',
        'apex-lg': '0 0 30px rgba(16, 185, 129, 0.5), 0 0 60px rgba(16, 185, 129, 0.3)',
        'apex-card': '0 8px 32px 0 rgba(16, 185, 129, 0.15)',
        'apex-hover': '0 8px 32px 0 rgba(16, 185, 129, 0.25)',
        'apex-button': '0 4px 12px 0 rgba(16, 185, 129, 0.3)',
        'apex-button-hover': '0 6px 16px 0 rgba(16, 185, 129, 0.4)',
        // Glass effects
        'glass': '0 8px 32px 0 rgba(16, 185, 129, 0.1)',
        'glass-card': '0 8px 32px 0 rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glass-hover': '0 8px 32px 0 rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        // Volt Magenta accents
        'volt': '0 0 20px rgba(217, 70, 239, 0.3), 0 0 40px rgba(217, 70, 239, 0.1)',
        'volt-lg': '0 0 30px rgba(217, 70, 239, 0.4), 0 0 60px rgba(217, 70, 239, 0.2)',
      }
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
