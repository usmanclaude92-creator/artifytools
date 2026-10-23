import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config";
import { OgBrand, ogMark } from "@/lib/brand-og";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const mark = await ogMark();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FAF8F5", padding: 72, color: "#17151F" }}>
        <OgBrand mark={mark} height={96} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 82, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>The right tool. For whatever you&apos;re doing.</div>
          <div style={{ fontSize: 34, color: "#5C5868" }}>{siteConfig.tagline}</div>
        </div>
      </div>
    ),
    size,
  );
}
