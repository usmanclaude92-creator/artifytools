"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileDropZone } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton, DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Field, Segmented, Select, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { baseName, safeFileName } from "@/lib/files/names";
import { formatBytes } from "@/lib/files/size";
import { PdfError } from "@/lib/pdf/pdf";
import { openPdf } from "@/lib/pdf/render";
import { detectLanguage } from "@/lib/translate/detect";
import { readDocument, translatedDocx } from "@/lib/translate/document";
import { isRtl, langInfo, routeBytes, routeFor, sourceLanguages, targetLanguages, type Lang } from "@/lib/translate/languages";
import { joinLines, MAX_TEXT_CHARS, splitLines } from "@/lib/translate/lines";
import { createRoute, type LocalTranslator, type Stage } from "@/lib/translate/local";
import { ReadError, readFile, type ReadResult } from "@/lib/translate/read";
import { translateParagraphs } from "@/lib/translate/text";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
const MAX_DOCUMENT_CHARS = 30_000;
const mb = (bytes: number) => Math.round(bytes / 1_000_000);

type Mode = "text" | "file";
type Progress = { kind: "stage"; stage: Stage } | { kind: "sentences"; done: number; total: number };

const strings = {
  en: {
    privacy: "Your text and documents are translated on this device and never uploaded. The first time you use a language pair, your browser downloads its translation model and keeps it for next time.",
    mode: "What do you want to translate?", text: "Paste text", file: "Upload a document",
    input: "Text to translate", placeholder: "Type or paste text…", clear: "Clear",
    count: (n: number, max: number) => `${n.toLocaleString("en-US")} / ${max.toLocaleString("en-US")} characters`,
    tooLongText: (n: number, max: number) => `Text is ${n.toLocaleString("en-US")} characters; the limit is ${max.toLocaleString("en-US")}.`,
    choose: "Choose a document", types: "PDF, Word, PowerPoint, Excel, OpenDocument, RTF, HTML, CSV, TXT, Markdown or subtitles", another: "Choose another file",
    reading: "Reading your document…", summary: (pages: number, chars: number) => `${pages} page${pages === 1 ? "" : "s"} · ${chars.toLocaleString("en-US")} characters of text`,
    noText: "No text was found in this document. If it is a scan, extract the text with Image to Text (OCR) first.",
    tooLongDoc: (max: number) => `This document is too long to translate here (limit about ${max.toLocaleString("en-US")} characters, roughly 12 pages). Split it into smaller parts first.`,
    errors: { unsupported: "This file type can't be translated. Use PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx), OpenDocument, RTF, HTML, CSV, TXT, Markdown or subtitles (.srt, .vtt).", legacy: "This is an old Office format. Open it and save it as .docx, .xlsx or .pptx, then choose it again.", invalid: "This file couldn't be read. It may be damaged.", encrypted: "This PDF is password-protected. Unlock it first, then choose it again." },
    from: "From", to: "To", auto: "Detect language", detected: (name: string) => `Detected: ${name}`, swap: "Swap languages",
    sameLang: "The two languages are the same. Choose a different language to translate into.",
    noRoute: (from: string, to: string) => `Translating from ${from} to ${to} isn't available. ${from} can only be translated into English.`,
    cantDetect: "The language couldn't be detected. Choose it from the list.",
    viaEnglish: (mb: number) => `This pair is translated through English with two models (about ${mb} MB to download the first time).`,
    firstTime: (mb: number) => `First time for this pair: about ${mb} MB to download, then it is kept for next time.`,
    translate: "Translate", stop: "Stop",
    download: (l: number, t: number) => `Downloading the translation model… ${l} of ${t} MB (first time only)`, starting: "Starting the translation model…",
    translating: (d: number, n: number) => `Translating sentence ${d} of ${n}…`,
    result: "Translation", idle: "Your translation will appear here.", copy: "Copy translation", saveTxt: "Download .txt", saveWord: "Download Word", saveSame: (ext: string) => `Download .${ext}`,
    useAsInput: "Use the translation as the new text", preview: "Start of the translation", stale: "The text or languages changed. Translate again to update the result.",
    failed: "Translation failed. Check your connection for the first download, then try again.", unsupportedBrowser: "This browser can't run the translation model. Try a recent version of Chrome, Edge, Firefox or Safari.",
    wrong: (name: string) => `This text doesn't look like ${name}. The result may be poor.`,
    machine: "Machine translation can contain mistakes. Have important documents checked by a qualified translator.",
    layoutKept: "The file keeps its layout: only the words were translated.",
  },
  ar: {
    privacy: "تُترجم نصوصك ومستنداتك على جهازك ولا تُرفع إلى أي مكان. في أول استخدام لزوج لغات يحمّل متصفحك نموذج ترجمته ويحتفظ به للمرات القادمة.",
    mode: "ماذا تريد أن تترجم؟", text: "لصق نص", file: "رفع مستند",
    input: "النص المراد ترجمته", placeholder: "اكتب نصًا أو الصقه…", clear: "مسح",
    count: (n: number, max: number) => `${n.toLocaleString("en-US")} / ${max.toLocaleString("en-US")} حرف`,
    tooLongText: (n: number, max: number) => `طول النص ${n.toLocaleString("en-US")} حرف، والحد الأقصى ${max.toLocaleString("en-US")}.`,
    choose: "اختر مستندًا", types: "PDF وWord وPowerPoint وExcel وOpenDocument وRTF وHTML وCSV وTXT وMarkdown وملفات الترجمة", another: "اختيار ملف آخر",
    reading: "جارٍ قراءة مستندك…", summary: (pages: number, chars: number) => `${arCount(pages, "صفحة واحدة", "صفحتان", "صفحات", "صفحة")} · ${chars.toLocaleString("en-US")} حرف من النص`,
    noText: "لم نجد نصًا في هذا المستند. إن كان ممسوحًا ضوئيًا فاستخرج النص أولًا بأداة تحويل الصورة إلى نص (OCR).",
    tooLongDoc: (max: number) => `هذا المستند أطول من الحد المسموح للترجمة هنا (نحو ${max.toLocaleString("en-US")} حرف، أي قرابة 12 صفحة). قسّمه إلى أجزاء أصغر أولًا.`,
    errors: { unsupported: "لا يمكن ترجمة هذا النوع من الملفات. استخدم PDF أو Word (.docx) أو PowerPoint (.pptx) أو Excel (.xlsx) أو OpenDocument أو RTF أو HTML أو CSV أو TXT أو Markdown أو ملفات الترجمة (.srt و.vtt).", legacy: "هذه صيغة Office قديمة. افتحها واحفظها بصيغة .docx أو .xlsx أو .pptx ثم اخترها مجددًا.", invalid: "تعذّرت قراءة هذا الملف، وقد يكون تالفًا.", encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا." },
    from: "من", to: "إلى", auto: "اكتشاف اللغة", detected: (name: string) => `اللغة المكتشفة: ${name}`, swap: "تبديل اللغتين",
    sameLang: "اللغتان متطابقتان. اختر لغة مختلفة للترجمة إليها.",
    noRoute: (from: string, to: string) => `الترجمة من ${from} إلى ${to} غير متاحة. يمكن ترجمة ${from} إلى الإنجليزية فقط.`,
    cantDetect: "تعذّر اكتشاف اللغة. اخترها من القائمة.",
    viaEnglish: (mb: number) => `يُترجم هذا الزوج عبر الإنجليزية بنموذجين (نحو ${mb} ميغابايت للتحميل أول مرة).`,
    firstTime: (mb: number) => `أول مرة لهذا الزوج: نحو ${mb} ميغابايت للتحميل، ثم يُحفظ للمرات القادمة.`,
    translate: "ترجمة", stop: "إيقاف",
    download: (l: number, t: number) => `جارٍ تحميل نموذج الترجمة… ${l} من ${t} ميغابايت (أول مرة فقط)`, starting: "جارٍ تشغيل نموذج الترجمة…",
    translating: (d: number, n: number) => `جارٍ ترجمة الجملة ${d} من ${n}…`,
    result: "الترجمة", idle: "ستظهر ترجمتك هنا.", copy: "نسخ الترجمة", saveTxt: "تنزيل .txt", saveWord: "تنزيل Word", saveSame: (ext: string) => `تنزيل .${ext}`,
    useAsInput: "استخدام الترجمة كنص جديد", preview: "بداية الترجمة", stale: "تغيّر النص أو اللغتان. ترجم مجددًا لتحديث النتيجة.",
    failed: "فشلت الترجمة. تحقق من اتصالك أثناء التحميل الأول ثم حاول مجددًا.", unsupportedBrowser: "لا يستطيع هذا المتصفح تشغيل نموذج الترجمة. جرّب إصدارًا حديثًا من Chrome أو Edge أو Firefox أو Safari.",
    wrong: (name: string) => `لا يبدو أن هذا النص مكتوب بـ${name}. وقد تكون النتيجة ضعيفة.`,
    machine: "قد تحتوي الترجمة الآلية على أخطاء. اطلب مراجعة المستندات المهمة من مترجم معتمد.",
    layoutKept: "يحتفظ الملف بتنسيقه: تُرجمت الكلمات فقط.",
  },
};

export default function DocumentTranslator() {
  const locale = useLocale();
  const t = strings[locale];
  const name = (code: Lang) => langInfo(code)[locale];
  const sources = useMemo(() => sourceLanguages(), []);
  const targets = useMemo(() => targetLanguages(), []);
  const sourceCodes = useMemo(() => sources.map((l) => l.code), [sources]);
  const sorted = (list: typeof sources) => [...list].sort((a, b) => (a.code === "en" ? -1 : b.code === "en" ? 1 : name(a.code).localeCompare(name(b.code), locale)));

  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<ReadResult | null>(null);
  const [reading, setReading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [from, setFrom] = useState<Lang | "auto">("auto");
  const [to, setTo] = useState<Lang>(locale === "ar" ? "ar" : "en");
  // The target follows the text (Arabic text to English, anything else to Arabic or English) until the person picks one.
  const [pickedTo, setPickedTo] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ key: string; texts: string[]; text: string; to: Lang } | null>(null);
  const stop = useRef(false);
  const engines = useRef(new Map<string, Promise<LocalTranslator>>());
  const load = useRef(0);

  useEffect(() => () => { stop.current = true; }, []);

  const sample = mode === "text" ? text : (doc?.blocks.slice(0, 40).map((b) => b.text).join(" ") ?? "");
  const detected = useMemo(() => (from === "auto" && sample.trim() ? detectLanguage(sample, sourceCodes) : null), [from, sample, sourceCodes]);
  const effectiveFrom: Lang | null = from === "auto" ? detected : from;

  // Unless the person chose a target, translate Arabic into English and everything else into Arabic or English.
  const wantedTo: Lang = effectiveFrom === "ar" ? "en" : effectiveFrom === "en" ? "ar" : locale === "ar" ? "ar" : "en";
  const target: Lang = pickedTo ? to : effectiveFrom ? wantedTo : to;

  const route = effectiveFrom ? routeFor(effectiveFrom, target) : null;
  const sameLang = effectiveFrom !== null && effectiveFrom === target;
  const noRoute = effectiveFrom !== null && !sameLang && route === null;
  const bytes = route ? routeBytes(route) : 0;

  const hasInput = mode === "text" ? text.trim() !== "" : !!doc && doc.blocks.length > 0;
  const chars = mode === "text" ? text.length : (doc?.blocks.reduce((n, b) => n + b.text.length, 0) ?? 0);
  const tooLong = mode === "text" ? chars > MAX_TEXT_CHARS : chars > MAX_DOCUMENT_CHARS;
  const busy = progress !== null;
  const key = `${mode}|${mode === "text" ? text : `${file?.name}|${file?.size}`}|${effectiveFrom}|${target}`;
  const current = result && result.key === key ? result : null;
  const wrongLanguage = from !== "auto" && sample.trim() !== "" && detectLanguage(sample, sourceCodes) !== null && detectLanguage(sample, sourceCodes) !== from;

  function engine(r: string[]) {
    const k = r.join(">");
    let e = engines.current.get(k);
    if (!e) {
      e = createRoute(r, (stage) => setProgress({ kind: "stage", stage }));
      // A failed start must not be cached, or "try again" would fail forever.
      e.catch(() => engines.current.delete(k));
      engines.current.set(k, e);
    }
    return e;
  }

  async function open(f: File) {
    const id = ++load.current;
    stop.current = true;
    setFile(f);
    setDoc(null);
    setResult(null);
    setLoadError(null);
    setError(null);
    setPickedTo(false);
    setReading(true);
    try {
      let read: ReadResult;
      if (/\.pdf$/i.test(f.name) || f.type === "application/pdf") {
        const pdf = await openPdf(new Uint8Array(await f.arrayBuffer()));
        const blocks = await readDocument(pdf);
        read = { format: "pdf", blocks, pages: pdf.numPages, rebuild: null, ext: "pdf" };
        void pdf.destroy();
      } else {
        read = await readFile(f);
      }
      if (load.current === id) setDoc(read);
    } catch (e) {
      if (load.current !== id) return;
      const code = e instanceof PdfError ? e.code : e instanceof ReadError ? e.code : "invalid";
      setLoadError(t.errors[code as keyof typeof t.errors] ?? t.errors.invalid);
    } finally {
      if (load.current === id) setReading(false);
    }
  }

  async function translate() {
    if (!route || !effectiveFrom || !hasInput || tooLong) return;
    const lines = mode === "text" ? splitLines(text) : null;
    const segments = lines ? lines.segments : doc!.blocks.map((b) => b.text);
    if (!segments.length) return;
    stop.current = false;
    setError(null);
    const used = target;
    try {
      setProgress({ kind: "stage", stage: { kind: "starting" } });
      const run = await engine(route);
      const out = await translateParagraphs(run, segments, (done, total) => setProgress({ kind: "sentences", done, total }), () => stop.current);
      if (!out) return;
      setResult({ key: `${mode}|${mode === "text" ? text : `${file?.name}|${file?.size}`}|${effectiveFrom}|${used}`, texts: out, text: lines ? joinLines(lines, out) : out.join("\n\n"), to: used });
    } catch (e) {
      setError(typeof WebAssembly === "undefined" || (e instanceof Error && /webassembly|wasm/i.test(e.message)) ? t.unsupportedBrowser : t.failed);
    } finally {
      setProgress(null);
    }
  }

  function swapLanguages() {
    if (busy) return;
    if (!effectiveFrom) return;
    const newFrom = target;
    const newTo = effectiveFrom;
    if (!sources.some((l) => l.code === newFrom) || !targets.some((l) => l.code === newTo)) return;
    if (current && mode === "text") setText(current.text);
    setFrom(newFrom);
    setTo(newTo);
    setPickedTo(true);
    setResult(null);
  }

  function useAsInput() {
    if (!current || mode !== "text") return;
    stop.current = true;
    setProgress(null);
    setText(current.text);
    setFrom(current.to);
    setTo(effectiveFrom ?? "en");
    setPickedTo(true);
    setResult(null);
    setError(null);
  }

  function clear() {
    stop.current = true;
    setProgress(null);
    setText("");
    setFile(null);
    setDoc(null);
    setFrom("auto");
    setPickedTo(false);
    setResult(null);
    setError(null);
    setLoadError(null);
  }

  const status =
    progress?.kind === "sentences" ? t.translating(progress.done, progress.total)
    : progress?.stage.kind === "download" ? t.download(mb(progress.stage.loaded), mb(progress.stage.total))
    : progress ? t.starting : null;
  const download = progress?.kind === "stage" && progress.stage.kind === "download" ? progress.stage : null;
  const stem = file ? safeFileName(baseName(file.name), "document") : "translation";
  const problem =
    sameLang ? t.sameLang
    : noRoute ? t.noRoute(name(effectiveFrom!), name(target))
    : hasInput && !effectiveFrom ? t.cantDetect
    : null;

  const languagePicker = (
    <div className="grid items-start gap-3 sm:grid-cols-[1fr_auto_1fr]">
      <Field label={t.from} hint={from === "auto" && detected ? t.detected(name(detected)) : undefined}>
        {(p) => (
          <Select {...p} value={from} onChange={(e) => setFrom(e.target.value as Lang | "auto")} disabled={busy}>
            <option value="auto">{t.auto}</option>
            {sorted(sources).map((l) => <option key={l.code} value={l.code}>{name(l.code)}</option>)}
          </Select>
        )}
      </Field>
      <Button variant="secondary" size="md" onClick={swapLanguages} disabled={busy || !effectiveFrom} aria-label={t.swap} title={t.swap} className="sm:mt-[1.7rem]">
        <Icon name="arrow-up-down" size={16} className="sm:rotate-90" />
      </Button>
      <Field label={t.to}>
        {(p) => (
          <Select {...p} value={target} onChange={(e) => { setTo(e.target.value as Lang); setPickedTo(true); }} disabled={busy}>
            {sorted(targets).map((l) => <option key={l.code} value={l.code}>{name(l.code)}</option>)}
          </Select>
        )}
      </Field>
    </div>
  );

  const controls = (
    <>
      {languagePicker}
      {problem && hasInput && <StatusMessage tone="warning">{problem}</StatusMessage>}
      {sameLang === false && wrongLanguage && effectiveFrom && <StatusMessage tone="warning">{t.wrong(name(from as Lang))}</StatusMessage>}
      {route && route.length > 1 && <StatusMessage tone="info">{t.viaEnglish(mb(bytes))}</StatusMessage>}
      {route && route.length === 1 && hasInput && <p className="text-sm text-muted">{t.firstTime(mb(bytes))}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={translate} disabled={!hasInput || tooLong || busy || !route}>
          <Icon name={busy ? "loader" : "globe"} size={18} className={busy ? "animate-spin" : undefined} /> {t.translate}
        </Button>
        {busy && <Button variant="ghost" size="sm" onClick={() => { stop.current = true; }}>{t.stop}</Button>}
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
    </>
  );

  return (
    <div className="flex flex-col gap-5">
      <StatusMessage tone="info">{t.privacy}</StatusMessage>
      <Segmented legend={t.mode} value={mode} onChange={(m) => { if (!busy) { setMode(m); setResult(null); setError(null); } }} options={[{ value: "text", label: t.text }, { value: "file", label: t.file }]} />

      {mode === "text" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title={t.input} actions={<Button variant="ghost" size="sm" disabled={!text} onClick={clear}><Icon name="rotate-ccw" size={16} /> {t.clear}</Button>}>
            <Field label={<span className="sr-only">{t.input}</span>} error={tooLong ? t.tooLongText(text.length, MAX_TEXT_CHARS) : null} hint={t.count(text.length, MAX_TEXT_CHARS)}>
              {(p) => <TextArea {...p} rows={12} value={text} onChange={(e) => { setText(e.target.value); }} placeholder={t.placeholder} className="font-sans text-base" />}
            </Field>
            {controls}
          </Panel>
          <Panel
            title={t.result}
            actions={current && (
              <>
                <Button variant="secondary" size="sm" onClick={useAsInput} aria-label={t.useAsInput} title={t.useAsInput}><Icon name="arrow-up-down" size={16} /></Button>
                <CopyButton value={current.text} label={t.copy} />
                <DownloadButton filename={`translation-${current.to}.txt`} getBlob={() => new Blob([current.text], { type: "text/plain;charset=utf-8" })} label={t.saveTxt} />
              </>
            )}
          >
            {!result && <p className="text-sm text-muted">{t.idle}</p>}
            {result && (
              <div aria-live="polite">
                {!current ? <p className="text-sm text-muted">{t.stale}</p> : (
                  <>
                    <p dir={isRtl(current.to) ? "rtl" : "ltr"} lang={current.to} data-testid="translation" className="whitespace-pre-wrap text-base leading-relaxed">{current.text}</p>
                    <p className="mt-4 text-sm text-muted">{t.machine}</p>
                  </>
                )}
              </div>
            )}
          </Panel>
        </div>
      ) : (
        <>
          <Panel title={t.choose}>
            {!file ? (
              <FileDropZone rules={rules} onFiles={(fs) => fs[0] && void open(fs[0])} typesLabel={t.types} />
            ) : (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-md bg-surface-2 text-muted"><Icon name="file-text" size={22} /></span>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate font-medium" title={file.name}><bdi>{file.name}</bdi></p>
                  <p className="text-sm text-muted">{formatBytes(file.size, locale)}{doc ? ` · ${t.summary(doc.pages, chars)}` : reading ? ` · ${t.reading}` : ""}</p>
                </div>
                <Button variant="secondary" size="sm" disabled={busy} onClick={clear}><Icon name="rotate-ccw" size={16} /> {t.another}</Button>
              </div>
            )}
            {loadError && <StatusMessage tone="error">{loadError}</StatusMessage>}
            {doc && doc.blocks.length === 0 && <StatusMessage tone="warning">{t.noText}</StatusMessage>}
            {doc && chars > MAX_DOCUMENT_CHARS && <StatusMessage tone="error">{t.tooLongDoc(MAX_DOCUMENT_CHARS)}</StatusMessage>}
          </Panel>

          {doc && doc.blocks.length > 0 && chars <= MAX_DOCUMENT_CHARS && <Panel title={t.translate}>{controls}</Panel>}

          {result && doc && (
            <Panel title={t.result}>
              {!current ? <p className="text-sm text-muted">{t.stale}</p> : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {doc.rebuild && (
                      <DownloadButton filename={`${stem}-${current.to}.${doc.ext}`} getBlob={() => doc.rebuild!(current.texts, current.to)} label={t.saveSame(doc.ext)} variant="primary" size="md" />
                    )}
                    <DownloadButton filename={`${stem}-${current.to}.docx`} getBlob={() => translatedDocx(doc.blocks, current.texts, current.to, true)} label={t.saveWord} variant={doc.rebuild ? "secondary" : "primary"} size="md" />
                    <DownloadButton filename={`${stem}-${current.to}.txt`} getBlob={() => new Blob([current.text], { type: "text/plain;charset=utf-8" })} label={t.saveTxt} size="md" />
                    <CopyButton value={current.text} label={t.copy} size="md" />
                  </div>
                  {doc.rebuild && <p className="text-sm text-muted">{t.layoutKept}</p>}
                  <p className="text-sm font-medium">{t.preview}</p>
                  <div dir={isRtl(current.to) ? "rtl" : "ltr"} lang={current.to} data-testid="translation" className="max-h-80 overflow-auto rounded-lg border border-line bg-surface p-4 text-[0.95rem]">
                    {doc.blocks.slice(0, 10).map((b, i) => b.kind === "heading"
                      ? <h3 key={i} className="mb-2 text-lg font-semibold" style={{ textAlign: b.center ? "center" : undefined }}>{current.texts[i]}</h3>
                      : <p key={i} className="mb-3 text-muted" style={{ textAlign: b.center ? "center" : undefined }}>{current.texts[i]}</p>)}
                  </div>
                  <p className="text-sm text-muted">{t.machine}</p>
                </>
              )}
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
