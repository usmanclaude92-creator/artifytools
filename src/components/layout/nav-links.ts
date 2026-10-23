import type { Messages } from "@/lib/messages";

type NavKey = keyof Messages["nav"];

/** Header menu: the core sections first, then the full directory. */
export const primaryNav: readonly { href: string; key: NavKey }[] = [
  { href: "/categories/pdf-converter", key: "pdfConverter" },
  { href: "/categories/pdf-editor", key: "editPdf" },
  { href: "/tools/bank-statement-converter", key: "bankStatements" },
  { href: "/tools/cheque-printer", key: "chequePrinter" },
  { href: "/categories/images", key: "images" },
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
