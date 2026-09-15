import { Request, Response } from "express";
import * as checkoutService from "./checkout.service";
import type { CheckoutInput } from "./checkout.schema";

export async function checkout(req: Request, res: Response) {
  const input = req.body as CheckoutInput;
  const result = await checkoutService.checkout(req.user!.id, input);
  res.status(201).json(result);
}
