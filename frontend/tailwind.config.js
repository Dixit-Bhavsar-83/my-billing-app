/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: { sans: ["Inter","ui-sans-serif","system-ui","sans-serif"] },
      colors: {
        indigo: {
          950: "#1e1b4b",
        },
      },
      animation: {
        "laser": "laser 2s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.215,0.61,0.355,1) infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.35s ease-out",
      },
      keyframes: {
        laser: {
          "0%,100%": { top: "8%" },
          "50%":     { top: "88%" },
        },
        "pulse-ring": {
          "0%":   { transform: "scale(.93)", opacity: "1" },
          "100%": { transform: "scale(1.07)", opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
