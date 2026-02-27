/** @type {import('tailwindcss').Config} */
import {join} from "path";
import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        join(__dirname, '../../packages/**/*.{js,ts,jsx,tsx}'),
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
                border: "rgba(var(--border))",
                input: "rgba(var(--input))",
                ring: "rgba(var(--ring))",
                background: "rgba(var(--background))",
                foreground: "rgba(var(--foreground))",
                inputBackground: "rgba(var(--inputBackground))",
                brand: "rgba(var(--brand))",
                primary: {
                    DEFAULT: "rgba(var(--primary))",
                    foreground: "rgba(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "rgba(var(--secondary))",
                    foreground: "rgba(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "rgba(var(--destructive))",
                    foreground: "rgba(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "rgba(var(--muted))",
                    foreground: "rgba(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "rgba(var(--accent))",
                    foreground: "rgba(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "rgba(var(--popover))",
                    foreground: "rgba(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "rgba(var(--card))",
                    foreground: "rgba(var(--card-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: {height: '0px'},
                    to: {height: "var(--radix-accordion-content-height)"},
                },
                "accordion-up": {
                    from: {height: "var(--radix-accordion-content-height)"},
                    to: {height: '0px'},
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
            spacing: {
                "22": "5.5rem"
            }
        },
    },
    plugins: [require("tailwindcss-animate")],
}

export default config