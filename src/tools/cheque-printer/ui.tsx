"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/feedback";
import { Checkbox, Field, Segmented, Select, TextArea, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/components/ui/cx";
import { useLocale } from "@/components/i18n/locale-provider";
import { downloadBlob } from "@/components/ui/actions";
import { fitTwoLines, formatChequeDate, formatFigures, parseBatch } from "@/lib/cheque/format";
import { loadSavedLayouts, storeSavedLayouts, isSavedLayout, type SavedLayout } from "@/lib/cheque/storage";
import { FIELD_IDS, LAYOUTS, type DateFormat, type FieldId } from "@/lib/cheque/templates";
import { amountInArabic, amountInEnglish, currencies, getCurrency, parseAmount } from "@/lib/words";
import { AR_FONT, ChequeFace, LATIN_FONT, type ChequeValues, type FaceGeometry } from "./cheque-face";

type Tab = "single" | "batch";
type Paper = "cheque" | "a4";
const DATE_FORMATS: DateFormat[] = ["DD/MM/YYYY", "DD-MM-YYYY", "YYYY-MM-DD", "MM/DD/YYYY", "DDMMYYYY-boxes", "YYYYMMDD-boxes"];

const strings = {
  en: {
    layout: "Cheque layout", layoutPick: "Country / bank layout", saved: "Saved layouts", verified: (src: string, part: string) => `Verified: ${part} (${src}). Other positions are a starting point.`,
    estimated: "Starting point: positions vary between banks. Do a test print on plain paper and adjust before printing on a real cheque.",
    sizeOnly: "cheque size", amountBox: "amount box position",
    details: "Cheque details", tabs: { single: "One cheque", batch: "Several cheques" } as Record<Tab, string>,
    date: "Date", payee: "Pay to", amount: "Amount", currency: "Currency", wordsLang: "Amount in words", langs: { ar: "Arabic", en: "English" },
    only: "Add “Only” / «فقط … لا غير»", protect: "Protect figures with ** **", crossing: "Crossing",
    crossings: { none: "None", acpayee: "A/C Payee Only", notneg: "Not Negotiable", acpayeeAr: "يصرف للمستفيد الأول" } as Record<string, string>,
    invalidAmount: (d: number) => `Enter an amount with at most ${d} decimal places.`,
    preview: "Preview", previewHint: "Dotted boxes show where each item prints. They don't print on the cheque.",
    calibrate: "Adjust positions", calibrateHint: "Measure from the cheque's top-left corner, in millimetres. Tip: print a test page on plain paper, hold it against a cheque leaf in front of a light, and adjust.",
    field: "Field", fields: { date: "Date", payee: "Payee", words1: "Words, line 1", words2: "Words, line 2", figures: "Amount in figures", crossing: "Crossing" } as Record<FieldId, string>,
    x: "Left (mm)", y: "Top (mm)", w: "Width (mm)", size: "Cheque size (mm)", width: "Width", height: "Height",
    offset: "Printer offset (mm)", offsetHint: "Moves everything together, for printers that print slightly off.", fontSize: "Text size (pt)", dateFormat: "Date format",
    paper: "Paper in the printer", papers: { cheque: "Cheque-size (fed directly)", a4: "Cheque on an A4 sheet" } as Record<Paper, string>, paperPos: "Cheque position on the A4 sheet (mm)",
    saveAs: "Save layout as…", saveName: "Layout name", save: "Save", del: "Delete", exportL: "Export", importL: "Import", importError: "That file isn't a valid cheque layout.", savedOk: "Layout saved on this device.",
    testPrint: "Test print on plain paper", print: "Print cheque", printAll: (n: number) => `Print ${n} cheque${n === 1 ? "" : "s"}`,
    printTips: "In the print dialog, set Scale to 100% (or “Actual size”) and Margins to None.",
    batchLabel: "Paste rows: payee, amount, date", batchHint: "One cheque per line, e.g. from Excel. Dates as YYYY-MM-DD or DD/MM/YYYY.",
    batchCount: (n: number) => `${n} cheque${n === 1 ? "" : "s"} ready.`, batchErrors: (lines: string) => `Check line(s) ${lines}: each needs a payee, an amount and a valid date.`, batchAmountErrors: (lines: string) => `Invalid amount on line(s) ${lines}.`,
    responsibility: "You are responsible for what you print. Never sign a cheque before checking the printed amounts.",
    overflow: "The amount in words is too long for the two lines; widen the word lines or reduce the text size.",
  },
  ar: {
    layout: "تخطيط الشيك", layoutPick: "تخطيط الدولة / البنك", saved: "التخطيطات المحفوظة", verified: (src: string, part: string) => `مُتحقَّق منه: ${part} (${src}). بقية المواضع نقطة بداية.`,
    estimated: "نقطة بداية: تختلف المواضع بين البنوك. اطبع صفحة تجربة على ورق عادي وعدّل قبل الطباعة على شيك حقيقي.",
    sizeOnly: "مقاس الشيك", amountBox: "موضع خانة المبلغ",
    details: "بيانات الشيك", tabs: { single: "شيك واحد", batch: "عدة شيكات" } as Record<Tab, string>,
    date: "التاريخ", payee: "ادفعوا لأمر", amount: "المبلغ", currency: "العملة", wordsLang: "المبلغ كتابة", langs: { ar: "بالعربية", en: "بالإنجليزية" },
    only: "إضافة «فقط … لا غير» / “Only”", protect: "حماية الأرقام بعلامتي ** **", crossing: "التسطير",
    crossings: { none: "بدون", acpayee: "A/C Payee Only", notneg: "Not Negotiable", acpayeeAr: "يصرف للمستفيد الأول" } as Record<string, string>,
    invalidAmount: (d: number) => `أدخل مبلغًا بحد أقصى ${d} منازل عشرية.`,
    preview: "المعاينة", previewHint: "تُظهر المربعات المنقطة موضع طباعة كل عنصر، ولا تُطبع على الشيك.",
    calibrate: "ضبط المواضع", calibrateHint: "القياس من الزاوية العلوية اليسرى للشيك بالمليمتر. نصيحة: اطبع صفحة تجربة على ورق عادي، وضعها فوق ورقة شيك أمام الضوء، ثم عدّل.",
    field: "الحقل", fields: { date: "التاريخ", payee: "المستفيد", words1: "المبلغ كتابة، السطر 1", words2: "المبلغ كتابة، السطر 2", figures: "المبلغ بالأرقام", crossing: "التسطير" } as Record<FieldId, string>,
    x: "من اليسار (مم)", y: "من الأعلى (مم)", w: "العرض (مم)", size: "مقاس الشيك (مم)", width: "العرض", height: "الارتفاع",
    offset: "إزاحة الطابعة (مم)", offsetHint: "تحرّك كل العناصر معًا، للطابعات التي تطبع بانحراف بسيط.", fontSize: "حجم الخط (نقطة)", dateFormat: "صيغة التاريخ",
    paper: "الورق في الطابعة", papers: { cheque: "بمقاس الشيك (تغذية مباشرة)", a4: "شيك مثبّت على ورقة A4" } as Record<Paper, string>, paperPos: "موضع الشيك على ورقة A4 (مم)",
    saveAs: "حفظ التخطيط باسم…", saveName: "اسم التخطيط", save: "حفظ", del: "حذف", exportL: "تصدير", importL: "استيراد", importError: "هذا الملف ليس تخطيط شيك صالحًا.", savedOk: "حُفظ التخطيط على هذا الجهاز.",
    testPrint: "طباعة تجريبية على ورق عادي", print: "طباعة الشيك", printAll: (n: number) => `طباعة ${n} شيكات`,
    printTips: "في نافذة الطباعة، اضبط المقياس على 100% (أو «الحجم الفعلي») والهوامش على «بلا».",
    batchLabel: "الصق الصفوف: المستفيد، المبلغ، التاريخ", batchHint: "شيك في كل سطر، من Excel مثلًا. التاريخ بصيغة YYYY-MM-DD أو DD/MM/YYYY.",
    batchCount: (n: number) => `${n} شيكات جاهزة.`, batchErrors: (lines: string) => `راجع السطر/الأسطر ${lines}: يحتاج كل سطر إلى مستفيد ومبلغ وتاريخ صحيح.`, batchAmountErrors: (lines: string) => `مبلغ غير صالح في السطر/الأسطر ${lines}.`,
    responsibility: "أنت مسؤول عما تطبعه. لا توقّع أي شيك قبل مراجعة المبالغ المطبوعة.",
    overflow: "المبلغ كتابة أطول من السطرين؛ وسّع سطري الكتابة أو صغّر حجم الخط.",
  },
};

let canvas: HTMLCanvasElement | null = null;
/** Text width in millimetres at `pt` points. */
function measureMm(text: string, pt: number, rtl: boolean): number {
  if (typeof document === "undefined") return text.length * pt * 0.2;
  canvas ??= document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const family = (rtl ? AR_FONT : LATIN_FONT).replace("var(--font-arabic), ", "");
  ctx.font = `${pt * (96 / 72)}px ${family}`;
  return (ctx.measureText(text).width * 25.4) / 96;
}

function fromPreset(id: string): SavedLayout {
  const p = LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0]!;
  return { ...structuredClone(p), saved: true, offsetX: 0, offsetY: 0, fontSize: 11 };
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ChequePrinter() {
  const locale = useLocale();
  const t = strings[locale];
  const [source, setSource] = useState(locale === "ar" ? "om" : "us-business");
  const [work, setWork] = useState<SavedLayout>(() => fromPreset(locale === "ar" ? "om" : "us-business"));
  const [saved, setSaved] = useState<SavedLayout[]>([]);
  const [tab, setTab] = useState<Tab>("single");
  const [date, setDate] = useState("");
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");
  const [only, setOnly] = useState(true);
  const [protect, setProtect] = useState(true);
  const [crossing, setCrossing] = useState("none");
  const [batchText, setBatchText] = useState("");
  const [paper, setPaper] = useState<Paper>("cheque");
  const [paperPos, setPaperPos] = useState({ x: 3.5, y: 10 });
  const [focus, setFocus] = useState<FieldId | null>(null);
  const [saveName, setSaveName] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [job, setJob] = useState<{ mode: "test" | "print"; cheques: ChequeValues[] } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only values (today's date, saved layouts) after hydration
    setDate(todayIso());
    setSaved(loadSavedLayouts());
  }, []);

  const currency = getCurrency(work.currency) ?? currencies[0]!;
  const decimals = currency.minor === 1000 ? 3 : currency.minor === 100 ? 2 : 0;
  const preset = LAYOUTS.find((l) => l.id === source);

  const buildValues = useCallback(
    (payeeText: string, amountText: string, iso: string): ChequeValues | null => {
      const parsed = amountText.trim() ? parseAmount(amountText, currency.minor) : null;
      if (amountText.trim() && !parsed) return null;
      const rtl = work.wordsLanguage === "ar";
      const words = parsed
        ? rtl
          ? amountInArabic(parsed.whole, parsed.fraction, currency, { only })
          : amountInEnglish(parsed.whole, parsed.fraction, currency, { only, uppercase: true })
        : "";
      const fit = words ? fitTwoLines(words, work.fields.words1.w, work.fields.words2.w, (s, pt) => measureMm(s, pt, rtl), work.fontSize, 7) : { line1: "", line2: "", size: work.fontSize };
      const crossingText = crossing === "none" ? "" : t.crossings[crossing] ?? "";
      return {
        date: formatChequeDate(iso, work.dateFormat),
        dateBoxes: work.dateFormat.endsWith("boxes"),
        payee: payeeText.trim(),
        words1: fit.line1,
        words2: fit.line2,
        wordsSize: fit.size,
        wordsDir: rtl ? "rtl" : "ltr",
        figures: parsed ? formatFigures(parsed.whole, parsed.fraction, decimals, protect) : "",
        crossing: crossingText,
      };
    },
    [currency, decimals, only, protect, crossing, work, t],
  );

  const single = useMemo(() => buildValues(payee, amount, date), [buildValues, payee, amount, date]);
  const overflow = single ? measureMm(single.words2, single.wordsSize, single.wordsDir === "rtl") > work.fields.words2.w + 0.5 : false;

  const batch = useMemo(() => {
    const { rows, errors } = parseBatch(batchText);
    const values: ChequeValues[] = [];
    const badAmounts: number[] = [];
    rows.forEach((r, i) => {
      const v = buildValues(r.payee, r.amount, r.date);
      if (v && v.figures) values.push(v);
      else badAmounts.push(i + 1);
    });
    return { values, errors, badAmounts };
  }, [batchText, buildValues]);

  const geo: FaceGeometry = { width: work.width, height: work.height, fields: work.fields, offsetX: work.offsetX, offsetY: work.offsetY, fontSize: work.fontSize };

  // Printing: render the pages into a print-only root, then open the browser's print dialog.
  useEffect(() => {
    if (!job) return;
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
    const done = () => setJob(null);
    window.addEventListener("afterprint", done);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("afterprint", done);
    };
  }, [job]);

  function pick(id: string) {
    setSource(id);
    setNotice(null);
    if (id.startsWith("saved:")) {
      const s = saved.find((l) => `saved:${l.id}` === id);
      if (s) setWork(structuredClone(s));
    } else setWork(fromPreset(id));
  }

  const setField = (f: FieldId, key: "x" | "y" | "w", v: number) =>
    Number.isFinite(v) && setWork((w) => ({ ...w, fields: { ...w.fields, [f]: { ...w.fields[f], [key]: v } } }));

  function saveLayout() {
    const name = saveName.trim();
    if (!name) return;
    const id = `${Date.now()}`;
    const entry: SavedLayout = { ...structuredClone(work), id, name: { en: name, ar: name } };
    const next = [...saved, entry];
    if (storeSavedLayouts(next)) {
      setSaved(next);
      setSource(`saved:${id}`);
      setSaveName("");
      setNotice({ tone: "success", text: t.savedOk });
    }
  }

  function deleteLayout() {
    const next = saved.filter((l) => `saved:${l.id}` !== source);
    storeSavedLayouts(next);
    setSaved(next);
    pick(locale === "ar" ? "om" : "us-business");
  }

  async function importLayout(file: File | undefined) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as unknown;
      if (!isSavedLayout(data)) throw new Error("invalid");
      const entry: SavedLayout = { ...data, id: `${Date.now()}`, saved: true };
      const next = [...saved, entry];
      storeSavedLayouts(next);
      setSaved(next);
      setWork(structuredClone(entry));
      setSource(`saved:${entry.id}`);
      setNotice({ tone: "success", text: t.savedOk });
    } catch {
      setNotice({ tone: "error", text: t.importError });
    }
  }

  const sampleAmount = single?.figures ? amount : "1234.5";
  const testValues: ChequeValues = buildValues(payee || "Sample Payee / المستفيد", sampleAmount, date || todayIso())!;

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.layout}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.layoutPick}>
            {(p) => (
              <Select {...p} value={source} onChange={(e) => pick(e.target.value)}>
                {saved.length > 0 && (
                  <optgroup label={t.saved}>
                    {saved.map((l) => <option key={l.id} value={`saved:${l.id}`}>{l.name.en}</option>)}
                  </optgroup>
                )}
                <optgroup label={t.layoutPick}>
                  {LAYOUTS.map((l) => <option key={l.id} value={l.id}>{l.name[locale]}</option>)}
                </optgroup>
              </Select>
            )}
          </Field>
          <Field label={t.paper}>
            {(p) => (
              <Select {...p} value={paper} onChange={(e) => setPaper(e.target.value as Paper)}>
                {(["cheque", "a4"] as Paper[]).map((v) => <option key={v} value={v}>{t.papers[v]}</option>)}
              </Select>
            )}
          </Field>
        </div>
        {preset?.verified ? (
          <StatusMessage tone="info">{t.verified(preset.verified.source, preset.verified.fields === "size-only" ? t.sizeOnly : t.amountBox)}</StatusMessage>
        ) : (
          <StatusMessage tone="warning">{t.estimated}</StatusMessage>
        )}
      </Panel>

      <Panel title={t.details}>
        <Segmented legend={t.details} value={tab} onChange={setTab} options={(["single", "batch"] as Tab[]).map((v) => ({ value: v, label: t.tabs[v] }))} />
        {tab === "single" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.payee}>{(p) => <TextInput {...p} dir="auto" value={payee} onChange={(e) => setPayee(e.target.value)} onFocus={() => setFocus("payee")} onBlur={() => setFocus(null)} autoComplete="off" />}</Field>
            <Field label={t.date}>{(p) => <TextInput {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} onFocus={() => setFocus("date")} onBlur={() => setFocus(null)} />}</Field>
            <Field label={t.amount} error={amount.trim() && !single ? t.invalidAmount(decimals) : null}>
              {(p) => <TextInput {...p} dir="ltr" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} onFocus={() => setFocus("figures")} onBlur={() => setFocus(null)} placeholder={decimals === 3 ? "1250.500" : "1250.00"} autoComplete="off" />}
            </Field>
            <Field label={t.currency}>
              {(p) => (
                <Select {...p} value={work.currency} onChange={(e) => setWork((w) => ({ ...w, currency: e.target.value }))}>
                  {currencies.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                </Select>
              )}
            </Field>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Field label={t.batchLabel} hint={t.batchHint}>
              {(p) => <TextArea {...p} rows={6} value={batchText} onChange={(e) => setBatchText(e.target.value)} placeholder={"Al Noor Trading LLC\t1250.500\t2026-11-01\nأحمد سالم, 300, 01/12/2026"} />}
            </Field>
            {batch.values.length > 0 && <p className="text-sm font-medium text-success">{t.batchCount(batch.values.length)}</p>}
            {batch.errors.length > 0 && <StatusMessage tone="error">{t.batchErrors(batch.errors.map((e) => e.line).join(", "))}</StatusMessage>}
            {batch.badAmounts.length > 0 && <StatusMessage tone="error">{t.batchAmountErrors(batch.badAmounts.join(", "))}</StatusMessage>}
            <Field label={t.currency}>
              {(p) => (
                <Select {...p} value={work.currency} onChange={(e) => setWork((w) => ({ ...w, currency: e.target.value }))} className="max-w-48">
                  {currencies.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                </Select>
              )}
            </Field>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t.wordsLang}>
            {(p) => (
              <Select {...p} value={work.wordsLanguage} onChange={(e) => setWork((w) => ({ ...w, wordsLanguage: e.target.value as "ar" | "en" }))}>
                <option value="ar">{t.langs.ar}</option>
                <option value="en">{t.langs.en}</option>
              </Select>
            )}
          </Field>
          <Field label={t.crossing}>
            {(p) => (
              <Select {...p} value={crossing} onChange={(e) => setCrossing(e.target.value)}>
                {Object.keys(t.crossings).map((k) => <option key={k} value={k}>{t.crossings[k]}</option>)}
              </Select>
            )}
          </Field>
          <Field label={t.dateFormat}>
            {(p) => (
              <Select {...p} dir="ltr" value={work.dateFormat} onChange={(e) => setWork((w) => ({ ...w, dateFormat: e.target.value as DateFormat }))}>
                {DATE_FORMATS.map((f) => <option key={f} value={f}>{f.replace("-boxes", " (boxes)")}</option>)}
              </Select>
            )}
          </Field>
        </div>
        <div>
          <Checkbox label={t.only} checked={only} onChange={(e) => setOnly(e.target.checked)} />
          <Checkbox label={t.protect} checked={protect} onChange={(e) => setProtect(e.target.checked)} />
        </div>
      </Panel>

      <Panel title={t.preview}>
        <p className="-mt-2 text-sm text-muted">{t.previewHint}</p>
        <ScaledPreview width={work.width} height={work.height}>
          <ChequeFace geo={geo} values={tab === "single" ? single ?? testValues : batch.values[0] ?? testValues} mode="preview" highlight={focus} labels={t.fields} />
        </ScaledPreview>
        {overflow && tab === "single" && <StatusMessage tone="warning">{t.overflow}</StatusMessage>}
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button variant="secondary" onClick={() => setJob({ mode: "test", cheques: [testValues] })}>
            <Icon name="file-text" size={18} /> {t.testPrint}
          </Button>
          {tab === "single" ? (
            <Button onClick={() => single && setJob({ mode: "print", cheques: [single] })} disabled={!single || !single.figures || !single.payee}>
              <Icon name="printer" size={18} /> {t.print}
            </Button>
          ) : (
            <Button onClick={() => setJob({ mode: "print", cheques: batch.values })} disabled={batch.values.length === 0}>
              <Icon name="printer" size={18} /> {t.printAll(batch.values.length)}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted">{t.printTips}</p>
        <p className="text-sm font-medium">{t.responsibility}</p>
      </Panel>

      <details className="card overflow-hidden" open={false}>
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 font-semibold [&::-webkit-details-marker]:hidden">
          <Icon name="sliders" size={18} className="text-muted" /> {t.calibrate}
        </summary>
        <div className="flex flex-col gap-5 border-t border-line p-5">
          <p className="text-sm text-muted">{t.calibrateHint}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="text-start text-muted">
                  <th className="py-2 text-start font-medium">{t.field}</th>
                  <th className="py-2 text-start font-medium">{t.x}</th>
                  <th className="py-2 text-start font-medium">{t.y}</th>
                  <th className="py-2 text-start font-medium">{t.w}</th>
                </tr>
              </thead>
              <tbody>
                {FIELD_IDS.map((f) => (
                  <tr key={f} className={cx("border-t border-line", focus === f && "bg-accent-soft")}>
                    <th scope="row" className="py-2 pe-3 text-start font-medium">{t.fields[f]}</th>
                    {(["x", "y", "w"] as const).map((k) => (
                      <td key={k} className="py-1.5 pe-2">
                        <TextInput
                          type="number"
                          step={0.5}
                          aria-label={`${t.fields[f]} · ${t[k]}`}
                          value={work.fields[f][k]}
                          onFocus={() => setFocus(f)}
                          onBlur={() => setFocus(null)}
                          onChange={(e) => setField(f, k, Number(e.target.value))}
                          className="!min-h-9 w-24 py-1"
                          dir="ltr"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-sm font-medium">{t.size}</legend>
              <div className="flex gap-2">
                <TextInput type="number" step={0.5} aria-label={t.width} value={work.width} onChange={(e) => Number(e.target.value) > 0 && setWork((w) => ({ ...w, width: Number(e.target.value) }))} className="!min-h-9 py-1" dir="ltr" />
                <TextInput type="number" step={0.5} aria-label={t.height} value={work.height} onChange={(e) => Number(e.target.value) > 0 && setWork((w) => ({ ...w, height: Number(e.target.value) }))} className="!min-h-9 py-1" dir="ltr" />
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-sm font-medium">{t.offset}</legend>
              <div className="flex gap-2">
                <TextInput type="number" step={0.5} aria-label={`${t.offset} X`} value={work.offsetX} onChange={(e) => setWork((w) => ({ ...w, offsetX: Number(e.target.value) || 0 }))} className="!min-h-9 py-1" dir="ltr" />
                <TextInput type="number" step={0.5} aria-label={`${t.offset} Y`} value={work.offsetY} onChange={(e) => setWork((w) => ({ ...w, offsetY: Number(e.target.value) || 0 }))} className="!min-h-9 py-1" dir="ltr" />
              </div>
              <p className="text-xs text-muted">{t.offsetHint}</p>
            </fieldset>
            <Field label={t.fontSize}>
              {(p) => <TextInput {...p} type="number" step={0.5} min={7} max={16} value={work.fontSize} onChange={(e) => Number(e.target.value) >= 6 && setWork((w) => ({ ...w, fontSize: Number(e.target.value) }))} className="!min-h-9 py-1" dir="ltr" />}
            </Field>
          </div>
          {paper === "a4" && (
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-sm font-medium">{t.paperPos}</legend>
              <div className="flex max-w-xs gap-2">
                <TextInput type="number" step={0.5} aria-label={`${t.paperPos} X`} value={paperPos.x} onChange={(e) => setPaperPos((p) => ({ ...p, x: Number(e.target.value) || 0 }))} className="!min-h-9 py-1" dir="ltr" />
                <TextInput type="number" step={0.5} aria-label={`${t.paperPos} Y`} value={paperPos.y} onChange={(e) => setPaperPos((p) => ({ ...p, y: Number(e.target.value) || 0 }))} className="!min-h-9 py-1" dir="ltr" />
              </div>
            </fieldset>
          )}
          <div className="flex flex-wrap items-end gap-2 border-t border-line pt-4">
            <Field label={t.saveAs} className="min-w-48 flex-1">
              {(p) => <TextInput {...p} value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder={t.saveName} />}
            </Field>
            <Button onClick={saveLayout} disabled={!saveName.trim()}>{t.save}</Button>
            {source.startsWith("saved:") && <Button variant="ghost" onClick={deleteLayout}>{t.del}</Button>}
            <Button variant="secondary" onClick={() => downloadBlob(new Blob([JSON.stringify(work, null, 2)], { type: "application/json" }), "cheque-layout.json")}>{t.exportL}</Button>
            <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-line-strong px-4 text-[0.95rem] font-semibold hover:bg-surface-2">
              {t.importL}
              <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { void importLayout(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
          </div>
          {notice && <StatusMessage tone={notice.tone}>{notice.text}</StatusMessage>}
        </div>
      </details>

      {job && <PrintRoot job={job} geo={geo} paper={paper} paperPos={paperPos} labels={t.fields} />}
    </div>
  );
}

/** Shows the cheque at real proportions, scaled to the available width. */
function ScaledPreview({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(1.6, el.clientWidth / ((width * 96) / 25.4)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  const px = (mm: number) => (mm * 96) / 25.4;
  return (
    <div dir="ltr" className="w-full rounded-lg bg-surface-2 p-3">
      <div ref={ref} style={{ height: px(height) * scale }} className="relative overflow-hidden">
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>{children}</div>
      </div>
    </div>
  );
}

/** Print-only pages; everything else on the page is hidden while printing. */
function PrintRoot({ job, geo, paper, paperPos, labels }: { job: { mode: "test" | "print"; cheques: ChequeValues[] }; geo: FaceGeometry; paper: Paper; paperPos: { x: number; y: number }; labels: Record<FieldId, string> }) {
  const page = paper === "a4" ? { w: 210, h: 297 } : { w: geo.width, h: geo.height };
  const css = `
    #cheque-print-root { display: none; }
    @media print {
      @page { size: ${page.w}mm ${page.h}mm; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
      body > *:not(#cheque-print-root) { display: none !important; }
      #cheque-print-root { display: block !important; }
      #cheque-print-root .cheque-page { width: ${page.w}mm; height: ${page.h}mm; position: relative; overflow: hidden; break-after: page; page-break-after: always; }
      #cheque-print-root .cheque-page:last-child { break-after: auto; page-break-after: auto; }
    }`;
  return createPortal(
    <div id="cheque-print-root" data-mode={job.mode}>
      <style>{css}</style>
      {job.cheques.map((v, i) => (
        <div key={i} className="cheque-page">
          <div style={{ position: "absolute", left: paper === "a4" ? `${paperPos.x}mm` : 0, top: paper === "a4" ? `${paperPos.y}mm` : 0 }}>
            <ChequeFace geo={geo} values={v} mode={job.mode === "test" ? "test" : "print"} labels={labels} />
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
}
