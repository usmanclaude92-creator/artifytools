import { describe, expect, it } from "vitest";
import { isHeicHeader } from "./convert";

const ftyp = (brand: string) => Uint8Array.from([0, 0, 0, 24, ...[..."ftyp" + brand].map((c) => c.charCodeAt(0))]);

describe("isHeicHeader", () => {
  it("detects HEIC by brand even without a type or extension", () => {
    expect(isHeicHeader(ftyp("heic"), "IMG_0001", "")).toBe(true);
    expect(isHeicHeader(ftyp("mif1"), "photo", "application/octet-stream")).toBe(true);
  });
  it("detects by type or extension", () => {
    expect(isHeicHeader(new Uint8Array(), "a.HEIC", "")).toBe(true);
    expect(isHeicHeader(new Uint8Array(), "a.bin", "image/heif")).toBe(true);
  });
  it("leaves AVIF, JPG and PNG alone", () => {
    expect(isHeicHeader(ftyp("avif"), "a.avif", "image/avif")).toBe(false);
    expect(isHeicHeader(ftyp("mif1"), "a.avif", "")).toBe(false);
    expect(isHeicHeader(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]), "a.jpg", "image/jpeg")).toBe(false);
  });
});
