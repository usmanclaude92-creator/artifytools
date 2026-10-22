import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "base64-encoder-decoder",
  slug: "base64-encoder-decoder",
  name: "Base64 Encoder & Decoder",
  description: "Encode text to Base64 or decode Base64 back to text, with full Unicode and URL-safe support.",
  intro: [
    "Base64 represents binary data using 64 printable characters, which is why it appears in data URLs, email attachments, JSON Web Tokens, and HTTP headers. Encode any text, including emoji and non-Latin scripts, or decode a Base64 string back into readable text.",
    "Base64 is an encoding, not encryption. It offers no secrecy at all, so never use it to protect passwords or private data. The decoder tolerates line breaks, the URL-safe alphabet (- and _), and missing padding, and tells you if the decoded bytes are not text.",
  ],
  category: "developer",
  icon: "binary",
  tags: ["base64", "encode", "decode", "unicode"],
  keywords: ["base64 encode", "base64 decode", "text to base64", "decode base64 string", "url safe base64", "atob btoa"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Conversion happens in your browser. Input and output are never sent to a server.",
  seoTitle: "Base64 Encoder & Decoder Online | Artify Tools",
  seoDescription: "Encode text to Base64 or decode Base64 to text with UTF-8 and URL-safe support. Free, private Base64 tool by Artify Tools.",
  lastUpdated: "2026-10-21",
  howTo: [
    "Choose Encode or Decode.",
    "Paste your text or Base64 string.",
    "For encoding, optionally switch to the URL-safe alphabet or drop padding.",
    "Copy the result.",
  ],
  examples: [
    { label: "Encode", input: "Hello, World!", output: "SGVsbG8sIFdvcmxkIQ==" },
    { label: "Decode", input: "aMOpbGxvIOKckw==", output: "héllo ✓" },
  ],
  faqs: [
    { question: "Is Base64 secure?", answer: "No. Anyone can decode Base64 instantly. It is meant for safely transporting data through text-only channels, not for protecting it." },
    { question: "What is URL-safe Base64?", answer: "It replaces + with - and / with _ so the string can be used in URLs and filenames without percent-encoding, and padding (=) is often omitted." },
    { question: "Why does decoding say the data isn't text?", answer: "The Base64 was valid but the bytes are not UTF-8 text, for example an image or a compressed file. This tool decodes text only." },
  ],
  popularRank: 12,
  related: ["url-encoder-decoder", "json-formatter", "uuid-generator"],
};
