import { describe, expect, it } from "vitest";
import { joinLines, splitLines } from "./logic";

describe("text translator lines", () => {
  it("keeps blank lines and line order", () => {
    const parts = splitLines("Hello\r\n\r\n  World  \n");
    expect(parts.segments).toEqual(["Hello", "World"]);
    expect(joinLines(parts, ["مرحبا", "عالم"])).toBe("مرحبا\n\nعالم\n");
  });
  it("handles empty input", () => {
    const parts = splitLines("  \n ");
    expect(parts.segments).toEqual([]);
    expect(joinLines(parts, [])).toBe("\n");
  });
});
