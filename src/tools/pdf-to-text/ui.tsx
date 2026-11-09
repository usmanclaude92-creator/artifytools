"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FileDropZone } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton, DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Checkbox, Segmented, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { localizeHref } from "@/lib/i18n";
import { baseName, safeFileName } from "@/lib/files/names";
import { formatBytes } from "@/lib/files/size";
import { createOcr, type OcrEngine, type OcrLang } from "@/lib/ocr/ocr";
import { PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { openPdf, renderPage, type RenderedDoc } from "@/lib/pdf/render";
import { extractPages, joinText, type ExtractedPage, type TextMode } from "@/lib/pdf/to-text";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);

const strings = {
  en: {
    choose: "Choose a PDF", types: "PDF", reading: "Reading your PDF…", another: "Choose another file",
    pages: (n: number) => `${n} page${n === 1 ? "" : "s"}`,
    options: "Options", layout: "Text layout", paragraphs: "Paragraphs", lines: "Same lines as the PDF",
    layoutHint: "Paragraphs joins wrapped lines. Same lines keeps every line break, which suits tables and statements.",
    markers: "Show where each page starts", ocr: "Read scanned pages with OCR (pages that are pictures)", langs: "Language of scanned pages", eng: "English", ara: "Arabic",
    extract: "Extract text", working: (p: number) => `Reading… ${p}%`, ocrLoading: "Loading the OCR engine (first time only, a few MB)…", ocrReading: (p: number, n: number) => `Recognising scanned page ${p} of ${n}…`,
    result: "Extracted text", pageLabel: (n: number) => `— Page ${n} —`,
    stats: (pages: number, words: number) => `${pages} page${pages === 1 ? "" : "s"} · ${words.toLocaleString("en")} word${words === 1 ? "" : "s"}`,
    scansRead: (n: number) => `${n} scanned page${n === 1 ? " was" : "s were"} read with OCR, so check those pages for mistakes.`,
    scansLeft: (pages: number[]) => `Page${pages.length === 1 ? "" : "s"} ${pages.join(", ")} ${pages.length === 1 ? "has" : "have"} no selectable text (probably scanned). Turn on OCR to read ${pages.length === 1 ? "it" : "them"}.`,
    empty: "No text was found in this PDF.",
    copy: "Copy text", download: "Download .txt",
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    failed: "Reading failed. The file may be damaged.", stale: "Options changed. Extract again to update the text.", unlock: "Unlock PDF",
  },
  ar: {
    choose: "اختر ملف PDF", types: "PDF", reading: "جارٍ قراءة ملف PDF…", another: "اختيار ملف آخر",
    pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"),
    options: "الخيارات", layout: "شكل النص", paragraphs: "فقرات", lines: "الأسطر نفسها كما في PDF",
    layoutHint: "«فقرات» تدمج الأسطر المتتابعة. و«الأسطر نفسها» تبقي كل فاصل أسطر، وهذا يناسب الجداول وكشوف الحساب.",
    markers: "إظهار بداية كل صفحة", ocr: "قراءة الصفحات الممسوحة بتقنية OCR (الصفحات التي هي صور)", langs: "لغة الصفحات الممسوحة", eng: "الإنجليزية", ara: "العربية",
    extract: "استخراج النص", working: (p: number) => `جارٍ القراءة… ${p}%`, ocrLoading: "جارٍ تحميل محرك OCR (أول مرة فقط، بضعة ميغابايت)…", ocrReading: (p: number, n: number) => `جارٍ التعرف على الصفحة الممسوحة ${p} من ${n}…`,
    result: "النص المستخرج", pageLabel: (n: number) => `— الصفحة ${n} —`,
    stats: (pages: number, words: number) => `${arCount(pages, "صفحة واحدة", "صفحتان", "صفحات", "صفحة")} · ${arCount(words, "كلمة واحدة", "كلمتان", "كلمات", "كلمة")}`,
    scansRead: (n: number) => `قُرئت ${arCount(n, "صفحة ممسوحة واحدة", "صفحتان ممسوحتان", "صفحات ممسوحة", "صفحة ممسوحة")} بتقنية OCR، لذا راجع هذه الصفحات بحثًا عن الأخطاء.`,
    scansLeft: (pages: number[]) => `لا يوجد نص قابل للتحديد في ${pages.length === 1 ? "الصفحة" : "الصفحات"} ${pages.join("، ")} (غالبًا ممسوحة ضوئيًا). فعّل OCR لقراءتها.`,
    empty: "لم يُعثر على نص في ملف PDF هذا.",
    copy: "نسخ النص", download: "تنزيل .txt",
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    failed: "فشلت القراءة. قد يكون الملف تالفًا.", stale: "تغيّرت الخيارات. استخرج النص مجددًا لتحديث النص.", unlock: "فك حماية PDF",
  },
};

interface Result {
  key: string;
  pages: ExtractedPage[];
  ocrPages: number[];
}

export default function PdfToText() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<RenderedDoc | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<TextMode>("paragraphs");
  const [markers, setMarkers] = useState(false);
  const [useOcr, setUseOcr] = useState(true);
  const [langs, setLangs] = useState<OcrLang[]>(locale === "ar" ? ["ara", "eng"] : ["eng"]);
  const [status, setStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const engine = useRef<{ key: string; ocr: OcrEngine } | null>(null);

  useEffect(() => () => void doc?.destroy(), [doc]);
  useEffect(() => () => void engine.current?.ocr.terminate(), []);

  async function open(f: File) {
    setFile(f);
    setDoc(null);
    setResult(null);
    setLoadError(null);
    setFailed(false);
    try {
      setDoc(await openPdf(new Uint8Array(await f.arrayBuffer())));
    } catch (e) {
      setLoadError(e instanceof PdfError ? t.errors[e.code] : t.errors.invalid);
    }
  }

  const busy = status !== null;
  const ocrKey = useOcr ? [...langs].sort().join("+") : "off";
  const key = `${file?.name}|${file?.size}|${mode}|${ocrKey}`;
  const current = result && result.key === key ? result : null;
  const text = current ? joinText(current.pages, markers, t.pageLabel) : "";
  const words = text.replace(/—.*—/g, " ").split(/\s+/).filter(Boolean).length;
  const left = current ? current.pages.filter((p) => p.scanned && !current.ocrPages.includes(p.n)).map((p) => p.n) : [];

  function toggle(l: OcrLang, on: boolean) {
    setLangs((ls) => (on ? [...new Set([...ls, l])] : ls.filter((x) => x !== l)));
  }

  async function extract() {
    if (!doc || !file) return;
    setFailed(false);
    setStatus(t.working(0));
    try {
      const pages = await extractPages(doc, mode, (d, n) => setStatus(t.working(Math.round((d / n) * 100))));
      const ocrPages: number[] = [];
      const scanned = pages.filter((p) => p.scanned);
      if (useOcr && langs.length && scanned.length) {
        if (engine.current?.key !== ocrKey) {
          await engine.current?.ocr.terminate();
          engine.current = null;
        }
        setStatus(t.ocrLoading);
        let done = 0;
        engine.current ??= { key: ocrKey, ocr: await createOcr(langs, (stage) => { if (stage === "loading") setStatus(t.ocrLoading); else setStatus(t.ocrReading(done + 1, scanned.length)); }) };
        for (const p of scanned) {
          setStatus(t.ocrReading(done + 1, scanned.length));
          const img = await renderPage(doc, p.n, { dpi: 300, format: "jpg", quality: 0.9 });
          const out = await engine.current.ocr.recognize(img.blob, { pdf: false });
          p.text = out.text.replace(/\n{3,}/g, "\n\n").trim();
          if (p.text) ocrPages.push(p.n);
          done++;
        }
      }
      setResult({ key, pages, ocrPages });
    } catch {
      setFailed(true);
    } finally {
      setStatus(null);
    }
  }

  if (!file) {
    return (
      <Panel title={t.choose}>
        <FileDropZone rules={rules} onFiles={(fs) => fs[0] && open(fs[0])} typesLabel={t.types} />
      </Panel>
    );
  }

  const stem = safeFileName(baseName(file.name), "text");
  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.choose}>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-surface-2 text-muted"><Icon name="file-text" size={22} /></span>
          <div className="min-w-0 flex-1 basis-40">
            <p className="truncate font-medium" title={file.name}><bdi>{file.name}</bdi></p>
            <p className="text-sm text-muted">{formatBytes(file.size, locale)}{doc && ` · ${t.pages(doc.numPages)}`}{!doc && !loadError && ` · ${t.reading}`}</p>
          </div>
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => { setFile(null); setDoc(null); setResult(null); setLoadError(null); }}>
            <Icon name="rotate-ccw" size={16} /> {t.another}
          </Button>
        </div>
        {loadError && (
          <StatusMessage tone="error">
            {loadError}{" "}
            {loadError === t.errors.encrypted && <Link href={localizeHref("/tools/unlock-pdf", locale)} className="font-semibold underline">{t.unlock}</Link>}
          </StatusMessage>
        )}
      </Panel>

      {doc && (
        <Panel title={t.options}>
          <Segmented legend={t.layout} value={mode} onChange={setMode} options={[{ value: "paragraphs", label: t.paragraphs }, { value: "lines", label: t.lines }]} />
          <p className="text-sm text-muted">{t.layoutHint}</p>
          <Checkbox label={t.markers} checked={markers} onChange={(e) => setMarkers(e.target.checked)} />
          <Checkbox label={t.ocr} checked={useOcr} onChange={(e) => setUseOcr(e.target.checked)} disabled={busy} />
          {useOcr && (
            <div className="flex flex-wrap items-center gap-x-6 ps-7">
              <span className="text-sm text-muted">{t.langs}</span>
              <Checkbox label={t.ara} checked={langs.includes("ara")} onChange={(e) => toggle("ara", e.target.checked)} disabled={busy} />
              <Checkbox label={t.eng} checked={langs.includes("eng")} onChange={(e) => toggle("eng", e.target.checked)} disabled={busy} />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <Button size="lg" onClick={extract} disabled={busy || (useOcr && langs.length === 0)}>
              <Icon name={busy ? "loader" : "file-text"} size={18} className={busy ? "animate-spin" : undefined} /> {t.extract}
            </Button>
            {status && <span role="status" className="text-sm text-muted">{status}</span>}
          </div>
        </Panel>
      )}

      {(result || failed) && (
        <Panel title={t.result}>
          {failed && <StatusMessage tone="error">{t.failed}</StatusMessage>}
          {result && !current && <p className="text-sm text-muted">{t.stale}</p>}
          {current && (
            !text.trim() ? (
              <StatusMessage tone="warning">{t.empty}{left.length > 0 && ` ${t.scansLeft(left)}`}</StatusMessage>
            ) : (
              <>
                <p className="text-sm text-muted">{t.stats(current.pages.length, words)}</p>
                {current.ocrPages.length > 0 && <StatusMessage tone="info">{t.scansRead(current.ocrPages.length)}</StatusMessage>}
                {left.length > 0 && <StatusMessage tone="warning">{t.scansLeft(left)}</StatusMessage>}
                <TextArea aria-label={t.result} readOnly value={text} rows={16} dir="auto" className="!font-sans" />
                <div className="flex flex-wrap gap-2">
                  <CopyButton value={text} label={t.copy} size="md" />
                  <DownloadButton filename={`${stem}.txt`} getBlob={() => new Blob([text], { type: "text/plain;charset=utf-8" })} label={t.download} size="md" />
                </div>
              </>
            )
          )}
        </Panel>
      )}
    </div>
  );
}
