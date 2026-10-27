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
import { moveItem, organizePdf } from "@/lib/pdf/organize";
import { inspectPdf, PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { openPdf, renderPage } from "@/lib/pdf/render";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
const MAX_THUMBS = 300;

const strings = {
  en: {
    choose: "Choose a PDF", types: "PDF", pages: (n: number) => `${n} page${n === 1 ? "" : "s"}`, reading: "Reading your PDF…",
    pagesTitle: "Pages", hint: "Drag pages to reorder them, or use the arrows. Delete what you don't need and rotate any sideways page.",
    kept: (k: number, n: number) => `${k} of ${n} pages kept`, reset: "Reset",
    earlier: (n: number) => `Move page ${n} earlier`, later: (n: number) => `Move page ${n} later`, left: (n: number) => `Rotate page ${n} left`, right: (n: number) => `Rotate page ${n} right`,
    remove: (n: number) => `Delete page ${n}`, page: (n: number) => `Page ${n}`,
    save: "Save organized PDF", saving: "Saving…", nothing: "Reorder, delete or rotate a page first.", empty: "Every page is deleted. Press Reset to bring them back.",
    many: (n: number) => `Only the first ${n} pages can be organized here. Split the PDF first for longer documents.`,
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    failed: "Saving failed. The file may be damaged.",
  },
  ar: {
    choose: "اختر ملف PDF", types: "PDF", pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"), reading: "جارٍ قراءة ملف PDF…",
    pagesTitle: "الصفحات", hint: "اسحب الصفحات لإعادة ترتيبها، أو استخدم الأسهم. احذف ما لا تحتاجه ودوّر أي صفحة مائلة.",
    kept: (k: number, n: number) => `${k} من ${n} صفحة محتفظ بها`, reset: "إعادة ضبط",
    earlier: (n: number) => `تقديم الصفحة ${n}`, later: (n: number) => `تأخير الصفحة ${n}`, left: (n: number) => `تدوير الصفحة ${n} لليسار`, right: (n: number) => `تدوير الصفحة ${n} لليمين`,
    remove: (n: number) => `حذف الصفحة ${n}`, page: (n: number) => `الصفحة ${n}`,
    save: "حفظ الملف بعد التنظيم", saving: "جارٍ الحفظ…", nothing: "رتّب صفحة أو احذفها أو دوّرها أولًا.", empty: "حُذفت كل الصفحات. اضغط «إعادة ضبط» لاسترجاعها.",
    many: (n: number) => `يمكن تنظيم أول ${n} صفحة فقط هنا. قسّم الملف أولًا للمستندات الأطول.`,
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    failed: "فشل الحفظ. قد يكون الملف تالفًا.",
  },
};

interface Item { source: number; turn: number }

export default function OrganizePdf() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [count, setCount] = useState(0);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
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

  const fresh = (n: number): Item[] => Array.from({ length: Math.min(n, MAX_THUMBS) }, (_, i) => ({ source: i + 1, turn: 0 }));

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
      setItems(fresh(info.pageCount));
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

  const shown = Math.min(count, MAX_THUMBS);
  const turn = (i: number, d: number) => setItems((xs) => xs.map((x, k) => (k === i ? { ...x, turn: (x.turn + d + 360) % 360 } : x)));
  const remove = (i: number) => setItems((xs) => xs.filter((_, k) => k !== i));
  const move = (from: number, to: number) => setItems((xs) => moveItem(xs, from, to));
  const reset = () => setItems(fresh(count));

  const unchanged = items.length === shown && items.every((x, i) => x.source === i + 1 && x.turn === 0);
  const key = `${file?.name}|${file?.size}|${items.map((x) => `${x.source}:${x.turn}`).join(",")}`;
  const current = result && result.key === key ? result : null;

  async function save() {
    if (!bytes || items.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const out = await organizePdf(bytes, items);
      setResult({ key, blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }) });
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  const name = file ? `${safeFileName(baseName(file.name), "document")}-organized.pdf` : "organized.pdf";
  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.choose}>
        <SingleFile file={file} rules={rules} typesLabel={t.types} status={bytes ? t.pages(count) : file && !error ? t.reading : null} onFile={open} onClear={() => { job.current++; clearThumbs(); setFile(null); setBytes(null); setItems([]); setError(null); setResult(null); }} />
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
      </Panel>

      {bytes && (
        <Panel
          title={t.pagesTitle}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted">{t.kept(items.length, count)}</span>
              <Button variant="ghost" size="sm" disabled={unchanged} onClick={reset}>{t.reset}</Button>
            </div>
          }
        >
          <p className="text-sm text-muted">{t.hint}</p>
          {count > MAX_THUMBS && <StatusMessage tone="info">{t.many(MAX_THUMBS)}</StatusMessage>}
          {items.length === 0 && <StatusMessage tone="info">{t.empty}</StatusMessage>}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {items.map((it, i) => {
              const u = thumbs[it.source - 1];
              return (
                <li
                  key={it.source}
                  draggable
                  onDragStart={() => setDragFrom(i)}
                  onDragOver={(e) => { e.preventDefault(); setOverIndex(i); }}
                  onDrop={(e) => { e.preventDefault(); if (dragFrom !== null) move(dragFrom, i); setDragFrom(null); setOverIndex(null); }}
                  onDragEnd={() => { setDragFrom(null); setOverIndex(null); }}
                  className={`flex cursor-grab flex-col items-center gap-2 rounded-lg border p-2 active:cursor-grabbing ${overIndex === i && dragFrom !== null && dragFrom !== i ? "border-accent bg-accent-soft" : "border-line"} ${dragFrom === i ? "opacity-50" : ""}`}
                >
                  <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-md bg-surface-2">
                    {u ? (
                      // eslint-disable-next-line @next/next/no-img-element -- local object URL
                      <img src={u} alt={t.page(it.source)} draggable={false} className="max-h-[88%] max-w-[88%] shadow-sm transition-transform" style={{ transform: `rotate(${it.turn}deg) scale(${it.turn % 180 ? 0.72 : 1})` }} />
                    ) : (
                      <Icon name="loader" size={20} className="animate-spin text-muted" />
                    )}
                  </div>
                  <span className="text-xs text-muted">{t.page(it.source)}</span>
                  <div className="flex w-full flex-wrap items-center justify-center gap-0.5">
                    <Button variant="ghost" size="sm" className="!px-1.5" aria-label={t.earlier(it.source)} disabled={i === 0} onClick={() => move(i, i - 1)}><Icon name="chevron-up" size={16} className="-rotate-90 rtl:rotate-90" /></Button>
                    <Button variant="ghost" size="sm" className="!px-1.5" aria-label={t.later(it.source)} disabled={i === items.length - 1} onClick={() => move(i, i + 1)}><Icon name="chevron-down" size={16} className="-rotate-90 rtl:rotate-90" /></Button>
                    <Button variant="ghost" size="sm" className="!px-1.5" aria-label={t.left(it.source)} onClick={() => turn(i, -90)}><Icon name="rotate-ccw" size={16} /></Button>
                    <Button variant="ghost" size="sm" className="!px-1.5" aria-label={t.right(it.source)} onClick={() => turn(i, 90)}><Icon name="rotate-cw" size={16} /></Button>
                    <Button variant="ghost" size="sm" className="!px-1.5 text-danger" aria-label={t.remove(it.source)} onClick={() => remove(i)}><Icon name="trash" size={16} /></Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <Button size="lg" onClick={save} disabled={unchanged || items.length === 0 || busy}>
              <Icon name={busy ? "loader" : "layers"} size={18} className={busy ? "animate-spin" : undefined} /> {busy ? t.saving : t.save}
            </Button>
            {current && <DownloadButton filename={name} getBlob={() => current.blob} variant="primary" size="md" />}
            {unchanged && <span className="text-sm text-muted">{t.nothing}</span>}
          </div>
        </Panel>
      )}
    </div>
  );
}
