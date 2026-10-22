import { contrastRatio, parseColor } from "../color-converter/logic";

export type ErrorCorrection = "L" | "M" | "Q" | "H";

export const MAX_QR_CHARS = 2000;

export interface QrOptions {
  text: string;
  errorCorrection: ErrorCorrection;
  size: number; // px, PNG export
  margin: number; // modules
  foreground: string;
  background: string;
}

export const errorCorrectionLevels: { id: ErrorCorrection; label: string; hint: string }[] = [
  { id: "L", label: "Low (7%)", hint: "Smallest code, least damage tolerance" },
  { id: "M", label: "Medium (15%)", hint: "Balanced default" },
  { id: "Q", label: "Quartile (25%)", hint: "Good for printed material" },
  { id: "H", label: "High (30%)", hint: "Most resilient, densest code" },
];

export function validateQrInput(o: QrOptions): string | null {
  if (!o.text.trim()) return null; // idle, not an error
  if (o.text.length > MAX_QR_CHARS) return `Text is too long (limit ${MAX_QR_CHARS.toLocaleString("en-US")} characters).`;
  if (!parseColor(o.foreground).ok || !parseColor(o.background).ok) return "Choose valid colours.";
  return null;
}

/** QR scanners need a dark module on a light background; warn when contrast is low. */
export function qrContrastWarning(foreground: string, background: string): string | null {
  const f = parseColor(foreground);
  const b = parseColor(background);
  if (!f.ok || !b.ok) return null;
  const ratio = contrastRatio(f.rgb, b.rgb);
  if (ratio < 3) return `Low contrast (${ratio.toFixed(1)}:1) — many scanners will fail to read this code. Use a much darker foreground on a lighter background.`;
  if (contrastRatio(f.rgb, { r: 255, g: 255, b: 255 }) < contrastRatio(b.rgb, { r: 255, g: 255, b: 255 })) {
    return "The foreground is lighter than the background (inverted code). Some scanners can't read inverted QR codes.";
  }
  return null;
}

export interface QrArtifacts {
  svg: string;
  pngDataUrl: string;
  modules: number;
}

/** Real QR encoding via the `qrcode` library, loaded on demand. Browser-only (PNG uses canvas). */
export async function generateQr(o: QrOptions): Promise<QrArtifacts> {
  const QRCode = (await import("qrcode")).default;
  const color = { dark: o.foreground, light: o.background };
  const base = { errorCorrectionLevel: o.errorCorrection, margin: o.margin, color } as const;
  const [svg, pngDataUrl] = await Promise.all([
    QRCode.toString(o.text, { ...base, type: "svg" }),
    QRCode.toDataURL(o.text, { ...base, width: o.size }),
  ]);
  const model = QRCode.create(o.text, { errorCorrectionLevel: o.errorCorrection });
  return { svg, pngDataUrl, modules: model.modules.size };
}
