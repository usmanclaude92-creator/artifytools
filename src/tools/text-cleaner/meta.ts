import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "text-cleaner",
  slug: "text-cleaner",
  name: "Text Cleaner",
  description: "Remove extra spaces, blank lines, hidden characters, and formatting clutter from text.",
  intro: [
    "Text copied from PDFs, emails, chat apps, and web pages often arrives with double spaces, ragged line breaks, curly quotes, and invisible characters that break searches and spreadsheets. Switch on the clean-ups you need and see the result instantly.",
    "Every option is independent, so you can, for example, only strip zero-width characters while leaving line breaks untouched. Tag stripping removes HTML-style tags from the text; the output is always plain text and is never rendered as HTML.",
  ],
  category: "text",
  icon: "eraser",
  tags: ["clean text", "remove spaces", "whitespace", "line breaks"],
  keywords: ["remove extra spaces", "remove blank lines", "strip formatting", "remove line breaks", "zero width characters", "straighten quotes", "clean pasted text"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "All clean-up runs in your browser. Your text is not uploaded or stored.",
  seoTitle: "Text Cleaner: Remove Extra Spaces & Line Breaks | Artify Tools",
  seoDescription: "Clean up pasted text online: remove extra spaces, blank lines, hidden characters, and smart quotes. Free, private text cleaner by Artify Tools.",
  lastUpdated: "2026-10-21",
  howTo: [
    "Paste your messy text into the input box.",
    "Toggle the clean-up options you want. The output updates immediately.",
    "Copy the cleaned text or download it as a .txt file.",
  ],
  examples: [
    { label: "Extra spaces and blank lines", input: "Hello    world  \n\n\n\nNext   line", output: "Hello world\n\nNext line" },
    { label: "Join into one line", input: "one\ntwo\nthree", output: "one two three" },
  ],
  faqs: [
    { question: "What are invisible characters?", answer: "Zero-width spaces, joiners, byte-order marks, and soft hyphens are invisible but can break string comparisons and URLs. The cleaner removes them when that option is on." },
    { question: "Does removing tags make text safe to embed in a web page?", answer: "No. Tag stripping is a convenience for extracting readable text, not a security sanitiser. Always escape or sanitise content with a dedicated library before inserting it into HTML." },
    { question: "Will it change my wording?", answer: "No. Only whitespace, invisible characters, quote styles, and tags (if enabled) are changed. Words are never altered." },
  ],
  popularRank: 8,
  related: ["remove-duplicate-lines", "word-counter", "case-converter"],
};
