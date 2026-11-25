import { SULLY_BADGE_URL } from "@/lib/config";

/**
 * The only Sully branding on the page, fixed bottom right (the Framer / Webflow badge pattern).
 * Brand anchor text only: keyword anchors in a sitewide badge read as a link scheme to Google.
 */
export function PoweredBySully() {
  return (
    <a
      className="powered"
      href={SULLY_BADGE_URL}
      target="_blank"
      rel="noopener"
      aria-label="Powered by Sully. Opens the Sully API page."
    >
      <span>Powered by</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sully-wordmark.svg" alt="Sully" width={24} height={12} />
    </a>
  );
}
