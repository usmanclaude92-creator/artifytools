"use client";

import { useMemo, useState } from "react";
import { IdleHint, Panel, ResultRow, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { Field, Segmented, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { translateMessage, type MessageRule } from "@/lib/translate-message";
import { discountFromPrices, priceAfterDiscount } from "./logic";

const subjectAr: Record<string, string> = { "The discount": "نسبة الخصم", "The extra discount": "نسبة الخصم الإضافي" };

const rulesAr: MessageRule[] = [
  [/^Enter the original price\.$/, "أدخل السعر الأصلي."],
  [/^Enter a discount percentage\.$/, "أدخل نسبة الخصم."],
  [/^The original price isn't a valid number\.$/, "السعر الأصلي ليس رقمًا صحيحًا."],
  [/^The original price can't be negative\.$/, "لا يمكن أن يكون السعر الأصلي سالبًا."],
  [/^Enter both the original and the sale price\.$/, "أدخل السعر الأصلي وسعر البيع."],
  [/^The sale price isn't a valid number\.$/, "سعر البيع ليس رقمًا صحيحًا."],
  [/^Prices can't be negative\.$/, "لا يمكن أن تكون الأسعار سالبة."],
  [/^The original price can't be zero\.$/, "لا يمكن أن يكون السعر الأصلي صفرًا."],
  [/^(The (?:extra )?discount) isn't a valid number\.$/, (s) => `${subjectAr[s] ?? s} ليست رقمًا صحيحًا.`],
  [/^(The (?:extra )?discount) can't be negative\.$/, (s) => `لا يمكن أن تكون ${subjectAr[s] ?? s} سالبة.`],
  [/^(The (?:extra )?discount) can't exceed 100%\.$/, (s) => `لا يمكن أن تتجاوز ${subjectAr[s] ?? s} 100%.`],
];

const strings = {
  en: {
    calculate: "Calculate", legend: "What do you want to know?", priceMode: "Price after discount", percentMode: "Find the discount", original: "Original price", eg: "e.g.",
    discount: "Discount (%)", extra: "Extra discount (%) — optional", extraHint: "Applied to the reduced price.", sale: "Sale price", result: "Result", idle: "Enter a price and discount to see your savings.",
    pay: "You pay", save: "You save", effective: "Effective discount", discountResult: "Discount", saved: "Amount saved", rules: null,
  },
  ar: {
    calculate: "الحساب", legend: "ماذا تريد أن تعرف؟", priceMode: "السعر بعد الخصم", percentMode: "معرفة نسبة الخصم", original: "السعر الأصلي", eg: "مثال:",
    discount: "الخصم (%)", extra: "خصم إضافي (%) — اختياري", extraHint: "يُطبَّق على السعر المخفَّض.", sale: "سعر البيع", result: "النتيجة", idle: "أدخل السعر والخصم لترى مقدار التوفير.",
    pay: "ستدفع", save: "ستوفّر", effective: "الخصم الفعلي", discountResult: "نسبة الخصم", saved: "مقدار التوفير", rules: rulesAr,
  },
};

type Mode = "price" | "percent";

export default function DiscountCalculator() {
  const t = strings[useLocale()];
  const ui = useMessages().ui;
  const [mode, setMode] = useState<Mode>("price");
  const [original, setOriginal] = useState("");
  const [discount, setDiscount] = useState("");
  const [extra, setExtra] = useState("");
  const [sale, setSale] = useState("");

  const touched = original.trim() !== "" || (mode === "price" ? discount.trim() !== "" || extra.trim() !== "" : sale.trim() !== "");
  const outcome = useMemo(() => {
    if (!touched) return null;
    return mode === "price" ? priceAfterDiscount(original, discount, extra) : discountFromPrices(original, sale);
  }, [mode, original, discount, extra, sale, touched]);
  const incomplete = mode === "price" ? !original.trim() || !discount.trim() : !original.trim() || !sale.trim();

  return (
    <Workspace>
      <Panel title={t.calculate}>
        <Segmented
          legend={t.legend}
          value={mode}
          onChange={setMode}
          options={[
            { value: "price", label: t.priceMode },
            { value: "percent", label: t.percentMode },
          ]}
        />
        <Field label={t.original}>
          {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={original} onChange={(e) => setOriginal(e.target.value)} placeholder={`${t.eg} 80.00`} />}
        </Field>
        {mode === "price" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.discount}>
              {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder={`${t.eg} 25`} />}
            </Field>
            <Field label={t.extra} hint={t.extraHint}>
              {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder={`${t.eg} 10`} />}
            </Field>
          </div>
        ) : (
          <Field label={t.sale}>
            {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={sale} onChange={(e) => setSale(e.target.value)} placeholder={`${t.eg} 60.00`} />}
          </Field>
        )}
        <div>
          <Button variant="ghost" size="sm" disabled={!touched} onClick={() => { setOriginal(""); setDiscount(""); setExtra(""); setSale(""); }}>
            <Icon name="rotate-ccw" size={16} /> {ui.reset}
          </Button>
        </div>
      </Panel>

      <Panel title={t.result}>
        {!outcome && <IdleHint>{t.idle}</IdleHint>}
        {outcome && !outcome.ok && (incomplete ? <IdleHint>{translateMessage(outcome.error, t.rules)}</IdleHint> : <StatusMessage tone="error">{translateMessage(outcome.error, t.rules)}</StatusMessage>)}
        {outcome?.ok && (
          <div className="flex flex-col gap-3" aria-live="polite">
            {mode === "price" ? (
              <>
                <ResultRow label={t.pay} value={outcome.result.final} emphasis />
                <ResultRow label={t.save} value={outcome.result.saved} />
                <ResultRow label={t.effective} value={outcome.result.effectivePercent} />
              </>
            ) : (
              <>
                <ResultRow label={t.discountResult} value={outcome.result.effectivePercent} emphasis />
                <ResultRow label={t.saved} value={outcome.result.saved} />
                <ResultRow label={t.sale} value={outcome.result.final} />
              </>
            )}
          </div>
        )}
      </Panel>
    </Workspace>
  );
}
