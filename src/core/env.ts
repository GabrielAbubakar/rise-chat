import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.url("API URL must be a valid URL"),
  // Add other environment variables here
});

const _env = envSchema.safeParse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});

if (!_env.success) {
  console.error("❌ Invalid environment variables:\n", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
