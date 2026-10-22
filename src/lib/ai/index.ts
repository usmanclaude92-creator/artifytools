import "server-only";
import { createAnthropicProvider } from "./anthropic";
import type { AiProvider } from "./types";

/** Returns the configured provider, or null when no server-side key exists. */
export function getAiProvider(): AiProvider | null {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  return createAnthropicProvider(key, process.env.AI_MODEL?.trim() || undefined);
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}
