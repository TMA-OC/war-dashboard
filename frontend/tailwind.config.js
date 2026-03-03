/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'war-red': '#ef4444',
        'war-orange': '#f97316',
        'war-yellow': '#eab308',
        'war-green': '#22c55e',
      },
    },
  },
  plugins: [],
}
