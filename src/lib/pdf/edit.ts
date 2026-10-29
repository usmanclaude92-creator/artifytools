/** Page edits for the small PDF tools: rotate, page numbers, watermarks. All lossless except the stamps added. */
import { finish, lib, open } from "./pdf";
import { anchorBox, pageLabel, toUserSpace, visualSize, type Anchor, type NumberFormat } from "./place";

const RTL = /[֐-ࣿיִ-﷿ﹰ-﻿]/;

/**
 * Draws text with the browser (so Arabic is shaped and any script works) and returns a
 * transparent PNG plus its size in points at `pt` font size.
 */
export async function textImage(text: string, opts: { pt: number; color: string; bold?: boolean; scale?: number }): Promise<{ png: Uint8Array; w: number; h: number }> {
  const scale = opts.scale ?? 4;
  const px = opts.pt * scale;
  const font = `${opts.bold ? 700 : 500} ${px}px Inter, "IBM Plex Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif`;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  ctx.font = font;
  const m = ctx.measureText(text);
  const pad = Math.ceil(px * 0.15);
  c.width = Math.ceil(m.width) + pad * 2;
  c.height = Math.ceil(px * 1.35) + pad * 2;
  const g = c.getContext("2d")!;
  g.font = font;
  g.fillStyle = opts.color;
  g.textBaseline = "middle";
  g.direction = RTL.test(text) ? "rtl" : "ltr";
  g.textAlign = "center";
  g.fillText(text, c.width / 2, c.height / 2);
  const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/png"));
  return { png: new Uint8Array(await blob.arrayBuffer()), w: c.width / scale, h: c.height / scale };
}

/** Rotates pages by the given amounts (degrees clockwise, multiples of 90). Lossless. */
export async function rotatePages(bytes: Uint8Array, deltas: number[]): Promise<Uint8Array> {
  const { degrees } = await lib();
  const doc = await open(bytes);
  doc.getPages().forEach((p, i) => {
    const d = deltas[i] ?? 0;
    if (d % 360) p.setRotation(degrees((((p.getRotation().angle + d) % 360) + 360) % 360));
  });
  return finish(doc);
}

/** A crop as fractions (0–1) of the page as displayed, measured from its top-left. */
export interface CropRect { x0: number; y0: number; x1: number; y1: number }

/** How a page is turned and straightened before it is cropped: `turn` in quarter turns (degrees, clockwise), `tilt` in degrees (clockwise). */
export interface PageAdjust { turn: number; tilt: number }

/**
 * Turns, straightens and crops pages (null leaves a page alone). Lossless: a turn only changes the page's rotation;
 * a tilt re-places the page's content, rotated, on a new page of the same size; a crop shrinks the visible area.
 */
export async function cropPages(bytes: Uint8Array, rects: (CropRect | null)[], adjust: (PageAdjust | null)[] = []): Promise<Uint8Array> {
  const { degrees } = await lib();
  const doc = await open(bytes);
  const count = doc.getPageCount();
  for (let i = 0; i < count; i++) {
    const a = adjust[i];
    if (!a || (!(a.turn % 360) && !a.tilt)) continue;
    const old = doc.getPage(i);
    const base = (((old.getRotation().angle + a.turn) % 360) + 360) % 360;
    if (!a.tilt) { old.setRotation(degrees(base)); continue; }
    // Straighten: draw the page's content, rotated about its centre, on a new page the size of the turned view.
    const box = old.getCropBox();
    // A page with no content can't be embedded; it becomes a blank page of the right size.
    const blank = old.node.Contents() === undefined;
    const embedded = blank ? null : await doc.embedPage(old, { left: box.x, bottom: box.y, right: box.x + box.width, top: box.y + box.height });
    const { w: W, h: H } = visualSize(box.width, box.height, base);
    const phi = (-(base + a.tilt) * Math.PI) / 180;
    const cx = box.width / 2, cy = box.height / 2;
    const page = doc.insertPage(i, [W, H]);
    if (embedded) {
      page.drawPage(embedded, {
        x: W / 2 - (cx * Math.cos(phi) - cy * Math.sin(phi)),
        y: H / 2 - (cx * Math.sin(phi) + cy * Math.cos(phi)),
        width: box.width,
        height: box.height,
        rotate: degrees((phi * 180) / Math.PI),
      });
    }
    doc.removePage(i + 1);
  }
  doc.getPages().forEach((p, i) => {
    const r = rects[i];
    if (!r) return;
    const box = p.getCropBox();
    const rot = p.getRotation().angle;
    const { w, h } = visualSize(box.width, box.height, rot);
    const a = toUserSpace(r.x0 * w, (1 - r.y0) * h, box.width, box.height, rot);
    const b = toUserSpace(r.x1 * w, (1 - r.y1) * h, box.width, box.height, rot);
    const round = (v: number) => Math.round(v * 100) / 100;
    const x = round(box.x + Math.min(a.x, b.x)), y = round(box.y + Math.min(a.y, b.y));
    const cw = round(Math.abs(a.x - b.x)), ch = round(Math.abs(a.y - b.y));
    if (cw < 1 || ch < 1) return;
    p.setCropBox(x, y, cw, ch);
    p.setMediaBox(x, y, cw, ch);
  });
  return finish(doc);
}

export interface NumberOptions {
  anchor: Anchor;
  format: NumberFormat;
  start: number;
  pt: number;
  margin: number;
  skipFirst: boolean;
  color: string;
  locale: "en" | "ar";
  arabicDigits: boolean;
}

export async function addPageNumbers(bytes: Uint8Array, o: NumberOptions, onProgress?: (f: number) => void): Promise<Uint8Array> {
  const { degrees } = await lib();
  const doc = await open(bytes);
  const pages = doc.getPages();
  const counted = o.skipFirst ? pages.length - 1 : pages.length;
  const total = counted + o.start - 1;
  for (const [i, page] of pages.entries()) {
    if (o.skipFirst && i === 0) continue;
    const n = o.start + (o.skipFirst ? i - 1 : i);
    const img = await textImage(pageLabel(o.format, n, total, o.locale, o.arabicDigits), { pt: o.pt, color: o.color });
    const embedded = await doc.embedPng(img.png);
    const { width, height } = page.getSize();
    const rot = page.getRotation().angle;
    const vis = visualSize(width, height, rot);
    const at = anchorBox(vis, { w: img.w, h: img.h }, o.anchor, o.margin);
    const p = toUserSpace(at.x, at.y, width, height, rot);
    page.drawImage(embedded, { x: p.x, y: p.y, width: img.w, height: img.h, rotate: degrees(p.rotate) });
    onProgress?.((i + 1) / pages.length);
  }
  return finish(doc);
}

export interface WatermarkOptions {
  kind: "text" | "image";
  text: string;
  color: string;
  pt: number;
  image?: { bytes: Uint8Array; type: "png" | "jpg" };
  /** Image width as a share of the page width (0–1). */
  imageScale: number;
  opacity: number;
  /** Degrees, counter-clockwise as seen on the page. */
  angle: number;
  layout: "center" | "tile";
}

export async function addWatermark(bytes: Uint8Array, o: WatermarkOptions, onProgress?: (f: number) => void): Promise<Uint8Array> {
  const { degrees } = await lib();
  const doc = await open(bytes);
  let stamp;
  let base = { w: 0, h: 0 };
  if (o.kind === "text") {
    const img = await textImage(o.text, { pt: o.pt, color: o.color, bold: true });
    stamp = await doc.embedPng(img.png);
    base = { w: img.w, h: img.h };
  } else if (o.image) {
    stamp = o.image.type === "png" ? await doc.embedPng(o.image.bytes) : await doc.embedJpg(o.image.bytes);
    base = { w: stamp.width, h: stamp.height };
  } else throw new Error("no image");

  const pages = doc.getPages();
  for (const [i, page] of pages.entries()) {
    const { width, height } = page.getSize();
    const rot = page.getRotation().angle;
    const vis = visualSize(width, height, rot);
    const size = o.kind === "image" ? { w: vis.w * o.imageScale, h: (vis.w * o.imageScale * base.h) / base.w } : base;
    // Centres of each copy, in displayed coordinates.
    const centres: [number, number][] = [];
    if (o.layout === "center") centres.push([vis.w / 2, vis.h / 2]);
    else {
      const stepX = Math.max(size.w, size.h) * 1.6, stepY = Math.max(size.h * 3, size.w * 0.9);
      for (let y = stepY / 2; y < vis.h + stepY / 2; y += stepY) for (let x = (Math.round(y / stepY) % 2) * (stepX / 2); x < vis.w + stepX / 2; x += stepX) centres.push([x, y]);
    }
    for (const [cx, cy] of centres) {
      // Rotate around the centre: start from the box's bottom-left offset by the rotated half-size.
      const a = (o.angle * Math.PI) / 180;
      const ox = cx - (size.w / 2) * Math.cos(a) + (size.h / 2) * Math.sin(a);
      const oy = cy - (size.w / 2) * Math.sin(a) - (size.h / 2) * Math.cos(a);
      const p = toUserSpace(ox, oy, width, height, rot);
      page.drawImage(stamp, { x: p.x, y: p.y, width: size.w, height: size.h, rotate: degrees(p.rotate + o.angle), opacity: o.opacity });
    }
    onProgress?.((i + 1) / pages.length);
  }
  return finish(doc);
}
