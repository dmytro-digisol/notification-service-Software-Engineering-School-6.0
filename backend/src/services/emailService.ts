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

const baseUrl = () => "https://toon-infrastructure.xyz/notification-service";

function toKyivTime(date: Date): string {
  return date.toLocaleString("uk-UA", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }) + " (Kyiv)";
}

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
  detectedAt: Date = new Date(),
): Promise<void> {
  const releaseUrl = `https://github.com/${repo}/releases/tag/${tag}`;
  const repoUrl = `https://github.com/${repo}`;
  const unsubscribeUrl = `${baseUrl()}/api/unsubscribe/${token}`;
  const kyivTime = toKyivTime(detectedAt);

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Courier New',Courier,monospace;font-size:14px;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #d1d5db;">
        <!-- header -->
        <tr>
          <td style="background:#0e7490;padding:20px 28px;">
            <div style="color:#ffffff;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;">GitHub Release Notifier</div>
            <div style="color:#a5f3fc;font-size:11px;margin-top:4px;letter-spacing:0.08em;">notification-service &mdash; SE-School-6.0</div>
          </td>
        </tr>
        <!-- body -->
        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 16px;font-size:15px;font-weight:bold;color:#0e7490;">New Release Detected</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d1d5db;margin-bottom:20px;">
              <tr>
                <td style="padding:10px 14px;background:#f5f5f5;color:#6b7280;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;width:130px;border-bottom:1px solid #d1d5db;">Repository</td>
                <td style="padding:10px 14px;border-bottom:1px solid #d1d5db;"><a href="${repoUrl}" style="color:#0e7490;text-decoration:none;">${repo}</a></td>
              </tr>
              <tr>
                <td style="padding:10px 14px;background:#f5f5f5;color:#6b7280;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid #d1d5db;">Release Tag</td>
                <td style="padding:10px 14px;border-bottom:1px solid #d1d5db;font-weight:bold;color:#059669;">${tag}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;background:#f5f5f5;color:#6b7280;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Detected At</td>
                <td style="padding:10px 14px;color:#1a1a1a;">${kyivTime}</td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 8px 0 0;">
                  <a href="${releaseUrl}" style="display:block;text-align:center;padding:10px;background:#0e7490;color:#ffffff;text-decoration:none;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">[ view release ]</a>
                </td>
                <td style="padding:0 0 0 8px;">
                  <a href="${repoUrl}" style="display:block;text-align:center;padding:10px;border:1px solid #0e7490;color:#0e7490;text-decoration:none;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">[ open repo ]</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- footer -->
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #d1d5db;background:#f5f5f5;">
            <p style="margin:0;font-size:11px;color:#6b7280;">You are receiving this because you subscribed to <strong>${repo}</strong> releases.</p>
            <p style="margin:6px 0 0;font-size:11px;"><a href="${unsubscribeUrl}" style="color:#dc2626;">Unsubscribe</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await send(email, `New release: ${repo} ${tag}`, html);

  logger.info("Release notification sent", { email, repo, tag, detectedAt: kyivTime });
}
