/**
 * Single shared PrismaClient instance. Importing `prisma` anywhere in the
 * app reuses this same connection pool instead of opening a new one per
 * file (a common Node + Prisma mistake that exhausts DB connections).
 */
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
