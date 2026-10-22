export type SortMode = "none" | "asc" | "desc";

export interface DedupeOptions {
  caseSensitive: boolean;
  trimLines: boolean;
  keepBlank: boolean;
  sort: SortMode;
}

export interface DedupeResult {
  output: string;
  totalLines: number;
  uniqueLines: number;
  removed: number;
}

export function removeDuplicateLines(input: string, o: DedupeOptions): DedupeResult {
  if (input === "") return { output: "", totalLines: 0, uniqueLines: 0, removed: 0 };
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const raw of lines) {
    const line = o.trimLines ? raw.trim() : raw;
    if (line === "" ) {
      if (o.keepBlank) kept.push(line);
      continue;
    }
    const key = o.caseSensitive ? line : line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(line);
  }
  if (o.sort !== "none") {
    const collator = new Intl.Collator(undefined, { sensitivity: o.caseSensitive ? "variant" : "base", numeric: true });
    kept.sort((a, b) => (o.sort === "asc" ? collator.compare(a, b) : collator.compare(b, a)));
  }
  const nonBlankKept = kept.filter((l) => l !== "").length;
  const nonBlankTotal = lines.filter((l) => (o.trimLines ? l.trim() : l) !== "").length;
  return {
    output: kept.join("\n"),
    totalLines: lines.length,
    uniqueLines: nonBlankKept,
    removed: nonBlankTotal - nonBlankKept,
  };
}
