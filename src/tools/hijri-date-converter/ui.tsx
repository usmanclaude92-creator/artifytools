"use client";

import { useMemo, useState } from "react";
import { IdleHint, Panel, ResultRow, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { Field, Segmented, Select, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { useLocale } from "@/components/i18n/locale-provider";
import { translateMessage, type MessageRule } from "@/lib/translate-message";
import {
  MAX_GREGORIAN, MAX_HIJRI_YEAR, MIN_GREGORIAN, MIN_HIJRI_YEAR, calendarSupported, gregorianToHijri, hijriToGregorian, toIso,
  type Converted,
} from "./logic";

type Mode = "g2h" | "h2g";

const rulesAr: MessageRule[] = [
  [/^Choose a date\.$/, "اختر تاريخًا."],
  [/^That isn't a valid date\.$/, "هذا التاريخ غير صالح."],
  [/^Choose a date between 1924 and 2077\.$/, "اختر تاريخًا بين عامي 1924 و2077."],
  [/^Enter the Hijri year\.$/, "أدخل السنة الهجرية."],
  [/^The Hijri year must be a whole number\.$/, "يجب أن تكون السنة الهجرية عددًا صحيحًا."],
  [/^Enter a Hijri year between 1343 and 1500\.$/, "أدخل سنة هجرية بين 1343 و1500."],
  [/^This month has only 29 days in the Umm al-Qura calendar\.$/, "هذا الشهر 29 يومًا فقط في تقويم أم القرى."],
];

const strings = {
  en: {
    convert: "Convert a date", direction: "Direction", g2h: "Gregorian → Hijri", h2g: "Hijri → Gregorian",
    gDate: "Gregorian date", today: "Today", hDay: "Day", hMonth: "Month", hYear: "Year (AH)",
    result: "Result", idle: "Choose a date to convert it.",
    hijri: "Hijri date (Umm al-Qura)", gregorian: "Gregorian date", copyHijri: "Hijri date", copyGregorian: "Gregorian date",
    numeric: "Numeric", iso: "ISO", monthLength: (n: number) => `This Hijri month has ${n} days.`,
    hijriMonths: ["Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Shaʻban", "Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Hijjah"],
    gMonths: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    hijriText: (wd: string, d: number, m: string, y: number) => `${wd}, ${d} ${m} ${y} AH`,
    gText: (wd: string, d: number, m: string, y: number) => `${wd}, ${d} ${m} ${y}`,
    note: "Converted with the Umm al-Qura calendar used officially in Saudi Arabia. Religious dates such as the start of Ramadan or Eid are set by moon sighting and can differ by a day, and some countries, such as Oman, follow their own sighting.",
    unsupported: "This browser doesn't include the Umm al-Qura calendar. Please update it or try another browser.",
    rules: null as MessageRule[] | null,
  },
  ar: {
    convert: "تحويل تاريخ", direction: "الاتجاه", g2h: "ميلادي ← هجري", h2g: "هجري ← ميلادي",
    gDate: "التاريخ الميلادي", today: "اليوم", hDay: "اليوم", hMonth: "الشهر", hYear: "السنة (هـ)",
    result: "النتيجة", idle: "اختر تاريخًا لتحويله.",
    hijri: "التاريخ الهجري (أم القرى)", gregorian: "التاريخ الميلادي", copyHijri: "التاريخ الهجري", copyGregorian: "التاريخ الميلادي",
    numeric: "بالأرقام", iso: "ISO", monthLength: (n: number) => `عدد أيام هذا الشهر الهجري ${n} يومًا.`,
    hijriMonths: ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"],
    gMonths: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
    weekdays: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
    hijriText: (wd: string, d: number, m: string, y: number) => `${wd}، ${d} ${m} ${y} هـ`,
    gText: (wd: string, d: number, m: string, y: number) => `${wd}، ${d} ${m} ${y} م`,
    note: "يجري التحويل وفق تقويم أم القرى المعتمد رسميًا في المملكة العربية السعودية. وتُحدَّد المناسبات الدينية مثل بداية رمضان والعيد برؤية الهلال وقد تختلف بيوم، وتعتمد بعض الدول مثل عُمان على رؤيتها الخاصة.",
    unsupported: "لا يتضمن هذا المتصفح تقويم أم القرى. يُرجى تحديثه أو تجربة متصفح آخر.",
    rules: rulesAr as MessageRule[] | null,
  },
};

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function HijriDateConverter() {
  const t = strings[useLocale()];
  const [mode, setMode] = useState<Mode>("g2h");
  const [gDate, setGDate] = useState("");
  const [hDay, setHDay] = useState(1);
  const [hMonth, setHMonth] = useState(1);
  const [hYear, setHYear] = useState("");
  const touched = mode === "g2h" ? gDate !== "" : hYear.trim() !== "";
  // Checked only once there is input, so server and browser render the same idle state.
  const supported = !touched || calendarSupported();
  const outcome = useMemo(() => {
    if (!touched || !supported) return null;
    return mode === "g2h" ? gregorianToHijri(gDate) : hijriToGregorian(hYear, hMonth, hDay);
  }, [touched, supported, mode, gDate, hYear, hMonth, hDay]);

  const fillToday = () => {
    const r = gregorianToHijri(todayIso());
    setGDate(todayIso());
    if (r.ok) { setHDay(r.result.hijri.d); setHMonth(r.result.hijri.m); setHYear(String(r.result.hijri.y)); }
  };

  return (
    <Workspace>
      <Panel title={t.convert}>
        <Segmented legend={t.direction} value={mode} onChange={setMode} options={[{ value: "g2h", label: t.g2h }, { value: "h2g", label: t.h2g }]} />
        {mode === "g2h" ? (
          <Field label={t.gDate}>
            {(p) => (
              <div className="flex gap-2">
                <TextInput {...p} type="date" value={gDate} min={MIN_GREGORIAN} max={MAX_GREGORIAN} onChange={(e) => setGDate(e.target.value)} />
                <Button variant="secondary" onClick={fillToday}>{t.today}</Button>
              </div>
            )}
          </Field>
        ) : (
          <div className="grid grid-cols-[5rem_1fr_6.5rem] gap-3">
            <Field label={t.hDay}>
              {(p) => (
                <Select {...p} value={hDay} onChange={(e) => setHDay(Number(e.target.value))}>
                  {Array.from({ length: 30 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                </Select>
              )}
            </Field>
            <Field label={t.hMonth}>
              {(p) => (
                <Select {...p} value={hMonth} onChange={(e) => setHMonth(Number(e.target.value))}>
                  {t.hijriMonths.map((m, i) => <option key={m} value={i + 1}>{`${i + 1}. ${m}`}</option>)}
                </Select>
              )}
            </Field>
            <Field label={t.hYear}>
              {(p) => <TextInput {...p} inputMode="numeric" autoComplete="off" value={hYear} min={MIN_HIJRI_YEAR} max={MAX_HIJRI_YEAR} onChange={(e) => setHYear(e.target.value)} placeholder="1448" />}
            </Field>
          </div>
        )}
        {mode === "h2g" && (
          <div>
            <Button variant="secondary" size="sm" onClick={fillToday}>
              <Icon name="calendar-range" size={16} /> {t.today}
            </Button>
          </div>
        )}
      </Panel>

      <Panel title={t.result}>
        {!supported && <StatusMessage tone="error">{t.unsupported}</StatusMessage>}
        {supported && !outcome && <IdleHint>{t.idle}</IdleHint>}
        {outcome && !outcome.ok && <StatusMessage tone="error">{translateMessage(outcome.error, t.rules)}</StatusMessage>}
        {outcome?.ok && <ResultView r={outcome.result} mode={mode} t={t} />}
      </Panel>
    </Workspace>
  );
}

function ResultView({ r, mode, t }: { r: Converted; mode: Mode; t: (typeof strings)["en"] }) {
  const wd = t.weekdays[r.weekday]!;
  const hijri = t.hijriText(wd, r.hijri.d, t.hijriMonths[r.hijri.m - 1]!, r.hijri.y);
  const greg = t.gText(wd, r.gregorian.d, t.gMonths[r.gregorian.m - 1]!, r.gregorian.y);
  const hNum = `${String(r.hijri.d).padStart(2, "0")}/${String(r.hijri.m).padStart(2, "0")}/${r.hijri.y}`;
  const gNum = `${String(r.gregorian.d).padStart(2, "0")}/${String(r.gregorian.m).padStart(2, "0")}/${r.gregorian.y}`;
  const rows = [
    { label: t.hijri, value: hijri, sub: hNum, copy: t.copyHijri },
    { label: t.gregorian, value: greg, sub: `${gNum} · ${t.iso} ${toIso(r.gregorian)}`, copy: t.copyGregorian },
  ];
  const ordered = mode === "g2h" ? rows : rows.reverse();
  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      {ordered.map((row, i) => (
        <div key={row.label}>
          <ResultRow label={row.label} value={row.value} copyLabel={row.copy} emphasis={i === 0} />
          <p className="mt-1 px-1 text-sm text-muted tabular-nums">{t.numeric}: {row.sub}</p>
        </div>
      ))}
      <p className="text-sm text-muted">{t.monthLength(r.hijriMonthLength)} {t.note}</p>
    </div>
  );
}
