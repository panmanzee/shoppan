/**
 * Throttles repeated requests from the same IP. Applied to the auth
 * routes specifically because login/signup are the classic targets for
 * brute-force password guessing and mass fake-account creation.
 */
import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // 20 attempts per IP per window is generous for a real user, painful for a script
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many attempts, please try again in a few minutes.",
      code: "RATE_LIMITED",
    },
  },
});
