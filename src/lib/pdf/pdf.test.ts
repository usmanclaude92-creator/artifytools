import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { chunkPages, describeGroup, parseRanges } from "./ranges";
import { inspectPdf, mergePdfs, PdfError, splitPdf } from "./pdf";

async function makePdf(label: string, pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) doc.addPage([300, 200]).drawText(`${label}-${i}`, { x: 20, y: 100, size: 18, font });
  return doc.save();
}

async function pageTexts(bytes: Uint8Array): Promise<number> {
  return (await PDFDocument.load(bytes)).getPageCount();
}

describe("parseRanges", () => {
  test("ranges, single pages and open ends", () => {
    expect(parseRanges("1-3, 5, 8-", 10)).toEqual({ ok: true, groups: [[1, 2, 3], [5], [8, 9, 10]] });
    expect(parseRanges("-2", 10)).toEqual({ ok: true, groups: [[1, 2]] });
    expect(parseRanges(" 4 ", 4)).toEqual({ ok: true, groups: [[4]] });
  });
  test("Arabic digits, commas and words", () => {
    expect(parseRanges("١-٢، ٥", 6)).toEqual({ ok: true, groups: [[1, 2], [5]] });
    expect(parseRanges("2 إلى 3", 6)).toEqual({ ok: true, groups: [[2, 3]] });
    expect(parseRanges("1–2", 6)).toEqual({ ok: true, groups: [[1, 2]] });
  });
  test("errors", () => {
    expect(parseRanges("  ,", 5)).toEqual({ ok: false, error: { code: "empty" } });
    expect(parseRanges("1-3, abc", 5)).toEqual({ ok: false, error: { code: "syntax", token: "abc" } });
    expect(parseRanges("2-9", 5)).toEqual({ ok: false, error: { code: "outOfBounds", page: 9, pageCount: 5 } });
    expect(parseRanges("0", 5)).toEqual({ ok: false, error: { code: "outOfBounds", page: 0, pageCount: 5 } });
    expect(parseRanges("4-2", 5)).toEqual({ ok: false, error: { code: "reversed", token: "4-2" } });
  });
  test("helpers", () => {
    expect(describeGroup([1, 2, 3])).toBe("1-3");
    expect(describeGroup([5])).toBe("5");
    expect(chunkPages(5, 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkPages(3, 1)).toEqual([[1], [2], [3]]);
  });
});

describe("pdf operations", () => {
  test("inspect counts pages and rejects broken or locked files", async () => {
    expect((await inspectPdf(await makePdf("a", 3))).pageCount).toBe(3);
    await expect(inspectPdf(new TextEncoder().encode("not a pdf"))).rejects.toMatchObject({ code: "invalid" });
    await expect(inspectPdf(new TextEncoder().encode("not a pdf"))).rejects.toBeInstanceOf(PdfError);
    const locked = new Uint8Array(readFileSync(path.join(__dirname, "../../../tests/fixtures/locked.pdf")));
    await expect(inspectPdf(locked)).rejects.toMatchObject({ code: "encrypted" });
  });

  test("merge keeps order and every page", async () => {
    const merged = await mergePdfs([await makePdf("a", 2), await makePdf("b", 3)]);
    expect(await pageTexts(merged)).toBe(5);
    const doc = await PDFDocument.load(merged, { updateMetadata: false });
    expect(doc.getProducer()).toContain("Artify Tools");
  });

  test("split produces one document per group", async () => {
    const parts = await splitPdf(await makePdf("a", 5), [[1, 2], [3], [4, 5]]);
    expect(await Promise.all(parts.map(pageTexts))).toEqual([2, 1, 2]);
  });
});
