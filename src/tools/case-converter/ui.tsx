"use client";

import { useMemo, useState } from "react";
import { Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/actions";
import { Field, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/components/ui/cx";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { caseModes, convertCase, type CaseMode } from "./logic";

const strings = {
  en: { style: "Case style", input: "Input", toConvert: "Text to convert", placeholder: "Type or paste text…", result: "Result", converted: "Converted text", resultPlaceholder: "Converted text appears here" },
  ar: { style: "نمط حالة الأحرف", input: "النص الأصلي", toConvert: "النص المراد تحويله", placeholder: "اكتب النص أو الصقه…", result: "النتيجة", converted: "النص المحوّل", resultPlaceholder: "يظهر النص المحوّل هنا" },
};

export default function CaseConverter() {
  const t = strings[useLocale()];
  const ui = useMessages().ui;
  const [text, setText] = useState("");
  const [mode, setMode] = useState<CaseMode>("title");
  const output = useMemo(() => convertCase(text, mode), [text, mode]);

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.style}>
        <div role="radiogroup" aria-label={t.style} className="flex flex-wrap gap-2">
          {caseModes.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              onClick={() => setMode(m.id)}
              className={cx(
                "min-h-10 rounded-md border px-3.5 py-2 text-sm font-medium transition-colors",
                mode === m.id ? "border-accent bg-accent-soft text-accent-text" : "border-line-strong bg-surface hover:bg-surface-2",
              )}
            >
              <span dir="ltr">{m.label}</span>
            </button>
          ))}
        </div>
      </Panel>
      <Workspace>
        <Panel
          title={t.input}
          actions={
            <Button variant="ghost" size="sm" onClick={() => setText("")} disabled={!text}>
              <Icon name="rotate-ccw" size={16} /> {ui.clear}
            </Button>
          }
        >
          <Field label={<span className="sr-only">{t.toConvert}</span>}>
            {(p) => <TextArea {...p} rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder={t.placeholder} className="font-sans text-base" />}
          </Field>
        </Panel>
        <Panel title={t.result} actions={<CopyButton value={output} />}>
          <Field label={<span className="sr-only">{t.converted}</span>}>
            {(p) => <TextArea {...p} rows={10} value={output} readOnly placeholder={t.resultPlaceholder} className="font-sans text-base" />}
          </Field>
        </Panel>
      </Workspace>
    </div>
  );
}
