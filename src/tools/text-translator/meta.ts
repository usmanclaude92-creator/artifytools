import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "text-translator",
  slug: "text-translator",
  name: "Text Translator",
  description: "Translate text between Arabic and English privately in your browser. No sign-up, no key, nothing uploaded.",
  intro: [
    "Type or paste text and translate it between Arabic and English, in either direction, right next to the original. Line breaks are kept, the direction is suggested from what you type, and a swap button turns the translation into the next input.",
    "The translation runs on your own device. The first time you use a direction, your browser downloads a translation model (about 118 MB) and keeps it, so later translations start straight away and work without sending your text anywhere. Machine translation can contain mistakes, so have important texts checked. To translate a whole document into more languages, use Translate PDF.",
  ],
  category: "text",
  icon: "globe",
  tags: ["translate", "translator", "arabic", "english", "offline"],
  keywords: ["translate text", "text translator", "arabic to english", "english to arabic", "online translator", "translate to arabic", "translate to english", "arabic translation"],
  status: "beta",
  processingMode: "browser-local",
  privacyNote: "Your text is translated by a model running in this tab. It is never uploaded, stored, or logged. Only the model is downloaded, once, from Hugging Face, and cached by your browser.",
  seoTitle: "Arabic English Text Translator, Private | Artify Tools",
  seoDescription: "Translate text between Arabic and English free, privately in your browser. Nothing is uploaded, line breaks are kept, and right-to-left output displays correctly.",
  lastUpdated: "2026-10-24",
  howTo: [
    "Type or paste your text (up to 10,000 characters).",
    "Check the direction, Arabic to English or English to Arabic. It is suggested from your text.",
    "Press Translate. The first time, wait for the model to download; it is kept for next time.",
    "Copy the translation, download it as a text file, or press Swap to translate it back.",
  ],
  examples: [
    { label: "English to Arabic", input: "Your appointment is confirmed for Sunday at 10:00.", output: "تم تأكيد موعدك يوم الأحد في تمام الساعة 10:00." },
    { label: "Arabic to English", input: "شكرًا لتواصلكم معنا، سنرد عليكم قريبًا.", output: "Thank you for contacting us. We will reply to you soon." },
  ],
  faqs: [
    { question: "Which languages are supported?", answer: "Arabic to English and English to Arabic. For more languages, translate a document with Translate PDF." },
    { question: "Why does the first translation take longer?", answer: "Your browser downloads the translation model for that direction (about 118 MB) the first time, then keeps it. After that it starts straight away, even when you are offline." },
    { question: "Is my text uploaded?", answer: "No. The model runs inside your browser tab, so the text never leaves your device. Only the model files are downloaded, from Hugging Face." },
    { question: "How accurate is it?", answer: "It is a compact model that runs on your device, so it is good for understanding and everyday sentences, but weaker than large online services on idioms, names and legal wording. Have important texts checked by a qualified translator." },
    { question: "How long can the text be?", answer: "Up to 10,000 characters at a time. Translation runs sentence by sentence on your device, so long texts take a little while." },
  ],
  popularRank: 2.3,
  related: ["translate-pdf", "word-counter", "image-to-text"],
};
