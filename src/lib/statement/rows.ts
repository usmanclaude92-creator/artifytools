import type { TextItem } from "@/lib/pdf/text-layout";

/** Row lines (page y values, ascending) that split a table into one transaction per band. */
export function mergeRows(items: TextItem[], rowLines: number[], colEdges: number[]): TextItem[] {
  if (rowLines.length === 0) return items;
  const cuts = [...rowLines].sort((a, b) => a - b);
  const bandOf = (it: TextItem) => {
    const y = it.y - it.size * 0.3;
    let k = 0;
    while (k < cuts.length && y > cuts[k]!) k++;
    return k;
  };
  const colOf = (it: TextItem) => {
    const cx = it.x + it.width / 2;
    let k = 0;
    while (k < colEdges.length && cx > colEdges[k]!) k++;
    return k;
  };
  const groups = new Map<string, TextItem[]>();
  for (const it of items) {
    if (!it.str.trim()) continue;
    const key = `${bandOf(it)}:${colOf(it)}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(it);
  }
  const out: TextItem[] = [];
  const firstY = new Map<number, number>();
  for (const [key, list] of groups) {
    const band = Number(key.split(":")[0]);
    list.sort((a, b) => a.y - b.y || a.x - b.x);
    const y = Math.min(...list.map((i) => i.y));
    firstY.set(band, Math.min(firstY.get(band) ?? Infinity, y));
  }
  for (const [key, list] of groups) {
    const band = Number(key.split(":")[0]);
    const x0 = Math.min(...list.map((i) => i.x));
    const x1 = Math.max(...list.map((i) => i.x + i.width));
    const head = list[0]!;
    out.push({ ...head, str: list.map((i) => i.str.trim()).join(" "), x: x0, width: x1 - x0, y: firstY.get(band)! });
  }
  return out.sort((a, b) => a.y - b.y || a.x - b.x);
}

/** Row lines halfway between the text lines found inside a table's vertical range. */
export function autoRowLines(items: TextItem[], y0: number, y1: number): number[] {
  const ys = items.filter((i) => i.str.trim()).map((i) => i.y - i.size * 0.3).filter((y) => y >= y0 && y <= y1).sort((a, b) => a - b);
  const rows: number[] = [];
  for (const y of ys) if (rows.length === 0 || y - rows[rows.length - 1]! > 3) rows.push(y);
  return rows.slice(0, -1).map((y, i) => (y + rows[i + 1]!) / 2);
}
