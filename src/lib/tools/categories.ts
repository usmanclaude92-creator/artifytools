import type { Category, CategoryId } from "./types";

/**
 * All planned categories. A category is only *published* (listed, routable,
 * linked) once it contains at least one tool that is not "coming-soon" —
 * see getPublishedCategories() in registry.ts.
 */
export const categories: Category[] = [
  {
    id: "pdf",
    slug: "pdf-converter",
    name: "PDF Converter",
    description: "Convert PDFs to and from Word, Excel and images, keeping the layout.",
    icon: "file-text",
  },
  {
    id: "pdf-edit",
    slug: "pdf-editor",
    name: "Edit & Organise PDF",
    description: "Merge, split, compress, rotate, number, watermark and protect PDF pages.",
    icon: "layers",
  },
  {
    id: "business",
    slug: "business-finance",
    name: "Business & Finance",
    description: "Print cheques, write amounts in words, convert bank statements and work out VAT and end-of-service pay.",
    icon: "briefcase",
  },
  {
    id: "images",
    slug: "images",
    name: "Images",
    description: "Remove backgrounds, compress, resize, crop and read text from images.",
    icon: "image",
  },
  {
    id: "calculators",
    slug: "calculators",
    name: "Calculators",
    description: "Percentages and discounts with careful decimal handling.",
    icon: "calculator",
  },
  {
    id: "time",
    slug: "time-date",
    name: "Time & Date",
    description: "Convert Hijri dates and work out the time between dates.",
    icon: "calendar-range",
  },
  {
    id: "productivity",
    slug: "productivity",
    name: "Productivity",
    description: "Small utilities that remove friction from everyday tasks.",
    icon: "zap",
  },
  {
    id: "text",
    slug: "text-writing",
    name: "Text & Writing",
    description: "Count, clean, convert, and tidy text in seconds.",
    icon: "type",
  },
  {
    id: "developer",
    slug: "developer-tools",
    name: "Developer Tools",
    description: "Format, encode, decode, and generate the things developers reach for daily.",
    icon: "braces",
  },
  {
    id: "security",
    slug: "security-privacy",
    name: "Security & Privacy",
    description: "Generate secure credentials without sending anything off your device.",
    icon: "shield-check",
  },
  {
    id: "ai",
    slug: "ai-tools",
    name: "AI Tools",
    description: "AI-assisted summarizing, writing, and extraction.",
    icon: "sparkles",
  },
];

const byId = new Map(categories.map((c) => [c.id, c]));

export function getCategory(id: CategoryId): Category {
  const c = byId.get(id);
  if (!c) throw new Error(`Unknown category: ${id}`);
  return c;
}
