import { TRANSLATE_LANGUAGES, type SummarizeInput, type SummaryLength, type TranslateInput, type TranslateLanguage } from "./types";

export const MAX_SUMMARY_INPUT_CHARS = 20_000;
export const MAX_REQUEST_BYTES = 100_000;
const LENGTHS: SummaryLength[] = ["short", "medium", "long"];

export type ParsedRequest = { ok: true; input: SummarizeInput } | { ok: false; status: number; message: string };

export function parseSummarizeRequest(body: unknown): ParsedRequest {
  if (!body || typeof body !== "object") return { ok: false, status: 400, message: "Request body must be a JSON object." };
  const { text, length } = body as Record<string, unknown>;
  if (typeof text !== "string" || !text.trim()) return { ok: false, status: 400, message: "Provide some text to summarize." };
  if (text.length > MAX_SUMMARY_INPUT_CHARS) {
    return { ok: false, status: 413, message: `Text is too long (limit ${MAX_SUMMARY_INPUT_CHARS.toLocaleString("en-US")} characters).` };
  }
  if (typeof length !== "string" || !LENGTHS.includes(length as SummaryLength)) {
    return { ok: false, status: 400, message: "Length must be short, medium, or long." };
  }
  return { ok: true, input: { text: text.trim(), length: length as SummaryLength } };
}

/** One translate request: a chunk of a document. The client splits longer documents. */
export const MAX_TRANSLATE_CHUNK_CHARS = 6_000;
export const MAX_TRANSLATE_SEGMENTS = 120;

export type ParsedTranslateRequest = { ok: true; input: TranslateInput } | { ok: false; status: number; message: string };

export function parseTranslateRequest(body: unknown): ParsedTranslateRequest {
  if (!body || typeof body !== "object") return { ok: false, status: 400, message: "Request body must be a JSON object." };
  const { segments, target } = body as Record<string, unknown>;
  if (!Array.isArray(segments) || segments.length === 0 || !segments.every((s) => typeof s === "string")) {
    return { ok: false, status: 400, message: "Provide the text to translate." };
  }
  if (segments.length > MAX_TRANSLATE_SEGMENTS || (segments as string[]).reduce((n, s) => n + s.length, 0) > MAX_TRANSLATE_CHUNK_CHARS) {
    return { ok: false, status: 413, message: "This part of the document is too long." };
  }
  if (typeof target !== "string" || !TRANSLATE_LANGUAGES.includes(target as TranslateLanguage)) {
    return { ok: false, status: 400, message: "Unsupported target language." };
  }
  return { ok: true, input: { segments: segments as string[], target: target as TranslateLanguage } };
}

/** Reads the model's reply: a JSON array of strings, the same length as the input. */
export function parseTranslations(reply: string, expected: number): string[] | null {
  const start = reply.indexOf("[");
  const end = reply.lastIndexOf("]");
  if (start < 0 || end <= start) return null;
  try {
    const arr = JSON.parse(reply.slice(start, end + 1)) as unknown;
    if (!Array.isArray(arr) || arr.length !== expected || !arr.every((x) => typeof x === "string")) return null;
    return arr as string[];
  } catch {
    return null;
  }
}
