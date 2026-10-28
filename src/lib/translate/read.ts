/**
 * Reading a document into translatable blocks, and (for formats where it is practical) writing the translation
 * back into the same kind of file with the layout kept. Everything runs in the browser.
 * Pure functions over strings and zip files, unit-tested with small generated documents.
 */
import type { Lang } from "./languages";
import { isRtl } from "./languages";
import type { DocBlock } from "./document";

export type Format = "pdf" | "docx" | "pptx" | "xlsx" | "odf" | "rtf" | "html" | "csv" | "subtitles" | "markdown" | "text";

export interface ReadResult {
  format: Format;
  blocks: DocBlock[];
  /** Pages, slides or sheets (1 for plain text). */
  pages: number;
  /** Writes the translated blocks back into a file like the original; null when the format has no such writer. */
  rebuild: ((texts: string[], target: Lang) => Promise<Blob>) | null;
  /** File extension for the rebuilt file. */
  ext: string;
}

export type ReadErrorCode = "unsupported" | "legacy" | "invalid" | "encrypted";
export class ReadError extends Error {
  constructor(readonly code: ReadErrorCode) {
    super(code);
    this.name = "ReadError";
  }
}

export const READABLE_EXTENSIONS = ["pdf", "docx", "pptx", "xlsx", "odt", "odp", "ods", "rtf", "html", "htm", "csv", "tsv", "srt", "vtt", "md", "markdown", "txt", "log"] as const;
/** Old binary Office formats that cannot be read here: the person should save them in the newer format. */
const LEGACY = new Set(["doc", "xls", "ppt", "pages", "numbers", "key"]);

export const extensionOf = (name: string): string => /\.([A-Za-z0-9]+)$/.exec(name)?.[1]?.toLowerCase() ?? "";

// ---------------------------------------------------------------------------------------------------------------------
// Small XML helpers (these formats are simple enough that patterns are safer than a DOM, and work in tests too).

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e] ?? m;
  });
}
export const escapeXml = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const hasLetters = (s: string) => /\p{L}/u.test(s);
const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/** Joins the text of every `<tag>…</tag>` in a piece of XML. */
function textOf(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([^<]*)</${tag}>`, "g");
  let out = "";
  for (const m of xml.matchAll(re)) out += decodeEntities(m[1]!);
  return out;
}

/** Puts `text` in the first `<tag>` of `xml` and empties the rest, so the runs keep their formatting. */
function putText(xml: string, tag: string, text: string): string {
  let first = true;
  const re = new RegExp(`<${tag}(\\s[^>]*)?>([^<]*)</${tag}>`, "g");
  return xml.replace(re, () => {
    if (first) {
      first = false;
      return `<${tag} xml:space="preserve">${escapeXml(text)}</${tag}>`;
    }
    return `<${tag}></${tag}>`;
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// Zip-based Office formats

async function openZip(file: File | Blob): Promise<import("jszip")> {
  const JSZip = (await import("jszip")).default;
  try {
    return await JSZip.loadAsync(await file.arrayBuffer());
  } catch {
    throw new ReadError("invalid");
  }
}

/** Word's paragraph properties must list their children in a fixed order, so `<w:bidi/>` goes after the ones that come before it. */
const PPR_BEFORE_BIDI = new Set(["pStyle", "keepNext", "keepLines", "pageBreakBefore", "framePr", "widowControl", "numPr", "suppressLineNumbers", "pBdr", "shd", "tabs", "suppressAutoHyphens", "kinsoku", "wordWrap", "overflowPunct", "topLinePunct", "autoSpaceDE", "autoSpaceDN"]);

export function addBidi(paragraph: string): string {
  if (/<w:bidi[\s/>]/.test(paragraph)) return paragraph;
  const open = /<w:pPr>([\s\S]*?)<\/w:pPr>/.exec(paragraph);
  if (!open) return paragraph.replace(/^(<w:p(?:\s[^>]*)?>)/, "$1<w:pPr><w:bidi/></w:pPr>");
  // Find where the children that must come before bidi end.
  const inner = open[1]!;
  let at = 0;
  for (const child of inner.matchAll(/<w:(\w+)(?:\s[^>]*)?(?:\/>|>[\s\S]*?<\/w:\1>)/g)) {
    if (PPR_BEFORE_BIDI.has(child[1]!)) at = child.index! + child[0].length;
  }
  const next = inner.slice(0, at) + "<w:bidi/>" + inner.slice(at);
  return paragraph.replace(open[0], `<w:pPr>${next}</w:pPr>`);
}

async function readDocx(file: File): Promise<ReadResult> {
  const zip = await openZip(file);
  const entry = zip.file("word/document.xml");
  if (!entry) throw new ReadError("invalid");
  const xml = await entry.async("string");
  const blocks: DocBlock[] = [];
  const paragraphs = [...xml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)];
  for (const m of paragraphs) {
    const text = clean(textOf(m[0], "w:t"));
    if (!text || !hasLetters(text)) continue;
    const style = /<w:pStyle\s+w:val="([^"]*)"/.exec(m[0])?.[1] ?? "";
    const level = /^(?:Heading|heading)\s*([1-9])$/.exec(style)?.[1] ?? (/^title$/i.test(style) ? "1" : "");
    blocks.push({ kind: level ? "heading" : "paragraph", level: (Math.min(Number(level) || 1, 3)) as 1 | 2 | 3, text, center: /<w:jc\s+w:val="center"/.test(m[0]), page: 1 });
  }
  return {
    format: "docx",
    blocks,
    pages: 1,
    ext: "docx",
    async rebuild(texts, target) {
      let k = 0;
      const out = xml.replace(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g, (p) => {
        const text = clean(textOf(p, "w:t"));
        if (!text || !hasLetters(text)) return p;
        const translated = texts[k++] ?? text;
        const written = putText(p, "w:t", translated);
        return isRtl(target) ? addBidi(written) : written;
      });
      zip.file("word/document.xml", out);
      return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    },
  };
}

async function readPptx(file: File): Promise<ReadResult> {
  const zip = await openZip(file);
  const slides = Object.keys(zip.files)
    .map((n) => ({ n, no: Number(/^ppt\/slides\/slide(\d+)\.xml$/.exec(n)?.[1] ?? NaN) }))
    .filter((s) => Number.isFinite(s.no))
    .sort((a, b) => a.no - b.no);
  if (slides.length === 0) throw new ReadError("invalid");
  const xmls = await Promise.all(slides.map((s) => zip.file(s.n)!.async("string")));
  const blocks: DocBlock[] = [];
  xmls.forEach((xml, i) => {
    for (const m of xml.matchAll(/<a:p(?:\s[^>]*)?>[\s\S]*?<\/a:p>/g)) {
      const text = clean(textOf(m[0], "a:t"));
      if (text && hasLetters(text)) blocks.push({ kind: "paragraph", level: 1, text, center: false, page: i + 1 });
    }
  });
  return {
    format: "pptx",
    blocks,
    pages: slides.length,
    ext: "pptx",
    async rebuild(texts, target) {
      let k = 0;
      slides.forEach((s, i) => {
        const out = xmls[i]!.replace(/<a:p(?:\s[^>]*)?>[\s\S]*?<\/a:p>/g, (p) => {
          const text = clean(textOf(p, "a:t"));
          if (!text || !hasLetters(text)) return p;
          let written = putText(p, "a:t", texts[k++] ?? text);
          if (isRtl(target)) {
            written = /<a:pPr(?:\s[^>]*)?\/?>/.test(written)
              ? written.replace(/<a:pPr((?:\s[^>]*?)?)(\/?)>/, (m, attrs: string, slash: string) => (/\srtl="/.test(attrs) ? m : `<a:pPr${attrs} rtl="1"${slash}>`))
              : written.replace(/^(<a:p(?:\s[^>]*)?>)/, '$1<a:pPr rtl="1"/>');
          }
          return written;
        });
        zip.file(s.n, out);
      });
      return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
    },
  };
}

async function readXlsx(file: File): Promise<ReadResult> {
  const zip = await openZip(file);
  const entry = zip.file("xl/sharedStrings.xml");
  if (!entry) {
    if (!zip.file("xl/workbook.xml")) throw new ReadError("invalid");
    return { format: "xlsx", blocks: [], pages: 1, ext: "xlsx", rebuild: null };
  }
  const xml = await entry.async("string");
  const withoutPhonetic = (si: string) => si.replace(/<rPh[\s\S]*?<\/rPh>/g, "");
  const blocks: DocBlock[] = [];
  for (const m of xml.matchAll(/<si>[\s\S]*?<\/si>/g)) {
    const text = clean(textOf(withoutPhonetic(m[0]), "t"));
    if (text && hasLetters(text)) blocks.push({ kind: "paragraph", level: 1, text, center: false, page: 1 });
  }
  return {
    format: "xlsx",
    blocks,
    pages: 1,
    ext: "xlsx",
    async rebuild(texts) {
      let k = 0;
      const out = xml.replace(/<si>[\s\S]*?<\/si>/g, (si) => {
        const text = clean(textOf(withoutPhonetic(si), "t"));
        if (!text || !hasLetters(text)) return si;
        return putText(withoutPhonetic(si), "t", texts[k++] ?? text);
      });
      zip.file("xl/sharedStrings.xml", out);
      return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    },
  };
}

async function readOdf(file: File): Promise<ReadResult> {
  const zip = await openZip(file);
  const entry = zip.file("content.xml");
  if (!entry) throw new ReadError("invalid");
  const xml = await entry.async("string");
  const blocks: DocBlock[] = [];
  for (const m of xml.matchAll(/<text:(p|h)(?:\s[^>]*)?>([\s\S]*?)<\/text:\1>/g)) {
    const inner = m[2]!.replace(/<text:(?:s|tab|line-break)\s*\/>/g, " ").replace(/<[^>]+>/g, "");
    const text = clean(decodeEntities(inner));
    if (text && hasLetters(text)) blocks.push({ kind: m[1] === "h" ? "heading" : "paragraph", level: 1, text, center: false, page: 1 });
  }
  return { format: "odf", blocks, pages: 1, rebuild: null, ext: "" };
}

// ---------------------------------------------------------------------------------------------------------------------
// RTF, HTML and plain-text family

/** RTF to plain lines: drops the header tables and pictures, turns \par into line breaks, decodes \'hh and \uN. */
export function rtfToLines(rtf: string): string[] {
  let s = rtf;
  // Remove groups that hold no body text.
  for (const dest of ["fonttbl", "colortbl", "stylesheet", "info", "pict", "header", "footer", "\\*"]) {
    const re = new RegExp(`\\{\\\\${dest === "\\*" ? "\\*" : dest}[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\}`, "g");
    s = s.replace(re, "");
  }
  const out: string[] = [];
  let line = "";
  const re = /\\par[d]?(?![a-z])|\\line(?![a-z])|\\'([0-9a-fA-F]{2})|\\u(-?\d+)\??|\\([a-zA-Z]+)-?\d* ?|\\([\\{}])|[{}]|([^\\{}]+)/g;
  for (const m of s.matchAll(re)) {
    if (/^\\par/.test(m[0]) || /^\\line/.test(m[0])) { out.push(line); line = ""; }
    else if (m[1]) line += new TextDecoder("windows-1252").decode(Uint8Array.of(parseInt(m[1], 16)));
    else if (m[2]) line += String.fromCharCode(Number(m[2]) < 0 ? Number(m[2]) + 65536 : Number(m[2]));
    else if (m[4]) line += m[4];
    else if (m[5]) line += m[5];
  }
  out.push(line);
  return out.map((l) => l.replace(/\r?\n/g, " ")).map(clean).filter(Boolean);
}

function readRtf(text: string): ReadResult {
  const blocks: DocBlock[] = rtfToLines(text).filter(hasLetters).map((t) => ({ kind: "paragraph" as const, level: 1 as const, text: t, center: false, page: 1 }));
  return { format: "rtf", blocks, pages: 1, rebuild: null, ext: "" };
}

function readHtml(html: string): ReadResult {
  const tokens = html.split(/(<!--[\s\S]*?-->|<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>)/i);
  const blocks: DocBlock[] = [];
  const at: number[] = [];
  let heading = 0;
  tokens.forEach((tok, i) => {
    if (i % 2 === 1) {
      const h = /^<(\/?)h([1-6])[\s>]/i.exec(tok);
      if (h) heading = h[1] ? 0 : Number(h[2]);
      return;
    }
    const text = clean(decodeEntities(tok));
    if (!text || !hasLetters(text)) return;
    blocks.push({ kind: heading ? "heading" : "paragraph", level: Math.min(heading || 1, 3) as 1 | 2 | 3, text, center: false, page: 1 });
    at.push(i);
  });
  return {
    format: "html",
    blocks,
    pages: 1,
    ext: "html",
    async rebuild(texts, target) {
      const out = [...tokens];
      at.forEach((i, k) => {
        const original = tokens[i]!;
        const lead = /^\s*/.exec(original)![0];
        const trail = /\s*$/.exec(original)![0];
        out[i] = lead + escapeXml(texts[k] ?? "") + trail;
      });
      let result = out.join("");
      result = result.replace(/<html(\s[^>]*)?>/i, (m, attrs: string | undefined) => `<html${(attrs ?? "").replace(/\s(?:lang|dir)="[^"]*"/gi, "")} lang="${target}" dir="${isRtl(target) ? "rtl" : "ltr"}">`);
      return new Blob([result], { type: "text/html;charset=utf-8" });
    },
  };
}

/** Comma- or tab-separated values: every cell with letters is a block, numbers and codes are left alone. */
export function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === "") quoted = true;
    else if (c === delimiter) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
export function writeCsv(rows: string[][], delimiter: string): string {
  const q = (c: string) => (c.includes(delimiter) || /["\r\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c);
  return rows.map((r) => r.map(q).join(delimiter)).join("\r\n") + "\r\n";
}

function readCsv(text: string, delimiter: string, ext: string): ReadResult {
  const rows = parseCsv(text, delimiter);
  const blocks: DocBlock[] = [];
  const at: [number, number][] = [];
  rows.forEach((r, y) => r.forEach((c, x) => {
    const t = clean(c);
    if (t && hasLetters(t)) { blocks.push({ kind: "paragraph", level: 1, text: t, center: false, page: 1 }); at.push([y, x]); }
  }));
  return {
    format: "csv",
    blocks,
    pages: 1,
    ext,
    async rebuild(texts) {
      const out = rows.map((r) => [...r]);
      at.forEach(([y, x], k) => { out[y]![x] = texts[k] ?? out[y]![x]!; });
      return new Blob(["﻿" + writeCsv(out, delimiter)], { type: "text/csv;charset=utf-8" });
    },
  };
}

/** SubRip and WebVTT: only the spoken lines are translated; numbers, times and cue settings stay. */
function readSubtitles(text: string, ext: string): ReadResult {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: DocBlock[] = [];
  const at: number[] = [];
  let inCue = false;
  lines.forEach((l, i) => {
    if (l.includes("-->")) { inCue = true; return; }
    if (!l.trim()) { inCue = false; return; }
    if (!inCue || /^WEBVTT|^NOTE\b/.test(l)) return;
    const t = clean(l.replace(/<[^>]+>/g, ""));
    if (t && hasLetters(t)) { blocks.push({ kind: "paragraph", level: 1, text: t, center: false, page: 1 }); at.push(i); }
  });
  return {
    format: "subtitles",
    blocks,
    pages: 1,
    ext,
    async rebuild(texts) {
      const out = [...lines];
      at.forEach((i, k) => { out[i] = texts[k] ?? out[i]!; });
      return new Blob([out.join("\n")], { type: "text/plain;charset=utf-8" });
    },
  };
}

/** Plain text and Markdown: each line is a block; Markdown markers (#, -, 1., >) and code blocks are kept as they are. */
function readLines(text: string, markdown: boolean, ext: string): ReadResult {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: DocBlock[] = [];
  const at: { i: number; prefix: string }[] = [];
  let fence = false;
  lines.forEach((l, i) => {
    if (markdown && /^\s*(```|~~~)/.test(l)) { fence = !fence; return; }
    if (fence) return;
    let prefix = "";
    let body = l;
    let heading = 0;
    if (markdown) {
      const m = /^(\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+|>\s*)+)/.exec(l);
      if (m) { prefix = m[1]!; body = l.slice(prefix.length); heading = /^\s*(#{1,6})\s/.exec(prefix)?.[1]?.length ?? 0; }
    }
    const t = body.trim();
    if (!t || !hasLetters(t)) return;
    blocks.push({ kind: heading ? "heading" : "paragraph", level: Math.min(heading || 1, 3) as 1 | 2 | 3, text: t, center: false, page: 1 });
    at.push({ i, prefix });
  });
  return {
    format: markdown ? "markdown" : "text",
    blocks,
    pages: 1,
    ext,
    async rebuild(texts) {
      const out = [...lines];
      at.forEach(({ i, prefix }, k) => { out[i] = prefix + (texts[k] ?? ""); });
      return new Blob([out.join("\n")], { type: "text/plain;charset=utf-8" });
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------

/** Decodes text files: UTF-8 (with or without a byte-order mark) or, failing that, UTF-16 or Windows-1252. */
export function decodeText(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(bytes);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

/** Reads any supported file. PDFs are handled by the caller (they need the PDF engine); everything else is here. */
export async function readFile(file: File): Promise<ReadResult> {
  const ext = extensionOf(file.name);
  if (LEGACY.has(ext)) throw new ReadError("legacy");
  switch (ext) {
    case "docx": return readDocx(file);
    case "pptx": return readPptx(file);
    case "xlsx": return readXlsx(file);
    case "odt": case "odp": case "ods": return readOdf(file);
  }
  if (!(READABLE_EXTENSIONS as readonly string[]).includes(ext)) throw new ReadError("unsupported");
  const text = decodeText(new Uint8Array(await file.arrayBuffer()));
  switch (ext) {
    case "rtf": return readRtf(text);
    case "html": case "htm": return readHtml(text);
    case "csv": return readCsv(text, ",", "csv");
    case "tsv": return readCsv(text, "\t", "tsv");
    case "srt": case "vtt": return readSubtitles(text, ext);
    case "md": case "markdown": return readLines(text, true, ext);
    default: return readLines(text, false, ext || "txt");
  }
}
