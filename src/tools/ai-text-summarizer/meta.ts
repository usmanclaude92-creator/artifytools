import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "ai-text-summarizer",
  slug: "ai-text-summarizer",
  name: "AI Text Summarizer",
  description: "Condense long text into a short summary with AI. Coming soon.",
  intro: [
    "Paste an article, report, or email thread and receive a concise summary at the length you choose. Unlike Artify’s other tools, summarizing is performed by a third-party AI provider, so your text leaves your device when you press Summarize.",
    "We’re finishing usage limits and account features before switching it on, so it isn’t available to use yet. When it launches, summaries can still contain mistakes, so check anything important against the source.",
  ],
  category: "ai",
  icon: "sparkles",
  tags: ["ai", "summarize", "summary", "tl;dr"],
  keywords: ["summarize text", "ai summary", "shorten article", "tldr", "condense text"],
  status: "coming-soon",
  processingMode: "external-provider",
  aiPowered: true,
  privacyNote:
    "When this tool launches, text you submit will be sent to an Artify server and forwarded to a third-party AI provider (Anthropic). Artify will not store or log the text.",
  seoTitle: "AI Text Summarizer (Coming Soon) | Artify Tools",
  seoDescription: "An AI text summarizer from Artify Tools is coming soon: paste long text and get a short, accurate summary.",
  lastUpdated: "2026-10-22",
  howTo: [
    "Paste the text you want summarized (up to 20,000 characters).",
    "Choose a summary length.",
    "Press Summarize and wait for the result. Review it against the original.",
  ],
  examples: [],
  faqs: [
    { question: "Where does my text go?", answer: "It is sent over HTTPS to an Artify server, which forwards it to the configured AI provider to generate the summary. Artify does not store the text." },
    { question: "When will it be available?", answer: "Soon. We’re adding fair-use limits first so the tool stays fast and free for everyone. Every other Artify tool works today." },
    { question: "Can I trust the summary?", answer: "AI summaries can omit details or contain errors. Use them as a starting point and verify important facts." },
  ],
  related: ["word-counter", "text-cleaner"],
};
