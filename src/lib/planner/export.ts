import { BOX, edgePath, layout, type LayoutKind } from "./layout";
import { depths, nodeById, type PlannerData, type Status } from "./model";

export interface ExportText { status: Record<Status, string> }

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const STATUS_COLOR: Record<Status, string> = { none: "#94a3b8", todo: "#64748b", doing: "#2563eb", done: "#0f9d6b", blocked: "#dc2626" };

/** Cuts a title into at most two lines of about `max` characters. */
export function wrapTitle(title: string, max = 24): string[] {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  if (lines.length > 2) { lines.length = 2; lines[1] = `${lines[1]!.slice(0, max - 1)}…`; }
  return lines.map((l) => (l.length > max + 4 ? `${l.slice(0, max)}…` : l));
}

/** A standalone SVG of the plan in the chosen layout, on a white page (prints and pastes well). */
export function toSvg(data: PlannerData, kind: LayoutKind, rtl = false): string {
  const l = layout(data, kind);
  const dep = depths(data);
  const pos = new Map(l.placed.map((p) => [p.id, p]));
  const parts: string[] = [];
  const font = `font-family="system-ui, 'Segoe UI', Tahoma, Arial, sans-serif"`;
  const dir = rtl ? ` direction="rtl"` : "";
  for (const b of l.bands) {
    const lv = data.levels[b.depth];
    if (!lv) continue;
    parts.push(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${lv.color}" fill-opacity="0.07"/>`);
    if (kind === "down") {
      parts.push(`<line x1="0" y1="${b.y + b.h}" x2="${b.w}" y2="${b.y + b.h}" stroke="${lv.color}" stroke-opacity="0.45"/>`);
      parts.push(`<text x="${rtl ? b.w - 12 : 12}" y="${b.y + b.h / 2 + 5}" ${font} font-size="16" font-weight="700" fill="${lv.color}" text-anchor="${rtl ? "end" : "start"}">${esc(lv.name)}</text>`);
    } else {
      parts.push(`<line x1="${b.x + b.w}" y1="0" x2="${b.x + b.w}" y2="${b.h}" stroke="${lv.color}" stroke-opacity="0.45"/>`);
      parts.push(`<text x="${b.x + 12}" y="22" ${font} font-size="16" font-weight="700" fill="${lv.color}">${esc(lv.name)}</text>`);
    }
  }
  for (const r of l.rings) {
    const lv = data.levels[r.depth];
    if (!lv || r.r === 0) continue;
    parts.push(`<circle cx="${l.cx}" cy="${l.cy}" r="${r.r}" fill="none" stroke="${lv.color}" stroke-opacity="0.35" stroke-dasharray="6 6"/>`);
    parts.push(`<text x="${l.cx}" y="${l.cy - r.r - BOX.h / 2 - 6}" ${font} font-size="15" font-weight="700" fill="${lv.color}" text-anchor="middle">${esc(lv.name)}</text>`);
  }
  for (const e of l.edges) {
    const a = pos.get(e.from), b = pos.get(e.to);
    if (a && b) parts.push(`<path d="${edgePath(kind, a, b)}" fill="none" stroke="#94a3b8" stroke-width="1.5"/>`);
  }
  for (const p of l.placed) {
    const n = nodeById(data, p.id);
    if (!n) continue;
    const lv = data.levels[dep.get(n.id) ?? 0];
    const color = lv?.color ?? "#7c3aed";
    const lines = wrapTitle(n.title || "…");
    parts.push(`<g transform="translate(${p.x} ${p.y})"><rect width="${BOX.w}" height="${BOX.h}" rx="10" fill="#ffffff" stroke="${color}" stroke-width="1.5"/><rect width="${BOX.w}" height="6" rx="3" fill="${color}"/>`);
    lines.forEach((t, i) => parts.push(`<text x="${rtl ? BOX.w - 12 : 12}" y="${28 + i * 17}" ${font} font-size="13.5" font-weight="600" fill="#1f1630" text-anchor="${rtl ? "end" : "start"}">${esc(t)}</text>`));
    if (n.status !== "none") parts.push(`<circle cx="${rtl ? BOX.w - 16 : 16}" cy="${BOX.h - 14}" r="5" fill="${STATUS_COLOR[n.status]}"/>`);
    if (n.due) parts.push(`<text x="${rtl ? BOX.w - 28 : 28}" y="${BOX.h - 10}" ${font} font-size="11" fill="#5f5873" text-anchor="${rtl ? "end" : "start"}">${esc(n.due)}</text>`);
    parts.push("</g>");
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(l.width)}" height="${Math.ceil(l.height)}" viewBox="0 0 ${Math.ceil(l.width)} ${Math.ceil(l.height)}"${dir}><rect width="100%" height="100%" fill="#ffffff"/>${parts.join("")}</svg>`;
}
