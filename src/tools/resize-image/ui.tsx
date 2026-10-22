"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DownloadAllButton, FileDropZone, FileList, FileProcessingError, useFileQueue } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { DownloadButton } from "@/components/ui/actions";
import { Field, Segmented, Select, TextInput } from "@/components/ui/form";
import { cx } from "@/components/ui/cx";
import { useLocale } from "@/components/i18n/locale-provider";
import { baseName, safeFileName } from "@/lib/files/names";
import { formatBytes } from "@/lib/files/size";
import { EXTENSIONS, type OutputFormat } from "@/lib/images/compress";
import { encodePlan, ImageReadError, loadImage, originalFormat } from "@/lib/images/encode";
import { parseDimension, planResize, type FitMode, type ResizeSpec } from "@/lib/images/resize";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
type Mode = "pixels" | "percent";
type FormatChoice = "original" | OutputFormat;
const PRESETS = [
  { id: "square", w: 1080, h: 1080 },
  { id: "story", w: 1080, h: 1920 },
  { id: "hd", w: 1920, h: 1080 },
  { id: "thumb", w: 1280, h: 720 },
  { id: "header", w: 1500, h: 500 },
  { id: "profile", w: 500, h: 500 },
] as const;
const PERCENTS = [25, 50, 75];

const strings = {
  en: {
    settings: "New size", how: "Resize", modes: { pixels: "By pixels", percent: "By percentage" } as Record<Mode, string>,
    width: "Width (px)", height: "Height (px)", sizeHint: "Fill in one side to keep the proportions, or both for an exact size.",
    fit: "When both sides are set", fits: { fit: "Fit inside (keep proportions)", fill: "Fill and crop to exact size", pad: "Exact size with borders", stretch: "Stretch to exact size" } as Record<FitMode, string>,
    presets: "Quick sizes", presetNames: { square: "Square post", story: "Story / Reel", hd: "Full HD", thumb: "Video thumbnail", header: "Header / banner", profile: "Profile photo" } as Record<string, string>,
    percent: "Percentage", percentHint: "100% is the original size.", format: "Output format", formats: { original: "Same as original", jpeg: "JPG", png: "PNG", webp: "WebP" } as Record<FormatChoice, string>,
    sizeError: "Enter whole numbers up to 16000.", percentError: "Enter a percentage above 0 that keeps the image under 16000 px.",
    add: "Add images", types: "JPG, PNG or WebP",
    errors: { decode: "This image couldn't be read. It may be damaged or in an unsupported format.", tooLarge: "This image is too large (over 16,000 pixels on a side).", size: "This size is too large for this image." },
  },
  ar: {
    settings: "المقاس الجديد", how: "تغيير الحجم", modes: { pixels: "بالبكسل", percent: "بالنسبة المئوية" } as Record<Mode, string>,
    width: "العرض (بكسل)", height: "الارتفاع (بكسل)", sizeHint: "املأ بُعدًا واحدًا للحفاظ على النسبة، أو البُعدين للحصول على مقاس دقيق.",
    fit: "عند تحديد البُعدين", fits: { fit: "احتواء داخل المقاس (مع الحفاظ على النسبة)", fill: "ملء المقاس وقص الزائد", pad: "مقاس دقيق مع حواف", stretch: "تمديد إلى المقاس الدقيق" } as Record<FitMode, string>,
    presets: "مقاسات سريعة", presetNames: { square: "منشور مربع", story: "ستوري / ريلز", hd: "Full HD", thumb: "صورة مصغّرة للفيديو", header: "غلاف / بانر", profile: "صورة الملف الشخصي" } as Record<string, string>,
    percent: "النسبة المئوية", percentHint: "100% هي المقاس الأصلي.", format: "صيغة الملف الناتج", formats: { original: "مثل الأصل", jpeg: "JPG", png: "PNG", webp: "WebP" } as Record<FormatChoice, string>,
    sizeError: "أدخل أعدادًا صحيحة حتى 16000.", percentError: "أدخل نسبة أكبر من 0 تُبقي الصورة أقل من 16000 بكسل.",
    add: "أضف الصور", types: "JPG أو PNG أو WebP",
    errors: { decode: "تعذّرت قراءة هذه الصورة، وقد تكون تالفة أو بصيغة غير مدعومة.", tooLarge: "هذه الصورة كبيرة جدًا (أكثر من 16,000 بكسل في أحد أبعادها).", size: "هذا المقاس كبير جدًا لهذه الصورة." },
  },
};

interface Output {
  blob: Blob;
  name: string;
  from: string;
  to: string;
}

export default function ResizeImage() {
  const locale = useLocale();
  const t = strings[locale];
  const [mode, setMode] = useState<Mode>("pixels");
  const [widthText, setWidthText] = useState("1080");
  const [heightText, setHeightText] = useState("");
  const [fit, setFit] = useState<FitMode>("fill");
  const [percentText, setPercentText] = useState("50");
  const [format, setFormat] = useState<FormatChoice>("original");

  const spec = useMemo((): ResizeSpec | null => {
    if (mode === "percent") {
      const p = Number(percentText.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace("%", "").trim());
      return Number.isFinite(p) && p > 0 && p <= 1000 ? { kind: "percent", percent: p } : null;
    }
    const w = parseDimension(widthText), h = parseDimension(heightText);
    if (Number.isNaN(w) || Number.isNaN(h) || (w === null && h === null) || (w ?? 0) > 16000 || (h ?? 0) > 16000 || w === 0 || h === 0) return null;
    return { kind: "pixels", width: w, height: h, fit };
  }, [mode, percentText, widthText, heightText, fit]);

  const settings = useRef({ spec, format });
  const q = useFileQueue<Output>(
    async (file) => {
      const s = settings.current;
      let img;
      try {
        img = await loadImage(file);
      } catch (e) {
        throw new FileProcessingError(e instanceof ImageReadError && e.message === "too-large" ? t.errors.tooLarge : t.errors.decode);
      }
      try {
        const plan = s.spec && planResize(img, s.spec);
        if (!plan) throw new FileProcessingError(t.errors.size);
        const fmt = s.format === "original" ? originalFormat(file.type) : s.format;
        const out = await encodePlan(img.bitmap, plan, fmt, 0.9, img.hasAlpha);
        const name = `${safeFileName(baseName(file.name), "image")}-${out.width}x${out.height}${EXTENSIONS[out.format]}`;
        return { blob: out.blob, name, from: `${img.width}×${img.height}`, to: `${out.width}×${out.height}` };
      } finally {
        img.bitmap.close();
      }
    },
    { concurrency: 2 },
  );

  // Apply new settings shortly after the last change, so typing "1080" doesn't redo the work four times.
  const { rerun, items } = q;
  const hasItems = items.length > 0;
  useEffect(() => {
    if (settings.current.spec === spec && settings.current.format === format) return;
    settings.current = { spec, format };
    if (!spec || !hasItems) return;
    const id = setTimeout(() => rerun("all"), 350);
    return () => clearTimeout(id);
  }, [spec, format, hasItems, rerun]);

  const done = q.items.filter((it) => it.status === "done" && it.result);
  const both = mode === "pixels" && parseDimension(widthText) && parseDimension(heightText);

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.settings}>
        <Segmented legend={t.how} value={mode} onChange={setMode} options={(["pixels", "percent"] as Mode[]).map((v) => ({ value: v, label: t.modes[v] }))} />
        {mode === "pixels" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t.width} error={!spec ? t.sizeError : null}>
                {(p) => <TextInput {...p} dir="ltr" inputMode="numeric" value={widthText} onChange={(e) => setWidthText(e.target.value)} autoComplete="off" />}
              </Field>
              <Field label={t.height} hint={t.sizeHint}>
                {(p) => <TextInput {...p} dir="ltr" inputMode="numeric" value={heightText} onChange={(e) => setHeightText(e.target.value)} autoComplete="off" />}
              </Field>
              <Field label={t.fit}>
                {(p) => (
                  <Select {...p} value={fit} onChange={(e) => setFit(e.target.value as FitMode)} disabled={!both}>
                    {(["fill", "fit", "pad", "stretch"] as FitMode[]).map((v) => <option key={v} value={v}>{t.fits[v]}</option>)}
                  </Select>
                )}
              </Field>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">{t.presets}</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((pr) => {
                  const on = parseDimension(widthText) === pr.w && parseDimension(heightText) === pr.h;
                  return (
                    <button
                      key={pr.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => { setWidthText(String(pr.w)); setHeightText(String(pr.h)); }}
                      className={cx("min-h-9 rounded-full border px-3 text-sm font-medium", on ? "border-accent bg-accent-soft text-accent-text" : "border-line-strong hover:bg-surface-2")}
                    >
                      {t.presetNames[pr.id]} <bdi dir="ltr" className="text-muted">{pr.w}×{pr.h}</bdi>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <Field label={t.percent} hint={t.percentHint} error={!spec ? t.percentError : null}>
            {(p) => (
              <div className="flex flex-wrap items-center gap-2">
                <TextInput {...p} dir="ltr" inputMode="decimal" value={percentText} onChange={(e) => setPercentText(e.target.value)} className="max-w-32" autoComplete="off" />
                {PERCENTS.map((n) => (
                  <button key={n} type="button" aria-pressed={percentText === String(n)} onClick={() => setPercentText(String(n))} className={cx("min-h-9 rounded-full border px-3 text-sm font-medium", percentText === String(n) ? "border-accent bg-accent-soft text-accent-text" : "border-line-strong hover:bg-surface-2")}>
                    <bdi>{n}%</bdi>
                  </button>
                ))}
              </div>
            )}
          </Field>
        )}
        <Field label={t.format}>
          {(p) => (
            <Select {...p} value={format} onChange={(e) => setFormat(e.target.value as FormatChoice)} className="max-w-xs">
              {(["original", "jpeg", "png", "webp"] as FormatChoice[]).map((v) => <option key={v} value={v}>{t.formats[v]}</option>)}
            </Select>
          )}
        </Field>
      </Panel>

      <Panel title={t.add}>
        <FileDropZone rules={rules} onFiles={q.add} existing={q.items.map((it) => it.file)} typesLabel={t.types} />
        <FileList
          items={q.items}
          onRemove={q.remove}
          onClear={q.clear}
          actions={(it) =>
            it.result && (
              <>
                <span className="me-1 text-sm text-success"><bdi dir="ltr">{it.result.from}</bdi>{locale === "ar" ? " ← " : " → "}<bdi dir="ltr">{it.result.to}</bdi> · {formatBytes(it.result.blob.size, locale)}</span>
                <DownloadButton filename={it.result.name} getBlob={() => it.result!.blob} />
              </>
            )
          }
        />
        {done.length > 1 && (
          <div className="border-t border-line pt-4">
            <DownloadAllButton files={done.map((it) => ({ name: it.result!.name, blob: it.result!.blob }))} zipName="resized-images.zip" disabled={q.busy} />
          </div>
        )}
      </Panel>
    </div>
  );
}
