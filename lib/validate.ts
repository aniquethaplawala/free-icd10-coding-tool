/**
 * Turns M1's JSON into what the page shows. Nothing reaches the user unless:
 *  - the code exists in the official FY2027 ICD-10-CM table, and
 *  - the evidence quote can be found in the note that was sent.
 * Descriptions always come from the CMS table, never from the model.
 */
import { billableUnder, lookup } from "./icd10";
import type { CodeOption, Confidence, DocTip, Dropped, SuggestedCode, VisitLevel } from "./types";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[*_`#>"“”‘’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function words(s: string): string[] {
  return normalize(s)
    .split(/[^a-z0-9.%/]+/)
    .filter((w) => w.length > 3);
}

/** "exact" if the quote is in the note, "close" if at least 80% of its longer words are. */
export function matchEvidence(evidence: string, note: string): "exact" | "close" | null {
  const e = normalize(evidence);
  if (!e) return null;
  const n = normalize(note);
  if (n.includes(e)) return "exact";
  const ew = words(evidence);
  if (ew.length < 2) return null;
  const nw = new Set(words(note));
  const hits = ew.filter((w) => nw.has(w)).length;
  return hits / ew.length >= 0.8 ? "close" : null;
}

const ROMAN: Record<string, string> = { I: "1", II: "2", III: "3", IV: "4", V: "5" };

/**
 * Catches a class of model slips the review pass can miss: the code's official description
 * names a week count, a stage or a weight range that the supporting quote doesn't contain
 * (e.g. "31 completed weeks" against a note that says 34+3 weeks).
 */
export function numberWarning(description: string, evidence: string): string | undefined {
  const ev = evidence.replace(/\b(IV|V|III|II|I)\b/g, (m) => ROMAN[m] ?? m);
  const has = (n: string) => new RegExp(`(^|[^0-9])${n}([^0-9]|$)`).test(ev);
  const weeks = description.match(/(\d+) completed weeks/);
  if (weeks && !has(weeks[1])) return `The code says ${weeks[1]} weeks. Check the number in the note.`;
  const stage = description.match(/\bstage (\d)\b/i);
  if (stage && !has(stage[1]) && /stage/i.test(ev)) return `The code says stage ${stage[1]}. Check the stage in the note.`;
  const grams = description.match(/(\d{3,4})-(\d{3,4}) grams/);
  const noted = ev.match(/(\d{3,4})\s*(?:g|grams)\b/);
  if (grams && noted && (Number(noted[1]) < Number(grams[1]) || Number(noted[1]) > Number(grams[2]))) {
    return `The code covers ${grams[1]}-${grams[2]} grams. Check the weight in the note.`;
  }
  return undefined;
}

function parseJson(content: string): Record<string, unknown> {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error("model_returned_non_json");
  }
}

const asConfidence = (v: unknown): Confidence =>
  v === "high" || v === "medium" || v === "low" ? v : "low";

const option = (code: string): CodeOption | null => {
  const hit = lookup(code);
  return hit && hit.billable ? { code: hit.code, description: hit.description } : null;
};

// Office or outpatient E/M. The server picks the code from the documented decision making
// (or total time, when that gives a higher level), so the model never chooses a number.
const EM_BY_MDM = {
  new: { straightforward: "99202", low: "99203", moderate: "99204", high: "99205" },
  established: { straightforward: "99212", low: "99213", moderate: "99214", high: "99215" },
} as const;
const EM_BY_TIME = {
  new: [
    [60, "99205"],
    [45, "99204"],
    [30, "99203"],
    [15, "99202"],
  ],
  established: [
    [40, "99215"],
    [30, "99214"],
    [20, "99213"],
    [10, "99212"],
  ],
} as const;

function visitLevelFrom(raw: unknown, note: string): VisitLevel | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const v = raw as Record<string, unknown>;
  const mdm = ["straightforward", "low", "moderate", "high"].includes(String(v.mdm))
    ? (String(v.mdm) as VisitLevel["mdm"])
    : null;
  if (!mdm) return undefined;
  const patient = v.patient === "new" ? "new" : v.patient === "established" ? "established" : "unknown";
  const table = patient === "new" ? "new" : "established";
  let code: string = EM_BY_MDM[table][mdm];
  let basis: VisitLevel["basis"] = "decision making";
  const minutes = typeof v.total_minutes === "number" && v.total_minutes > 0 ? Math.round(v.total_minutes) : null;
  if (minutes !== null) {
    const byTime = EM_BY_TIME[table].find(([min]) => minutes >= min)?.[1];
    if (byTime && byTime > code) {
      code = byTime;
      basis = "time";
    }
  }
  const evidence = String(v.evidence ?? "").trim();
  return {
    code,
    patient,
    mdm,
    basis,
    minutes,
    reason: String(v.reason ?? "").trim().slice(0, 400),
    evidence: evidence && matchEvidence(evidence, note) ? evidence : undefined,
  };
}

export function parseAndValidate(
  content: string,
  note: string,
  opts: { includeVisitLevel: boolean },
): { codes: SuggestedCode[]; tips: DocTip[]; visitLevel?: VisitLevel; dropped: Dropped } {
  const parsed = parseJson(content);
  const rawCodes = Array.isArray(parsed.codes) ? parsed.codes : [];
  const dropped: Dropped = { notInCodeSet: [], noSupportingText: 0, failedReview: 0, corrected: 0, reviewed: false };
  const seen = new Set<string>();
  const codes: SuggestedCode[] = [];

  for (const item of rawCodes.slice(0, 20)) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const asked = String(r.code ?? "").trim();
    if (!asked) continue;
    const hit = lookup(asked);
    if (!hit) {
      dropped.notInCodeSet.push(asked.toUpperCase().slice(0, 10));
      continue;
    }
    if (seen.has(hit.code)) continue;
    const evidence = String(r.evidence ?? "").trim();
    const match = matchEvidence(evidence, note);
    if (!match) {
      dropped.noSupportingText++;
      continue;
    }
    seen.add(hit.code);
    codes.push({
      code: hit.code,
      description: hit.description,
      billable: hit.billable,
      options: hit.billable ? undefined : billableUnder(hit.code, 6).map((e) => ({ code: e.code, description: e.description })),
      evidence: evidence.slice(0, 300),
      evidenceMatch: match,
      confidence: asConfidence(r.confidence),
      firstListed: r.first_listed === true,
    });
  }

  // Exactly one first-listed code, and it goes first.
  const firstIndex = codes.findIndex((c) => c.firstListed);
  codes.forEach((c, i) => (c.firstListed = i === (firstIndex >= 0 ? firstIndex : 0)));
  codes.sort((a, b) => Number(b.firstListed) - Number(a.firstListed));

  const tips: DocTip[] = [];
  for (const item of (Array.isArray(parsed.tips) ? parsed.tips : []).slice(0, 4)) {
    if (!item || typeof item !== "object") continue;
    const t = item as Record<string, unknown>;
    const tip = String(t.tip ?? "").trim();
    if (!tip) continue;
    // A tip that names a code that doesn't exist (e.g. "S83.41XA") is dropped whole.
    const named = tip.match(/\b[A-TV-Z]\d[0-9A-Z]\.[0-9A-Z]{1,4}\b/g) ?? [];
    if (named.some((code) => !lookup(code))) continue;
    const current = t.current_code ? lookup(String(t.current_code)) : null;
    const moreSpecific = (Array.isArray(t.more_specific_codes) ? t.more_specific_codes : [])
      .map((c) => option(String(c)))
      .filter((c): c is CodeOption => c !== null)
      .slice(0, 4);
    tips.push({ tip: tip.slice(0, 300), currentCode: current?.code, moreSpecific });
  }

  const visitLevel = opts.includeVisitLevel ? visitLevelFrom(parsed.visit_level, note) : undefined;
  return { codes, tips, visitLevel, dropped };
}
