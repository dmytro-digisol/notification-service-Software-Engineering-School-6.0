import "dotenv/config.js";
import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import subscriptionRouter from "./routes/subscriptions.js";
import { ReleaseChecker } from "./scheduler/releaseChecker.js";
import logger from "./utils/logger.js";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3000", 10);
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(__dirname, "../public")));
app.use(express.json({ limit: "16kb" }));
app.use("/api", subscriptionRouter);
app.use(errorHandler);

const releaseChecker = new ReleaseChecker();

const start = async (): Promise<void> => {
	await connectDB();
	releaseChecker.start();
	app.listen(PORT, () => {
		logger.info("Server started", { port: PORT });
	});
};

const shutdown = (signal: string): void => {
	logger.info("Shutdown signal received", { signal });
	releaseChecker.stop();
	process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start().catch((err) => {
	logger.error("Startup error", { error: err });
	process.exit(1);
});
