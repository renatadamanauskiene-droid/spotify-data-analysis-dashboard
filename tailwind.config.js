/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#0b0f14',
          900: '#0f151c',
          850: '#131a22',
          800: '#182029',
          700: '#232d38',
          600: '#334152',
          500: '#4c5b6d',
          400: '#7c8ba0',
          300: '#a7b3c2',
          200: '#cbd4de',
          100: '#e7ecf1',
        },
        risk: {
          green: '#2f9e5b',
          greenBg: '#12261c',
          yellow: '#d1a220',
          yellowBg: '#2a2312',
          red: '#c9483f',
          redBg: '#2b1614',
        },
        accent: {
          DEFAULT: '#3d8bfd',
          soft: '#1b2a3d',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,0.03) inset, 0 1px 3px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
