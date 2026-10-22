import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "password-generator",
  slug: "password-generator",
  name: "Secure Password Generator",
  description: "Create strong random passwords instantly.",
  intro: [
    "Generate long, random passwords that are hard to guess and unique to each account. Choose a length from 8 to 128 characters and which character types to include; every selected type is guaranteed to appear at least once.",
    "Passwords are created in your browser using the Web Crypto API with rejection sampling, which avoids the statistical bias of naive random-number tricks. The password is never sent to a server, logged, or saved. Pair it with a reputable password manager so you do not need to remember it.",
  ],
  category: "security",
  icon: "key-round",
  tags: ["password", "security", "random", "credentials"],
  keywords: ["generate a secure password", "random password generator", "strong password", "create password", "password maker"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Passwords are generated with your browser's secure random source and exist only on this page. They are never transmitted, stored, or logged.",
  seoTitle: "Secure Password Generator | Artify Tools",
  seoDescription: "Generate strong, random passwords with a cryptographically secure generator that runs in your browser. Nothing is sent or stored — by Artify Tools.",
  lastUpdated: "2026-10-21",
  howTo: [
    "Set the length with the slider or number box (16+ is recommended).",
    "Choose which character types to include.",
    "Press Generate for a new password, then Copy.",
    "Store it in a password manager — don’t reuse it on other sites.",
  ],
  examples: [
    { label: "16 characters, all types", input: "length 16", output: "e.g. k7#Vq2-mR9!xTz4B (random every time)" },
  ],
  faqs: [
    { question: "How random are the passwords?", answer: "They use crypto.getRandomValues, the browser’s cryptographically secure generator, with rejection sampling so every character is equally likely." },
    { question: "What does the strength meter mean?", answer: "It estimates entropy as length × log2(character pool size). It assumes the attacker knows the settings and that the password is truly random; it is a guide, not a guarantee." },
    { question: "How long should my password be?", answer: "For important accounts, 16 or more characters is a good baseline. Longer is stronger, and a password manager removes the need to remember it." },
    { question: "What does excluding ambiguous characters do?", answer: "It removes look-alikes such as I, l, 1, O, 0, and o, which helps when you must read or type the password by hand." },
  ],
  popularRank: 4,
  featuredRank: 4,
  related: ["uuid-generator", "base64-encoder-decoder"],
};
