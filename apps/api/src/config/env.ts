/**
 * Every environment variable the server needs, validated once at startup
 * with zod. If something is missing or malformed, the app fails fast with
 * a clear error instead of crashing later on a random `undefined`.
 */
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET should be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  COOKIE_NAME: z.string().default("kindred_session"),
  // Stripe — optional in dev/test; required in production
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // OpenAI — optional; semantic search degrades to text search if absent
  OPENAI_API_KEY: z.string().optional(),
  // Email (SMTP) — optional; order emails skipped if not set
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("noreply@shoppan.com"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Fix your .env file before starting the server (see .env.example).");
}

export const env = parsed.data;
