import type { Metadata } from "next";
import { Footer, TopBar } from "@/components/Chrome";
import { CODE_SET_DETAIL, CONTACT_EMAIL, OPERATOR, TOOL } from "@/lib/config";

export const metadata: Metadata = { title: `Terms | ${TOOL.name}` };

export default function Terms() {
  return (
    <>
      <TopBar />
      <main className="doc">
        <h1>Terms</h1>
        <p>
          By using {TOOL.name} you agree to these terms. {TOOL.name} is run by {OPERATOR}.
        </p>

        <h2>Suggestions, not decisions</h2>
        <p>
          The tool suggests ICD-10-CM codes from the text you give it. Suggestions can be wrong or incomplete. You are
          responsible for checking every code against the medical record and the official coding guidelines before you use it
          on a claim. The tool does not give medical, legal or billing advice.
        </p>

        <h2>Fair use</h2>
        <p>
          Don&apos;t use the tool to send bulk or automated requests, to get around its limits, or to send content that is
          not a clinical note. We may block traffic that does.
        </p>

        <h2>Code sets</h2>
        <p>ICD-10-CM codes and descriptions come from the {CODE_SET_DETAIL}, published by CMS and the CDC.</p>

        <h2>No warranty</h2>
        <p>
          The tool is provided as is, without warranties of any kind. To the extent the law allows, {OPERATOR} is not liable
          for losses that come from using it.
        </p>

        <h2>Contact</h2>
        <p>{CONTACT_EMAIL || "Open an issue on the GitHub repo."}</p>
      </main>
      <Footer />
    </>
  );
}
