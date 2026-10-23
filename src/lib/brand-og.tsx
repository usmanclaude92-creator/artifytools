import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactNode } from "react";
import type { IconName } from "@/components/ui/icon";
import { ogIcons } from "@/lib/og-icons";

/**
 * Shared pieces for the generated social share images (Open Graph / WhatsApp / X / LinkedIn),
 * styled like the home hero: a soft violet wash, the full brand lockup, bold Inter type and
 * the app-icon tile with floating tool tiles.
 */

const read = (p: string) => readFile(join(process.cwd(), "public", p));
const dataUrl = async (p: string) => `data:image/png;base64,${(await read(p)).toString("base64")}`;

let assets: Promise<{ lockup: string; mark: string; fonts: { name: string; data: Buffer; weight: 500 | 700 | 800; style: "normal" }[] }> | null = null;
export function ogAssets() {
  assets ??= (async () => ({
    lockup: await dataUrl("brand/og-lockup.png"),
    mark: await dataUrl("brand/og-mark.png"),
    fonts: await Promise.all(
      ([500, 700, 800] as const).map(async (weight) => ({ name: "Inter", data: await read(`fonts/og/inter-latin-${weight}-normal.woff`), weight, style: "normal" as const })),
    ),
  }))();
  return assets;
}

export const OG_SIZE = { width: 1200, height: 630 };
export const INK = "#151127";
export const MUTED = "#5b5573";
export const GRADIENT = "linear-gradient(90deg, #7c3aed, #c026d3 55%, #db2777)";

export const TONES = {
  blue: { bg: "#e8f1ff", fg: "#2563eb" },
  violet: { bg: "#f1e7ff", fg: "#6d28d9" },
  green: { bg: "#e3f6ec", fg: "#0f7a4d" },
  pink: { bg: "#fdeaf3", fg: "#c0306f" },
  amber: { bg: "#fdf0dc", fg: "#a35d08" },
} as const;
export type OgTone = keyof typeof TONES;

/** Page background: lavender wash with soft orbit lines. */
export function OgFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        fontFamily: "Inter",
        color: INK,
        backgroundColor: "#fbf7ff",
        backgroundImage: "radial-gradient(circle at 82% 38%, #e7dcff 0%, rgba(231,220,255,0) 46%), radial-gradient(circle at 8% 100%, #fde4f3 0%, rgba(253,228,243,0) 40%), linear-gradient(180deg, #fdfaff 0%, #f6efff 100%)",
      }}
    >
      <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", top: 0, left: 0 }}>
        <ellipse cx="930" cy="318" rx="300" ry="128" transform="rotate(-24 930 318)" fill="none" stroke="#a78bfa" strokeOpacity="0.55" strokeWidth="2" />
        <ellipse cx="930" cy="318" rx="250" ry="190" transform="rotate(18 930 318)" fill="none" stroke="#93c5fd" strokeOpacity="0.5" strokeWidth="1.5" />
        <circle cx="1150" cy="210" r="7" fill="#7c3aed" fillOpacity="0.55" />
        <circle cx="720" cy="470" r="6" fill="#3b82f6" fillOpacity="0.55" />
      </svg>
      {children}
    </div>
  );
}

/** An icon as an SVG image (lucide-react components can't be called while rendering on the server). */
export function OgIcon({ name, size, color }: { name: IconName; size: number; color: string }) {
  const svg = ogIcons[name].replace(/COLOR/g, color);
  // eslint-disable-next-line @next/next/no-img-element -- rendered by Satori
  return <img src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`} width={size} height={size} alt="" />;
}

/** A small floating tool tile (white glass card with a tinted icon). */
export function OgTile({ icon, tone, size, x, y }: { icon: IconName; tone: OgTone; size: number; x: number; y: number }) {
  const t = TONES[tone];
  return (
    <div style={{ position: "absolute", left: x, top: y, width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: size * 0.26, backgroundColor: "rgba(255,255,255,0.92)", boxShadow: "0 14px 34px -10px rgba(76,46,170,0.35)", border: "1px solid #ece4ff" }}>
      <div style={{ width: size * 0.62, height: size * 0.62, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: size * 0.2, backgroundColor: t.bg }}>
        <OgIcon name={icon} size={Math.round(size * 0.36)} color={t.fg} />
      </div>
    </div>
  );
}

/** The right-hand illustration: glass plates, the app tile and four floating tools. */
export function OgHeroArt({ center, centerSize = 280 }: { center: ReactNode; centerSize?: number }) {
  const cx = 930, cy = 318;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex" }}>
      <div style={{ position: "absolute", left: cx - centerSize * 0.62, top: cy - centerSize * 0.62, width: centerSize * 1.24, height: centerSize * 1.24, borderRadius: 72, backgroundColor: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.8)", transform: "rotate(6deg)", boxShadow: "0 30px 60px -20px rgba(101,71,255,0.35)" }} />
      <div style={{ position: "absolute", left: cx - centerSize / 2, top: cy - centerSize / 2, width: centerSize, height: centerSize, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 64, backgroundColor: "#ffffff", boxShadow: "0 30px 60px -16px rgba(20,91,255,0.45)", border: "1px solid #efe9fb" }}>
        {center}
      </div>
      <OgTile icon="calculator" tone="green" size={96} x={706} y={92} />
      <OgTile icon="image" tone="blue" size={104} x={1050} y={64} />
      <OgTile icon="file-text" tone="violet" size={100} x={652} y={330} />
      <OgTile icon="code" tone="violet" size={100} x={1010} y={470} />
    </div>
  );
}

/** Pill chips, like the hero's "Try searching" suggestions. */
export function OgChips({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {items.map((c) => (
        <div key={c} style={{ display: "flex", padding: "9px 17px", borderRadius: 999, backgroundColor: "#ffffff", border: "1px solid #e6dcfb", fontSize: 19, fontWeight: 500, color: "#3f3a56", boxShadow: "0 4px 12px -6px rgba(76,46,170,0.25)" }}>
          {c}
        </div>
      ))}
    </div>
  );
}
