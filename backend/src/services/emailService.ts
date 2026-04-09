import logger from "../utils/logger.js";

const SENDPULSE_SMTP_URL = "https://api.sendpulse.com/smtp/emails";

async function send(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch(SENDPULSE_SMTP_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDPULSE_API_KEY ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: {
        html: Buffer.from(html).toString("base64"),
        subject,
        from: {
          name: process.env.SENDPULSE_SENDER_NAME ?? "GitHub Notifier",
          email: process.env.SENDPULSE_SENDER_EMAIL ?? "",
        },
        to: [{ email: to }],
      },
    }),
  });

  if (!res.ok)
    throw new Error(`SendPulse error ${res.status}: ${await res.text()}`);
}

const baseUrl = () => process.env.BASE_URL ?? "http://localhost:3000";

export async function sendConfirmationEmail(
  email: string,
  repo: string,
  token: string,
): Promise<void> {
  const confirmUrl = `${baseUrl()}/api/confirm/${token}`;
  const unsubscribeUrl = `${baseUrl()}/api/unsubscribe/${token}`;

  await send(
    email,
    `Confirm your subscription to ${repo} releases`,
    `<p>Please <a href="${confirmUrl}">confirm your subscription</a> to <strong>${repo}</strong> release notifications.</p><p><a href="${unsubscribeUrl}">Unsubscribe</a></p>`,
  );

  logger.info("Confirmation email sent", { email, repo });
}

export async function sendReleaseNotification(
  email: string,
  repo: string,
  tag: string,
  token: string,
): Promise<void> {
  const releaseUrl = `https://github.com/${repo}/releases/tag/${tag}`;
  const unsubscribeUrl = `${baseUrl()}/api/unsubscribe/${token}`;

  await send(
    email,
    `New release: ${repo} ${tag}`,
    `<p>A new release <strong>${tag}</strong> is available for <a href="https://github.com/${repo}">${repo}</a>.</p><p><a href="${releaseUrl}">View release</a></p><p><a href="${unsubscribeUrl}">Unsubscribe</a></p>`,
  );

  logger.info("Release notification sent", { email, repo, tag });
}
