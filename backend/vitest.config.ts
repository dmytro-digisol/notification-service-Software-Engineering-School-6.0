import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		pool: "forks",
		setupFiles: ["./tests/setup.ts"],
		testTimeout: 15_000,
	},
});
