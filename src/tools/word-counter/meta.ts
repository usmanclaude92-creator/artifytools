import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "word-counter",
  slug: "word-counter",
  name: "Word Counter",
  description: "Count words, characters, and sentences instantly.",
  intro: [
    "Paste or type any text to see live counts of words, characters (with and without spaces), sentences, paragraphs, and lines. The tool also estimates how long the text takes to read silently and to speak aloud, which is handy for essays, scripts, captions, and social posts that have strict limits.",
    "Counting follows the conventions of most word processors: a word is a run of characters between spaces, so “well-known” and “don’t” each count as one. Languages written without spaces, such as Chinese, Japanese, and Thai, are segmented with the browser’s built-in language rules.",
  ],
  category: "text",
  icon: "whole-word",
  tags: ["word count", "character count", "text", "writing"],
  keywords: ["count words", "how many words", "character counter", "letter count", "reading time", "essay length", "sentence counter"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your text is analysed by JavaScript running in this tab. It is never uploaded, stored, or logged.",
  seoTitle: "Free Word Counter Online | Artify Tools",
  seoDescription: "Count words and characters instantly with Artify Tools' simple online word counter. Includes sentences, paragraphs, and reading time — processed privately in your browser.",
  lastUpdated: "2026-10-21",
  howTo: [
    "Type or paste your text into the box. Counts update as you type.",
    "Read the totals for words, characters, sentences, paragraphs, and lines.",
    "Check reading and speaking time to see if your text fits your limit.",
    "Use Clear to start over with a fresh text box.",
  ],
  examples: [
    { label: "Short sentence", input: "The quick brown fox jumps over the lazy dog.", output: "9 words · 44 characters · 1 sentence" },
    { label: "Two paragraphs", input: "First paragraph.\n\nSecond paragraph here.", output: "5 words · 2 paragraphs · 3 lines" },
  ],
  faqs: [
    { question: "How are words counted?", answer: "Text is split on whitespace, and tokens that contain at least one letter or digit count as a word. Hyphenated words and contractions count once. Standalone punctuation such as “—” is ignored." },
    { question: "Do characters include spaces?", answer: "Both totals are shown: characters including spaces and characters excluding all whitespace. Emoji and accented letters count as a single character each." },
    { question: "How is reading time estimated?", answer: "Reading time assumes about 238 words per minute and speaking time about 130 words per minute. Real speeds vary, so treat them as rough guides." },
    { question: "Is there a size limit?", answer: "There is no fixed limit, but very large documents (millions of characters) may feel slower because everything runs in your browser." },
  ],
  popularRank: 2.7,
  related: ["case-converter", "text-cleaner", "remove-duplicate-lines"],
};
