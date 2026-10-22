"use client";

import { useState } from "react";
import { FileDropZone, FileList, FileProcessingError, useFileQueue } from "@/components/files";
import { IdleHint, Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { formatBytes } from "@/lib/files/size";
import { inspectPdf, mergePdfs, PdfError, type LoadedPdf } from "@/lib/pdf/pdf";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);

const strings = {
  en: {
    add: "Add PDF files", types: "PDF", order: "Order", orderHint: "The top file comes first. Use the arrows to reorder.",
    pages: (n: number) => `${n} page${n === 1 ? "" : "s"}`,
    needTwo: "Add at least two PDF files to merge.", waiting: "Reading your files…", fixErrors: "Remove the files that couldn't be read, then merge.",
    merge: "Merge PDFs", merging: "Merging…", result: "Merged PDF",
    summary: (pages: string, size: string) => `${pages} · ${size}`, download: "Download merged PDF", stale: "The file list changed. Merge again to update the result.",
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then add it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." },
    failed: "Merging failed. One of the files may be damaged; try removing files to find it.",
  },
  ar: {
    add: "أضف ملفات PDF", types: "PDF", order: "الترتيب", orderHint: "الملف الأعلى يأتي أولًا. استخدم الأسهم لتغيير الترتيب.",
    pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"),
    needTwo: "أضف ملفّي PDF على الأقل لدمجهما.", waiting: "جارٍ قراءة ملفاتك…", fixErrors: "أزل الملفات التي تعذّرت قراءتها، ثم ادمج.",
    merge: "دمج الملفات", merging: "جارٍ الدمج…", result: "ملف PDF المدمج",
    summary: (pages: string, size: string) => `${pages} · ${size}`, download: "تنزيل الملف المدمج", stale: "تغيّرت قائمة الملفات. ادمج مجددًا لتحديث النتيجة.",
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم أضفه مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." },
    failed: "فشل الدمج. قد يكون أحد الملفات تالفًا؛ جرّب إزالة الملفات لمعرفته.",
  },
};

interface Merged {
  key: string;
  blob: Blob;
  pages: number;
}

export default function MergePdf() {
  const locale = useLocale();
  const t = strings[locale];
  const m = useMessages();
  const [merged, setMerged] = useState<Merged | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  const q = useFileQueue<LoadedPdf>(
    async (file) => {
      try {
        return await inspectPdf(new Uint8Array(await file.arrayBuffer()));
      } catch (e) {
        if (e instanceof PdfError) throw new FileProcessingError(t.errors[e.code]);
        throw e;
      }
    },
    { concurrency: 2 },
  );

  const key = q.items.map((it) => it.id).join("|");
  const ready = q.items.length >= 2 && q.items.every((it) => it.status === "done");
  const hasErrors = q.items.some((it) => it.status === "error" || it.status === "cancelled");
  const totalPages = q.items.reduce((s, it) => s + (it.result?.pageCount ?? 0), 0);
  const current = merged && merged.key === key ? merged : null;

  async function merge() {
    setFailed(false);
    setProgress(0);
    try {
      const bytes = await mergePdfs(q.items.map((it) => it.result!.bytes), setProgress);
      setMerged({ key, blob: new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }), pages: totalPages });
    } catch {
      setFailed(true);
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.add}>
        <FileDropZone rules={rules} onFiles={q.add} existing={q.items.map((it) => it.file)} typesLabel={t.types} />
      </Panel>

      {q.items.length > 0 && (
        <Panel title={t.order}>
          <p className="-mt-2 text-sm text-muted">{t.orderHint}</p>
          <FileList
            items={q.items}
            onRemove={q.remove}
            onMove={q.move}
            onClear={() => { q.clear(); setMerged(null); }}
            actions={(it) => it.result && <span className="me-1 text-sm text-muted">{t.pages(it.result.pageCount)}</span>}
          />
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <Button size="lg" onClick={merge} disabled={!ready || progress !== null}>
              <Icon name={progress !== null ? "loader" : "combine"} size={18} className={progress !== null ? "animate-spin" : undefined} />
              {progress !== null ? `${t.merging} ${Math.round(progress * 100)}%` : t.merge}
            </Button>
            {ready && <span className="text-sm text-muted">{t.summary(t.pages(totalPages), formatBytes(q.items.reduce((s, it) => s + it.file.size, 0), locale))}</span>}
            {!ready && <span className="text-sm text-muted">{q.items.length < 2 ? t.needTwo : hasErrors ? t.fixErrors : t.waiting}</span>}
          </div>
        </Panel>
      )}

      {(current || failed || (merged && !current)) && (
        <Panel title={t.result}>
          {failed && <StatusMessage tone="error">{t.failed}</StatusMessage>}
          {merged && !current && !failed && <IdleHint>{t.stale}</IdleHint>}
          {current && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-accent-soft p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-md bg-surface text-accent-text"><Icon name="file-text" size={24} /></span>
                <div>
                  <p className="font-semibold">merged.pdf</p>
                  <p className="text-sm text-muted">{t.summary(t.pages(current.pages), formatBytes(current.blob.size, locale))}</p>
                </div>
              </div>
              <DownloadButton variant="primary" size="md" label={t.download} filename="merged.pdf" getBlob={() => current.blob} />
            </div>
          )}
          {current && <p className="text-sm text-muted">{m.files.privacy}</p>}
        </Panel>
      )}
    </div>
  );
}
