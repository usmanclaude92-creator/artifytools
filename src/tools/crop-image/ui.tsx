"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FileDropZone } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Field, Select, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/components/ui/cx";
import { useLocale } from "@/components/i18n/locale-provider";
import { baseName, safeFileName } from "@/lib/files/names";
import { formatBytes } from "@/lib/files/size";
import { EXTENSIONS, type OutputFormat } from "@/lib/images/compress";
import { encodePlan, ImageReadError, loadImage, originalFormat, type LoadedImage } from "@/lib/images/encode";
import { applyAspect, clampRect, initialCrop, moveRect, resizeRect, roundRect, type Handle, type Rect, type Size } from "@/lib/images/resize";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
type FormatChoice = "original" | OutputFormat;
const ASPECTS = [
  { id: "free", label: null, value: null },
  { id: "original", label: null, value: -1 },
  { id: "1:1", label: "1:1", value: 1 },
  { id: "4:5", label: "4:5", value: 4 / 5 },
  { id: "4:3", label: "4:3", value: 4 / 3 },
  { id: "3:2", label: "3:2", value: 3 / 2 },
  { id: "16:9", label: "16:9", value: 16 / 9 },
  { id: "9:16", label: "9:16", value: 9 / 16 },
] as const;
type AspectId = (typeof ASPECTS)[number]["id"];
const HANDLES: Handle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

const strings = {
  en: {
    choose: "Choose an image", types: "JPG, PNG or WebP", another: "Choose another image",
    aspect: "Aspect ratio", aspects: { free: "Free", original: "Original" } as Record<string, string>,
    editor: "Crop area", editorHint: "Drag the box to move it and the corners to resize. With the box selected, arrow keys move it (Shift for bigger steps).",
    x: "Left (px)", y: "Top (px)", w: "Width (px)", h: "Height (px)",
    rotateL: "Rotate left", rotateR: "Rotate right", flip: "Flip", reset: "Reset",
    format: "Output format", formats: { original: "Same as original", jpeg: "JPG", png: "PNG", webp: "WebP" } as Record<FormatChoice, string>,
    crop: "Crop image", cropping: "Cropping…", result: "Cropped image", stale: "The crop changed. Crop again to update the image.",
    errors: { decode: "This image couldn't be read. It may be damaged or in an unsupported format.", tooLarge: "This image is too large (over 16,000 pixels on a side).", failed: "Cropping failed. Try a smaller area or another format." },
    boxLabel: (r: Rect) => `Crop area, ${r.w} by ${r.h} pixels, at ${r.x}, ${r.y}`,
  },
  ar: {
    choose: "اختر صورة", types: "JPG أو PNG أو WebP", another: "اختيار صورة أخرى",
    aspect: "نسبة الأبعاد", aspects: { free: "حر", original: "الأصلية" } as Record<string, string>,
    editor: "منطقة القص", editorHint: "اسحب المربع لتحريكه والزوايا لتغيير حجمه. وعند تحديد المربع تحرّكه مفاتيح الأسهم (مع Shift لخطوات أكبر).",
    x: "من اليسار (بكسل)", y: "من الأعلى (بكسل)", w: "العرض (بكسل)", h: "الارتفاع (بكسل)",
    rotateL: "تدوير لليسار", rotateR: "تدوير لليمين", flip: "قلب أفقي", reset: "إعادة ضبط",
    format: "صيغة الملف الناتج", formats: { original: "مثل الأصل", jpeg: "JPG", png: "PNG", webp: "WebP" } as Record<FormatChoice, string>,
    crop: "قص الصورة", cropping: "جارٍ القص…", result: "الصورة بعد القص", stale: "تغيّرت منطقة القص. اقصص مجددًا لتحديث الصورة.",
    errors: { decode: "تعذّرت قراءة هذه الصورة، وقد تكون تالفة أو بصيغة غير مدعومة.", tooLarge: "هذه الصورة كبيرة جدًا (أكثر من 16,000 بكسل في أحد أبعادها).", failed: "فشل القص. جرّب منطقة أصغر أو صيغة أخرى." },
    boxLabel: (r: Rect) => `منطقة القص، ${r.w} × ${r.h} بكسل، عند ${r.x}، ${r.y}`,
  },
};

/** The image with rotation and flip applied, as a canvas we can crop from. */
function orient(img: LoadedImage, turns: number, flip: boolean): HTMLCanvasElement {
  const swap = turns % 2 === 1;
  const c = document.createElement("canvas");
  c.width = swap ? img.height : img.width;
  c.height = swap ? img.width : img.height;
  const ctx = c.getContext("2d")!;
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((turns * Math.PI) / 2);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img.bitmap, -img.width / 2, -img.height / 2);
  return c;
}

export default function CropImage() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<LoadedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState(0);
  const [flip, setFlip] = useState(false);
  const [aspectId, setAspectId] = useState<AspectId>("free");
  const [rect, setRect] = useState<Rect | null>(null);
  const [format, setFormat] = useState<FormatChoice>("original");
  const [result, setResult] = useState<{ key: string; blob: Blob; url: string; name: string; width: number; height: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const work = useMemo(() => (img ? orient(img, turns, flip) : null), [img, turns, flip]);
  const bounds: Size | null = work ? { width: work.width, height: work.height } : null;
  const aspect = (() => {
    const a = ASPECTS.find((x) => x.id === aspectId)!.value;
    return a === -1 ? (bounds ? bounds.width / bounds.height : null) : a;
  })();

  useEffect(() => () => img?.bitmap.close(), [img]);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);

  async function open(f: File) {
    setFile(f);
    setImg(null);
    setError(null);
    setResult(null);
    setTurns(0);
    setFlip(false);
    try {
      const loaded = await loadImage(f);
      setImg(loaded);
      setRect(initialCrop(loaded, null));
      setAspectId("free");
    } catch (e) {
      setError(e instanceof ImageReadError && e.message === "too-large" ? t.errors.tooLarge : t.errors.decode);
    }
  }

  function chooseAspect(id: AspectId) {
    setAspectId(id);
    if (!bounds || !rect) return;
    const a = ASPECTS.find((x) => x.id === id)!.value;
    const value = a === -1 ? bounds.width / bounds.height : a;
    setRect(value ? applyAspect(rect, value, bounds) : rect);
  }

  function rotate(delta: 1 | -1) {
    if (!bounds) return;
    const next = (turns + delta + 4) % 4;
    setTurns(next);
    const nb = { width: bounds.height, height: bounds.width };
    setRect(initialCrop(nb, aspectId === "original" ? null : aspect));
    if (aspectId === "original") setAspectId("free");
  }

  const shown = rect ? roundRect(rect) : null;
  const key = `${file?.name}|${file?.size}|${turns}|${flip}|${JSON.stringify(shown)}|${format}`;
  const current = result && result.key === key ? result : null;

  async function crop() {
    if (!work || !shown || !file || !img) return;
    setBusy(true);
    setFailed(false);
    try {
      const fmt = format === "original" ? originalFormat(file.type) : format;
      const out = await encodePlan(work, { canvas: { width: shown.w, height: shown.h }, src: shown, dst: { x: 0, y: 0, w: shown.w, h: shown.h } }, fmt, 0.92, img.hasAlpha);
      const name = `${safeFileName(baseName(file.name), "image")}-cropped${EXTENSIONS[out.format]}`;
      setResult({ key, blob: out.blob, url: URL.createObjectURL(out.blob), name, width: out.width, height: out.height });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  function setField(k: keyof Rect, text: string) {
    if (!bounds || !rect) return;
    const v = Number(text);
    if (!Number.isFinite(v)) return;
    let next = { ...rect, [k]: v };
    if (aspect && (k === "w" || k === "h")) next = k === "w" ? { ...next, h: v / aspect } : { ...next, w: v * aspect };
    if (aspect && (next.w > bounds.width || next.h > bounds.height)) return;
    setRect(clampRect(next, bounds));
  }

  if (!file) {
    return (
      <Panel title={t.choose}>
        <FileDropZone rules={rules} onFiles={(fs) => fs[0] && open(fs[0])} typesLabel={t.types} />
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Panel
        title={t.editor}
        actions={
          <Button variant="secondary" size="sm" onClick={() => { setFile(null); setImg(null); setResult(null); setError(null); }}>
            <Icon name="rotate-ccw" size={16} /> {t.another}
          </Button>
        }
      >
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
        {work && rect && bounds && (
          <>
            <div role="radiogroup" aria-label={t.aspect} className="flex flex-wrap gap-1.5">
              {ASPECTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={aspectId === a.id}
                  onClick={() => chooseAspect(a.id)}
                  className={cx("min-h-9 rounded-full border px-3 text-sm font-medium", aspectId === a.id ? "border-accent bg-accent-soft text-accent-text" : "border-line-strong hover:bg-surface-2")}
                >
                  {a.label ? <bdi dir="ltr">{a.label}</bdi> : t.aspects[a.id]}
                </button>
              ))}
            </div>
            <p className="text-sm text-muted">{t.editorHint}</p>
            <CropEditor source={work} bounds={bounds} rect={rect} aspect={aspect} onChange={setRect} label={t.boxLabel(shown!)} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["x", "y", "w", "h"] as const).map((k) => (
                <Field key={k} label={t[k]}>
                  {(p) => <TextInput {...p} type="number" dir="ltr" min={k === "w" || k === "h" ? 1 : 0} value={shown![k]} onChange={(e) => setField(k, e.target.value)} className="!min-h-10 py-1.5" />}
                </Field>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => rotate(-1)}><Icon name="rotate-ccw" size={16} /> {t.rotateL}</Button>
              <Button variant="secondary" size="sm" onClick={() => rotate(1)}><Icon name="rotate-cw" size={16} /> {t.rotateR}</Button>
              <Button variant="secondary" size="sm" aria-pressed={flip} onClick={() => setFlip((f) => !f)}><Icon name="flip-horizontal" size={16} /> {t.flip}</Button>
              <Button variant="ghost" size="sm" onClick={() => { setTurns(0); setFlip(false); setAspectId("free"); setRect(initialCrop(img!, null)); }}>{t.reset}</Button>
            </div>
            <div className="flex flex-wrap items-end gap-3 border-t border-line pt-4">
              <Field label={t.format}>
                {(p) => (
                  <Select {...p} value={format} onChange={(e) => setFormat(e.target.value as FormatChoice)} className="min-w-44">
                    {(["original", "jpeg", "png", "webp"] as FormatChoice[]).map((v) => <option key={v} value={v}>{t.formats[v]}</option>)}
                  </Select>
                )}
              </Field>
              <Button size="lg" onClick={crop} disabled={busy}>
                <Icon name={busy ? "loader" : "crop"} size={18} className={busy ? "animate-spin" : undefined} /> {busy ? t.cropping : t.crop}
              </Button>
            </div>
          </>
        )}
      </Panel>

      {(result || failed) && (
        <Panel title={t.result}>
          {failed && <StatusMessage tone="error">{t.errors.failed}</StatusMessage>}
          {result && !current && <p className="text-sm text-muted">{t.stale}</p>}
          {current && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="grid size-40 place-items-center rounded-lg bg-surface-2 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
                <img src={current.url} alt={t.result} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-medium"><bdi>{current.name}</bdi></p>
                <p className="text-sm text-muted"><bdi dir="ltr">{current.width}×{current.height}</bdi> · {formatBytes(current.blob.size, locale)}</p>
                <DownloadButton filename={current.name} getBlob={() => current.blob} />
              </div>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

function CropEditor({ source, bounds, rect, aspect, onChange, label }: { source: HTMLCanvasElement; bounds: Size; rect: Rect; aspect: number | null; onChange: (r: Rect) => void; label: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [display, setDisplay] = useState({ width: 0, height: 0 });
  const drag = useRef<{ handle: Handle | "move"; startX: number; startY: number; start: Rect } | null>(null);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const update = () => {
      const maxW = el.clientWidth - 16; // minus the p-2 padding
      const maxH = Math.max(240, Math.min(window.innerHeight * 0.6, 640));
      const s = Math.min(maxW / bounds.width, maxH / bounds.height, 1);
      setDisplay({ width: Math.round(bounds.width * s), height: Math.round(bounds.height * s) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [bounds.width, bounds.height]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !display.width) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(display.width * dpr);
    c.height = Math.round(display.height * dpr);
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, c.width, c.height);
  }, [source, display]);

  const scale = display.width ? bounds.width / display.width : 1;
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = (e.clientX - d.startX) * scale, dy = (e.clientY - d.startY) * scale;
      onChange(d.handle === "move" ? moveRect(d.start, dx, dy, bounds) : resizeRect(d.start, d.handle, dx, dy, aspect, bounds));
    },
    [scale, bounds, aspect, onChange],
  );
  function onPointerDown(e: React.PointerEvent) {
    const handle = ((e.target as HTMLElement).dataset.handle as Handle | undefined) ?? "move";
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { handle, startX: e.clientX, startY: e.clientY, start: rect };
  }
  const end = () => (drag.current = null);

  function onKeyDown(e: React.KeyboardEvent) {
    const step = (e.shiftKey ? 10 : 1) * Math.max(1, Math.round(scale));
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    onChange(moveRect(rect, m[0], m[1], bounds));
  }

  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  return (
    <div ref={wrap} dir="ltr" className="flex w-full justify-center rounded-lg bg-surface-2 p-2">
      <div className="relative touch-none select-none" style={{ width: display.width, height: display.height }} onPointerMove={onPointerMove} onPointerUp={end} onPointerCancel={end}>
        <canvas ref={canvas} style={{ width: display.width, height: display.height }} className="block" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute" style={{ left: pct(rect.x, bounds.width), top: pct(rect.y, bounds.height), width: pct(rect.w, bounds.width), height: pct(rect.h, bounds.height), boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.55)" }} />
        </div>
        <div
          role="group"
          tabIndex={0}
          aria-label={label}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          className="absolute cursor-move outline-none ring-white focus-visible:ring-2"
          style={{ left: pct(rect.x, bounds.width), top: pct(rect.y, bounds.height), width: pct(rect.w, bounds.width), height: pct(rect.h, bounds.height), border: "1.5px solid #fff" }}
        >
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }, (_, i) => <div key={i} className="border border-white/25" />)}
          </div>
          {HANDLES.map((h) => (
            <span
              key={h}
              data-handle={h}
              aria-hidden="true"
              className="absolute size-6 -translate-x-1/2 -translate-y-1/2 before:pointer-events-none before:absolute before:inset-1.5 before:rounded-sm before:border-2 before:border-white before:bg-[#7c3aed] before:content-['']"
              style={{
                left: h.includes("w") ? 0 : h.includes("e") ? "100%" : "50%",
                top: h.includes("n") ? 0 : h.includes("s") ? "100%" : "50%",
                cursor: `${h}-resize`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
