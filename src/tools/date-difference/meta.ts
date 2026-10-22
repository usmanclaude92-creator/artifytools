import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "date-difference",
  slug: "date-difference",
  name: "Date Difference Calculator",
  description: "Find the number of days, weeks, months, and business days between two dates.",
  intro: [
    "Choose two dates to see the gap as years, months, and days, as a total number of days and weeks, and as business days (Monday to Friday). Useful for project planning, notice periods, countdowns, and age calculations.",
    "The calculator works with calendar dates, not clock times, so there are no time-zone or daylight-saving surprises, and leap years are handled correctly. If the end date is earlier than the start date, the dates are swapped and you are told.",
  ],
  category: "time",
  icon: "calendar-range",
  tags: ["date", "days between", "calendar", "business days"],
  keywords: ["difference between dates", "days between dates", "date calculator", "how many days until", "weeks between dates", "working days between"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Dates are processed in your browser and are never sent anywhere.",
  seoTitle: "Date Difference Calculator: Days Between Dates | Artify Tools",
  seoDescription: "Calculate the days, weeks, months, and business days between two dates. Handles leap years. Free date calculator by Artify Tools.",
  lastUpdated: "2026-10-21",
  howTo: [
    "Pick a start date and an end date.",
    "Tick “Include end date” if both days should be counted (for example, a 3-day event from the 1st to the 3rd).",
    "Read the breakdown: years/months/days, total days, weeks, and business days.",
  ],
  examples: [
    { label: "Across a leap day", input: "2024-02-28 → 2024-03-01", output: "2 days" },
    { label: "Longer span", input: "2020-01-15 → 2024-03-20", output: "4 years, 2 months, 5 days" },
  ],
  faqs: [
    { question: "How are months counted when days don’t line up?", answer: "Whole months are counted from the start date, clamping to the last day of shorter months (31 Jan + 1 month = 28/29 Feb). The remaining days are counted from there." },
    { question: "Are business days affected by holidays?", answer: "No. Business days are simply Monday to Friday. Public holidays vary by country and aren’t subtracted." },
    { question: "Does it handle leap years?", answer: "Yes. Dates follow the Gregorian calendar, so 29 February exists only in leap years." },
  ],
  popularRank: 14,
  featuredRank: 2,
  related: ["percentage-calculator", "word-counter"],
};
