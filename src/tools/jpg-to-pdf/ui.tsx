"use client";

import { useState } from "react";
import { FileDropZone, FileList, FileProcessingError, useFileQueue } from "@/components/files";
import { IdleHint, Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Field, Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { baseName, safeFileName } from "@/lib/files/names";
import { formatBytes } from "@/lib/files/size";
import { buildImagePdf, type LayoutOptions, type Margin, type Orientation, type PageSize, type PreparedImage } from "@/lib/pdf/images";
import { ImageDecodeError, prepareImage } from "@/lib/pdf/prepare-image";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);

const strings = {
  en: {
    add: "Add images", types: "JPG, PNG, WebP, GIF or HEIC", order: "Pages", orderHint: "Each image becomes one page, top to bottom. Use the arrows to reorder.",
    settings: "Page settings", pageSize: "Page size", sizes: { a4: "A4", letter: "Letter", fit: "Same as image" } as Record<PageSize, string>,
    orientation: "Orientation", orientations: { auto: "Automatic", portrait: "Portrait", landscape: "Landscape" } as Record<Orientation, string>,
    margin: "Margin", margins: { none: "No margin", small: "Small (10 mm)", large: "Large (20 mm)" } as Record<Margin, string>,
    pages: (n: number) => `${n} page${n === 1 ? "" : "s"}`, px: (w: number, h: number) => `${w} × ${h} px`,
    convert: "Convert to PDF", converting: "Converting…", waiting: "Preparing your images…", needOne: "Add at least one image.", fixErrors: "Remove the images that couldn't be read, then convert.",
    result: "Your PDF", download: "Download PDF", stale: "Images or settings changed. Convert again to update the PDF.", failed: "The PDF couldn't be created. Try removing very large images.",
    errors: { heic: "This browser can't read HEIC photos. Open this page in Safari, or convert the photo to JPG first.", decode: "This image couldn't be read. It may be damaged or in an unsupported format.", tooLarge: "This image is too large (over 16,000 pixels on a side)." },
  },
  ar: {
    add: "أضف الصور", types: "JPG أو PNG أو WebP أو GIF أو HEIC", order: "الصفحات", orderHint: "كل صورة تصبح صفحة، من الأعلى إلى الأسفل. استخدم الأسهم لتغيير الترتيب.",
    settings: "إعدادات الصفحة", pageSize: "حجم الصفحة", sizes: { a4: "A4", letter: "Letter", fit: "مثل الصورة" } as Record<PageSize, string>,
    orientation: "الاتجاه", orientations: { auto: "تلقائي", portrait: "عمودي", landscape: "أفقي" } as Record<Orientation, string>,
    margin: "الهامش", margins: { none: "بلا هامش", small: "صغير (10 مم)", large: "كبير (20 مم)" } as Record<Margin, string>,
    pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"), px: (w: number, h: number) => `${w} × ${h} بكسل`,
    convert: "تحويل إلى PDF", converting: "جارٍ التحويل…", waiting: "جارٍ تجهيز صورك…", needOne: "أضف صورة واحدة على الأقل.", fixErrors: "أزل الصور التي تعذّرت قراءتها، ثم حوّل.",
    result: "ملف PDF", download: "تنزيل ملف PDF", stale: "تغيّرت الصور أو الإعدادات. حوّل مجددًا لتحديث الملف.", failed: "تعذّر إنشاء ملف PDF. جرّب إزالة الصور الكبيرة جدًا.",
    errors: { heic: "هذا المتصفح لا يقرأ صور HEIC. افتح هذه الصفحة في Safari، أو حوّل الصورة إلى JPG أولًا.", decode: "تعذّرت قراءة هذه الصورة، وقد تكون تالفة أو بصيغة غير مدعومة.", tooLarge: "هذه الصورة كبيرة جدًا (أكثر من 16,000 بكسل في أحد أبعادها)." },
  },
};

interface Result {
  key: string;
  blob: Blob;
  name: string;
  pages: number;
}

export default function JpgToPdf() {
  const locale = useLocale();
  const t = strings[locale];
  const m = useMessages();
  const [opts, setOpts] = useState<LayoutOptions>({ pageSize: "a4", orientation: "auto", margin: "small" });
  const [result, setResult] = useState<Result | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  const q = useFileQueue<PreparedImage>(
    async (file) => {
      try {
        return await prepareImage(file);
      } catch (e) {
        if (e instanceof ImageDecodeError && e.message === "too-large") throw new FileProcessingError(t.errors.tooLarge);
        if (/\.hei[cf]$/i.test(file.name) || /hei[cf]/i.test(file.type)) throw new FileProcessingError(t.errors.heic);
        throw new FileProcessingError(t.errors.decode);
      }
    },
    { concurrency: 2 },
  );

  const key = `${q.items.map((it) => it.id).join("|")}|${opts.pageSize}|${opts.orientation}|${opts.margin}`;
  const ready = q.items.length >= 1 && q.items.every((it) => it.status === "done");
  const hasErrors = q.items.some((it) => it.status === "error" || it.status === "cancelled");
  const current = result && result.key === key ? result : null;

  async function convert() {
    setFailed(false);
    setProgress(0);
    try {
      const bytes = await buildImagePdf(q.items.map((it) => it.result!), opts, setProgress);
      const name = q.items.length === 1 ? `${safeFileName(baseName(q.items[0]!.file.name), "image")}.pdf` : "images.pdf";
      setResult({ key, blob: new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }), name, pages: q.items.length });
    } catch {
      setFailed(true);
    } finally {
      setProgress(null);
    }
  }

  const set = <K extends keyof LayoutOptions>(k: K, v: LayoutOptions[K]) => setOpts((o) => ({ ...o, [k]: v }));

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.add}>
        <FileDropZone rules={rules} onFiles={q.add} existing={q.items.map((it) => it.file)} typesLabel={t.types} />
      </Panel>

      {q.items.length > 0 && (
        <>
          <Panel title={t.order}>
            <p className="-mt-2 text-sm text-muted">{t.orderHint}</p>
            <FileList
              items={q.items}
              onRemove={q.remove}
              onMove={q.move}
              onClear={() => { q.clear(); setResult(null); }}
              actions={(it) => it.result && <span className="me-1 hidden text-sm text-muted sm:inline">{t.px(it.result.width, it.result.height)}</span>}
            />
          </Panel>

          <Panel title={t.settings}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t.pageSize}>
                {(p) => (
                  <Select {...p} value={opts.pageSize} onChange={(e) => set("pageSize", e.target.value as PageSize)}>
                    {(["a4", "letter", "fit"] as PageSize[]).map((v) => <option key={v} value={v}>{t.sizes[v]}</option>)}
                  </Select>
                )}
              </Field>
              <Field label={t.orientation}>
                {(p) => (
                  <Select {...p} value={opts.orientation} disabled={opts.pageSize === "fit"} onChange={(e) => set("orientation", e.target.value as Orientation)}>
                    {(["auto", "portrait", "landscape"] as Orientation[]).map((v) => <option key={v} value={v}>{t.orientations[v]}</option>)}
                  </Select>
                )}
              </Field>
              <Field label={t.margin}>
                {(p) => (
                  <Select {...p} value={opts.margin} onChange={(e) => set("margin", e.target.value as Margin)}>
                    {(["none", "small", "large"] as Margin[]).map((v) => <option key={v} value={v}>{t.margins[v]}</option>)}
                  </Select>
                )}
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <Button size="lg" onClick={convert} disabled={!ready || progress !== null}>
                <Icon name={progress !== null ? "loader" : "file-text"} size={18} className={progress !== null ? "animate-spin" : undefined} />
                {progress !== null ? `${t.converting} ${Math.round(progress * 100)}%` : t.convert}
              </Button>
              <span className="text-sm text-muted">{ready ? t.pages(q.items.length) : hasErrors ? t.fixErrors : q.items.length ? t.waiting : t.needOne}</span>
            </div>
          </Panel>
        </>
      )}

      {(current || failed || (result && !current)) && (
        <Panel title={t.result}>
          {failed && <StatusMessage tone="error">{t.failed}</StatusMessage>}
          {result && !current && !failed && <IdleHint>{t.stale}</IdleHint>}
          {current && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-accent-soft p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-md bg-surface text-accent-text"><Icon name="file-text" size={24} /></span>
                <div className="min-w-0">
                  <p className="truncate font-semibold"><bdi>{current.name}</bdi></p>
                  <p className="text-sm text-muted">{t.pages(current.pages)} · {formatBytes(current.blob.size, locale)}</p>
                </div>
              </div>
              <DownloadButton variant="primary" size="md" label={t.download} filename={current.name} getBlob={() => current.blob} />
            </div>
          )}
          {current && <p className="text-sm text-muted">{m.files.privacy}</p>}
        </Panel>
      )}
    </div>
  );
}
