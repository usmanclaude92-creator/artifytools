export interface Rgb { r: number; g: number; b: number }
export interface Hsl { h: number; s: number; l: number }

export type ParseOutcome = { ok: true; rgb: Rgb } | { ok: false; error: string };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function rgbToHex({ r, g, b }: Rgb): string {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: Math.round(l * 100) };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h: Math.round(h) % 360, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const sn = s / 100, ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = ln - c / 2;
  return { r: Math.round((r1! + m) * 255), g: Math.round((g1! + m) * 255), b: Math.round((b1! + m) * 255) };
}

/** Accepts #RGB, #RRGGBB, "rgb(…)", "hsl(…)" or bare "255, 136, 0". */
export function parseColor(input: string): ParseOutcome {
  const s = input.trim();
  if (!s) return { ok: false, error: "Enter a colour such as #5B3DF5, rgb(91, 61, 245) or hsl(250, 90%, 60%)." };

  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (hex) {
    let h = hex[1]!;
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return { ok: true, rgb: { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) } };
  }
  if (/^#?([0-9a-f]{4}|[0-9a-f]{8})$/i.test(s)) {
    return { ok: false, error: "Transparency (alpha) isn't supported. Use a 3- or 6-digit hex colour." };
  }

  const fn = /^(rgb|hsl)a?\(\s*([^)]*)\)$/i.exec(s);
  const kind = fn ? fn[1]!.toLowerCase() : /%/.test(s) ? "hsl" : "rgb";
  const body = fn ? fn[2]! : s;
  const parts = body.split(/[\s,/]+/).filter(Boolean);
  if (parts.length !== 3) {
    return { ok: false, error: "Couldn't read that colour. Use a hex code, rgb(r, g, b) or hsl(h, s%, l%)." };
  }
  const nums = parts.map((p) => (/^-?\d+(\.\d+)?(%|deg)?$/i.test(p) ? parseFloat(p) : NaN));
  if (nums.some(Number.isNaN)) {
    return { ok: false, error: "Couldn't read that colour — each value must be a number." };
  }
  const [a, b, c] = nums as [number, number, number];
  if (kind === "rgb") {
    if ([a, b, c].some((v) => v < 0 || v > 255)) return { ok: false, error: "RGB values must be between 0 and 255." };
    return { ok: true, rgb: { r: Math.round(a), g: Math.round(b), b: Math.round(c) } };
  }
  if (b < 0 || b > 100 || c < 0 || c > 100) return { ok: false, error: "HSL saturation and lightness must be between 0% and 100%." };
  return { ok: true, rgb: hslToRgb({ h: a, s: clamp(b, 0, 100), l: clamp(c, 0, 100) }) };
}

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.x contrast ratio, 1–21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

export const formatRgb = ({ r, g, b }: Rgb) => `rgb(${r}, ${g}, ${b})`;
export const formatHsl = ({ h, s, l }: Hsl) => `hsl(${h}, ${s}%, ${l}%)`;
