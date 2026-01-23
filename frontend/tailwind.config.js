/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Jost', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#E8F1FB',
          100: '#D1E4F6',
          200: '#A3C8ED',
          300: '#75ADE4',
          400: '#4791DB',
          500: '#206DBB', // акцентный цвет
          600: '#1B5D9F',
          700: '#164C82',
          800: '#113B66',
          900: '#0C2B4A',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
        }
      }
    },
  },
  plugins: [],
}
