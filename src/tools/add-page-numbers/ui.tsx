"use client";

import { useState } from "react";
import { PdfPagePreview, SingleFile } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Checkbox, Field, Select, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/components/ui/cx";
import { useLocale } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { baseName, safeFileName } from "@/lib/files/names";
import { addPageNumbers } from "@/lib/pdf/edit";
import { inspectPdf, PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { pageLabel, type Anchor, type NumberFormat } from "@/lib/pdf/place";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
const ANCHORS: Anchor[] = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"];
const COLORS = { black: "#111111", gray: "#6B7280", blue: "#145BFF" } as const;

const strings = {
  en: {
    choose: "Choose a PDF", types: "PDF", pages: (n: number) => `${n} page${n === 1 ? "" : "s"}`, reading: "Reading your PDF…",
    options: "Page numbers", position: "Position", anchors: { "top-left": "Top left", "top-center": "Top centre", "top-right": "Top right", "bottom-left": "Bottom left", "bottom-center": "Bottom centre", "bottom-right": "Bottom right" } as Record<string, string>,
    format: "Format", language: "Words in", langs: { en: "English", ar: "Arabic" }, start: "Start at", size: "Text size", margin: "Distance from edge", color: "Colour", colors: { black: "Black", gray: "Grey", blue: "Blue" } as Record<string, string>,
    skipFirst: "Don't number the first page (cover)", arabicDigits: "Use Arabic-Indic digits (١٢٣)",
    apply: "Add page numbers", applying: (p: number) => `Numbering… ${p}%`, result: "Result", preview: "Page 1 of the result", stale: "Settings changed. Add page numbers again to update.",
    startError: "Enter a whole number from 0 to 99999.",
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    failed: "Numbering failed. The file may be damaged.",
  },
  ar: {
    choose: "اختر ملف PDF", types: "PDF", pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"), reading: "جارٍ قراءة ملف PDF…",
    options: "ترقيم الصفحات", position: "الموضع", anchors: { "top-left": "أعلى اليسار", "top-center": "أعلى الوسط", "top-right": "أعلى اليمين", "bottom-left": "أسفل اليسار", "bottom-center": "أسفل الوسط", "bottom-right": "أسفل اليمين" } as Record<string, string>,
    format: "الصيغة", language: "الكلمات بـ", langs: { en: "الإنجليزية", ar: "العربية" }, start: "البدء من", size: "حجم النص", margin: "المسافة من الحافة", color: "اللون", colors: { black: "أسود", gray: "رمادي", blue: "أزرق" } as Record<string, string>,
    skipFirst: "عدم ترقيم الصفحة الأولى (الغلاف)", arabicDigits: "استخدام الأرقام الهندية (١٢٣)",
    apply: "إضافة أرقام الصفحات", applying: (p: number) => `جارٍ الترقيم… ${p}%`, result: "النتيجة", preview: "الصفحة الأولى من النتيجة", stale: "تغيّرت الإعدادات. أضف أرقام الصفحات مجددًا للتحديث.",
    startError: "أدخل عددًا صحيحًا من 0 إلى 99999.",
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    failed: "فشل الترقيم. قد يكون الملف تالفًا.",
  },
};

export default function AddPageNumbers() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<Anchor>("bottom-center");
  const [format, setFormat] = useState<NumberFormat>("page-n-of-total");
  const [lang, setLang] = useState<"en" | "ar">(locale);
  const [startText, setStartText] = useState("1");
  const [pt, setPt] = useState(10);
  const [margin, setMargin] = useState(28);
  const [color, setColor] = useState<keyof typeof COLORS>("black");
  const [skipFirst, setSkipFirst] = useState(false);
  const [arabicDigits, setArabicDigits] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<{ key: string; bytes: Uint8Array } | null>(null);

  async function open(f: File) {
    setFile(f);
    setBytes(null);
    setError(null);
    setResult(null);
    try {
      const b = new Uint8Array(await f.arrayBuffer());
      setCount((await inspectPdf(b)).pageCount);
      setBytes(b);
    } catch (e) {
      setError(e instanceof PdfError ? t.errors[e.code] : t.errors.invalid);
    }
  }

  const start = /^\d{1,5}$/.test(startText.trim()) ? Number(startText) : null;
  const opts = { anchor, format, start: start ?? 1, pt, margin, skipFirst, color: COLORS[color], locale: lang, arabicDigits };
  const key = `${file?.name}|${file?.size}|${JSON.stringify(opts)}`;
  const current = result && result.key === key ? result : null;

  async function apply() {
    if (!bytes || start === null) return;
    setError(null);
    setProgress(0);
    try {
      const out = await addPageNumbers(bytes, opts, (f) => setProgress(Math.round(f * 100)));
      setResult({ key, bytes: out });
    } catch {
      setError(t.failed);
    } finally {
      setProgress(null);
    }
  }

  const sample = pageLabel(format, start ?? 1, (start ?? 1) + Math.max(0, count - 1 - (skipFirst ? 1 : 0)), lang, arabicDigits);
  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.choose}>
        <SingleFile file={file} rules={rules} typesLabel={t.types} busy={progress !== null} status={bytes ? t.pages(count) : file && !error ? t.reading : null} onFile={open} onClear={() => { setFile(null); setBytes(null); setResult(null); setError(null); }} />
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
      </Panel>

      {bytes && (
        <Panel title={t.options}>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">{t.position}</legend>
            <div dir="ltr" className="grid max-w-sm grid-cols-3 gap-2 rounded-lg border border-line bg-surface-2 p-3">
              {ANCHORS.map((a) => (
                <button key={a} type="button" aria-pressed={anchor === a} aria-label={t.anchors[a]} title={t.anchors[a]} onClick={() => setAnchor(a)} className={cx("grid min-h-11 place-items-center rounded-md border text-xs font-semibold", anchor === a ? "border-accent bg-accent text-white" : "border-line-strong bg-surface hover:bg-surface-2", a.startsWith("bottom") && "mt-6")}>
                  <bdi>1</bdi>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t.format}>
              {(p) => (
                <Select {...p} value={format} onChange={(e) => setFormat(e.target.value as NumberFormat)}>
                  {(["n", "page-n", "n-of-total", "page-n-of-total"] as NumberFormat[]).map((f) => <option key={f} value={f}>{pageLabel(f, 1, count, lang, arabicDigits)}</option>)}
                </Select>
              )}
            </Field>
            <Field label={t.language}>
              {(p) => (
                <Select {...p} value={lang} onChange={(e) => setLang(e.target.value as "en" | "ar")}>
                  <option value="en">{t.langs.en}</option>
                  <option value="ar">{t.langs.ar}</option>
                </Select>
              )}
            </Field>
            <Field label={t.start} error={start === null ? t.startError : null}>
              {(p) => <TextInput {...p} dir="ltr" inputMode="numeric" value={startText} onChange={(e) => setStartText(e.target.value)} />}
            </Field>
            <Field label={t.size}>
              {(p) => (
                <Select {...p} value={pt} onChange={(e) => setPt(Number(e.target.value))}>
                  {[8, 9, 10, 11, 12, 14, 16, 20].map((n) => <option key={n} value={n}>{n} pt</option>)}
                </Select>
              )}
            </Field>
            <Field label={t.margin}>
              {(p) => (
                <Select {...p} value={margin} onChange={(e) => setMargin(Number(e.target.value))}>
                  {[14, 20, 28, 40, 56].map((n) => <option key={n} value={n}>{Math.round(n / 2.835)} mm</option>)}
                </Select>
              )}
            </Field>
            <Field label={t.color}>
              {(p) => (
                <Select {...p} value={color} onChange={(e) => setColor(e.target.value as keyof typeof COLORS)}>
                  {Object.keys(COLORS).map((c) => <option key={c} value={c}>{t.colors[c]}</option>)}
                </Select>
              )}
            </Field>
          </div>
          <div>
            <Checkbox label={t.skipFirst} checked={skipFirst} onChange={(e) => setSkipFirst(e.target.checked)} />
            <Checkbox label={t.arabicDigits} checked={arabicDigits} onChange={(e) => setArabicDigits(e.target.checked)} />
          </div>
          <p className="text-sm text-muted">«<bdi>{sample}</bdi>»</p>
          <div className="border-t border-line pt-4">
            <Button size="lg" onClick={apply} disabled={progress !== null || start === null}>
              <Icon name={progress !== null ? "loader" : "hash"} size={18} className={progress !== null ? "animate-spin" : undefined} />
              {progress !== null ? t.applying(progress) : t.apply}
            </Button>
          </div>
        </Panel>
      )}

      {result && (
        <Panel title={t.result}>
          {!current ? (
            <p className="text-sm text-muted">{t.stale}</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <DownloadButton filename={`${safeFileName(baseName(file?.name ?? "document"), "document")}-numbered.pdf`} getBlob={() => new Blob([current.bytes.buffer as ArrayBuffer], { type: "application/pdf" })} variant="primary" size="md" />
              </div>
              <PdfPagePreview bytes={current.bytes} page={skipFirst && count > 1 ? 2 : 1} alt={t.preview} />
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
