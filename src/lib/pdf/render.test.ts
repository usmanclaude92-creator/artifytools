import { describe, expect, it } from "vitest";
import { MAX_PIXELS, MAX_SIDE, scaleFor } from "./render";

describe("scaleFor", () => {
  it("uses dpi/72 for normal pages", () => {
    expect(scaleFor(595, 842, 150)).toBeCloseTo(150 / 72);
  });
  it("caps very large pages", () => {
    const s = scaleFor(5000, 5000, 300);
    expect(5000 * s).toBeLessThanOrEqual(MAX_SIDE + 0.001);
    expect(5000 * s * 5000 * s).toBeLessThanOrEqual(MAX_PIXELS + 1);
  });
});
