import { Footer, TopBar } from "@/components/Chrome";
import {
  CLAIM_HIPAA,
  CLAIM_ZERO_RETENTION,
  CONTACT_EMAIL,
  OPERATOR,
  REPO_URL,
  SITE_URL,
  TOOL,
} from "@/lib/config";
import { Tool } from "./tool";

const DEPLOY_URL = `https://vercel.com/new/clone?repository-url=${encodeURIComponent(REPO_URL)}&env=SULLY_ACCOUNT_ID,SULLY_API_KEY`;

const STEPS = [
  { title: "Paste a note", body: "Any visit note or discharge summary, up to 20,000 characters." },
  {
    title: "Identifiers come out first",
    body: "Your browser removes names, dates, phone numbers and record numbers before anything is sent.",
  },
  {
    title: "A clinical model reads it",
    body: "A model trained for clinical work suggests codes and quotes the line that supports each one.",
  },
  {
    title: "Every code is checked",
    body: "Any code that isn't on the official FY2027 ICD-10-CM list, or isn't backed by the note, is held back.",
  },
];

function faq() {
  return [
    { q: "Is it free?", a: "Yes. There's no sign-up. A daily limit keeps it free for everyone." },
    {
      q: "Do you keep my note?",
      a: CLAIM_ZERO_RETENTION
        ? "No. Your note goes to the model, the codes come back, and nothing is saved. We don't log note text, and the page keeps no history."
        : "This page doesn't save your note or keep a history. Until our no-retention setup is signed off, please remove patient identifiers before you paste. Your browser also strips common ones before sending.",
    },
    {
      q: "Is it HIPAA compliant?",
      a: CLAIM_HIPAA
        ? `Yes. ${OPERATOR} signs a Business Associate Agreement (BAA) with covered entities, and every service that handles your note is covered by one. Email ${CONTACT_EMAIL} to sign.`
        : "Our setup for full patient records is in review. Until then, remove names, dates and record numbers before you paste.",
    },
    {
      q: "Which codes does it suggest?",
      a: "ICD-10-CM diagnosis codes from the FY2027 release published by CMS. Each suggestion is checked against that list, and any code that isn't on it is held back.",
    },
    {
      q: "Can I bill from these codes?",
      a: "Treat them as suggestions. A certified coder or the treating clinician should check every code against the note and the official guidelines before billing.",
    },
  ];
}

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: TOOL.name,
    url: SITE_URL,
    applicationCategory: "MedicalApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: TOOL.subhead,
  };

  return (
    <>
      <TopBar />
      <main className="page">
        <section className="hero">
          <h1>
            {TOOL.headline.split("ICD-10").flatMap((part, i) =>
              i === 0 ? [part] : [<span key={i} style={{ whiteSpace: "nowrap" }}>ICD-10</span>, part],
            )}
          </h1>
          <p className="lede">{TOOL.subhead}</p>
        </section>

        <Tool claimZeroRetention={CLAIM_ZERO_RETENTION} claimHipaa={CLAIM_HIPAA} />

        <section className="section" id="how" aria-labelledby="how-h">
          <h2 id="how-h">How it works</h2>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="step">
                <span className="step-n">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" aria-labelledby="faq-h">
          <h2 id="faq-h">Questions</h2>
          <div className="faq">
            {faq().map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="open-h">
          <h2 id="open-h">Open source. Build your own.</h2>
          <p>
            The whole tool is open source: the identifier scrubber, the prompts and the check against the official code list.
            Fork it, change it, or deploy your own copy in one click with your own model key.
          </p>
          <div className="actions">
            <a className="btn-ghost" href={REPO_URL} target="_blank" rel="noopener">
              View the code on GitHub
            </a>
            <a className="btn-ghost" href={DEPLOY_URL} target="_blank" rel="noopener">
              Deploy your own copy
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
