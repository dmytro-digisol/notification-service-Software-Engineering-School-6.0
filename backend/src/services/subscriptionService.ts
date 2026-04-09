import { randomUUID } from "node:crypto";
import { Subscription } from "../models/Subscription.js";
import { ApiError } from "../utils/ApiError.js";
import { sendConfirmationEmail } from "./emailService.js";
import { validateRepo } from "./githubService.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function assertValidEmail(email: string): void {
  if (!email || !EMAIL_PATTERN.test(email)) {
    throw ApiError.badRequest("Invalid email address.");
  }
}

export async function subscribe(email: string, repo: string): Promise<void> {
  assertValidEmail(email);
  await validateRepo(repo); // throws 400 (bad format) or 404 (not found)

  const existing = await Subscription.findOne({ email, repo });
  if (existing) {
    throw new ApiError(
      409,
      "Email already subscribed to this repository.",
      "CONFLICT",
    );
  }
  // Just for the purpose of the Demo use random UUID
  const token = randomUUID();

  await Subscription.create({ email, repo, token });

  // Both confirm/unsubscribe token is the same
  await sendConfirmationEmail(email, repo, token);
}

export async function confirmSubscription(token: string): Promise<void> {
  if (!token) throw ApiError.badRequest("Invalid token.");

  const sub = await Subscription.findOne({ token: token });
  if (!sub) throw ApiError.notFound("Token not found.");

  sub.confirmed = true;
  await sub.save();
}

export async function unsubscribe(token: string): Promise<void> {
  if (!token) throw ApiError.badRequest("Invalid token.");

  const sub = await Subscription.findOne({ token: token });
  if (!sub) throw ApiError.notFound("Subscription not found.");

  await sub.deleteOne();
}

export type SubscriptionView = {
  email: string;
  repo: string;
  confirmed: boolean;
  last_seen_tag: string | null;
  last_seen_at: Date | null;
  createdAt: Date;
  token: string;
};

export async function getSubscriptions(
  email: string,
): Promise<SubscriptionView[]> {
  assertValidEmail(email);

  const subs = await Subscription.find({ email }).lean();
  return subs.map((s) => ({
    email: s.email,
    repo: s.repo,
    confirmed: s.confirmed,
    last_seen_tag: s.lastSeenTag,
    last_seen_at: s.lastSeenAt ?? null,
    createdAt: s.createdAt,
    token: s.token,
  }));
}
