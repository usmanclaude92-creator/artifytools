/** Pure size/placement maths for resizing and cropping images (unit-tested). */

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** fit: inside the box, keep ratio · fill: cover the box, crop overflow · pad: exact box, letterbox · stretch: exact box, distort */
export type FitMode = "fit" | "fill" | "pad" | "stretch";

export type ResizeSpec =
  | { kind: "percent"; percent: number }
  | { kind: "pixels"; width: number | null; height: number | null; fit: FitMode };

export interface DrawPlan {
  canvas: Size;
  /** Part of the source to draw. */
  src: Rect;
  /** Where to draw it on the canvas. */
  dst: Rect;
}

export const MAX_OUTPUT_SIDE = 16_000;
const r = (n: number) => Math.max(1, Math.round(n));

export function planResize(source: Size, spec: ResizeSpec): DrawPlan | null {
  const full: Rect = { x: 0, y: 0, w: source.width, h: source.height };
  if (spec.kind === "percent") {
    if (!(spec.percent > 0)) return null;
    const w = r((source.width * spec.percent) / 100);
    const h = r((source.height * spec.percent) / 100);
    if (w > MAX_OUTPUT_SIDE || h > MAX_OUTPUT_SIDE) return null;
    return { canvas: { width: w, height: h }, src: full, dst: { x: 0, y: 0, w, h } };
  }
  const { width, height, fit } = spec;
  if ((width !== null && !(width >= 1)) || (height !== null && !(height >= 1))) return null;
  if (width === null && height === null) return null;
  if ((width ?? 0) > MAX_OUTPUT_SIDE || (height ?? 0) > MAX_OUTPUT_SIDE) return null;
  const ratio = source.width / source.height;

  // Only one side given: the other follows the original proportions.
  if (width === null || height === null) {
    const w = width ?? r(height! * ratio);
    const h = height ?? r(width! / ratio);
    if (w > MAX_OUTPUT_SIDE || h > MAX_OUTPUT_SIDE) return null;
    return { canvas: { width: r(w), height: r(h) }, src: full, dst: { x: 0, y: 0, w: r(w), h: r(h) } };
  }

  switch (fit) {
    case "stretch":
      return { canvas: { width, height }, src: full, dst: { x: 0, y: 0, w: width, h: height } };
    case "fit": {
      const s = Math.min(width / source.width, height / source.height);
      const w = r(source.width * s), h = r(source.height * s);
      return { canvas: { width: w, height: h }, src: full, dst: { x: 0, y: 0, w, h } };
    }
    case "pad": {
      const s = Math.min(width / source.width, height / source.height);
      const w = source.width * s, h = source.height * s;
      return { canvas: { width, height }, src: full, dst: { x: (width - w) / 2, y: (height - h) / 2, w, h } };
    }
    case "fill": {
      const target = width / height;
      const src = ratio > target
        ? { w: source.height * target, h: source.height }
        : { w: source.width, h: source.width / target };
      return {
        canvas: { width, height },
        src: { x: (source.width - src.w) / 2, y: (source.height - src.h) / 2, w: src.w, h: src.h },
        dst: { x: 0, y: 0, w: width, h: height },
      };
    }
  }
}

/** Parses "1080", "1,080", Arabic digits; null for empty, NaN for junk. */
export function parseDimension(text: string): number | null {
  const s = text.trim().replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[,٬\s]/g, "").replace(/px$/i, "");
  if (!s) return null;
  return /^\d+$/.test(s) ? Number(s) : NaN;
}

/* ---------- Cropping ---------- */

export type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export function clampRect(rect: Rect, bounds: Size, min = 1): Rect {
  const w = Math.min(Math.max(min, rect.w), bounds.width);
  const h = Math.min(Math.max(min, rect.h), bounds.height);
  const x = Math.min(Math.max(0, rect.x), bounds.width - w);
  const y = Math.min(Math.max(0, rect.y), bounds.height - h);
  return { x, y, w, h };
}

/** Largest centred rectangle with `aspect` (w/h) inside `bounds`; the whole image when aspect is null. */
export function initialCrop(bounds: Size, aspect: number | null): Rect {
  if (!aspect) return { x: 0, y: 0, w: bounds.width, h: bounds.height };
  let w = bounds.width, h = w / aspect;
  if (h > bounds.height) {
    h = bounds.height;
    w = h * aspect;
  }
  return { x: (bounds.width - w) / 2, y: (bounds.height - h) / 2, w, h };
}

/** Re-fits an existing crop to a new aspect, keeping its centre and staying inside the image. */
export function applyAspect(rect: Rect, aspect: number | null, bounds: Size): Rect {
  if (!aspect) return rect;
  const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
  const area = rect.w * rect.h;
  let w = Math.sqrt(area * aspect), h = w / aspect;
  const s = Math.min(1, bounds.width / w, bounds.height / h);
  w *= s;
  h *= s;
  return clampRect({ x: cx - w / 2, y: cy - h / 2, w, h }, bounds);
}

export function moveRect(rect: Rect, dx: number, dy: number, bounds: Size): Rect {
  return clampRect({ ...rect, x: rect.x + dx, y: rect.y + dy }, bounds);
}

/** Drags one handle by (dx, dy) image pixels, keeping `aspect` when set and the opposite edge fixed. */
export function resizeRect(rect: Rect, handle: Handle, dx: number, dy: number, aspect: number | null, bounds: Size, min = 8): Rect {
  let left = rect.x, top = rect.y, right = rect.x + rect.w, bottom = rect.y + rect.h;
  if (handle.includes("w")) left = Math.min(Math.max(0, left + dx), right - min);
  if (handle.includes("e")) right = Math.max(Math.min(bounds.width, right + dx), left + min);
  if (handle.includes("n")) top = Math.min(Math.max(0, top + dy), bottom - min);
  if (handle.includes("s")) bottom = Math.max(Math.min(bounds.height, bottom + dy), top + min);
  if (!aspect) return { x: left, y: top, w: right - left, h: bottom - top };

  let w = right - left, h = bottom - top;
  const horizontal = handle === "e" || handle === "w";
  const vertical = handle === "n" || handle === "s";
  if (horizontal) h = w / aspect;
  else if (vertical) w = h * aspect;
  else if (w / h > aspect) h = w / aspect;
  else w = h * aspect;

  // Anchor: the opposite corner/edge stays put; centre on the free axis for edge handles.
  const ax = handle.includes("w") ? rect.x + rect.w : handle.includes("e") ? rect.x : rect.x + rect.w / 2;
  const ay = handle.includes("n") ? rect.y + rect.h : handle.includes("s") ? rect.y : rect.y + rect.h / 2;
  // Room available from the anchor in the drag direction.
  const roomW = handle.includes("w") ? ax : handle.includes("e") ? bounds.width - ax : 2 * Math.min(ax, bounds.width - ax);
  const roomH = handle.includes("n") ? ay : handle.includes("s") ? bounds.height - ay : 2 * Math.min(ay, bounds.height - ay);
  const s = Math.min(1, roomW / w, roomH / h);
  w *= s;
  h *= s;
  const x = handle.includes("w") ? ax - w : handle.includes("e") ? ax : ax - w / 2;
  const y = handle.includes("n") ? ay - h : handle.includes("s") ? ay : ay - h / 2;
  return { x, y, w, h };
}

export function roundRect(rect: Rect): Rect {
  const x = Math.round(rect.x), y = Math.round(rect.y);
  return { x, y, w: Math.max(1, Math.round(rect.x + rect.w) - x), h: Math.max(1, Math.round(rect.y + rect.h) - y) };
}
