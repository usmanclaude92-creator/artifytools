import { describe, expect, test } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { moveItem, organizePdf } from "./organize";

async function makePdf(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  // Page i has width 100 + i so pages can be told apart after reordering.
  for (let i = 1; i <= pages; i++) doc.addPage([100 + i, 200]).drawText(`p${i}`, { x: 10, y: 100, size: 12, font });
  return doc.save();
}

const widths = async (bytes: Uint8Array) => (await PDFDocument.load(bytes)).getPages().map((p) => p.getWidth());

describe("organizePdf", () => {
  test("reorders and deletes pages", async () => {
    const out = await organizePdf(await makePdf(4), [{ source: 3, turn: 0 }, { source: 1, turn: 0 }, { source: 4, turn: 0 }]);
    expect(await widths(out)).toEqual([103, 101, 104]);
  });

  test("rotates pages, adding to any existing rotation", async () => {
    const src = await PDFDocument.load(await makePdf(2));
    const { degrees } = await import("pdf-lib");
    src.getPage(1).setRotation(degrees(90));
    const out = await organizePdf(await src.save(), [{ source: 1, turn: 270 }, { source: 2, turn: 90 }, { source: 2, turn: -90 }]);
    expect((await PDFDocument.load(out)).getPages().map((p) => p.getRotation().angle)).toEqual([270, 180, 0]);
  });

  test("a page can be used twice", async () => {
    const out = await organizePdf(await makePdf(2), [{ source: 2, turn: 0 }, { source: 2, turn: 0 }]);
    expect(await widths(out)).toEqual([102, 102]);
  });

  test("rejects an empty selection and out-of-range pages", async () => {
    const pdf = await makePdf(2);
    await expect(organizePdf(pdf, [])).rejects.toThrow();
    await expect(organizePdf(pdf, [{ source: 3, turn: 0 }])).rejects.toThrow();
    await expect(organizePdf(pdf, [{ source: 0, turn: 0 }])).rejects.toThrow();
  });
});

describe("moveItem", () => {
  test("moves forward, backward and clamps", () => {
    expect(moveItem([1, 2, 3, 4], 0, 2)).toEqual([2, 3, 1, 4]);
    expect(moveItem([1, 2, 3, 4], 3, 1)).toEqual([1, 4, 2, 3]);
    expect(moveItem([1, 2, 3], 0, -5)).toEqual([1, 2, 3]);
    expect(moveItem([1, 2, 3], 0, 9)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2, 3], 7, 0)).toEqual([1, 2, 3]);
  });
});
