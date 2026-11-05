/**
 * Adv. Project Planner: a tree of boxes whose levels the user defines.
 * A box's level is its depth in the tree; each level has its own name and colour.
 */

export type Status = "none" | "todo" | "doing" | "done" | "blocked";
export const STATUSES: Status[] = ["none", "todo", "doing", "done", "blocked"];

export interface Level { id: string; name: string; color: string }
export interface Tag { id: string; name: string; color: string }
export interface PNode {
  id: string;
  /** null for the single root. */
  parent: string | null;
  title: string;
  note: string;
  status: Status;
  /** YYYY-MM-DD or empty. */
  due: string;
  tags: string[];
  collapsed: boolean;
}
export interface PlannerData {
  v: 1;
  name: string;
  levels: Level[];
  tags: Tag[];
  /** Sibling order is the order of this list. The first node is the root. */
  nodes: PNode[];
}

/** Mid-tone colours that read on both the light and the dark theme. */
export const PALETTE = ["#7c3aed", "#2563eb", "#0f9d6b", "#d97706", "#db2777", "#0891b2", "#64748b", "#dc2626"];

let counter = 0;
export function uid(prefix = "n"): string {
  counter++;
  return `${prefix}${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const MAX_NODES = 1500;
export const MAX_LEVELS = 12;

export function makeNode(parent: string | null, title: string): PNode {
  return { id: uid(), parent, title, note: "", status: "none", due: "", tags: [], collapsed: false };
}

export function levelColor(i: number): string {
  return PALETTE[i % PALETTE.length]!;
}

export function childrenOf(data: PlannerData, id: string): PNode[] {
  return data.nodes.filter((n) => n.parent === id);
}

export function nodeById(data: PlannerData, id: string): PNode | undefined {
  return data.nodes.find((n) => n.id === id);
}

export function depthOf(data: PlannerData, id: string): number {
  const by = new Map(data.nodes.map((n) => [n.id, n]));
  let d = 0;
  let cur = by.get(id);
  while (cur?.parent) { d++; cur = by.get(cur.parent); if (d > 200) break; }
  return d;
}

/** Depth of every node, in one pass. */
export function depths(data: PlannerData): Map<string, number> {
  const by = new Map(data.nodes.map((n) => [n.id, n]));
  const out = new Map<string, number>();
  const walk = (id: string): number => {
    const known = out.get(id);
    if (known !== undefined) return known;
    const n = by.get(id);
    const d = !n || !n.parent || !by.has(n.parent) ? 0 : walk(n.parent) + 1;
    out.set(id, d);
    return d;
  };
  data.nodes.forEach((n) => walk(n.id));
  return out;
}

export function maxDepth(data: PlannerData): number {
  let m = 0;
  for (const d of depths(data).values()) m = Math.max(m, d);
  return m;
}

/** Makes sure there is a level for every depth in use (adds "Level n" at the end) and the first node is the single root. */
export function normalize(data: PlannerData): PlannerData {
  const levels = [...data.levels];
  const need = maxDepth(data) + 1;
  while (levels.length < need) levels.push({ id: uid("l"), name: `Level ${levels.length + 1}`, color: levelColor(levels.length) });
  return levels.length === data.levels.length ? data : { ...data, levels };
}

export function subtreeIds(data: PlannerData, id: string): Set<string> {
  const out = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const n of data.nodes) if (n.parent && out.has(n.parent) && !out.has(n.id)) { out.add(n.id); grew = true; }
  }
  return out;
}

export function addChild(data: PlannerData, parentId: string, title = ""): { data: PlannerData; id: string } {
  if (data.nodes.length >= MAX_NODES) return { data, id: parentId };
  const node = makeNode(parentId, title);
  // New nodes go after the last descendant of the parent so sibling order stays with the parent.
  const sub = subtreeIds(data, parentId);
  let at = data.nodes.length;
  for (let i = data.nodes.length - 1; i >= 0; i--) if (sub.has(data.nodes[i]!.id)) { at = i + 1; break; }
  const nodes = [...data.nodes.slice(0, at), node, ...data.nodes.slice(at)].map((n) => (n.id === parentId ? { ...n, collapsed: false } : n));
  return { data: normalize({ ...data, nodes }), id: node.id };
}

export function addSibling(data: PlannerData, id: string, title = ""): { data: PlannerData; id: string } {
  const n = nodeById(data, id);
  if (!n || !n.parent) return { data, id };
  if (data.nodes.length >= MAX_NODES) return { data, id };
  const node = makeNode(n.parent, title);
  const sub = subtreeIds(data, id);
  let at = data.nodes.length;
  for (let i = data.nodes.length - 1; i >= 0; i--) if (sub.has(data.nodes[i]!.id)) { at = i + 1; break; }
  return { data: { ...data, nodes: [...data.nodes.slice(0, at), node, ...data.nodes.slice(at)] }, id: node.id };
}

/** Removes a box and everything under it. The root cannot be removed. */
export function removeNode(data: PlannerData, id: string): PlannerData {
  const n = nodeById(data, id);
  if (!n || !n.parent) return data;
  const gone = subtreeIds(data, id);
  return { ...data, nodes: data.nodes.filter((x) => !gone.has(x.id)) };
}

/** Moves a box earlier (-1) or later (+1) among its siblings, together with its descendants. */
export function moveSibling(data: PlannerData, id: string, dir: -1 | 1): PlannerData {
  const n = nodeById(data, id);
  if (!n || !n.parent) return data;
  const sibs = childrenOf(data, n.parent);
  const i = sibs.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= sibs.length) return data;
  const a = subtreeIds(data, sibs[Math.min(i, j)]!.id);
  const b = subtreeIds(data, sibs[Math.max(i, j)]!.id);
  const first = data.nodes.filter((x) => a.has(x.id));
  const second = data.nodes.filter((x) => b.has(x.id));
  const start = data.nodes.findIndex((x) => a.has(x.id));
  const rest = data.nodes.filter((x) => !a.has(x.id) && !b.has(x.id));
  const nodes = [...rest.slice(0, start), ...second, ...first, ...rest.slice(start)];
  return { ...data, nodes };
}

export function updateNode(data: PlannerData, id: string, patch: Partial<Omit<PNode, "id" | "parent">>): PlannerData {
  return { ...data, nodes: data.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) };
}

export function visibleIds(data: PlannerData): Set<string> {
  const hidden = new Set<string>();
  const by = new Map(data.nodes.map((n) => [n.id, n]));
  const out = new Set<string>();
  for (const n of data.nodes) {
    const parent = n.parent ? by.get(n.parent) : undefined;
    if (parent && (hidden.has(parent.id) || parent.collapsed)) hidden.add(n.id);
    else out.add(n.id);
  }
  return out;
}

/** A level can be removed only when it is the last one and no box sits on it. */
export function canRemoveLevel(data: PlannerData, index: number): boolean {
  return data.levels.length > 1 && index === data.levels.length - 1 && maxDepth(data) < index;
}

export function setCollapsedAll(data: PlannerData, collapsed: boolean): PlannerData {
  const withKids = new Set(data.nodes.map((n) => n.parent).filter(Boolean) as string[]);
  return { ...data, nodes: data.nodes.map((n) => (n.parent && withKids.has(n.id) ? { ...n, collapsed } : n.parent === null ? { ...n, collapsed: false } : { ...n, collapsed: false })) };
}

/** "Plan\n  Phase 1\n    Task" → a tree. Indent by spaces or tabs; bullets and numbers are ignored. */
export function parseOutline(text: string, name = "My plan"): PlannerData | null {
  const rows = text
    .split(/\r?\n/)
    .map((raw) => {
      const indent = (raw.match(/^[\t ]*/)![0] ?? "").replace(/\t/g, "  ").length;
      const title = raw.trim().replace(/^([-*•+]|\d+[.)])\s+/, "").slice(0, 200);
      return { indent, title };
    })
    .filter((r) => r.title);
  if (rows.length === 0) return null;
  if (rows.length > MAX_NODES) return null;
  const nodes: PNode[] = [];
  const stack: { indent: number; id: string }[] = [];
  const multi = rows.filter((r) => r.indent === rows[0]!.indent).length > 1;
  let rootId: string | null = null;
  if (multi) {
    const root = makeNode(null, name);
    nodes.push(root);
    rootId = root.id;
    stack.push({ indent: rows[0]!.indent - 1, id: root.id });
  }
  for (const r of rows) {
    while (stack.length && stack[stack.length - 1]!.indent >= r.indent) stack.pop();
    const parent = stack.length ? stack[stack.length - 1]!.id : rootId;
    const node = makeNode(parent, r.title);
    nodes.push(node);
    stack.push({ indent: r.indent, id: node.id });
  }
  return normalize({ v: 1, name, levels: [], tags: [], nodes });
}

// ---------- Starter templates (only examples; everything can be renamed) ----------

function build(name: string, levelNames: string[], outline: string): PlannerData {
  const parsed = parseOutline(outline, name)!;
  const levels = levelNames.map((n, i) => ({ id: uid("l"), name: n, color: levelColor(i) }));
  return normalize({ ...parsed, name, levels });
}

export type TemplateId = "blank" | "project" | "company" | "process";
export const TEMPLATE_IDS: TemplateId[] = ["blank", "project", "company", "process"];

export function template(id: TemplateId, names: { blank: string; project: string; company: string; process: string; root: Record<TemplateId, string>; levels: Record<TemplateId, string[]> }): PlannerData {
  const l = names.levels[id];
  switch (id) {
    case "project":
      return build(names.project, l, [names.root.project, "  Plan", "    Define the scope", "    Agree the budget", "  Build", "    First version", "    Review", "  Launch", "    Announce", "    Collect feedback"].join("\n"));
    case "company":
      return build(names.company, l, [names.root.company, "  Operations", "    Team A", "    Team B", "  Sales", "    Team C", "  Finance", "    Team D"].join("\n"));
    case "process":
      return build(names.process, l, [names.root.process, "  Stage 1", "    Step 1", "    Step 2", "  Stage 2", "    Step 3"].join("\n"));
    default:
      return build(names.blank, l, [names.root.blank, "  Item 1", "  Item 2"].join("\n"));
  }
}

// ---------- Validation of data from storage, files and links ----------

const COLOR = /^#[0-9a-fA-F]{6}$/;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

export function sanitize(input: unknown): PlannerData | null {
  if (!input || typeof input !== "object") return null;
  const d = input as Record<string, unknown>;
  if (!Array.isArray(d.nodes) || !Array.isArray(d.levels)) return null;
  if (d.nodes.length === 0 || d.nodes.length > MAX_NODES || d.levels.length > MAX_LEVELS) return null;
  const levels: Level[] = d.levels.map((l, i) => {
    const o = (l ?? {}) as Record<string, unknown>;
    return { id: str(o.id, 40) || uid("l"), name: str(o.name, 60), color: typeof o.color === "string" && COLOR.test(o.color) ? o.color : levelColor(i) };
  });
  const tags: Tag[] = (Array.isArray(d.tags) ? d.tags : []).slice(0, 40).map((t, i) => {
    const o = (t ?? {}) as Record<string, unknown>;
    return { id: str(o.id, 40) || uid("t"), name: str(o.name, 40), color: typeof o.color === "string" && COLOR.test(o.color) ? o.color : levelColor(i + 2) };
  });
  const tagIds = new Set(tags.map((t) => t.id));
  const ids = new Set<string>();
  const nodes: PNode[] = [];
  for (const raw of d.nodes) {
    const o = (raw ?? {}) as Record<string, unknown>;
    const id = str(o.id, 40);
    if (!id || ids.has(id)) return null;
    ids.add(id);
    const status = STATUSES.includes(o.status as Status) ? (o.status as Status) : "none";
    nodes.push({
      id,
      parent: typeof o.parent === "string" ? o.parent : null,
      title: str(o.title, 200),
      note: str(o.note, 2000),
      status,
      due: typeof o.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.due) ? o.due : "",
      tags: Array.isArray(o.tags) ? o.tags.filter((t): t is string => typeof t === "string" && tagIds.has(t)).slice(0, 20) : [],
      collapsed: o.collapsed === true,
    });
  }
  // One root, every other parent must exist and must come earlier in the list.
  if (nodes[0]!.parent !== null) return null;
  const seen = new Set<string>([nodes[0]!.id]);
  for (const n of nodes.slice(1)) {
    if (!n.parent || !seen.has(n.parent)) return null;
    seen.add(n.id);
  }
  return normalize({ v: 1, name: str(d.name, 80) || "My plan", levels, tags, nodes });
}
