/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        sidebar: {
          DEFAULT: 'rgb(var(--sidebar) / <alpha-value>)',
          foreground: 'rgb(var(--sidebar-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: 'rgb(var(--destructive) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        hairline: 'rgb(var(--hairline) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          foreground: 'rgb(var(--brand-foreground) / <alpha-value>)',
          soft: 'var(--brand-soft)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        heading: [
          'Inter',
          'ui-sans-serif',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          '"Segoe UI"',
          'sans-serif',
        ],
        mono: ['ui-monospace', '"SF Mono"', '"JetBrains Mono"', 'Menlo', 'Cascadia Code', 'monospace'],
      },
      boxShadow: {
        edge: '0 0 0 1px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.035)',
        floating: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 8px 24px -8px rgba(0, 0, 0, 0.16)',
        overlay: '0 0 0 1px rgba(0, 0, 0, 0.08), 0 24px 80px -20px rgba(0, 0, 0, 0.32)',
      },
      borderWidth: {
        DEFAULT: '1px',
      },
      keyframes: {
        'fade-up': {
          '0%': { transform: 'translateY(4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pin-in': {
          '0%': { transform: 'scale(.6)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up .18s ease-out',
        'pin-in': 'pin-in .14s ease-out',
      },
    },
  },
  plugins: [],
};
