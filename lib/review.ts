/**
 * Second pass. M1 sees each suggested code's official CMS description next to the quote that
 * supports it, and keeps, replaces or drops it. Replacements are checked against the code
 * table again. If this pass fails or times out, the first-pass codes are returned unchanged.
 */
import { billableUnder, lookup, undotted } from "./icd10";
import { m1Json } from "./m1";
import { reviewSystemPrompt, reviewUserPrompt, type Setting } from "./prompt";
import type { DocTip, SuggestedCode } from "./types";

type Review = { code?: unknown; action?: unknown; replacement?: unknown };

export async function reviewCodes(
  note: string,
  setting: Setting,
  codes: SuggestedCode[],
  tips: DocTip[],
): Promise<{ codes: SuggestedCode[]; tips: DocTip[]; failedReview: number; corrected: number; reviewed: boolean }> {
  if (codes.length === 0) return { codes, tips: [], failedReview: 0, corrected: 0, reviewed: true };

  let reviews: Review[];
  let keepTips: Set<number>;
  try {
    const items = codes.map((c) => ({ code: c.code, official_description: c.description, quote: c.evidence }));
    const { content } = await m1Json(
      reviewSystemPrompt(setting),
      reviewUserPrompt(note, items, tips.map((t) => t.tip)),
      1500,
      20_000,
    );
    const text = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
    const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as {
      reviews?: Review[];
      tips_to_keep?: unknown;
    };
    reviews = Array.isArray(parsed.reviews) ? parsed.reviews : [];
    keepTips = new Set(Array.isArray(parsed.tips_to_keep) ? parsed.tips_to_keep.filter((n): n is number => typeof n === "number") : []);
  } catch {
    return { codes, tips, failedReview: 0, corrected: 0, reviewed: false };
  }

  const byCode = new Map<string, Review>();
  for (const r of reviews) if (r && typeof r.code === "string") byCode.set(undotted(r.code), r);

  const out: SuggestedCode[] = [];
  let failedReview = 0;
  let corrected = 0;
  for (const c of codes) {
    const r = byCode.get(undotted(c.code));
    const action = typeof r?.action === "string" ? r.action : "keep";
    if (action === "drop") {
      failedReview++;
      continue;
    }
    if (action === "replace") {
      const hit = typeof r?.replacement === "string" ? lookup(r.replacement) : null;
      const duplicate = hit && (out.some((o) => o.code === hit.code) || codes.some((o) => o !== c && o.code === hit.code));
      if (!hit || duplicate) {
        failedReview++;
        continue;
      }
      if (hit.code !== c.code) corrected++;
      out.push({
        ...c,
        code: hit.code,
        description: hit.description,
        billable: hit.billable,
        options: hit.billable ? undefined : billableUnder(hit.code, 6).map((e) => ({ code: e.code, description: e.description })),
        confidence: c.confidence === "high" ? "medium" : c.confidence,
      });
      continue;
    }
    out.push(c);
  }

  // Keep exactly one first-listed code, first in the list.
  if (out.length && !out.some((c) => c.firstListed)) out[0] = { ...out[0], firstListed: true };
  out.sort((a, b) => Number(b.firstListed) - Number(a.firstListed));
  return { codes: out, tips: tips.filter((_, i) => keepTips.has(i)), failedReview, corrected, reviewed: true };
}
