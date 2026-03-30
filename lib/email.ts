// ---------------------------------------------------------------------------
// Email — Resend integration
// ---------------------------------------------------------------------------

import { getSiteBrand } from "@/lib/site";

interface ResendResponse {
  id?: string;
  message?: string;
}

/**
 * Send a price alert email via Resend.
 */
export async function sendPriceAlert(
  to: string,
  productName: string,
  currentPrice: number,
  targetPrice: number,
  dealUrl: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping email send");
    return;
  }

  const brand = getSiteBrand();
  const formattedCurrent = `\u00A3${(currentPrice / 100).toFixed(2)}`;
  const formattedTarget = `\u00A3${(targetPrice / 100).toFixed(2)}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #e5e5e5; padding: 24px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto;">
    <h1 style="font-size: 20px; margin-bottom: 4px;">${brand.siteName}</h1>
    <p style="color: #737373; font-size: 13px; margin-top: 0;">Price Alert</p>

    <div style="background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h2 style="font-size: 16px; margin: 0 0 12px;">${productName}</h2>
      <p style="margin: 0; font-size: 14px;">
        The price has dropped to <strong style="color: #22c55e;">${formattedCurrent}</strong>
        — below your target of ${formattedTarget}.
      </p>
    </div>

    <a href="${dealUrl}" style="display: inline-block; background: #22c55e; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
      View Deal
    </a>

    <p style="color: #525252; font-size: 11px; margin-top: 32px;">
      You received this because you set a price alert on ${brand.siteName}.
    </p>
  </div>
</body>
</html>`.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: `${brand.siteName} <alerts@${brand.domain}>`,
      to,
      subject: `Price drop: ${productName} is now ${formattedCurrent}`,
      html,
    }),
  });

  if (!res.ok) {
    const body = (await res.json()) as ResendResponse;
    throw new Error(`Resend error: ${res.status} — ${body.message ?? "unknown"}`);
  }
}
