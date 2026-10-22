"use client";

import { useMemo, useState } from "react";
import { IdleHint, Panel, ResultRow, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { Field, Segmented, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { translateMessage, type MessageRule } from "@/lib/translate-message";
import { calculatePercentage, type PercentageMode } from "./logic";

type ModeText = Record<PercentageMode, { label: string; a: string; b: string; question: string }>;

const rulesAr: MessageRule[] = [
  [/^Enter both numbers to calculate\.$/, "أدخل الرقمين لإجراء الحساب."],
  [/^The first value isn't a valid number\.$/, "القيمة الأولى ليست رقمًا صحيحًا."],
  [/^The second value isn't a valid number\.$/, "القيمة الثانية ليست رقمًا صحيحًا."],
  [/^The second value can't be zero when finding a percentage of it\.$/, "لا يمكن أن تكون القيمة الثانية صفرًا عند حساب نسبة منها."],
  [/^Percentage change from zero is undefined\. Use a non-zero starting value\.$/, "نسبة التغيّر من الصفر غير معرّفة. استخدم قيمة بداية غير صفرية."],
  [/^(.+)% of (.+) is (.+)$/, "$1% من $2 تساوي $3"],
  [/^From (.+) to (.+) is no change$/, "لا يوجد تغيّر من $1 إلى $2"],
  [/^From (.+) to (.+) is a decrease of (.+)%$/, "من $1 إلى $2 انخفاض بنسبة $3%"],
  [/^From (.+) to (.+) is an increase of (.+)%$/, "من $1 إلى $2 زيادة بنسبة $3%"],
  [/^(.+) is (.+)% of (.+)$/, "$1 تمثّل $2% من $3"],
];

const strings = {
  en: {
    modes: {
      of: { label: "X% of Y", a: "Percentage (%)", b: "Number", question: "What is X% of Y?" },
      "is-what": { label: "X is what % of Y", a: "Value (X)", b: "Total (Y)", question: "X is what percent of Y?" },
      change: { label: "% change", a: "From (old value)", b: "To (new value)", question: "Percentage change from X to Y" },
    } as ModeText,
    calculate: "Calculate", legend: "What do you want to know?", eg: "e.g.", result: "Result", idle: "Enter two numbers to see the answer.", answer: "Answer", calculatedAs: "Calculated as", rules: null,
  },
  ar: {
    modes: {
      of: { label: "نسبة مئوية من رقم", a: "النسبة (%)", b: "الرقم", question: "كم تساوي نسبة مئوية معيّنة من رقم؟" },
      "is-what": { label: "نسبة قيمة من إجمالي", a: "القيمة", b: "الإجمالي", question: "كم تمثّل القيمة من الإجمالي بالنسبة المئوية؟" },
      change: { label: "نسبة التغيّر", a: "من (القيمة القديمة)", b: "إلى (القيمة الجديدة)", question: "نسبة التغيّر من القيمة القديمة إلى الجديدة" },
    } as ModeText,
    calculate: "الحساب", legend: "ماذا تريد أن تعرف؟", eg: "مثال:", result: "النتيجة", idle: "أدخل رقمين لترى الإجابة.", answer: "الإجابة", calculatedAs: "طريقة الحساب:", rules: rulesAr,
  },
};

export default function PercentageCalculator() {
  const t = strings[useLocale()];
  const ui = useMessages().ui;
  const modes = t.modes;
  const [mode, setMode] = useState<PercentageMode>("of");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const m = modes[mode];
  const touched = a.trim() !== "" || b.trim() !== "";
  const outcome = useMemo(() => (touched ? calculatePercentage(mode, a, b) : null), [mode, a, b, touched]);
  const incomplete = !a.trim() || !b.trim();

  return (
    <Workspace>
      <Panel title={t.calculate}>
        <Segmented
          legend={t.legend}
          value={mode}
          onChange={setMode}
          options={(Object.keys(modes) as PercentageMode[]).map((k) => ({ value: k, label: modes[k].label }))}
        />
        <p className="text-sm text-muted">{m.question}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={m.a}>
            {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={a} onChange={(e) => setA(e.target.value)} placeholder={`${t.eg} 15`} />}
          </Field>
          <Field label={m.b}>
            {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={b} onChange={(e) => setB(e.target.value)} placeholder={`${t.eg} 200`} />}
          </Field>
        </div>
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setA("");
              setB("");
            }}
            disabled={!touched}
          >
            <Icon name="rotate-ccw" size={16} /> {ui.reset}
          </Button>
        </div>
      </Panel>

      <Panel title={t.result}>
        {!outcome && <IdleHint>{t.idle}</IdleHint>}
        {outcome && !outcome.ok && (incomplete ? <IdleHint>{translateMessage(outcome.error, t.rules)}</IdleHint> : <StatusMessage tone="error">{translateMessage(outcome.error, t.rules)}</StatusMessage>)}
        {outcome?.ok && (
          <div className="flex flex-col gap-3" aria-live="polite">
            <ResultRow label={t.answer} value={outcome.result.value} emphasis />
            <p className="text-[0.95rem]">{translateMessage(outcome.result.sentence, t.rules)}</p>
            <p className="text-sm text-muted">
              {t.calculatedAs} <code dir="ltr" className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em]">{outcome.result.formula}</code>
            </p>
          </div>
        )}
      </Panel>
    </Workspace>
  );
}
