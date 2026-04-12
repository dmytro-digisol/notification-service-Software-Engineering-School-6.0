import { Redis } from "ioredis";
import logger from "../utils/logger.js";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
	return redisClient;
}

export async function connectRedis(): Promise<void> {
	const url = process.env.REDIS_URL;
	if (!url) {
		logger.warn("REDIS_URL not set — GitHub API caching disabled");
		return;
	}

	redisClient = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });

	redisClient.on("error", (err: Error) => {
		logger.error("Redis error", { error: err });
	});

	try {
		await redisClient.connect();
		logger.info("Redis connected");
	} catch (err) {
		logger.warn("Redis connection failed — caching disabled", { error: err });
		redisClient = null;
	}
}

export async function disconnectRedis(): Promise<void> {
	if (redisClient) {
		await redisClient.quit();
		redisClient = null;
	}
}
