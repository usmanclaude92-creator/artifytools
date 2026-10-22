import { NextResponse } from "next/server";
import { isAiConfigured } from "@/lib/ai";

export const dynamic = "force-dynamic";

/** Reports whether an AI provider is configured. Never exposes the key or provider details. */
export function GET() {
  return NextResponse.json({ configured: isAiConfigured() }, { headers: { "Cache-Control": "no-store" } });
}
