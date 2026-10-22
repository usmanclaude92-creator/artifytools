import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "case-converter",
  slug: "case-converter",
  name: "Case Converter",
  description: "Switch text between upper, lower, title, sentence, camelCase, snake_case, and more.",
  intro: [
    "Fix text typed with caps lock on, format a headline, or turn a phrase into a variable name. Choose a style and the converted text appears instantly, ready to copy.",
    "Programming styles (camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE) understand existing identifiers, so “parseHTTPResponse” becomes “parse_http_response” rather than a jumble. Title Case keeps small words such as “of” and “the” lowercase unless they start or end the title.",
  ],
  category: "text",
  icon: "case-sensitive",
  tags: ["uppercase", "lowercase", "title case", "camelCase", "snake_case"],
  keywords: ["change case", "capitalize text", "convert to uppercase", "sentence case", "kebab case", "text to title case"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Conversion happens entirely in your browser. Your text is never sent anywhere.",
  seoTitle: "Case Converter: Upper, Lower, Title, camelCase | Artify Tools",
  seoDescription: "Convert text to UPPER CASE, lower case, Title Case, Sentence case, camelCase, snake_case, kebab-case and more with Artify Tools' free online case converter.",
  lastUpdated: "2026-10-21",
  howTo: [
    "Paste or type your text.",
    "Pick the case style you need from the options.",
    "Copy the converted result, or switch styles to compare.",
  ],
  examples: [
    { label: "Title Case", input: "the lord of the rings", output: "The Lord of the Rings" },
    { label: "snake_case", input: "parseHTTPResponse", output: "parse_http_response" },
    { label: "Sentence case", input: "HELLO THERE. HOW ARE YOU?", output: "Hello there. How are you?" },
  ],
  faqs: [
    { question: "Does Title Case follow a specific style guide?", answer: "It uses a common, simple rule: capitalise every word except short articles, conjunctions, and prepositions (like “a”, “of”, “the”) unless they are first or last. Style guides differ, so double-check formal titles." },
    { question: "Can it handle accented and non-English letters?", answer: "Yes. Case mapping uses Unicode rules, so “straße” becomes “STRASSE” in upper case. Scripts without case (for example Chinese) are left unchanged." },
    { question: "Why do programming cases drop punctuation?", answer: "Identifier styles join words without separators, so spaces, dashes, and punctuation are treated as word boundaries and removed." },
  ],
  popularRank: 7,
  related: ["word-counter", "text-cleaner", "remove-duplicate-lines"],
};
