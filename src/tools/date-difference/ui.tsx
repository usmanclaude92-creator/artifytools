"use client";

import { useMemo, useState } from "react";
import { IdleHint, Panel, Stat, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/actions";
import { Checkbox, Field, Segmented, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { translateMessage, type MessageRule } from "@/lib/translate-message";
import { dateDifference, shiftDate, type Direction } from "./logic";

const nf = new Intl.NumberFormat("en-US");
type Unit = "year" | "month" | "day";
const pluralEn = (n: number, unit: Unit) => `${nf.format(n)} ${unit}${n === 1 ? "" : "s"}`;
const unitsAr: Record<Unit, [string, string, string, string, string]> = {
  year: ["سنة واحدة", "سنتان", "سنوات", "سنة", "سنة"],
  month: ["شهر واحد", "شهران", "أشهر", "شهرًا", "شهر"],
  day: ["يوم واحد", "يومان", "أيام", "يومًا", "يوم"],
};
const pluralAr = (n: number, unit: Unit) => arCount(n, ...unitsAr[unit]);
const weekdaysAr: Record<string, string> = { Sunday: "الأحد", Monday: "الاثنين", Tuesday: "الثلاثاء", Wednesday: "الأربعاء", Thursday: "الخميس", Friday: "الجمعة", Saturday: "السبت" };

const rulesAr: MessageRule[] = [
  [/^Choose both a start date and an end date\.$/, "اختر تاريخ البداية وتاريخ النهاية."],
  [/^The start date isn't a valid date \(use YYYY-MM-DD\)\.$/, "تاريخ البداية غير صالح (استخدم الصيغة YYYY-MM-DD)."],
  [/^The end date isn't a valid date \(use YYYY-MM-DD\)\.$/, "تاريخ النهاية غير صالح (استخدم الصيغة YYYY-MM-DD)."],
  [/^Choose a start date\.$/, "اختر تاريخ البداية."],
  [/^Enter whole numbers of years, months and days \(0 to 1,000,000\)\.$/, "أدخل أعدادًا صحيحة للسنوات والأشهر والأيام (من 0 إلى 1,000,000)."],
  [/^The result is outside the supported years \(1 to 9999\)\.$/, "النتيجة خارج السنوات المدعومة (من 1 إلى 9999)."],
];

const strings = {
  en: {
    choose: "Choose dates", start: "Start date", end: "End date", today: "Today", include: "Include the end date", includeHint: "Counts both the first and last day (e.g. 1st–3rd is 3 days)",
    swap: "Swap dates", difference: "Difference", idle: "Pick a start and end date to see the difference.", swapped: "The end date is before the start date, so the dates were swapped for this result.",
    between: "Time between", totalDays: "Total days", weeks: "Weeks", business: "Business days", businessHint: "Mon–Fri, no holidays", hours: "Hours", hoursHint: "Calendar days × 24",
    plural: pluralEn, weekday: (d: string) => d, joiner: ", ", arrow: "→", rules: null,
    mode: "Calculation", modes: { difference: "Difference between dates", shift: "Add or subtract" },
    shiftStart: "Starting date", operation: "Operation", ops: { add: "Add", subtract: "Subtract" }, years: "Years", months: "Months", days: "Days",
    shiftIdle: "Pick a starting date and enter the years, months or days to add or subtract.", resultDate: "Resulting date", copy: "Copy date", dayOfWeek: "Day of the week", fromStart: "Days from the start",
    dayCount: (n: number) => (n === 0 ? "Same day as the start date" : `${nf.format(Math.abs(n))} day${Math.abs(n) === 1 ? "" : "s"} ${n > 0 ? "after" : "before"} the start date`),
    locale: "en-US", shiftNote: "Years and months move first, keeping the day of the month (or the last day of a shorter month), then days are counted.",
  },
  ar: {
    choose: "اختر التاريخين", start: "تاريخ البداية", end: "تاريخ النهاية", today: "اليوم", include: "احتساب يوم النهاية", includeHint: "يعدّ اليوم الأول والأخير معًا (من 1 إلى 3 = 3 أيام)",
    swap: "تبديل التاريخين", difference: "الفرق", idle: "اختر تاريخ البداية والنهاية لترى الفرق.", swapped: "تاريخ النهاية قبل تاريخ البداية، لذلك بُدِّل التاريخان في هذه النتيجة.",
    between: "المدة بينهما", totalDays: "إجمالي الأيام", weeks: "الأسابيع", business: "أيام العمل", businessHint: "من الاثنين إلى الجمعة، دون العطلات", hours: "الساعات", hoursHint: "عدد الأيام × 24",
    plural: pluralAr, weekday: (d: string) => weekdaysAr[d] ?? d, joiner: "، ", arrow: "←", rules: rulesAr,
    mode: "نوع الحساب", modes: { difference: "الفرق بين تاريخين", shift: "إضافة أو طرح" },
    shiftStart: "تاريخ البداية", operation: "العملية", ops: { add: "إضافة", subtract: "طرح" }, years: "السنوات", months: "الأشهر", days: "الأيام",
    shiftIdle: "اختر تاريخ البداية وأدخل السنوات أو الأشهر أو الأيام المراد إضافتها أو طرحها.", resultDate: "التاريخ الناتج", copy: "نسخ التاريخ", dayOfWeek: "اليوم", fromStart: "الأيام منذ البداية",
    dayCount: (n: number) => (n === 0 ? "نفس يوم تاريخ البداية" : `${pluralAr(Math.abs(n), "day")} ${n > 0 ? "بعد" : "قبل"} تاريخ البداية`),
    locale: "ar-u-nu-latn", shiftNote: "تتحرك السنوات والأشهر أولًا مع الإبقاء على يوم الشهر (أو آخر يوم في الشهر الأقصر)، ثم تُحتسب الأيام.",
  },
};

function todayIso(): string {
  const d = new Date();
  return `${String(d.getFullYear()).padStart(4, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Difference() {
  const t = strings[useLocale()];
  const ui = useMessages().ui;
  const plural = t.plural;
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [inclusive, setInclusive] = useState(false);
  const touched = start !== "" || end !== "";
  const outcome = useMemo(() => (touched ? dateDifference(start, end, inclusive) : null), [start, end, inclusive, touched]);
  const incomplete = !start || !end;

  return (
    <Workspace>
      <Panel title={t.choose}>
        <Field label={t.start}>
          {(p) => (
            <div className="flex gap-2">
              <TextInput {...p} type="date" value={start} min="0001-01-01" max="9999-12-31" onChange={(e) => setStart(e.target.value)} />
              <Button variant="secondary" onClick={() => setStart(todayIso())}>{t.today}</Button>
            </div>
          )}
        </Field>
        <Field label={t.end}>
          {(p) => (
            <div className="flex gap-2">
              <TextInput {...p} type="date" value={end} min="0001-01-01" max="9999-12-31" onChange={(e) => setEnd(e.target.value)} />
              <Button variant="secondary" onClick={() => setEnd(todayIso())}>{t.today}</Button>
            </div>
          )}
        </Field>
        <Checkbox label={t.include} hint={t.includeHint} checked={inclusive} onChange={(e) => setInclusive(e.target.checked)} />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" disabled={!start && !end} onClick={() => { setStart(end); setEnd(start); }}>
            <Icon name="arrow-up-down" size={16} /> {t.swap}
          </Button>
          <Button variant="ghost" size="sm" disabled={!touched} onClick={() => { setStart(""); setEnd(""); setInclusive(false); }}>
            <Icon name="rotate-ccw" size={16} /> {ui.reset}
          </Button>
        </div>
      </Panel>

      <Panel title={t.difference}>
        {!outcome && <IdleHint>{t.idle}</IdleHint>}
        {outcome && !outcome.ok && (incomplete ? <IdleHint>{translateMessage(outcome.error, t.rules)}</IdleHint> : <StatusMessage tone="error">{translateMessage(outcome.error, t.rules)}</StatusMessage>)}
        {outcome?.ok && (
          <div className="flex flex-col gap-4" aria-live="polite">
            {outcome.result.swapped && <StatusMessage tone="info">{t.swapped}</StatusMessage>}
            <div className="rounded-md bg-accent-soft px-4 py-4">
              <p className="text-sm text-muted">{t.between}</p>
              <p className="text-xl font-semibold sm:text-2xl">
                {[
                  outcome.result.years ? plural(outcome.result.years, "year") : "",
                  outcome.result.months ? plural(outcome.result.months, "month") : "",
                  outcome.result.days || (!outcome.result.years && !outcome.result.months) ? plural(outcome.result.days, "day") : "",
                ].filter(Boolean).join(t.joiner)}
              </p>
              <p className="mt-1 text-sm text-muted">{t.weekday(outcome.result.startWeekday)} {t.arrow} {t.weekday(outcome.result.endWeekday)}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              <Stat label={t.totalDays} value={nf.format(outcome.result.totalDays)} />
              <Stat label={t.weeks} value={`${nf.format(outcome.result.weeks)}`} hint={`+ ${plural(outcome.result.remainderDays, "day")}`} />
              <Stat label={t.business} value={nf.format(outcome.result.businessDays)} hint={t.businessHint} />
              <Stat label={t.hours} value={nf.format(outcome.result.totalHours)} hint={t.hoursHint} />
            </dl>
          </div>
        )}
      </Panel>
    </Workspace>
  );
}

/** Long form of a date, e.g. "Monday, 2 November 2026", without time-zone shifts. */
function longDate(y: number, m: number, d: number, locale: string): string {
  const date = new Date(Date.UTC(2000, m - 1, d));
  date.setUTCFullYear(y);
  return new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }).format(date);
}

function Shift() {
  const t = strings[useLocale()];
  const ui = useMessages().ui;
  const [start, setStart] = useState("");
  const [direction, setDirection] = useState<Direction>("add");
  const [years, setYears] = useState("");
  const [months, setMonths] = useState("");
  const [days, setDays] = useState("");
  const touched = start !== "" || years !== "" || months !== "" || days !== "";
  const outcome = useMemo(() => (touched ? shiftDate(start, direction, years, months, days) : null), [start, direction, years, months, days, touched]);
  const amount = (label: string, value: string, set: (v: string) => void) => (
    <Field label={label}>
      {(p) => <TextInput {...p} inputMode="numeric" autoComplete="off" value={value} placeholder="0" onChange={(e) => set(e.target.value.trim())} />}
    </Field>
  );

  return (
    <Workspace>
      <Panel title={t.choose}>
        <Field label={t.shiftStart}>
          {(p) => (
            <div className="flex gap-2">
              <TextInput {...p} type="date" value={start} min="0001-01-01" max="9999-12-31" onChange={(e) => setStart(e.target.value)} />
              <Button variant="secondary" onClick={() => setStart(todayIso())}>{t.today}</Button>
            </div>
          )}
        </Field>
        <Segmented legend={t.operation} value={direction} onChange={setDirection} options={[{ value: "add", label: t.ops.add }, { value: "subtract", label: t.ops.subtract }]} />
        <div className="grid grid-cols-3 gap-3">
          {amount(t.years, years, setYears)}
          {amount(t.months, months, setMonths)}
          {amount(t.days, days, setDays)}
        </div>
        <p className="text-sm text-muted">{t.shiftNote}</p>
        <div>
          <Button variant="ghost" size="sm" disabled={!touched} onClick={() => { setStart(""); setYears(""); setMonths(""); setDays(""); setDirection("add"); }}>
            <Icon name="rotate-ccw" size={16} /> {ui.reset}
          </Button>
        </div>
      </Panel>

      <Panel title={t.resultDate} actions={outcome?.ok && <CopyButton value={outcome.result.iso} label={t.copy} />}>
        {!outcome && <IdleHint>{t.shiftIdle}</IdleHint>}
        {outcome && !outcome.ok && (!start ? <IdleHint>{translateMessage(outcome.error, t.rules)}</IdleHint> : <StatusMessage tone="error">{translateMessage(outcome.error, t.rules)}</StatusMessage>)}
        {outcome?.ok && (
          <div className="flex flex-col gap-4" aria-live="polite">
            <div className="rounded-md bg-accent-soft px-4 py-4">
              <p className="text-xl font-semibold tabular-nums sm:text-2xl" dir="ltr">{outcome.result.iso}</p>
              <p className="mt-1 text-sm text-muted">{longDate(outcome.result.date.y, outcome.result.date.m, outcome.result.date.d, t.locale)}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              <Stat label={t.dayOfWeek} value={t.weekday(outcome.result.weekday)} />
              <Stat label={t.fromStart} value={nf.format(Math.abs(outcome.result.totalDays))} hint={t.dayCount(outcome.result.totalDays)} />
            </dl>
          </div>
        )}
      </Panel>
    </Workspace>
  );
}

type Mode = "difference" | "shift";

export default function DateDifference() {
  const t = strings[useLocale()];
  const [mode, setMode] = useState<Mode>("difference");
  return (
    <div className="flex flex-col gap-5">
      <Segmented legend={t.mode} value={mode} onChange={setMode} options={[{ value: "difference", label: t.modes.difference }, { value: "shift", label: t.modes.shift }]} />
      {mode === "difference" ? <Difference /> : <Shift />}
    </div>
  );
}
