/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#F5FBF7",
          200: "#ABDBBE",
          400: "#57B77D",
          DEFAULT: "#57B77D",
        },
        neutral: {
          50: "#DDE2E8",
          300: "#6E8597",
          500: "#3A566A",
          600: "#1F3C51",
          700: "#163043",
          900: "#081C2C",
          DEFAULT: "#3A566A",
        },
        label: {
          DEFAULT: "#000000",
          dark: "#FFFFFF",
        },
        app: {
          DEFAULT: "#F5F7F9",
          dark: "#081C2C",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#163043",
        },
        divider: {
          DEFAULT: "#EAEEF2",
          dark: "#1F3C51",
        },
      },
      fontFamily: {
        display: ["SFProDisplay-Bold", "sans-serif"],
        text: ["SFProDisplay-Regular", "sans-serif"],
        "sf-regular": ["SFProDisplay-Regular", "sans-serif"],
        "sf-medium": ["SFProDisplay-Medium", "sans-serif"],
        "sf-semibold": ["SFProDisplay-Semibold", "sans-serif"],
        "sf-bold": ["SFProDisplay-Bold", "sans-serif"],
      },
      fontSize: {
        h1: ["32px", { lineHeight: "1.25" }],
        h2: ["28px", { lineHeight: "1.25" }],
        h3: ["24px", { lineHeight: "1.25" }],
        h4: ["20px", { lineHeight: "1.25" }],
        h5: ["16px", { lineHeight: "1.25" }],
        h6: ["14px", { lineHeight: "1.25" }],
        "body-lg": ["16px", { lineHeight: "1.5" }],
        "body-md": ["14px", { lineHeight: "1.5" }],
        "body-sm": ["12px", { lineHeight: "1.5" }],
        "button-big": ["14px", { lineHeight: "1.5" }],
        "button-small": ["12px", { lineHeight: "1.5" }],
      },
    },
  },
  plugins: [],
};
