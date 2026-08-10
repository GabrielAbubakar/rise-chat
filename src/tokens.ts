// tokens.ts — Chatme UI Kit design tokens

export const colors = {
  primary: {
    50: "#F5FBF7",
    200: "#ABDBBE",
    400: "#57B77D", // Primary/400 - Primary (main brand green)
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
} as const;

export const typography = {
  fontFamily: {
    display: "SF Pro Display",
    text: "SF Pro Display Regular",
  },
  heading: {
    h1: { size: 28, weight: "700" as const, lineHeight: 1.25 },
    h2: { size: 20, weight: "700" as const, lineHeight: 1.25 },
    h3: { size: 18, weight: "700" as const, lineHeight: 1.25 },
    h4: { size: 14, weight: "700" as const, lineHeight: 1.25 },
  },
  body: {
    lg: { size: 16, weight: "400" as const, lineHeight: 1.5 },
    md: { size: 14, weight: "400" as const, lineHeight: 1.5, letterSpacing: 0.5 },
    sm: { size: 12, weight: "400" as const, lineHeight: 1.5 },
  },
  default: {
    title2: {
      family: "SF Pro Display",
      size: 22,
      weight: "400" as const,
      lineHeight: 28,
      letterSpacing: 0.35,
    },
    callout: {
      family: "SF Pro Display Regular",
      size: 16,
      weight: "400" as const,
      lineHeight: 21,
      letterSpacing: -0.32,
    },
  },
  button: { size: 14, weight: "700" as const, lineHeight: 1.5 },
} as const;

// Theme mode preset definitions
export const themeModes = {
  day: {
    background: colors.app.DEFAULT,
    surface: colors.surface.DEFAULT,
    text: colors.label.DEFAULT,
    secondaryText: colors.neutral[500],
    border: colors.divider.DEFAULT,
    cardBg: colors.surface.DEFAULT,
  },
  night: {
    background: colors.app.dark,
    surface: colors.surface.dark,
    text: colors.label.dark,
    secondaryText: colors.neutral[300],
    border: colors.divider.dark,
    cardBg: colors.surface.dark,
  },
} as const;
