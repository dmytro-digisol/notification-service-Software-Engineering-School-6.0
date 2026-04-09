import { ApiError } from "../utils/ApiError.js";

const GITHUB_API = "https://api.github.com";
const REPO_PATTERN = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;

function buildHeaders(): Record<string, string> {
	const headers: Record<string, string> = {
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
	};
	if (process.env.GITHUB_TOKEN) {
		headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
	}
	return headers;
}

export async function validateRepo(repo: string): Promise<void> {
	if (!REPO_PATTERN.test(repo)) {
		throw ApiError.badRequest(
			"Invalid repository format. Expected owner/repo.",
		);
	}

	const res = await fetch(`${GITHUB_API}/repos/${repo}`, {
		headers: buildHeaders(),
	});

	if (res.status === 404)
		throw ApiError.notFound("Repository not found on GitHub.");
	if (!res.ok) throw ApiError.internal("Failed to validate repository.");
}

export async function getLatestRelease(repo: string): Promise<string | null> {
	const res = await fetch(`${GITHUB_API}/repos/${repo}/releases/latest`, {
		headers: buildHeaders(),
	});

	if (res.status === 404) return null;
	if (!res.ok) throw ApiError.internal(`Failed to fetch releases for ${repo}.`);

	const data = (await res.json()) as { tag_name: string };
	return data.tag_name;
}
