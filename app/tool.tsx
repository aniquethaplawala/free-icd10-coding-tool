"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, CheckIcon, CopyIcon, ListCheckIcon, LockIcon, ResetIcon, ShieldIcon, SparkIcon } from "@/components/icons";
import { describeCounts, scrub, type ScrubResult } from "@/lib/scrub";
import { SAMPLE_CREDIT, SAMPLE_NOTE } from "@/lib/sample";
import type { Dropped, SuggestResponse, SuggestedCode } from "@/lib/types";

type Status = "idle" | "loading" | "done" | "error";

function checksNote(d: Dropped): string {
  const held = d.notInCodeSet.length + d.noSupportingText + d.failedReview;
  const parts: string[] = [];
  if (held) parts.push(`held back ${held} ${held === 1 ? "suggestion" : "suggestions"} that didn't pass our checks`);
  if (d.corrected) parts.push(`corrected ${d.corrected} ${d.corrected === 1 ? "code" : "codes"} on a second review`);
  if (parts.length) return `We ${parts.join(" and ")}.`;
  return d.reviewed ? "Every suggestion passed the code-list check and a second review." : "";
}
type Setting = "outpatient" | "inpatient";

const MIN_CHARS = 40;
const MAX_CHARS = 20_000;

const CONFIDENCE: Record<SuggestedCode["confidence"], string> = {
  high: "Strong",
  medium: "Likely",
  low: "Check this",
};
const MDM: Record<string, string> = {
  straightforward: "Straightforward",
  low: "Low complexity",
  moderate: "Moderate complexity",
  high: "High complexity",
};

export function Tool({ claimZeroRetention, claimHipaa }: { claimZeroRetention: boolean; claimHipaa: boolean }) {
  const [note, setNote] = useState("");
  const [setting, setSetting] = useState<Setting>("outpatient");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<SuggestResponse | null>(null);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<ScrubResult | null>(null);
  const [usedSample, setUsedSample] = useState(false);
  const [copied, setCopied] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);

  // Live preview of what will be removed before sending.
  const preview = useMemo(() => scrub(note), [note]);
  const tooShort = note.trim().length < MIN_CHARS;
  const tooLong = note.length > MAX_CHARS;

  useEffect(() => {
    if (status === "done" || status === "error") {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status]);

  async function submit() {
    if (status === "loading" || tooShort || tooLong) return;
    const cleaned = scrub(note);
    setSent(cleaned);
    setStatus("loading");
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: cleaned.text, setting }),
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string })?.error || "We couldn't get codes for that note. Try again.");
      setResult(data as SuggestResponse);
      setStatus("done");
    } catch (e) {
      const msg = e instanceof Error && !/fetch|network/i.test(e.message) ? e.message : "We couldn't reach the server. Check your connection and try again.";
      setError(msg);
      setStatus("error");
    }
  }

  function reset() {
    setNote("");
    setResult(null);
    setSent(null);
    setError("");
    setStatus("idle");
    setUsedSample(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((k) => (k === key ? "" : k)), 1500);
    } catch {
      // Clipboard blocked; nothing else to do.
    }
  }

  const allCodesText = result?.codes.map((c) => `${c.code}\t${c.description}`).join("\n") ?? "";

  return (
    <>
      <div className="composer">
        <label htmlFor="note" className="sr-only">
          Clinical note
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (usedSample) setUsedSample(false);
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Paste a visit note or discharge summary…"
          spellCheck={false}
          autoComplete="off"
          maxLength={MAX_CHARS + 2000}
        />
        <div className="composer-bar">
          <div className="seg" role="group" aria-label="Care setting">
            {(["outpatient", "inpatient"] as const).map((s) => (
              <button key={s} type="button" aria-pressed={setting === s} onClick={() => setSetting(s)}>
                {s === "outpatient" ? "Outpatient" : "Inpatient"}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="chip"
            onClick={() => {
              setNote(SAMPLE_NOTE);
              setSetting("outpatient");
              setUsedSample(true);
            }}
          >
            <SparkIcon />
            Try a sample note
          </button>
          <span className="spacer" />
          <span className={`count${tooLong ? " over" : ""}`}>
            {note.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
          <span className="kbd">⌘ Enter</span>
          <button type="button" className="btn-primary" onClick={submit} disabled={status === "loading" || tooShort || tooLong}>
            {status === "loading" ? "Reading…" : "Get codes"}
            <ArrowUp />
          </button>
        </div>
      </div>

      <div className="under">
        <div className="trust">
          <span>
            <LockIcon />
            {claimZeroRetention ? "Zero data retention. Nothing you paste is saved." : "This page saves nothing and keeps no history."}
          </span>
          <span>
            <ShieldIcon />
            {claimHipaa ? "HIPAA compliant. We sign BAAs." : "Remove patient identifiers first. We strip common ones in your browser."}
          </span>
          <span>
            <ListCheckIcon />
            Every code checked against the official FY2027 list
          </span>
          <span>Free, no sign-up</span>
        </div>
        {preview.total > 0 && status !== "loading" && (
          <p className="pending" aria-live="polite">
            We&apos;ll remove {describeCounts(preview.counts)} before sending.
          </p>
        )}
        {usedSample && <p className="credit">{SAMPLE_CREDIT}</p>}
      </div>

      <div ref={resultsRef} className="results" aria-live="polite" aria-busy={status === "loading"}>
        {status === "loading" && (
          <div className="card">
            <p className="card-sub" style={{ margin: "0 0 12px" }}>
              Reading the note and checking every code against the FY2027 list…
            </p>
            <div className="sk">
              <div className="sk-row" />
              <div className="sk-row" />
              <div className="sk-row" />
            </div>
          </div>
        )}

        {status === "error" && <div className="error">{error}</div>}

        {status === "done" && result && (
          <>
            <div className="meta">
              <span>
                {result.codes.length} {result.codes.length === 1 ? "code" : "codes"}
              </span>
              <span>{(result.ms / 1000).toFixed(1)} s</span>
              <span>{result.codeSet}</span>
              <span>{result.setting === "outpatient" ? "Outpatient rules" : "Inpatient rules"}</span>
            </div>

            {sent && (
              <details className="notice sent">
                <summary>
                  {sent.total > 0
                    ? `We removed ${describeCounts(sent.counts)} before sending. See exactly what we sent.`
                    : "We found no identifiers to remove. See exactly what we sent."}
                </summary>
                <pre>{sent.text}</pre>
              </details>
            )}

            <section className="card" aria-labelledby="codes-h">
              <div className="card-head">
                <div>
                  <h2 id="codes-h">Suggested ICD-10-CM codes</h2>
                  <p className="card-sub">Main reason for the visit first. Each one quotes the note.</p>
                </div>
                {result.codes.length > 0 && (
                  <button type="button" className="btn-ghost" onClick={() => copy(allCodesText, "__all")}>
                    {copied === "__all" ? <CheckIcon /> : <CopyIcon />}
                    {copied === "__all" ? "Copied" : "Copy all"}
                  </button>
                )}
              </div>
              {result.codes.length === 0 ? (
                <p className="fine" style={{ marginTop: 8 }}>
                  We couldn&apos;t find anything to code in that note. Try a fuller note with an assessment and a plan.
                </p>
              ) : (
                <ul className="codes">
                  {result.codes.map((c) => (
                    <li key={c.code} className="code-row">
                      <span className="code">{c.code}</span>
                      <div className="body">
                        <div className="desc">
                          {c.description}
                          {c.firstListed && <span className="tag">First-listed</span>}
                          {!c.billable && <span className="tag tag-outline">Needs more detail</span>}
                        </div>
                        <p className="evidence">
                          <b>From the note:</b> “{c.evidence}”
                        </p>
                        {c.warning && <p className="warning">{c.warning}</p>}
                        {!c.billable && c.options && c.options.length > 0 && (
                          <div className="options">
                            <p>This is a category, not a billable code. Pick the one the note supports:</p>
                            <ul>
                              {c.options.map((o) => (
                                <li key={o.code}>
                                  <button type="button" className="option" onClick={() => copy(o.code, o.code)} title={`Copy ${o.code}`}>
                                    <span className="code code-sm">{o.code}</span>
                                    <span>{copied === o.code ? "Copied" : o.description}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="side">
                        <span className={`conf conf-${c.confidence}`} title="How strongly the note supports this code">
                          {CONFIDENCE[c.confidence]}
                        </span>
                        <button type="button" className="icon-btn" aria-label={`Copy ${c.code}`} onClick={() => copy(c.code, c.code)}>
                          {copied === c.code ? <CheckIcon /> : <CopyIcon />}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {result.visitLevel && (
              <section className="card" aria-labelledby="visit-h">
                <h2 id="visit-h">Visit level</h2>
                <div className="visit">
                  <span className="code code-lg">{result.visitLevel.code}</span>
                  <div>
                    <p>
                      {MDM[result.visitLevel.mdm]} ·{" "}
                      {result.visitLevel.patient === "new"
                        ? "New patient"
                        : result.visitLevel.patient === "established"
                          ? "Established patient"
                          : "Assumed established patient"}{" "}
                      · Based on {result.visitLevel.basis}
                      {result.visitLevel.basis === "time" && result.visitLevel.minutes ? ` (${result.visitLevel.minutes} min)` : ""}
                    </p>
                    {result.visitLevel.reason && <p className="evidence">{result.visitLevel.reason}</p>}
                  </div>
                </div>
              </section>
            )}

            {result.tips.length > 0 && (
              <section className="card" aria-labelledby="tips-h">
                <h2 id="tips-h">Documentation tips</h2>
                <p className="card-sub">Details that would allow a more specific code, if they are true.</p>
                <ul className="tips">
                  {result.tips.map((t, i) => (
                    <li key={i}>
                      {t.tip}
                      {t.moreSpecific.length > 0 && (
                        <div className="codes-inline">
                          {t.moreSpecific.map((o) => (
                            <span key={o.code} className="code code-sm" title={o.description}>
                              {o.code}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {checksNote(result.dropped) && (
              <p
                className="notice"
                title={
                  result.dropped.notInCodeSet.length
                    ? `Not on the FY2027 list: ${result.dropped.notInCodeSet.join(", ")}`
                    : undefined
                }
              >
                {checksNote(result.dropped)}
              </p>
            )}

            <div className="actions">
              <button type="button" className="btn-ghost" onClick={reset}>
                <ResetIcon />
                Start over
              </button>
            </div>
            <p className="fine">
              Suggestions to review, not final codes. A certified coder or the treating clinician should check every code
              against the note and the official guidelines before billing.
            </p>
          </>
        )}
      </div>
    </>
  );
}
