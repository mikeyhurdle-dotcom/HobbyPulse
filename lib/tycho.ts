/**
 * Tycho heartbeat helper.
 *
 * Wraps Vercel cron handlers so each invocation reports start + finish to
 * Tycho's heartbeat endpoint via Tailscale Funnel. The endpoint URL is the
 * `/ping/<uuid>` path; uuid IS the credential (no auth header needed).
 *
 * Default endpoint:  https://tycho-vps.tail167c6b.ts.net/ping
 * Override via:       process.env.TYCHO_PING_URL
 *
 * Per-cron UUIDs are read from `process.env.TYCHO_UUID_<NAME>` env vars set
 * on Vercel. If a UUID is missing, heartbeats are skipped silently — never
 * fails the underlying cron job.
 */

const TYCHO_PING_URL =
  process.env.TYCHO_PING_URL ?? "https://tycho-vps.tail167c6b.ts.net/ping";

/** Best-effort fire to the heartbeat endpoint. Never throws. */
async function _ping(url: string): Promise<void> {
  try {
    await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Tycho is best-effort. Heartbeat failures must not break the cron.
  }
}

export async function tychoStart(uuid: string | undefined): Promise<void> {
  if (!uuid) return;
  await _ping(`${TYCHO_PING_URL}/${uuid}?event=start`);
}

export async function tychoFinish(
  uuid: string | undefined,
  status: "success" | "failure" = "success",
  runtimeMs?: number,
  rowsWritten?: number,
): Promise<void> {
  if (!uuid) return;
  const params = new URLSearchParams({ event: "finish", status });
  if (runtimeMs != null) params.set("runtime_ms", String(runtimeMs));
  if (rowsWritten != null) params.set("rows_written", String(rowsWritten));
  await _ping(`${TYCHO_PING_URL}/${uuid}?${params.toString()}`);
}

/**
 * Wrap an async cron handler with Tycho start + finish heartbeats.
 *
 * Usage:
 *   export async function GET(req: NextRequest) {
 *     // ... auth guard, early return on auth failure ...
 *     return tychoHeartbeat(process.env.TYCHO_UUID_YOUTUBE_INGEST, async () => {
 *       // existing handler body
 *       return NextResponse.json({ ok: true });
 *     });
 *   }
 *
 * Captures runtime in milliseconds. On thrown errors, sends status=failure
 * and re-throws so Vercel's normal error handling still fires.
 */
export async function tychoHeartbeat<T>(
  uuid: string | undefined,
  handler: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  await tychoStart(uuid);
  try {
    const result = await handler();
    await tychoFinish(uuid, "success", Date.now() - start);
    return result;
  } catch (err) {
    await tychoFinish(uuid, "failure", Date.now() - start);
    throw err;
  }
}
