/**
 * Per-browser daily limit, kept in a signed httpOnly cookie: "<UTC day>.<count>.<signature>".
 * Editing the cookie breaks the signature, which counts as the limit being used up.
 * Clearing cookies resets it; the per-IP limit in ratelimit.ts still applies.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const DAILY_FREE_RUNS = 10;
export const COOKIE_NAME = "icd_daily";

const secret = () => process.env.COOKIE_SECRET || process.env.SULLY_API_KEY || "dev-secret";
const today = () => new Date().toISOString().slice(0, 10);
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url").slice(0, 22);

/** How many runs this browser has used today. */
export function usedToday(cookieHeader: string | null): number {
  const raw = cookieHeader
    ?.split(/;\s*/)
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!raw) return 0;
  const [day, count, sig] = decodeURIComponent(raw).split(".");
  const expected = sign(`${day}.${count}`);
  const valid = sig && sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!valid) return DAILY_FREE_RUNS; // tampered
  if (day !== today()) return 0;
  const n = Number(count);
  return Number.isFinite(n) && n >= 0 ? n : DAILY_FREE_RUNS;
}

export function cookieFor(used: number) {
  const payload = `${today()}.${used}`;
  return {
    name: COOKIE_NAME,
    value: `${payload}.${sign(payload)}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 26,
  };
}
