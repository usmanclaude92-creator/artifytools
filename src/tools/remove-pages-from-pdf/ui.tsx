"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SingleFile } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Field, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { baseName, safeFileName } from "@/lib/files/names";
import { organizePdf } from "@/lib/pdf/organize";
import { inspectPdf, PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { openPdf, renderPage } from "@/lib/pdf/render";
import { parseRanges, type RangeError } from "@/lib/pdf/ranges";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
const MAX_THUMBS = 300;

const strings = {
  en: {
    choose: "Choose a PDF", types: "PDF", pages: (n: number) => `${n} page${n === 1 ? "" : "s"}`, reading: "Reading your PDF…",
    pagesTitle: "Pages", hint: "Tap the pages you want to remove, or type page numbers below.", type: "Pages to remove", typeHint: "For example 2, 5-7 (separate with commas).",
    page: (n: number) => `Page ${n}`, mark: (n: number) => `Page ${n}, tap to remove`, marked: (n: number) => `Page ${n}, will be removed, tap to keep`, remove: "Remove", clear: "Clear",
    summary: (rm: number, keep: number) => `${rm} page${rm === 1 ? "" : "s"} will be removed, ${keep} kept.`, none: "Choose at least one page to remove.", all: "You can't remove every page. Keep at least one.",
    save: "Save PDF", saving: "Saving…", many: (n: number) => `Previews are shown for the first ${n} pages; typed page numbers still work for every page.`,
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    range: (e: RangeError) => (e.code === "syntax" ? `“${e.token}” isn't a page or range. Use numbers like 3 or 2-5.` : e.code === "reversed" ? `“${e.token}” runs backwards. Write the smaller page first.` : e.code === "outOfBounds" ? `This PDF has ${e.pageCount} pages, so page ${e.page} doesn't exist.` : ""),
    failed: "Saving failed. The file may be damaged.",
  },
  ar: {
    choose: "اختر ملف PDF", types: "PDF", pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"), reading: "جارٍ قراءة ملف PDF…",
    pagesTitle: "الصفحات", hint: "اضغط على الصفحات التي تريد حذفها، أو اكتب أرقامها بالأسفل.", type: "الصفحات المراد حذفها", typeHint: "مثل 2، 5-7 (افصل بفواصل).",
    page: (n: number) => `الصفحة ${n}`, mark: (n: number) => `الصفحة ${n}، اضغط للحذف`, marked: (n: number) => `الصفحة ${n}، ستُحذف، اضغط للإبقاء`, remove: "حذف", clear: "مسح",
    summary: (rm: number, keep: number) => `ستُحذف ${arCount(rm, "صفحة واحدة", "صفحتان", "صفحات", "صفحة")} وتبقى ${keep}.`, none: "اختر صفحة واحدة على الأقل للحذف.", all: "لا يمكن حذف كل الصفحات. أبقِ صفحة واحدة على الأقل.",
    save: "حفظ PDF", saving: "جارٍ الحفظ…", many: (n: number) => `تظهر المعاينات لأول ${n} صفحة فقط؛ وتعمل أرقام الصفحات المكتوبة لكل الصفحات.`,
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    range: (e: RangeError) => (e.code === "syntax" ? `«${e.token}» ليس صفحة أو نطاقًا. استخدم أرقامًا مثل 3 أو 2-5.` : e.code === "reversed" ? `النطاق «${e.token}» معكوس. اكتب الصفحة الأصغر أولًا.` : e.code === "outOfBounds" ? `يحتوي هذا الملف على ${e.pageCount} صفحة، فالصفحة ${e.page} غير موجودة.` : ""),
    failed: "فشل الحفظ. قد يكون الملف تالفًا.",
  },
};

/** [2,3,4,7] → "2-4, 7" */
function toRanges(pages: number[]): string {
  const sorted = [...pages].sort((a, b) => a - b);
  const out: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (sorted[j + 1] === sorted[j]! + 1) j++;
    out.push(j > i ? `${sorted[i]}-${sorted[j]}` : String(sorted[i]));
    i = j;
  }
  return out.join(", ");
}

export default function RemovePages() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [count, setCount] = useState(0);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [removed, setRemoved] = useState<number[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ key: string; blob: Blob } | null>(null);
  const [busy, setBusy] = useState(false);
  const urls = useRef<string[]>([]);
  const job = useRef(0);

  const clearThumbs = () => {
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = [];
    setThumbs([]);
  };
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  async function open(f: File) {
    const id = ++job.current;
    clearThumbs();
    setFile(f);
    setBytes(null);
    setError(null);
    setResult(null);
    setRemoved([]);
    setText("");
    try {
      const b = new Uint8Array(await f.arrayBuffer());
      const info = await inspectPdf(b);
      setBytes(b);
      setCount(info.pageCount);
      const doc = await openPdf(b);
      for (let p = 1; p <= Math.min(doc.numPages, MAX_THUMBS); p++) {
        if (job.current !== id) break;
        const r = await renderPage(doc, p, { dpi: 30, format: "jpg", quality: 0.7 });
        const u = URL.createObjectURL(r.blob);
        urls.current.push(u);
        setThumbs((x) => [...x, u]);
      }
      void doc.destroy();
    } catch (e) {
      setError(e instanceof PdfError ? t.errors[e.code] : t.errors.invalid);
    }
  }

  const toggle = (n: number) => {
    const next = removed.includes(n) ? removed.filter((x) => x !== n) : [...removed, n];
    setRemoved(next);
    setText(toRanges(next));
  };
  const typed = (v: string) => {
    setText(v);
    if (!v.trim()) { setRemoved([]); return; }
    const r = parseRanges(v, count);
    if (r.ok) setRemoved([...new Set(r.groups.flat())]);
  };
  const rangeProblem = useMemo(() => {
    if (!text.trim() || !count) return null;
    const r = parseRanges(text, count);
    return r.ok ? null : t.range(r.error);
  }, [text, count, t]);

  const keep = count - removed.length;
  const key = `${file?.name}|${file?.size}|${[...removed].sort((a, b) => a - b).join(",")}`;
  const current = result && result.key === key ? result : null;
  const canSave = removed.length > 0 && keep > 0 && !rangeProblem;

  async function save() {
    if (!bytes || !canSave) return;
    setBusy(true);
    setError(null);
    try {
      const gone = new Set(removed);
      const pages = Array.from({ length: count }, (_, i) => i + 1).filter((n) => !gone.has(n)).map((source) => ({ source, turn: 0 }));
      const out = await organizePdf(bytes, pages);
      setResult({ key, blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }) });
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  const name = file ? `${safeFileName(baseName(file.name), "document")}-edited.pdf` : "edited.pdf";
  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.choose}>
        <SingleFile file={file} rules={rules} typesLabel={t.types} status={bytes ? t.pages(count) : file && !error ? t.reading : null} onFile={open} onClear={() => { job.current++; clearThumbs(); setFile(null); setBytes(null); setError(null); setResult(null); setRemoved([]); setText(""); }} />
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
      </Panel>

      {bytes && (
        <Panel title={t.pagesTitle} actions={<Button variant="ghost" size="sm" disabled={removed.length === 0} onClick={() => { setRemoved([]); setText(""); }}>{t.clear}</Button>}>
          <p className="text-sm text-muted">{t.hint}</p>
          <Field label={t.type} hint={t.typeHint} error={rangeProblem}>
            {(p) => <TextInput {...p} dir="ltr" inputMode="text" autoComplete="off" value={text} onChange={(e) => typed(e.target.value)} placeholder="2, 5-7" className="max-w-xs" />}
          </Field>
          {count > MAX_THUMBS && <StatusMessage tone="info">{t.many(MAX_THUMBS)}</StatusMessage>}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 @4xl:grid-cols-5">
            {thumbs.map((u, i) => {
              const n = i + 1;
              const gone = removed.includes(n);
              return (
                <li key={u}>
                  <button
                    type="button"
                    aria-pressed={gone}
                    aria-label={gone ? t.marked(n) : t.mark(n)}
                    onClick={() => toggle(n)}
                    className={`relative flex w-full flex-col items-center gap-2 rounded-lg border p-2 transition-colors ${gone ? "border-danger bg-danger-soft" : "border-line hover:border-accent"}`}
                  >
                    <span className="relative grid aspect-[3/4] w-full place-items-center overflow-hidden rounded-md bg-surface-2">
                      {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
                      <img src={u} alt={t.page(n)} className={`max-h-full max-w-full shadow-sm ${gone ? "opacity-40" : ""}`} draggable={false} />
                      {gone && <span className="absolute inset-0 grid place-items-center"><span className="inline-flex items-center gap-1 rounded-full bg-danger px-3 py-1 text-xs font-semibold text-white"><Icon name="trash" size={13} /> {t.remove}</span></span>}
                    </span>
                    <span className="text-xs text-muted">{n}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <Button size="lg" onClick={save} disabled={!canSave || busy}>
              <Icon name={busy ? "loader" : "trash"} size={18} className={busy ? "animate-spin" : undefined} /> {busy ? t.saving : t.save}
            </Button>
            {current && <DownloadButton filename={name} getBlob={() => current.blob} variant="primary" size="md" />}
            <span className="text-sm text-muted" aria-live="polite">{removed.length === 0 ? t.none : keep <= 0 ? t.all : t.summary(removed.length, keep)}</span>
          </div>
        </Panel>
      )}
    </div>
  );
}
