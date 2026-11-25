import { ImageResponse } from "next/og";
import { TOOL } from "@/lib/config";

export const alt = `${TOOL.name}: turn a visit note into ICD-10 codes`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const chips = ["E11.9", "Z79.84", "M25.561", "I10"];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#faf8f5",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#72706b" }}>{TOOL.name}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", fontSize: 66, lineHeight: 1.1, color: "#27251e", maxWidth: 900 }}>{TOOL.headline}</div>
          <div style={{ display: "flex", gap: 14 }}>
            {chips.map((c) => (
              <div
                key={c}
                style={{
                  display: "flex",
                  fontSize: 32,
                  padding: "8px 20px",
                  border: "2px solid #d1d1cd",
                  borderRadius: 12,
                  background: "#fdfbfa",
                  color: "#27251e",
                }}
              >
                {c}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#72706b" }}>
          Free. No sign-up. Every code checked against the official FY2027 list.
        </div>
      </div>
    ),
    size,
  );
}
