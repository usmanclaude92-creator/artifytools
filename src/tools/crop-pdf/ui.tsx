"use client";

import { useEffect, useRef, useState } from "react";
import { SingleFile } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { baseName, safeFileName } from "@/lib/files/names";
import { cropPages, type CropRect } from "@/lib/pdf/edit";
import { inspectPdf, PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { openPdf, renderPage, type RenderedDoc } from "@/lib/pdf/render";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
const MIN = 0.03;
const FULL: CropRect = { x0: 0, y0: 0, x1: 1, y1: 1 };
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const isFull = (r: CropRect) => r.x0 <= 0 && r.y0 <= 0 && r.x1 >= 1 && r.y1 >= 1;

const strings = {
  en: {
    choose: "Choose a PDF", types: "PDF", pages: (n: number) => `${n} page${n === 1 ? "" : "s"}`, reading: "Reading your PDF…",
    cropTitle: "Crop area", hint: "Drag the corner dots or edges to set what stays. Drag inside the box to move it, or draw a new box on the page.",
    scope: "Apply to", all: "All pages", one: "This page only", reset: "Reset", box: "Crop box", handle: (n: string) => `Crop handle ${n}`,
    page: (n: number) => `Page ${n}`, of: (n: number, total: number) => `Page ${n} of ${total}`, prev: "Previous page", next: "Next page",
    save: "Save cropped PDF", saving: "Saving…", nothing: "Set a crop box first.", cropped: (n: number) => `${n} page${n === 1 ? "" : "s"} will be cropped.`,
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    failed: "Saving failed. The file may be damaged.",
  },
  ar: {
    choose: "اختر ملف PDF", types: "PDF", pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"), reading: "جارٍ قراءة ملف PDF…",
    cropTitle: "منطقة القص", hint: "اسحب النقاط في الزوايا أو الحواف لتحديد ما يبقى. اسحب داخل المربع لتحريكه، أو ارسم مربعًا جديدًا على الصفحة.",
    scope: "التطبيق على", all: "كل الصفحات", one: "هذه الصفحة فقط", reset: "إعادة ضبط", box: "مربع القص", handle: (n: string) => `مقبض القص ${n}`,
    page: (n: number) => `الصفحة ${n}`, of: (n: number, total: number) => `الصفحة ${n} من ${total}`, prev: "الصفحة السابقة", next: "الصفحة التالية",
    save: "حفظ الملف بعد القص", saving: "جارٍ الحفظ…", nothing: "حدد مربع القص أولًا.", cropped: (n: number) => `سيتم قص ${arCount(n, "صفحة واحدة", "صفحتين", "صفحات", "صفحة")}.`,
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    failed: "فشل الحفظ. قد يكون الملف تالفًا.",
  },
};

const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
type Handle = (typeof HANDLES)[number];

export default function CropPdf() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [image, setImage] = useState<string | null>(null);
  const [ratio, setRatio] = useState(0.707);
  const [scope, setScope] = useState<"all" | "one">("all");
  const [allBox, setAllBox] = useState<CropRect>(FULL);
  const [boxes, setBoxes] = useState<Record<number, CropRect>>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ key: string; blob: Blob } | null>(null);
  const [busy, setBusy] = useState(false);
  const doc = useRef<RenderedDoc | null>(null);
  const drag = useRef<{ kind: Handle | "move" | "draw"; px: number; py: number; box: CropRect } | null>(null);
  const job = useRef(0);

  const box = scope === "all" ? allBox : boxes[page] ?? FULL;
  const setBox = (b: CropRect) => (scope === "all" ? setAllBox(b) : setBoxes((x) => ({ ...x, [page]: b })));

  useEffect(() => () => { void doc.current?.destroy(); }, []);

  // The preview of the page being cropped.
  useEffect(() => {
    const d = doc.current;
    if (!d || !bytes) return;
    let gone = false;
    let url: string | null = null;
    void (async () => {
      try {
        const r = await renderPage(d, page, { dpi: 90, format: "jpg", quality: 0.85 });
        if (gone) return;
        url = URL.createObjectURL(r.blob);
        setRatio(r.width / r.height);
        setImage(url);
      } catch {
        if (!gone) setError(t.errors.invalid);
      }
    })();
    return () => {
      gone = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [bytes, page, t.errors.invalid]);

  async function open(f: File) {
    const id = ++job.current;
    void doc.current?.destroy();
    doc.current = null;
    setFile(f);
    setBytes(null);
    setImage(null);
    setError(null);
    setResult(null);
    setPage(1);
    setAllBox(FULL);
    setBoxes({});
    try {
      const b = new Uint8Array(await f.arrayBuffer());
      const info = await inspectPdf(b);
      const d = await openPdf(b);
      if (job.current !== id) { void d.destroy(); return; }
      doc.current = d;
      setCount(info.pageCount);
      setBytes(b);
    } catch (e) {
      setError(e instanceof PdfError ? t.errors[e.code] : t.errors.invalid);
    }
  }

  const frac = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.closest<HTMLElement>("[data-crop-area]")!.getBoundingClientRect();
    return { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) };
  };
  const begin = (kind: Handle | "move" | "draw", e: React.PointerEvent<HTMLElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = frac(e);
    drag.current = { kind, px: p.x, py: p.y, box: kind === "draw" ? { x0: p.x, y0: p.y, x1: p.x, y1: p.y } : box };
  };
  const update = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const p = frac(e);
    let { x0, y0, x1, y1 } = d.box;
    if (d.kind === "draw") {
      x0 = Math.min(d.px, p.x); x1 = Math.max(d.px, p.x); y0 = Math.min(d.py, p.y); y1 = Math.max(d.py, p.y);
    } else if (d.kind === "move") {
      const dx = clamp(p.x - d.px, -x0, 1 - x1), dy = clamp(p.y - d.py, -y0, 1 - y1);
      x0 += dx; x1 += dx; y0 += dy; y1 += dy;
    } else {
      if (d.kind.includes("w")) x0 = Math.min(p.x, x1 - MIN);
      if (d.kind.includes("e")) x1 = Math.max(p.x, x0 + MIN);
      if (d.kind.includes("n")) y0 = Math.min(p.y, y1 - MIN);
      if (d.kind.includes("s")) y1 = Math.max(p.y, y0 + MIN);
    }
    setBox({ x0, y0, x1, y1 });
  };
  const end = () => {
    const d = drag.current;
    drag.current = null;
    // A stray click while drawing leaves a sliver; put the previous box back.
    if (d?.kind === "draw" && (box.x1 - box.x0 < MIN || box.y1 - box.y0 < MIN)) setBox(FULL);
  };
  const nudge = (e: React.KeyboardEvent, kind: Handle | "move") => {
    const step = e.shiftKey ? 0.05 : 0.01;
    const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
    const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
    if (!dx && !dy) return;
    e.preventDefault();
    let { x0, y0, x1, y1 } = box;
    if (kind === "move") {
      const mx = clamp(dx, -x0, 1 - x1), my = clamp(dy, -y0, 1 - y1);
      x0 += mx; x1 += mx; y0 += my; y1 += my;
    } else {
      if (kind.includes("w")) x0 = clamp(x0 + dx, 0, x1 - MIN);
      if (kind.includes("e")) x1 = clamp(x1 + dx, x0 + MIN, 1);
      if (kind.includes("n")) y0 = clamp(y0 + dy, 0, y1 - MIN);
      if (kind.includes("s")) y1 = clamp(y1 + dy, y0 + MIN, 1);
    }
    setBox({ x0, y0, x1, y1 });
  };

  const rects: (CropRect | null)[] = Array.from({ length: count }, (_, i) => {
    const r = scope === "all" ? allBox : boxes[i + 1];
    return r && !isFull(r) ? r : null;
  });
  const cropCount = rects.filter(Boolean).length;
  const key = `${file?.name}|${file?.size}|${JSON.stringify(rects)}`;
  const current = result && result.key === key ? result : null;

  async function save() {
    if (!bytes) return;
    setBusy(true);
    setError(null);
    try {
      const out = await cropPages(bytes, rects);
      setResult({ key, blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }) });
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  const name = file ? `${safeFileName(baseName(file.name), "document")}-cropped.pdf` : "cropped.pdf";
  const pct = (v: number) => `${v * 100}%`;
  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.choose}>
        <SingleFile file={file} rules={rules} typesLabel={t.types} status={bytes ? t.pages(count) : file && !error ? t.reading : null} onFile={open} onClear={() => { job.current++; void doc.current?.destroy(); doc.current = null; setFile(null); setBytes(null); setImage(null); setError(null); setResult(null); }} />
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
      </Panel>

      {bytes && (
        <Panel
          title={t.cropTitle}
          actions={<Button variant="ghost" size="sm" disabled={cropCount === 0 && isFull(box)} onClick={() => { setAllBox(FULL); setBoxes({}); }}>{t.reset}</Button>}
        >
          <p className="text-sm text-muted">{t.hint}</p>
          <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <legend className="sr-only">{t.scope}</legend>
            <span className="text-sm font-medium">{t.scope}</span>
            {(["all", "one"] as const).map((v) => (
              <label key={v} className="flex min-h-9 cursor-pointer items-center gap-2 text-sm">
                <input type="radio" name="crop-scope" value={v} checked={scope === v} onChange={() => setScope(v)} className="size-4 accent-[var(--accent)]" />
                {v === "all" ? t.all : t.one}
              </label>
            ))}
          </fieldset>
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" size="sm" aria-label={t.prev} disabled={page <= 1} onClick={() => setPage(page - 1)}><Icon name="chevron-right" size={16} className="rotate-180" /></Button>
            <span className="min-w-28 text-center text-sm font-medium">{t.of(page, count)}</span>
            <Button variant="secondary" size="sm" aria-label={t.next} disabled={page >= count} onClick={() => setPage(page + 1)}><Icon name="chevron-right" size={16} /></Button>
          </div>
          <div className="mx-auto w-full max-w-2xl">
            <div data-crop-area data-testid="crop-area" className="relative mx-auto w-full select-none overflow-hidden rounded-lg border border-line bg-surface-2" style={{ aspectRatio: String(ratio), maxHeight: "75vh" }}>
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL
                <img src={image} alt={t.page(page)} draggable={false} className="absolute inset-0 size-full" />
              ) : (
                <span className="absolute inset-0 grid place-items-center"><Icon name="loader" size={22} className="animate-spin text-muted" /></span>
              )}
              <div className="absolute inset-0 cursor-crosshair [touch-action:none]" onPointerDown={(e) => begin("draw", e)} onPointerMove={update} onPointerUp={end} onPointerCancel={end} />
              {/* The cropped-away area is dimmed with four bands around the box. */}
              <div className="pointer-events-none absolute inset-x-0 top-0 bg-black/45" style={{ height: pct(box.y0) }} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/45" style={{ height: pct(1 - box.y1) }} />
              <div className="pointer-events-none absolute bg-black/45" style={{ left: 0, width: pct(box.x0), top: pct(box.y0), height: pct(box.y1 - box.y0) }} />
              <div className="pointer-events-none absolute bg-black/45" style={{ right: 0, width: pct(1 - box.x1), top: pct(box.y0), height: pct(box.y1 - box.y0) }} />
              <div
                role="group"
                aria-label={t.box}
                tabIndex={0}
                data-testid="crop-box"
                className="absolute cursor-move border-2 border-accent [touch-action:none]"
                style={{ left: pct(box.x0), top: pct(box.y0), width: pct(box.x1 - box.x0), height: pct(box.y1 - box.y0) }}
                onPointerDown={(e) => begin("move", e)}
                onPointerMove={update}
                onPointerUp={end}
                onPointerCancel={end}
                onKeyDown={(e) => nudge(e, "move")}
              >
                {HANDLES.map((h) => {
                  const left = h.includes("w") ? "0%" : h.includes("e") ? "100%" : "50%";
                  const top = h.includes("n") ? "0%" : h.includes("s") ? "100%" : "50%";
                  const cursor = h === "n" || h === "s" ? "ns-resize" : h === "e" || h === "w" ? "ew-resize" : h === "nw" || h === "se" ? "nwse-resize" : "nesw-resize";
                  return (
                    <div
                      key={h}
                      role="button"
                      tabIndex={0}
                      aria-label={t.handle(h)}
                      data-handle={h}
                      className="absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center [touch-action:none]"
                      style={{ left, top, cursor }}
                      onPointerDown={(e) => begin(h, e)}
                      onPointerMove={update}
                      onPointerUp={end}
                      onPointerCancel={end}
                      onKeyDown={(e) => nudge(e, h)}
                    >
                      <span className="size-3.5 rounded-full border-2 border-accent bg-surface shadow-sm" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <Button size="lg" onClick={save} disabled={cropCount === 0 || busy}>
              <Icon name={busy ? "loader" : "crop"} size={18} className={busy ? "animate-spin" : undefined} /> {busy ? t.saving : t.save}
            </Button>
            {current && <DownloadButton filename={name} getBlob={() => current.blob} variant="primary" size="md" />}
            {cropCount === 0 ? <span className="text-sm text-muted">{t.nothing}</span> : <span className="text-sm text-muted">{t.cropped(cropCount)}</span>}
          </div>
        </Panel>
      )}
    </div>
  );
}
