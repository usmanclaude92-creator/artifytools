"use client";

import { useEffect, useRef, useState } from "react";
import { DownloadAllButton, FileDropZone, FileList, FileProcessingError, useFileQueue } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { cx } from "@/components/ui/cx";
import { useLocale } from "@/components/i18n/locale-provider";
import { baseName, safeFileName } from "@/lib/files/names";
import { createRemover, MODEL_BYTES, type Remover, type Stage } from "@/lib/bg/remove";
import { ImageReadError, loadImage } from "@/lib/images/encode";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
const MAX_SIDE = 5000;
type Bg = "transparent" | "white" | "black" | "custom";

const strings = {
  en: {
    background: "Background", bgs: { transparent: "Transparent (PNG)", white: "White (JPG)", black: "Black (JPG)", custom: "Colour (JPG)" } as Record<Bg, string>, pick: "Background colour",
    add: "Add images", types: "JPG, PNG or WebP",
    note: (mb: number) => `The first time, your browser downloads the AI model (${mb} MB) and keeps it for next time. Your photos are processed on this device and never uploaded.`,
    download: (l: number, t: number) => `Downloading the AI model… ${l} of ${t} MB (first time only)`, starting: "Starting the AI model…", working: "Removing the background…",
    gpu: "Using your graphics card.", cpu: "Using your processor. Each image can take 10–40 seconds on this device.",
    results: "Results", nothing: "No clear subject was found in this image.",
    errors: { decode: "This image couldn't be read. It may be damaged or in an unsupported format.", tooLarge: "This image is too large (over 16,000 pixels on a side).", model: "The AI model couldn't be loaded. Check your connection and try again.", memory: "This device ran out of memory. Try a smaller image." },
  },
  ar: {
    background: "الخلفية", bgs: { transparent: "شفافة (PNG)", white: "بيضاء (JPG)", black: "سوداء (JPG)", custom: "لون مخصص (JPG)" } as Record<Bg, string>, pick: "لون الخلفية",
    add: "أضف الصور", types: "JPG أو PNG أو WebP",
    note: (mb: number) => `في المرة الأولى يحمّل متصفحك نموذج الذكاء الاصطناعي (${mb} ميغابايت) ويحتفظ به للمرات القادمة. تُعالَج صورك على هذا الجهاز ولا تُرفع أبدًا.`,
    download: (l: number, t: number) => `جارٍ تحميل نموذج الذكاء الاصطناعي… ${l} من ${t} ميغابايت (أول مرة فقط)`, starting: "جارٍ تشغيل النموذج…", working: "جارٍ إزالة الخلفية…",
    gpu: "يُستخدم معالج الرسوميات في جهازك.", cpu: "يُستخدم معالج جهازك، وقد تستغرق كل صورة من 10 إلى 40 ثانية.",
    results: "النتائج", nothing: "لم يُعثر على عنصر واضح في هذه الصورة.",
    errors: { decode: "تعذّرت قراءة هذه الصورة، وقد تكون تالفة أو بصيغة غير مدعومة.", tooLarge: "هذه الصورة كبيرة جدًا (أكثر من 16,000 بكسل في أحد أبعادها).", model: "تعذّر تحميل نموذج الذكاء الاصطناعي. تحقق من اتصالك وحاول مجددًا.", memory: "نفدت ذاكرة هذا الجهاز. جرّب صورة أصغر." },
  },
};

interface Cutout {
  png: Blob;
  url: string;
  width: number;
  height: number;
  name: string;
  kept: number;
}

async function withBackground(c: Cutout, color: string): Promise<Blob> {
  const img = await createImageBitmap(c.png);
  const canvas = document.createElement("canvas");
  canvas.width = c.width;
  canvas.height = c.height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0);
  img.close();
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.92));
}

export default function RemoveBackground() {
  const locale = useLocale();
  const t = strings[locale];
  const [bg, setBg] = useState<Bg>("transparent");
  const [custom, setCustom] = useState("#2563eb");
  const [stage, setStage] = useState<Stage | null>(null);
  const [backend, setBackend] = useState<Remover["backend"] | null>(null);
  const remover = useRef<Promise<Remover> | null>(null);
  const urls = useRef(new Set<string>());

  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const q = useFileQueue<Cutout>(
    async (file) => {
      let img;
      try {
        img = await loadImage(file);
      } catch (e) {
        throw new FileProcessingError(e instanceof ImageReadError && e.message === "too-large" ? t.errors.tooLarge : t.errors.decode);
      }
      try {
        if (!remover.current) {
          remover.current = createRemover(setStage);
          remover.current.then((r) => setBackend(r.backend)).catch(() => (remover.current = null));
        }
        let r: Remover;
        try {
          r = await remover.current;
        } catch {
          throw new FileProcessingError(t.errors.model);
        }
        // Very large photos are scaled down first so phones don't run out of memory.
        let bitmap = img.bitmap;
        const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
        if (scale < 1) bitmap = await createImageBitmap(img.bitmap, { resizeWidth: Math.round(img.width * scale), resizeHeight: Math.round(img.height * scale), resizeQuality: "high" });
        let out;
        try {
          out = await r.cutout(bitmap);
        } catch {
          throw new FileProcessingError(t.errors.memory);
        } finally {
          if (bitmap !== img.bitmap) bitmap.close();
          setStage(null);
        }
        const png = await new Promise<Blob>((res, rej) => out.canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/png"));
        const url = URL.createObjectURL(png);
        urls.current.add(url);
        const result = { png, url, width: out.canvas.width, height: out.canvas.height, name: safeFileName(baseName(file.name), "image"), kept: out.kept };
        out.canvas.width = out.canvas.height = 0;
        return result;
      } finally {
        img.bitmap.close();
      }
    },
    { concurrency: 1 },
  );

  const color = bg === "white" ? "#ffffff" : bg === "black" ? "#000000" : bg === "custom" ? custom : null;
  const fileFor = (c: Cutout) => (color ? { name: `${c.name}-no-bg.jpg`, get: () => withBackground(c, color) } : { name: `${c.name}-no-bg.png`, get: () => c.png });
  const done = q.items.filter((it) => it.status === "done" && it.result);
  const mb = (n: number) => Math.round(n / 1_000_000);

  // Files for "Download all": PNGs as they are, or composed onto the chosen colour.
  const [zip, setZip] = useState<{ key: string; files: { name: string; blob: Blob }[] } | null>(null);
  const zipKey = `${color}|${done.map((it) => it.id).join(",")}`;
  useEffect(() => {
    if (done.length < 2) return;
    let cancelled = false;
    void Promise.all(done.map(async (it) => { const f = fileFor(it.result!); return { name: f.name, blob: await f.get() }; })).then((files) => !cancelled && setZip({ key: zipKey, files }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- zipKey captures the inputs
  }, [zipKey]);
  const zipFiles = zip && zip.key === zipKey ? zip.files : null;

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.add}>
        <StatusMessage tone="info">{t.note(mb(MODEL_BYTES))}</StatusMessage>
        <FileDropZone rules={rules} onFiles={q.add} existing={q.items.map((it) => it.file)} typesLabel={t.types} />
        {stage && (
          <div role="status" className="flex flex-col gap-2 text-sm text-muted">
            <span>{stage.kind === "download" ? t.download(mb(stage.loaded), mb(stage.total)) : stage.kind === "starting" ? t.starting : t.working}</span>
            {stage.kind === "download" && (
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.round((stage.loaded / stage.total) * 100)}%` }} />
              </div>
            )}
          </div>
        )}
        {backend && q.busy && <p className="text-sm text-muted">{backend === "webgpu" ? t.gpu : t.cpu}</p>}
        <FileList items={q.items} onRemove={q.remove} onClear={q.clear} />
      </Panel>

      {done.length > 0 && (
        <Panel title={t.results} actions={done.length > 1 ? <DownloadAllButton files={zipFiles ?? []} zipName="no-background.zip" disabled={!zipFiles || q.busy} /> : undefined}>
          <fieldset className="flex flex-wrap items-center gap-2">
            <legend className="mb-2 text-sm font-medium">{t.background}</legend>
            {(["transparent", "white", "black", "custom"] as Bg[]).map((v) => (
              <button key={v} type="button" aria-pressed={bg === v} onClick={() => setBg(v)} className={cx("min-h-9 rounded-full border px-3 text-sm font-medium", bg === v ? "border-accent bg-accent-soft text-accent-text" : "border-line-strong hover:bg-surface-2")}>
                {t.bgs[v]}
              </button>
            ))}
            {bg === "custom" && <input type="color" aria-label={t.pick} value={custom} onChange={(e) => setCustom(e.target.value)} className="h-9 w-12 cursor-pointer rounded-md border border-line-strong bg-transparent" />}
          </fieldset>
          <ul className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {done.map((it) => {
              const c = it.result!;
              const f = fileFor(c);
              return (
                <li key={it.id} className="flex flex-col overflow-hidden rounded-lg border border-line">
                  <div
                    className="grid aspect-[4/3] place-items-center p-3"
                    style={color ? { background: color } : { backgroundColor: "#fff", backgroundImage: "conic-gradient(#e5e7eb 25%, #fff 0 50%, #e5e7eb 0 75%, #fff 0)", backgroundSize: "20px 20px" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
                    <img src={c.url} alt={it.file.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium" title={f.name}><bdi>{f.name}</bdi></p>
                      <p className="text-xs text-muted"><bdi dir="ltr">{c.width}×{c.height}</bdi></p>
                    </div>
                    <DownloadButton filename={f.name} getBlob={f.get} />
                  </div>
                  {c.kept < 0.005 && <p className="px-3 pb-3 text-sm text-warning">{t.nothing}</p>}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}
