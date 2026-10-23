"use client";

import { useState } from "react";
import { PdfPagePreview, SingleFile } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Field, Segmented, Select, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { baseName, safeFileName } from "@/lib/files/names";
import { addWatermark, type WatermarkOptions } from "@/lib/pdf/edit";
import { inspectPdf, PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
type Kind = "text" | "image";
type Layout = "center" | "tile";

const strings = {
  en: {
    choose: "Choose a PDF", types: "PDF", pages: (n: number) => `${n} page${n === 1 ? "" : "s"}`, reading: "Reading your PDF…",
    options: "Watermark", kind: "Type", kinds: { text: "Text", image: "Image / logo" } as Record<Kind, string>,
    text: "Watermark text", defaultText: "CONFIDENTIAL", color: "Colour", size: "Text size", image: "Logo or image (PNG or JPG)", imageScale: "Image width",
    opacity: "Transparency", angle: "Angle", angles: { "45": "Diagonal ↗", "0": "Horizontal", "-45": "Diagonal ↘" } as Record<string, string>, layout: "Placement", layouts: { center: "Once, in the centre", tile: "Repeated across the page" } as Record<Layout, string>,
    apply: "Add watermark", applying: (p: number) => `Adding… ${p}%`, result: "Result", preview: "Page 1 of the result", stale: "Settings changed. Add the watermark again to update.",
    needText: "Type the watermark text.", needImage: "Choose a PNG or JPG image.", badImage: "That image couldn't be used. Choose a PNG or JPG file.",
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    failed: "Adding the watermark failed. The file may be damaged.",
  },
  ar: {
    choose: "اختر ملف PDF", types: "PDF", pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"), reading: "جارٍ قراءة ملف PDF…",
    options: "العلامة المائية", kind: "النوع", kinds: { text: "نص", image: "صورة / شعار" } as Record<Kind, string>,
    text: "نص العلامة المائية", defaultText: "سري", color: "اللون", size: "حجم النص", image: "الشعار أو الصورة (PNG أو JPG)", imageScale: "عرض الصورة",
    opacity: "الشفافية", angle: "الزاوية", angles: { "45": "مائلة ↗", "0": "أفقية", "-45": "مائلة ↘" } as Record<string, string>, layout: "الموضع", layouts: { center: "مرة واحدة في المنتصف", tile: "مكررة على الصفحة" } as Record<Layout, string>,
    apply: "إضافة العلامة المائية", applying: (p: number) => `جارٍ الإضافة… ${p}%`, result: "النتيجة", preview: "الصفحة الأولى من النتيجة", stale: "تغيّرت الإعدادات. أضف العلامة المائية مجددًا للتحديث.",
    needText: "اكتب نص العلامة المائية.", needImage: "اختر صورة PNG أو JPG.", badImage: "تعذّر استخدام هذه الصورة. اختر ملف PNG أو JPG.",
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    failed: "فشلت إضافة العلامة المائية. قد يكون الملف تالفًا.",
  },
};

export default function WatermarkPdf() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind>("text");
  const [text, setText] = useState(t.defaultText);
  const [color, setColor] = useState("#E11D48");
  const [pt, setPt] = useState(60);
  const [image, setImage] = useState<{ name: string; bytes: Uint8Array; type: "png" | "jpg" } | null>(null);
  const [imageScale, setImageScale] = useState(0.4);
  const [opacity, setOpacity] = useState(0.25);
  const [angle, setAngle] = useState(45);
  const [layout, setLayout] = useState<Layout>("center");
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<{ key: string; bytes: Uint8Array } | null>(null);

  async function open(f: File) {
    setFile(f);
    setBytes(null);
    setError(null);
    setResult(null);
    try {
      const b = new Uint8Array(await f.arrayBuffer());
      setCount((await inspectPdf(b)).pageCount);
      setBytes(b);
    } catch (e) {
      setError(e instanceof PdfError ? t.errors[e.code] : t.errors.invalid);
    }
  }

  async function pickImage(f: File | undefined) {
    if (!f) return;
    const b = new Uint8Array(await f.arrayBuffer());
    const type = b[0] === 0x89 && b[1] === 0x50 ? "png" : b[0] === 0xff && b[1] === 0xd8 ? "jpg" : null;
    if (!type) {
      setError(t.badImage);
      return;
    }
    setError(null);
    setImage({ name: f.name, bytes: b, type });
  }

  const opts: WatermarkOptions = { kind, text: text.trim(), color, pt, image: image ?? undefined, imageScale, opacity, angle, layout };
  const key = `${file?.name}|${file?.size}|${kind}|${text}|${color}|${pt}|${image?.name}|${imageScale}|${opacity}|${angle}|${layout}`;
  const current = result && result.key === key ? result : null;
  const ready = kind === "text" ? Boolean(text.trim()) : Boolean(image);

  async function apply() {
    if (!bytes || !ready) return;
    setError(null);
    setProgress(0);
    try {
      const out = await addWatermark(bytes, opts, (f) => setProgress(Math.round(f * 100)));
      setResult({ key, bytes: out });
    } catch {
      setError(t.failed);
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.choose}>
        <SingleFile file={file} rules={rules} typesLabel={t.types} busy={progress !== null} status={bytes ? t.pages(count) : file && !error ? t.reading : null} onFile={open} onClear={() => { setFile(null); setBytes(null); setResult(null); setError(null); }} />
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
      </Panel>

      {bytes && (
        <Panel title={t.options}>
          <Segmented legend={t.kind} value={kind} onChange={setKind} options={(["text", "image"] as Kind[]).map((v) => ({ value: v, label: t.kinds[v] }))} />
          {kind === "text" ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t.text} error={!text.trim() ? t.needText : null}>
                {(p) => <TextInput {...p} dir="auto" value={text} onChange={(e) => setText(e.target.value)} maxLength={80} />}
              </Field>
              <Field label={t.color}>
                {(p) => <input {...p} type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-20 cursor-pointer rounded-md border border-line-strong bg-transparent" />}
              </Field>
              <Field label={t.size}>
                {(p) => (
                  <Select {...p} value={pt} onChange={(e) => setPt(Number(e.target.value))}>
                    {[24, 36, 48, 60, 72, 96].map((n) => <option key={n} value={n}>{n} pt</option>)}
                  </Select>
                )}
              </Field>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.image} hint={image ? image.name : undefined} error={!image ? t.needImage : null}>
                {(p) => <input {...p} type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={(e) => { void pickImage(e.target.files?.[0]); e.target.value = ""; }} className="field-control py-2" />}
              </Field>
              <Field label={t.imageScale}>
                {(p) => (
                  <Select {...p} value={imageScale} onChange={(e) => setImageScale(Number(e.target.value))}>
                    {[0.2, 0.3, 0.4, 0.6, 0.8].map((n) => <option key={n} value={n}>{Math.round(n * 100)}%</option>)}
                  </Select>
                )}
              </Field>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t.opacity}>
              {(p) => (
                <Select {...p} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))}>
                  {[0.1, 0.15, 0.25, 0.4, 0.6, 1].map((n) => <option key={n} value={n}>{Math.round(n * 100)}%</option>)}
                </Select>
              )}
            </Field>
            <Field label={t.angle}>
              {(p) => (
                <Select {...p} value={angle} onChange={(e) => setAngle(Number(e.target.value))}>
                  {[45, 0, -45].map((n) => <option key={n} value={n}>{t.angles[String(n)]}</option>)}
                </Select>
              )}
            </Field>
            <Field label={t.layout}>
              {(p) => (
                <Select {...p} value={layout} onChange={(e) => setLayout(e.target.value as Layout)}>
                  {(["center", "tile"] as Layout[]).map((v) => <option key={v} value={v}>{t.layouts[v]}</option>)}
                </Select>
              )}
            </Field>
          </div>
          <div className="border-t border-line pt-4">
            <Button size="lg" onClick={apply} disabled={progress !== null || !ready}>
              <Icon name={progress !== null ? "loader" : "type"} size={18} className={progress !== null ? "animate-spin" : undefined} />
              {progress !== null ? t.applying(progress) : t.apply}
            </Button>
          </div>
        </Panel>
      )}

      {result && (
        <Panel title={t.result}>
          {!current ? (
            <p className="text-sm text-muted">{t.stale}</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <DownloadButton filename={`${safeFileName(baseName(file?.name ?? "document"), "document")}-watermarked.pdf`} getBlob={() => new Blob([current.bytes.buffer as ArrayBuffer], { type: "application/pdf" })} variant="primary" size="md" />
              </div>
              <PdfPagePreview bytes={current.bytes} alt={t.preview} />
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
