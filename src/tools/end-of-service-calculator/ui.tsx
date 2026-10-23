"use client";

import { useMemo, useState } from "react";
import { IdleHint, Panel, ResultRow, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { Field, Segmented, Select, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { translateMessage, type MessageRule } from "@/lib/translate-message";
import { calculateGratuity, type Country, type GratuityResult, type LineKind, type SaReason } from "./logic";

const rulesAr: MessageRule[] = [
  [/^Choose the start date and the last working day\.$/, "اختر تاريخ بداية العمل وآخر يوم عمل."],
  [/^The start date isn't a valid date\.$/, "تاريخ بداية العمل غير صالح."],
  [/^The last working day isn't a valid date\.$/, "تاريخ آخر يوم عمل غير صالح."],
  [/^The last working day must be on or after the start date\.$/, "يجب أن يكون آخر يوم عمل في تاريخ البداية أو بعده."],
  [/^Enter the monthly salary\.$/, "أدخل الراتب الشهري."],
  [/^The salary isn't a valid amount\.$/, "الراتب ليس مبلغًا صحيحًا."],
  [/^The allowances aren't a valid amount\.$/, "البدلات ليست مبلغًا صحيحًا."],
  [/^Unpaid leave must be a whole number of days\.$/, "يجب أن تكون الإجازة غير المدفوعة عددًا صحيحًا من الأيام."],
  [/^Unpaid leave can't be longer than the service period\.$/, "لا يمكن أن تكون الإجازة غير المدفوعة أطول من مدة الخدمة."],
];

type Unit = "year" | "month" | "day";
const unitsAr: Record<Unit, [string, string, string, string, string]> = {
  year: ["سنة واحدة", "سنتان", "سنوات", "سنة", "سنة"],
  month: ["شهر واحد", "شهران", "أشهر", "شهرًا", "شهر"],
  day: ["يوم واحد", "يومان", "أيام", "يومًا", "يوم"],
};

const strings = {
  en: {
    currency: { SAR: "SAR", AED: "AED", OMR: "OMR" } as Record<GratuityResult["currency"], string>,
    details: "Employment details", country: "Country", countries: { sa: "Saudi Arabia", ae: "UAE", om: "Oman" } as Record<Country, string>,
    start: "Start date", end: "Last working day", today: "Today",
    basic: "Basic monthly salary", allowances: "Fixed monthly allowances", allowancesHint: "Housing, transport and other allowances paid every month. Saudi law uses the full last wage.",
    basicOnly: { ae: "UAE law uses the last basic salary only, without allowances.", om: "Omani law uses the last basic salary only, without allowances." } as Record<"ae" | "om", string>,
    unpaid: "Unpaid leave (days)", unpaidHint: "Optional. Days of unpaid leave or absence are taken off the service period.",
    reason: "How the job ended", reasons: {
      employer: "Employer ended it, or the contract expired",
      resigned: "Employee resigned",
      full: "Resigned for force majeure, or a woman leaving within 6 months of marriage or 3 months of giving birth",
    } as Record<SaReason, string>,
    result: "End-of-service gratuity", idle: "Enter the dates and salary to see the gratuity.",
    total: "Gratuity due", totalCopy: "gratuity amount", service: "Service", serviceCounted: (y: string) => `${y} years counted`, wage: (w: string) => `Wage used: ${w} a month`,
    breakdown: "How it's calculated", perLine: (y: string, rate: string) => `${y} years × ${rate} per year`, colBand: "Period", colYears: "Years", colRate: "Per year", colAmount: "Amount",
    bands: {
      "sa-first5": "First 5 years", "sa-after5": "After 5 years", "ae-first5": "First 5 years", "ae-after5": "After 5 years",
      "om-old-first3": "Up to 31 Jul 2023: first 3 years", "om-old-after3": "Up to 31 Jul 2023: after 3 years", "om-new": "From 1 Aug 2023",
    } as Record<LineKind, string>,
    rate: (k: LineKind): string => (k.startsWith("ae-first") ? "21 days" : k === "sa-first5" ? "½ month" : k === "om-old-first3" ? "15 days" : "1 month"),
    fullAward: "Full award", share: (s: string) => `Resignation share (${s})`, shares: { "1/3": "one third", "2/3": "two thirds" },
    cap: "Capped at two years' wage", nil: {
      "sa-resigned-under-2": "An employee who resigns before completing 2 years gets no end-of-service award in Saudi Arabia.",
      "ae-under-1": "Gratuity starts after one full year of continuous service in the UAE.",
    },
    omSavings: "From 19 July 2027, Oman's savings system replaces gratuity for non-Omanis: the employer pays monthly contributions instead. Service after that date may be covered by the fund rather than this calculation.",
    notes: {
      sa: "Based on articles 84, 85 and 87 of the Saudi Labour Law. Compensation for unfair dismissal (article 77) is separate and not included.",
      ae: "Based on article 51 of UAE Federal Decree-Law 33 of 2021 for private-sector employees. UAE and GCC nationals in the pension scheme are covered differently.",
      om: "Based on article 61 of Oman's Labour Law (Royal Decree 53/2023) for non-Omani employees. Omanis are covered by the Social Protection Fund instead.",
    } as Record<Country, string>,
    estimate: "This is an estimate. Your contract or company policy may give more, and final dues are settled by your employer and the labour ministry.",
    print: "Print or save as PDF", reportTitle: "End-of-service gratuity", generated: "Calculated on tools.artifysols.com",
    joiner: ", ", plural: (n: number, u: Unit) => `${n} ${u}${n === 1 ? "" : "s"}`, rules: null as MessageRule[] | null,
  },
  ar: {
    currency: { SAR: "ريال", AED: "درهم", OMR: "ريال عُماني" } as Record<GratuityResult["currency"], string>,
    details: "بيانات الخدمة", country: "الدولة", countries: { sa: "السعودية", ae: "الإمارات", om: "عُمان" } as Record<Country, string>,
    start: "تاريخ بداية العمل", end: "آخر يوم عمل", today: "اليوم",
    basic: "الراتب الأساسي الشهري", allowances: "البدلات الشهرية الثابتة", allowancesHint: "بدل السكن والنقل وغيرها مما يُدفع شهريًا. يعتمد النظام السعودي على آخر أجر كامل.",
    basicOnly: { ae: "يعتمد القانون الإماراتي على آخر راتب أساسي فقط دون البدلات.", om: "يعتمد القانون العُماني على آخر أجر أساسي فقط دون البدلات." } as Record<"ae" | "om", string>,
    unpaid: "الإجازة غير المدفوعة (أيام)", unpaidHint: "اختياري. تُخصم أيام الإجازة غير المدفوعة أو الغياب من مدة الخدمة.",
    reason: "سبب انتهاء العلاقة", reasons: {
      employer: "إنهاء من صاحب العمل أو انتهاء مدة العقد",
      resigned: "استقالة العامل",
      full: "ترك العمل لقوة قاهرة، أو عاملة خلال 6 أشهر من الزواج أو 3 أشهر من الوضع",
    } as Record<SaReason, string>,
    result: "مكافأة نهاية الخدمة", idle: "أدخل التاريخين والراتب لترى المكافأة.",
    total: "المكافأة المستحقة", totalCopy: "مبلغ المكافأة", service: "مدة الخدمة", serviceCounted: (y: string) => `المحتسب: ${y} سنة`, wage: (w: string) => `الأجر المعتمد: ${w} شهريًا`,
    breakdown: "طريقة الحساب", perLine: (y: string, rate: string) => `${y} سنة × ${rate} عن كل سنة`, colBand: "الفترة", colYears: "السنوات", colRate: "عن كل سنة", colAmount: "المبلغ",
    bands: {
      "sa-first5": "أول 5 سنوات", "sa-after5": "ما بعد 5 سنوات", "ae-first5": "أول 5 سنوات", "ae-after5": "ما بعد 5 سنوات",
      "om-old-first3": "حتى 31 يوليو 2023: أول 3 سنوات", "om-old-after3": "حتى 31 يوليو 2023: ما بعد 3 سنوات", "om-new": "من 1 أغسطس 2023",
    } as Record<LineKind, string>,
    rate: (k: LineKind): string => (k.startsWith("ae-first") ? "21 يومًا" : k === "sa-first5" ? "نصف شهر" : k === "om-old-first3" ? "15 يومًا" : "شهر"),
    fullAward: "المكافأة كاملة", share: (s: string) => `نصيب المستقيل (${s})`, shares: { "1/3": "الثلث", "2/3": "الثلثان" },
    cap: "بحد أقصى أجر سنتين", nil: {
      "sa-resigned-under-2": "لا يستحق العامل المستقيل مكافأة نهاية الخدمة في السعودية إذا كانت خدمته أقل من سنتين.",
      "ae-under-1": "تُستحق المكافأة في الإمارات بعد إتمام سنة خدمة متصلة.",
    },
    omSavings: "ابتداءً من 19 يوليو 2027 يحلّ نظام الادخار في عُمان محل مكافأة نهاية الخدمة لغير العُمانيين، إذ يدفع صاحب العمل اشتراكات شهرية بدلًا منها. وقد يغطي الصندوق الخدمة بعد هذا التاريخ بدلًا من هذا الحساب.",
    notes: {
      sa: "وفق المواد 84 و85 و87 من نظام العمل السعودي. ولا يشمل الحساب التعويض عن الإنهاء غير المشروع (المادة 77).",
      ae: "وفق المادة 51 من المرسوم بقانون اتحادي رقم 33 لسنة 2021 لموظفي القطاع الخاص. ويخضع المواطنون ومواطنو دول الخليج المشمولون بالتقاعد لأحكام مختلفة.",
      om: "وفق المادة 61 من قانون العمل العُماني (المرسوم السلطاني 53/2023) للعاملين غير العُمانيين. ويشمل صندوق الحماية الاجتماعية العُمانيين بدلًا من ذلك.",
    } as Record<Country, string>,
    estimate: "هذه نتيجة تقديرية. قد يمنحك عقدك أو لائحة الشركة أكثر من ذلك، وتُسوّى المستحقات النهائية مع صاحب العمل ووزارة العمل.",
    print: "طباعة أو حفظ PDF", reportTitle: "مكافأة نهاية الخدمة", generated: "محسوبة على tools.artifysols.com",
    joiner: "، ", plural: (n: number, u: Unit) => arCount(n, ...unitsAr[u]), rules: rulesAr,
  },
};

type Strings = (typeof strings)["en"];

const money = (n: number, r: GratuityResult, t: Strings) =>
  `${new Intl.NumberFormat("en-US", { minimumFractionDigits: r.decimals, maximumFractionDigits: r.decimals }).format(n)} ${t.currency[r.currency]}`;
const yearsText = (y: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(y);

function spanText(r: GratuityResult, t: Strings) {
  const { years, months, days } = r.span;
  return [years ? t.plural(years, "year") : "", months ? t.plural(months, "month") : "", days || (!years && !months) ? t.plural(days, "day") : ""]
    .filter(Boolean)
    .join(t.joiner);
}

function shareLabel(r: GratuityResult, t: Strings): string | null {
  if (r.share === 1 || r.share === 0) return null;
  return t.share(r.share < 0.5 ? t.shares["1/3"] : t.shares["2/3"]);
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function printReport(r: GratuityResult, t: Strings, rtl: boolean, inputs: { start: string; end: string; reason?: string }) {
  const rows = r.lines
    .map((l) => `<tr><td>${esc(t.bands[l.kind])}</td><td>${yearsText(l.years)}</td><td>${esc(t.rate(l.kind))}</td><td>${money(l.amount, r, t)}</td></tr>`)
    .join("");
  const share = shareLabel(r, t);
  const html = `<!doctype html><html dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><title>${esc(t.reportTitle)}</title><style>
    @page{size:A4;margin:18mm}body{font:14px/1.5 system-ui,"Segoe UI",Tahoma,sans-serif;color:#1b1530}h1{font-size:22px;margin:0 0 4px}
    .muted{color:#6b6480}table{width:100%;border-collapse:collapse;margin:16px 0}td,th{padding:8px;border-bottom:1px solid #ddd;text-align:start}
    td:last-child,th:last-child{text-align:end}.total{font-size:20px;font-weight:700;background:#f2edff}dl{display:grid;grid-template-columns:auto 1fr;gap:4px 16px;margin:16px 0}dt{color:#6b6480}
  </style></head><body>
    <h1>${esc(t.reportTitle)}: ${esc(t.countries[r.country])}</h1>
    <dl><dt>${esc(t.start)}</dt><dd>${esc(inputs.start)}</dd><dt>${esc(t.end)}</dt><dd>${esc(inputs.end)}</dd>
    <dt>${esc(t.service)}</dt><dd>${esc(spanText(r, t))} · ${esc(t.serviceCounted(yearsText(r.serviceYears)))}</dd>
    <dt>${esc(t.wage(money(r.wage, r, t)))}</dt><dd></dd>${inputs.reason ? `<dt>${esc(t.reason)}</dt><dd>${esc(inputs.reason)}</dd>` : ""}</dl>
    <table><thead><tr><th>${esc(t.colBand)}</th><th>${esc(t.colYears)}</th><th>${esc(t.colRate)}</th><th>${esc(t.colAmount)}</th></tr></thead><tbody>${rows}
    ${share ? `<tr><td colspan="3">${esc(t.fullAward)}</td><td>${money(r.gross, r, t)}</td></tr><tr><td colspan="3">${esc(share)}</td><td></td></tr>` : ""}
    ${r.capped ? `<tr><td colspan="4">${esc(t.cap)}</td></tr>` : ""}
    <tr class="total"><td colspan="3">${esc(t.total)}</td><td>${money(r.total, r, t)}</td></tr></tbody></table>
    ${r.nil ? `<p>${esc(t.nil[r.nil])}</p>` : ""}${r.omSavings ? `<p>${esc(t.omSavings)}</p>` : ""}
    <p class="muted">${esc(t.notes[r.country])}</p><p class="muted">${esc(t.estimate)}</p><p class="muted">${esc(t.generated)}</p>
  </body></html>`;
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-same-origin allow-modals");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;opacity:0";
  frame.srcdoc = html;
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 1000);
  };
  document.body.appendChild(frame);
}

export default function EndOfServiceCalculator() {
  const locale = useLocale();
  const t = strings[locale];
  const ui = useMessages().ui;
  const [country, setCountry] = useState<Country>(locale === "ar" ? "sa" : "ae");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [basic, setBasic] = useState("");
  const [allowances, setAllowances] = useState("");
  const [unpaid, setUnpaid] = useState("");
  const [reason, setReason] = useState<SaReason>("employer");
  const touched = start !== "" || end !== "" || basic !== "";
  const outcome = useMemo(
    () => (touched ? calculateGratuity({ country, start, end, basic, allowances, unpaidDays: unpaid, reason }) : null),
    [touched, country, start, end, basic, allowances, unpaid, reason],
  );
  const incomplete = !start || !end || !basic.trim();
  const reset = () => { setStart(""); setEnd(""); setBasic(""); setAllowances(""); setUnpaid(""); setReason("employer"); };

  return (
    <Workspace>
      <Panel title={t.details}>
        <Segmented
          legend={t.country}
          value={country}
          onChange={setCountry}
          options={(["sa", "ae", "om"] as const).map((c) => ({ value: c, label: t.countries[c] }))}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.start}>
            {(p) => <TextInput {...p} type="date" value={start} min="1950-01-01" max="2100-12-31" onChange={(e) => setStart(e.target.value)} />}
          </Field>
          <Field label={t.end}>
            {(p) => (
              <div className="flex gap-2">
                <TextInput {...p} type="date" value={end} min="1950-01-01" max="2100-12-31" onChange={(e) => setEnd(e.target.value)} />
                <Button variant="secondary" onClick={() => setEnd(todayIso())}>{t.today}</Button>
              </div>
            )}
          </Field>
        </div>
        <Field label={t.basic} hint={country === "sa" ? undefined : t.basicOnly[country]}>
          {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={basic} onChange={(e) => setBasic(e.target.value)} placeholder={country === "om" ? "500.000" : "8,000"} />}
        </Field>
        {country === "sa" && (
          <Field label={t.allowances} hint={t.allowancesHint}>
            {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={allowances} onChange={(e) => setAllowances(e.target.value)} placeholder="2,000" />}
          </Field>
        )}
        {country === "sa" && (
          <Field label={t.reason}>
            {(p) => (
              <Select {...p} value={reason} onChange={(e) => setReason(e.target.value as SaReason)}>
                {(["employer", "resigned", "full"] as const).map((r) => <option key={r} value={r}>{t.reasons[r]}</option>)}
              </Select>
            )}
          </Field>
        )}
        <Field label={t.unpaid} hint={t.unpaidHint}>
          {(p) => <TextInput {...p} inputMode="numeric" autoComplete="off" value={unpaid} onChange={(e) => setUnpaid(e.target.value)} placeholder="0" className="max-w-40" />}
        </Field>
        <div>
          <Button variant="ghost" size="sm" disabled={!touched} onClick={reset}>
            <Icon name="rotate-ccw" size={16} /> {ui.reset}
          </Button>
        </div>
      </Panel>

      <Panel
        title={t.result}
        actions={outcome?.ok ? (
          <Button variant="secondary" size="sm" onClick={() => printReport(outcome.result, t, locale === "ar", { start, end, reason: country === "sa" ? t.reasons[reason] : undefined })}>
            <Icon name="printer" size={16} /> {t.print}
          </Button>
        ) : undefined}
      >
        {!outcome && <IdleHint>{t.idle}</IdleHint>}
        {outcome && !outcome.ok && (incomplete ? <IdleHint>{translateMessage(outcome.error, t.rules)}</IdleHint> : <StatusMessage tone="error">{translateMessage(outcome.error, t.rules)}</StatusMessage>)}
        {outcome?.ok && <ResultView r={outcome.result} t={t} />}
      </Panel>
    </Workspace>
  );
}

function ResultView({ r, t }: { r: GratuityResult; t: Strings }) {
  const share = shareLabel(r, t);
  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      <ResultRow label={t.total} value={money(r.total, r, t)} copyLabel={t.totalCopy} emphasis />
      {r.nil && <StatusMessage tone="info">{t.nil[r.nil]}</StatusMessage>}
      <div className="rounded-md bg-surface-2 px-4 py-3 text-sm">
        <p><span className="text-muted">{t.service}: </span><span className="font-medium">{spanText(r, t)}</span></p>
        <p className="text-muted">{t.serviceCounted(yearsText(r.serviceYears))} · {t.wage(money(r.wage, r, t))}</p>
      </div>
      {r.lines.length > 0 && (
        <div>
          <h3 className="mb-1 text-sm font-semibold">{t.breakdown}</h3>
          <ul className="divide-y divide-line text-sm tabular-nums">
            {r.lines.map((l) => (
              <li key={l.kind} className="flex items-baseline justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block font-medium">{t.bands[l.kind]}</span>
                  <span className="text-muted">{t.perLine(yearsText(l.years), t.rate(l.kind))}</span>
                </span>
                <span className="shrink-0 whitespace-nowrap">{money(l.amount, r, t)}</span>
              </li>
            ))}
            {share && (
              <>
                <li className="flex items-baseline justify-between gap-3 py-2.5"><span>{t.fullAward}</span><span className="shrink-0 whitespace-nowrap">{money(r.gross, r, t)}</span></li>
                <li className="flex items-baseline justify-between gap-3 py-2.5"><span>{share}</span><span className="shrink-0 whitespace-nowrap font-semibold">{money(r.total, r, t)}</span></li>
              </>
            )}
            {r.capped && <li className="flex items-baseline justify-between gap-3 py-2.5"><span>{t.cap}</span><span className="shrink-0 whitespace-nowrap font-semibold">{money(r.total, r, t)}</span></li>}
          </ul>
        </div>
      )}
      {r.omSavings && <StatusMessage tone="info">{t.omSavings}</StatusMessage>}
      <p className="text-sm text-muted">{t.notes[r.country]} {t.estimate}</p>
    </div>
  );
}
