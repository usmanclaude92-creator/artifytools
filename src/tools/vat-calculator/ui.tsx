"use client";

import { useMemo, useState } from "react";
import { IdleHint, Panel, ResultRow, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { Field, Segmented, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { translateMessage, type MessageRule } from "@/lib/translate-message";
import { calculateVat, type VatMode } from "./logic";

const rulesAr: MessageRule[] = [
  [/^Enter an amount\.$/, "أدخل مبلغًا."],
  [/^Enter a VAT rate\.$/, "أدخل نسبة الضريبة."],
  [/^The amount isn't a valid number\.$/, "المبلغ ليس رقمًا صحيحًا."],
  [/^The VAT rate isn't a valid number\.$/, "نسبة الضريبة ليست رقمًا صحيحًا."],
  [/^The VAT rate can't be negative\.$/, "لا يمكن أن تكون نسبة الضريبة سالبة."],
  [/^The VAT rate can't exceed 100%\.$/, "لا يمكن أن تتجاوز نسبة الضريبة 100%."],
];

const strings = {
  en: {
    quickRates: ["5", "10", "20", "25"],
    calculate: "Calculate", direction: "Direction", add: "Add VAT (net → gross)", remove: "Remove VAT (gross → net)",
    amountNet: "Amount excluding VAT (net)", amountGross: "Amount including VAT (gross)", eg: "e.g.", rate: "VAT rate (%)", rateHint: "Enter the rate that applies to your transaction.",
    quick: "Quick rates", quickFill: "Quick fill:", result: "Result", idle: "Enter an amount to see the net, VAT, and gross figures.",
    net: "Net (excluding VAT)", vatAt: (r: string) => `VAT at ${r}`, gross: "Gross (including VAT)", netCopy: "net amount", vatCopy: "VAT amount", grossCopy: "gross amount", rules: null,
  },
  ar: {
    quickRates: ["5", "10", "15", "20"],
    calculate: "الحساب", direction: "الاتجاه", add: "إضافة الضريبة (صافٍ ← إجمالي)", remove: "استخراج الضريبة (إجمالي ← صافٍ)",
    amountNet: "المبلغ دون الضريبة (الصافي)", amountGross: "المبلغ شاملًا الضريبة (الإجمالي)", eg: "مثال:", rate: "نسبة الضريبة (%)", rateHint: "أدخل النسبة التي تنطبق على معاملتك.",
    quick: "نسب سريعة", quickFill: "تعبئة سريعة:", result: "النتيجة", idle: "أدخل مبلغًا لترى الصافي والضريبة والإجمالي.",
    net: "الصافي (دون الضريبة)", vatAt: (r: string) => `الضريبة بنسبة ${r}`, gross: "الإجمالي (شاملًا الضريبة)", netCopy: "المبلغ الصافي", vatCopy: "مبلغ الضريبة", grossCopy: "المبلغ الإجمالي", rules: rulesAr,
  },
};

export default function VatCalculator() {
  const t = strings[useLocale()];
  const ui = useMessages().ui;
  const quickRates = t.quickRates;
  const [mode, setMode] = useState<VatMode>("add");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("20");
  const touched = amount.trim() !== "";
  const outcome = useMemo(() => (touched ? calculateVat(mode, amount, rate) : null), [mode, amount, rate, touched]);

  return (
    <Workspace>
      <Panel title={t.calculate}>
        <Segmented
          legend={t.direction}
          value={mode}
          onChange={setMode}
          options={[
            { value: "add", label: t.add },
            { value: "remove", label: t.remove },
          ]}
        />
        <Field label={mode === "add" ? t.amountNet : t.amountGross}>
          {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`${t.eg} 100.00`} />}
        </Field>
        <Field label={t.rate} hint={t.rateHint}>
          {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={rate} onChange={(e) => setRate(e.target.value)} />}
        </Field>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.quick}>
          <span className="text-sm text-muted">{t.quickFill}</span>
          {quickRates.map((r) => (
            <Button key={r} variant="secondary" size="sm" onClick={() => setRate(r)} aria-pressed={rate === r}>
              {r}%
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => { setAmount(""); setRate("20"); }} disabled={!touched && rate === "20"}>
            <Icon name="rotate-ccw" size={16} /> {ui.reset}
          </Button>
        </div>
      </Panel>

      <Panel title={t.result}>
        {!outcome && <IdleHint>{t.idle}</IdleHint>}
        {outcome && !outcome.ok && <StatusMessage tone="error">{translateMessage(outcome.error, t.rules)}</StatusMessage>}
        {outcome?.ok && (
          <div className="flex flex-col gap-3" aria-live="polite">
            <ResultRow label={t.net} value={outcome.result.net} copyLabel={t.netCopy} />
            <ResultRow label={t.vatAt(outcome.result.rate)} value={outcome.result.vat} copyLabel={t.vatCopy} />
            <ResultRow label={t.gross} value={outcome.result.gross} copyLabel={t.grossCopy} emphasis />
          </div>
        )}
      </Panel>
    </Workspace>
  );
}
