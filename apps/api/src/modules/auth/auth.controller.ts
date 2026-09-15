/**
 * Controller: translates HTTP <-> service calls. Sets/clears the httpOnly
 * session cookie here (the one and only place a JWT touches an HTTP
 * response), and shapes the JSON the frontend receives. Never sends
 * `passwordHash` back to the client.
 */
import { Request, Response } from "express";
import { env } from "@/config/env";
import * as authService from "./auth.service";
import type { LoginInput, SignupInput } from "./auth.schema";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, keep in sync with JWT_EXPIRES_IN
};

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
}) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function signup(req: Request, res: Response) {
  const input = req.body as SignupInput;
  const { user, token } = await authService.signup(input);
  res.cookie(env.COOKIE_NAME, token, COOKIE_OPTIONS);
  res.status(201).json({ user: toPublicUser(user) });
}

export async function login(req: Request, res: Response) {
  const input = req.body as LoginInput;
  const { user, token } = await authService.login(input);
  res.cookie(env.COOKIE_NAME, token, COOKIE_OPTIONS);
  res.status(200).json({ user: toPublicUser(user) });
}

export async function logout(req: Request, res: Response) {
  res.clearCookie(env.COOKIE_NAME);
  res.status(204).send();
}
