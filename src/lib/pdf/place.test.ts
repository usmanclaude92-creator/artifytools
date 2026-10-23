import { describe, expect, it } from "vitest";
import { anchorBox, pageLabel, toUserSpace, visualSize } from "./place";

describe("stamp placement", () => {
  it("anchors boxes inside the displayed page", () => {
    const page = { w: 600, h: 800 };
    expect(anchorBox(page, { w: 100, h: 20 }, "bottom-center", 30)).toEqual({ x: 250, y: 30 });
    expect(anchorBox(page, { w: 100, h: 20 }, "top-right", 30)).toEqual({ x: 470, y: 750 });
    expect(anchorBox(page, { w: 100, h: 20 }, "center", 30)).toEqual({ x: 250, y: 390 });
  });
  it("maps displayed points to user space on rotated pages", () => {
    // A 600×800 page shown rotated 90° looks 800×600.
    expect(visualSize(600, 800, 90)).toEqual({ w: 800, h: 600 });
    // The displayed bottom-left corner is the user-space top-left... and so on; every corner stays on the page.
    for (const r of [0, 90, 180, 270]) {
      const vs = visualSize(600, 800, r);
      for (const [vx, vy] of [[0, 0], [vs.w, 0], [0, vs.h], [vs.w, vs.h]]) {
        const p = toUserSpace(vx!, vy!, 600, 800, r);
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(600);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(800);
        expect(p.rotate).toBe(r);
      }
    }
    expect(toUserSpace(10, 20, 600, 800, 90)).toEqual({ x: 580, y: 10, rotate: 90 });
  });
  it("formats page labels in English and Arabic", () => {
    expect(pageLabel("page-n-of-total", 2, 9, "en", false)).toBe("Page 2 of 9");
    expect(pageLabel("n-of-total", 2, 9, "en", false)).toBe("2 / 9");
    expect(pageLabel("page-n-of-total", 12, 30, "ar", true)).toBe("صفحة ١٢ من ٣٠");
  });
});
