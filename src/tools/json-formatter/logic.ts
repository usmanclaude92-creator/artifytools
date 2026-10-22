export const MAX_JSON_CHARS = 5_000_000;

export interface JsonError {
  message: string;
  line: number;
  column: number;
}

export type JsonResult =
  | { ok: true; output: string; stats: { keys: number; depth: number; bytes: number } }
  | { ok: false; error: JsonError };

export type Indent = 2 | 4 | "tab";

function lineCol(text: string, pos: number): { line: number; column: number } {
  const before = text.slice(0, Math.max(0, Math.min(pos, text.length)));
  const line = before.split("\n").length;
  const column = pos - (before.lastIndexOf("\n") + 1) + 1;
  return { line, column };
}

interface Found {
  message: string;
  pos: number;
}

/**
 * Strict RFC 8259 validator that explains *where* and *why* parsing fails, with
 * the same wording in every browser (native JSON.parse messages differ).
 * It only runs after JSON.parse has already rejected the input.
 */
export function findJsonError(text: string): Found | null {
  let i = 0;
  const n = text.length;
  const ws = () => {
    while (i < n && (text[i] === " " || text[i] === "\t" || text[i] === "\n" || text[i] === "\r")) i++;
  };
  const describe = (c: string | undefined) =>
    c === undefined ? "end of input" : c === "'" ? "a single quote (JSON strings use double quotes)" : `"${c}"`;
  const fail = (message: string, pos = i): never => {
    throw { message, pos } satisfies Found;
  };

  function value(): void {
    ws();
    const c = text[i];
    if (c === undefined) fail("Unexpected end of input — expected a value");
    else if (c === "{") object();
    else if (c === "[") array();
    else if (c === '"') string();
    else if (c === "-" || (c !== undefined && c >= "0" && c <= "9")) number();
    else if (text.startsWith("true", i)) i += 4;
    else if (text.startsWith("false", i)) i += 5;
    else if (text.startsWith("null", i)) i += 4;
    else fail(`Unexpected ${describe(c)} — expected a value`);
  }
  function object(): void {
    i++; // {
    ws();
    if (text[i] === "}") { i++; return; }
    for (;;) {
      ws();
      if (text[i] !== '"') {
        if (text[i] === "}") fail("Trailing comma — remove the comma before the closing brace");
        fail(`Expected a property name in double quotes, found ${describe(text[i])}`);
      }
      string();
      ws();
      if (text[i] !== ":") fail(`Expected ":" after the property name, found ${describe(text[i])}`);
      i++;
      value();
      ws();
      if (text[i] === ",") { i++; continue; }
      if (text[i] === "}") { i++; return; }
      fail(`Expected "," or "}" after the value, found ${describe(text[i])}`);
    }
  }
  function array(): void {
    i++; // [
    ws();
    if (text[i] === "]") { i++; return; }
    for (;;) {
      ws();
      if (text[i] === "]") fail("Trailing comma — remove the comma before the closing bracket");
      value();
      ws();
      if (text[i] === ",") { i++; continue; }
      if (text[i] === "]") { i++; return; }
      fail(`Expected "," or "]" after the value, found ${describe(text[i])}`);
    }
  }
  function string(): void {
    const start = i;
    i++; // opening quote
    while (i < n) {
      const c = text[i]!;
      if (c === '"') { i++; return; }
      if (c === "\\") {
        const e = text[i + 1];
        if (e === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) fail("Invalid \\u escape — expected four hex digits", i);
          i += 6;
        } else if (e !== undefined && '"\\/bfnrt'.includes(e)) i += 2;
        else fail(`Invalid escape sequence "\\${e ?? ""}"`, i);
      } else if (c < " ") {
        fail("Unescaped control character in string (use \\n or \\t instead)", i);
      } else i++;
    }
    fail("Unterminated string — missing closing double quote", start);
  }
  function number(): void {
    const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i));
    if (!m) fail('Invalid number — a "-" must be followed by digits');
    else {
      if (/^-?0\d/.test(text.slice(i))) fail("Invalid number — leading zeros are not allowed");
      i += m[0].length;
    }
  }

  try {
    value();
    ws();
    if (i < n) fail(`Unexpected ${describe(text[i])} after the end of the JSON value`);
    return null;
  } catch (e) {
    if (e && typeof e === "object" && "pos" in e) return e as Found;
    throw e;
  }
}

function measure(value: unknown, depth = 1): { keys: number; depth: number } {
  if (Array.isArray(value)) {
    let keys = 0;
    let max = depth;
    for (const v of value) {
      const m = measure(v, depth + 1);
      keys += m.keys;
      max = Math.max(max, m.depth);
    }
    return { keys, depth: max };
  }
  if (value && typeof value === "object") {
    let keys = 0;
    let max = depth;
    for (const v of Object.values(value)) {
      keys += 1;
      const m = measure(v, depth + 1);
      keys += m.keys;
      max = Math.max(max, m.depth);
    }
    return { keys, depth: max };
  }
  return { keys: 0, depth };
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
        .map((k) => [k, sortKeysDeep((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

export function processJson(
  text: string,
  mode: "format" | "minify" | "validate",
  opts: { indent: Indent; sortKeys: boolean },
): JsonResult {
  if (text.length > MAX_JSON_CHARS) {
    return { ok: false, error: { message: `Input is too large (limit ${MAX_JSON_CHARS.toLocaleString("en-US")} characters).`, line: 1, column: 1 } };
  }
  if (!text.trim()) {
    return { ok: false, error: { message: "Paste or type some JSON to get started.", line: 1, column: 1 } };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const found = findJsonError(text);
    const pos = found?.pos ?? 0;
    return {
      ok: false,
      error: { message: found?.message ?? "This isn't valid JSON.", ...lineCol(text, pos) },
    };
  }
  const value = opts.sortKeys ? sortKeysDeep(parsed) : parsed;
  const space = opts.indent === "tab" ? "\t" : opts.indent;
  const output = mode === "minify" ? JSON.stringify(value) : JSON.stringify(value, null, space);
  const m = measure(parsed);
  return {
    ok: true,
    output: mode === "validate" ? "" : output,
    stats: { keys: m.keys, depth: m.depth, bytes: new TextEncoder().encode(text).length },
  };
}
