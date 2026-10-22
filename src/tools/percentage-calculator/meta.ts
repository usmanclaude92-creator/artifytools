import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "percentage-calculator",
  slug: "percentage-calculator",
  name: "Percentage Calculator",
  description: "Calculate percentages, differences, and changes.",
  intro: [
    "Three of the most common percentage questions in one place: what is X% of Y, X is what percent of Y, and what is the percentage increase or decrease from one value to another.",
    "Calculations use exact decimal arithmetic rather than floating-point maths, so results such as 12.5% of 80 are precisely 10 and rounding is predictable. You can enter numbers with thousands separators like 1,250.50.",
  ],
  category: "calculators",
  icon: "percent",
  tags: ["percent", "percentage", "increase", "decrease"],
  keywords: ["calculate a percentage", "percent of a number", "percentage change", "percentage increase", "percentage difference", "what percent is"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "The numbers you enter are used only for the calculation in your browser and are never transmitted.",
  seoTitle: "Percentage Calculator: Percent of, Change & More | Artify Tools",
  seoDescription: "Calculate what X% of Y is, what percent one number is of another, and percentage increase or decrease — exact results with Artify Tools' free percentage calculator.",
  lastUpdated: "2026-10-21",
  howTo: [
    "Pick the type of question you want to answer.",
    "Enter the two numbers. Results appear as soon as both are valid.",
    "Copy the result, or reset to try new numbers.",
  ],
  examples: [
    { label: "15% of 200", input: "15, 200", output: "30" },
    { label: "25 is what % of 200", input: "25, 200", output: "12.5%" },
    { label: "Change from 80 to 60", input: "80 → 60", output: "-25%" },
  ],
  faqs: [
    { question: "How is percentage change calculated?", answer: "(new − old) ÷ |old| × 100. A positive result is an increase and a negative result a decrease. It is undefined when the starting value is zero." },
    { question: "How are results rounded?", answer: "Results are rounded to two decimal places using half-away-from-zero rounding, and trailing zeros are removed (12.50 is shown as 12.5)." },
    { question: "Is percentage change the same as percentage-point difference?", answer: "No. Going from 10% to 15% is a 5 percentage-point difference but a 50% relative increase. This tool calculates the relative change." },
  ],
  popularRank: 3,
  related: ["discount-calculator", "vat-calculator", "date-difference"],
};
