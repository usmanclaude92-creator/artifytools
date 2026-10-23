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
import { TRANSLATE_LANGUAGES, type TranslateLanguage } from "@/lib/ai/types";
import { PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { openPdf } from "@/lib/pdf/render";
import { makeChunks, MAX_DOCUMENT_CHARS, reassemble, RTL_LANGUAGES } from "@/lib/translate/chunks";
import { readDocument, translatedDocx, type DocBlock } from "@/lib/translate/document";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);

const NAMES: Record<"en" | "ar", Record<TranslateLanguage, string>> = {
  en: { ar: "Arabic", en: "English", fr: "French", es: "Spanish", de: "German", tr: "Turkish", ur: "Urdu", hi: "Hindi", fa: "Persian", zh: "Chinese (Simplified)", ru: "Russian", pt: "Portuguese", it: "Italian", id: "Indonesian", bn: "Bengali" },
  ar: { ar: "العربية", en: "الإنجليزية", fr: "الفرنسية", es: "الإسبانية", de: "الألمانية", tr: "التركية", ur: "الأردية", hi: "الهندية", fa: "الفارسية", zh: "الصينية (المبسطة)", ru: "الروسية", pt: "البرتغالية", it: "الإيطالية", id: "الإندونيسية", bn: "البنغالية" },
};

const strings = {
  en: {
    notConfigured: "Translation isn't switched on yet on this site. Please check back soon.",
    privacy: "When you press Translate, the document's text (not the file) is sent to Artify's server and on to a third-party AI provider (Anthropic) to be translated. It isn't stored. Don't translate confidential documents you aren't allowed to share.",
    choose: "Choose a PDF", types: "PDF", another: "Choose another file", reading: (d: number, n: number) => `Reading page ${d} of ${n}…`,
    summary: (pages: number, chars: number) => `${pages} page${pages === 1 ? "" : "s"} · ${chars.toLocaleString("en-US")} characters of text`,
    noText: "This PDF has no selectable text (it looks scanned). Extract the text with Image to Text (OCR) first, then translate it.", ocrLink: "Open Image to Text (OCR)",
    tooLong: (max: number) => `This document is too long to translate here (limit about ${max.toLocaleString("en-US")} characters, roughly 25 pages). Split it into smaller parts first.`,
    options: "Translation", target: "Translate into", breaks: "Start each PDF page on a new page in Word",
    translate: "Translate", translating: (d: number, n: number) => `Translating part ${d} of ${n}…`, stop: "Stop",
    result: "Translated document", preview: "Start of the translation", word: "Download Word", copy: "Copy text",
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    failed: "Translation failed. Please try again in a moment.", stale: "Settings changed. Translate again to update the result.",
    machine: "Machine translation can contain mistakes. Have important documents checked by a qualified translator.",
  },
  ar: {
    notConfigured: "الترجمة غير مفعّلة بعد على هذا الموقع. يرجى العودة قريبًا.",
    privacy: "عند الضغط على «ترجمة» يُرسل نص المستند (وليس الملف) إلى خادم Artify ثم إلى مزوّد ذكاء اصطناعي خارجي (Anthropic) لترجمته، ولا يُخزَّن. لا تترجم مستندات سرية غير مسموح لك بمشاركتها.",
    choose: "اختر ملف PDF", types: "PDF", another: "اختيار ملف آخر", reading: (d: number, n: number) => `جارٍ قراءة الصفحة ${d} من ${n}…`,
    summary: (pages: number, chars: number) => `${arCount(pages, "صفحة واحدة", "صفحتان", "صفحات", "صفحة")} · ${chars.toLocaleString("en-US")} حرف من النص`,
    noText: "لا يحتوي ملف PDF هذا على نص قابل للتحديد (يبدو ممسوحًا ضوئيًا). استخرج النص أولًا بأداة تحويل الصورة إلى نص، ثم ترجمه.", ocrLink: "فتح أداة تحويل الصورة إلى نص",
    tooLong: (max: number) => `هذا المستند أطول من الحد المسموح للترجمة هنا (نحو ${max.toLocaleString("en-US")} حرف، أي قرابة 25 صفحة). قسّمه إلى أجزاء أصغر أولًا.`,
    options: "الترجمة", target: "الترجمة إلى", breaks: "بدء كل صفحة من ملف PDF في صفحة جديدة في Word",
    translate: "ترجمة", translating: (d: number, n: number) => `جارٍ ترجمة الجزء ${d} من ${n}…`, stop: "إيقاف",
    result: "المستند المترجم", preview: "بداية الترجمة", word: "تنزيل Word", copy: "نسخ النص",
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    failed: "فشلت الترجمة. يرجى المحاولة بعد قليل.", stale: "تغيّرت الإعدادات. ترجم مجددًا لتحديث النتيجة.",
    machine: "قد تحتوي الترجمة الآلية على أخطاء. اطلب مراجعة المستندات المهمة من مترجم معتمد.",
  },
};

export default function TranslatePdf() {
  const locale = useLocale();
  const t = strings[locale];
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [blocks, setBlocks] = useState<DocBlock[] | null>(null);
  const [pages, setPages] = useState(0);
  const [reading, setReading] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [target, setTarget] = useState<TranslateLanguage>(locale === "ar" ? "en" : "ar");
  const [pageBreaks, setPageBreaks] = useState(true);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ key: string; texts: string[] } | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/status", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ configured?: boolean }>)
      .then((d) => !cancelled && setConfigured(Boolean(d.configured)))
      .catch(() => !cancelled && setConfigured(false));
    return () => {
      cancelled = true;
      abort.current?.abort();
    };
  }, []);

  async function open(f: File) {
    abort.current?.abort();
    setFile(f);
    setBlocks(null);
    setResult(null);
    setLoadError(null);
    setError(null);
    try {
      const doc = await openPdf(new Uint8Array(await f.arrayBuffer()));
      setPages(doc.numPages);
      setReading(t.reading(0, doc.numPages));
      setBlocks(await readDocument(doc, (d, n) => setReading(t.reading(d, n))));
      void doc.destroy();
    } catch (e) {
      setLoadError(e instanceof PdfError ? t.errors[e.code] : t.errors.invalid);
    } finally {
      setReading(null);
    }
  }

  const chars = blocks?.reduce((n, b) => n + b.text.length, 0) ?? 0;
  const key = `${file?.name}|${file?.size}|${target}`;
  const current = result && result.key === key ? result : null;
  const rtl = RTL_LANGUAGES.has(target);
  const stem = file ? safeFileName(baseName(file.name), "document") : "document";

  async function translate() {
    if (!blocks?.length) return;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setError(null);
    const chunks = makeChunks(blocks.map((b) => b.text));
    const translated: string[][] = [];
    try {
      for (const [i, chunk] of chunks.entries()) {
        setProgress({ done: i + 1, total: chunks.length });
        const res = await fetch("/api/ai/translate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ segments: chunk.map((p) => p.text), target }),
          signal: controller.signal,
        });
        const data = (await res.json().catch(() => ({}))) as { segments?: string[]; message?: string };
        if (!res.ok || !data.segments) throw new Error(locale === "en" && data.message ? data.message : t.failed);
        translated.push(data.segments);
      }
      setResult({ key, texts: reassemble(blocks.length, chunks, translated) });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message || t.failed);
    } finally {
      if (abort.current === controller) setProgress(null);
    }
  }

  const plain = current ? current.texts.join("\n\n") : "";
  return (
    <div className="flex flex-col gap-5">
      {configured === false && <StatusMessage tone="warning">{t.notConfigured}</StatusMessage>}
      <StatusMessage tone="info">{t.privacy}</StatusMessage>

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
              <Select {...p} value={target} onChange={(e) => setTarget(e.target.value as TranslateLanguage)} className="max-w-xs" disabled={progress !== null}>
                {TRANSLATE_LANGUAGES.map((l) => <option key={l} value={l}>{NAMES[locale][l]}</option>)}
              </Select>
            )}
          </Field>
          <Checkbox label={t.breaks} checked={pageBreaks} onChange={(e) => setPageBreaks(e.target.checked)} />
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <Button size="lg" onClick={translate} disabled={!configured || progress !== null}>
              <Icon name={progress ? "loader" : "globe"} size={18} className={progress ? "animate-spin" : undefined} /> {t.translate}
            </Button>
            {progress && (
              <>
                <span role="status" className="text-sm text-muted">{t.translating(progress.done, progress.total)}</span>
                <Button variant="ghost" size="sm" onClick={() => { abort.current?.abort(); setProgress(null); }}>{t.stop}</Button>
              </>
            )}
          </div>
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
