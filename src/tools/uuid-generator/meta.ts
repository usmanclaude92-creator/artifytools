import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "uuid-generator",
  slug: "uuid-generator",
  name: "UUID Generator",
  description: "Generate random version 4 or time-ordered version 7 UUIDs, one or in bulk.",
  intro: [
    "Generate universally unique identifiers for database keys, test data, and correlation IDs. Version 4 UUIDs are fully random. Version 7 UUIDs begin with a millisecond timestamp, so they sort by creation time, which keeps database indexes efficient.",
    "All values come from your browser’s cryptographically secure random number generator. You can create up to 100 at a time, switch to uppercase, or remove the hyphens.",
  ],
  category: "developer",
  icon: "fingerprint",
  tags: ["uuid", "guid", "identifier", "random"],
  keywords: ["generate uuid", "uuid v4", "uuid v7", "guid generator", "unique id generator", "random uuid"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "UUIDs are generated in your browser using Web Crypto. They are never transmitted or recorded.",
  seoTitle: "UUID Generator: v4 & v7 UUIDs Online | Artify Tools",
  seoDescription: "Generate secure random UUID v4 and time-ordered UUID v7 values in bulk with Artify Tools' free online UUID generator.",
  lastUpdated: "2026-10-21",
  howTo: [
    "Pick version 4 (random) or version 7 (time-ordered).",
    "Choose how many UUIDs you need and any formatting options.",
    "Press Generate, then copy one value or the whole list.",
  ],
  examples: [
    { label: "Version 4", input: "v4 × 1", output: "3b241101-e2bb-4255-8caf-4136c566a962" },
  ],
  faqs: [
    { question: "Which version should I use?", answer: "Use v4 when you just need a unique random ID. Use v7 for database primary keys, where time-ordering reduces index fragmentation." },
    { question: "Can two UUIDs collide?", answer: "With 122 random bits in v4, the chance of a collision is negligible for any practical workload." },
    { question: "Are UUIDs secrets?", answer: "No. Treat them as identifiers, not as access tokens. Use a dedicated secret generator for credentials." },
  ],
  popularRank: 13,
  related: ["password-generator", "base64-encoder-decoder", "json-formatter"],
};
