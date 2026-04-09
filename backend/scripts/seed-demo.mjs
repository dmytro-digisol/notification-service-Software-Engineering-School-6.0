/**
 * Demo Seed Script
 * Inserts ~10 representative GitHub repository subscriptions directly into MongoDB
 * with confirmed=true, bypassing the email confirmation flow.
 *
 * Usage:
 *   node scripts/seed-demo.mjs [email]
 *
 * Examples:
 *   node scripts/seed-demo.mjs demo@example.com
 *   node scripts/seed-demo.mjs                   # uses default email
 */

import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Load .env manually (avoids needing dotenv as ESM import)
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
  console.warn("⚠️  No .env file found — using existing environment variables.");
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const DEMO_EMAIL = process.argv[2] || "demo@example.com";
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set. Add it to backend/.env");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 10 representative repos across diverse domains
// ---------------------------------------------------------------------------
const DEMO_REPOS = [
  // Frontend
  { repo: "facebook/react",          category: "Frontend Framework" },
  { repo: "vercel/next.js",          category: "Full-stack Framework" },
  { repo: "vitejs/vite",             category: "Build Tool" },
  { repo: "tailwindlabs/tailwindcss", category: "CSS Framework" },
  // Language / Runtime
  { repo: "microsoft/typescript",    category: "Language" },
  { repo: "nodejs/node",             category: "Runtime" },
  // Backend / Infra
  { repo: "expressjs/express",       category: "Web Framework" },
  { repo: "prisma/prisma",           category: "ORM / Database" },
  { repo: "supabase/supabase",       category: "Backend-as-a-Service" },
  // DevOps
  { repo: "docker/compose",          category: "DevOps" },
];

// ---------------------------------------------------------------------------
// Mongoose schema (mirrors backend/src/models/Subscription.ts)
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
  console.log(`\n🌱  Seeding demo subscriptions for: ${DEMO_EMAIL}\n`);
  console.log(`   Connecting to MongoDB…`);

  await mongoose.connect(MONGODB_URI);
  console.log("   Connected.\n");

  let inserted = 0;
  let skipped = 0;

  for (const { repo, category } of DEMO_REPOS) {
    try {
      await Subscription.create({
        email:     DEMO_EMAIL,
        repo,
        confirmed: true,
        token:     randomUUID(),
        lastSeenTag: null,
        lastSeenAt:  null,
      });
      console.log(`   ✅  [${category}] ${repo}`);
      inserted++;
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key — subscription already exists
        console.log(`   ⏭️   [${category}] ${repo}  (already exists, skipped)`);
        skipped++;
      } else {
        console.error(`   ❌  [${category}] ${repo}  ERROR: ${err.message}`);
      }
    }
  }

  console.log(`\n   Done. Inserted: ${inserted}  |  Skipped: ${skipped}\n`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
