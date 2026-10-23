import { categories, getCategory } from "./categories";
import type { Category, CategoryId, ToolDefinition } from "./types";
import type { SearchableTool } from "../search";
import type { Locale } from "../i18n";
import { localizeCategory, localizeTool } from "./localize";
import { inputKindOf } from "./file-spec";
import type { InputKind } from "./types";

import { meta as wordCounter } from "@/tools/word-counter/meta";
import { meta as caseConverter } from "@/tools/case-converter/meta";
import { meta as textCleaner } from "@/tools/text-cleaner/meta";
import { meta as removeDuplicateLines } from "@/tools/remove-duplicate-lines/meta";
import { meta as percentageCalculator } from "@/tools/percentage-calculator/meta";
import { meta as vatCalculator } from "@/tools/vat-calculator/meta";
import { meta as discountCalculator } from "@/tools/discount-calculator/meta";
import { meta as jsonFormatter } from "@/tools/json-formatter/meta";
import { meta as urlEncoderDecoder } from "@/tools/url-encoder-decoder/meta";
import { meta as base64EncoderDecoder } from "@/tools/base64-encoder-decoder/meta";
import { meta as uuidGenerator } from "@/tools/uuid-generator/meta";
import { meta as passwordGenerator } from "@/tools/password-generator/meta";
import { meta as qrCodeGenerator } from "@/tools/qr-code-generator/meta";
import { meta as dateDifference } from "@/tools/date-difference/meta";
import { meta as colorConverter } from "@/tools/color-converter/meta";
import { meta as aiTextSummarizer } from "@/tools/ai-text-summarizer/meta";
import { meta as mergePdf } from "@/tools/merge-pdf/meta";
import { meta as splitPdf } from "@/tools/split-pdf/meta";
import { meta as jpgToPdf } from "@/tools/jpg-to-pdf/meta";
import { meta as compressPdf } from "@/tools/compress-pdf/meta";
import { meta as compressImage } from "@/tools/compress-image/meta";
import { meta as amountInWords } from "@/tools/amount-in-words/meta";
import { meta as chequePrinter } from "@/tools/cheque-printer/meta";
import { meta as pdfToJpg } from "@/tools/pdf-to-jpg/meta";
import { meta as cropImage } from "@/tools/crop-image/meta";
import { meta as wordToPdf } from "@/tools/word-to-pdf/meta";
import { meta as imageToText } from "@/tools/image-to-text/meta";
import { meta as translatePdf } from "@/tools/translate-pdf/meta";
import { meta as pdfToWord } from "@/tools/pdf-to-word/meta";
import { meta as resizeImage } from "@/tools/resize-image/meta";

/**
 * Single source of truth for every tool. Directory cards, categories, search,
 * related links, featured sections, sitemap and metadata are all derived from
 * this list. To add a tool: create src/tools/<slug>/{meta,logic,ui}, register the
 * meta here and the UI in src/components/tools/tool-components.tsx.
 */
export const tools: readonly ToolDefinition[] = [
  wordCounter,
  caseConverter,
  textCleaner,
  removeDuplicateLines,
  percentageCalculator,
  vatCalculator,
  discountCalculator,
  jsonFormatter,
  urlEncoderDecoder,
  base64EncoderDecoder,
  uuidGenerator,
  passwordGenerator,
  qrCodeGenerator,
  dateDifference,
  colorConverter,
  aiTextSummarizer,
  mergePdf,
  splitPdf,
  jpgToPdf,
  compressPdf,
  compressImage,
  amountInWords,
  chequePrinter,
  pdfToJpg,
  resizeImage,
  cropImage,
  pdfToWord,
  wordToPdf,
  imageToText,
  translatePdf,
];

const bySlug = new Map(tools.map((t) => [t.slug, t]));

export function getTool(slug: string): ToolDefinition | undefined {
  return bySlug.get(slug);
}

/** Tools listed on the site. "coming-soon" tools are listed with a badge but their page shows a notice instead of the tool. */
export function getPublishedTools(): ToolDefinition[] {
  return [...tools];
}

/** Tools people can actually use today. */
export function getUsableTools(): ToolDefinition[] {
  return tools.filter((t) => t.status !== "coming-soon");
}

export function getActiveTools(): ToolDefinition[] {
  return tools.filter((t) => t.status === "active");
}

export function getToolsByCategory(id: CategoryId): ToolDefinition[] {
  return getPublishedTools().filter((t) => t.category === id);
}

/** Categories that contain at least one published tool. */
export function getPublishedCategories(): Category[] {
  return categories.filter((c) => getToolsByCategory(c.id).length > 0);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return getPublishedCategories().find((c) => c.slug === slug);
}

export function getPopularTools(limit = 8): ToolDefinition[] {
  return getActiveTools()
    .filter((t) => t.popularRank !== undefined)
    .sort((a, b) => a.popularRank! - b.popularRank!)
    .slice(0, limit);
}

export function getFeaturedTools(limit = 6): ToolDefinition[] {
  return getActiveTools()
    .filter((t) => t.featuredRank !== undefined)
    .sort((a, b) => a.featuredRank! - b.featuredRank!)
    .slice(0, limit);
}

export function getRelatedTools(tool: ToolDefinition, limit = 3): ToolDefinition[] {
  const published = getUsableTools().filter((t) => t.id !== tool.id);
  const explicit = (tool.related ?? [])
    .map((id) => published.find((t) => t.id === id))
    .filter((t): t is ToolDefinition => Boolean(t));
  const sameCategory = published.filter((t) => t.category === tool.category && !explicit.includes(t));
  const rest = published.filter((t) => !explicit.includes(t) && !sameCategory.includes(t));
  return [...explicit, ...sameCategory, ...rest].slice(0, limit);
}

/** Serialisable record used by client-side search and the directory. */
export interface DirectoryItem extends SearchableTool {
  id: string;
  icon: ToolDefinition["icon"];
  categoryId: CategoryId;
  categorySlug: string;
  status: ToolDefinition["status"];
  processingMode: ToolDefinition["processingMode"];
  aiPowered: boolean;
  lastUpdated: string;
  popularRank: number;
  inputKind: InputKind;
}

export type SearchItem = DirectoryItem;

export function toDirectoryItem(tool: ToolDefinition, locale: Locale = "en"): DirectoryItem {
  const t = localizeTool(tool, locale);
  const cat = localizeCategory(getCategory(t.category), locale);
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    description: t.description,
    tags: t.tags,
    // File formats are searchable too ("compress jpg", "pdf").
    keywords: t.files ? [...t.keywords, ...t.files.inputFormats, ...t.files.outputFormats].map((k) => k.toLowerCase()) : t.keywords,
    icon: t.icon,
    categoryId: cat.id,
    categoryName: cat.name,
    categorySlug: cat.slug,
    status: t.status,
    processingMode: t.processingMode,
    aiPowered: Boolean(t.aiPowered),
    lastUpdated: t.lastUpdated,
    popularRank: t.popularRank ?? 999,
    inputKind: inputKindOf(t),
  };
}

export function getSearchItems(locale: Locale = "en"): SearchItem[] {
  return getPublishedTools().map((t) => toDirectoryItem(t, locale));
}

export const exampleSearches = [
  "Count words",
  "Calculate a percentage",
  "Format JSON",
  "Generate a secure password",
  "Find the difference between dates",
] as const;
