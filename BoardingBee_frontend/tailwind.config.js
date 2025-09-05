/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bb1: '#03045E',
        bb2: '#0077B6',
        bb3: '#00B4D8',
        bb4: '#90E0EF',
        bb5: '#CAF0F8',
      },
    },
  },
  plugins: [],
}
