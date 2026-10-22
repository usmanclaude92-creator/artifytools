import { describe, expect, it } from "vitest";
import { applyAspect, clampRect, initialCrop, moveRect, parseDimension, planResize, resizeRect, roundRect } from "./resize";

const src = { width: 4000, height: 3000 };

describe("planResize", () => {
  it("scales by percent", () => {
    expect(planResize(src, { kind: "percent", percent: 50 })!.canvas).toEqual({ width: 2000, height: 1500 });
    expect(planResize(src, { kind: "percent", percent: 0 })).toBeNull();
  });
  it("follows the ratio when one side is given", () => {
    expect(planResize(src, { kind: "pixels", width: 1200, height: null, fit: "fit" })!.canvas).toEqual({ width: 1200, height: 900 });
    expect(planResize(src, { kind: "pixels", width: null, height: 600, fit: "fit" })!.canvas).toEqual({ width: 800, height: 600 });
  });
  it("fits inside, fills with a centred crop, pads, or stretches", () => {
    expect(planResize(src, { kind: "pixels", width: 1080, height: 1080, fit: "fit" })!.canvas).toEqual({ width: 1080, height: 810 });
    const fill = planResize(src, { kind: "pixels", width: 1080, height: 1080, fit: "fill" })!;
    expect(fill.canvas).toEqual({ width: 1080, height: 1080 });
    expect(fill.src).toEqual({ x: 500, y: 0, w: 3000, h: 3000 });
    const pad = planResize(src, { kind: "pixels", width: 1080, height: 1080, fit: "pad" })!;
    expect(pad.dst).toEqual({ x: 0, y: 135, w: 1080, h: 810 });
    expect(planResize(src, { kind: "pixels", width: 100, height: 300, fit: "stretch" })!.dst).toEqual({ x: 0, y: 0, w: 100, h: 300 });
  });
  it("rejects invalid or huge sizes", () => {
    expect(planResize(src, { kind: "pixels", width: null, height: null, fit: "fit" })).toBeNull();
    expect(planResize(src, { kind: "pixels", width: NaN, height: null, fit: "fit" })).toBeNull();
    expect(planResize(src, { kind: "pixels", width: 20000, height: null, fit: "fit" })).toBeNull();
  });
});

describe("parseDimension", () => {
  it("parses numbers, Arabic digits and px", () => {
    expect(parseDimension("1,080")).toBe(1080);
    expect(parseDimension("١٠٨٠")).toBe(1080);
    expect(parseDimension("720px")).toBe(720);
    expect(parseDimension("")).toBeNull();
    expect(parseDimension("abc")).toBeNaN();
  });
});

describe("cropping", () => {
  const b = { width: 1000, height: 500 };
  it("starts with the largest centred crop for an aspect", () => {
    expect(initialCrop(b, 1)).toEqual({ x: 250, y: 0, w: 500, h: 500 });
    expect(initialCrop(b, null)).toEqual({ x: 0, y: 0, w: 1000, h: 500 });
  });
  it("keeps moves inside the image", () => {
    expect(moveRect({ x: 900, y: 0, w: 200, h: 100 }, 50, -20, b)).toEqual({ x: 800, y: 0, w: 200, h: 100 });
    expect(clampRect({ x: -5, y: 10, w: 2000, h: 50 }, b)).toEqual({ x: 0, y: 10, w: 1000, h: 50 });
  });
  it("resizes freely and with a locked aspect", () => {
    expect(resizeRect({ x: 100, y: 100, w: 200, h: 100 }, "se", 50, 30, null, b)).toEqual({ x: 100, y: 100, w: 250, h: 130 });
    const sq = resizeRect({ x: 100, y: 100, w: 200, h: 200 }, "se", 100, 10, 1, b);
    expect(sq.w).toBeCloseTo(sq.h);
    expect(sq.x).toBe(100);
    expect(sq.y + sq.h).toBeLessThanOrEqual(500);
    const nw = resizeRect({ x: 100, y: 100, w: 200, h: 200 }, "nw", -300, -300, 1, b);
    expect(nw.x).toBeGreaterThanOrEqual(0);
    expect(nw.y).toBeGreaterThanOrEqual(0);
    expect(nw.x + nw.w).toBeCloseTo(300);
    expect(nw.w).toBeCloseTo(nw.h);
  });
  it("re-fits to a new aspect and rounds to whole pixels", () => {
    const r = applyAspect({ x: 0, y: 0, w: 1000, h: 500 }, 9 / 16, b);
    expect(r.w / r.h).toBeCloseTo(9 / 16);
    expect(r.h).toBeLessThanOrEqual(500);
    expect(roundRect({ x: 0.4, y: 0.6, w: 10.2, h: 9.9 })).toEqual({ x: 0, y: 1, w: 11, h: 10 });
  });
});
