import type { IconName } from "@/components/ui/icon";
import type { Tone } from "@/lib/tools/tones";
import type { CategoryId } from "@/lib/tools/types";

/**
 * The five core sections shown first on the home page and in the header.
 * A section points either to a category (its tools are listed) or to one main tool.
 */
export interface CoreSection {
  id: string;
  icon: IconName;
  tone: Tone;
  /** Category whose page the card opens, or the main tool's slug. */
  category?: CategoryId;
  tool?: string;
  /** Up to three tools linked straight from the card. */
  quick: string[];
  text: { en: { name: string; description: string }; ar: { name: string; description: string } };
}

export const coreSections: CoreSection[] = [
  {
    id: "pdf-converter",
    icon: "file-text",
    tone: "blue",
    category: "pdf",
    quick: ["pdf-to-word", "word-to-pdf", "pdf-to-excel"],
    text: {
      en: { name: "PDF Converter", description: "PDF to and from Word, Excel and JPG, with tables, Arabic and layout kept." },
      ar: { name: "محوّل PDF", description: "من PDF وإليه: Word وExcel وJPG، مع الحفاظ على الجداول والعربية والتنسيق." },
    },
  },
  {
    id: "pdf-editor",
    icon: "layers",
    tone: "violet",
    category: "pdf-edit",
    quick: ["merge-pdf", "compress-pdf", "watermark-pdf"],
    text: {
      en: { name: "Edit & Organise PDF", description: "Merge, split, compress, rotate, number, watermark and password-protect pages." },
      ar: { name: "تعديل وتنظيم PDF", description: "دمج الصفحات وتقسيمها وضغطها وتدويرها وترقيمها وإضافة علامة مائية وكلمة مرور." },
    },
  },
  {
    id: "bank-statements",
    icon: "receipt",
    tone: "green",
    tool: "bank-statement-converter",
    quick: ["pdf-to-excel"],
    text: {
      en: { name: "Bank Statement Converter", description: "Turn PDF bank statements into clean Excel or CSV, with every balance checked." },
      ar: { name: "تحويل كشوف الحساب", description: "حوّل كشوف الحساب البنكية من PDF إلى Excel أو CSV منظّم مع مطابقة كل رصيد." },
    },
  },
  {
    id: "cheque-printer",
    icon: "printer",
    tone: "amber",
    tool: "cheque-printer",
    quick: ["amount-in-words"],
    text: {
      en: { name: "Cheque Printer", description: "Print the date, payee and amount in words on any bank's cheque, lined up exactly." },
      ar: { name: "طباعة الشيكات", description: "اطبع التاريخ واسم المستفيد والمبلغ كتابةً على شيك أي بنك بدقة في مكانها." },
    },
  },
  {
    id: "image-studio",
    icon: "image",
    tone: "pink",
    category: "images",
    quick: ["remove-background", "compress-image", "image-to-text"],
    text: {
      en: { name: "Image Studio", description: "Remove backgrounds, compress, resize and crop photos, and read text from images." },
      ar: { name: "استوديو الصور", description: "أزل الخلفية واضغط الصور وغيّر حجمها وقصّها واستخرج النص منها." },
    },
  },
];

/** Smaller tools listed under "More useful tools" on the home page, by worldwide demand. */
export const moreToolSlugs = [
  "qr-code-generator",
  "percentage-calculator",
  "word-counter",
  "end-of-service-calculator",
  "amount-in-words",
  "vat-calculator",
  "hijri-date-converter",
  "password-generator",
];
