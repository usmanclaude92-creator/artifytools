"use client";

import { useMemo, useState } from "react";
import { IdleHint, Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/actions";
import { Checkbox, Field, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { cx } from "@/components/ui/cx";
import { useIsClient } from "@/components/ui/use-is-client";
import { useLocale } from "@/components/i18n/locale-provider";
import { translateMessage, type MessageRule } from "@/lib/translate-message";
import { generatePassword, MAX_LENGTH, MIN_LENGTH, strengthLabel, type PasswordOptions, type PasswordOutcome } from "./logic";

const rulesAr: MessageRule[] = [
  [/^Select at least one character type\.$/, "اختر نوعًا واحدًا على الأقل من الأحرف."],
  [/^Length must be between (\d+) and (\d+)\.$/, "يجب أن يكون الطول بين $1 و$2."],
];

const strings = {
  en: {
    settings: "Settings", length: (a: number, b: number) => `Length (${a}–${b})`, lengthError: (a: number, b: number) => `Enter a whole number from ${a} to ${b}.`, slider: "Password length slider",
    include: "Include", types: { lowercase: "Lowercase (a–z)", uppercase: "Uppercase (A–Z)", digits: "Digits (0–9)", symbols: "Symbols (!@#$…)" }, lookAlike: "Exclude look-alike characters", lookAlikeHint: "Removes I, l, 1, O, 0, o",
    yours: "Your password", generating: "Generating…", generateNew: "Generate new", copy: "Copy password", copied: "Password copied", hide: "Hide", show: "Show",
    strength: (s: string) => `Strength: ${s}`, levels: { Weak: "Weak", Fair: "Fair", Strong: "Strong", "Very strong": "Very strong" } as Record<string, string>, entropy: (b: number) => `≈ ${b} bits of entropy`,
    note: "Generated on your device and never sent anywhere. Save it in a password manager and use a unique password for every account.", rules: null,
  },
  ar: {
    settings: "الإعدادات", length: (a: number, b: number) => `الطول (${a}–${b})`, lengthError: (a: number, b: number) => `أدخل عددًا صحيحًا من ${a} إلى ${b}.`, slider: "شريط طول كلمة المرور",
    include: "تضمين", types: { lowercase: "أحرف صغيرة (a–z)", uppercase: "أحرف كبيرة (A–Z)", digits: "أرقام (0–9)", symbols: "رموز (!@#$…)" }, lookAlike: "استبعاد الأحرف المتشابهة", lookAlikeHint: "يحذف I وl و1 وO و0 وo",
    yours: "كلمة المرور", generating: "جارٍ التوليد…", generateNew: "توليد كلمة جديدة", copy: "نسخ كلمة المرور", copied: "تم نسخ كلمة المرور", hide: "إخفاء", show: "إظهار",
    strength: (s: string) => `القوة: ${s}`, levels: { Weak: "ضعيفة", Fair: "مقبولة", Strong: "قوية", "Very strong": "قوية جدًا" } as Record<string, string>, entropy: (b: number) => `≈ ${b} بت من الإنتروبيا`,
    note: "وُلّدت على جهازك ولم تُرسل إلى أي مكان. احفظها في مدير كلمات مرور واستخدم كلمة مرور مختلفة لكل حساب.", rules: rulesAr,
  },
};

const initial: PasswordOptions = { length: 20, lowercase: true, uppercase: true, digits: true, symbols: true, excludeAmbiguous: false };

export default function PasswordGenerator() {
  const t = strings[useLocale()];
  const [opts, setOpts] = useState<PasswordOptions>(initial);
  const [lengthText, setLengthText] = useState(String(initial.length));
  const [generated, setOutcome] = useState<PasswordOutcome | null>(null);
  const [visible, setVisible] = useState(true);
  // Random output must not be part of the server-rendered HTML, so the first password is made after hydration.
  const isClient = useIsClient();
  const firstPassword = useMemo(() => (isClient ? generatePassword(initial) : null), [isClient]);
  const outcome = generated ?? firstPassword;

  function apply(next: PasswordOptions) {
    setOpts(next);
    setOutcome(generatePassword(next));
  }

  const lengthNum = Number(lengthText);
  const lengthValid = Number.isInteger(lengthNum) && lengthNum >= MIN_LENGTH && lengthNum <= MAX_LENGTH;
  const typeKeys = ["lowercase", "uppercase", "digits", "symbols"] as const;
  const strength = outcome?.ok ? strengthLabel(outcome.entropyBits) : null;

  return (
    <Workspace className="lg:grid-cols-[2fr_3fr]">
      <Panel title={t.settings}>
        <div className="flex flex-col gap-3">
          <Field label={t.length(MIN_LENGTH, MAX_LENGTH)} error={lengthValid ? null : t.lengthError(MIN_LENGTH, MAX_LENGTH)}>
            {(p) => (
              <TextInput
                {...p}
                inputMode="numeric"
                value={lengthText}
                onChange={(e) => {
                  setLengthText(e.target.value);
                  const n = Number(e.target.value);
                  if (Number.isInteger(n) && n >= MIN_LENGTH && n <= MAX_LENGTH) apply({ ...opts, length: n });
                }}
              />
            )}
          </Field>
          <input
            type="range"
            min={MIN_LENGTH}
            max={MAX_LENGTH}
            value={lengthValid ? lengthNum : opts.length}
            aria-label={t.slider}
            onChange={(e) => {
              setLengthText(e.target.value);
              apply({ ...opts, length: Number(e.target.value) });
            }}
            className="h-11 w-full cursor-pointer accent-[var(--accent)]"
          />
        </div>
        <fieldset>
          <legend className="mb-1 text-sm font-medium">{t.include}</legend>
          {typeKeys.map((k) => (
            <Checkbox
              key={k}
              label={t.types[k]}
              checked={opts[k]}
              onChange={(e) => apply({ ...opts, [k]: e.target.checked })}
            />
          ))}
        </fieldset>
        <Checkbox label={t.lookAlike} hint={t.lookAlikeHint} checked={opts.excludeAmbiguous} onChange={(e) => apply({ ...opts, excludeAmbiguous: e.target.checked })} />
      </Panel>

      <Panel title={t.yours}>
        {!outcome && <IdleHint>{t.generating}</IdleHint>}
        {outcome && !outcome.ok && <StatusMessage tone="error">{translateMessage(outcome.error, t.rules)}</StatusMessage>}
        {outcome?.ok && strength && (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-line bg-surface-2 p-4">
              <output aria-live="polite" dir="ltr" className={cx("block break-all font-mono text-xl leading-relaxed sm:text-2xl", !visible && "tracking-widest")}>
                {visible ? outcome.password : "•".repeat(outcome.password.length)}
              </output>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => apply(opts)}>
                <Icon name="refresh-cw" size={18} /> {t.generateNew}
              </Button>
              <CopyButton value={outcome.password} size="md" label={t.copy} toastMessage={t.copied} />
              <Button variant="ghost" onClick={() => setVisible((v) => !v)} aria-pressed={!visible}>
                {visible ? t.hide : t.show}
              </Button>
            </div>
            <div>
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span className="font-medium">{t.strength(t.levels[strength.label] ?? strength.label)}</span>
                <span className="text-muted">{t.entropy(outcome.entropyBits)}</span>
              </div>
              <div className="flex gap-1.5" aria-hidden="true">
                {[1, 2, 3, 4].map((n) => (
                  <span key={n} className={cx("h-2 flex-1 rounded-full", n <= strength.level ? "bg-accent" : "bg-surface-2")} />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted">{t.note}</p>
          </div>
        )}
      </Panel>
    </Workspace>
  );
}
