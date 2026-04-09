import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import * as subscriptionService from "../services/subscriptionService.js";

const router = Router();

router.post(
  "/subscribe",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, repo } = req.body as { email?: string; repo?: string };
      await subscriptionService.subscribe(email ?? "", repo ?? "");
      res.status(200).json({
        message:
          "Subscription Initiated Successfully. Please Check your Email.",
      });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/confirm/:token",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.params.token as string;
      await subscriptionService.confirmSubscription(token);
      res.status(200).json({ message: "Subscription confirmed successfully." });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/unsubscribe/:token",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.params.token as string;
      await subscriptionService.unsubscribe(token);
      res.status(200).json({ message: "Unsubscribed successfully." });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/subscriptions",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = typeof req.query.email === "string" ? req.query.email : "";
      const subs = await subscriptionService.getSubscriptions(email);
      res.status(200).json(subs);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
