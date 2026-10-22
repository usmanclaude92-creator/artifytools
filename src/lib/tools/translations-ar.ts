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
import { metaAr as passwordGenerator } from "@/tools/password-generator/meta.ar";
import { metaAr as qrCodeGenerator } from "@/tools/qr-code-generator/meta.ar";
import { metaAr as colorConverter } from "@/tools/color-converter/meta.ar";
import { metaAr as aiTextSummarizer } from "@/tools/ai-text-summarizer/meta.ar";
import { metaAr as mergePdf } from "@/tools/merge-pdf/meta.ar";
import { metaAr as splitPdf } from "@/tools/split-pdf/meta.ar";
import { metaAr as jpgToPdf } from "@/tools/jpg-to-pdf/meta.ar";
import { metaAr as compressPdf } from "@/tools/compress-pdf/meta.ar";
import { metaAr as compressImage } from "@/tools/compress-image/meta.ar";
import { metaAr as amountInWords } from "@/tools/amount-in-words/meta.ar";
import { metaAr as chequePrinter } from "@/tools/cheque-printer/meta.ar";

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
  "password-generator": passwordGenerator,
  "qr-code-generator": qrCodeGenerator,
  "color-converter": colorConverter,
  "ai-text-summarizer": aiTextSummarizer,
  "merge-pdf": mergePdf,
  "split-pdf": splitPdf,
  "jpg-to-pdf": jpgToPdf,
  "compress-pdf": compressPdf,
  "compress-image": compressImage,
  "amount-in-words": amountInWords,
  "cheque-printer": chequePrinter,
};
