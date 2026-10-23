import { NextResponse, type NextRequest } from "next/server";
import { getAiProvider } from "@/lib/ai";
import { AiProviderError } from "@/lib/ai/types";
import { MAX_REQUEST_BYTES, parseTranslateRequest } from "@/lib/ai/request";
import { rateLimit } from "@/lib/ai/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TIMEOUT_MS = 55_000;
const noStore = { "Cache-Control": "no-store" };

function error(status: number, code: string, message: string, extra: Record<string, string> = {}) {
  return NextResponse.json({ error: code, message }, { status, headers: { ...noStore, ...extra } });
}

export async function POST(req: NextRequest) {
  const provider = getAiProvider();
  if (!provider) return error(503, "not_configured", "AI features aren't configured on this deployment.");

  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return error(403, "forbidden", "Cross-origin requests are not allowed.");

  // A document is sent in parts, so allow more requests than the summarizer, but cap a person's hourly use.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const burst = rateLimit(`translate:${ip}`, 20, 60_000);
  const hourly = burst.allowed ? rateLimit(`translate-hour:${ip}`, 120, 3_600_000) : burst;
  if (!hourly.allowed) {
    return error(429, "rate_limited", "Too many requests. Please wait a moment and try again.", { "Retry-After": String(hourly.retryAfterSeconds) });
  }

  const raw = await req.text();
  if (raw.length > MAX_REQUEST_BYTES) return error(413, "too_large", "The request is too large.");
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return error(400, "bad_request", "Request body must be valid JSON.");
  }
  const parsed = parseTranslateRequest(body);
  if (!parsed.ok) return error(parsed.status, "invalid_input", parsed.message);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const segments = await provider.translate(parsed.input, controller.signal);
    return NextResponse.json({ segments }, { headers: noStore });
  } catch (e) {
    // Never log request content. Log only the error category.
    const timedOut = controller.signal.aborted;
    console.error("[ai/translate]", timedOut ? "timeout" : e instanceof AiProviderError ? e.kind : "unknown");
    return timedOut ? error(504, "timeout", "The AI provider took too long to respond. Please try again.") : error(502, "provider_error", "The AI provider couldn't complete the request. Please try again.");
  } finally {
    clearTimeout(timer);
  }
}
