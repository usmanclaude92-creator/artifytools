"use client";

import { useEffect, useState } from "react";
import { FileDropZone } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Checkbox } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { baseName, safeFileName } from "@/lib/files/names";
import { formatBytes } from "@/lib/files/size";
import { PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { openPdf, type RenderedDoc } from "@/lib/pdf/render";
import type { Block } from "@/lib/pdf/text-layout";
import { pdfToDocx, type ConvertSummary } from "@/lib/pdf/to-word";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);

const strings = {
  en: {
    choose: "Choose a PDF", types: "PDF", reading: "Reading your PDF…", another: "Choose another file",
    pages: (n: number) => `${n} page${n === 1 ? "" : "s"}`,
    options: "Options", breaks: "Start each PDF page on a new page in Word",
    convert: "Convert to Word", converting: (p: number) => `Converting… ${p}%`,
    result: "Your Word document",
    summary: (s: ConvertSummary) => `${s.headings} heading${s.headings === 1 ? "" : "s"} and ${s.paragraphs} paragraph${s.paragraphs === 1 ? "" : "s"} from ${s.pages} page${s.pages === 1 ? "" : "s"}.`,
    scans: (pages: number[]) => `Page${pages.length === 1 ? "" : "s"} ${pages.join(", ")} had no text (probably scanned), so ${pages.length === 1 ? "it was" : "they were"} added as ${pages.length === 1 ? "a picture" : "pictures"}.`,
    noText: "This PDF has no selectable text (it looks scanned). Its pages were added to the Word file as pictures; the text can't be edited.",
    previewTitle: "Start of the text",
    limits: "Text, headings, bold and italic, paragraphs and Arabic text are kept. Tables, columns and pictures inside text pages are not, so check the layout in Word.",
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    failed: "Converting failed. The file may be damaged.", stale: "Options changed. Convert again to update the file.",
  },
  ar: {
    choose: "اختر ملف PDF", types: "PDF", reading: "جارٍ قراءة ملف PDF…", another: "اختيار ملف آخر",
    pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"),
    options: "الخيارات", breaks: "بدء كل صفحة من ملف PDF في صفحة جديدة في Word",
    convert: "تحويل إلى Word", converting: (p: number) => `جارٍ التحويل… ${p}%`,
    result: "مستند Word الخاص بك",
    summary: (s: ConvertSummary) => `${arCount(s.headings, "عنوان واحد", "عنوانان", "عناوين", "عنوانًا", "عنوان")} و${arCount(s.paragraphs, "فقرة واحدة", "فقرتان", "فقرات", "فقرة")} من ${arCount(s.pages, "صفحة واحدة", "صفحتين", "صفحات", "صفحة")}.`,
    scans: (pages: number[]) => `لا يوجد نص في ${pages.length === 1 ? "الصفحة" : "الصفحات"} ${pages.join("، ")} (غالبًا ممسوحة ضوئيًا)، لذا أُضيفت كصور.`,
    noText: "لا يحتوي ملف PDF هذا على نص قابل للتحديد (يبدو ممسوحًا ضوئيًا). أُضيفت صفحاته إلى ملف Word كصور، ولا يمكن تعديل نصها.",
    previewTitle: "بداية النص",
    limits: "يُحافظ على النص والعناوين والخط العريض والمائل والفقرات والنص العربي. أما الجداول والأعمدة والصور داخل صفحات النص فلا تُنقل، لذا راجع التنسيق في Word.",
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    failed: "فشل التحويل. قد يكون الملف تالفًا.", stale: "تغيّرت الخيارات. حوّل مجددًا لتحديث الملف.",
  },
};

export default function PdfToWord() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<RenderedDoc | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageBreaks, setPageBreaks] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [result, setResult] = useState<{ key: string; blob: Blob; name: string; summary: ConvertSummary; preview: Block[] } | null>(null);

  useEffect(() => () => void doc?.destroy(), [doc]);

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

  const key = `${file?.name}|${file?.size}|${pageBreaks}`;
  const current = result && result.key === key ? result : null;

  async function convert() {
    if (!doc || !file) return;
    setFailed(false);
    setProgress(0);
    try {
      const out = await pdfToDocx(doc, { pageBreaks, onProgress: (d, n) => setProgress(Math.round((d / n) * 100)) });
      setResult({ key, blob: out.blob, name: `${safeFileName(baseName(file.name), "document")}.docx`, summary: out.summary, preview: out.preview });
    } catch {
      setFailed(true);
    } finally {
      setProgress(null);
    }
  }

  if (!file) {
    return (
      <Panel title={t.choose}>
        <FileDropZone rules={rules} onFiles={(fs) => fs[0] && open(fs[0])} typesLabel={t.types} />
      </Panel>
    );
  }

  const allScanned = current && current.summary.imagePages.length === current.summary.pages;
  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.choose}>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-surface-2 text-muted"><Icon name="file-text" size={22} /></span>
          <div className="min-w-0 flex-1 basis-40">
            <p className="truncate font-medium" title={file.name}><bdi>{file.name}</bdi></p>
            <p className="text-sm text-muted">{formatBytes(file.size, locale)}{doc && ` · ${t.pages(doc.numPages)}`}{!doc && !loadError && ` · ${t.reading}`}</p>
          </div>
          <Button variant="secondary" size="sm" disabled={progress !== null} onClick={() => { setFile(null); setDoc(null); setResult(null); setLoadError(null); }}>
            <Icon name="rotate-ccw" size={16} /> {t.another}
          </Button>
        </div>
        {loadError && <StatusMessage tone="error">{loadError}</StatusMessage>}
      </Panel>

      {doc && (
        <Panel title={t.options}>
          <Checkbox label={t.breaks} checked={pageBreaks} onChange={(e) => setPageBreaks(e.target.checked)} />
          <p className="text-sm text-muted">{t.limits}</p>
          <div className="border-t border-line pt-4">
            <Button size="lg" onClick={convert} disabled={progress !== null}>
              <Icon name={progress !== null ? "loader" : "file-text"} size={18} className={progress !== null ? "animate-spin" : undefined} />
              {progress !== null ? t.converting(progress) : t.convert}
            </Button>
          </div>
        </Panel>
      )}

      {(result || failed) && (
        <Panel title={t.result}>
          {failed && <StatusMessage tone="error">{t.failed}</StatusMessage>}
          {result && !current && <p className="text-sm text-muted">{t.stale}</p>}
          {current && (
            <>
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-text"><Icon name="file-text" size={20} /></span>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate font-medium" title={current.name}><bdi>{current.name}</bdi></p>
                  <p className="text-sm text-muted">{formatBytes(current.blob.size, locale)} · {t.summary(current.summary)}</p>
                </div>
                <DownloadButton filename={current.name} getBlob={() => current.blob} />
              </div>
              {allScanned ? (
                <StatusMessage tone="warning">{t.noText}</StatusMessage>
              ) : (
                current.summary.imagePages.length > 0 && <StatusMessage tone="info">{t.scans(current.summary.imagePages)}</StatusMessage>
              )}
              {current.preview.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">{t.previewTitle}</p>
                  <div className="max-h-72 overflow-auto rounded-lg border border-line bg-surface p-4 text-[0.95rem]">
                    {current.preview.map((b, i) => {
                      const Tag = b.kind === "heading" ? (`h${Math.min(6, b.level + 2)}` as "h3") : "p";
                      return (
                        <Tag key={i} dir={b.rtl ? "rtl" : "ltr"} className={b.kind === "heading" ? "mb-2 text-lg font-semibold" : "mb-3 text-muted"} style={{ textAlign: b.align === "center" ? "center" : undefined }}>
                          {b.runs.map((r, k) => <span key={k} className={(r.bold ? "font-semibold " : "") + (r.italic ? "italic" : "")}>{r.text}</span>)}
                        </Tag>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </Panel>
      )}
    </div>
  );
}
