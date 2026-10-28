import type { Messages } from "@/lib/messages";
import type { CategoryId } from "@/lib/tools/types";

type NavKey = keyof Messages["nav"];

/** Header menu: the core sections first, then the full directory. */
export const primaryNav: readonly { href: string; key: NavKey; /** Tools of these categories drop down under the item. */ menu?: readonly CategoryId[] }[] = [
  { href: "/categories/pdf-converter", key: "pdfEditor", menu: ["pdf", "pdf-edit"] },
  { href: "/categories/images", key: "imageEditor", menu: ["images"] },
  { href: "/tools/document-translator", key: "translator" },
  { href: "/tools/bank-statement-converter", key: "bankStatements" },
  { href: "/tools/cheque-printer", key: "chequePrinter" },
  { href: "/tools", key: "tools" },
];

export const footerGroups: readonly { title: "explore" | "company" | "legal"; links: readonly { href: string; key: NavKey }[] }[] = [
  {
    title: "explore",
    links: [
      { href: "/tools", key: "tools" },
      { href: "/categories", key: "categories" },
      { href: "/categories/pdf-converter", key: "pdfConverter" },
      { href: "/categories/pdf-editor", key: "editPdf" },
      { href: "/tools/document-translator", key: "documentTranslator" },
      { href: "/categories/images", key: "images" },
      { href: "/for-professionals", key: "forProfessionals" },
    ],
  },
  {
    title: "company",
    links: [
      { href: "/about", key: "about" },
      { href: "/contact", key: "contact" },
      { href: "/help", key: "help" },
      { href: "/changelog", key: "changelog" },
    ],
  },
  {
    title: "legal",
    links: [
      { href: "/privacy", key: "privacy" },
      { href: "/terms", key: "terms" },
      { href: "/cookies", key: "cookies" },
    ],
  },
];
