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
    },
  },
  plugins: [],
}
