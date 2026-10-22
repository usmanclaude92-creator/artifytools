import { afterEach, describe, expect, it, vi } from "vitest";
import { createAnthropicProvider } from "./anthropic";
import { rateLimit } from "./rate-limit";
import { MAX_SUMMARY_INPUT_CHARS, parseSummarizeRequest } from "./request";

describe("summarize request validation", () => {
  it("accepts valid input and trims text", () => {
    expect(parseSummarizeRequest({ text: "  hello ", length: "short" })).toEqual({ ok: true, input: { text: "hello", length: "short" } });
  });
  it("rejects bad shapes, empty, oversized, and unknown lengths", () => {
    expect(parseSummarizeRequest(null).ok).toBe(false);
    expect(parseSummarizeRequest({ text: 5, length: "short" }).ok).toBe(false);
    expect(parseSummarizeRequest({ text: "  ", length: "short" }).ok).toBe(false);
    expect(parseSummarizeRequest({ text: "x", length: "huge" }).ok).toBe(false);
    const big = parseSummarizeRequest({ text: "x".repeat(MAX_SUMMARY_INPUT_CHARS + 1), length: "short" });
    expect(big).toMatchObject({ ok: false, status: 413 });
  });
});

describe("rate limiter", () => {
  it("blocks after the limit and recovers after the window", () => {
    const k = "test-" + Math.random();
    for (let i = 0; i < 3; i++) expect(rateLimit(k, 3, 1000, 1000 + i).allowed).toBe(true);
    const blocked = rateLimit(k, 3, 1000, 1500);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(rateLimit(k, 3, 1000, 2500).allowed).toBe(true);
  });
});

describe("anthropic provider", () => {
  afterEach(() => vi.unstubAllGlobals());
  const signal = new AbortController().signal;

  it("sends a server-side key header and returns the text blocks", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: [{ type: "text", text: "A summary." }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const out = await createAnthropicProvider("sk-test").summarize({ text: "long text", length: "short" }, signal);
    expect(out).toBe("A summary.");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(init.headers["x-api-key"]).toBe("sk-test");
    expect(JSON.parse(init.body).messages[0].content).toContain("long text");
  });
  it("throws without echoing the response body on upstream errors or empty output", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("secret user text echoed", { status: 500 })));
    await expect(createAnthropicProvider("k").summarize({ text: "t", length: "short" }, signal)).rejects.toThrow(/status 500/);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: [] }), { status: 200 })));
    await expect(createAnthropicProvider("k").summarize({ text: "t", length: "short" }, signal)).rejects.toThrow(/no text/);
  });
});
