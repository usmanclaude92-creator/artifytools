import type { Locale } from "@/lib/i18n";
import type { Category, CategoryId, ToolDefinition } from "./types";
import { toolTranslationsAr } from "./translations-ar";

/** The text fields of a tool that are translated. Everything else (slug, icon, status…) is shared. */
export type ToolTranslation = Pick<
  ToolDefinition,
  "name" | "description" | "intro" | "privacyNote" | "seoTitle" | "seoDescription" | "howTo" | "examples" | "faqs" | "keywords"
>;

const categoriesAr: Record<CategoryId, { name: string; description: string }> = {
  text: { name: "النصوص والكتابة", description: "عدّ النصوص وتنظيفها وتحويلها وترتيبها في ثوانٍ." },
  calculators: { name: "الحاسبات", description: "النسب المئوية وضريبة القيمة المضافة والخصومات بحساب عشري دقيق." },
  developer: { name: "أدوات المطورين", description: "التنسيق والترميز وفك الترميز والتوليد لما يحتاجه المطورون يوميًا." },
  productivity: { name: "الإنتاجية", description: "أدوات صغيرة تزيل العوائق من المهام اليومية." },
  time: { name: "الوقت والتاريخ", description: "احسب المدة بين التواريخ وخطّط على أساسها." },
  security: { name: "الأمان والخصوصية", description: "ولّد بيانات اعتماد آمنة دون إرسال أي شيء خارج جهازك." },
  images: { name: "الصور", description: "تغيير حجم الصور وضغطها وقصّها وتحويلها." },
  pdf: { name: "ملفات PDF والمستندات", description: "دمج ملفات PDF وتقسيمها واستخراج صفحاتها." },
  ai: { name: "أدوات الذكاء الاصطناعي", description: "تلخيص وكتابة واستخراج بمساعدة الذكاء الاصطناعي." },
};

export function localizeCategory(c: Category, locale: Locale): Category {
  if (locale === "en") return c;
  return { ...c, ...categoriesAr[c.id] };
}

/** Returns the tool with its text in `locale`. Untranslated tools fall back to English. */
export function localizeTool(t: ToolDefinition, locale: Locale): ToolDefinition {
  if (locale === "en") return t;
  const tr = toolTranslationsAr[t.id];
  if (!tr) return t;
  // Keep the English name and keywords searchable too: many people type tool names in English.
  return { ...t, ...tr, keywords: [...tr.keywords, t.name, ...t.keywords] };
}

export function isToolTranslated(id: string, locale: Locale): boolean {
  return locale === "en" || Boolean(toolTranslationsAr[id]);
}
