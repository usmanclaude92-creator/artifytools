import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "end-of-service-calculator",
  slug: "end-of-service-calculator",
  name: "End of Service Gratuity Calculator",
  description: "Estimate end-of-service gratuity under Saudi, UAE and Omani labour law, with a year-by-year breakdown.",
  intro: [
    "Enter the start date, the last working day and the salary to see the end-of-service gratuity (end-of-service benefit) due under the labour law of Saudi Arabia, the United Arab Emirates or Oman. The result shows the service period, the wage used and how each part of the amount is worked out.",
    "Each country counts differently. Saudi Arabia pays half a month's full wage for each of the first five years and a month for each later year, reduced on resignation. The UAE pays 21 days' basic salary per year for five years, then 30 days. Oman pays one month's basic salary per year since August 2023, and the old rates for earlier service. Everything is calculated in your browser.",
  ],
  category: "business",
  icon: "briefcase",
  tags: ["gratuity", "end of service", "labour law", "saudi", "uae", "oman"],
  keywords: ["end of service calculator", "gratuity calculator", "uae gratuity calculator", "saudi end of service award", "oman gratuity calculator", "esb calculator", "end of service benefit", "final settlement"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your dates and salary are calculated in your browser and never leave your device.",
  seoTitle: "End of Service Gratuity Calculator: KSA, UAE, Oman | Artify Tools",
  seoDescription: "Calculate end-of-service gratuity under Saudi, UAE and Omani labour law. Resignation rules, unpaid leave and a printable breakdown, free.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose the country whose labour law applies to the job.",
    "Enter the start date and the last working day, then the monthly salary (and, for Saudi Arabia, the fixed allowances and how the job ended).",
    "Read the gratuity and its breakdown, and print it or save it as a PDF if you need a copy.",
  ],
  examples: [
    { label: "Saudi Arabia, 7 years, ended by employer", input: "Basic 6,000 + allowances 2,000 SAR", output: "5 × 4,000 + 2 × 8,000 = 36,000.00 SAR" },
    { label: "UAE, 8 years", input: "Basic 10,000 AED", output: "21 days × 5 years + 30 days × 3 years = 65,000.00 AED" },
    { label: "Oman, Aug 2021 – Jul 2025", input: "Basic 500 OMR", output: "2 × 250 (old law) + 2 × 500 (new law) = 1,500.000 OMR" },
  ],
  faqs: [
    { question: "Which salary is used?", answer: "Saudi Arabia uses the last full wage: basic salary plus housing, transport and other regular allowances. The UAE and Oman use the last basic salary only." },
    { question: "What happens if I resign in Saudi Arabia?", answer: "Under article 85 you get nothing for less than 2 years, a third of the award for 2 to 5 years, two thirds for more than 5 and under 10 years, and the full award after 10 years. Force majeure, and women leaving within 6 months of marriage or 3 months of giving birth, receive the full award." },
    { question: "Does resignation reduce gratuity in the UAE?", answer: "No. Since Federal Decree-Law 33 of 2021, employees who resign receive the same 21 and 30-day rates once they complete one year. The total can't exceed two years' wage." },
    { question: "How is gratuity calculated in Oman?", answer: "For non-Omanis, service from 1 August 2023 earns one month's basic salary per year. Service before that uses the old rate of 15 days per year for the first three years and one month after. From 19 July 2027 a savings fund replaces gratuity." },
    { question: "Are part years counted?", answer: "Yes. Months and days of an unfinished year count in proportion, and unpaid leave is taken off the service period." },
  ],
  popularRank: 2.8,
  related: ["vat-calculator", "date-difference", "amount-in-words"],
};
