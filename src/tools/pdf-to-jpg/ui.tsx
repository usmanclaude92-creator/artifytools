"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DownloadAllButton, FileDropZone } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Field, Segmented, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { baseName, safeFileName } from "@/lib/files/names";
import { formatBytes } from "@/lib/files/size";
import { PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { parseRanges, type RangeError } from "@/lib/pdf/ranges";
import { openPdf, renderPage, type ImageFormat, type RenderedDoc } from "@/lib/pdf/render";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
type Which = "all" | "some";
type Dpi = "72" | "150" | "300";

const strings = {
  en: {
    choose: "Choose a PDF", types: "PDF", reading: "Reading your PDF…", another: "Choose another file",
    pages: (n: number) => `${n} page${n === 1 ? "" : "s"}`,
    settings: "Image settings", format: "Format", formats: { jpg: "JPG (smaller)", png: "PNG (sharpest)" } as Record<ImageFormat, string>,
    resolution: "Resolution", dpis: { "72": "Screen · 72 DPI", "150": "Standard · 150 DPI", "300": "Print · 300 DPI" } as Record<Dpi, string>,
    which: "Pages", whichOpts: { all: "All pages", some: "Choose pages" } as Record<Which, string>, ranges: "Page numbers", rangesHint: "For example 1-3, 5, 8-",
    willCreate: (n: number) => `This creates ${n} image${n === 1 ? "" : "s"}.`,
    convert: "Convert to images", converting: (d: number, n: number) => `Converting page ${d} of ${n}…`, cancel: "Stop",
    results: "Your images", page: (n: number) => `Page ${n}`,
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    range: (e: RangeError) =>
      e.code === "empty" ? "Enter at least one page or range." : e.code === "syntax" ? `“${e.token}” isn't a page or range. Use numbers like 3 or 2-5.` : e.code === "reversed" ? `“${e.token}” runs backwards. Write the smaller page first.` : `This PDF has ${e.pageCount} pages, so page ${e.page} doesn't exist.`,
    failed: (n: number) => `Page ${n} couldn't be converted. The file may be damaged.`, stale: "Settings changed. Convert again to update the images.", stopped: "Stopped. The pages converted so far are below.",
  },
  ar: {
    choose: "اختر ملف PDF", types: "PDF", reading: "جارٍ قراءة ملف PDF…", another: "اختيار ملف آخر",
    pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"),
    settings: "إعدادات الصور", format: "الصيغة", formats: { jpg: "JPG (حجم أصغر)", png: "PNG (أعلى وضوحًا)" } as Record<ImageFormat, string>,
    resolution: "الدقة", dpis: { "72": "للشاشة · 72 DPI", "150": "عادية · 150 DPI", "300": "للطباعة · 300 DPI" } as Record<Dpi, string>,
    which: "الصفحات", whichOpts: { all: "كل الصفحات", some: "اختيار صفحات" } as Record<Which, string>, ranges: "أرقام الصفحات", rangesHint: "مثل: ⁦1-3, 5, 8-⁩",
    willCreate: (n: number) => `سيُنشئ هذا ${arCount(n, "صورة واحدة", "صورتين", "صور", "صورة")}.`,
    convert: "تحويل إلى صور", converting: (d: number, n: number) => `جارٍ تحويل الصفحة ${d} من ${n}…`, cancel: "إيقاف",
    results: "صورك", page: (n: number) => `الصفحة ${n}`,
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    range: (e: RangeError) =>
      e.code === "empty" ? "أدخل صفحة أو نطاقًا واحدًا على الأقل." : e.code === "syntax" ? `«${e.token}» ليس صفحة أو نطاقًا. استخدم أرقامًا مثل 3 أو 2-5.` : e.code === "reversed" ? `النطاق «${e.token}» معكوس. اكتب الصفحة الأصغر أولًا.` : `يحتوي هذا الملف على ${arCount(e.pageCount, "صفحة واحدة", "صفحتين", "صفحات", "صفحة")}، لذا لا توجد الصفحة ${e.page}.`,
    failed: (n: number) => `تعذّر تحويل الصفحة ${n}، وقد يكون الملف تالفًا.`, stale: "تغيّرت الإعدادات. حوّل مجددًا لتحديث الصور.", stopped: "توقف التحويل. الصفحات التي حُوّلت معروضة أدناه.",
  },
};

interface Img {
  page: number;
  name: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

export default function PdfToJpg() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<RenderedDoc | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [format, setFormat] = useState<ImageFormat>("jpg");
  const [dpi, setDpi] = useState<Dpi>("150");
  const [which, setWhich] = useState<Which>("all");
  const [ranges, setRanges] = useState("");
  const [result, setResult] = useState<{ key: string; images: Img[] } | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const stopRef = useRef(false);
  const urls = useRef<string[]>([]);

  const clearImages = () => {
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = [];
    setResult(null);
  };
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);
  useEffect(() => () => void doc?.destroy(), [doc]);

  async function open(f: File) {
    clearImages();
    setFile(f);
    setDoc(null);
    setLoadError(null);
    setProblem(null);
    try {
      setDoc(await openPdf(new Uint8Array(await f.arrayBuffer())));
    } catch (e) {
      setLoadError(e instanceof PdfError ? t.errors[e.code] : t.errors.invalid);
    }
  }

  const pageCount = doc?.numPages ?? 0;
  const plan = useMemo((): { pages: number[] } | { error: string } | null => {
    if (!doc) return null;
    if (which === "all") return { pages: Array.from({ length: doc.numPages }, (_, i) => i + 1) };
    if (!ranges.trim()) return null;
    const r = parseRanges(ranges, doc.numPages);
    return r.ok ? { pages: [...new Set(r.groups.flat())] } : { error: t.range(r.error) };
  }, [doc, which, ranges, t]);
  const pages = plan && "pages" in plan ? plan.pages : null;
  const key = `${file?.name}|${file?.size}|${format}|${dpi}|${pages?.join(",")}`;
  const current = result && result.key === key ? result.images : null;
  const stem = file ? safeFileName(baseName(file.name), "document") : "document";
  const pad = String(pageCount).length;

  async function convert() {
    if (!doc || !pages) return;
    clearImages();
    setProblem(null);
    stopRef.current = false;
    const images: Img[] = [];
    setProgress({ done: 0, total: pages.length });
    for (const [i, p] of pages.entries()) {
      if (stopRef.current) {
        setProblem(t.stopped);
        break;
      }
      setProgress({ done: i + 1, total: pages.length });
      try {
        const r = await renderPage(doc, p, { dpi: Number(dpi), format, quality: 0.92 });
        const url = URL.createObjectURL(r.blob);
        urls.current.push(url);
        images.push({ page: p, name: `${stem}-page-${String(p).padStart(pad, "0")}.${format}`, blob: r.blob, url, width: r.width, height: r.height });
        setResult({ key, images: [...images] });
      } catch {
        setProblem(t.failed(p));
        break;
      }
    }
    setProgress(null);
  }

  if (!file) {
    return (
      <Panel title={t.choose}>
        <FileDropZone rules={rules} onFiles={(fs) => fs[0] && open(fs[0])} typesLabel={t.types} />
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.choose}>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-surface-2 text-muted"><Icon name="file-text" size={22} /></span>
          <div className="min-w-0 flex-1 basis-40">
            <p className="truncate font-medium" title={file.name}><bdi>{file.name}</bdi></p>
            <p className="text-sm text-muted">{formatBytes(file.size, locale)}{doc && ` · ${t.pages(doc.numPages)}`}{!doc && !loadError && ` · ${t.reading}`}</p>
          </div>
          <Button variant="secondary" size="sm" disabled={progress !== null} onClick={() => { clearImages(); setFile(null); setDoc(null); setLoadError(null); setProblem(null); }}>
            <Icon name="rotate-ccw" size={16} /> {t.another}
          </Button>
        </div>
        {loadError && <StatusMessage tone="error">{loadError}</StatusMessage>}
      </Panel>

      {doc && (
        <Panel title={t.settings}>
          <Segmented legend={t.format} value={format} onChange={setFormat} options={(["jpg", "png"] as ImageFormat[]).map((v) => ({ value: v, label: t.formats[v] }))} />
          <Segmented legend={t.resolution} value={dpi} onChange={setDpi} options={(["72", "150", "300"] as Dpi[]).map((v) => ({ value: v, label: t.dpis[v] }))} />
          <Segmented legend={t.which} value={which} onChange={setWhich} options={(["all", "some"] as Which[]).map((v) => ({ value: v, label: t.whichOpts[v] }))} />
          {which === "some" && (
            <Field label={t.ranges} hint={t.rangesHint} error={plan && "error" in plan ? plan.error : null}>
              {(p) => <TextInput {...p} dir="ltr" value={ranges} onChange={(e) => setRanges(e.target.value)} placeholder={`1-3, 5, 8-${pageCount}`} autoComplete="off" className="max-w-md" />}
            </Field>
          )}
          {pages && <p className="text-sm text-muted">{t.willCreate(pages.length)}</p>}
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <Button size="lg" onClick={convert} disabled={!pages || progress !== null}>
              <Icon name={progress ? "loader" : "image"} size={18} className={progress ? "animate-spin" : undefined} />
              {progress ? t.converting(progress.done, progress.total) : t.convert}
            </Button>
            {progress && <Button variant="ghost" onClick={() => (stopRef.current = true)}>{t.cancel}</Button>}
          </div>
        </Panel>
      )}

      {(result || problem) && (
        <Panel title={t.results} actions={current && current.length > 1 && !progress ? <DownloadAllButton files={current} zipName={`${stem}-images.zip`} /> : undefined}>
          {problem && <StatusMessage tone={problem === t.stopped ? "info" : "error"}>{problem}</StatusMessage>}
          {result && !current && !progress && <p className="text-sm text-muted">{t.stale}</p>}
          {current && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {current.map((img) => (
                <li key={img.name} className="flex flex-col overflow-hidden rounded-lg border border-line">
                  <div className="grid aspect-[3/4] place-items-center bg-surface-2 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
                    <img src={img.url} alt={t.page(img.page)} className="max-h-full max-w-full object-contain shadow-sm" />
                  </div>
                  <div className="flex flex-col gap-2 p-3">
                    <div>
                      <p className="font-medium">{t.page(img.page)}</p>
                      <p className="text-xs text-muted"><span dir="ltr">{img.width}×{img.height}</span> · {formatBytes(img.blob.size, locale)}</p>
                    </div>
                    <DownloadButton filename={img.name} getBlob={() => img.blob} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
}
