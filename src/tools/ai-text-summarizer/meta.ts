import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "ai-text-summarizer",
  slug: "ai-text-summarizer",
  name: "AI Text Summarizer",
  description: "Condense long text into a short summary using an AI model. Requires server configuration.",
  intro: [
    "Paste an article, report, or email thread and receive a concise summary at the length you choose. Unlike Artify’s other tools, summarizing is performed by a third-party AI provider, so your text leaves your device when you press Summarize.",
    "This tool is in beta and only works on deployments where an AI provider has been configured with a server-side API key. When it is not configured, the tool says so plainly and never produces a made-up summary. Summaries can contain mistakes, so check anything important against the source.",
  ],
  category: "ai",
  icon: "sparkles",
  tags: ["ai", "summarize", "summary", "tl;dr"],
  keywords: ["summarize text", "ai summary", "shorten article", "tldr", "condense text"],
  status: "beta",
  processingMode: "external-provider",
  aiPowered: true,
  privacyNote:
    "When you press Summarize, your text is sent to an Artify server and forwarded to a third-party AI provider (Anthropic). Artify does not store or log the text. Do not submit confidential or regulated information unless that is acceptable under your own policies.",
  seoTitle: "AI Text Summarizer (Beta) | Artify Tools",
  seoDescription: "Summarize long text with AI. Beta tool from Artify Tools that requires server-side configuration; your text is sent to a third-party AI provider.",
  lastUpdated: "2026-10-21",
  howTo: [
    "Paste the text you want summarized (up to 20,000 characters).",
    "Choose a summary length.",
    "Press Summarize and wait for the result. Review it against the original.",
  ],
  examples: [],
  faqs: [
    { question: "Where does my text go?", answer: "It is sent over HTTPS to an Artify server, which forwards it to the configured AI provider to generate the summary. Artify does not store the text." },
    { question: "Why does the tool say it isn’t configured?", answer: "AI features need an API key set by the site operator. Without one, the tool is disabled instead of faking a response." },
    { question: "Can I trust the summary?", answer: "AI summaries can omit details or contain errors. Use them as a starting point and verify important facts." },
  ],
  related: ["word-counter", "text-cleaner"],
};
