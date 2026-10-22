/**
 * Image compression planning (pure, unit-tested). The actual encoding is injected,
 * so the same search runs against a real canvas in the browser and a fake in tests.
 */

export type OutputFormat = "jpeg" | "webp" | "png";
export type FormatChoice = "original" | "jpeg" | "webp";

/** Encodes the image at `quality` (0–1) and `scale` (0–1 of the original size); returns the byte size. */
export type SizeProbe = (quality: number, scale: number) => Promise<number>;

export const QUALITY_PRESETS = { high: 0.85, balanced: 0.72, small: 0.55 } as const;
export type QualityPreset = keyof typeof QUALITY_PRESETS;

const MIN_QUALITY = 0.3;
const MAX_QUALITY = 0.95;
const MIN_SCALE = 0.1;

export interface TargetPlan {
  quality: number;
  scale: number;
  bytes: number;
  /** false when even the smallest attempt is above the target. */
  fits: boolean;
}

/**
 * Finds the best quality (and, if needed, a smaller size) that lands at or under `targetBytes`.
 * Quality is searched first, because shrinking dimensions loses more detail than a lower quality.
 */
export async function planForTarget(probe: SizeProbe, targetBytes: number, steps = 7): Promise<TargetPlan> {
  let scale = 1;
  let best: TargetPlan | null = null;
  let smallest: TargetPlan | null = null;
  while (scale >= MIN_SCALE) {
    const atMin = await probe(MIN_QUALITY, scale);
    const minPlan = { quality: MIN_QUALITY, scale, bytes: atMin, fits: atMin <= targetBytes };
    if (!smallest || atMin < smallest.bytes) smallest = minPlan;
    if (atMin <= targetBytes) {
      // Binary search the highest quality that still fits at this scale.
      let lo = MIN_QUALITY;
      let hi = MAX_QUALITY;
      best = minPlan;
      for (let i = 0; i < steps; i++) {
        const mid = (lo + hi) / 2;
        const bytes = await probe(mid, scale);
        if (bytes <= targetBytes) {
          lo = mid;
          best = { quality: mid, scale, bytes, fits: true };
        } else hi = mid;
      }
      return best;
    }
    // Too big even at the lowest quality: estimate the size reduction needed and shrink.
    const ratio = Math.sqrt(targetBytes / atMin) * 0.95;
    scale = Math.min(scale * 0.85, scale * Math.max(ratio, 0.3));
  }
  return smallest!;
}

/** Which format to write, given the user's choice, the input type and whether the image has transparency. */
export function chooseFormat(choice: FormatChoice, inputType: string, hasAlpha: boolean, targetMode: boolean): OutputFormat {
  if (choice === "jpeg") return "jpeg";
  if (choice === "webp") return "webp";
  if (inputType === "image/webp") return "webp";
  if (inputType === "image/png") {
    // PNG is lossless: a size target needs a lossy format. Keep transparency with WebP.
    if (targetMode || !hasAlpha) return targetMode ? (hasAlpha ? "webp" : "jpeg") : "png";
    return "png";
  }
  return "jpeg";
}

export const EXTENSIONS: Record<OutputFormat, string> = { jpeg: ".jpg", webp: ".webp", png: ".png" };
export const MIME: Record<OutputFormat, string> = { jpeg: "image/jpeg", webp: "image/webp", png: "image/png" };

/** Parses "100", "100kb", "1.5 MB", "٢٠٠ ك.ب" into bytes (decimal units, matching formatBytes). */
export function parseTargetSize(input: string): number | null {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ".")
    .replace(/\s+/g, "");
  const m = /^(\d+(?:\.\d+)?)(kb|k|mb|m|ك\.?ب|كيلوبايت|م\.?ب|ميغابايت|ميجابايت)?$/.exec(s);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2] ?? "kb";
  const bytes = /^(mb|m|م\.?ب|ميغابايت|ميجابايت)$/.test(unit) ? n * 1_000_000 : n * 1000;
  return bytes >= 5_000 && bytes <= 50_000_000 ? Math.round(bytes) : null;
}
