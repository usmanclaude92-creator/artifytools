import { describe, expect, test } from "vitest";
import { BOX, layout } from "./layout";
import { parseOutline, updateNode } from "./model";

const data = parseOutline("Plan\n  A\n    A1\n    A2\n  B\n    B1", "T")!;
const overlap = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.abs(a.x - b.x) < BOX.w && Math.abs(a.y - b.y) < BOX.h;

describe("layouts", () => {
  for (const kind of ["down", "right", "radial"] as const) {
    test(`${kind}: every visible box is placed once, nothing overlaps, everything is inside the canvas`, () => {
      const l = layout(data, kind);
      expect(l.placed).toHaveLength(6);
      expect(l.edges).toHaveLength(5);
      for (let i = 0; i < l.placed.length; i++) {
        const p = l.placed[i]!;
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.x + BOX.w).toBeLessThanOrEqual(l.width + 0.5);
        expect(p.y + BOX.h).toBeLessThanOrEqual(l.height + 0.5);
        for (let j = i + 1; j < l.placed.length; j++) expect(overlap(p, l.placed[j]!), `${p.id} ${l.placed[j]!.id}`).toBe(false);
      }
    });
  }
  test("top-down: parents sit above and centred over their children; one band per level", () => {
    const l = layout(data, "down");
    const at = (t: string) => l.placed.find((p) => p.id === data.nodes.find((n) => n.title === t)!.id)!;
    expect(at("A").y).toBeGreaterThan(at("Plan").y);
    expect(at("A1").y).toBeGreaterThan(at("A").y);
    expect(at("A").x + BOX.w / 2).toBeCloseTo((at("A1").x + at("A2").x + BOX.w) / 2, 3);
    expect(l.bands).toHaveLength(3);
  });
  test("left-to-right: levels are columns", () => {
    const l = layout(data, "right");
    const at = (t: string) => l.placed.find((p) => p.id === data.nodes.find((n) => n.title === t)!.id)!;
    expect(at("A").x).toBeGreaterThan(at("Plan").x);
    expect(at("A1").x).toBe(at("A2").x);
  });
  test("radial: one ring per level, the root in the middle", () => {
    const l = layout(data, "radial");
    expect(l.rings).toHaveLength(3);
    const root = l.placed[0]!;
    expect(root.x + BOX.w / 2).toBeCloseTo(l.cx, 3);
    expect(l.rings[2]!.r).toBeGreaterThan(l.rings[1]!.r);
  });
  test("collapsed branches are left out", () => {
    const a = data.nodes.find((n) => n.title === "A")!;
    const l = layout(updateNode(data, a.id, { collapsed: true }), "down");
    expect(l.placed).toHaveLength(4);
  });
  test("a big flat tree stays free of overlaps in every layout", () => {
    const lines = ["Root", ...Array.from({ length: 40 }, (_, i) => `  Child ${i}\n    Leaf ${i}a\n    Leaf ${i}b`)].join("\n");
    const big = parseOutline(lines, "Big")!;
    for (const kind of ["down", "right", "radial"] as const) {
      const l = layout(big, kind);
      for (let i = 0; i < l.placed.length; i++) for (let j = i + 1; j < l.placed.length; j++) expect(overlap(l.placed[i]!, l.placed[j]!), `${kind} ${i} ${j}`).toBe(false);
    }
  });
});
