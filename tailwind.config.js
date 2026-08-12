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
        h1: ["28px", { lineHeight: "1.25", fontWeight: "700" }],
        h2: ["20px", { lineHeight: "1.25", fontWeight: "700" }],
        h3: ["18px", { lineHeight: "1.25", fontWeight: "700" }],
        h4: ["14px", { lineHeight: "1.25", fontWeight: "700" }],
        "body-lg": ["16px", { lineHeight: "1.5" }],
        "body-md": ["14px", { lineHeight: "1.5", letterSpacing: "0.5px" }],
        "body-sm": ["12px", { lineHeight: "1.5" }],
        "title-2": ["22px", { lineHeight: "28px", letterSpacing: "0.35px" }],
        callout: ["16px", { lineHeight: "21px", letterSpacing: "-0.32px" }],
        button: ["14px", { lineHeight: "1.5", fontWeight: "700" }],
      },
    },
  },
  plugins: [],
};
