"use client";

import { useEffect, useMemo, useState } from "react";
import { IdleHint, Panel, Workspace } from "@/components/tools/parts";
import { CopyButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Checkbox, Field, Select, TextInput } from "@/components/ui/form";
import { useLocale } from "@/components/i18n/locale-provider";
import { amountInArabic, amountInEnglish, currencies, getCurrency, parseAmount } from "@/lib/words";

const STORAGE_KEY = "artify-amount-currency";

const strings = {
  en: {
    input: "Amount", amount: "Amount", amountHint: (d: number) => (d ? `Up to ${d} decimal places for this currency.` : "Whole numbers only."),
    currency: "Currency", only: "Add “Only” / «فقط … لا غير»", fraction: "Write decimals as a fraction (50/1000)", upper: "English in CAPITALS",
    arabic: "Arabic", english: "English", idle: "Type an amount to see it in words.", invalid: (d: number) => `Enter a number like 1250${d ? `.${"5".padEnd(d, "0")}` : ""}, with at most ${d} decimal places and no more than 999,999,999,999.`,
    copyAr: "Arabic text", copyEn: "English text",
  },
  ar: {
    input: "المبلغ", amount: "المبلغ", amountHint: (d: number) => (d ? `حتى ${d} منازل عشرية لهذه العملة.` : "أعداد صحيحة فقط."),
    currency: "العملة", only: "إضافة «فقط … لا غير» / “Only”", fraction: "كتابة الكسور ككسر (50/1000)", upper: "الإنجليزية بأحرف كبيرة",
    arabic: "بالعربية", english: "بالإنجليزية", idle: "اكتب مبلغًا لتراه مكتوبًا بالحروف.", invalid: (d: number) => `أدخل رقمًا مثل 1250${d ? `.${"5".padEnd(d, "0")}` : ""}، بحد أقصى ${d} منازل عشرية ولا يتجاوز 999,999,999,999.`,
    copyAr: "النص العربي", copyEn: "النص الإنجليزي",
  },
};

const NAMES: Record<string, { en: string; ar: string }> = {
  OMR: { en: "Omani Rial", ar: "ريال عماني" }, AED: { en: "UAE Dirham", ar: "درهم إماراتي" }, SAR: { en: "Saudi Riyal", ar: "ريال سعودي" },
  KWD: { en: "Kuwaiti Dinar", ar: "دينار كويتي" }, BHD: { en: "Bahraini Dinar", ar: "دينار بحريني" }, QAR: { en: "Qatari Riyal", ar: "ريال قطري" },
  JOD: { en: "Jordanian Dinar", ar: "دينار أردني" }, EGP: { en: "Egyptian Pound", ar: "جنيه مصري" }, USD: { en: "US Dollar", ar: "دولار أمريكي" },
  EUR: { en: "Euro", ar: "يورو" }, GBP: { en: "Pound Sterling", ar: "جنيه إسترليني" }, INR: { en: "Indian Rupee", ar: "روبية هندية" }, PKR: { en: "Pakistani Rupee", ar: "روبية باكستانية" },
};

export default function AmountInWords() {
  const locale = useLocale();
  const t = strings[locale];
  const [amount, setAmount] = useState("");
  const [code, setCode] = useState(locale === "ar" ? "SAR" : "USD");
  const [only, setOnly] = useState(true);
  const [fractionAsNumber, setFractionAsNumber] = useState(false);
  const [upper, setUpper] = useState(false);

  // Remember the last currency on this device (a convenience; the page works without it).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a saved preference after hydration
      if (saved && getCurrency(saved)) setCode(saved);
    } catch {}
  }, []);
  function chooseCurrency(c: string) {
    setCode(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {}
  }

  const currency = getCurrency(code)!;
  const decimals = currency.minor === 1000 ? 3 : currency.minor === 100 ? 2 : 0;
  const parsed = useMemo(() => (amount.trim() ? parseAmount(amount, currency.minor) : null), [amount, currency.minor]);
  const arabic = parsed ? amountInArabic(parsed.whole, parsed.fraction, currency, { only, fractionAsNumber }) : "";
  const english = parsed ? amountInEnglish(parsed.whole, parsed.fraction, currency, { only, fractionAsNumber, uppercase: upper }) : "";

  return (
    <Workspace>
      <Panel title={t.input}>
        <Field label={t.amount} hint={t.amountHint(decimals)} error={amount.trim() && !parsed ? t.invalid(decimals) : null}>
          {(p) => <TextInput {...p} dir="ltr" inputMode="decimal" autoComplete="off" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={decimals === 3 ? "1250.750" : "1250.50"} className="text-lg" />}
        </Field>
        <Field label={t.currency}>
          {(p) => (
            <Select {...p} value={code} onChange={(e) => chooseCurrency(e.target.value)}>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.code} · {NAMES[c.code]?.[locale] ?? c.code}</option>
              ))}
            </Select>
          )}
        </Field>
        <div>
          <Checkbox label={t.only} checked={only} onChange={(e) => setOnly(e.target.checked)} />
          <Checkbox label={t.fraction} checked={fractionAsNumber} onChange={(e) => setFractionAsNumber(e.target.checked)} disabled={!currency.minor} />
          <Checkbox label={t.upper} checked={upper} onChange={(e) => setUpper(e.target.checked)} />
        </div>
      </Panel>

      <Panel title={locale === "ar" ? `${t.arabic} · ${t.english}` : `${t.english} · ${t.arabic}`}>
        {!parsed && !amount.trim() && <IdleHint>{t.idle}</IdleHint>}
        {amount.trim() && !parsed && <StatusMessage tone="error">{t.invalid(decimals)}</StatusMessage>}
        {parsed && (
          <div className="flex flex-col gap-4" aria-live="polite">
            {(locale === "ar" ? (["ar", "en"] as const) : (["en", "ar"] as const)).map((lang) => (
              <div key={lang} className="rounded-lg bg-surface-2 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-muted">{lang === "ar" ? t.arabic : t.english}</p>
                  <CopyButton value={lang === "ar" ? arabic : english} ariaLabel={lang === "ar" ? t.copyAr : t.copyEn} />
                </div>
                <p dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} className={lang === "ar" ? "text-lg leading-loose" : "text-lg leading-relaxed"} style={lang === "ar" ? { fontFamily: "var(--font-arabic), 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif" } : undefined}>
                  {lang === "ar" ? arabic : english}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </Workspace>
  );
}
