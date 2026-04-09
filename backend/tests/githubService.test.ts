import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getLatestRelease,
	validateRepo,
} from "../src/services/githubService.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
	mockFetch.mockReset();
});

describe("validateRepo", () => {
	it("resolves for a valid existing repo", async () => {
		mockFetch.mockResolvedValue({ ok: true, status: 200 });
		await expect(
			validateRepo("skerkour/black-hat-rust"),
		).resolves.toBeUndefined();
	});

	it("throws 400 for invalid format (no slash)", async () => {
		await expect(validateRepo("invalidrepo")).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("throws 400 for invalid format (spaces)", async () => {
		await expect(validateRepo("skerkour/black hat rust")).rejects.toMatchObject(
			{ statusCode: 400 },
		);
	});

	it("throws 404 when GitHub returns 404", async () => {
		mockFetch.mockResolvedValue({ ok: false, status: 404 });
		await expect(validateRepo("666ghj/nonexistent-repo")).rejects.toMatchObject(
			{ statusCode: 404 },
		);
	});

	it("throws 500 on unexpected GitHub error", async () => {
		mockFetch.mockResolvedValue({ ok: false, status: 503 });
		await expect(
			validateRepo("yangshun/tech-interview-handbook"),
		).rejects.toMatchObject({ statusCode: 500 });
	});
});

describe("getLatestRelease", () => {
	it("returns the latest tag", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ tag_name: "v1.2.3" }),
		});
		await expect(getLatestRelease("skerkour/black-hat-rust")).resolves.toBe(
			"v1.2.3",
		);
	});

	it("returns null when no releases exist (404)", async () => {
		mockFetch.mockResolvedValue({ ok: false, status: 404 });
		await expect(getLatestRelease("666ghj/MiroFish")).resolves.toBeNull();
	});

	it("throws 500 on unexpected error", async () => {
		mockFetch.mockResolvedValue({ ok: false, status: 503 });
		await expect(
			getLatestRelease("yangshun/tech-interview-handbook"),
		).rejects.toMatchObject({ statusCode: 500 });
	});
});
