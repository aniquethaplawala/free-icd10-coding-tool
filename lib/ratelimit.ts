/**
 * Two limits keep a free tool from becoming a free model proxy:
 *  1. per IP, in memory (best effort, one bucket per server instance), and
 *  2. one daily cap across all instances, via the Supabase function the sullybuild demos use.
 * Neither stores anything about the note. The IP is only held in memory for the window.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function takeIpToken(ip: string, limit = 12, windowMs = 10 * 60_000): boolean {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
  }
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

export async function takeDailyQuota(app = "code-this-note"): Promise<boolean> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return true; // no shared cap configured (local dev)
  const limit = Number(process.env.DAILY_LIVE_LIMIT || 500);
  try {
    const res = await fetch(`${url}/rest/v1/rpc/sullybuild_take_app_quota`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_app: app, p_limit: limit }),
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return true; // fail open; the per-IP limit still applies
    const n = await res.json();
    return n !== null; // null means today's cap is used up
  } catch {
    return true;
  }
}
