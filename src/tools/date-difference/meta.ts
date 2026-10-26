import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "date-difference",
  slug: "date-difference",
  name: "Date Calculator",
  description: "Find the days, weeks, months and business days between two dates, or add and subtract days, months and years.",
  intro: [
    "Two calculators in one. Choose two dates to see the gap as years, months, and days, as a total number of days and weeks, and as business days (Monday to Friday). Or pick a date and add or subtract days, months and years to find the date that results, such as a deadline 90 days from today or the date 18 months ago.",
    "The calculator works with calendar dates, not clock times, so there are no time-zone or daylight-saving surprises, and leap years are handled correctly. When a month is shorter, the result lands on its last day (31 January plus one month is 28 or 29 February). If the end date is earlier than the start date, the dates are swapped and you are told.",
  ],
  category: "time",
  icon: "calendar-range",
  tags: ["date", "days between", "calendar", "business days", "add days", "subtract days"],
  keywords: ["difference between dates", "days between dates", "date calculator", "how many days until", "weeks between dates", "working days between", "add days to date", "subtract days from date", "date plus days", "add months to date", "what date is 90 days from today", "date calculator"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Dates are processed in your browser and are never sent anywhere.",
  seoTitle: "Date Calculator: Days Between, Add & Subtract | Artify Tools",
  seoDescription: "Calculate the days between two dates, or add and subtract days, months and years from a date. Handles leap years. Free date calculator by Artify Tools.",
  lastUpdated: "2026-10-26",
  howTo: [
    "Choose “Difference between dates” or “Add or subtract”.",
    "For a difference, pick a start and an end date. Tick “Include end date” if both days should be counted (for example, a 3-day event from the 1st to the 3rd).",
    "To add or subtract, pick a starting date, choose Add or Subtract, and enter years, months and days. Leave a box empty for zero.",
    "Read the result: the breakdown and business days, or the new date with its weekday.",
  ],
  examples: [
    { label: "Across a leap day", input: "2024-02-28 → 2024-03-01", output: "2 days" },
    { label: "Longer span", input: "2020-01-15 → 2024-03-20", output: "4 years, 2 months, 5 days" },
    { label: "Add a month to a month-end", input: "2024-01-31 + 1 month", output: "2024-02-29 (Thursday)" },
    { label: "Subtract days", input: "2026-10-26 − 90 days", output: "2026-07-28 (Tuesday)" },
  ],
  faqs: [
    { question: "How are months counted when days don’t line up?", answer: "Whole months are counted from the start date, clamping to the last day of shorter months (31 Jan + 1 month = 28/29 Feb). The remaining days are counted from there." },
    { question: "In what order are years, months and days applied?", answer: "Years and months are applied first, keeping the day of the month or the last day of a shorter month, then the days are added or subtracted. So 31 Jan + 1 month + 1 day is 1 March in a common year, not 2 March." },
    { question: "Are business days affected by holidays?", answer: "No. Business days are simply Monday to Friday. Public holidays vary by country and aren’t subtracted." },
    { question: "Does it handle leap years?", answer: "Yes. Dates follow the Gregorian calendar, so 29 February exists only in leap years." },
    { question: "How far can I add or subtract?", answer: "Up to 1,000,000 of each unit, as long as the result stays within the years 1 to 9999." },
  ],
  popularRank: 14,
  featuredRank: 2,
  related: ["percentage-calculator", "word-counter"],
};
