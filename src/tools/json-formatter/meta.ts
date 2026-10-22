import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "json-formatter",
  slug: "json-formatter",
  name: "JSON Formatter & Validator",
  description: "Format, minify, and validate JSON with precise errors.",
  intro: [
    "Paste JSON to pretty-print it with your preferred indentation, compress it into a single line, or simply check whether it is valid. When something is wrong, you get a plain-language explanation and the exact line and column, such as a trailing comma or a missing quote.",
    "Parsing happens in your browser, so API responses and configuration files can be inspected without leaving your device. Note that JavaScript parses numbers as 64-bit floats: integers larger than 9,007,199,254,740,991 may lose precision when reformatted.",
  ],
  category: "developer",
  icon: "braces",
  tags: ["json", "format", "validate", "minify", "api"],
  keywords: ["format json", "json beautifier", "json pretty print", "validate json", "json lint", "minify json", "fix json error"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "JSON is parsed and formatted in your browser. It is not uploaded, stored, or logged.",
  seoTitle: "JSON Formatter & Validator Online | Artify Tools",
  seoDescription: "Format, minify, and validate JSON online with clear line-and-column error messages. Private, in-browser JSON formatter by Artify Tools.",
  lastUpdated: "2026-10-21",
  howTo: [
    "Paste JSON into the input, or open a .json file from your device.",
    "Choose Format, Minify, or Validate and your indentation preference.",
    "Fix any reported error — the message points to the line and column.",
    "Copy or download the result.",
  ],
  examples: [
    { label: "Minified → formatted", input: '{"name":"Ada","langs":["en","fr"]}', output: '{\n  "name": "Ada",\n  "langs": [\n    "en",\n    "fr"\n  ]\n}' },
    { label: "Trailing comma error", input: '{"a": 1,}', output: "Line 1, column 9 — Trailing comma" },
  ],
  faqs: [
    { question: "What counts as valid JSON?", answer: "The tool follows the JSON standard (RFC 8259): double-quoted strings and keys, no comments, no trailing commas, and no single quotes. Values are objects, arrays, strings, numbers, true, false, or null." },
    { question: "Why was my large number changed?", answer: "JSON.parse reads numbers as IEEE-754 doubles. Integers beyond 2^53 lose precision, so keep very large IDs as strings." },
    { question: "Is there a size limit?", answer: "Input is limited to 5 million characters to keep your browser responsive." },
    { question: "What does sorting keys do?", answer: "It orders object keys alphabetically at every level, which makes diffs and comparisons easier. Array order is never changed." },
  ],
  popularRank: 2,
  featuredRank: 3,
  related: ["base64-encoder-decoder", "url-encoder-decoder", "uuid-generator"],
};
