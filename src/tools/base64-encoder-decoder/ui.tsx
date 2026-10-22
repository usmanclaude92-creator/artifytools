"use client";

import { useMemo, useState } from "react";
import { IdleHint, Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/actions";
import { Checkbox, Field, Segmented, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { translateMessage, type MessageRule } from "@/lib/translate-message";
import { decodeBase64, encodeBase64, type Base64Mode, type TextOutcome } from "./logic";

const rulesAr: MessageRule[] = [
  [/^Invalid character "(.+)" — Base64 uses only/, (c) => `حرف غير صالح "${c}" — يستخدم Base64 الأحرف A–Z وa–z و0–9 و"+" و"/" (أو "-" و"_") و"=" فقط.`],
  [/^The length is invalid/, "الطول غير صالح — مجموعة أخيرة من حرف واحد لا يمكن أن تحمل أي بيانات."],
  [/^This isn't valid Base64\.$/, "هذا ليس Base64 صالحًا."],
  [/^The data decoded successfully but isn't valid UTF-8 text/, "فُكّ ترميز البيانات بنجاح، لكنها ليست نصًا صالحًا بترميز UTF-8 — ربما تكون بيانات ثنائية مثل صورة أو ملف."],
];

const strings = {
  en: {
    options: "Options", action: "Action", encode: "Encode", decode: "Decode", urlSafe: "URL-safe alphabet", urlSafeHint: "Uses - and _ instead of + and /", padding: "Include = padding",
    notice: "Base64 is an encoding, not encryption. Anyone can decode it, so don’t use it to hide secrets.", input: "Input", textTo: (m: Base64Mode) => `Text to ${m}`, placeholder: "Text to encode…",
    result: "Result", swap: "Swap", idle: (m: Base64Mode) => `The ${m === "encode" ? "Base64" : "decoded text"} appears here.`, rules: null,
  },
  ar: {
    options: "الخيارات", action: "الإجراء", encode: "ترميز", decode: "فك الترميز", urlSafe: "أبجدية آمنة للروابط", urlSafeHint: "يستخدم - و_ بدلًا من + و/", padding: "تضمين حشو =",
    notice: "‏Base64 ترميز وليس تشفيرًا. يستطيع أي شخص فكّه، فلا تستخدمه لإخفاء الأسرار.", input: "المدخل", textTo: (m: Base64Mode) => (m === "encode" ? "النص المراد ترميزه" : "النص المراد فك ترميزه"), placeholder: "النص المراد ترميزه…",
    result: "النتيجة", swap: "تبديل", idle: (m: Base64Mode) => (m === "encode" ? "يظهر Base64 هنا." : "يظهر النص بعد فك الترميز هنا."), rules: rulesAr,
  },
};

export default function Base64Tool() {
  const t = strings[useLocale()];
  const ui = useMessages().ui;
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Base64Mode>("encode");
  const [urlSafe, setUrlSafe] = useState(false);
  const [padding, setPadding] = useState(true);

  const outcome: TextOutcome | null = useMemo(() => {
    if (!text) return null;
    if (mode === "encode") return { ok: true, output: encodeBase64(text, { urlSafe, padding }) };
    return decodeBase64(text);
  }, [text, mode, urlSafe, padding]);
  const output = outcome?.ok ? outcome.output : "";

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.options}>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <Segmented legend={t.action} value={mode} onChange={setMode} options={[{ value: "encode", label: t.encode }, { value: "decode", label: t.decode }]} />
          {mode === "encode" && (
            <>
              <Checkbox label={t.urlSafe} hint={t.urlSafeHint} checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} />
              <Checkbox label={t.padding} checked={padding} onChange={(e) => setPadding(e.target.checked)} />
            </>
          )}
        </div>
        <StatusMessage tone="info">{t.notice}</StatusMessage>
      </Panel>
      <Workspace>
        <Panel
          title={t.input}
          actions={
            <Button variant="ghost" size="sm" disabled={!text} onClick={() => setText("")}>
              <Icon name="rotate-ccw" size={16} /> {ui.clear}
            </Button>
          }
        >
          <Field label={<span className="sr-only">{t.textTo(mode)}</span>}>
            {(p) => <TextArea {...p} rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder={mode === "encode" ? t.placeholder : "SGVsbG8sIFdvcmxkIQ=="} spellCheck={false} />}
          </Field>
        </Panel>
        <Panel
          title={t.result}
          actions={
            <>
              <CopyButton value={output} />
              <Button variant="secondary" size="sm" disabled={!output} onClick={() => { setText(output); setMode(mode === "encode" ? "decode" : "encode"); }}>
                <Icon name="arrow-up-down" size={16} /> {t.swap}
              </Button>
            </>
          }
        >
          {!text && <IdleHint>{t.idle(mode)}</IdleHint>}
          {outcome && !outcome.ok && <StatusMessage tone="error">{translateMessage(outcome.error, t.rules)}</StatusMessage>}
          {outcome?.ok && (
            <Field label={<span className="sr-only">{t.result}</span>}>
              {(p) => <TextArea {...p} rows={9} readOnly value={output} spellCheck={false} className="break-all" />}
            </Field>
          )}
        </Panel>
      </Workspace>
    </div>
  );
}
