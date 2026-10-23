import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const translate = vi.fn();
vi.mock("@/lib/ai", () => ({ getAiProvider: () => (process.env.TEST_NO_AI ? null : { translate }) }));

const { POST } = await import("./route");
const req = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest("https://tools.artifysols.com/api/ai/translate", { method: "POST", body: JSON.stringify(body), headers: { host: "tools.artifysols.com", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}`, ...headers } });

describe("POST /api/ai/translate", () => {
  it("translates valid requests", async () => {
    translate.mockResolvedValueOnce(["مرحبا"]);
    const res = await POST(req({ segments: ["Hello"], target: "ar" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ segments: ["مرحبا"] });
  });
  it("rejects invalid input, other origins, and provider failures without leaking details", async () => {
    expect((await POST(req({ segments: [], target: "ar" }))).status).toBe(400);
    expect((await POST(req({ segments: ["x"], target: "ar" }, { origin: "https://evil.example" }))).status).toBe(403);
    translate.mockRejectedValueOnce(new Error("secret upstream body"));
    const res = await POST(req({ segments: ["Hello"], target: "ar" }));
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });
  it("reports when AI isn't configured", async () => {
    process.env.TEST_NO_AI = "1";
    expect((await POST(req({ segments: ["Hello"], target: "ar" }))).status).toBe(503);
    delete process.env.TEST_NO_AI;
  });
});
