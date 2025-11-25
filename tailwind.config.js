// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",  // 🔍 Scan all React files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
