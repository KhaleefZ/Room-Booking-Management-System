/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fdf8f0",
          100: "#faefd9",
          200: "#f4dba8",
          300: "#edc270",
          400: "#e5a43d",
          500: "#d4891e",
          600: "#b86d16",
          700: "#955215",
          800: "#7a4117",
          900: "#643717",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
  ],
}