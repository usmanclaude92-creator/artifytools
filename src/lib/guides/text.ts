import type { Locale } from "@/lib/i18n";

/** Interface text of the guide pages. */
export const guideText: Record<Locale, {
  home: string; guides: string; shortAnswer: string; contents: string; toolsFor: string; moreGuides: string; allGuides: string;
  byline: (site: string, date: string) => string; indexTitle: string; indexIntro: string; indexMeta: string;
}> = {
  en: {
    home: "Home", guides: "Guides", shortAnswer: "Short answer", contents: "In this guide", toolsFor: "Free tools for this", moreGuides: "More guides", allGuides: "All guides",
    byline: (site, date) => `Written by the ${site} team. Last updated ${date}. The tools in this guide run in your browser, so your files stay on your device.`,
    indexTitle: "Guides",
    indexIntro: "Plain-language, step-by-step help for everyday document and file tasks, with the free tools that do the job.",
    indexMeta: "Step-by-step guides for everyday document and file tasks: compressing and merging PDFs, converting PDF to Excel and Word, extracting text with OCR, writing cheque amounts in words, resizing images and keeping files private.",
  },
  ar: {
    home: "الرئيسية", guides: "الأدلة", shortAnswer: "الجواب باختصار", contents: "في هذا الدليل", toolsFor: "أدوات مجانية لهذا", moreGuides: "أدلة أخرى", allGuides: "كل الأدلة",
    byline: (site, date) => `كتبه فريق ${site}. آخر تحديث ${date}. الأدوات المذكورة تعمل داخل متصفحك فتبقى ملفاتك على جهازك.`,
    indexTitle: "الأدلة",
    indexIntro: "شروحات بسيطة خطوة بخطوة لمهام المستندات والملفات اليومية، مع الأدوات المجانية التي تنجزها.",
    indexMeta: "أدلة خطوة بخطوة لمهام المستندات والملفات اليومية: دمج PDF وضغطه، وتحويله إلى Word وExcel، واستخراج النص بتقنية OCR، وكتابة المبلغ بالحروف في الشيك، وتحويل كشوف الحساب.",
  },
};
