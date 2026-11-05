import { describe, expect, test } from "vitest";
import { addChild, addSibling, canRemoveLevel, childrenOf, depths, maxDepth, moveSibling, normalize, parseOutline, removeNode, sanitize, setCollapsedAll, template, visibleIds, updateNode, type PlannerData } from "./model";

const names = {
  blank: "Blank", project: "Project", company: "Company", process: "Process",
  root: { blank: "Root", project: "Goal", company: "Org", process: "Flow" },
  levels: { blank: ["Level 1", "Level 2"], project: ["Goal", "Phase", "Task"], company: ["Company", "Dept", "Team"], process: ["Process", "Stage", "Step"] },
};

const small = (): PlannerData => parseOutline("Plan\n  A\n    A1\n    A2\n  B", "T")!;

describe("outline", () => {
  test("builds a tree from indentation and adds the levels it needs", () => {
    const d = small();
    expect(d.nodes.map((n) => n.title)).toEqual(["Plan", "A", "A1", "A2", "B"]);
    expect(d.levels).toHaveLength(3);
    expect(maxDepth(d)).toBe(2);
    expect(childrenOf(d, d.nodes[0]!.id).map((n) => n.title)).toEqual(["A", "B"]);
  });
  test("several top-level lines get a root of their own; bullets are ignored", () => {
    const d = parseOutline("- one\n- two\n* three", "Mine")!;
    expect(d.nodes[0]!.title).toBe("Mine");
    expect(childrenOf(d, d.nodes[0]!.id).map((n) => n.title)).toEqual(["one", "two", "three"]);
  });
  test("empty text gives nothing", () => expect(parseOutline("  \n \n")).toBeNull());
});

describe("editing", () => {
  test("adding a child to the deepest box adds a level; the child sits after its siblings' subtrees", () => {
    let d = small();
    const a1 = d.nodes.find((n) => n.title === "A1")!;
    const r = addChild(d, a1.id, "deep");
    d = r.data;
    expect(d.levels).toHaveLength(4);
    expect(d.levels[3]!.name).toBe("Level 4");
    const a = d.nodes.find((n) => n.title === "A")!;
    const r2 = addChild(d, a.id, "A3");
    expect(childrenOf(r2.data, a.id).map((n) => n.title)).toEqual(["A1", "A2", "A3"]);
    // order in the list keeps A's subtree together, before B
    const titles = r2.data.nodes.map((n) => n.title);
    expect(titles.indexOf("A3")).toBeLessThan(titles.indexOf("B"));
  });
  test("siblings are added after the box and its subtree; the root has none", () => {
    const d = small();
    const a = d.nodes.find((n) => n.title === "A")!;
    const r = addSibling(d, a.id, "A+");
    expect(childrenOf(r.data, d.nodes[0]!.id).map((n) => n.title)).toEqual(["A", "A+", "B"]);
    expect(addSibling(d, d.nodes[0]!.id, "x").data).toBe(d);
  });
  test("removing deletes the whole branch but never the root", () => {
    const d = small();
    const a = d.nodes.find((n) => n.title === "A")!;
    expect(removeNode(d, a.id).nodes.map((n) => n.title)).toEqual(["Plan", "B"]);
    expect(removeNode(d, d.nodes[0]!.id)).toBe(d);
  });
  test("moving swaps siblings together with their branches", () => {
    const d = small();
    const b = d.nodes.find((n) => n.title === "B")!;
    const moved = moveSibling(d, b.id, -1);
    expect(childrenOf(moved, d.nodes[0]!.id).map((n) => n.title)).toEqual(["B", "A"]);
    expect(moved.nodes.map((n) => n.title)).toEqual(["Plan", "B", "A", "A1", "A2"]);
    expect(moveSibling(moved, b.id, -1)).toBe(moved);
  });
  test("collapsing hides descendants; levels can be removed only from the end when empty", () => {
    let d = small();
    const a = d.nodes.find((n) => n.title === "A")!;
    d = updateNode(d, a.id, { collapsed: true });
    expect([...visibleIds(d)].length).toBe(3);
    expect(canRemoveLevel(d, 2)).toBe(false);
    d = removeNode(updateNode(d, a.id, { collapsed: false }), a.id);
    expect(canRemoveLevel(normalize(d), 2)).toBe(true);
    expect(canRemoveLevel(d, 0)).toBe(false);
    const all = setCollapsedAll(small(), true);
    expect(all.nodes.filter((n) => n.collapsed).map((n) => n.title)).toEqual(["A"]);
  });
  test("depths", () => {
    const d = small();
    const m = depths(d);
    expect(d.nodes.map((n) => m.get(n.id))).toEqual([0, 1, 2, 2, 1]);
  });
});

describe("templates and validation", () => {
  test("every template has a root, its own level names and no orphan", () => {
    for (const id of ["blank", "project", "company", "process"] as const) {
      const d = template(id, names);
      expect(sanitize(JSON.parse(JSON.stringify(d)))).not.toBeNull();
      expect(d.levels.map((l) => l.name).slice(0, names.levels[id].length)).toEqual(names.levels[id]);
    }
  });
  test("sanitize cleans values and refuses broken data", () => {
    const d = small();
    const bad = JSON.parse(JSON.stringify(d));
    bad.nodes[2].parent = "nope";
    expect(sanitize(bad)).toBeNull();
    const dirty = JSON.parse(JSON.stringify(d));
    dirty.levels[0].color = "red";
    dirty.nodes[1].status = "weird";
    dirty.nodes[1].due = "tomorrow";
    const clean = sanitize(dirty)!;
    expect(clean.levels[0]!.color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(clean.nodes[1]!.status).toBe("none");
    expect(clean.nodes[1]!.due).toBe("");
    expect(sanitize(null)).toBeNull();
    expect(sanitize({ nodes: [], levels: [] })).toBeNull();
  });
});
