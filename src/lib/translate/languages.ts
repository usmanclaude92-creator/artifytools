import type { TranslateLanguage } from "@/lib/ai/types";

/** Language names as shown in the translate tools' pickers, by site language. */
export const LANGUAGE_NAMES: Record<"en" | "ar", Record<TranslateLanguage, string>> = {
  en: { ar: "Arabic", en: "English", fr: "French", es: "Spanish", de: "German", tr: "Turkish", ur: "Urdu", hi: "Hindi", fa: "Persian", zh: "Chinese (Simplified)", ru: "Russian", pt: "Portuguese", it: "Italian", id: "Indonesian", bn: "Bengali" },
  ar: { ar: "العربية", en: "الإنجليزية", fr: "الفرنسية", es: "الإسبانية", de: "الألمانية", tr: "التركية", ur: "الأردية", hi: "الهندية", fa: "الفارسية", zh: "الصينية (المبسطة)", ru: "الروسية", pt: "البرتغالية", it: "الإيطالية", id: "الإندونيسية", bn: "البنغالية" },
};
