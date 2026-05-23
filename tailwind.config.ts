import type { Config } from 'tailwindcss';

/**
 * Ported from the inline `tailwind.config` block in the old index.html
 * plus the CSS variables that lived in the same <style> block.
 * Keeps the marketing site visually identical after the Next.js migration.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        secondary: 'var(--color-secondary)',
        card: 'var(--color-card)',
        primary: 'var(--color-primary)',
        'text-main': 'var(--color-text-main)',
        'text-secondary': 'var(--color-text-secondary)',
        'border-color': 'var(--color-border-color)',
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'fade-in-down': 'fadeInDown 1s ease-out forwards',
        marquee: 'marquee 40s linear infinite',
        'marquee-right': 'marquee-right 40s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-100%)' },
        },
        'marquee-right': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      accentColor: {
        primary: 'var(--color-primary)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
