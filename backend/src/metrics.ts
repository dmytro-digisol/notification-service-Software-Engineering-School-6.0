import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

export const register = new Registry();

collectDefaultMetrics({ register });

export const httpRequestsTotal = new Counter({
	name: "http_requests_total",
	help: "Total number of HTTP requests",
	labelNames: ["method", "route", "status_code"],
	registers: [register],
});

export const httpRequestDurationSeconds = new Histogram({
	name: "http_request_duration_seconds",
	help: "Duration of HTTP requests in seconds",
	labelNames: ["method", "route"],
	buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
	registers: [register],
});

export const githubApiCacheHitsTotal = new Counter({
	name: "github_api_cache_hits_total",
	help: "Total number of GitHub API cache hits",
	labelNames: ["operation"],
	registers: [register],
});

export const githubApiCacheMissesTotal = new Counter({
	name: "github_api_cache_misses_total",
	help: "Total number of GitHub API cache misses",
	labelNames: ["operation"],
	registers: [register],
});
