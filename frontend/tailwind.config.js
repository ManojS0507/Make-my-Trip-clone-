/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B35",
        secondary: "#003366",
        accent: "#00BFA5",
        dark: "#0F172A",
        light: "#F8FAFC",
      },
      ringColor: {
        primary: "#FF6B35",
        secondary: "#003366",
      },
    },
  },
  plugins: [],
}