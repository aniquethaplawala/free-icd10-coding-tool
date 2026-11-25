/**
 * Everything brand- or claim-related lives here, so renaming the tool or turning a claim on
 * is a one-line change. NEXT_PUBLIC_* values are inlined at build time.
 */
export const TOOL = {
  name: "Free ICD-10 Coding Tool",
  shortName: "Free ICD-10 Coding Tool",
  headline: "Turn a visit note into ICD-10 codes",
  subhead:
    "Paste a clinical note. Get suggested diagnosis codes, each with the line from the note that supports it.",
  utmSource: "code-this-note",
};

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://free-icd10-coding-tool.vercel.app";
export const INDEXABLE = process.env.NEXT_PUBLIC_INDEXABLE === "true";

// Leave these off until each claim is true. README: "Before you turn a claim on".
export const CLAIM_ZERO_RETENTION = process.env.NEXT_PUBLIC_CLAIM_ZERO_RETENTION === "true";
export const CLAIM_HIPAA = process.env.NEXT_PUBLIC_CLAIM_HIPAA === "true";

export const OPERATOR = process.env.NEXT_PUBLIC_OPERATOR_NAME || "Free ICD-10 Coding Tool";
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";
export const REPO_URL = process.env.NEXT_PUBLIC_REPO_URL || "https://github.com/aniquethaplawala/free-icd10-coding-tool";

const utm = (medium: string) =>
  `utm_source=${TOOL.utmSource}&utm_medium=${medium}&utm_campaign=one-shot-tools`;

/** The badge and the in-page builder link both point at the API page, tagged so signups can be traced. */
export const SULLY_BADGE_URL = `https://www.sully.ai/api?${utm("badge")}`;
export const SULLY_BUILD_URL = `https://www.sully.ai/api?${utm("build-section")}`;
export const SULLY_DOCS_URL = "https://docs.sully.ai";

export const CODE_SET_LABEL = "FY2027 ICD-10-CM";
export const CODE_SET_DETAIL = "CMS FY2027 release, in effect from October 1, 2026";
