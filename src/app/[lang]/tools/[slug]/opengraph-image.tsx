import { ImageResponse } from "next/og";
import { INK, MUTED, OG_SIZE, OgFrame, OgHeroArt, OgIcon, TONES, ogAssets } from "@/lib/brand-og";
import { getCategory } from "@/lib/tools/categories";
import { getPublishedTools, getTool } from "@/lib/tools/registry";
import { categoryTones } from "@/lib/tools/tones";

export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return getPublishedTools().map((t) => ({ slug: t.slug }));
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).replace(/[\s,.;:]+\S*$/, "")}…` : s);

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  const { lockup, mark, fonts } = await ogAssets();
  const name = tool?.name ?? "Artify Tools";
  const description = clip(tool?.description ?? "", 115);
  const category = tool ? getCategory(tool.category) : null;
  const tone = TONES[category ? categoryTones[category.id] : "violet"];
  return new ImageResponse(
    (
      <OgFrame>
        <OgHeroArt
          center={
            <div style={{ display: "flex", position: "relative", width: 280, height: 280, alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "flex", width: 168, height: 168, borderRadius: 44, alignItems: "center", justifyContent: "center", backgroundColor: tone.bg }}>
                <OgIcon name={tool?.icon ?? "sparkles"} size={96} color={tone.fg} />
              </div>
              <img src={mark} width={78} height={68} alt="" style={{ position: "absolute", right: 18, bottom: 16 }} />
            </div>
          }
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 0 60px 64px", width: 640, height: "100%" }}>
          <img src={lockup} width={270} height={71} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            {category && (
              <div style={{ display: "flex", alignSelf: "flex-start", padding: "8px 18px", borderRadius: 999, backgroundColor: tone.bg, color: tone.fg, fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{category.name}</div>
            )}
            <div style={{ display: "flex", width: 570, fontSize: name.length > 22 ? 56 : 66, fontWeight: 800, lineHeight: 1.06, letterSpacing: -2, color: INK }}>{name}</div>
            <div style={{ display: "flex", marginTop: 20, fontSize: 26, fontWeight: 500, lineHeight: 1.4, color: MUTED, width: 560 }}>{description}</div>
          </div>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: "#6d28d9" }}>tools.artifysols.com · Free · No sign-up</div>
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
