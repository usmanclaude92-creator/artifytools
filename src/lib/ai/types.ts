export type SummaryLength = "short" | "medium" | "long";

export interface SummarizeInput {
  text: string;
  length: SummaryLength;
}

export const TRANSLATE_LANGUAGES = ["ar", "en", "fr", "es", "de", "tr", "ur", "hi", "fa", "zh", "ru", "pt", "it", "id", "bn"] as const;
export type TranslateLanguage = (typeof TRANSLATE_LANGUAGES)[number];

export interface TranslateInput {
  /** Paragraphs and headings, in order. The translation keeps the same count and order. */
  segments: string[];
  target: TranslateLanguage;
}

/**
 * Provider boundary. UI and API route depend only on this interface, so a
 * different provider can be added without touching either.
 */
export interface AiProvider {
  readonly id: string;
  readonly displayName: string;
  summarize(input: SummarizeInput, signal: AbortSignal): Promise<string>;
  translate(input: TranslateInput, signal: AbortSignal): Promise<string[]>;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly kind: "upstream" | "timeout" | "empty" | "malformed",
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}
