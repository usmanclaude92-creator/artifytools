import type { IconName } from "@/components/ui/icon";
import type { Tone } from "@/lib/tools/tones";
import type { CategoryId } from "@/lib/tools/types";

/**
 * The four core sections shown first on the home page and in the header.
 * A section points either to a category (its tools are listed) or to one main tool.
 */
export interface CoreSection {
  id: string;
  icon: IconName;
  tone: Tone;
  /** Category whose page the card opens, or the main tool's slug. */
  category?: CategoryId;
  /** Further categories the card also covers, each linked at the bottom of the card. */
  alsoCategories?: CategoryId[];
  tool?: string;
  /** Up to three tools linked straight from the card. */
  quick: string[];
  text: { en: { name: string; description: string }; ar: { name: string; description: string } };
}

export const coreSections: CoreSection[] = [
  {
    id: "pdf",
    icon: "file-text",
    tone: "blue",
    category: "pdf",
    alsoCategories: ["pdf-edit"],
    quick: ["pdf-to-word", "word-to-pdf", "pdf-to-excel", "merge-pdf", "compress-pdf"],
    text: {
      en: { name: "PDF Converter & Editor", description: "Convert PDFs to and from Word, Excel and JPG, then merge, split, compress, rotate, number, watermark and protect them." },
      ar: { name: "محوّل ومحرّر PDF", description: "حوّل ملفات PDF من Word وExcel وJPG وإليها، ثم ادمجها وقسّمها واضغطها ودوّرها ورقّمها وأضف إليها علامة مائية واحمِها." },
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
