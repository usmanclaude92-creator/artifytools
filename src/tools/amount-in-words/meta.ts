import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "amount-in-words",
  slug: "amount-in-words",
  name: "Amount in Words",
  description: "Write any amount in words in English and Arabic, for cheques and invoices.",
  intro: [
    "Type an amount and pick a currency to get it written out in English and in Arabic (tafqeet), ready to copy onto a cheque, invoice, contract or receipt. For example, 523.050 Omani rials becomes “Five Hundred Twenty-Three Omani Rials and Fifty Baisa Only” and «فقط خمسمائة وثلاثة وعشرون ريالًا عمانيًا وخمسون بيسة لا غير».",
    "The Arabic follows the counting rules properly: duals, plurals after 3 to 10, the accusative after 11 to 99, and feminine subunits such as بيسة and هللة. Gulf currencies with three decimals (OMR, KWD, BHD, JOD) are handled correctly, and rupees use lakhs and crores.",
  ],
  category: "business",
  icon: "receipt",
  tags: ["amount in words", "tafqeet", "cheque", "invoice", "arabic"],
  keywords: ["amount in words", "number to words", "write amount in words", "cheque amount in words", "convert number to words arabic", "tafqeet", "omani rial in words", "dirham in words"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Amounts are converted in your browser. Nothing is sent or stored.",
  seoTitle: "Amount in Words: English & Arabic (Tafqeet) | Artify Tools",
  seoDescription: "Convert amounts to words in English and Arabic for cheques and invoices. OMR, AED, SAR, KWD, BHD, QAR, EGP, USD, INR and more. Free, instant, private.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Type the amount, using a dot for decimals (for example 1250.750).",
    "Choose the currency. Its subunit and number of decimals are set for you.",
    "Choose whether to add “Only” / «فقط … لا غير» and how to write the decimals.",
    "Copy the English or Arabic text.",
  ],
  examples: [
    { label: "Omani rials", input: "523.050 OMR", output: "Five Hundred Twenty-Three Omani Rials and Fifty Baisa Only\nفقط خمسمائة وثلاثة وعشرون ريالًا عمانيًا وخمسون بيسة لا غير" },
    { label: "Saudi riyals", input: "1500 SAR", output: "One Thousand Five Hundred Saudi Riyals Only\nفقط ألف وخمسمائة ريال سعودي لا غير" },
  ],
  faqs: [
    { question: "Why does the Arabic word for the currency change?", answer: "Arabic uses different forms depending on the number: ريال واحد (1), ريالان (2), ريالات (3–10), ريالًا (11–99) and ريال (100 and round thousands). The tool picks the right one automatically." },
    { question: "How are decimals written?", answer: "In words with the currency’s subunit (baisa, fils, halala, cents), or as a fraction such as 50/1000, which some banks prefer on cheques." },
    { question: "What is the largest amount supported?", answer: "Up to 999,999,999,999 in the main unit, with the subunit precision of the chosen currency (two or three decimals)." },
    { question: "Is this suitable for official documents?", answer: "The wording follows the usual cheque and invoice style. Always read the result before signing, as some institutions prefer their own phrasing." },
  ],
  popularRank: 2.15,
  related: ["cheque-printer", "vat-calculator", "percentage-calculator"],
};
