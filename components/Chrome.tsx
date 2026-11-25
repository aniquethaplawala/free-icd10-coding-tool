import Link from "next/link";
import { NoteMark } from "@/components/icons";
import { CODE_SET_DETAIL, OPERATOR, REPO_URL, TOOL } from "@/lib/config";

export function TopBar() {
  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <NoteMark />
        {TOOL.shortName}
      </Link>
      <nav className="toplinks" aria-label="Site">
        <a href="/#how">How it works</a>
        <Link href="/privacy">Privacy</Link>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <div>
          © {new Date().getFullYear()} {OPERATOR}. Suggestions to review, not billing or medical advice.
        </div>
        <div>ICD-10-CM codes from the {CODE_SET_DETAIL}.</div>
      </div>
      <nav aria-label="Legal">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        {REPO_URL && <a href={REPO_URL}>Source code</a>}
      </nav>
    </footer>
  );
}
