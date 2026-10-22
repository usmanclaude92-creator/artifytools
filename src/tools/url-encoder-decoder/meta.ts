import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "url-encoder-decoder",
  slug: "url-encoder-decoder",
  name: "URL Encoder & Decoder",
  description: "Percent-encode or decode text and URLs so they are safe to use in links and query strings.",
  intro: [
    "URLs can only contain a limited set of characters. Percent-encoding replaces everything else, such as spaces, accents, and symbols, with a % sign followed by hex digits. Use this tool to encode a query-string value, decode a URL you copied from a browser, or work out why a link is broken.",
    "Choose “Component” to encode a single value (it also encodes / ? & = #), or “Full URL” to keep the structure of an address intact. Remember that URL encoding is not encryption: anyone can decode it.",
  ],
  category: "developer",
  icon: "link",
  tags: ["url", "percent encoding", "query string", "encode", "decode"],
  keywords: ["url encode", "url decode", "percent encoding", "encodeURIComponent", "escape url", "fix %20 in url"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Encoding and decoding use your browser's built-in functions. Nothing is uploaded or stored.",
  seoTitle: "URL Encoder & Decoder Online | Artify Tools",
  seoDescription: "Encode or decode URLs and query-string values with percent-encoding. Free, private URL encoder and decoder by Artify Tools.",
  lastUpdated: "2026-10-21",
  howTo: [
    "Choose Encode or Decode.",
    "Pick Component for a single value or Full URL to preserve the address structure.",
    "Paste your text. The result updates instantly — copy it when ready.",
  ],
  examples: [
    { label: "Encode a value", input: "coffee & cream", output: "coffee%20%26%20cream" },
    { label: "Decode", input: "caf%C3%A9%20au%20lait", output: "café au lait" },
  ],
  faqs: [
    { question: "What is the difference between Component and Full URL?", answer: "Component mode (encodeURIComponent) escapes reserved characters like / ? & = so a value cannot break the URL. Full URL mode (encodeURI) leaves those characters alone because they are part of the address." },
    { question: "Why does decoding fail?", answer: "A % sign must be followed by two hex digits, and the bytes must form valid UTF-8. A stray % (like “100%”) is the usual cause." },
    { question: "Should spaces be %20 or +?", answer: "%20 is correct everywhere. A plus sign means a space only in HTML form data. Enable “Treat + as space” when decoding such query strings." },
  ],
  popularRank: 11,
  related: ["base64-encoder-decoder", "json-formatter", "qr-code-generator"],
};
