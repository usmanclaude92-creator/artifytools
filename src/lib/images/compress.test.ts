import { describe, expect, test } from "vitest";
import { chooseFormat, parseTargetSize, planForTarget, type SizeProbe } from "./compress";

/** A believable encoder: bytes grow with quality and with pixel count. */
const model = (fullBytes: number): SizeProbe => async (q, s) => Math.round(fullBytes * s * s * (0.15 + q * q));

describe("planForTarget", () => {
  test("keeps full size and finds the highest quality under the target", async () => {
    const plan = await planForTarget(model(400_000), 200_000);
    expect(plan.fits).toBe(true);
    expect(plan.scale).toBe(1);
    expect(plan.bytes).toBeLessThanOrEqual(200_000);
    expect(plan.bytes).toBeGreaterThan(180_000); // close to the target, not needlessly small
  });

  test("shrinks dimensions only when the lowest quality is still too big", async () => {
    const plan = await planForTarget(model(4_000_000), 100_000);
    expect(plan.fits).toBe(true);
    expect(plan.scale).toBeLessThan(1);
    expect(plan.bytes).toBeLessThanOrEqual(100_000);
  });

  test("reports the smallest attempt when the target can't be reached", async () => {
    const stubborn: SizeProbe = async () => 50_000;
    const plan = await planForTarget(stubborn, 10_000);
    expect(plan.fits).toBe(false);
    expect(plan.bytes).toBe(50_000);
  });
});

describe("chooseFormat", () => {
  test("original keeps the input's family; PNG stays PNG unless a size target needs lossy", () => {
    expect(chooseFormat("original", "image/jpeg", false, false)).toBe("jpeg");
    expect(chooseFormat("original", "image/webp", true, true)).toBe("webp");
    expect(chooseFormat("original", "image/png", true, false)).toBe("png");
    expect(chooseFormat("original", "image/png", false, false)).toBe("png");
    expect(chooseFormat("original", "image/png", false, true)).toBe("jpeg");
    expect(chooseFormat("original", "image/png", true, true)).toBe("webp");
    expect(chooseFormat("webp", "image/jpeg", false, false)).toBe("webp");
    expect(chooseFormat("jpeg", "image/png", true, false)).toBe("jpeg");
  });
});

describe("parseTargetSize", () => {
  test("units, Arabic digits and limits", () => {
    expect(parseTargetSize("100")).toBe(100_000);
    expect(parseTargetSize("100 KB")).toBe(100_000);
    expect(parseTargetSize("1.5mb")).toBe(1_500_000);
    expect(parseTargetSize("٢٠٠ ك.ب")).toBe(200_000);
    expect(parseTargetSize("2 م.ب")).toBe(2_000_000);
    expect(parseTargetSize("1")).toBeNull(); // 1 KB is below the 5 KB floor
    expect(parseTargetSize("abc")).toBeNull();
  });
});
