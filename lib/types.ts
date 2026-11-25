export type Confidence = "high" | "medium" | "low";

export type CodeOption = { code: string; description: string };

export type SuggestedCode = {
  code: string;
  /** Official CMS description, not the model's wording. */
  description: string;
  billable: boolean;
  /** Billable codes under a header code, when the model stopped one level too early. */
  options?: CodeOption[];
  evidence: string;
  evidenceMatch: "exact" | "close";
  confidence: Confidence;
  firstListed: boolean;
  /** Set when a deterministic check disagrees with the model (shown under the quote). */
  warning?: string;
};

export type DocTip = { tip: string; currentCode?: string; moreSpecific: CodeOption[] };

export type VisitLevel = {
  code: string;
  patient: "new" | "established" | "unknown";
  mdm: "straightforward" | "low" | "moderate" | "high";
  basis: "decision making" | "time";
  minutes: number | null;
  reason: string;
  evidence?: string;
};

export type Dropped = {
  notInCodeSet: string[];
  noSupportingText: number;
  /** Held back by the second (audit) pass. */
  failedReview: number;
  /** Swapped for a better-fitting code by the second pass. */
  corrected: number;
  reviewed: boolean;
};

export type SuggestResponse = {
  codes: SuggestedCode[];
  tips: DocTip[];
  visitLevel?: VisitLevel;
  dropped: Dropped;
  setting: "outpatient" | "inpatient";
  ms: number;
  codeSet: string;
};
