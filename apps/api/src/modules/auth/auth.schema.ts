/**
 * zod schemas for every auth endpoint's request body. These double as
 * the single source of truth for validation AND (via z.infer) the
 * TypeScript types used in the service layer — no drift between the two.
 */
import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    // A user can sign up choosing to become a seller immediately, or stay
    // a buyer and add a SellerProfile later via /users/me/become-seller.
    role: z.enum(["BUYER", "SELLER"]).default("BUYER"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export type SignupInput = z.infer<typeof signupSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
