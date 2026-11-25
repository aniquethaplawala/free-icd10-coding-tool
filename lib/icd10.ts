/**
 * Official FY2027 ICD-10-CM code table (CMS order file), built by scripts/build-icd10.mjs.
 * Server only. Every code the model suggests is checked here before anyone sees it.
 */
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import path from "node:path";

export type IcdEntry = { code: string; billable: boolean; description: string };

let table: Map<string, IcdEntry> | null = null;
let sortedKeys: string[] = [];

export function undotted(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function dotted(raw: string): string {
  return raw.length > 3 ? `${raw.slice(0, 3)}.${raw.slice(3)}` : raw;
}

function load(): Map<string, IcdEntry> {
  if (table) return table;
  const file = path.join(process.cwd(), "data", "icd10cm-2027.tsv.gz");
  const text = gunzipSync(readFileSync(file)).toString("utf8");
  const map = new Map<string, IcdEntry>();
  for (const line of text.split("\n")) {
    if (!line) continue;
    const [raw, flag, description] = line.split("\t");
    map.set(raw, { code: dotted(raw), billable: flag === "1", description });
  }
  sortedKeys = [...map.keys()].sort();
  table = map;
  return map;
}

export function lookup(code: string): IcdEntry | null {
  return load().get(undotted(code)) ?? null;
}

/** Billable codes under a header code, e.g. M25.56 gives M25.561, M25.562, M25.569. */
export function billableUnder(code: string, limit = 8): IcdEntry[] {
  const map = load();
  const prefix = undotted(code);
  let lo = 0;
  let hi = sortedKeys.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sortedKeys[mid] < prefix) lo = mid + 1;
    else hi = mid;
  }
  const out: IcdEntry[] = [];
  for (let i = lo; i < sortedKeys.length && sortedKeys[i].startsWith(prefix); i++) {
    const entry = map.get(sortedKeys[i])!;
    if (entry.billable && sortedKeys[i] !== prefix) out.push(entry);
    if (out.length >= limit) break;
  }
  return out;
}
