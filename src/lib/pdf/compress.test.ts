import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { PDFDocument, PDFName, PDFRawStream, StandardFonts } from "pdf-lib";
import { compressPdf, toRgba, unpredictPng, type JpegEncoder } from "./compress";

const fixture = (n: string) => new Uint8Array(readFileSync(path.join(__dirname, "../../../tests/fixtures", n)));
const SMALL_JPEG = fixture("photo-upright.jpg"); // 320×240

/** Stand-in for the browser canvas: always returns a small JPEG at the requested max side. */
const fakeEncoder: JpegEncoder = async (input, maxSide) => {
  const w = input.kind === "raw" ? input.width : 1200;
  const h = input.kind === "raw" ? input.height : 900;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  return { bytes: SMALL_JPEG, width: Math.round(w * scale), height: Math.round(h * scale) };
};

async function photoPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const jpg = await doc.embedJpg(fixture("noisy-photo.jpg"));
  const png = await doc.embedPng(fixture("noisy-alpha.png"));
  const page = doc.addPage([600, 800]);
  page.drawText("Quarterly report", { x: 40, y: 760, size: 20, font });
  page.drawImage(jpg, { x: 40, y: 300, width: 520, height: 390 });
  page.drawImage(png, { x: 40, y: 40, width: 300, height: 200 });
  doc.addPage([600, 800]).drawText("Text-only page", { x: 40, y: 760, size: 20, font });
  return doc.save();
}

function imageStreams(doc: PDFDocument) {
  return doc.context
    .enumerateIndirectObjects()
    .map(([, o]) => o)
    .filter((o): o is PDFRawStream => o instanceof PDFRawStream && o.dict.get(PDFName.of("Subtype")) === PDFName.of("Image"));
}

describe("compressPdf", () => {
  test("re-encodes photos smaller and keeps text, pages and transparency", async () => {
    const input = await photoPdf();
    const result = await compressPdf(input, "balanced", fakeEncoder);
    expect(result.imagesFound).toBe(3); // JPEG, PNG colour, PNG alpha mask
    expect(result.imagesCompressed).toBe(2);
    expect(result.bytes.length).toBeLessThan(input.length * 0.5);

    const doc = await PDFDocument.load(result.bytes);
    expect(doc.getPageCount()).toBe(2);
    const filters = imageStreams(doc).map((s) => s.dict.get(PDFName.of("Filter"))?.toString());
    expect(filters.filter((f) => f === "/DCTDecode")).toHaveLength(2);
    const withSMask = imageStreams(doc).filter((s) => s.dict.get(PDFName.of("SMask")));
    expect(withSMask).toHaveLength(1); // the PNG's transparency survived
    expect(withSMask[0]!.dict.get(PDFName.of("Filter"))?.toString()).toBe("/DCTDecode");
  });

  test("leaves images alone when re-encoding wouldn't help, and text-only PDFs still save", async () => {
    const noGain: JpegEncoder = async () => ({ bytes: new Uint8Array(10_000_000), width: 10, height: 10 });
    const input = await photoPdf();
    const r = await compressPdf(input, "strong", noGain);
    expect(r.imagesCompressed).toBe(0);

    const textOnly = await PDFDocument.create();
    textOnly.addPage().drawText("Hello");
    const t = await compressPdf(await textOnly.save(), "strong", fakeEncoder);
    expect(t.imagesFound).toBe(0);
    expect((await PDFDocument.load(t.bytes)).getPageCount()).toBe(1);
  });

  test("refuses password-protected and broken files", async () => {
    await expect(compressPdf(fixture("locked.pdf"), "balanced", fakeEncoder)).rejects.toMatchObject({ code: "encrypted" });
    await expect(compressPdf(new TextEncoder().encode("nope"), "balanced", fakeEncoder)).rejects.toMatchObject({ code: "invalid" });
  });

  test("passes the level's size limit to the encoder", async () => {
    const seen: number[] = [];
    const spy: JpegEncoder = async (i, maxSide, q) => (seen.push(maxSide, q), fakeEncoder(i, maxSide, q));
    await compressPdf(await photoPdf(), "strong", spy);
    expect(seen.slice(0, 2)).toEqual([1300, 0.5]);
  });
});

describe("raw image helpers", () => {
  test("PNG predictors: none, sub, up, average, paeth", () => {
    // 2×2 RGB image, rows filtered with sub (1) and up (2)
    const data = new Uint8Array([1, 10, 20, 30, 5, 5, 5, 2, 1, 1, 1, 2, 2, 2]);
    expect(Array.from(unpredictPng(data, 2, 3, 2)!)).toEqual([10, 20, 30, 15, 25, 35, 11, 21, 31, 17, 27, 37]);
    const avgPaeth = new Uint8Array([3, 100, 4, 4, 10, 20]);
    // row 0 average: [100, 4+50=54]; row 1 paeth: [100+10, 54+20]
    expect(Array.from(unpredictPng(avgPaeth, 2, 1, 2)!)).toEqual([100, 54, 110, 74]);
    expect(unpredictPng(new Uint8Array([9, 1]), 1, 1, 1)).toBeNull();
    expect(unpredictPng(new Uint8Array([0]), 4, 3, 2)).toBeNull();
  });
  test("gray and RGB to RGBA", () => {
    expect(Array.from(toRgba(new Uint8Array([7, 9]), 1, 2, 1)!)).toEqual([7, 7, 7, 255, 9, 9, 9, 255]);
    expect(Array.from(toRgba(new Uint8Array([1, 2, 3]), 3, 1, 1)!)).toEqual([1, 2, 3, 255]);
    expect(toRgba(new Uint8Array([1]), 3, 1, 1)).toBeNull();
  });
});
