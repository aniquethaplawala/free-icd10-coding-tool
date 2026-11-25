import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PoweredBySully } from "@/components/PoweredBySully";
import { INDEXABLE, SITE_URL, TOOL } from "@/lib/config";
import "./globals.css";

// next/font self-hosts the font at build time, so pages make no runtime requests to Google.
const inter = Inter({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-inter", display: "swap" });

const title = `${TOOL.name}: free ICD-10 codes from a visit note`;
const description =
  "Paste a clinical note and get ICD-10-CM code suggestions, each backed by a quote from the note and checked against the official FY2027 code list. Free, no sign-up.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  alternates: { canonical: "/" },
  robots: INDEXABLE ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { title, description, type: "website", url: "/", siteName: TOOL.name },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = { themeColor: "#faf8f5", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <PoweredBySully />
      </body>
    </html>
  );
}
