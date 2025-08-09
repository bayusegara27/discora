/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#5865F2',
        'secondary': '#23272A',
        'background': '#1e1f22',
        'surface': '#2b2d31',
        'text-primary': '#F2F3F5',
        'text-secondary': '#949BA4',
        'accent': '#38BDF8', // A bright accent color
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'aurora': 'aurora 20s infinite linear',
        'pulse-online': 'pulse-online 2s infinite',
      },
      keyframes: {
        aurora: {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
        'pulse-online': {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.7)',
           },
          '50%': {
            transform: 'scale(1.05)',
            boxShadow: '0 0 0 5px rgba(34, 197, 94, 0)',
          },
        },
      },
    },
  },
  plugins: [],
}