/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Redefinición del tema central con azul #5564eb
        green: {
          50: "#eef1fe",
          100: "#e0e4fc",
          200: "#c7cffa",
          300: "#a4b0f6",
          400: "#7b8cf1",
          500: "#5564eb", // Azul 5564eb solicitado
          600: "#4250d4",
          700: "#3540b6",
          800: "#2c3594",
          900: "#262e77",
          950: "#181c4c",
        },
        blue: {
          50: "#eef1fe",
          100: "#e0e4fc",
          200: "#c7cffa",
          300: "#a4b0f6",
          400: "#7b8cf1",
          500: "#5564eb", // Armonizado con el azul 5564eb
          600: "#4250d4",
          700: "#3540b6",
          800: "#2c3594",
          900: "#262e77",
          950: "#181c4c",
        },
        primary: {
          50: "#eef1fe",
          100: "#e0e4fc",
          200: "#c7cffa",
          300: "#a4b0f6",
          400: "#7b8cf1",
          500: "#5564eb",
          600: "#4250d4",
          700: "#3540b6",
          800: "#2c3594",
          900: "#262e77",
          950: "#181c4c",
        },
      },
      keyframes: {
        wave: {
          "0%, 100%": { clipPath: "polygon(0 0, 100% 0, 80% 100%, 0% 100%)" },
          "50%": { clipPath: "polygon(0 0, 100% 0, 85% 100%, 0% 100%)" },
        },
      },
      animation: {
        wave: "wave 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
