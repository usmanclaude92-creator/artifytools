import { describe, expect, it } from "vitest";
import { PDFDocument, degrees } from "pdf-lib";
import { cropPages } from "./edit";

async function make(rotation = 0) {
  const doc = await PDFDocument.create();
  const p = doc.addPage([200, 100]);
  p.setRotation(degrees(rotation));
  doc.addPage([200, 100]);
  return doc.save();
}

describe("cropPages", () => {
  it("crops an upright page from the top-left of the view", async () => {
    const out = await PDFDocument.load(await cropPages(await make(), [{ x0: 0.25, y0: 0.2, x1: 0.75, y1: 0.8 }, null]));
    const [a, b] = out.getPages();
    expect(a!.getCropBox()).toEqual({ x: 50, y: 20, width: 100, height: 60 });
    expect(a!.getMediaBox()).toEqual({ x: 50, y: 20, width: 100, height: 60 });
    expect(b!.getCropBox()).toEqual({ x: 0, y: 0, width: 200, height: 100 });
  });
  it("follows the page rotation", async () => {
    // Turned 90° clockwise, the view is 100 wide and 200 tall; its top strip is the page's left strip.
    const out = await PDFDocument.load(await cropPages(await make(90), [{ x0: 0, y0: 0, x1: 1, y1: 0.5 }, null]));
    const box = out.getPages()[0]!.getCropBox();
    expect(box).toEqual({ x: 0, y: 0, width: 100, height: 100 });
    const top = await PDFDocument.load(await cropPages(await make(90), [{ x0: 0, y0: 0.5, x1: 1, y1: 1 }, null]));
    expect(top.getPages()[0]!.getCropBox()).toEqual({ x: 100, y: 0, width: 100, height: 100 });
  });
  it("ignores empty rectangles", async () => {
    const out = await PDFDocument.load(await cropPages(await make(), [{ x0: 0.5, y0: 0.5, x1: 0.5, y1: 0.9 }, null]));
    expect(out.getPages()[0]!.getCropBox().width).toBe(200);
  });
});
