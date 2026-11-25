import type { Metadata } from "next";
import { Footer, TopBar } from "@/components/Chrome";
import { CLAIM_HIPAA, CONTACT_EMAIL, OPERATOR, TOOL } from "@/lib/config";

export const metadata: Metadata = { title: `Privacy | ${TOOL.name}` };

export default function Privacy() {
  return (
    <>
      <TopBar />
      <main className="doc">
        <h1>Privacy</h1>
        <p>
          {TOOL.name} is run by {OPERATOR}. This page explains what happens to a note you paste.
        </p>

        <h2>What happens to your note</h2>
        <ul>
          <li>Your browser removes common identifiers (names, dates, phone numbers, emails, record numbers and addresses) before sending.</li>
          <li>The cleaned note goes over an encrypted connection to our server, which sends it to a clinical AI model to suggest codes.</li>
          <li>The codes come back to your browser. Our server does not write the note or the codes to a database, a file or a log.</li>
          <li>The page keeps no history. Close or reload it and the note is gone from your screen.</li>
        </ul>

        <h2>What we do keep</h2>
        <ul>
          <li>A count of how many requests the tool handled each day, so we can enforce a daily limit.</li>
          <li>Your IP address, held in server memory for up to 10 minutes to stop abuse. It is never written down.</li>
          <li>Short-lived request records kept by our hosting provider, such as time, page address, IP address and status code. These never include note text.</li>
        </ul>

        <h2>Cookies and tracking</h2>
        <p>This tool sets no cookies and runs no analytics, ads or session recording.</p>

        <h2>Who handles your note</h2>
        <ul>
          <li>Hosting: Vercel, in the United States.</li>
          <li>Model: a clinical AI model, through its provider&apos;s API, in the United States.</li>
        </ul>

        <h2>HIPAA</h2>
        <p>
          {CLAIM_HIPAA
            ? `${OPERATOR} signs a Business Associate Agreement (BAA) with covered entities and business associates. Every service that handles your note is covered by a BAA. Email ${CONTACT_EMAIL} to sign one.`
            : "Our setup for protected health information is in review. Until it is signed off, please remove identifiers before you paste a note."}
        </p>

        <h2>Contact</h2>
        <p>{CONTACT_EMAIL ? `Questions about privacy: ${CONTACT_EMAIL}.` : "Questions about privacy: open an issue on the GitHub repo."}</p>
      </main>
      <Footer />
    </>
  );
}
