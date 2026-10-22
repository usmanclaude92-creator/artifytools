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
import { transformUrl, type UrlMode, type UrlScope } from "./logic";

const rulesAr: MessageRule[] = [
  [/^This text contains an invalid percent-sequence/, "يحتوي هذا النص على تسلسل نسبة مئوية غير صالح (مثل علامة % لا يليها رقمان ست عشريان، أو بايتات لا تشكّل نصًا صالحًا بترميز UTF-8)."],
  [/^This text contains an unpaired surrogate character/, "يحتوي هذا النص على حرف بديل غير مقترن، ولا يمكن ترميزه بصيغة UTF-8."],
];

const strings = {
  en: {
    options: "Options", action: "Action", encode: "Encode", decode: "Decode", scope: "Scope", component: "Component", full: "Full URL", plus: "Treat + as space", plusHint: "For HTML form query strings",
    componentNote: "Component mode also encodes / ? & = # so a value can’t break a URL.", fullNote: "Full URL mode keeps the characters that give a URL its structure (: / ? & = #).",
    input: "Input", textTo: (m: UrlMode) => `Text to ${m}`, result: "Result", swap: "Swap", idle: (m: UrlMode) => `The ${m === "encode" ? "encoded" : "decoded"} text appears here.`, rules: null,
  },
  ar: {
    options: "الخيارات", action: "الإجراء", encode: "ترميز", decode: "فك الترميز", scope: "النطاق", component: "جزء من الرابط", full: "رابط كامل", plus: "اعتبار + مسافة", plusHint: "لمعاملات استعلام نماذج HTML",
    componentNote: "يرمّز وضع «جزء من الرابط» أيضًا / ? & = # حتى لا تُفسد القيمة الرابط.", fullNote: "يحتفظ وضع «رابط كامل» بالأحرف التي تمنح الرابط بنيته (: / ? & = #).",
    input: "المدخل", textTo: (m: UrlMode) => (m === "encode" ? "النص المراد ترميزه" : "النص المراد فك ترميزه"), result: "النتيجة", swap: "تبديل", idle: (m: UrlMode) => (m === "encode" ? "يظهر النص المرمّز هنا." : "يظهر النص بعد فك الترميز هنا."), rules: rulesAr,
  },
};

export default function UrlEncoderDecoder() {
  const t = strings[useLocale()];
  const ui = useMessages().ui;
  const [text, setText] = useState("");
  const [mode, setMode] = useState<UrlMode>("encode");
  const [scope, setScope] = useState<UrlScope>("component");
  const [plus, setPlus] = useState(false);
  const outcome = useMemo(() => (text ? transformUrl(text, mode, scope, plus) : null), [text, mode, scope, plus]);
  const output = outcome?.ok ? outcome.output : "";
  const error = outcome && !outcome.ok ? translateMessage(outcome.error, t.rules) : null;

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.options}>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <Segmented legend={t.action} value={mode} onChange={setMode} options={[{ value: "encode", label: t.encode }, { value: "decode", label: t.decode }]} />
          <Segmented legend={t.scope} value={scope} onChange={setScope} options={[{ value: "component", label: t.component }, { value: "full", label: t.full }]} />
          {mode === "decode" && <Checkbox label={t.plus} hint={t.plusHint} checked={plus} onChange={(e) => setPlus(e.target.checked)} />}
        </div>
        <p className="text-sm text-muted">
          {scope === "component" ? t.componentNote : t.fullNote}
        </p>
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
          <Field label={<span className="sr-only">{t.textTo(mode)}</span>} error={error}>
            {(p) => <TextArea {...p} rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder={mode === "encode" ? "coffee & cream" : "coffee%20%26%20cream"} spellCheck={false} />}
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
          {error && <StatusMessage tone="error">{error}</StatusMessage>}
          {outcome?.ok && (
            <Field label={<span className="sr-only">{t.result}</span>}>
              {(p) => <TextArea {...p} rows={9} readOnly value={output} spellCheck={false} />}
            </Field>
          )}
        </Panel>
      </Workspace>
    </div>
  );
}
