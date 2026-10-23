"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { formatBytes } from "@/lib/files/size";
import type { FileRules } from "@/lib/files/rules";
import { FileDropZone } from "./file-drop-zone";

const labels = {
  en: { another: "Choose another file" },
  ar: { another: "اختيار ملف آخر" },
};

/** One chosen file: a drop zone until a file is picked, then its name, size, a status line and "choose another". */
export function SingleFile({ file, rules, typesLabel, status, busy, onFile, onClear }: { file: File | null; rules: FileRules; typesLabel: string; status?: string | null; busy?: boolean; onFile: (f: File) => void; onClear: () => void }) {
  const locale = useLocale();
  if (!file) return <FileDropZone rules={rules} onFiles={(fs) => fs[0] && onFile(fs[0])} typesLabel={typesLabel} />;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
      <span className="grid size-12 shrink-0 place-items-center rounded-md bg-surface-2 text-muted"><Icon name="file-text" size={22} /></span>
      <div className="min-w-0 flex-1 basis-40">
        <p className="truncate font-medium" title={file.name}><bdi>{file.name}</bdi></p>
        <p className="text-sm text-muted">{formatBytes(file.size, locale)}{status ? ` · ${status}` : ""}</p>
      </div>
      <Button variant="secondary" size="sm" disabled={busy} onClick={onClear}>
        <Icon name="rotate-ccw" size={16} /> {labels[locale].another}
      </Button>
    </div>
  );
}

/** Renders page `page` of a PDF (bytes) as an image, for checking a result before downloading. */
export function PdfPagePreview({ bytes, page = 1, alt, className }: { bytes: Uint8Array; page?: number; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    let made: string | null = null;
    (async () => {
      const { openPdf, renderPage } = await import("@/lib/pdf/render");
      const doc = await openPdf(bytes);
      const r = await renderPage(doc, Math.min(page, doc.numPages), { dpi: 72, format: "jpg", quality: 0.85 });
      void doc.destroy();
      if (cancelled) return;
      made = URL.createObjectURL(r.blob);
      setUrl(made);
    })().catch(() => {});
    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [bytes, page]);
  return (
    <div className={`grid place-items-center rounded-lg bg-surface-2 p-3 ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
      {url ? <img src={url} alt={alt} className="max-h-80 w-auto shadow-md" /> : <Icon name="loader" size={22} className="animate-spin text-muted" />}
    </div>
  );
}
