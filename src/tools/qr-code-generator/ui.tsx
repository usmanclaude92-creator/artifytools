"use client";

import { useEffect, useMemo, useState } from "react";
import { IdleHint, Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { Field, Select, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Spinner, StatusMessage } from "@/components/ui/feedback";
import {
  errorCorrectionLevels, generateQr, qrContrastWarning, validateQrInput,
  type ErrorCorrection, type QrArtifacts, type QrOptions,
} from "./logic";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { translateMessage, type MessageRule } from "@/lib/translate-message";

const rulesAr: MessageRule[] = [
  [/^Text is too long \(limit (.+) characters\)\.$/, "النص طويل جدًا (الحد $1 حرف)."],
  [/^Choose valid colours\.$/, "اختر ألوانًا صالحة."],
  [/^Low contrast \((.+)\)/, (r) => `تباين منخفض (${r}) — ستفشل كثير من الماسحات في قراءة هذا الرمز. استخدم لونًا أماميًا أغمق بكثير على خلفية أفتح.`],
  [/^The foreground is lighter than the background/, "اللون الأمامي أفتح من الخلفية (رمز معكوس). بعض الماسحات لا تستطيع قراءة رموز QR المعكوسة."],
  [/^That content is too long to fit/, "المحتوى أطول من أن يتسع له رمز QR بهذا المستوى من تصحيح الأخطاء. اختصره أو اختر مستوى أقل."],
  [/^The QR code couldn't be generated\.$/, "تعذّر إنشاء رمز QR."],
];

const levelsAr: Record<string, string> = { L: "منخفض (7%)", M: "متوسط (15%)", Q: "ربعي (25%)", H: "مرتفع (30%)" };

const strings = {
  en: {
    content: "Content & style", text: "Text or URL", errorCorrection: "Error correction", level: (id: string, label: string) => label, pngSize: "PNG size", margin: "Margin", modules: (m: number) => `${m} modules`,
    fg: "Foreground color", bg: "Background color", preview: "Preview", idle: "Enter text or a link to create your QR code.", generating: "Generating", alt: "Generated QR code",
    info: (n: number) => `${n} × ${n} modules · scan with your phone to test before sharing`, png: "Download PNG", svg: "Download SVG", rules: null,
  },
  ar: {
    content: "المحتوى والمظهر", text: "النص أو الرابط", errorCorrection: "تصحيح الأخطاء", level: (id: string, label: string) => levelsAr[id] ?? label, pngSize: "حجم PNG", margin: "الهامش", modules: (m: number) => `${m} وحدات`,
    fg: "اللون الأمامي", bg: "لون الخلفية", preview: "المعاينة", idle: "أدخل نصًا أو رابطًا لإنشاء رمز QR.", generating: "جارٍ الإنشاء", alt: "رمز QR المُنشأ",
    info: (n: number) => `${n} × ${n} وحدة · امسحه بهاتفك لاختباره قبل مشاركته`, png: "تنزيل PNG", svg: "تنزيل SVG", rules: rulesAr,
  },
};

interface Outcome {
  key: string;
  artifacts?: QrArtifacts;
  error?: string;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body = ""] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(head ?? "")?.[1] ?? "image/png";
  const bin = atob(body);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

export default function QrCodeGenerator() {
  const t = strings[useLocale()];
  const ui = useMessages().ui;
  const [text, setText] = useState("");
  const [level, setLevel] = useState<ErrorCorrection>("M");
  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(2);
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#ffffff");
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const options: QrOptions = useMemo(
    () => ({ text, errorCorrection: level, size, margin, foreground: fg, background: bg }),
    [text, level, size, margin, fg, bg],
  );
  const key = JSON.stringify(options);
  const rawValidationError = validateQrInput(options);
  const validationError = rawValidationError ? translateMessage(rawValidationError, t.rules) : null;
  const hasText = text.trim() !== "";

  useEffect(() => {
    if (!hasText || validationError) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const artifacts = await generateQr(options);
        if (!cancelled) setOutcome({ key, artifacts });
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "";
          setOutcome({ key, error: /too big|capacity|amount of data/i.test(msg) ? "That content is too long to fit in a QR code at this error-correction level. Shorten it or choose a lower level." : "The QR code couldn't be generated." });
        }
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, hasText, validationError, options]);

  const current = outcome && outcome.key === key ? outcome : null;
  const rawWarning = qrContrastWarning(fg, bg);
  const warning = rawWarning ? translateMessage(rawWarning, t.rules) : null;
  const svgUrl = current?.artifacts ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(current.artifacts.svg)}` : null;

  return (
    <Workspace className="lg:grid-cols-[3fr_2fr]">
      <Panel
        title={t.content}
        actions={
          <Button variant="ghost" size="sm" disabled={!text} onClick={() => setText("")}>
            <Icon name="rotate-ccw" size={16} /> {ui.clear}
          </Button>
        }
      >
        <Field label={t.text} error={validationError}>
          {(p) => <TextArea {...p} rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="https://example.com" className="font-sans text-base" />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t.errorCorrection}>
            {(p) => (
              <Select {...p} value={level} onChange={(e) => setLevel(e.target.value as ErrorCorrection)}>
                {errorCorrectionLevels.map((l) => (
                  <option key={l.id} value={l.id}>{t.level(l.id, l.label)}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t.pngSize}>
            {(p) => (
              <Select {...p} value={size} onChange={(e) => setSize(Number(e.target.value))}>
                {[256, 512, 1024, 2048].map((s) => (
                  <option key={s} value={s}>{s} × {s} px</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t.margin}>
            {(p) => (
              <Select {...p} value={margin} onChange={(e) => setMargin(Number(e.target.value))}>
                {[0, 1, 2, 4, 6].map((m) => (
                  <option key={m} value={m}>{t.modules(m)}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.fg}>
            {(p) => <input {...p} type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-11 w-full cursor-pointer rounded-md border border-line-strong bg-surface p-1" />}
          </Field>
          <Field label={t.bg}>
            {(p) => <input {...p} type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-11 w-full cursor-pointer rounded-md border border-line-strong bg-surface p-1" />}
          </Field>
        </div>
        {warning && <StatusMessage tone="warning">{warning}</StatusMessage>}
      </Panel>

      <Panel title={t.preview}>
        {!hasText && <IdleHint>{t.idle}</IdleHint>}
        {hasText && validationError && <StatusMessage tone="error">{validationError}</StatusMessage>}
        {hasText && !validationError && !current && <Spinner label={t.generating} />}
        {current?.error && <StatusMessage tone="error">{translateMessage(current.error, t.rules)}</StatusMessage>}
        {current?.artifacts && svgUrl && (
          <div className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL, not a remote asset */}
            <img src={svgUrl} alt={t.alt} width={280} height={280} className="aspect-square w-full max-w-72 rounded-md border border-line" />
            <p className="text-sm text-muted" role="status">
              {t.info(current.artifacts.modules)}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <DownloadButton variant="primary" size="md" label={t.png} filename="qr-code.png" getBlob={() => dataUrlToBlob(current.artifacts!.pngDataUrl)} />
              <DownloadButton size="md" label={t.svg} filename="qr-code.svg" getBlob={() => new Blob([current.artifacts!.svg], { type: "image/svg+xml" })} />
            </div>
          </div>
        )}
      </Panel>
    </Workspace>
  );
}
