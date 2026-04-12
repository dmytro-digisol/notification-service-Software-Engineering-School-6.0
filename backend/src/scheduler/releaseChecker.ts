import cron from "node-cron";
import { Subscription } from "../models/Subscription.js";
import { sendReleaseNotification } from "../services/emailService.js";
import { getLatestRelease } from "../services/githubService.js";
import logger from "../utils/logger.js";

export class ReleaseChecker {
	private task: cron.ScheduledTask | null = null;

	start(): void {
		const schedule = process.env.CHECK_INTERVAL_CRON ?? "*/5 * * * *";
		this.task = cron.schedule(schedule, () => void this.checkReleases());
		logger.info("Release checker started", { schedule });
		// Pre-warm Redis cache on startup — fetch only, no notifications
		void this.warmCache();
	}

	private async warmCache(): Promise<void> {
		try {
			const repos = (await Subscription.distinct("repo", {
				confirmed: true,
			})) as string[];
			await Promise.all(
				repos.map((repo) => getLatestRelease(repo).catch(() => {})),
			);
			if (repos.length > 0) {
				logger.info("Release cache pre-warmed", { repos: repos.length });
			}
		} catch (err) {
			logger.error("Cache warm error", { error: err });
		}
	}

	stop(): void {
		this.task?.stop();
	}

	async triggerNow(): Promise<void> {
		await this.checkReleases();
	}

	private async checkReleases(): Promise<void> {
		try {
			const repos = (await Subscription.distinct("repo", {
				confirmed: true,
			})) as string[];

			for (const repo of repos) {
				await this.checkRepo(repo);
			}
		} catch (err) {
			logger.error("Release checker error", { error: err });
		}
	}

	private async checkRepo(repo: string): Promise<void> {
		try {
			const latestTag = await getLatestRelease(repo);
			if (!latestTag) return;

			const subs = await Subscription.find({
				repo,
				confirmed: true,
				$or: [{ lastSeenTag: null }, { lastSeenTag: { $ne: latestTag } }],
			});

			const detectedAt = new Date();
			for (const sub of subs) {
				await sendReleaseNotification(
					sub.email,
					repo,
					latestTag,
					sub.token,
					detectedAt,
				);
				sub.lastSeenTag = latestTag;
				sub.lastSeenAt = detectedAt;
				await sub.save();
			}
		} catch (err) {
			logger.error("Error checking repo releases", { repo, error: err });
		}
	}
}
