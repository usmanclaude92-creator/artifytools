import { describe, expect, it } from "vitest";
import { PDFDocument, degrees } from "pdf-lib";
import { cropPages } from "./edit";

async function make(rotation = 0) {
  const doc = await PDFDocument.create();
  const p = doc.addPage([200, 100]);
  p.drawRectangle({ x: 20, y: 20, width: 60, height: 30 });
  p.setRotation(degrees(rotation));
  doc.addPage([200, 100]).drawRectangle({ x: 10, y: 10, width: 20, height: 20 });
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
  it("turns pages before cropping, in the turned view", async () => {
    const out = await PDFDocument.load(await cropPages(await make(), [{ x0: 0, y0: 0, x1: 1, y1: 0.5 }, null], [{ turn: 90, tilt: 0 }, null]));
    const [a, b] = out.getPages();
    expect(a!.getRotation().angle).toBe(90);
    expect(a!.getCropBox()).toEqual({ x: 0, y: 0, width: 100, height: 100 });
    expect(b!.getRotation().angle).toBe(0);
  });
  it("straightens a page onto a new page of the same size, then crops it", async () => {
    const out = await PDFDocument.load(await cropPages(await make(), [{ x0: 0.25, y0: 0.25, x1: 0.75, y1: 0.75 }, null], [{ turn: 0, tilt: 4 }, null]));
    expect(out.getPageCount()).toBe(2);
    const a = out.getPages()[0]!;
    expect(a.getRotation().angle).toBe(0);
    expect(a.getCropBox()).toEqual({ x: 50, y: 25, width: 100, height: 50 });
    expect(out.getPages()[1]!.getCropBox().width).toBe(200);
  });
  it("a turned and straightened page takes the turned shape", async () => {
    const out = await PDFDocument.load(await cropPages(await make(), [null, null], [{ turn: 90, tilt: -2.5 }, null]));
    const a = out.getPages()[0]!;
    expect(a.getSize()).toEqual({ width: 100, height: 200 });
  });
  it("straightens a blank page without failing", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 100]);
    const out = await PDFDocument.load(await cropPages(await doc.save(), [null], [{ turn: 0, tilt: 3 }]));
    expect(out.getPages()[0]!.getSize()).toEqual({ width: 200, height: 100 });
  });
  it("ignores empty rectangles", async () => {
    const out = await PDFDocument.load(await cropPages(await make(), [{ x0: 0.5, y0: 0.5, x1: 0.5, y1: 0.9 }, null]));
    expect(out.getPages()[0]!.getCropBox().width).toBe(200);
  });
});
