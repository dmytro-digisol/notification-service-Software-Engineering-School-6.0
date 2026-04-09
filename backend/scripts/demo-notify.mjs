/**
 * Demo Notification Trigger Script
 *
 * Resets lastSeenTag for subscriptions (so the next check will re-notify),
 * then triggers an immediate release check via the admin API.
 *
 * Usage:
 *   node scripts/demo-notify.mjs [repo] [repo2] ...
 *
 * Examples:
 *   node scripts/demo-notify.mjs                        # reset ALL repos
 *   node scripts/demo-notify.mjs facebook/react         # reset one repo
 *   node scripts/demo-notify.mjs facebook/react nodejs/node  # reset several
 *
 * The server must be running (pnpm start / pnpm build:start).
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Load .env
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");

try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  console.warn("WARNING: No .env file found — using existing environment variables.");
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT ?? "3000";
const BASE_URL = `http://localhost:${PORT}`;

if (!MONGODB_URI) {
  console.error(" MONGODB_URI is not set. Add it to backend/.env");
  process.exit(1);
}

const targetRepos = process.argv.slice(2); // empty = all repos

// ---------------------------------------------------------------------------
// Mongoose schema (mirrors src/models/Subscription.ts)
// ---------------------------------------------------------------------------
const subscriptionSchema = new mongoose.Schema(
  {
    email:       { type: String, required: true },
    repo:        { type: String, required: true },
    confirmed:   { type: Boolean, default: false },
    token:       { type: String, required: true },
    lastSeenTag: { type: String, default: null },
    lastSeenAt:  { type: Date, default: null },
  },
  { timestamps: true },
);
subscriptionSchema.index({ email: 1, repo: 1 }, { unique: true });

const Subscription =
  mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("\nDemo Notification Trigger\n");

  // 1. Reset lastSeenTag in MongoDB
  console.log("   Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI);
  console.log("   Connected.\n");

  if (targetRepos.length === 0) {
    // Reset all confirmed subscriptions
    const result = await Subscription.updateMany(
      { confirmed: true },
      { $set: { lastSeenTag: null, lastSeenAt: null } },
    );
    console.log(`Reset lastSeenTag for ALL repos  (${result.modifiedCount} subscriptions)\n`);
  } else {
    for (const repo of targetRepos) {
      const result = await Subscription.updateMany(
        { repo, confirmed: true },
        { $set: { lastSeenTag: null, lastSeenAt: null } },
      );
      console.log(`Reset lastSeenTag for ${repo}  (${result.modifiedCount} subscriptions)`);
    }
    console.log();
  }

  await mongoose.disconnect();

  // 2. Trigger release check via API
  console.log(`   Calling ${BASE_URL}/api/admin/trigger-check …`);
  try {
    const res = await fetch(`${BASE_URL}/api/admin/trigger-check`, {
      method: "POST",
    });

    if (!res.ok) {
      console.error(` HTTP ${res.status}: ${await res.text()}`);
      process.exit(1);
    }

    const body = await res.json();
    console.log(`  ${body.message}\n`);
    console.log("   Release check is running — emails will be sent shortly.\n");
  } catch (err) {
    console.error(`\n    Could not reach the server at ${BASE_URL}.`);
    console.error("       Make sure the backend is running (pnpm build:start).\n");
    console.error(`       ${err.message}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
