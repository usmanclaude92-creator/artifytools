/**
 * Placing stamps (page numbers, watermarks) where the reader SEES them, also on pages that
 * are rotated with /Rotate (common for scans). Pure, unit-tested.
 */

export type Anchor = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right" | "center";

/** Size of the page as displayed. */
export function visualSize(width: number, height: number, rotation: number): { w: number; h: number } {
  return rotation % 180 === 0 ? { w: width, h: height } : { w: height, h: width };
}

/** Bottom-left of a w×h box at `anchor` with `margin`, in displayed coordinates (origin bottom-left). */
export function anchorBox(page: { w: number; h: number }, box: { w: number; h: number }, anchor: Anchor, margin: number): { x: number; y: number } {
  const [v, hz] = anchor === "center" ? ["middle", "center"] : (anchor.split("-") as [string, string]);
  const x = hz === "left" ? margin : hz === "right" ? page.w - margin - box.w : (page.w - box.w) / 2;
  const y = v === "top" ? page.h - margin - box.h : v === "bottom" ? margin : (page.h - box.h) / 2;
  return { x, y };
}

/**
 * Displayed coordinates → PDF user space for drawing upright content on a page with /Rotate.
 * Returns the point to draw at and the rotation (degrees, counter-clockwise) to draw with.
 */
export function toUserSpace(vx: number, vy: number, width: number, height: number, rotation: number): { x: number; y: number; rotate: number } {
  switch (((rotation % 360) + 360) % 360) {
    case 90:
      return { x: width - vy, y: vx, rotate: 90 };
    case 180:
      return { x: width - vx, y: height - vy, rotate: 180 };
    case 270:
      return { x: vy, y: height - vx, rotate: 270 };
    default:
      return { x: vx, y: vy, rotate: 0 };
  }
}

export type NumberFormat = "n" | "page-n" | "n-of-total" | "page-n-of-total";

export function pageLabel(format: NumberFormat, n: number, total: number, locale: "en" | "ar", arabicDigits: boolean): string {
  const d = (x: number) => (arabicDigits ? String(x).replace(/\d/g, (c) => "٠١٢٣٤٥٦٧٨٩"[Number(c)]!) : String(x));
  if (locale === "ar") {
    if (format === "n") return d(n);
    if (format === "page-n") return `صفحة ${d(n)}`;
    if (format === "n-of-total") return `${d(n)} / ${d(total)}`;
    return `صفحة ${d(n)} من ${d(total)}`;
  }
  if (format === "n") return d(n);
  if (format === "page-n") return `Page ${d(n)}`;
  if (format === "n-of-total") return `${d(n)} / ${d(total)}`;
  return `Page ${d(n)} of ${d(total)}`;
}
