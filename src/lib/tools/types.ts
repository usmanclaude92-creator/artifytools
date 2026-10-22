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

/** File-input details for tools that work on files (images, PDFs…). Format names are language-neutral. */
export interface ToolFileSpec {
  /** Accepted input formats as shown to people, e.g. ["JPG", "PNG", "WebP"]. */
  inputFormats: string[];
  /** Matching MIME types / extensions for the file picker, e.g. ["image/jpeg", ".jpg"]. */
  accept: string[];
  /** What the tool produces, e.g. ["JPG", "PNG", "WebP"] or ["PDF"]. */
  outputFormats: string[];
  /** Largest single file, in bytes. */
  maxFileBytes: number;
  /** Most files at once (1 for single-file tools). */
  maxFiles: number;
  /** Largest combined size, in bytes, when several files are allowed. */
  maxTotalBytes?: number;
}

/** What a tool works on, used for directory filters. Derived from `files`, never set by hand. */
export type InputKind = "text" | "images" | "pdf" | "files";

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
  /** Set for tools that take files. Drives the file picker limits, the tool-page facts and directory filters. */
  files?: ToolFileSpec;
  /** Explicit related tool ids; falls back to same-category tools. */
  related?: string[];
}
