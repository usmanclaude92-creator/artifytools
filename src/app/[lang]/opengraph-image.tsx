import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config";
import { GRADIENT, MUTED, OG_SIZE, OgChips, OgFrame, OgHeroArt, ogAssets } from "@/lib/brand-og";

const size = OG_SIZE;

/**
 * One image per language, each at its own path (/en/opengraph-image/en, /ar/opengraph-image/ar-2).
 * Bump the Arabic id when its picture changes so apps such as WhatsApp fetch it again.
 */
export async function generateImageMetadata({ params }: { params: Promise<{ lang: string }> | { lang: string } }) {
  const { lang } = await params;
  return lang === "ar"
    ? [{ id: "ar-2", alt: `${siteConfig.name}: الأداة المناسبة. لكل ما تعمل عليه.`, size, contentType: "image/png" }]
    : [{ id: "en", alt: `${siteConfig.name}: The right tool. For whatever you're doing.`, size, contentType: "image/png" }];
}

export default async function Image({ id }: { id: Promise<string | number> }) {
  // Satori can't join Arabic letters, so the Arabic card is pre-drawn by a browser (scripts/og-ar.mjs).
  if (String(await id).startsWith("ar")) {
    const png = await readFile(join(process.cwd(), "public/og/home-ar.png"));
    return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } });
  }
  const { lockup, mark, fonts } = await ogAssets();
  return new ImageResponse(
    (
      <OgFrame>
        <OgHeroArt center={<img src={mark} width={226} height={198} alt="" />} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 0 60px 64px", width: 640, height: "100%" }}>
          <img src={lockup} width={300} height={79} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2 }}>The right tool.</div>
            <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2 }}>For whatever</div>
            <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2, backgroundImage: GRADIENT, backgroundClip: "text", color: "transparent" }}>you&apos;re doing.</div>
            <div style={{ display: "flex", marginTop: 20, fontSize: 26, fontWeight: 500, lineHeight: 1.4, color: MUTED, width: 540 }}>
              Convert and edit PDFs, turn bank statements into Excel, print cheques and fix images.
            </div>
          </div>
          <OgChips items={["PDF to Word", "Bank statements", "Print a cheque"]} />
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
