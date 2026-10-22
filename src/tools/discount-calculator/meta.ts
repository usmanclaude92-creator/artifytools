import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "discount-calculator",
  slug: "discount-calculator",
  name: "Discount Calculator",
  description: "Work out the sale price and savings after a discount, or the discount from two prices.",
  intro: [
    "See what you will pay after a percentage discount, how much you save, and the effective discount when two offers are stacked. Or go the other way: enter the original and sale prices to find out how big the discount really is.",
    "A second discount is applied to the already reduced price, which is how most “extra 10% off” promotions work, so 20% followed by 10% is a 28% total saving, not 30%.",
  ],
  category: "calculators",
  icon: "tag",
  tags: ["discount", "sale", "price", "savings"],
  keywords: ["percent off", "sale price calculator", "calculate discount", "how much is 20% off", "price after discount", "double discount"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Prices are calculated in your browser. Nothing is sent or stored.",
  seoTitle: "Discount Calculator: Sale Price & Savings | Artify Tools",
  seoDescription: "Calculate the sale price after a discount, stack a second discount, or find the percentage off from two prices — free with Artify Tools.",
  lastUpdated: "2026-10-21",
  howTo: [
    "Choose “Price after discount” or “Find the discount”.",
    "Enter the prices and percentages requested.",
    "Read the final price, amount saved, and effective discount.",
  ],
  examples: [
    { label: "25% off 80", input: "80, 25%", output: "Pay 60.00 · Save 20.00" },
    { label: "20% then 10% off 100", input: "100, 20%, 10%", output: "Pay 72.00 · Save 28.00 (28%)" },
  ],
  faqs: [
    { question: "Why isn’t 20% + 10% the same as 30% off?", answer: "The second discount applies to the reduced price. 100 − 20% = 80, then 80 − 10% = 72, a total saving of 28%." },
    { question: "Can I enter a sale price higher than the original?", answer: "Yes, in “Find the discount” mode. The result is then negative, meaning a price increase." },
    { question: "Does it include tax?", answer: "No. Enter prices on the same tax basis you care about. Use the VAT Calculator to add or remove tax." },
  ],
  popularRank: 9,
  related: ["percentage-calculator", "vat-calculator"],
};
