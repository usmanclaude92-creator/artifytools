"use client";

import { useEffect, useRef, useState } from "react";
import { SingleFile } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { baseName, safeFileName } from "@/lib/files/names";
import { rotatePages } from "@/lib/pdf/edit";
import { inspectPdf, PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { openPdf, renderPage } from "@/lib/pdf/render";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
const MAX_THUMBS = 300;

const strings = {
  en: {
    choose: "Choose a PDF", types: "PDF", pages: (n: number) => `${n} page${n === 1 ? "" : "s"}`, reading: "Reading your PDF…",
    pagesTitle: "Pages", hint: "Rotate single pages with their buttons, or all pages at once.", allLeft: "All left", allRight: "All right", reset: "Reset",
    left: (n: number) => `Rotate page ${n} left`, right: (n: number) => `Rotate page ${n} right`, page: (n: number) => `Page ${n}`,
    save: "Save rotated PDF", saving: "Saving…", nothing: "Rotate at least one page first.", many: (n: number) => `Previews are shown for the first ${n} pages; “All left/right” still rotates every page.`,
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    failed: "Saving failed. The file may be damaged.",
  },
  ar: {
    choose: "اختر ملف PDF", types: "PDF", pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"), reading: "جارٍ قراءة ملف PDF…",
    pagesTitle: "الصفحات", hint: "دوّر الصفحات منفردة بأزرارها، أو كل الصفحات دفعة واحدة.", allLeft: "تدوير الكل لليسار", allRight: "تدوير الكل لليمين", reset: "إعادة ضبط",
    left: (n: number) => `تدوير الصفحة ${n} لليسار`, right: (n: number) => `تدوير الصفحة ${n} لليمين`, page: (n: number) => `الصفحة ${n}`,
    save: "حفظ الملف بعد التدوير", saving: "جارٍ الحفظ…", nothing: "دوّر صفحة واحدة على الأقل أولًا.", many: (n: number) => `تظهر المعاينات لأول ${n} صفحة فقط؛ ويدوّر زر «تدوير الكل» جميع الصفحات.`,
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    failed: "فشل الحفظ. قد يكون الملف تالفًا.",
  },
};

export default function RotatePdf() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [count, setCount] = useState(0);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [turns, setTurns] = useState<number[]>([]);
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
    try {
      const b = new Uint8Array(await f.arrayBuffer());
      const info = await inspectPdf(b);
      setBytes(b);
      setCount(info.pageCount);
      setTurns(Array(info.pageCount).fill(0));
      // Small previews, page by page, so the grid fills in as they're ready.
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

  const turn = (i: number | "all", d: number) => setTurns((ts) => ts.map((v, k) => (i === "all" || k === i ? (v + d + 360) % 360 : v)));
  const key = `${file?.name}|${file?.size}|${turns.join(",")}`;
  const current = result && result.key === key ? result : null;
  const changed = turns.some((v) => v % 360);

  async function save() {
    if (!bytes) return;
    setBusy(true);
    setError(null);
    try {
      const out = await rotatePages(bytes, turns);
      setResult({ key, blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }) });
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  const name = file ? `${safeFileName(baseName(file.name), "document")}-rotated.pdf` : "rotated.pdf";
  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.choose}>
        <SingleFile file={file} rules={rules} typesLabel={t.types} status={bytes ? t.pages(count) : file && !error ? t.reading : null} onFile={open} onClear={() => { job.current++; clearThumbs(); setFile(null); setBytes(null); setError(null); setResult(null); }} />
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
      </Panel>

      {bytes && (
        <Panel
          title={t.pagesTitle}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => turn("all", -90)}><Icon name="rotate-ccw" size={16} /> {t.allLeft}</Button>
              <Button variant="secondary" size="sm" onClick={() => turn("all", 90)}><Icon name="rotate-cw" size={16} /> {t.allRight}</Button>
              <Button variant="ghost" size="sm" disabled={!changed} onClick={() => setTurns((ts) => ts.map(() => 0))}>{t.reset}</Button>
            </div>
          }
        >
          <p className="text-sm text-muted">{t.hint}</p>
          {count > MAX_THUMBS && <StatusMessage tone="info">{t.many(MAX_THUMBS)}</StatusMessage>}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {thumbs.map((u, i) => (
              <li key={u} className="flex flex-col items-center gap-2 rounded-lg border border-line p-2">
                <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-md bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
                  <img src={u} alt={t.page(i + 1)} className="max-h-[88%] max-w-[88%] shadow-sm transition-transform" style={{ transform: `rotate(${turns[i]}deg) scale(${turns[i]! % 180 ? 0.72 : 1})` }} />
                </div>
                <div className="flex w-full items-center justify-between">
                  <Button variant="ghost" size="sm" className="!px-2" aria-label={t.left(i + 1)} onClick={() => turn(i, -90)}><Icon name="rotate-ccw" size={16} /></Button>
                  <span className="text-xs text-muted">{i + 1}</span>
                  <Button variant="ghost" size="sm" className="!px-2" aria-label={t.right(i + 1)} onClick={() => turn(i, 90)}><Icon name="rotate-cw" size={16} /></Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <Button size="lg" onClick={save} disabled={!changed || busy}>
              <Icon name={busy ? "loader" : "rotate-cw"} size={18} className={busy ? "animate-spin" : undefined} /> {busy ? t.saving : t.save}
            </Button>
            {current && <DownloadButton filename={name} getBlob={() => current.blob} variant="primary" size="md" />}
            {!changed && <span className="text-sm text-muted">{t.nothing}</span>}
          </div>
        </Panel>
      )}
    </div>
  );
}
