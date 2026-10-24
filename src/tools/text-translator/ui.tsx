"use client";

import { useEffect, useRef, useState } from "react";
import { IdleHint, Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton, DownloadButton } from "@/components/ui/actions";
import { Field, Select, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Spinner, StatusMessage } from "@/components/ui/feedback";
import { useLocale } from "@/components/i18n/locale-provider";
import { TRANSLATE_LANGUAGES, type TranslateLanguage } from "@/lib/ai/types";
import { makeChunks, reassemble, RTL_LANGUAGES } from "@/lib/translate/chunks";
import { LANGUAGE_NAMES } from "@/lib/translate/languages";
import { defaultTarget, joinLines, looksLikeTarget, MAX_TEXT_CHARS, splitLines } from "./logic";

const strings = {
  en: {
    notConfigured: "Translation isn't switched on yet on this site. Please check back soon.",
    privacy: "When you press Translate, your text is sent to Artify's server and on to a third-party AI provider (Anthropic) to be translated. It isn't stored. Don't translate confidential text you aren't allowed to share.",
    input: "Text to translate", placeholder: "Type or paste text…", clear: "Clear", count: (n: number, max: number) => `${n.toLocaleString("en-US")} / ${max.toLocaleString("en-US")} characters`,
    tooLong: (n: number, max: number) => `Text is ${n.toLocaleString("en-US")} characters; the limit is ${max.toLocaleString("en-US")}.`,
    target: "Translate into", swap: "Swap: use the translation as the new text", translate: "Translate", translating: (d: number, n: number) => (n > 1 ? `Translating part ${d} of ${n}…` : "Translating…"), stop: "Stop",
    result: "Translation", idle: "Your translation will appear here.", idleOff: "Translation is unavailable until it is switched on for this site.",
    copy: "Copy translation", download: "Download .txt", failed: "Translation failed. Please try again in a moment.", offline: "Couldn't reach the server. Check your connection and try again.",
    same: "This text already looks like it is in the target language. Choose another language to translate it.", stale: "The text or language changed. Translate again to update the result.",
    machine: "Machine translation can contain mistakes. Have important texts checked by a qualified translator.",
  },
  ar: {
    notConfigured: "الترجمة غير مفعّلة بعد على هذا الموقع. يرجى العودة قريبًا.",
    privacy: "عند الضغط على «ترجمة» يُرسل نصك إلى خادم Artify ثم إلى مزوّد ذكاء اصطناعي خارجي (Anthropic) لترجمته، ولا يُخزَّن. لا تترجم نصوصًا سرية غير مسموح لك بمشاركتها.",
    input: "النص المراد ترجمته", placeholder: "اكتب نصًا أو الصقه…", clear: "مسح", count: (n: number, max: number) => `${n.toLocaleString("en-US")} / ${max.toLocaleString("en-US")} حرف`,
    tooLong: (n: number, max: number) => `طول النص ${n.toLocaleString("en-US")} حرف، والحد الأقصى ${max.toLocaleString("en-US")}.`,
    target: "الترجمة إلى", swap: "تبديل: استخدام الترجمة كنص جديد", translate: "ترجمة", translating: (d: number, n: number) => (n > 1 ? `جارٍ ترجمة الجزء ${d} من ${n}…` : "جارٍ الترجمة…"), stop: "إيقاف",
    result: "الترجمة", idle: "ستظهر ترجمتك هنا.", idleOff: "الترجمة غير متاحة حتى تُفعَّل لهذا الموقع.",
    copy: "نسخ الترجمة", download: "تنزيل .txt", failed: "فشلت الترجمة. يرجى المحاولة بعد قليل.", offline: "تعذّر الوصول إلى الخادم. تحقق من اتصالك وحاول مجددًا.",
    same: "يبدو أن هذا النص مكتوب أصلًا باللغة المختارة. اختر لغة أخرى لترجمته.", stale: "تغيّر النص أو اللغة. ترجم مجددًا لتحديث النتيجة.",
    machine: "قد تحتوي الترجمة الآلية على أخطاء. اطلب مراجعة النصوص المهمة من مترجم معتمد.",
  },
};

export default function TextTranslator() {
  const locale = useLocale();
  const t = strings[locale];
  const fallback: TranslateLanguage = locale === "ar" ? "en" : "ar";
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [text, setText] = useState("");
  const [target, setTarget] = useState<TranslateLanguage>(fallback);
  // The suggested target follows the text until the person picks a language themselves.
  const [picked, setPicked] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ key: string; text: string } | null>(null);
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

  function onText(value: string) {
    setText(value);
    if (!picked) setTarget(defaultTarget(value, fallback));
  }

  const tooLong = text.length > MAX_TEXT_CHARS;
  const busy = progress !== null;
  const sameLanguage = text.trim() !== "" && looksLikeTarget(text, target);
  const key = `${text}|${target}`;
  const current = result && result.key === key ? result : null;
  const rtl = RTL_LANGUAGES.has(target);
  const canTranslate = Boolean(configured) && text.trim() !== "" && !tooLong && !busy;

  async function translate() {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setError(null);
    const parts = splitLines(text);
    if (!parts.segments.length) return;
    const chunks = makeChunks(parts.segments);
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
      setResult({ key, text: joinLines(parts, reassemble(parts.segments.length, chunks, translated)) });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(e instanceof TypeError ? t.offline : (e as Error).message || t.failed);
    } finally {
      if (abort.current === controller) setProgress(null);
    }
  }

  function swap() {
    if (!current) return;
    abort.current?.abort();
    setProgress(null);
    const next = current.text;
    setText(next);
    setPicked(false);
    setTarget(defaultTarget(next, fallback));
    setResult(null);
    setError(null);
  }

  function clear() {
    abort.current?.abort();
    setProgress(null);
    setText("");
    setPicked(false);
    setTarget(fallback);
    setResult(null);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-5">
      {configured === false && <StatusMessage tone="warning">{t.notConfigured}</StatusMessage>}
      <StatusMessage tone="info">{t.privacy}</StatusMessage>
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
          <Field label={t.target}>
            {(p) => (
              <Select {...p} value={target} onChange={(e) => { setTarget(e.target.value as TranslateLanguage); setPicked(true); }} disabled={busy}>
                {TRANSLATE_LANGUAGES.map((l) => <option key={l} value={l}>{LANGUAGE_NAMES[locale][l]}</option>)}
              </Select>
            )}
          </Field>
          {sameLanguage && <StatusMessage tone="info">{t.same}</StatusMessage>}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={translate} disabled={!canTranslate}>
              <Icon name={busy ? "loader" : "globe"} size={18} className={busy ? "animate-spin" : undefined} /> {t.translate}
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
        <Panel
          title={t.result}
          actions={
            current && (
              <>
                <Button variant="secondary" size="sm" onClick={swap} aria-label={t.swap} title={t.swap}>
                  <Icon name="arrow-up-down" size={16} />
                </Button>
                <CopyButton value={current.text} label={t.copy} />
                <DownloadButton filename={`translation-${target}.txt`} getBlob={() => new Blob([current.text], { type: "text/plain;charset=utf-8" })} label={t.download} />
              </>
            )
          }
        >
          {busy && !result && <Spinner label={t.translating(progress.done, progress.total)} />}
          {!busy && !result && <IdleHint>{configured === false ? t.idleOff : t.idle}</IdleHint>}
          {result && (
            <div aria-live="polite">
              {!current ? (
                <p className="text-sm text-muted">{t.stale}</p>
              ) : (
                <>
                  <p dir={rtl ? "rtl" : "ltr"} lang={target} data-testid="translation" className="whitespace-pre-wrap text-base leading-relaxed">{current.text}</p>
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
