export type PrimaryColorTheme = "green" | "red" | "blue" | "orange";

export const COLOR_SCHEMES: Record<
  PrimaryColorTheme,
  { 50: string; 100: string; 200: string; 300: string; 400: string; DEFAULT: string }
> = {
  green: {
    50: "#DDF1E5",
    100: "#E8F5ED",
    200: "#ABDBBE",
    300: "#73C393",
    400: "#57B77D",
    DEFAULT: "#57B77D",
  },
  red: {
    50: "#FADCD8",
    100: "#F7C5BD",
    200: "#F4A79D",
    300: "#FA6B52",
    400: "#E8503A",
    DEFAULT: "#E8503A",
  },
  blue: {
    50: "#ECF5FF",
    100: "#AAD3FF",
    200: "#80BDFF",
    300: "#55A8FF",
    400: "#007CFF",
    DEFAULT: "#007CFF",
  },
  orange: {
    50: "#FFF0D9",
    100: "#FFE5BF",
    200: "#FFD89F",
    300: "#FFCC7F",
    400: "#FFB23F",
    DEFAULT: "#FFB23F",
  },
};
