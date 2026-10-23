import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "cheque-printer",
  slug: "cheque-printer",
  name: "Cheque Printer",
  description: "Fill in and print cheques on your own printer, with layouts by country and the amount in words.",
  intro: [
    "Print the date, payee, amount in figures and amount in words straight onto your bank's cheque leaves using any office printer. Pick a starting layout for your country (Oman, UAE, Saudi Arabia, Kuwait, Bahrain, Qatar, Egypt, Jordan, India, Pakistan, the UK, the US, Canada or Europe), check it with a test print on plain paper, then fine-tune each position in millimetres and save it for next time.",
    "The amount in words is written for you in Arabic or English, with the right forms for rials, dirhams, dinars and the three-decimal Gulf currencies. You can add a crossing such as “A/C Payee Only”, protect the figures with asterisks, and print many cheques at once by pasting rows from Excel.",
  ],
  category: "business",
  icon: "printer",
  tags: ["cheque", "check", "printing", "amount in words", "arabic"],
  keywords: ["cheque printing", "cheque printing software", "check printing", "print cheque online", "cheque writer", "cheque filler", "cheque printing oman", "cheque printing uae", "check printing software free"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Everything stays in your browser. Payees and amounts are never sent anywhere; saved layouts are kept only on this device.",
  seoTitle: "Cheque Printer: Fill & Print Cheques Online | Artify Tools",
  seoDescription: "Print cheques on your own printer with layouts for Oman, UAE, Saudi Arabia, India, the UK, US and more. Amount in words in Arabic and English, batch printing. Free.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose the layout for your country and whether the cheque goes into the printer on its own or attached to an A4 sheet.",
    "Do a test print on plain paper and hold it against a cheque leaf in front of a light.",
    "Open “Adjust positions” and move any field that is off, in millimetres. Save the layout.",
    "Enter the payee, date and amount, check the preview, and print onto the real cheque.",
  ],
  examples: [
    { label: "Oman cheque", input: "Al Noor Trading LLC · 1250.500 OMR", output: "**1,250.500**\nفقط ألف ومائتان وخمسون ريالًا عمانيًا وخمسمائة بيسة لا غير" },
    { label: "US business check", input: "Acme Supplies Inc. · 980.25 USD", output: "**980.25**\nNINE HUNDRED EIGHTY US DOLLARS AND TWENTY-FIVE CENTS ONLY" },
  ],
  faqs: [
    { question: "Are the layouts exact for my bank?", answer: "No layout can be exact for every bank, because cheque designs differ even within one country. The Canadian amount box follows the CPA-006 standard and the Indian size follows CTS-2010; every other layout is a starting point. Always do a test print on plain paper, adjust, and save the layout for your bank." },
    { question: "Can I print blank cheques with this?", answer: "No. Banks only accept cheques printed by the bank or its approved printers, with the security features and MICR line. This tool only fills in the details on cheque leaves your bank gave you." },
    { question: "My printout is shifted slightly. What should I do?", answer: "Use the printer offset to move everything together, or adjust single fields. In the print dialog, set the scale to 100% (actual size) and margins to none." },
    { question: "Is my data stored?", answer: "No. Everything runs in your browser. Saved layouts contain only positions and sizes and are stored on this device; you can export them as a file to use on another computer." },
  ],
  popularRank: 2.1,
  related: ["amount-in-words", "vat-calculator", "date-difference"],
};
