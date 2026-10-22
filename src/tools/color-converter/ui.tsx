"use client";

import { useMemo, useState } from "react";
import { Panel, ResultRow, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { translateMessage, type MessageRule } from "@/lib/translate-message";
import { contrastRatio, formatHsl, formatRgb, parseColor, rgbToHex, rgbToHsl, type Rgb } from "./logic";

const rulesAr: MessageRule[] = [
  [/^Enter a colour such as/, "أدخل لونًا مثل #5B3DF5 أو rgb(91, 61, 245) أو hsl(250, 90%, 60%)."],
  [/^Transparency \(alpha\) isn't supported/, "الشفافية (alpha) غير مدعومة. استخدم لون hex من 3 أو 6 خانات."],
  [/^Couldn't read that colour\. Use/, "تعذّرت قراءة هذا اللون. استخدم رمز hex أو rgb(r, g, b) أو hsl(h, s%, l%)."],
  [/^Couldn't read that colour — each value must be a number\.$/, "تعذّرت قراءة هذا اللون — يجب أن تكون كل قيمة رقمًا."],
  [/^RGB values must be between 0 and 255\.$/, "يجب أن تكون قيم RGB بين 0 و255."],
  [/^HSL saturation and lightness must be between 0% and 100%\.$/, "يجب أن يكون التشبع والإضاءة في HSL بين 0% و100%."],
];

const strings = {
  en: {
    checks: ["AA normal text (4.5:1)", "AA large text (3:1)", "AAA normal text (7:1)"], sample: (fg: string, bg: string) => `Sample text colored ${fg} on ${bg}`, sampleText: "Aa — Sample text", pass: "Pass", fail: "Fail",
    pick: "Pick or enter a color", value: "Color value", valueHint: "HEX, rgb(), hsl() or three numbers", picker: "Picker", preview: (hex: string) => `Preview of ${hex}`, noPreview: "No valid color to preview",
    converted: "Converted values", contrast: "Contrast (WCAG)", onWhite: "This color on white", whiteOn: "White on this color", blackOn: "Black on this color", rules: null,
  },
  ar: {
    checks: ["AA نص عادي (4.5:1)", "AA نص كبير (3:1)", "AAA نص عادي (7:1)"], sample: (fg: string, bg: string) => `نص تجريبي باللون ${fg} على ${bg}`, sampleText: "أبجد — نص تجريبي", pass: "ناجح", fail: "راسب",
    pick: "اختر لونًا أو أدخله", value: "قيمة اللون", valueHint: "HEX أو rgb()‎ أو hsl()‎ أو ثلاثة أرقام", picker: "المنتقي", preview: (hex: string) => `معاينة ${hex}`, noPreview: "لا يوجد لون صالح للمعاينة",
    converted: "القيم المحوّلة", contrast: "التباين (WCAG)", onWhite: "هذا اللون على الأبيض", whiteOn: "الأبيض على هذا اللون", blackOn: "الأسود على هذا اللون", rules: rulesAr,
  },
};

const DEFAULT = "#5B3DF5";
const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const BLACK: Rgb = { r: 0, g: 0, b: 0 };

function ContrastCard({ label, fg, bg }: { label: string; fg: Rgb; bg: Rgb }) {
  const t = strings[useLocale()];
  const ratio = contrastRatio(fg, bg);
  const checks: [string, boolean][] = [
    [t.checks[0]!, ratio >= 4.5],
    [t.checks[1]!, ratio >= 3],
    [t.checks[2]!, ratio >= 7],
  ];
  return (
    <div className="rounded-md border border-line p-4">
      {/* Sample is generated content on an image-role swatch, so it illustrates the pairing without being page text. */}
      <div
        role="img"
        aria-label={t.sample(rgbToHex(fg), rgbToHex(bg))}
        data-sample={t.sampleText}
        className="mb-3 grid h-14 place-items-center rounded-md text-lg font-semibold before:content-[attr(data-sample)]"
        style={{ background: rgbToHex(bg), color: rgbToHex(fg) }}
      />
      <p className="font-semibold">
        {label}: <span dir="ltr">{ratio.toFixed(2)}:1</span>
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {checks.map(([name, pass]) => (
          <li key={name} className="flex items-center gap-2">
            <Icon name={pass ? "circle-check" : "circle-alert"} size={16} className={pass ? "text-success" : "text-danger"} />
            <span>
              {name}: <strong>{pass ? t.pass : t.fail}</strong>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ColorConverter() {
  const t = strings[useLocale()];
  const ui = useMessages().ui;
  const [value, setValue] = useState(DEFAULT);
  const parsed = useMemo(() => parseColor(value), [value]);
  const rgb = parsed.ok ? parsed.rgb : null;
  const hex = rgb ? rgbToHex(rgb) : DEFAULT;

  return (
    <div className="flex flex-col gap-5">
      <Workspace>
        <Panel title={t.pick}>
          <div className="flex items-end gap-3">
            <Field label={t.value} className="flex-1" error={parsed.ok ? null : translateMessage(parsed.error, t.rules)} hint={t.valueHint}>
              {(p) => <TextInput {...p} value={value} onChange={(e) => setValue(e.target.value)} spellCheck={false} autoComplete="off" dir="ltr" />}
            </Field>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t.picker}
              <input
                type="color"
                value={hex.toLowerCase()}
                onChange={(e) => setValue(e.target.value.toUpperCase())}
                className="h-11 w-16 cursor-pointer rounded-md border border-line-strong bg-surface p-1"
              />
            </label>
          </div>
          <div className="h-28 rounded-lg border border-line" style={{ background: rgb ? hex : "transparent" }} role="img" aria-label={rgb ? t.preview(hex) : t.noPreview} />
          <div>
            <Button variant="ghost" size="sm" onClick={() => setValue(DEFAULT)} disabled={value === DEFAULT}>
              <Icon name="rotate-ccw" size={16} /> {ui.reset}
            </Button>
          </div>
        </Panel>
        <Panel title={t.converted}>
          {rgb ? (
            <div className="flex flex-col gap-3" aria-live="polite">
              <ResultRow label="HEX" value={hex} emphasis />
              <ResultRow label="RGB" value={formatRgb(rgb)} />
              <ResultRow label="HSL" value={formatHsl(rgbToHsl(rgb))} />
            </div>
          ) : (
            <StatusMessage tone="error">{parsed.ok ? "" : translateMessage(parsed.error, t.rules)}</StatusMessage>
          )}
        </Panel>
      </Workspace>
      {rgb && (
        <Panel title={t.contrast}>
          <div className="grid gap-4 md:grid-cols-3">
            <ContrastCard label={t.onWhite} fg={rgb} bg={WHITE} />
            <ContrastCard label={t.whiteOn} fg={WHITE} bg={rgb} />
            <ContrastCard label={t.blackOn} fg={BLACK} bg={rgb} />
          </div>
        </Panel>
      )}
    </div>
  );
}
