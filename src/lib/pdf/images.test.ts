import { describe, expect, test } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildImagePdf, jpegOrientation, layoutImage } from "./images";

/** Minimal JPEG header with an EXIF APP1 segment carrying an orientation value. */
function jpegWithOrientation(value: number, little = false): Uint8Array {
  const u16 = (n: number) => (little ? [n & 0xff, n >> 8] : [n >> 8, n & 0xff]);
  const u32 = (n: number) => (little ? [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, n >>> 24] : [n >>> 24, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]);
  const tiff = [...(little ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(8), ...u16(1), ...u16(0x0112), ...u16(3), ...u32(1), ...u16(value), 0, 0, ...u32(0)];
  const app1 = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xe1, (app1.length + 2) >> 8, (app1.length + 2) & 0xff, ...app1, 0xff, 0xda, 0, 2]);
}

// 1×1 PNG
const PNG = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));

describe("layout", () => {
  test("fit: page follows the image at 96 dpi, plus margins", () => {
    expect(layoutImage(960, 480, { pageSize: "fit", orientation: "auto", margin: "none" })).toEqual({ pageWidth: 720, pageHeight: 360, x: 0, y: 0, width: 720, height: 360 });
    const m = layoutImage(960, 480, { pageSize: "fit", orientation: "auto", margin: "small" });
    expect(m.pageWidth).toBeCloseTo(720 + 2 * 28.35, 1);
    expect(m.x).toBeCloseTo(28.35, 1);
  });

  test("A4 auto-rotates for wide images and centres without stretching", () => {
    const wide = layoutImage(4000, 3000, { pageSize: "a4", orientation: "auto", margin: "none" });
    expect([wide.pageWidth, wide.pageHeight]).toEqual([841.89, 595.28]);
    expect(wide.width / wide.height).toBeCloseTo(4 / 3, 5);
    expect(wide.height).toBeCloseTo(595.28, 2);
    expect(wide.x).toBeCloseTo((841.89 - wide.width) / 2, 5);

    const forced = layoutImage(4000, 3000, { pageSize: "a4", orientation: "portrait", margin: "large" });
    expect([forced.pageWidth, forced.pageHeight]).toEqual([595.28, 841.89]);
    expect(forced.width).toBeCloseTo(595.28 - 2 * 56.69, 1);
    expect(forced.y).toBeGreaterThan(forced.x);
  });

  test("Letter portrait for tall images", () => {
    const tall = layoutImage(1000, 3000, { pageSize: "letter", orientation: "auto", margin: "none" });
    expect([tall.pageWidth, tall.pageHeight]).toEqual([612, 792]);
    expect(tall.height).toBeCloseTo(792, 3);
  });
});

describe("JPEG orientation", () => {
  test("reads big- and little-endian EXIF, defaults to 1", () => {
    expect(jpegOrientation(jpegWithOrientation(6))).toBe(6);
    expect(jpegOrientation(jpegWithOrientation(3, true))).toBe(3);
    expect(jpegOrientation(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 2]))).toBe(1);
    expect(jpegOrientation(new Uint8Array([1, 2, 3]))).toBe(1);
    expect(jpegOrientation(jpegWithOrientation(42))).toBe(1);
  });
});

describe("buildImagePdf", () => {
  test("one page per image with the laid-out size", async () => {
    const bytes = await buildImagePdf(
      [{ format: "png", bytes: PNG, width: 960, height: 480 }, { format: "png", bytes: PNG, width: 100, height: 300 }],
      { pageSize: "fit", orientation: "auto", margin: "none" },
    );
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(2);
    expect(doc.getPage(0).getSize()).toEqual({ width: 720, height: 360 });
    expect(doc.getPage(1).getSize()).toEqual({ width: 75, height: 225 });
  });
});
