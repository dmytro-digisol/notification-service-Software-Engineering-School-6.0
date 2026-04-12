import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import * as subscriptionService from "../services/subscriptionService.js";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     SubscribeRequest:
 *       type: object
 *       required:
 *         - email
 *         - repo
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Subscriber's email address
 *           example: user@example.com
 *         repo:
 *           type: string
 *           description: GitHub repository in "owner/name" format
 *           example: facebook/react
 *     MessageResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Operation completed successfully.
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Something went wrong.
 *         code:
 *           type: string
 *           example: INVALID_PARAMS
 *     Subscription:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 665f1a2b3c4d5e6f7a8b9c0d
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         repo:
 *           type: string
 *           example: facebook/react
 *         confirmed:
 *           type: boolean
 *           example: true
 *         token:
 *           type: string
 *           example: abc123def456
 *         lastSeenTag:
 *           type: string
 *           nullable: true
 *           example: v18.3.0
 *         lastSeenAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2024-06-01T12:00:00.000Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-05-01T10:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-06-01T12:00:00.000Z"
 */

/**
 * @openapi
 * /api/subscribe:
 *   post:
 *     tags:
 *       - Subscriptions
 *     summary: Subscribe to GitHub release notifications
 *     description: >
 *       Registers an email address to receive notifications when a GitHub
 *       repository publishes a new release. A confirmation email is sent
 *       immediately; the subscription is only activated after the user clicks
 *       the confirmation link.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscribeRequest'
 *     responses:
 *       '200':
 *         description: Subscription initiated — confirmation email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: Subscription Initiated Successfully. Please Check your Email.
 *       '400':
 *         description: Missing or invalid email / repo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: Email is already subscribed to this repository
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @openapi
 * /api/confirm/{token}:
 *   get:
 *     tags:
 *       - Subscriptions
 *     summary: Confirm a subscription
 *     description: >
 *       Activates a pending subscription using the one-time token sent in the
 *       confirmation email. Once confirmed, the subscriber will receive release
 *       notifications for the associated repository.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: One-time confirmation token from the email link
 *         example: abc123def456
 *     responses:
 *       '200':
 *         description: Subscription confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: Subscription confirmed successfully.
 *       '404':
 *         description: Token not found or already used
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @openapi
 * /api/unsubscribe/{token}:
 *   get:
 *     tags:
 *       - Subscriptions
 *     summary: Unsubscribe from GitHub release notifications
 *     description: >
 *       Removes a subscription using the one-time token included in every
 *       notification email. The subscription record is deleted immediately.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Unsubscribe token from a notification email
 *         example: abc123def456
 *     responses:
 *       '200':
 *         description: Unsubscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: Unsubscribed successfully.
 *       '404':
 *         description: Token not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @openapi
 * /api/subscriptions:
 *   get:
 *     tags:
 *       - Subscriptions
 *     summary: Get all subscriptions for an email
 *     description: >
 *       Returns every subscription record associated with the given email
 *       address, including both pending (unconfirmed) and active subscriptions.
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address to look up subscriptions for
 *         example: user@example.com
 *     responses:
 *       '200':
 *         description: List of subscriptions for the email
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subscription'
 *       '400':
 *         description: Missing or invalid email query parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
