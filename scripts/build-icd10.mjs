// Builds data/icd10cm-2027.tsv.gz from the CMS "Code Descriptions in Tabular Order" order file.
// Source: https://www.cms.gov/medicare/coding-billing/icd-10-codes (2027 Code Descriptions in Tabular Order, ZIP)
// Usage: node scripts/build-icd10.mjs "/path/to/icd10cm_order_2027.txt"
//
// Order file layout (1-indexed columns, per CMS icd10OrderFiles.pdf):
//   1-5 order number, 7-13 code (no dot), 15 header flag (1 = valid for HIPAA transactions, 0 = header),
//   17-76 short description, 78-end long description.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const src = process.argv[2];
if (!src) {
  console.error('Pass the path to icd10cm_order_2027.txt, e.g. node scripts/build-icd10.mjs "./icd10cm_order_2027.txt"');
  process.exit(1);
}

const rows = [];
let billable = 0;
for (const rawLine of readFileSync(src, "utf8").split("\n")) {
  const line = rawLine.replace(/\r$/, "");
  if (line.length < 18) continue;
  const code = line.slice(6, 13).trim();
  const flag = line.charAt(14);
  const description = line.slice(77).trim();
  if (!/^[A-Z][0-9A-Z]{2,6}$/.test(code) || (flag !== "0" && flag !== "1") || !description) continue;
  if (flag === "1") billable++;
  rows.push(`${code}\t${flag}\t${description}`);
}

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "icd10cm-2027.tsv.gz");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, gzipSync(rows.join("\n") + "\n", { level: 9 }));
console.log(`Wrote ${rows.length} codes (${billable} billable) to ${out}`);
