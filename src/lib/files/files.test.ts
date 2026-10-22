import { describe, expect, test } from "vitest";
import { acceptAttribute, createZip, crc32, extensionOf, formatBytes, matchesAccept, replaceExtension, safeFileName, savingsPercent, uniqueNames, validateFiles, withSuffix, type FileRules } from ".";

const f = (name: string, type: string, size: number) => ({ name, type, size });

describe("file rules", () => {
  test("extensions", () => {
    expect(extensionOf("Photo.JPG")).toBe(".jpg");
    expect(extensionOf("archive.tar.gz")).toBe(".gz");
    expect(extensionOf(".env")).toBe("");
    expect(extensionOf("README")).toBe("");
  });

  test("accept by MIME, wildcard and extension", () => {
    expect(matchesAccept(f("a.png", "image/png", 1), ["image/*"])).toBe(true);
    expect(matchesAccept(f("a.pdf", "application/pdf", 1), ["image/*"])).toBe(false);
    expect(matchesAccept(f("a.pdf", "", 1), [".pdf"])).toBe(true); // some browsers leave type empty
    expect(matchesAccept(f("a.PDF", "application/octet-stream", 1), [".pdf", "application/pdf"])).toBe(true);
    expect(matchesAccept(f("a.webp", "image/webp", 1), ["image/png", "image/jpeg"])).toBe(false);
    expect(matchesAccept(f("x", "", 1), [])).toBe(true);
    expect(acceptAttribute(["image/*", ".pdf"])).toBe("image/*,.pdf");
    expect(acceptAttribute([])).toBeUndefined();
  });

  test("validateFiles applies type, empty, size, count and total limits in order", () => {
    const rules: FileRules = { accept: ["image/*"], maxFileBytes: 100, maxFiles: 3, maxTotalBytes: 150 };
    const existing = [f("old.png", "image/png", 40)];
    const { accepted, rejected } = validateFiles(
      [f("a.png", "image/png", 50), f("doc.pdf", "application/pdf", 10), f("empty.png", "image/png", 0), f("big.png", "image/png", 101), f("b.png", "image/png", 70), f("c.png", "image/png", 10), f("d.png", "image/png", 10)],
      existing,
      rules,
    );
    expect(accepted.map((x) => x.name)).toEqual(["a.png", "c.png"]);
    expect(rejected.map((r) => [r.file.name, r.reason])).toEqual([
      ["doc.pdf", "type"],
      ["empty.png", "empty"],
      ["big.png", "size"],
      ["b.png", "total"],
      ["d.png", "count"],
    ]);
  });
});

describe("names", () => {
  test("safe names keep Arabic and drop path characters", () => {
    expect(safeFileName('re:port/"final"?.pdf')).toBe("re_port__final__.pdf");
    expect(safeFileName("صورة العائلة.jpg")).toBe("صورة العائلة.jpg");
    expect(safeFileName("...")).toBe("file");
  });
  test("extensions and suffixes", () => {
    expect(replaceExtension("photo.HEIC", "jpg")).toBe("photo.jpg");
    expect(replaceExtension("notes", ".txt")).toBe("notes.txt");
    expect(withSuffix("photo.png", "compressed")).toBe("photo-compressed.png");
    expect(withSuffix("README", "v2")).toBe("README-v2");
  });
  test("unique names", () => {
    expect(uniqueNames(["a.png", "A.png", "a.png", "b"])).toEqual(["a.png", "A (2).png", "a (3).png", "b"]);
  });
});

describe("sizes", () => {
  test("formatBytes uses decimal units in both languages", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(999)).toBe("999 B");
    expect(formatBytes(1500)).toBe("1.5 KB");
    expect(formatBytes(2_340_000)).toBe("2.34 MB");
    expect(formatBytes(25_000_000)).toBe("25 MB");
    expect(formatBytes(123_456_789)).toBe("123 MB");
    expect(formatBytes(1_500_000, "ar")).toBe("1.5 م.ب");
  });
  test("savings", () => {
    expect(savingsPercent(1000, 250)).toBe(75);
    expect(savingsPercent(1000, 1100)).toBe(-10);
    expect(savingsPercent(0, 10)).toBe(0);
  });
});

describe("zip", () => {
  test("crc32 matches the standard check value", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  test("archive structure: local headers, central directory and end record", () => {
    const a = new TextEncoder().encode("hello");
    const b = new TextEncoder().encode("مرحبا");
    const zip = createZip([{ name: "a.txt", data: a, date: new Date(2026, 9, 22, 12, 0, 0) }, { name: "تحية.txt", data: b }]);
    const v = new DataView(zip.buffer);
    expect(v.getUint32(0, true)).toBe(0x04034b50);
    expect(v.getUint16(6, true) & 0x0800).toBe(0x0800);
    expect(v.getUint32(14, true)).toBe(crc32(a));
    const end = zip.length - 22;
    expect(v.getUint32(end, true)).toBe(0x06054b50);
    expect(v.getUint16(end + 10, true)).toBe(2);
    const cdOffset = v.getUint32(end + 16, true);
    expect(v.getUint32(cdOffset, true)).toBe(0x02014b50);
    // second entry's local header offset points at a valid header carrying the UTF-8 name
    const nameLen1 = v.getUint16(cdOffset + 28, true);
    const second = cdOffset + 46 + nameLen1;
    const off2 = v.getUint32(second + 42, true);
    expect(v.getUint32(off2, true)).toBe(0x04034b50);
    const len2 = v.getUint16(off2 + 26, true);
    expect(new TextDecoder().decode(zip.slice(off2 + 30, off2 + 30 + len2))).toBe("تحية.txt");
    expect(new TextDecoder().decode(zip.slice(off2 + 30 + len2, off2 + 30 + len2 + b.length))).toBe("مرحبا");
  });
});
