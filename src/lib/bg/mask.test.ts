import { describe, expect, it } from "vitest";
import { alphaToMask, applyMask, keptFraction, toModelInput } from "./mask";

describe("background removal pixels", () => {
  it("converts RGBA to planar 0–1 RGB", () => {
    const rgba = new Uint8ClampedArray([255, 0, 51, 255, 0, 255, 102, 255]);
    const out = toModelInput(rgba, 1).subarray(0, 3);
    expect([...out].map((v) => +v.toFixed(2))).toEqual([1, 0, 0.2]);
    const two = toModelInput(new Uint8ClampedArray(16).fill(255), 2);
    expect(two).toHaveLength(12);
  });
  it("turns alpha into a mask and applies it", () => {
    const mask = alphaToMask(new Float32Array([0, 0.5, 1, 1.4]), 2);
    expect([mask[0], mask[4], mask[8], mask[12]]).toEqual([0, 128, 255, 255]);
    const img = new Uint8ClampedArray([10, 20, 30, 255, 10, 20, 30, 255, 10, 20, 30, 200, 1, 1, 1, 255]);
    applyMask(img, mask);
    expect([img[3], img[7], img[11], img[15]]).toEqual([0, 128, 200, 255]);
  });
  it("measures how much was kept", () => {
    expect(keptFraction(new Float32Array([0.9, 0.1, 0.6, 0.2]))).toBe(0.5);
  });
});
