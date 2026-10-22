export type SummaryLength = "short" | "medium" | "long";

export interface SummarizeInput {
  text: string;
  length: SummaryLength;
}

/**
 * Provider boundary. UI and API route depend only on this interface, so a
 * different provider can be added without touching either.
 */
export interface AiProvider {
  readonly id: string;
  readonly displayName: string;
  summarize(input: SummarizeInput, signal: AbortSignal): Promise<string>;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly kind: "upstream" | "timeout" | "empty",
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}
