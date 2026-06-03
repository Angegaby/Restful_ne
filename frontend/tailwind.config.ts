import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0d4f4f',
          light: '#1a7a7a',
          dark: '#083838',
        },
        accent: {
          DEFAULT: '#e8a838',
          warm: '#c47d2a',
        },
        ink: {
          DEFAULT: '#1c1917',
          soft: '#44403c',
        },
        muted: '#78716c',
        faint: '#a8a29e',
        canvas: '#f5f1eb',
        surface: {
          DEFAULT: '#fffcf8',
          elevated: '#ffffff',
        },
        border: {
          DEFAULT: '#e7e0d6',
          strong: '#d6cec3',
        },
        stat: {
          ok: '#2d8a6f',
          warn: '#c9a227',
          danger: '#c45c4a',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(28, 25, 23, 0.06), 0 8px 24px rgba(13, 79, 79, 0.06)',
        nav: '4px 0 24px rgba(8, 56, 56, 0.12)',
      },
    },
  },
  plugins: [],
};
export default config;
