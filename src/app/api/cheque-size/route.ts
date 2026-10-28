import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/ai/rate-limit";
import { issueBody, issueTitle, parseSharedSize } from "@/lib/cheque/share";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8_000;
const noStore = { "Cache-Control": "no-store" };
const fail = (status: number, error: string) => NextResponse.json({ error }, { status, headers: noStore });

/**
 * Receives a custom cheque size the visitor chose to share and opens a GitHub issue for it, so the owner is
 * notified. Needs CHEQUE_SHARE_GITHUB_TOKEN (an issues-write token); without it the tool still works locally.
 */
export async function POST(req: NextRequest) {
  const token = process.env.CHEQUE_SHARE_GITHUB_TOKEN;
  if (!token) return fail(503, "not_configured");

  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return fail(403, "forbidden");

  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!rateLimit(`cheque:${forwarded || "anonymous"}`, 3, 60_000).allowed) return fail(429, "rate_limited");

  const raw = await req.text();
  if (raw.length > MAX_BYTES) return fail(413, "too_large");
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "bad_request");
  }
  const size = parseSharedSize(body);
  if (!size) return fail(400, "invalid_input");

  const repo = process.env.CHEQUE_SHARE_GITHUB_REPO || "usmanclaude92-creator/artifytools";
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "artify-tools" },
      body: JSON.stringify({ title: issueTitle(size), body: issueBody(size), labels: ["custom-cheque-size"] }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[cheque-size] github", res.status);
      return fail(502, "provider_error");
    }
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch {
    console.error("[cheque-size] request failed");
    return fail(502, "provider_error");
  }
}
