import { z } from "zod";

export const listPlansSchema = z.object({
  query: z.object({
    audience: z.enum(["BUYER", "SELLER"]),
  }),
});
