import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z
    .string({
      message: "EXPO_PUBLIC_API_URL is missing. Please set EXPO_PUBLIC_API_URL in your .env file.",
    })
    .url("EXPO_PUBLIC_API_URL must be a valid URL")
    .min(1, "EXPO_PUBLIC_API_URL cannot be empty"),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  console.warn(`\n⚠️  ENVIRONMENT CONFIGURATION WARNING:\n${issues}\n`);
}

export const env = {
  get EXPO_PUBLIC_API_URL(): string {
    const url = process.env.EXPO_PUBLIC_API_URL;
    if (!url) {
      throw new Error(
        "Missing environment variable: EXPO_PUBLIC_API_URL is not defined in your .env file. " +
          "If you recently updated your .env file, please restart Metro using `npx expo start -c`."
      );
    }
    return url;
  },
  get API_URL(): string {
    return this.EXPO_PUBLIC_API_URL;
  },
};
