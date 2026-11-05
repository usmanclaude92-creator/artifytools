import { describe, expect, test } from "vitest";
import { toSvg, wrapTitle } from "./export";
import { decodeShare, encodeShare, shareLink, tokenFromHash } from "./share";
import { parseOutline, updateNode } from "./model";

const data = parseOutline("Plan\n  Phase <1> & more\n    Task one\n    Task two\n  Phase 2", "Test")!;

describe("share links", () => {
  test("round-trips the plan and keeps it read-only safe", async () => {
    const d = updateNode(data, data.nodes[1]!.id, { status: "doing", due: "2026-12-01", note: "hello" });
    const token = await encodeShare(d);
    expect(token.startsWith("1.")).toBe(true);
    const back = (await decodeShare(token))!;
    expect(back.nodes.map((n) => n.title)).toEqual(d.nodes.map((n) => n.title));
    expect(back.nodes[1]!.status).toBe("doing");
    expect(back.nodes[1]!.due).toBe("2026-12-01");
    expect(back.levels.map((l) => l.name)).toEqual(d.levels.map((l) => l.name));
  });
  test("garbage and tampered links are refused", async () => {
    expect(await decodeShare("1.!!!")).toBeNull();
    expect(await decodeShare("9.abc")).toBeNull();
    const token = await encodeShare(data);
    expect(await decodeShare(token.slice(0, 20))).toBeNull();
  });
  test("builds a link and finds the token again", async () => {
    const { url, long } = await shareLink(data, "https://tools.artifysols.com/tools/adv-project-planner");
    expect(long).toBe(false);
    const hash = url.slice(url.indexOf("#"));
    expect(tokenFromHash(hash)).toBe(await encodeShare(data));
    expect(tokenFromHash("#other")).toBeNull();
  });
});

describe("svg export", () => {
  test("escapes text and includes every level heading", () => {
    for (const kind of ["down", "right", "radial"] as const) {
      const svg = toSvg(data, kind);
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).toContain("Phase &lt;1&gt; &amp; more");
      expect(svg).not.toContain("Phase <1>");
      expect(svg).toContain("Level 2");
    }
  });
  test("wraps long titles onto two lines at most", () => {
    const lines = wrapTitle("A very long title that keeps going and going far beyond the box width limit");
    expect(lines.length).toBeLessThanOrEqual(2);
    expect(lines[lines.length - 1]).toMatch(/…$/);
    expect(wrapTitle("Short")).toEqual(["Short"]);
  });
});
