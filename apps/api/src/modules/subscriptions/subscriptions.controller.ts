import { Request, Response } from "express";
import * as subscriptionsService from "./subscriptions.service";
import type { SubscribeInput } from "./subscriptions.schema";

export async function subscribe(req: Request, res: Response) {
  const input = req.body as SubscribeInput;
  const subscription = await subscriptionsService.subscribe(req.user!.id, req.user!.role, input.planId);
  res.status(201).json({ subscription });
}

export async function mine(req: Request, res: Response) {
  const subscriptions = await subscriptionsService.getMine(req.user!.id);
  res.json({ subscriptions });
}

export async function cancel(req: Request, res: Response) {
  const subscription = await subscriptionsService.cancel(req.user!.id, req.params.id);
  res.json({ subscription });
}
