import "dotenv/config.js";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { connectDB } from "./config/db.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { errorHandler } from "./middleware/errorHandler.js";
import {
  httpRequestDurationSeconds,
  httpRequestsTotal,
  register,
} from "./metrics.js";
import subscriptionRouter from "./routes/subscriptions.js";
import { ReleaseChecker } from "./scheduler/releaseChecker.js";
import logger from "./utils/logger.js";
import cors from "cors";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3000", 10);
const __dirname = dirname(fileURLToPath(import.meta.url));

// HTTP metrics middleware
app.use((req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  res.on("finish", () => {
    const route = (req.route?.path as string | undefined) ?? req.path;
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
    httpRequestDurationSeconds.observe({ method: req.method, route }, duration);
  });
  next();
});

app.use(express.static(join(__dirname, "../public")));
app.use(express.json({ limit: "16kb" }));
app.use(cors());
app.use("/api", subscriptionRouter);

// Prometheus metrics endpoint
app.get("/metrics", async (_req: Request, res: Response) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.getMetricsAsJSON());
});

app.use(errorHandler);

const releaseChecker = new ReleaseChecker();

// // Dev-only: manually trigger release check
// app.post("/api/admin/trigger-check", (_req, res) => {
//   void releaseChecker.triggerNow();
//   res.json({ message: "Release check triggered." });
// });

// // Dev-only: reset lastSeenTag for all subs of a repo so next check re-notifies
// app.post("/api/admin/reset-last-seen", async (req, res) => {
//   const { repo } = req.body as { repo?: string };
//   if (!repo) {
//     res.status(400).json({ message: "repo required" });
//     return;
//   }
//   await Subscription.updateMany(
//     { repo },
//     { $set: { lastSeenTag: null, lastSeenAt: null } },
//   );
//   res.json({ message: `lastSeenTag reset for ${repo}` });
// });

const start = async (): Promise<void> => {
  await connectDB();
  await connectRedis();
  releaseChecker.start();
  app.listen(PORT, () => {
    logger.info("Server started", { port: PORT });
  });
};

const shutdown = (signal: string): void => {
  logger.info("Shutdown signal received", { signal });
  releaseChecker.stop();
  void disconnectRedis().finally(() => process.exit(0));
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start().catch((err) => {
  logger.error("Startup error", { error: err });
  process.exit(1);
});
