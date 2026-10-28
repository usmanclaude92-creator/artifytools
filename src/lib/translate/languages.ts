/** The languages the translator knows, their names, and which ones have a model in each direction (pure, unit-tested). */
import { MODELS } from "./models";

export type Lang = "en" | "ar" | "cs" | "da" | "de" | "es" | "fi" | "fr" | "hi" | "hu" | "id" | "it" | "ja" | "ko" | "nl" | "pl" | "ro" | "ru" | "sv" | "th" | "tr" | "uk" | "vi" | "zh";

export interface LangInfo {
  code: Lang;
  en: string;
  ar: string;
  /** The language's own name. */
  native: string;
  rtl: boolean;
}

export const LANGUAGES: readonly LangInfo[] = [
  { code: "en", en: "English", ar: "الإنجليزية", native: "English", rtl: false },
  { code: "ar", en: "Arabic", ar: "العربية", native: "العربية", rtl: true },
  { code: "zh", en: "Chinese (Simplified)", ar: "الصينية (المبسطة)", native: "中文", rtl: false },
  { code: "cs", en: "Czech", ar: "التشيكية", native: "Čeština", rtl: false },
  { code: "da", en: "Danish", ar: "الدنماركية", native: "Dansk", rtl: false },
  { code: "nl", en: "Dutch", ar: "الهولندية", native: "Nederlands", rtl: false },
  { code: "fi", en: "Finnish", ar: "الفنلندية", native: "Suomi", rtl: false },
  { code: "fr", en: "French", ar: "الفرنسية", native: "Français", rtl: false },
  { code: "de", en: "German", ar: "الألمانية", native: "Deutsch", rtl: false },
  { code: "hi", en: "Hindi", ar: "الهندية", native: "हिन्दी", rtl: false },
  { code: "hu", en: "Hungarian", ar: "المجرية", native: "Magyar", rtl: false },
  { code: "id", en: "Indonesian", ar: "الإندونيسية", native: "Bahasa Indonesia", rtl: false },
  { code: "it", en: "Italian", ar: "الإيطالية", native: "Italiano", rtl: false },
  { code: "ja", en: "Japanese", ar: "اليابانية", native: "日本語", rtl: false },
  { code: "ko", en: "Korean", ar: "الكورية", native: "한국어", rtl: false },
  { code: "pl", en: "Polish", ar: "البولندية", native: "Polski", rtl: false },
  { code: "ro", en: "Romanian", ar: "الرومانية", native: "Română", rtl: false },
  { code: "ru", en: "Russian", ar: "الروسية", native: "Русский", rtl: false },
  { code: "es", en: "Spanish", ar: "الإسبانية", native: "Español", rtl: false },
  { code: "sv", en: "Swedish", ar: "السويدية", native: "Svenska", rtl: false },
  { code: "th", en: "Thai", ar: "التايلاندية", native: "ไทย", rtl: false },
  { code: "tr", en: "Turkish", ar: "التركية", native: "Türkçe", rtl: false },
  { code: "uk", en: "Ukrainian", ar: "الأوكرانية", native: "Українська", rtl: false },
  { code: "vi", en: "Vietnamese", ar: "الفيتنامية", native: "Tiếng Việt", rtl: false },
];

const byCode = new Map<string, LangInfo>(LANGUAGES.map((l) => [l.code, l]));
export const langInfo = (code: Lang): LangInfo => byCode.get(code)!;
export const isRtl = (code: Lang): boolean => langInfo(code).rtl;

const has = (key: string) => key in MODELS;

/** Languages that can be translated from (English plus every language with a model into English). */
export const sourceLanguages = (): LangInfo[] => LANGUAGES.filter((l) => l.code === "en" || has(`${l.code}-en`));
/** Languages that can be translated into (English plus every language with a model from English). */
export const targetLanguages = (): LangInfo[] => LANGUAGES.filter((l) => l.code === "en" || has(`en-${l.code}`));

/**
 * The models to run, in order, to go from one language to another: one model when there is a direct one,
 * otherwise through English. null when the pair is not possible or both are the same.
 */
export function routeFor(from: Lang, to: Lang): string[] | null {
  if (from === to) return null;
  if (has(`${from}-${to}`)) return [`${from}-${to}`];
  if (from !== "en" && to !== "en" && has(`${from}-en`) && has(`en-${to}`)) return [`${from}-en`, `en-${to}`];
  return null;
}

/** Download size of a route, in bytes (what the first use costs). */
export const routeBytes = (route: string[]): number => route.reduce((n, k) => n + MODELS[k]!.bytes, 0);
