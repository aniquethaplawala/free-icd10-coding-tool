import { NextResponse } from "next/server";
import { CODE_SET_LABEL } from "@/lib/config";
import { M1Error, m1Json } from "@/lib/m1";
import { systemPrompt, userPrompt, type Setting } from "@/lib/prompt";
import { takeDailyQuota, takeIpToken } from "@/lib/ratelimit";
import { reviewCodes } from "@/lib/review";
import { scrub } from "@/lib/scrub";
import { cookieFor, DAILY_FREE_RUNS, usedToday } from "@/lib/dailyCookie";
import type { SuggestResponse } from "@/lib/types";
import { numberWarning, parseAndValidate } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };
const MIN_CHARS = 40;
const MAX_CHARS = 20_000;

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

export async function POST(req: Request) {
  if (Number(req.headers.get("content-length") || 0) > 64_000) {
    return fail(413, "That note is too long. Paste up to 20,000 characters.");
  }
  let body: { note?: unknown; setting?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail(400, "We couldn't read that request. Try again.");
  }
  const raw = typeof body.note === "string" ? body.note : "";
  if (raw.trim().length < MIN_CHARS) return fail(400, "Paste a longer note. We need at least a few sentences.");
  if (raw.length > MAX_CHARS) return fail(413, "That note is too long. Paste up to 20,000 characters.");
  const setting: Setting = body.setting === "inpatient" ? "inpatient" : "outpatient";

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (!takeIpToken(ip)) return fail(429, "You've reached the limit for now. Try again in 10 minutes.");
  const used = usedToday(req.headers.get("cookie"));
  if (used >= DAILY_FREE_RUNS) {
    return fail(429, `You've used today's ${DAILY_FREE_RUNS} free notes in this browser. Come back tomorrow.`);
  }
  if (!(await takeDailyQuota())) return fail(429, "We've reached today's free limit. Try again tomorrow.");

  // The browser already removed identifiers. Run it again here in case a client skipped it.
  const note = scrub(raw).text;
  const includeVisitLevel = process.env.ENABLE_EM_LEVEL === "true";
  const started = Date.now();

  try {
    const { content } = await m1Json(systemPrompt({ setting, includeVisitLevel }), userPrompt(note, setting));
    const first = parseAndValidate(content, note, { includeVisitLevel });
    const review = await reviewCodes(note, setting, first.codes, first.tips);
    const kept = new Set(review.codes.map((c) => c.code));
    const codes = review.codes.map((c) => {
      const warning = numberWarning(c.description, c.evidence);
      return warning ? { ...c, warning, confidence: "low" as const } : c;
    });
    const response: SuggestResponse = {
      ...first,
      codes,
      // A tip about a code the review removed or corrected no longer applies.
      tips: review.tips.filter((t) => !t.currentCode || kept.has(t.currentCode)),
      dropped: { ...first.dropped, failedReview: review.failedReview, corrected: review.corrected, reviewed: review.reviewed },
      setting,
      ms: Date.now() - started,
      codeSet: CODE_SET_LABEL,
      remainingToday: DAILY_FREE_RUNS - (used + 1),
    };
    const res = NextResponse.json(response, { headers: NO_STORE });
    res.cookies.set(cookieFor(used + 1));
    return res;
  } catch (err) {
    // Log the failure type only. Never log the note, the prompt or the model's reply.
    const kind = err instanceof M1Error ? `${err.status}:${err.code}` : err instanceof Error ? err.message.slice(0, 40) : "unknown";
    console.error(`[suggest] failed ${kind}`);
    if (err instanceof M1Error && err.status === 429) return fail(503, "The model is busy. Try again in a minute.");
    if (err instanceof M1Error && err.code === "context_length_exceeded") return fail(413, "That note is too long. Try a shorter one.");
    return fail(502, "We couldn't get codes for that note. Try again.");
  }
}

export function GET() {
  return fail(405, "Use POST.");
}
