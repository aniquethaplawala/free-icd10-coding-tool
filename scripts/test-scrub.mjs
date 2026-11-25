// Quick checks for lib/scrub.ts. Run: npm run test:scrub
// Node 24 strips TypeScript types natively, so the .ts module imports directly.
import assert from "node:assert/strict";
import { scrub } from "../lib/scrub.ts";

const cases = [
  ["Ms. Diane Baker is a 28-year-old female", "Ms. [NAME] is a 28-year-old female", { name: 1 }],
  ["Virginia Phillips is a pleasant 53-year-old female", "[NAME] is a pleasant 53-year-old female", { name: 1 }],
  ["Patient: John Smith\nDOB: 03/04/1950", "Patient: [NAME]\nDOB: [DATE]", { name: 1, date: 1 }],
  ["MRN: 00123456, call 415-555-0199 or jane@example.com", "MRN: [ID], call [PHONE] or [EMAIL]", { id: 1, phone: 1, email: 1 }],
  ["Seen on March 3, 2026 and 12/2019.", "Seen on [DATE] and [DATE].", { date: 2 }],
  ["Lives at 42 Oak Street, Austin TX 78701.", "Lives at [ADDRESS], Austin TX [ZIP].", { address: 2 }],
  ["A 94-year-old man", "A 90+-year-old man", { age: 1 }],
  // Things that must survive: vitals, doses, codes, years, headings.
  ["BP 120/80, HR 72, metformin 500 mg, 99214, hysterectomy in 1996.", null, {}],
  ["HISTORY OF PRESENT ILLNESS\nPatient reports knee pain. May follow up.", null, {}],
];

let failed = 0;
for (const [input, expected, counts] of cases) {
  const out = scrub(input);
  try {
    assert.equal(out.text, expected ?? input);
    for (const [k, v] of Object.entries(counts)) assert.equal(out.counts[k], v, `${k} count`);
    if (!Object.keys(counts).length) assert.equal(out.total, 0, "nothing should be removed");
    console.log("ok  ", JSON.stringify(input).slice(0, 70));
  } catch (e) {
    failed++;
    console.log("FAIL", JSON.stringify(input), "\n   got:", JSON.stringify(out.text), out.counts, "\n  ", e.message);
  }
}
process.exit(failed ? 1 : 0);
