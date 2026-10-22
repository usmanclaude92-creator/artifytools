import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "vat-calculator",
  slug: "vat-calculator",
  name: "VAT Calculator",
  description: "Add VAT to a net price or remove it from a gross price at any rate.",
  intro: [
    "Enter an amount and a VAT (or sales tax) rate to see the net price, the tax amount, and the gross price. Switch direction to either add tax to a net amount or extract the tax already included in a gross amount.",
    "You type the rate yourself because VAT rates differ by country, by product category, and over time; check the rate that applies to your transaction with your tax authority. Amounts are calculated with exact decimals and rounded to cents, so net plus VAT always equals gross.",
  ],
  category: "calculators",
  icon: "receipt",
  tags: ["vat", "tax", "invoice", "sales tax"],
  keywords: ["add vat", "remove vat", "price including vat", "price excluding vat", "gross to net", "net to gross", "calculate tax"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Amounts are calculated in your browser and never leave your device.",
  seoTitle: "VAT Calculator: Add or Remove VAT Online | Artify Tools",
  seoDescription: "Add VAT to a net price or remove it from a gross price at any rate. Exact, rounded-to-cents results from Artify Tools' free VAT calculator.",
  lastUpdated: "2026-10-21",
  howTo: [
    "Choose “Add VAT” if your amount excludes tax, or “Remove VAT” if it already includes tax.",
    "Enter the amount and the VAT rate as a percentage.",
    "Read the net, VAT, and gross figures, and copy the ones you need.",
  ],
  examples: [
    { label: "Add 20% VAT to 100", input: "100 @ 20%", output: "Net 100.00 · VAT 20.00 · Gross 120.00" },
    { label: "Remove 19% VAT from 99.99", input: "99.99 @ 19%", output: "Net 84.03 · VAT 15.96 · Gross 99.99" },
  ],
  faqs: [
    { question: "What is the formula?", answer: "To add VAT: gross = net × (1 + rate/100). To remove VAT: net = gross ÷ (1 + rate/100). The VAT amount is the difference." },
    { question: "Which VAT rate should I use?", answer: "Use the rate that applies to your goods or services and jurisdiction. The calculator does not look up rates, so it never goes out of date." },
    { question: "Why might my invoice differ by a cent?", answer: "Invoices with several lines can round per line or on the total. This tool rounds the VAT on the single amount you enter." },
  ],
  popularRank: 6,
  featuredRank: 5,
  related: ["percentage-calculator", "discount-calculator"],
};
