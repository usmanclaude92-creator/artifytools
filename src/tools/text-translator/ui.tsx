"use client";

import { useEffect, useRef, useState } from "react";
import { IdleHint, Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton, DownloadButton } from "@/components/ui/actions";
import { Field, Select, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { useLocale } from "@/components/i18n/locale-provider";
import { createLocalTranslator, LOCAL_PAIRS, pairFor, type LocalLanguage, type LocalPair, type LocalTranslator, type Stage } from "@/lib/translate/local";
import { detectSource, translateParagraphs } from "@/lib/translate/text";
import { joinLines, MAX_TEXT_CHARS, splitLines } from "./logic";

const mb = (bytes: number) => Math.round(bytes / 1_000_000);

const strings = {
  en: {
    privacy: (size: number) => `Your text is translated on this device and never uploaded. The first time, your browser downloads the translation model (about ${size} MB for each direction) and keeps it for next time.`,
    input: "Text to translate", placeholder: "Type or paste text…", clear: "Clear",
    count: (n: number, max: number) => `${n.toLocaleString("en-US")} / ${max.toLocaleString("en-US")} characters`,
    tooLong: (n: number, max: number) => `Text is ${n.toLocaleString("en-US")} characters; the limit is ${max.toLocaleString("en-US")}.`,
    direction: "Translate", pairs: { "ar-en": "Arabic to English", "en-ar": "English to Arabic" } as Record<LocalPair, string>,
    swap: "Swap: use the translation as the new text", translate: "Translate", stop: "Stop",
    download: (l: number, t: number) => `Downloading the translation model… ${l} of ${t} MB (first time only)`, starting: "Starting the translation model…",
    translating: (d: number, n: number) => `Translating sentence ${d} of ${n}…`,
    result: "Translation", idle: "Your translation will appear here.", copy: "Copy translation", save: "Download .txt",
    failed: "Translation failed. Check your connection for the first download, then try again.", unsupported: "This browser can't run the translation model. Try a recent version of Chrome, Edge, Firefox or Safari.",
    wrong: "This text doesn't look like the language you chose to translate from. The result may be poor.",
    stale: "The text or direction changed. Translate again to update the result.",
    machine: "Machine translation can contain mistakes. Have important texts checked by a qualified translator.",
  },
  ar: {
    privacy: (size: number) => `تُترجم نصوصك على جهازك ولا تُرفع إلى أي مكان. في المرة الأولى يحمّل متصفحك نموذج الترجمة (نحو ${size} ميغابايت لكل اتجاه) ويحتفظ به للمرات القادمة.`,
    input: "النص المراد ترجمته", placeholder: "اكتب نصًا أو الصقه…", clear: "مسح",
    count: (n: number, max: number) => `${n.toLocaleString("en-US")} / ${max.toLocaleString("en-US")} حرف`,
    tooLong: (n: number, max: number) => `طول النص ${n.toLocaleString("en-US")} حرف، والحد الأقصى ${max.toLocaleString("en-US")}.`,
    direction: "الترجمة", pairs: { "ar-en": "من العربية إلى الإنجليزية", "en-ar": "من الإنجليزية إلى العربية" } as Record<LocalPair, string>,
    swap: "تبديل: استخدام الترجمة كنص جديد", translate: "ترجمة", stop: "إيقاف",
    download: (l: number, t: number) => `جارٍ تحميل نموذج الترجمة… ${l} من ${t} ميغابايت (أول مرة فقط)`, starting: "جارٍ تشغيل نموذج الترجمة…",
    translating: (d: number, n: number) => `جارٍ ترجمة الجملة ${d} من ${n}…`,
    result: "الترجمة", idle: "ستظهر ترجمتك هنا.", copy: "نسخ الترجمة", save: "تنزيل .txt",
    failed: "فشلت الترجمة. تحقق من اتصالك أثناء التحميل الأول ثم حاول مجددًا.", unsupported: "لا يستطيع هذا المتصفح تشغيل نموذج الترجمة. جرّب إصدارًا حديثًا من Chrome أو Edge أو Firefox أو Safari.",
    wrong: "لا يبدو أن هذا النص مكتوب باللغة التي اخترت الترجمة منها، وقد تكون النتيجة ضعيفة.",
    stale: "تغيّر النص أو الاتجاه. ترجم مجددًا لتحديث النتيجة.",
    machine: "قد تحتوي الترجمة الآلية على أخطاء. اطلب مراجعة النصوص المهمة من مترجم معتمد.",
  },
};

type Progress = { kind: "stage"; stage: Stage } | { kind: "sentences"; done: number; total: number };

export default function TextTranslator() {
  const locale = useLocale();
  const t = strings[locale];
  const fallback: LocalLanguage = locale === "ar" ? "ar" : "en";
  const [text, setText] = useState("");
  const [pair, setPair] = useState<LocalPair>(pairFor(fallback));
  // The direction follows the text until the person picks one themselves.
  const [picked, setPicked] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ key: string; text: string } | null>(null);
  const stop = useRef(false);
  const engines = useRef(new Map<LocalPair, Promise<LocalTranslator>>());

  useEffect(() => () => { stop.current = true; }, []);

  function onText(value: string) {
    setText(value);
    if (!picked) setPair(pairFor(detectSource(value, fallback)));
  }

  const tooLong = text.length > MAX_TEXT_CHARS;
  const busy = progress !== null;
  const key = `${text}|${pair}`;
  const current = result && result.key === key ? result : null;
  const target = LOCAL_PAIRS[pair].target;
  const wrongLanguage = text.trim() !== "" && detectSource(text, LOCAL_PAIRS[pair].source) !== LOCAL_PAIRS[pair].source;

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
    const parts = splitLines(text);
    if (!parts.segments.length) return;
    stop.current = false;
    setError(null);
    const used = pair;
    try {
      setProgress({ kind: "stage", stage: { kind: "starting" } });
      const run = await engine(used);
      const translated = await translateParagraphs(run, parts.segments, (done, total) => setProgress({ kind: "sentences", done, total }), () => stop.current);
      if (!translated) return;
      setResult({ key: `${text}|${used}`, text: joinLines(parts, translated) });
    } catch (e) {
      setError(typeof WebAssembly === "undefined" || (e instanceof Error && /webassembly|wasm/i.test(e.message)) ? t.unsupported : t.failed);
    } finally {
      setProgress(null);
    }
  }

  function swap() {
    if (!current) return;
    stop.current = true;
    setProgress(null);
    setText(current.text);
    setPair(pairFor(target));
    setPicked(false);
    setResult(null);
    setError(null);
  }

  function clear() {
    stop.current = true;
    setProgress(null);
    setText("");
    setPicked(false);
    setPair(pairFor(fallback));
    setResult(null);
    setError(null);
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

  return (
    <div className="flex flex-col gap-5">
      <StatusMessage tone="info">{t.privacy(mb(LOCAL_PAIRS[pair].bytes))}</StatusMessage>
      <Workspace>
        <Panel
          title={t.input}
          actions={
            <Button variant="ghost" size="sm" disabled={!text} onClick={clear}>
              <Icon name="rotate-ccw" size={16} /> {t.clear}
            </Button>
          }
        >
          <Field label={<span className="sr-only">{t.input}</span>} error={tooLong ? t.tooLong(text.length, MAX_TEXT_CHARS) : null} hint={t.count(text.length, MAX_TEXT_CHARS)}>
            {(p) => <TextArea {...p} rows={12} value={text} onChange={(e) => onText(e.target.value)} placeholder={t.placeholder} className="font-sans text-base" />}
          </Field>
          <Field label={t.direction}>
            {(p) => (
              <Select {...p} value={pair} onChange={(e) => { setPair(e.target.value as LocalPair); setPicked(true); }} disabled={busy}>
                {(Object.keys(LOCAL_PAIRS) as LocalPair[]).map((k) => <option key={k} value={k}>{t.pairs[k]}</option>)}
              </Select>
            )}
          </Field>
          {wrongLanguage && <StatusMessage tone="warning">{t.wrong}</StatusMessage>}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={translate} disabled={text.trim() === "" || tooLong || busy}>
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
        </Panel>
        <Panel
          title={t.result}
          actions={
            current && (
              <>
                <Button variant="secondary" size="sm" onClick={swap} aria-label={t.swap} title={t.swap}>
                  <Icon name="arrow-up-down" size={16} />
                </Button>
                <CopyButton value={current.text} label={t.copy} />
                <DownloadButton filename={`translation-${target}.txt`} getBlob={() => new Blob([current.text], { type: "text/plain;charset=utf-8" })} label={t.save} />
              </>
            )
          }
        >
          {!result && <IdleHint>{t.idle}</IdleHint>}
          {result && (
            <div aria-live="polite">
              {!current ? (
                <p className="text-sm text-muted">{t.stale}</p>
              ) : (
                <>
                  <p dir={target === "ar" ? "rtl" : "ltr"} lang={target} data-testid="translation" className="whitespace-pre-wrap text-base leading-relaxed">{current.text}</p>
                  <p className="mt-4 text-sm text-muted">{t.machine}</p>
                </>
              )}
            </div>
          )}
        </Panel>
      </Workspace>
    </div>
  );
}
