import type { IconName } from "@/components/ui/icon";

export type ToolStatus = "active" | "beta" | "coming-soon";

/** Where user input is processed. Must describe the real implementation. */
export type ProcessingMode = "browser-local" | "server-side" | "external-provider";

export type CategoryId =
  | "text"
  | "calculators"
  | "developer"
  | "productivity"
  | "time"
  | "security"
  | "images"
  | "pdf"
  | "ai";

export interface Category {
  id: CategoryId;
  slug: string;
  name: string;
  description: string;
  icon: IconName;
}

export interface ToolExample {
  label: string;
  input: string;
  output: string;
}

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolDefinition {
  id: string;
  slug: string;
  name: string;
  /** One-sentence description used on cards and in search. */
  description: string;
  /** Introductory paragraphs rendered on the tool page (unique, specific copy). */
  intro: string[];
  category: CategoryId;
  icon: IconName;
  tags: string[];
  /** Extra search phrases (natural-language queries people actually type). */
  keywords: string[];
  status: ToolStatus;
  processingMode: ProcessingMode;
  /** Tool-specific privacy detail shown beside the processing mode. */
  privacyNote: string;
  aiPowered?: boolean;
  /** Set only when real pricing exists. Currently unused. */
  pricing?: { model: "free" | "paid"; note?: string };
  seoTitle: string;
  seoDescription: string;
  /** ISO date (YYYY-MM-DD) the tool was added / last materially updated. */
  lastUpdated: string;
  howTo: string[];
  examples: ToolExample[];
  faqs: ToolFaq[];
  /** Curated ordering for the "Popular tools" section (lower first). */
  popularRank?: number;
  /** Curated ordering for the featured section (lower first). */
  featuredRank?: number;
  /** Explicit related tool ids; falls back to same-category tools. */
  related?: string[];
}
