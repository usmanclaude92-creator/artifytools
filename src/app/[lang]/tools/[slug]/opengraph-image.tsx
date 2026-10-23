import { ImageResponse } from "next/og";
import { OgBrand, ogMark } from "@/lib/brand-og";
import { getCategory } from "@/lib/tools/categories";
import { getPublishedTools, getTool } from "@/lib/tools/registry";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getPublishedTools().map((t) => ({ slug: t.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  const name = tool?.name ?? "Artify Tools";
  const description = tool?.description ?? "";
  const category = tool ? getCategory(tool.category).name : "";
  const mark = await ogMark();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FAF8F5", padding: 72, color: "#17151F" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <OgBrand mark={mark} height={72} />
          <div style={{ fontSize: 28, color: "#4C2FE0" }}>{category}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{name}</div>
          <div style={{ fontSize: 36, color: "#5C5868", lineHeight: 1.3 }}>{description}</div>
        </div>
      </div>
    ),
    size,
  );
}
