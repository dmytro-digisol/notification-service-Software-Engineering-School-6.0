import { beforeEach, describe, expect, it, vi } from "vitest";
import { Subscription } from "../src/models/Subscription.js";
import * as emailService from "../src/services/emailService.js";
import * as githubService from "../src/services/githubService.js";
import {
  confirmSubscription,
  getSubscriptions,
  subscribe,
  unsubscribe,
} from "../src/services/subscriptionService.js";

vi.mock("../src/services/githubService.js");
vi.mock("../src/services/emailService.js");

const mockValidateRepo = vi.mocked(githubService.validateRepo);
const mockSendConfirmationEmail = vi.mocked(emailService.sendConfirmationEmail);

beforeEach(() => {
  mockValidateRepo.mockResolvedValue(undefined);
  mockSendConfirmationEmail.mockResolvedValue(undefined);
});

describe("subscribe", () => {
  it("creates a subscription and sends a confirmation email", async () => {
    await subscribe("user@example.com", "skerkour/black-hat-rust");

    const sub = await Subscription.findOne({
      email: "user@example.com",
      repo: "skerkour/black-hat-rust",
    });
    expect(sub).toBeTruthy();
    expect(sub!.confirmed).toBe(false);
    expect(sub!.token).toBeTruthy();
    expect(sub!.token).toBeTruthy();
    expect(mockSendConfirmationEmail).toHaveBeenCalledOnce();
  });

  it("throws 400 for an invalid email", async () => {
    await expect(
      subscribe("not-an-email", "skerkour/black-hat-rust"),
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 409 when the email is already subscribed to the same repo", async () => {
    await subscribe("user@example.com", "skerkour/black-hat-rust");
    await expect(
      subscribe("user@example.com", "skerkour/black-hat-rust"),
    ).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("propagates 404 from github when repo is not found", async () => {
    mockValidateRepo.mockRejectedValue({ statusCode: 404 });
    await expect(
      subscribe("user@example.com", "666ghj/missing-repo"),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("confirmSubscription", () => {
  it("sets confirmed to true for the matching token", async () => {
    await subscribe("user@example.com", "skerkour/black-hat-rust");
    const sub = await Subscription.findOne({ email: "user@example.com" });

    await confirmSubscription(sub!.token);

    const updated = await Subscription.findById(sub!._id);
    expect(updated!.confirmed).toBe(true);
  });

  it("throws 404 for an unknown token", async () => {
    await expect(confirmSubscription("unknown-token")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("unsubscribe", () => {
  it("removes the subscription for the matching token", async () => {
    await subscribe("user@example.com", "skerkour/black-hat-rust");
    const sub = await Subscription.findOne({ email: "user@example.com" });

    await unsubscribe(sub!.token);

    const removed = await Subscription.findById(sub!._id);
    expect(removed).toBeNull();
  });

  it("throws 404 for an unknown token", async () => {
    await expect(unsubscribe("unknown-token")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("getSubscriptions", () => {
  it("returns all subscriptions for the given email", async () => {
    await subscribe("user@example.com", "skerkour/black-hat-rust");
    await subscribe("user@example.com", "yangshun/tech-interview-handbook");

    const subs = await getSubscriptions("user@example.com");

    expect(subs).toHaveLength(2);
    expect(subs.map((s) => s.repo).sort()).toEqual(
      ["skerkour/black-hat-rust", "yangshun/tech-interview-handbook"].sort(),
    );
  });

  it("returns the correct shape with last_seen_tag", async () => {
    await subscribe("user@example.com", "666ghj/MiroFish");
    const subs = await getSubscriptions("user@example.com");

    expect(subs[0]).toMatchObject({
      email: "user@example.com",
      repo: "666ghj/MiroFish",
      confirmed: false,
      last_seen_tag: null,
    });
  });

  it("throws 400 for an invalid email", async () => {
    await expect(getSubscriptions("bad")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("returns empty array for unknown email", async () => {
    const subs = await getSubscriptions("nobody@example.com");
    expect(subs).toEqual([]);
  });
});
