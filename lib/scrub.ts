/**
 * Removes common identifiers from a note before it leaves the browser (and again on the server).
 * Pattern based, so it catches labeled names, honorific names, "<Name> is a 53-year-old",
 * dates, phone numbers, emails, record numbers and street addresses. It cannot catch every
 * name written in free text, which is why the page still asks people to remove identifiers.
 * No imports, so it runs in the browser and in Node.
 */
export type ScrubKind = "name" | "date" | "phone" | "email" | "id" | "address" | "age";
export type ScrubResult = { text: string; counts: Record<ScrubKind, number>; total: number };

const MONTH =
  "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
// Title-case word ("Diane", "O'Neil", "Smith-Jones"); all-caps headings like "ILLNESS" don't match.
const W = "[A-Z][a-z][a-zA-Z'\\-]*";
const SP = "[ \\t]+";
const STREET =
  "(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Place|Pl|Terrace|Ter|Parkway|Pkwy|Circle|Cir|Highway|Hwy)";
const LABELS =
  "(?:[Pp]atient(?:[ \\t]+[Nn]ame)?|PATIENT(?:[ \\t]+NAME)?|[Pp]t(?:[ \\t]+[Nn]ame)?|[Nn]ame|NAME|[Gg]uardian|[Mm]other|[Ff]ather|[Ss]pouse|[Ee]mergency[ \\t]+[Cc]ontact)";

type Rule = { kind: ScrubKind; re: RegExp; to: (match: string, ...groups: string[]) => string };

const RULES: Rule[] = [
  { kind: "email", re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, to: () => "[EMAIL]" },
  { kind: "id", re: /\bhttps?:\/\/\S+/gi, to: () => "[URL]" },
  { kind: "id", re: /\b\d{3}-\d{2}-\d{4}\b/g, to: () => "[SSN]" },
  {
    kind: "phone",
    re: /(?:\+?1[\s.-]?)?(?:\(\d{3}\)\s?|\b\d{3}[\s.-])\d{3}[\s.-]\d{4}\b/g,
    to: () => "[PHONE]",
  },
  {
    kind: "id",
    re: /\b(MRN|Medical record(?: number| no\.?)?|Acct(?:ount)?(?: number| no\.?)?|Patient ID|Member ID|Subscriber ID|Insurance ID|Policy(?: number| no\.?)?|Claim(?: number| no\.?)?)(\s*[:#]?\s*)((?=[A-Z0-9-]*\d)[A-Z0-9-]{4,})/gi,
    to: (_m, label, sep) => `${label}${sep}[ID]`,
  },
  { kind: "date", re: /\b\d{1,2}[/-]\d{1,2}[/-](?:\d{4}|\d{2})\b/g, to: () => "[DATE]" },
  { kind: "date", re: /\b\d{4}-\d{2}-\d{2}\b/g, to: () => "[DATE]" },
  { kind: "date", re: /\b(?:0?[1-9]|1[0-2])\/(?:19|20)\d{2}\b/g, to: () => "[DATE]" },
  {
    kind: "date",
    re: new RegExp(`\\b${MONTH}\\.?${SP}\\d{1,2}(?:st|nd|rd|th)?(?:,?${SP}\\d{4})?\\b`, "g"),
    to: () => "[DATE]",
  },
  {
    kind: "date",
    re: new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?${SP}(?:of${SP})?${MONTH}(?:,?${SP}\\d{4})?\\b`, "g"),
    to: () => "[DATE]",
  },
  { kind: "date", re: new RegExp(`\\b${MONTH}\\.?,?${SP}(?:19|20)\\d{2}\\b`, "g"), to: () => "[DATE]" },
  {
    kind: "address",
    re: new RegExp(`\\b\\d{1,6}${SP}(?:${W}${SP}){1,3}${STREET}\\b\\.?`, "g"),
    to: () => "[ADDRESS]",
  },
  { kind: "address", re: /\b([A-Z]{2})[ \t]+\d{5}(?:-\d{4})?\b/g, to: (_m, st) => `${st} [ZIP]` },
  {
    kind: "name",
    re: new RegExp(`\\b(Mr|Mrs|Ms|Miss|Mx|Dr)\\.?${SP}${W}(?:${SP}${W})?`, "g"),
    to: (_m, title) => `${title}. [NAME]`,
  },
  {
    kind: "name",
    re: new RegExp(`\\b(${LABELS})([ \\t]*:[ \\t]*)${W}(?:${SP}${W}){0,2}`, "g"),
    to: (_m, label, sep) => `${label}${sep}[NAME]`,
  },
  {
    // "Virginia Phillips is a pleasant 53-year-old ..."
    kind: "name",
    re: new RegExp(
      `\\b${W}(?:${SP}${W}){1,2}(?=,?${SP}(?:is|was)${SP}an?${SP}(?:[a-z]+${SP}){0,2}\\d{1,3}[- ](?:year|yr|y/o|yo)\\b)`,
      "g",
    ),
    to: () => "[NAME]",
  },
  {
    // Ages over 89 are identifiers under HIPAA Safe Harbor.
    kind: "age",
    re: /\b(?:9\d|1[01]\d)(?=[- ](?:year|yr)s?[- ]old\b|\s*(?:y\/o|yo)\b)/gi,
    to: () => "90+",
  },
];

export function scrub(input: string): ScrubResult {
  const counts: Record<ScrubKind, number> = { name: 0, date: 0, phone: 0, email: 0, id: 0, address: 0, age: 0 };
  let text = input;
  for (const rule of RULES) {
    text = text.replace(rule.re, (...args: unknown[]) => {
      counts[rule.kind]++;
      const groups = args.slice(1, -2).map((g) => (typeof g === "string" ? g : ""));
      return rule.to(String(args[0]), ...groups);
    });
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { text, counts, total };
}

const LABEL: Record<ScrubKind, [string, string]> = {
  name: ["name", "names"],
  date: ["date", "dates"],
  phone: ["phone number", "phone numbers"],
  email: ["email", "emails"],
  id: ["ID number", "ID numbers"],
  address: ["address", "addresses"],
  age: ["age over 89", "ages over 89"],
};

/** "2 names and 3 dates" */
export function describeCounts(counts: Record<ScrubKind, number>): string {
  const parts = (Object.keys(counts) as ScrubKind[])
    .filter((k) => counts[k] > 0)
    .map((k) => `${counts[k]} ${LABEL[k][counts[k] === 1 ? 0 : 1]}`);
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}
