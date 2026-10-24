"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FileDropZone } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton, DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Checkbox, Field, Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { localizeHref } from "@/lib/i18n";
import { baseName, safeFileName } from "@/lib/files/names";
import { formatBytes } from "@/lib/files/size";
import { PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { openPdf } from "@/lib/pdf/render";
import { createLocalTranslator, LOCAL_PAIRS, pairFor, type LocalLanguage, type LocalPair, type LocalTranslator, type Stage } from "@/lib/translate/local";
import { detectSource, translateParagraphs } from "@/lib/translate/text";
import { readDocument, translatedDocx, type DocBlock } from "@/lib/translate/document";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);

/** Translation runs on the device, so the limit keeps one run to a sensible time (about 12 pages). */
const MAX_DOCUMENT_CHARS = 30_000;
const mb = (bytes: number) => Math.round(bytes / 1_000_000);

const strings = {
  en: {
    privacy: (size: number) => `Your document is translated on this device and never uploaded. The first time, your browser downloads the translation model (about ${size} MB for each direction) and keeps it for next time.`,
    choose: "Choose a PDF", types: "PDF", another: "Choose another file", reading: (d: number, n: number) => `Reading page ${d} of ${n}…`,
    summary: (pages: number, chars: number) => `${pages} page${pages === 1 ? "" : "s"} · ${chars.toLocaleString("en-US")} characters of text`,
    noText: "This PDF has no selectable text (it looks scanned). Extract the text with Image to Text (OCR) first, then translate it.", ocrLink: "Open Image to Text (OCR)",
    tooLong: (max: number) => `This document is too long to translate here (limit about ${max.toLocaleString("en-US")} characters, roughly 12 pages). Split it into smaller parts first.`,
    options: "Translation", target: "Translate", pairs: { "ar-en": "Arabic to English", "en-ar": "English to Arabic" } as Record<LocalPair, string>, breaks: "Start each PDF page on a new page in Word",
    translate: "Translate", translating: (d: number, n: number) => `Translating sentence ${d} of ${n}…`, stop: "Stop",
    download: (l: number, t: number) => `Downloading the translation model… ${l} of ${t} MB (first time only)`, starting: "Starting the translation model…",
    wrong: "This document doesn't look like the language you chose to translate from. The result may be poor.",
    result: "Translated document", preview: "Start of the translation", word: "Download Word", copy: "Copy text",
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    failed: "Translation failed. Check your connection for the first download, then try again.", unsupported: "This browser can't run the translation model. Try a recent version of Chrome, Edge, Firefox or Safari.", stale: "Settings changed. Translate again to update the result.",
    machine: "Machine translation can contain mistakes. Have important documents checked by a qualified translator.",
  },
  ar: {
    privacy: (size: number) => `يُترجم مستندك على جهازك ولا يُرفع إلى أي مكان. في المرة الأولى يحمّل متصفحك نموذج الترجمة (نحو ${size} ميغابايت لكل اتجاه) ويحتفظ به للمرات القادمة.`,
    choose: "اختر ملف PDF", types: "PDF", another: "اختيار ملف آخر", reading: (d: number, n: number) => `جارٍ قراءة الصفحة ${d} من ${n}…`,
    summary: (pages: number, chars: number) => `${arCount(pages, "صفحة واحدة", "صفحتان", "صفحات", "صفحة")} · ${chars.toLocaleString("en-US")} حرف من النص`,
    noText: "لا يحتوي ملف PDF هذا على نص قابل للتحديد (يبدو ممسوحًا ضوئيًا). استخرج النص أولًا بأداة تحويل الصورة إلى نص، ثم ترجمه.", ocrLink: "فتح أداة تحويل الصورة إلى نص",
    tooLong: (max: number) => `هذا المستند أطول من الحد المسموح للترجمة هنا (نحو ${max.toLocaleString("en-US")} حرف، أي قرابة 12 صفحة). قسّمه إلى أجزاء أصغر أولًا.`,
    options: "الترجمة", target: "الترجمة", pairs: { "ar-en": "من العربية إلى الإنجليزية", "en-ar": "من الإنجليزية إلى العربية" } as Record<LocalPair, string>, breaks: "بدء كل صفحة من ملف PDF في صفحة جديدة في Word",
    translate: "ترجمة", translating: (d: number, n: number) => `جارٍ ترجمة الجملة ${d} من ${n}…`, stop: "إيقاف",
    download: (l: number, t: number) => `جارٍ تحميل نموذج الترجمة… ${l} من ${t} ميغابايت (أول مرة فقط)`, starting: "جارٍ تشغيل نموذج الترجمة…",
    wrong: "لا يبدو أن هذا المستند مكتوب باللغة التي اخترت الترجمة منها، وقد تكون النتيجة ضعيفة.",
    result: "المستند المترجم", preview: "بداية الترجمة", word: "تنزيل Word", copy: "نسخ النص",
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    failed: "فشلت الترجمة. تحقق من اتصالك أثناء التحميل الأول ثم حاول مجددًا.", unsupported: "لا يستطيع هذا المتصفح تشغيل نموذج الترجمة. جرّب إصدارًا حديثًا من Chrome أو Edge أو Firefox أو Safari.", stale: "تغيّرت الإعدادات. ترجم مجددًا لتحديث النتيجة.",
    machine: "قد تحتوي الترجمة الآلية على أخطاء. اطلب مراجعة المستندات المهمة من مترجم معتمد.",
  },
};

type Progress = { kind: "stage"; stage: Stage } | { kind: "sentences"; done: number; total: number };

export default function TranslatePdf() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [blocks, setBlocks] = useState<DocBlock[] | null>(null);
  const [pages, setPages] = useState(0);
  const [reading, setReading] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fallback: LocalLanguage = locale === "ar" ? "ar" : "en";
  const [pair, setPair] = useState<LocalPair>(pairFor(fallback));
  // The direction follows the document until the person picks one themselves.
  const [picked, setPicked] = useState(false);
  const [pageBreaks, setPageBreaks] = useState(true);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ key: string; texts: string[] } | null>(null);
  const stop = useRef(false);
  const engines = useRef(new Map<LocalPair, Promise<LocalTranslator>>());

  useEffect(() => () => { stop.current = true; }, []);

  async function open(f: File) {
    stop.current = true;
    setFile(f);
    setBlocks(null);
    setResult(null);
    setLoadError(null);
    setError(null);
    try {
      const doc = await openPdf(new Uint8Array(await f.arrayBuffer()));
      setPages(doc.numPages);
      setReading(t.reading(0, doc.numPages));
      const read = await readDocument(doc, (d, n) => setReading(t.reading(d, n)));
      setBlocks(read);
      if (!picked) setPair(pairFor(detectSource(read.slice(0, 40).map((b) => b.text).join(" "), fallback)));
      void doc.destroy();
    } catch (e) {
      setLoadError(e instanceof PdfError ? t.errors[e.code] : t.errors.invalid);
    } finally {
      setReading(null);
    }
  }

  const chars = blocks?.reduce((n, b) => n + b.text.length, 0) ?? 0;
  const key = `${file?.name}|${file?.size}|${pair}`;
  const current = result && result.key === key ? result : null;
  const target = LOCAL_PAIRS[pair].target;
  const rtl = target === "ar";
  const sample = blocks?.slice(0, 40).map((b) => b.text).join(" ") ?? "";
  const wrongLanguage = sample !== "" && detectSource(sample, LOCAL_PAIRS[pair].source) !== LOCAL_PAIRS[pair].source;
  const stem = file ? safeFileName(baseName(file.name), "document") : "document";

  function engine(p: LocalPair) {
    let e = engines.current.get(p);
    if (!e) {
      e = createLocalTranslator(p, (stage) => setProgress({ kind: "stage", stage }));
      // A failed start must not be cached, or "try again" would fail forever.
      e.catch(() => engines.current.delete(p));
      engines.current.set(p, e);
    }
    return e;
  }

  async function translate() {
    if (!blocks?.length) return;
    stop.current = false;
    setError(null);
    const used = pair;
    try {
      setProgress({ kind: "stage", stage: { kind: "starting" } });
      const run = await engine(used);
      const texts = await translateParagraphs(run, blocks.map((b) => b.text), (done, total) => setProgress({ kind: "sentences", done, total }), () => stop.current);
      if (!texts) return;
      setResult({ key: `${file?.name}|${file?.size}|${used}`, texts });
    } catch (e) {
      setError(typeof WebAssembly === "undefined" || (e instanceof Error && /webassembly|wasm/i.test(e.message)) ? t.unsupported : t.failed);
    } finally {
      setProgress(null);
    }
  }

  const status =
    progress?.kind === "sentences"
      ? t.translating(progress.done, progress.total)
      : progress?.stage.kind === "download"
        ? t.download(mb(progress.stage.loaded), mb(progress.stage.total))
        : progress
          ? t.starting
          : null;
  const download = progress?.kind === "stage" && progress.stage.kind === "download" ? progress.stage : null;
  const plain = current ? current.texts.join("\n\n") : "";
  return (
    <div className="flex flex-col gap-5">
      <StatusMessage tone="info">{t.privacy(mb(LOCAL_PAIRS[pair].bytes))}</StatusMessage>

      <Panel title={t.choose}>
        {!file ? (
          <FileDropZone rules={rules} onFiles={(fs) => fs[0] && open(fs[0])} typesLabel={t.types} />
        ) : (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-md bg-surface-2 text-muted"><Icon name="file-text" size={22} /></span>
            <div className="min-w-0 flex-1 basis-40">
              <p className="truncate font-medium" title={file.name}><bdi>{file.name}</bdi></p>
              <p className="text-sm text-muted">{formatBytes(file.size, locale)}{blocks ? ` · ${t.summary(pages, chars)}` : reading ? ` · ${reading}` : ""}</p>
            </div>
            <Button variant="secondary" size="sm" disabled={progress !== null} onClick={() => { setFile(null); setBlocks(null); setResult(null); setLoadError(null); setError(null); }}>
              <Icon name="rotate-ccw" size={16} /> {t.another}
            </Button>
          </div>
        )}
        {loadError && <StatusMessage tone="error">{loadError}</StatusMessage>}
        {blocks && blocks.length === 0 && (
          <StatusMessage tone="warning">
            {t.noText}{" "}
            <Link href={localizeHref("/tools/image-to-text", locale)} className="font-semibold underline">{t.ocrLink}</Link>
          </StatusMessage>
        )}
        {blocks && chars > MAX_DOCUMENT_CHARS && <StatusMessage tone="error">{t.tooLong(MAX_DOCUMENT_CHARS)}</StatusMessage>}
      </Panel>

      {blocks && blocks.length > 0 && chars <= MAX_DOCUMENT_CHARS && (
        <Panel title={t.options}>
          <Field label={t.target}>
            {(p) => (
              <Select {...p} value={pair} onChange={(e) => { setPair(e.target.value as LocalPair); setPicked(true); }} className="max-w-xs" disabled={progress !== null}>
                {(Object.keys(LOCAL_PAIRS) as LocalPair[]).map((k) => <option key={k} value={k}>{t.pairs[k]}</option>)}
              </Select>
            )}
          </Field>
          {wrongLanguage && <StatusMessage tone="warning">{t.wrong}</StatusMessage>}
          <Checkbox label={t.breaks} checked={pageBreaks} onChange={(e) => setPageBreaks(e.target.checked)} />
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <Button size="lg" onClick={translate} disabled={progress !== null}>
              <Icon name={progress ? "loader" : "globe"} size={18} className={progress ? "animate-spin" : undefined} /> {t.translate}
            </Button>
            {progress && <Button variant="ghost" size="sm" onClick={() => { stop.current = true; }}>{t.stop}</Button>}
          </div>
          {status && (
            <div role="status" className="flex flex-col gap-2 text-sm text-muted">
              <span>{status}</span>
              {download && (
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.min(100, Math.round((download.loaded / download.total) * 100))}%` }} />
                </div>
              )}
            </div>
          )}
          {error && <StatusMessage tone="error">{error}</StatusMessage>}
        </Panel>
      )}

      {result && blocks && (
        <Panel title={t.result}>
          {!current ? (
            <p className="text-sm text-muted">{t.stale}</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <DownloadButton filename={`${stem}-${target}.docx`} getBlob={() => translatedDocx(blocks, current.texts, target, pageBreaks)} label={t.word} variant="primary" size="md" />
                <CopyButton value={plain} label={t.copy} size="md" />
              </div>
              <p className="text-sm font-medium">{t.preview}</p>
              <div dir={rtl ? "rtl" : "ltr"} lang={target} className="max-h-80 overflow-auto rounded-lg border border-line bg-surface p-4 text-[0.95rem]">
                {blocks.slice(0, 10).map((b, i) =>
                  b.kind === "heading" ? (
                    <h3 key={i} className="mb-2 text-lg font-semibold" style={{ textAlign: b.center ? "center" : undefined }}>{current.texts[i]}</h3>
                  ) : (
                    <p key={i} className="mb-3 text-muted" style={{ textAlign: b.center ? "center" : undefined }}>{current.texts[i]}</p>
                  ),
                )}
              </div>
              <p className="text-sm text-muted">{t.machine}</p>
            </>
          )}
        </Panel>
      )}
    </div>
  );
}
