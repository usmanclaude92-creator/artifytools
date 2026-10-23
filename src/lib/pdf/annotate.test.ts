import { describe, expect, it } from "vitest";
import { PDFDocument, degrees } from "pdf-lib";
import { annotatePdf, boxInPoints, clampBox } from "./annotate";

// 1×1 red PNG
const PNG = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));

describe("annotate", () => {
  it("maps a top-left fractional box to points", () => {
    expect(boxInPoints({ x: 0.1, y: 0.2, w: 0.5, h: 0.1 }, { w: 600, h: 800 })).toEqual({ x: 60, y: 560, w: 300, h: 80 });
  });
  it("keeps boxes on the page", () => {
    expect(clampBox({ x: 0.9, y: -0.1, w: 0.3, h: 0.2 })).toEqual({ x: 0.7, y: 0, w: 0.3, h: 0.2 });
  });
  it("adds images and white-out to the right pages, including rotated ones", async () => {
    const src = await PDFDocument.create();
    src.addPage([600, 800]);
    src.addPage([600, 800]).setRotation(degrees(90));
    const bytes = await src.save();
    const out = await annotatePdf(bytes, [
      { kind: "rect", page: 0, x: 0.1, y: 0.1, w: 0.2, h: 0.05, color: "#ffffff" },
      { kind: "image", page: 1, x: 0.5, y: 0.5, w: 0.2, h: 0.1, png: PNG },
    ]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
    expect(doc.getPage(1).getRotation().angle).toBe(90);
    expect(out.length).toBeGreaterThan(bytes.length);
  });
});
