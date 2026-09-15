import { Request, Response } from "express";
import * as usersService from "./users.service";
import type { BecomeSellerInput, UpdateSellerProfileInput } from "./users.schema";

export async function me(req: Request, res: Response) {
  // req.user is guaranteed to exist here because this route sits behind
  // the `requireAuth` middleware — see users.routes.ts.
  const user = await usersService.getMe(req.user!.id);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser });
}

export async function becomeSeller(req: Request, res: Response) {
  const input = req.body as BecomeSellerInput;
  const sellerProfile = await usersService.becomeSeller(req.user!.id, input);
  res.status(201).json({ sellerProfile });
}

export async function updateSellerProfile(req: Request, res: Response) {
  const input = req.body as UpdateSellerProfileInput;
  const sellerProfile = await usersService.updateSellerProfile(req.user!.id, input);
  res.json({ sellerProfile });
}
