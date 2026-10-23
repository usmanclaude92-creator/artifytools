"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileDropZone } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Segmented } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { localizeHref } from "@/lib/i18n";
import { baseName, safeFileName } from "@/lib/files/names";
import { formatBytes } from "@/lib/files/size";
import { PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { openPdf, type RenderedDoc } from "@/lib/pdf/render";
import type { PageTable } from "@/lib/pdf/table";
import { pdfToXlsx, type ExcelSummary, type SheetLayout } from "@/lib/pdf/to-excel";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);

const strings = {
  en: {
    choose: "Choose a PDF", types: "PDF", reading: "Reading your PDF…", another: "Choose another file",
    pages: (n: number) => `${n} page${n === 1 ? "" : "s"}`,
    options: "Options", layout: "Sheets", layouts: { "per-page": "One sheet per page", single: "All pages in one sheet" } as Record<SheetLayout, string>,
    limits: "Works best on PDFs exported from Excel or accounting software, with one table per page. Numbers become real numbers you can add up. Check merged headers and multi-line cells in Excel.",
    convert: "Convert to Excel", converting: (d: number, n: number) => `Reading page ${d} of ${n}…`,
    result: "Your Excel file", summary: (s: ExcelSummary) => `${s.rows} row${s.rows === 1 ? "" : "s"} from ${s.pages} page${s.pages === 1 ? "" : "s"}.`,
    empty: (pages: number[]) => `Page${pages.length === 1 ? "" : "s"} ${pages.join(", ")} had no text (probably scanned) and ${pages.length === 1 ? "was" : "were"} skipped.`,
    allEmpty: "This PDF has no selectable text (it looks scanned), so there is no table to extract.", ocr: "Use Image to Text (OCR) for scanned pages.",
    preview: "Start of the first table",
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    failed: "Converting failed. The file may be damaged.", stale: "Options changed. Convert again to update the file.",
  },
  ar: {
    choose: "اختر ملف PDF", types: "PDF", reading: "جارٍ قراءة ملف PDF…", another: "اختيار ملف آخر",
    pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"),
    options: "الخيارات", layout: "الأوراق", layouts: { "per-page": "ورقة لكل صفحة", single: "كل الصفحات في ورقة واحدة" } as Record<SheetLayout, string>,
    limits: "يعمل بأفضل شكل مع ملفات PDF المصدّرة من Excel أو برامج المحاسبة، بجدول واحد في كل صفحة. تصبح الأرقام أرقامًا حقيقية يمكن جمعها. راجع العناوين المدمجة والخلايا متعددة الأسطر في Excel.",
    convert: "تحويل إلى Excel", converting: (d: number, n: number) => `جارٍ قراءة الصفحة ${d} من ${n}…`,
    result: "ملف Excel الخاص بك", summary: (s: ExcelSummary) => `${arCount(s.rows, "صف واحد", "صفان", "صفوف", "صفًا", "صف")} من ${arCount(s.pages, "صفحة واحدة", "صفحتين", "صفحات", "صفحة")}.`,
    empty: (pages: number[]) => `لا يوجد نص في ${pages.length === 1 ? "الصفحة" : "الصفحات"} ${pages.join("، ")} (غالبًا ممسوحة ضوئيًا)، لذا تم تخطيها.`,
    allEmpty: "لا يحتوي ملف PDF هذا على نص قابل للتحديد (يبدو ممسوحًا ضوئيًا)، لذا لا يوجد جدول لاستخراجه.", ocr: "استخدم أداة تحويل الصورة إلى نص (OCR) للصفحات الممسوحة.",
    preview: "بداية الجدول الأول",
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    failed: "فشل التحويل. قد يكون الملف تالفًا.", stale: "تغيّرت الخيارات. حوّل مجددًا لتحديث الملف.",
  },
};

export default function PdfToExcel() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<RenderedDoc | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [layout, setLayout] = useState<SheetLayout>("per-page");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const [result, setResult] = useState<{ key: string; blob: Blob; name: string; summary: ExcelSummary; preview: PageTable | null } | null>(null);

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

  const key = `${file?.name}|${file?.size}|${layout}`;
  const current = result && result.key === key ? result : null;

  async function convert() {
    if (!doc || !file) return;
    setFailed(false);
    setProgress({ done: 0, total: doc.numPages });
    try {
      const out = await pdfToXlsx(doc, { layout, onProgress: (done, total) => setProgress({ done, total }) });
      setResult({ key, blob: out.blob, name: `${safeFileName(baseName(file.name), "document")}.xlsx`, summary: out.summary, preview: out.preview });
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

  const allEmpty = current && current.summary.emptyPages.length === current.summary.pages;
  const ocrLink = <Link href={localizeHref("/tools/image-to-text", locale)} className="font-semibold underline">{t.ocr}</Link>;
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
          <Segmented legend={t.layout} value={layout} onChange={setLayout} options={(["per-page", "single"] as SheetLayout[]).map((v) => ({ value: v, label: t.layouts[v] }))} />
          <p className="text-sm text-muted">{t.limits}</p>
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <Button size="lg" onClick={convert} disabled={progress !== null}>
              <Icon name={progress ? "loader" : "file-text"} size={18} className={progress ? "animate-spin" : undefined} /> {t.convert}
            </Button>
            {progress && <span role="status" className="text-sm text-muted">{t.converting(progress.done, progress.total)}</span>}
          </div>
        </Panel>
      )}

      {(result || failed) && (
        <Panel title={t.result}>
          {failed && <StatusMessage tone="error">{t.failed}</StatusMessage>}
          {result && !current && <p className="text-sm text-muted">{t.stale}</p>}
          {current && allEmpty && <StatusMessage tone="warning">{t.allEmpty} {ocrLink}</StatusMessage>}
          {current && !allEmpty && (
            <>
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-text"><Icon name="file-text" size={20} /></span>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate font-medium" title={current.name}><bdi>{current.name}</bdi></p>
                  <p className="text-sm text-muted">{formatBytes(current.blob.size, locale)} · {t.summary(current.summary)}</p>
                </div>
                <DownloadButton filename={current.name} getBlob={() => current.blob} />
              </div>
              {current.summary.emptyPages.length > 0 && <StatusMessage tone="info">{t.empty(current.summary.emptyPages)} {ocrLink}</StatusMessage>}
              {current.preview && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">{t.preview}</p>
                  <div className="max-h-80 overflow-auto rounded-lg border border-line">
                    <table dir={current.preview.rtl ? "rtl" : "ltr"} className="w-full border-collapse text-sm">
                      <tbody>
                        {current.preview.rows.slice(0, 12).map((row, r) => (
                          <tr key={r} className="border-b border-line last:border-0">
                            {row.map((c, i) => (
                              <td key={i} className={`whitespace-nowrap border-e border-line px-3 py-1.5 last:border-e-0 ${c?.bold ? "font-semibold" : ""}`} dir="auto">{c?.text ?? ""}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
