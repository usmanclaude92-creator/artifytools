import type { ToolTranslation } from "./localize";
import { metaAr as wordCounter } from "@/tools/word-counter/meta.ar";
import { metaAr as caseConverter } from "@/tools/case-converter/meta.ar";
import { metaAr as textCleaner } from "@/tools/text-cleaner/meta.ar";
import { metaAr as removeDuplicateLines } from "@/tools/remove-duplicate-lines/meta.ar";
import { metaAr as percentageCalculator } from "@/tools/percentage-calculator/meta.ar";
import { metaAr as vatCalculator } from "@/tools/vat-calculator/meta.ar";
import { metaAr as discountCalculator } from "@/tools/discount-calculator/meta.ar";
import { metaAr as dateDifference } from "@/tools/date-difference/meta.ar";
import { metaAr as jsonFormatter } from "@/tools/json-formatter/meta.ar";
import { metaAr as urlEncoderDecoder } from "@/tools/url-encoder-decoder/meta.ar";
import { metaAr as base64EncoderDecoder } from "@/tools/base64-encoder-decoder/meta.ar";
import { metaAr as uuidGenerator } from "@/tools/uuid-generator/meta.ar";

/** Arabic text for each tool, keyed by tool id. Tools missing here are shown in English. */
export const toolTranslationsAr: Record<string, ToolTranslation> = {
  "word-counter": wordCounter,
  "case-converter": caseConverter,
  "text-cleaner": textCleaner,
  "remove-duplicate-lines": removeDuplicateLines,
  "percentage-calculator": percentageCalculator,
  "vat-calculator": vatCalculator,
  "discount-calculator": discountCalculator,
  "date-difference": dateDifference,
  "json-formatter": jsonFormatter,
  "url-encoder-decoder": urlEncoderDecoder,
  "base64-encoder-decoder": base64EncoderDecoder,
  "uuid-generator": uuidGenerator,
};
