/**
 * Repository layer: the ONLY place in the app that talks to Prisma for
 * user records. Services call these functions instead of importing
 * `prisma` directly — if the DB layer ever changes, only this file moves.
 */
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { sellerProfile: true },
  });
}

export function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}) {
  return prisma.user.create({ data });
}
