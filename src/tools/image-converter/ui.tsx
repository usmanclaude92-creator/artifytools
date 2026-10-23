"use client";

import { useRef, useState } from "react";
import { DownloadAllButton, FileDropZone, FileList, FileProcessingError, useFileQueue } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { DownloadButton } from "@/components/ui/actions";
import { Field, Segmented, Select } from "@/components/ui/form";
import { cx } from "@/components/ui/cx";
import { useLocale } from "@/components/i18n/locale-provider";
import { baseName, safeFileName } from "@/lib/files/names";
import { formatBytes } from "@/lib/files/size";
import { ConvertError, decodeImage, encodeAs, formatLabel, TARGET_EXT, type TargetFormat } from "@/lib/images/convert";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
type Quality = "high" | "balanced" | "small";
const QUALITY: Record<Quality, number> = { high: 0.92, balanced: 0.82, small: 0.7 };
const BACKGROUNDS = ["#ffffff", "#000000"];

interface Settings {
  format: TargetFormat;
  quality: Quality;
  background: string;
}

interface Output {
  blob: Blob;
  name: string;
  from: string;
  to: TargetFormat;
  width: number;
  height: number;
}

const LABEL: Record<TargetFormat, string> = { jpeg: "JPG", png: "PNG", webp: "WebP" };

const strings = {
  en: {
    settings: "Convert to", format: "Format", quality: "Quality", qualities: { high: "High", balanced: "Balanced", small: "Smaller files" } as Record<Quality, string>,
    background: "Background for transparent areas", backgrounds: ["White", "Black"], custom: "Custom colour",
    formatHint: { jpeg: "Best for photos. Opens everywhere.", png: "Lossless. Keeps transparency; best for screenshots and logos.", webp: "Smallest files. Keeps transparency; for websites." } as Record<TargetFormat, string>,
    add: "Add images", types: "HEIC, JPG, PNG, WebP, AVIF, GIF, BMP or SVG",
    line: (from: string, to: string, size: string, w: number, h: number) => `${from} → ${to} · ${size} · ${w}×${h}`,
    fallback: (to: string) => `This browser can't write ${to}; saved as PNG instead.`,
    errors: { decode: "This image couldn't be read. It may be damaged or in an unsupported format.", "too-large": "This image is too large (over 16,000 pixels on a side).", encode: "Converting this image failed." } as Record<ConvertError["code"], string>,
    zip: "converted-images.zip",
  },
  ar: {
    settings: "التحويل إلى", format: "الصيغة", quality: "الجودة", qualities: { high: "عالية", balanced: "متوازنة", small: "حجم أصغر" } as Record<Quality, string>,
    background: "خلفية المناطق الشفافة", backgrounds: ["أبيض", "أسود"], custom: "لون مخصص",
    formatHint: { jpeg: "الأفضل للصور الفوتوغرافية، ويفتح في كل مكان.", png: "دون فقدان للجودة، ويحافظ على الشفافية؛ الأفضل للقطات الشاشة والشعارات.", webp: "أصغر حجم، ويحافظ على الشفافية؛ للمواقع." } as Record<TargetFormat, string>,
    add: "أضف الصور", types: "HEIC أو JPG أو PNG أو WebP أو AVIF أو GIF أو BMP أو SVG",
    line: (from: string, to: string, size: string, w: number, h: number) => `${from} ← ${to} · ${size} · ${w}×${h}`,
    fallback: (to: string) => `لا يستطيع هذا المتصفح الحفظ بصيغة ${to}، فحُفظت بصيغة PNG.`,
    errors: { decode: "تعذّرت قراءة هذه الصورة، وقد تكون تالفة أو بصيغة غير مدعومة.", "too-large": "هذه الصورة كبيرة جدًا (أكثر من 16,000 بكسل في أحد أبعادها).", encode: "فشل تحويل هذه الصورة." } as Record<ConvertError["code"], string>,
    zip: "converted-images.zip",
  },
};

export default function ImageConverter() {
  const locale = useLocale();
  const t = strings[locale];
  const [settings, setSettingsState] = useState<Settings>({ format: "jpeg", quality: "high", background: "#ffffff" });
  // The processor reads settings from a ref so a re-run started in the same click uses the new values.
  const settingsRef = useRef(settings);

  const q = useFileQueue<Output>(
    async (file, { onProgress }) => {
      const s = settingsRef.current;
      let img;
      try {
        img = await decodeImage(file);
      } catch (e) {
        throw new FileProcessingError(t.errors[e instanceof ConvertError ? e.code : "decode"]);
      }
      onProgress(0.6);
      try {
        const out = await encodeAs(img, s.format, QUALITY[s.quality], s.background);
        const name = `${safeFileName(baseName(file.name), "image")}${TARGET_EXT[out.format]}`;
        return { blob: out.blob, name, from: formatLabel(file, img.heic), to: out.format, width: img.width, height: img.height };
      } catch {
        throw new FileProcessingError(t.errors.encode);
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
    if (q.items.length) q.rerun("all");
  }

  const done = q.items.filter((it) => it.status === "done" && it.result);
  const outputs = done.map((it) => ({ name: it.result!.name, blob: it.result!.blob }));

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.settings}>
        <Segmented legend={t.format} value={settings.format} onChange={(format) => update({ format })} options={(["jpeg", "png", "webp"] as TargetFormat[]).map((v) => ({ value: v, label: LABEL[v] }))} />
        <p className="-mt-2 text-sm text-muted">{t.formatHint[settings.format]}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {settings.format !== "png" && (
            <Field label={t.quality}>
              {(p) => (
                <Select {...p} value={settings.quality} onChange={(e) => update({ quality: e.target.value as Quality })}>
                  {(["high", "balanced", "small"] as Quality[]).map((v) => <option key={v} value={v}>{t.qualities[v]}</option>)}
                </Select>
              )}
            </Field>
          )}
          {settings.format === "jpeg" && (
            <fieldset className="min-w-0">
              <legend className="mb-1.5 text-sm font-medium">{t.background}</legend>
              <div className="flex flex-wrap items-center gap-2">
                {BACKGROUNDS.map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={settings.background === c}
                    onClick={() => update({ background: c })}
                    className={cx("inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium", settings.background === c ? "border-accent bg-accent-soft text-accent-text" : "border-line-strong hover:bg-surface-2")}
                  >
                    <span className="size-4 rounded-full border border-line-strong" style={{ backgroundColor: c }} /> {t.backgrounds[i]}
                  </button>
                ))}
                <label className="inline-flex min-h-10 items-center gap-2 text-sm">
                  <input type="color" value={settings.background} onChange={(e) => update({ background: e.target.value })} className="h-9 w-12 cursor-pointer rounded-md border border-line-strong bg-transparent" />
                  {t.custom}
                </label>
              </div>
            </fieldset>
          )}
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
                <span className="me-1 text-sm text-success">
                  <bdi>{t.line(it.result.from, LABEL[it.result.to], formatBytes(it.result.blob.size, locale), it.result.width, it.result.height)}</bdi>
                  {it.result.to !== settings.format && <span className="block text-warning">{t.fallback(LABEL[settings.format])}</span>}
                </span>
                <DownloadButton filename={it.result.name} getBlob={() => it.result!.blob} />
              </>
            )
          }
        />
        {done.length > 1 && (
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <DownloadAllButton files={outputs} zipName={t.zip} disabled={q.busy} />
          </div>
        )}
      </Panel>
    </div>
  );
}
