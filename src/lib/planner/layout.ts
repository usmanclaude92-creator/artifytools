/** Automatic layouts for the planner: top-down, left-to-right and radial. Pure functions, so they are easy to test. */
import { depths, visibleIds, type PlannerData } from "./model";

export type LayoutKind = "down" | "right" | "radial";

export const BOX = { w: 188, h: 70, gapX: 22, gapY: 54 };
/** Room for the level headings: on the left (top-down), above (left-to-right). */
const GUTTER = 132;
const HEAD = 34;
const PAD = 24;

export interface Placed { id: string; x: number; y: number; depth: number }
export interface Band { depth: number; x: number; y: number; w: number; h: number }
export interface Ring { depth: number; r: number }
export interface Layout {
  kind: LayoutKind;
  placed: Placed[];
  edges: { from: string; to: string }[];
  /** Straight bands (top-down and left-to-right): one per level, with its heading placed by the renderer. */
  bands: Band[];
  /** Circles for the radial layout. */
  rings: Ring[];
  cx: number;
  cy: number;
  width: number;
  height: number;
}

interface Tree { id: string; depth: number; kids: Tree[]; span: number; start: number }

function buildTree(data: PlannerData): Tree | null {
  const vis = visibleIds(data);
  const d = depths(data);
  const kids = new Map<string, string[]>();
  for (const n of data.nodes) if (n.parent && vis.has(n.id)) (kids.get(n.parent) ?? kids.set(n.parent, []).get(n.parent)!).push(n.id);
  const root = data.nodes[0];
  if (!root) return null;
  const make = (id: string): Tree => {
    const children = (kids.get(id) ?? []).map(make);
    const span = children.length ? children.reduce((s, c) => s + c.span, 0) : 1;
    return { id, depth: d.get(id) ?? 0, kids: children, span, start: 0 };
  };
  const tree = make(root.id);
  const assign = (t: Tree, start: number) => {
    t.start = start;
    let at = start;
    for (const c of t.kids) { assign(c, at); at += c.span; }
  };
  assign(tree, 0);
  return tree;
}

function flatten(t: Tree, out: Tree[] = []): Tree[] {
  out.push(t);
  t.kids.forEach((c) => flatten(c, out));
  return out;
}

export function layout(data: PlannerData, kind: LayoutKind): Layout {
  const tree = buildTree(data);
  const empty: Layout = { kind, placed: [], edges: [], bands: [], rings: [], cx: 0, cy: 0, width: 0, height: 0 };
  if (!tree) return empty;
  const all = flatten(tree);
  const edges = all.flatMap((t) => t.kids.map((c) => ({ from: t.id, to: c.id })));
  const levels = Math.max(data.levels.length, ...all.map((t) => t.depth + 1));

  if (kind === "down") {
    const unit = BOX.w + BOX.gapX;
    const row = BOX.h + BOX.gapY;
    const width = GUTTER + tree.span * unit + PAD;
    const placed = all.map((t) => ({ id: t.id, depth: t.depth, x: GUTTER + (t.start + t.span / 2) * unit - unit / 2 + (unit - BOX.w) / 2, y: PAD + t.depth * row }));
    const bands = Array.from({ length: levels }, (_, i) => ({ depth: i, x: 0, y: PAD + i * row - BOX.gapY / 2, w: width, h: row }));
    return { kind, placed, edges, bands, rings: [], cx: 0, cy: 0, width, height: PAD * 2 + levels * row - BOX.gapY };
  }

  if (kind === "right") {
    const col = BOX.w + BOX.gapY + 16;
    const unit = BOX.h + 18;
    const height = HEAD + tree.span * unit + PAD;
    const placed = all.map((t) => ({ id: t.id, depth: t.depth, x: PAD + t.depth * col, y: HEAD + (t.start + t.span / 2) * unit - unit / 2 + (unit - BOX.h) / 2 }));
    const bands = Array.from({ length: levels }, (_, i) => ({ depth: i, x: PAD + i * col - (col - BOX.w) / 2, y: 0, w: col, h: height }));
    return { kind, placed, edges, bands, rings: [], cx: 0, cy: 0, width: PAD * 2 + levels * col - (col - BOX.w), height };
  }

  // Radial: the root in the middle, each level on its own ring, angles shared out by leaf count.
  const leaves = tree.span;
  const angleOf = (t: Tree) => ((t.start + t.span / 2) / leaves) * Math.PI * 2 - Math.PI / 2;
  const byDepth = new Map<number, Tree[]>();
  for (const t of all) (byDepth.get(t.depth) ?? byDepth.set(t.depth, []).get(t.depth)!).push(t);
  const radii: number[] = [0];
  // Centres closer than a box diagonal could overlap, so rings and neighbours are kept at least that far apart.
  const diag = Math.hypot(BOX.w, BOX.h) + 8;
  const step = diag + 22;
  const maxDepthSeen = Math.max(...all.map((t) => t.depth));
  for (let d = 1; d <= maxDepthSeen; d++) {
    const row = (byDepth.get(d) ?? []).map(angleOf).sort((a, b) => a - b);
    let need = radii[d - 1]! + step;
    if (row.length > 1) {
      let minGap = Math.PI * 2 - (row[row.length - 1]! - row[0]!);
      for (let i = 1; i < row.length; i++) minGap = Math.min(minGap, row[i]! - row[i - 1]!);
      // Neighbours on a ring need about a box width between them.
      need = Math.max(need, diag / (2 * Math.sin(Math.min(Math.max(minGap, 0.01), Math.PI) / 2)));
    }
    radii.push(need);
  }
  const R = radii[radii.length - 1]!;
  const size = (R + BOX.w / 2 + PAD) * 2;
  const cx = size / 2, cy = size / 2;
  const placed = all.map((t) => {
    const r = radii[t.depth] ?? 0;
    const a = angleOf(t);
    return { id: t.id, depth: t.depth, x: cx + Math.cos(a) * r - BOX.w / 2, y: cy + Math.sin(a) * r - BOX.h / 2 };
  });
  const rings = radii.map((r, depth) => ({ depth, r }));
  return { kind, placed, edges, bands: [], rings, cx, cy, width: size, height: size };
}

/** Where an edge starts and ends, as an SVG path. */
export function edgePath(kind: LayoutKind, a: Placed, b: Placed): string {
  const ax = a.x + BOX.w / 2, ay = a.y + BOX.h / 2, bx = b.x + BOX.w / 2, by = b.y + BOX.h / 2;
  if (kind === "down") {
    const y1 = a.y + BOX.h, y2 = b.y, m = (y1 + y2) / 2;
    return `M${ax} ${y1} C${ax} ${m} ${bx} ${m} ${bx} ${y2}`;
  }
  if (kind === "right") {
    const x1 = a.x + BOX.w, x2 = b.x, m = (x1 + x2) / 2;
    return `M${x1} ${ay} C${m} ${ay} ${m} ${by} ${x2} ${by}`;
  }
  return `M${ax} ${ay} L${bx} ${by}`;
}
