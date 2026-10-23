import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "hijri-date-converter",
  slug: "hijri-date-converter",
  name: "Hijri Date Converter",
  description: "Convert dates between the Hijri (Umm al-Qura) and Gregorian calendars, with the weekday.",
  intro: [
    "Convert a Gregorian date to the Hijri calendar, or a Hijri date to the Gregorian calendar. The result shows the full date with the weekday and month names, the numeric form for forms and documents, and how many days the Hijri month has.",
    "Dates are converted with the Umm al-Qura calendar, the official calendar of Saudi Arabia, for 1343–1500 AH (1924–2077). Religious occasions such as Ramadan and Eid are confirmed by moon sighting and can differ from the calendar by a day.",
  ],
  category: "time",
  icon: "calendar-range",
  tags: ["hijri", "islamic calendar", "umm al-qura", "date converter"],
  keywords: ["hijri to gregorian", "gregorian to hijri", "hijri date today", "islamic date converter", "umm al qura calendar", "hijri calendar converter", "convert hijri date"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Dates are converted in your browser and never leave your device.",
  seoTitle: "Hijri Date Converter: Hijri ↔ Gregorian | Artify Tools",
  seoDescription: "Convert Hijri dates to Gregorian and Gregorian to Hijri with the official Umm al-Qura calendar. Weekday, month names and numeric dates, free.",
  lastUpdated: "2026-10-23",
  howTo: [
    "Choose the direction: Gregorian → Hijri or Hijri → Gregorian.",
    "Pick the date, or press Today.",
    "Read the converted date and copy it in full or numeric form.",
  ],
  examples: [
    { label: "Gregorian → Hijri", input: "23 October 2026", output: "Friday, 12 Jumada al-Ula 1448 AH" },
    { label: "Hijri → Gregorian", input: "1 Ramadan 1447", output: "Wednesday, 18 February 2026" },
  ],
  faqs: [
    { question: "Which Hijri calendar is used?", answer: "The Umm al-Qura calendar, the official calendar of Saudi Arabia, which is used for government and business dates there." },
    { question: "Why might Ramadan or Eid fall a day differently?", answer: "Religious months begin when the new moon is sighted. Saudi Arabia, Oman and other countries announce their own sightings, which can be a day off the calendar." },
    { question: "Which years are supported?", answer: "1343 to 1500 AH, which is August 1924 to November 2077." },
    { question: "Why can't I choose the 30th?", answer: "Hijri months have 29 or 30 days. If the month you chose has 29 days, the tool tells you instead of guessing." },
  ],
  popularRank: 2.95,
  related: ["date-difference", "end-of-service-calculator", "amount-in-words"],
};
