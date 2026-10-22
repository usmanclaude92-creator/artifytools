import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "remove-duplicate-lines",
  slug: "remove-duplicate-lines",
  name: "Remove Duplicate Lines",
  description: "Remove repeated lines from a list, keeping the first occurrence, with optional sorting.",
  intro: [
    "Paste a list of emails, keywords, URLs, or log lines and get back only the unique entries. The first occurrence of each line is kept in its original position unless you choose to sort.",
    "Matching can ignore letter case and leading or trailing spaces, which is usually what you want for email lists and keyword research. You will see exactly how many lines were removed.",
  ],
  category: "text",
  icon: "list-x",
  tags: ["deduplicate", "unique lines", "lists", "sort"],
  keywords: ["remove duplicates", "dedupe list", "unique values", "delete duplicate lines", "sort lines alphabetically"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Lines are compared and sorted in your browser. Nothing is uploaded or stored.",
  seoTitle: "Remove Duplicate Lines Online | Artify Tools",
  seoDescription: "Remove duplicate lines from any list instantly. Keep first occurrences, ignore case, trim spaces, and sort — a free, private tool by Artify Tools.",
  lastUpdated: "2026-10-21",
  howTo: [
    "Paste your list with one item per line.",
    "Choose whether matching is case-sensitive and whether to trim spaces.",
    "Optionally sort the result A–Z or Z–A.",
    "Copy or download the de-duplicated list.",
  ],
  examples: [
    { label: "Case-insensitive", input: "Apple\napple\nBanana\nAPPLE", output: "Apple\nBanana" },
  ],
  faqs: [
    { question: "Which duplicate is kept?", answer: "The first occurrence is kept and later copies are removed. If you sort, the kept lines are then ordered alphabetically (numbers sort naturally: 2 before 10)." },
    { question: "What happens to blank lines?", answer: "By default blank lines are dropped. Enable “Keep blank lines” to preserve them as separators." },
    { question: "Can it handle large lists?", answer: "Yes. Tens of thousands of lines are processed instantly because the work happens locally using a hash set." },
  ],
  popularRank: 10,
  related: ["text-cleaner", "case-converter", "word-counter"],
};
