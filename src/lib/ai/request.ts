import type { SummarizeInput, SummaryLength } from "./types";

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
