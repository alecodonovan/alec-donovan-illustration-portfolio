/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#FFFFFF",
        ink: "#2D2D2D",
        lime: "#DDFF00",
      },
      fontFamily: {
        sans: ['"Rethink Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
