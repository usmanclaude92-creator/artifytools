import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "text-translator",
  slug: "text-translator",
  name: "Text Translator",
  description: "Translate typed or pasted text between Arabic, English and 13 other languages.",
  intro: [
    "Type or paste text, choose a language, and get the translation next to it. Translate between Arabic and English in either direction, or into French, Spanish, German, Turkish, Urdu, Hindi, Persian, Chinese, Russian, Portuguese, Italian, Indonesian or Bengali. Line breaks are kept, the language you are likely to want is suggested from what you type, and a swap button turns the translation into the next input.",
    "The text is translated by a third-party AI provider, so it leaves your device when you press Translate; nothing is stored. Machine translation can contain mistakes, so have important texts checked. To translate a whole document, use Translate PDF.",
  ],
  category: "text",
  icon: "globe",
  tags: ["translate", "translator", "arabic", "english", "ai"],
  keywords: ["translate text", "text translator", "arabic to english", "english to arabic", "online translator", "translate to arabic", "translate to english", "arabic translation"],
  status: "beta",
  processingMode: "external-provider",
  aiPowered: true,
  privacyNote: "The text is sent to an Artify server and on to a third-party AI provider (Anthropic) for translation. It isn't stored or logged.",
  seoTitle: "Text Translator: Arabic, English & More | Artify Tools",
  seoDescription: "Translate typed or pasted text between Arabic, English and 13 more languages. Line breaks are kept, right-to-left output is shown correctly, and nothing is stored.",
  lastUpdated: "2026-10-24",
  howTo: [
    "Type or paste your text (up to 20,000 characters).",
    "Choose the language to translate into. A likely choice is suggested from your text.",
    "Press Translate. Long texts are translated part by part.",
    "Copy the translation, download it as a text file, or press Swap to translate it back.",
  ],
  examples: [
    { label: "English to Arabic", input: "Your appointment is confirmed for Sunday at 10:00.", output: "تم تأكيد موعدك يوم الأحد في تمام الساعة 10:00." },
    { label: "Arabic to English", input: "شكرًا لتواصلكم معنا، سنرد عليكم قريبًا.", output: "Thank you for contacting us. We will reply to you soon." },
  ],
  faqs: [
    { question: "Which languages are supported?", answer: "Arabic, English, French, Spanish, German, Turkish, Urdu, Hindi, Persian, Chinese (Simplified), Russian, Portuguese, Italian, Indonesian and Bengali. The language you type in is detected automatically." },
    { question: "How long can the text be?", answer: "Up to 20,000 characters at a time. Longer texts are split and translated part by part. For files, use Translate PDF." },
    { question: "Is my text stored?", answer: "No. The text is sent to the translation provider, returned straight away, and Artify does not store or log it. Don't translate confidential text you aren't allowed to share with a third-party service." },
    { question: "How accurate is it?", answer: "Machine translation is good for understanding and everyday writing, but it can miss nuance or make mistakes with names, numbers and legal wording. Have important texts checked by a qualified translator." },
  ],
  popularRank: 2.3,
  related: ["translate-pdf", "word-counter", "image-to-text"],
};
