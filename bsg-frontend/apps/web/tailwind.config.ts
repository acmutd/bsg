/** @type {import('tailwindcss').Config} */

import { join } from "path";

module.exports = {
    darkMode: ["class"],
    content: [
        './app/**/*.{ts,tsx}',
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
            fontFamily: {
                display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
                sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
                mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
            },
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
                customGreen: {
                    DEFAULT: "#3C5721",
                    dark: "#2e4317", // for hover
                },
                neutral: {
                    550: '#636363',
                    650: '#474747',
                    750: '#323232',
                },
                // Shared surface tokens (kept in sync with the extension config so
                // shared components like TooltipWrapper resolve the same classes here).
                "bsg-bg": "rgb(var(--bsg-bg))",
                "bsg-surface": "rgb(var(--bsg-surface))",
                "bsg-surface-alt": "rgb(var(--bsg-surface-alt))",
                "bsg-surface-mid": "rgb(var(--bsg-surface-mid))",
                "bsg-surface-input": "rgb(var(--bsg-surface-input))",
                "bsg-border": "rgb(var(--bsg-border))",
                "bsg-separator": "rgb(var(--bsg-separator))",
                "bsg-hover": "rgb(var(--bsg-hover))",
                "bsg-hover-subtle": "rgb(var(--bsg-hover-subtle))",
                "bsg-dark": "rgb(var(--bsg-dark))",
                "bsg-glass": "var(--bsg-glass)",
                "bsg-glass-strong": "var(--bsg-glass-strong)",
                // Web-only accents.
                signal: "rgb(var(--signal) / <alpha-value>)",
                amber: "rgb(var(--amber) / <alpha-value>)",
                coral: "rgb(var(--coral) / <alpha-value>)",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                "2xl": "calc(var(--radius) + 0.5rem)",
                "3xl": "calc(var(--radius) + 1rem)",
            },
            boxShadow: {
                "bsg-glass": "var(--bsg-glass-shadow)",
                glow: "0 0 0 1px rgb(var(--signal) / 0.35), 0 12px 40px -12px rgb(var(--signal) / 0.45)",
                "glow-sm": "0 0 24px -6px rgb(var(--signal) / 0.5)",
                panel: "0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 24px 60px -30px rgb(0 0 0 / 0.8)",
                lift: "0 18px 40px -20px rgb(0 0 0 / 0.9)",
            },
            keyframes: {
                "accordion-down": {
                    from: {height: 0},
                    to: {height: "var(--radix-accordion-content-height)"},
                },
                "accordion-up": {
                    from: {height: "var(--radix-accordion-content-height)"},
                    to: {height: 0},
                },
                "fade-in": {
                    from: {opacity: "0"},
                    to: {opacity: "1"},
                },
                "pulse-dot": {
                    "0%, 100%": {boxShadow: "0 0 0 0 rgb(var(--signal) / 0.6)"},
                    "70%": {boxShadow: "0 0 0 8px rgb(var(--signal) / 0)"},
                },
                drift: {
                    "0%, 100%": {transform: "translate3d(0, 0, 0)"},
                    "50%": {transform: "translate3d(0, -14px, 0)"},
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in": "fade-in 0.6s ease-out both",
                "pulse-dot": "pulse-dot 2.2s ease-out infinite",
                drift: "drift 9s ease-in-out infinite",
            },
            transitionTimingFunction: {
                spring: "cubic-bezier(0.22, 1, 0.36, 1)",
            },
            spacing: {
                "22": "5.5rem",
                "18": "4.5rem",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
