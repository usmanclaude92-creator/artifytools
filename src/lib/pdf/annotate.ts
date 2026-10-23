/**
 * Adds signatures, text, images and white-out boxes to PDF pages, placed where the reader sees
 * them (also on pages turned with /Rotate). Lossless for everything else on the page.
 */
import { finish, lib, open } from "./pdf";
import { toUserSpace, visualSize } from "./place";

/** A box on a page as fractions of the page as displayed (origin top-left). */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Annotation =
  | (Box & { page: number; kind: "image"; png: Uint8Array })
  | (Box & { page: number; kind: "rect"; color: string });

/** Displayed-page box in points with a bottom-left origin, from a top-left fractional box. */
export function boxInPoints(b: Box, vis: { w: number; h: number }) {
  return { x: b.x * vis.w, y: vis.h - (b.y + b.h) * vis.h, w: b.w * vis.w, h: b.h * vis.h };
}

/** Keeps a box on the page, preserving its size where possible. */
export function clampBox<T extends Box>(b: T): T {
  const w = Math.min(Math.max(b.w, 0.01), 1);
  const h = Math.min(Math.max(b.h, 0.005), 1);
  return { ...b, w, h, x: Math.min(Math.max(b.x, 0), 1 - w), y: Math.min(Math.max(b.y, 0), 1 - h) };
}

const hex = (c: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  const n = m ? parseInt(m[1]!, 16) : 0xffffff;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
};

export async function annotatePdf(bytes: Uint8Array, items: Annotation[], onProgress?: (f: number) => void): Promise<Uint8Array> {
  const { degrees, rgb } = await lib();
  const doc = await open(bytes);
  const pages = doc.getPages();
  const images = new Map<Uint8Array, Awaited<ReturnType<typeof doc.embedPng>>>();
  // White-out first, so text and signatures placed on top of it stay visible.
  const ordered = [...items].sort((a, b) => (a.kind === "rect" ? 0 : 1) - (b.kind === "rect" ? 0 : 1));
  for (const [i, it] of ordered.entries()) {
    const page = pages[it.page];
    if (!page) continue;
    const { width, height } = page.getSize();
    const rot = page.getRotation().angle;
    const box = boxInPoints(it, visualSize(width, height, rot));
    const at = toUserSpace(box.x, box.y, width, height, rot);
    if (it.kind === "rect") {
      page.drawRectangle({ x: at.x, y: at.y, width: box.w, height: box.h, rotate: degrees(at.rotate), color: rgb(...hex(it.color)), borderWidth: 0 });
    } else {
      let img = images.get(it.png);
      if (!img) {
        img = await doc.embedPng(it.png);
        images.set(it.png, img);
      }
      page.drawImage(img, { x: at.x, y: at.y, width: box.w, height: box.h, rotate: degrees(at.rotate) });
    }
    onProgress?.((i + 1) / ordered.length);
  }
  return finish(doc);
}
