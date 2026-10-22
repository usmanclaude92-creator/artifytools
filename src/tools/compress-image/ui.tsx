"use client";

import { useRef, useState } from "react";
import { DownloadAllButton, FileDropZone, FileList, FileProcessingError, useFileQueue } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { DownloadButton } from "@/components/ui/actions";
import { Field, Segmented, Select, TextInput } from "@/components/ui/form";
import { cx } from "@/components/ui/cx";
import { useLocale } from "@/components/i18n/locale-provider";
import { baseName, safeFileName } from "@/lib/files/names";
import { formatBytes, savingsPercent } from "@/lib/files/size";
import { chooseFormat, EXTENSIONS, parseTargetSize, planForTarget, QUALITY_PRESETS, type FormatChoice, type QualityPreset } from "@/lib/images/compress";
import { encodeImage, ImageReadError, loadImage } from "@/lib/images/encode";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
type Mode = "quality" | "target";
const MAX_SIDES = [0, 3840, 2560, 1920, 1280, 800] as const;
const TARGET_PRESETS = ["50", "100", "200", "500"];

interface Settings {
  mode: Mode;
  preset: QualityPreset;
  target: number | null;
  format: FormatChoice;
  maxSide: number;
}

interface Output {
  blob: Blob;
  name: string;
  width: number;
  height: number;
  kept: boolean;
  fits: boolean;
}

const strings = {
  en: {
    settings: "Settings", how: "Compress", modes: { quality: "By quality", target: "By target size" } as Record<Mode, string>,
    quality: "Quality", presets: { high: "High", balanced: "Balanced", small: "Smallest" } as Record<QualityPreset, string>,
    target: "Target size", targetHint: "Maximum size of each image, e.g. 100 KB or 1.5 MB.", targetError: "Enter a size between 5 KB and 50 MB, like 100 KB.",
    format: "Output format", formats: { original: "Same as original", jpeg: "JPG", webp: "WebP (smallest)" } as Record<FormatChoice, string>,
    maxSide: "Maximum width / height", noLimit: "Keep original size", px: (n: number) => `${n} px`,
    add: "Add images", types: "JPG, PNG or WebP",
    savedLine: (after: string, pct: number) => `${after} · ${pct}% smaller`, kept: "Already optimised: original kept", over: (after: string) => `${after} · couldn't reach the target`,
    errors: { decode: "This image couldn't be read. It may be damaged or in an unsupported format.", tooLarge: "This image is too large (over 16,000 pixels on a side)." },
    total: (before: string, after: string, pct: number) => `Total: ${before} → ${after} (${pct}% smaller)`,
  },
  ar: {
    settings: "الإعدادات", how: "طريقة الضغط", modes: { quality: "حسب الجودة", target: "حسب الحجم المطلوب" } as Record<Mode, string>,
    quality: "الجودة", presets: { high: "عالية", balanced: "متوازنة", small: "أصغر حجم" } as Record<QualityPreset, string>,
    target: "الحجم المطلوب", targetHint: "أقصى حجم لكل صورة، مثل 100 ك.ب أو 1.5 م.ب.", targetError: "أدخل حجمًا بين 5 ك.ب و50 م.ب، مثل 100 ك.ب.",
    format: "صيغة الملف الناتج", formats: { original: "مثل الأصل", jpeg: "JPG", webp: "WebP (الأصغر)" } as Record<FormatChoice, string>,
    maxSide: "أقصى عرض / ارتفاع", noLimit: "الإبقاء على الحجم الأصلي", px: (n: number) => `${n} بكسل`,
    add: "أضف الصور", types: "JPG أو PNG أو WebP",
    savedLine: (after: string, pct: number) => `${after} · أصغر بنسبة ${pct}%`, kept: "مضغوطة أصلًا: أُبقي على الأصل", over: (after: string) => `${after} · تعذّر الوصول إلى الحجم المطلوب`,
    errors: { decode: "تعذّرت قراءة هذه الصورة، وقد تكون تالفة أو بصيغة غير مدعومة.", tooLarge: "هذه الصورة كبيرة جدًا (أكثر من 16,000 بكسل في أحد أبعادها)." },
    total: (before: string, after: string, pct: number) => `الإجمالي: ${before} ← ${after} (أصغر بنسبة ${pct}%)`,
  },
};

export default function CompressImage() {
  const locale = useLocale();
  const t = strings[locale];
  const [settings, setSettingsState] = useState<Settings>({ mode: "quality", preset: "balanced", target: 100_000, format: "original", maxSide: 0 });
  const [targetText, setTargetText] = useState("100 KB");
  // The processor reads settings from a ref so a re-run started in the same click uses the new values.
  const settingsRef = useRef(settings);

  const q = useFileQueue<Output>(
    async (file, { onProgress }) => {
      const s = settingsRef.current;
      let img;
      try {
        img = await loadImage(file);
      } catch (e) {
        throw new FileProcessingError(e instanceof ImageReadError && e.message === "too-large" ? t.errors.tooLarge : t.errors.decode);
      }
      try {
        const targetMode = s.mode === "target" && s.target !== null;
        const format = chooseFormat(s.format, file.type, img.hasAlpha, targetMode);
        const baseScale = s.maxSide ? Math.min(1, s.maxSide / Math.max(img.width, img.height)) : 1;
        let quality: number = QUALITY_PRESETS[s.preset];
        let scale = baseScale;
        let fits = true;
        if (targetMode) {
          let probes = 0;
          const plan = await planForTarget(async (qq, sc) => {
            onProgress(Math.min(0.9, ++probes / 12));
            return (await encodeImage(img, format, qq, baseScale * sc)).blob.size;
          }, s.target!);
          quality = plan.quality;
          scale = baseScale * plan.scale;
          fits = plan.fits;
        }
        const out = await encodeImage(img, format, quality, scale);
        const sameFormat = out.format === (file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpeg");
        // Never hand back a bigger file than the original when nothing else was asked for.
        if (!targetMode && sameFormat && scale === 1 && out.blob.size >= file.size) {
          return { blob: file, name: file.name, width: img.width, height: img.height, kept: true, fits: true };
        }
        const name = `${safeFileName(baseName(file.name), "image")}-compressed${EXTENSIONS[out.format]}`;
        return { blob: out.blob, name, width: out.width, height: out.height, kept: false, fits };
      } finally {
        img.bitmap.close();
      }
    },
    { concurrency: 2 },
  );

  function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    settingsRef.current = next;
    setSettingsState(next);
    if (q.items.length && (next.mode !== "target" || next.target !== null)) q.rerun("all");
  }

  const done = q.items.filter((it) => it.status === "done" && it.result);
  const outputs = done.map((it) => ({ name: it.result!.name, blob: it.result!.blob }));
  const before = done.reduce((s, it) => s + it.file.size, 0);
  const after = done.reduce((s, it) => s + it.result!.blob.size, 0);

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.settings}>
        <Segmented legend={t.how} value={settings.mode} onChange={(mode) => update({ mode })} options={(["quality", "target"] as Mode[]).map((v) => ({ value: v, label: t.modes[v] }))} />
        <div className="grid gap-4 sm:grid-cols-3">
          {settings.mode === "quality" ? (
            <Field label={t.quality}>
              {(p) => (
                <Select {...p} value={settings.preset} onChange={(e) => update({ preset: e.target.value as QualityPreset })}>
                  {(["high", "balanced", "small"] as QualityPreset[]).map((v) => <option key={v} value={v}>{t.presets[v]}</option>)}
                </Select>
              )}
            </Field>
          ) : (
            <Field label={t.target} hint={t.targetHint} error={settings.target === null ? t.targetError : null}>
              {(p) => (
                <div className="flex flex-col gap-2">
                  <TextInput
                    {...p}
                    value={targetText}
                    onChange={(e) => {
                      setTargetText(e.target.value);
                      update({ target: parseTargetSize(e.target.value) });
                    }}
                    inputMode="decimal"
                    autoComplete="off"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {TARGET_PRESETS.map((kb) => (
                      <button
                        key={kb}
                        type="button"
                        onClick={() => { setTargetText(`${kb} KB`); update({ target: Number(kb) * 1000 }); }}
                        className={cx("min-h-9 rounded-full border px-3 text-sm font-medium", settings.target === Number(kb) * 1000 ? "border-accent bg-accent-soft text-accent-text" : "border-line-strong hover:bg-surface-2")}
                      >
                        <bdi>{kb} KB</bdi>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Field>
          )}
          <Field label={t.format}>
            {(p) => (
              <Select {...p} value={settings.format} onChange={(e) => update({ format: e.target.value as FormatChoice })}>
                {(["original", "jpeg", "webp"] as FormatChoice[]).map((v) => <option key={v} value={v}>{t.formats[v]}</option>)}
              </Select>
            )}
          </Field>
          <Field label={t.maxSide}>
            {(p) => (
              <Select {...p} value={settings.maxSide} onChange={(e) => update({ maxSide: Number(e.target.value) })}>
                {MAX_SIDES.map((v) => <option key={v} value={v}>{v ? t.px(v) : t.noLimit}</option>)}
              </Select>
            )}
          </Field>
        </div>
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
                <span className={cx("me-1 text-sm", it.result.kept ? "text-muted" : it.result.fits ? "text-success" : "text-warning")}>
                  {it.result.kept
                    ? t.kept
                    : it.result.fits
                      ? t.savedLine(formatBytes(it.result.blob.size, locale), Math.max(0, savingsPercent(it.file.size, it.result.blob.size)))
                      : t.over(formatBytes(it.result.blob.size, locale))}
                </span>
                <DownloadButton filename={it.result.name} getBlob={() => it.result!.blob} />
              </>
            )
          }
        />
        {done.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <DownloadAllButton files={outputs} zipName="compressed-images.zip" disabled={q.busy} />
            <span className="text-sm text-muted">{t.total(formatBytes(before, locale), formatBytes(after, locale), Math.max(0, savingsPercent(before, after)))}</span>
          </div>
        )}
      </Panel>
    </div>
  );
}
