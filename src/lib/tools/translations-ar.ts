import type { ToolTranslation } from "./localize";
import { metaAr as wordCounter } from "@/tools/word-counter/meta.ar";
import { metaAr as caseConverter } from "@/tools/case-converter/meta.ar";
import { metaAr as textCleaner } from "@/tools/text-cleaner/meta.ar";
import { metaAr as removeDuplicateLines } from "@/tools/remove-duplicate-lines/meta.ar";

/** Arabic text for each tool, keyed by tool id. Tools missing here are shown in English. */
export const toolTranslationsAr: Record<string, ToolTranslation> = {
  "word-counter": wordCounter,
  "case-converter": caseConverter,
  "text-cleaner": textCleaner,
  "remove-duplicate-lines": removeDuplicateLines,
};
