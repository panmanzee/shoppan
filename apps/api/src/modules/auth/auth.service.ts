/**
 * Business logic for signup/login: hashing passwords, checking
 * credentials, and issuing JWTs. No Express `req`/`res` in here — that
 * belongs in the controller, so this file is easy to unit test on its own.
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "@/config/env";
import { ApiError } from "@/middleware/errorHandler";
import * as authRepository from "./auth.repository";
import type { LoginInput, SignupInput } from "./auth.schema";

const SALT_ROUNDS = 10;

export async function signup(input: SignupInput) {
  const existing = await authRepository.findUserByEmail(input.email);
  if (existing) {
    throw ApiError.conflict("An account with that email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await authRepository.createUser({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role as Role,
  });

  return { user, token: signToken(user.id, user.role) };
}

export async function login(input: LoginInput) {
  const user = await authRepository.findUserByEmail(input.email);
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    // Deliberately the same message as "user not found" above — never
    // reveal which part of the credentials was wrong.
    throw ApiError.unauthorized("Invalid email or password");
  }

  return { user, token: signToken(user.id, user.role) };
}

function signToken(userId: string, role: Role) {
  return jwt.sign({ sub: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}
