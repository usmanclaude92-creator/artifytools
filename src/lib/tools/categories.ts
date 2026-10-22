import type { Category, CategoryId } from "./types";

/**
 * All planned categories. A category is only *published* (listed, routable,
 * linked) once it contains at least one tool that is not "coming-soon" —
 * see getPublishedCategories() in registry.ts.
 */
export const categories: Category[] = [
  {
    id: "text",
    slug: "text-writing",
    name: "Text & Writing",
    description: "Count, clean, convert, and tidy text in seconds.",
    icon: "type",
  },
  {
    id: "calculators",
    slug: "calculators",
    name: "Calculators",
    description: "Percentages, VAT, and discounts with careful decimal handling.",
    icon: "calculator",
  },
  {
    id: "developer",
    slug: "developer-tools",
    name: "Developer Tools",
    description: "Format, encode, decode, and generate the things developers reach for daily.",
    icon: "braces",
  },
  {
    id: "productivity",
    slug: "productivity",
    name: "Productivity",
    description: "Small utilities that remove friction from everyday tasks.",
    icon: "zap",
  },
  {
    id: "time",
    slug: "time-date",
    name: "Time & Date",
    description: "Work out the time between dates and plan around it.",
    icon: "calendar-range",
  },
  {
    id: "security",
    slug: "security-privacy",
    name: "Security & Privacy",
    description: "Generate secure credentials without sending anything off your device.",
    icon: "shield-check",
  },
  {
    id: "images",
    slug: "images",
    name: "Images",
    description: "Resize, compress, crop, and convert images.",
    icon: "image",
  },
  {
    id: "pdf",
    slug: "pdfs-documents",
    name: "PDFs & Documents",
    description: "Merge, split, and extract pages from PDFs.",
    icon: "file-text",
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
