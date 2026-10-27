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
import { moveItem, organizePdf } from "@/lib/pdf/organize";
import { inspectPdf, PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { openPdf, renderPage, type RenderedDoc } from "@/lib/pdf/render";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
const MAX_THUMBS = 300;
const THUMB_DPI = 48;
const PREVIEW_DPI = 110;
const ZOOM_MIN = 90;
const ZOOM_MAX = 360;
const ZOOM_STEP = 10;
const ZOOM_DEFAULT = 170;
const ZOOM_KEY = "artify.organize-pdf.zoom";
// Mouse: a click opens the preview, moving the pointer or holding the button picks the page up.
// Touch: a tap opens the preview, a long press picks the page up (moving first just scrolls).
const HOLD_MS = { mouse: 220, touch: 380 };
const SLOP = { mouse: 6, touch: 10 };

const strings = {
  en: {
    choose: "Choose a PDF", types: "PDF", pages: (n: number) => `${n} page${n === 1 ? "" : "s"}`, reading: "Reading your PDF…",
    pagesTitle: "Pages", hint: "Click a page to preview it. Press and hold, or drag, to move it. Delete what you don't need and rotate any sideways page.",
    kept: (k: number, n: number) => `${k} of ${n} pages kept`, reset: "Reset",
    zoom: "Thumbnail size", zoomOut: "Smaller thumbnails", zoomIn: "Larger thumbnails",
    preview: (n: number) => `Preview page ${n}`, previewTitle: (n: number, pos: number, total: number) => `Page ${n} · position ${pos} of ${total}`, close: "Close preview", prev: "Previous page", next: "Next page",
    drag: (n: number) => `Drag page ${n} to reorder`, earlier: (n: number) => `Move page ${n} earlier`, later: (n: number) => `Move page ${n} later`, left: (n: number) => `Rotate page ${n} left`, right: (n: number) => `Rotate page ${n} right`,
    remove: (n: number) => `Delete page ${n}`, page: (n: number) => `Page ${n}`,
    save: "Save organized PDF", saving: "Saving…", nothing: "Reorder, delete or rotate a page first.", empty: "Every page is deleted. Press Reset to bring them back.",
    many: (n: number) => `Only the first ${n} pages can be organized here. Split the PDF first for longer documents.`,
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    failed: "Saving failed. The file may be damaged.",
  },
  ar: {
    choose: "اختر ملف PDF", types: "PDF", pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"), reading: "جارٍ قراءة ملف PDF…",
    pagesTitle: "الصفحات", hint: "انقر على صفحة لمعاينتها. اضغط مطولًا أو اسحب لنقلها. احذف ما لا تحتاجه ودوّر أي صفحة مائلة.",
    kept: (k: number, n: number) => `${k} من ${n} صفحة محتفظ بها`, reset: "إعادة ضبط",
    zoom: "حجم المصغّرات", zoomOut: "مصغّرات أصغر", zoomIn: "مصغّرات أكبر",
    preview: (n: number) => `معاينة الصفحة ${n}`, previewTitle: (n: number, pos: number, total: number) => `الصفحة ${n} · الموضع ${pos} من ${total}`, close: "إغلاق المعاينة", prev: "الصفحة السابقة", next: "الصفحة التالية",
    drag: (n: number) => `اسحب الصفحة ${n} لإعادة ترتيبها`, earlier: (n: number) => `تقديم الصفحة ${n}`, later: (n: number) => `تأخير الصفحة ${n}`, left: (n: number) => `تدوير الصفحة ${n} لليسار`, right: (n: number) => `تدوير الصفحة ${n} لليمين`,
    remove: (n: number) => `حذف الصفحة ${n}`, page: (n: number) => `الصفحة ${n}`,
    save: "حفظ الملف بعد التنظيم", saving: "جارٍ الحفظ…", nothing: "رتّب صفحة أو احذفها أو دوّرها أولًا.", empty: "حُذفت كل الصفحات. اضغط «إعادة ضبط» لاسترجاعها.",
    many: (n: number) => `يمكن تنظيم أول ${n} صفحة فقط هنا. قسّم الملف أولًا للمستندات الأطول.`,
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    failed: "فشل الحفظ. قد يكون الملف تالفًا.",
  },
};

interface Item { source: number; turn: number }
interface Size { w: number; h: number }

/** The thumbnail size remembered from the last visit. */
function readZoom(): number {
  try {
    const v = Number(localStorage.getItem(ZOOM_KEY));
    if (v >= ZOOM_MIN && v <= ZOOM_MAX) return v;
  } catch { /* storage unavailable */ }
  return ZOOM_DEFAULT;
}

/**
 * A page image that fills its frame exactly. The frame takes the page's own proportions
 * (swapped when the page is turned sideways), so there is no padding around the picture.
 */
function PageImage({ src, size, turn, alt, maxHeight }: { src?: string; size?: Size; turn: number; alt: string; maxHeight?: string }) {
  const sideways = turn % 180 !== 0;
  const w = size?.w ?? 3;
  const h = size?.h ?? 4;
  const aspect = Math.min(2.5, Math.max(0.4, sideways ? h / w : w / h));
  const style: React.CSSProperties = { aspectRatio: String(aspect) };
  if (maxHeight) style.width = `min(100%, calc(${maxHeight} * ${aspect}))`;
  return (
    <div className="relative mx-auto w-full overflow-hidden rounded-md bg-surface-2 shadow-sm" style={style}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- local object URL
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="absolute inset-0 m-auto select-none transition-transform duration-200"
          style={{
            // Unturned: fill the frame. Turned a quarter: the picture is sized to the frame's swapped sides so the turned result still fills it.
            width: sideways ? `${100 / aspect}%` : "100%",
            height: sideways ? `${100 * aspect}%` : "100%",
            transform: `rotate(${turn}deg)`,
          }}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center"><Icon name="loader" size={20} className="animate-spin text-muted" /></span>
      )}
    </div>
  );
}

export default function OrganizePdf() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [count, setCount] = useState(0);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  // The size controls only appear after a file is chosen, so reading the saved size up front can't cause a hydration mismatch.
  const [zoom, setZoom] = useState(readZoom);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const [previewAt, setPreviewAt] = useState<number | null>(null);
  const [previewImg, setPreviewImg] = useState<{ source: number; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ key: string; blob: Blob } | null>(null);
  const [busy, setBusy] = useState(false);
  const urls = useRef<string[]>([]);
  const job = useRef(0);
  const over = useRef<number | null>(null);
  const pointerY = useRef(0);
  const justOpened = useRef(false);
  const doc = useRef<RenderedDoc | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const previewJob = useRef(0);
  const previewUrl = useRef<string | null>(null);

  const changeZoom = (v: number) => {
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v));
    setZoom(next);
    try { localStorage.setItem(ZOOM_KEY, String(next)); } catch { /* storage unavailable */ }
  };

  const releaseDoc = () => {
    void doc.current?.destroy();
    doc.current = null;
  };
  const clearThumbs = () => {
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = [];
    setThumbs([]);
    setSizes([]);
  };
  useEffect(() => () => {
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    void doc.current?.destroy();
  }, []);

  const fresh = (n: number): Item[] => Array.from({ length: Math.min(n, MAX_THUMBS) }, (_, i) => ({ source: i + 1, turn: 0 }));

  async function open(f: File) {
    const id = ++job.current;
    clearThumbs();
    releaseDoc();
    closePreview();
    setFile(f);
    setBytes(null);
    setError(null);
    setResult(null);
    try {
      const b = new Uint8Array(await f.arrayBuffer());
      const info = await inspectPdf(b);
      setBytes(b);
      setCount(info.pageCount);
      setItems(fresh(info.pageCount));
      const d = await openPdf(b);
      if (job.current !== id) { void d.destroy(); return; }
      doc.current = d;
      for (let p = 1; p <= Math.min(d.numPages, MAX_THUMBS); p++) {
        if (job.current !== id) break;
        const r = await renderPage(d, p, { dpi: THUMB_DPI, format: "jpg", quality: 0.75 });
        const u = URL.createObjectURL(r.blob);
        urls.current.push(u);
        setThumbs((x) => [...x, u]);
        setSizes((x) => [...x, { w: r.width, h: r.height }]);
      }
    } catch (e) {
      setError(e instanceof PdfError ? t.errors[e.code] : t.errors.invalid);
    }
  }

  const shown = Math.min(count, MAX_THUMBS);
  const turn = (i: number, d: number) => setItems((xs) => xs.map((x, k) => (k === i ? { ...x, turn: (x.turn + d + 360) % 360 } : x)));
  const remove = (i: number) => setItems((xs) => xs.filter((_, k) => k !== i));
  const move = (from: number, to: number) => setItems((xs) => moveItem(xs, from, to));
  const reset = () => setItems(fresh(count));

  // ---- Preview popup -------------------------------------------------------
  function openPreview(i: number) {
    justOpened.current = true;
    window.setTimeout(() => { justOpened.current = false; }, 450);
    setPreviewAt(i);
    if (!dialog.current?.open) dialog.current?.showModal();
  }
  function closePreview() {
    previewJob.current++;
    if (dialog.current?.open) dialog.current.close();
    setPreviewAt(null);
  }
  const previewSource = previewAt !== null ? items[previewAt]?.source : undefined;
  useEffect(() => {
    if (previewSource === undefined || !doc.current) return;
    const id = ++previewJob.current;
    const d = doc.current;
    void renderPage(d, previewSource, { dpi: PREVIEW_DPI, format: "jpg", quality: 0.88 }).then((r) => {
      if (previewJob.current !== id) return;
      const u = URL.createObjectURL(r.blob);
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = u;
      setPreviewImg({ source: previewSource, url: u });
    }).catch(() => { /* the thumbnail stays as the fallback */ });
  }, [previewSource]);

  // ---- Picking a page up: click, hold or drag ---------------------------------
  // A pending press decides what the gesture is. Release early (without moving) = click = preview.
  // Move past the slop (mouse) or hold long enough (mouse and touch) = drag. Touch that moves first = scroll.
  const startDrag = (i: number, x: number, y: number) => {
    if (items.length < 2) return;
    over.current = i;
    pointerY.current = y;
    setDragFrom(i);
    setOverIndex(i);
    setGhost({ x, y });
  };

  const press = (i: number, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const kind = e.pointerType === "mouse" ? "mouse" : "touch";
    const sx = e.clientX, sy = e.clientY;
    let settled = false;
    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
    const pickUp = (x: number, y: number) => { settled = true; cleanup(); startDrag(i, x, y); };
    let last = { x: sx, y: sy };
    const timer = window.setTimeout(() => { if (!settled) pickUp(last.x, last.y); }, HOLD_MS[kind]);
    const onMove = (ev: PointerEvent) => {
      last = { x: ev.clientX, y: ev.clientY };
      if (Math.hypot(ev.clientX - sx, ev.clientY - sy) <= SLOP[kind]) return;
      if (kind === "mouse") pickUp(ev.clientX, ev.clientY);
      else { settled = true; cleanup(); } // a touch that moves before the long press is a scroll
    };
    const onUp = () => { if (!settled) { settled = true; cleanup(); openPreview(i); } };
    const onCancel = () => { settled = true; cleanup(); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  };

  // The handle picks a page up straight away, for touch and pen users who want it instantly.
  const grab = (i: number, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    startDrag(i, e.clientX, e.clientY);
  };

  useEffect(() => {
    if (dragFrom === null) return;
    const from = dragFrom;
    let raf = 0;
    let lastY = pointerY.current; // where the pick-up happened, so a long press near the middle never scrolls
    const edge = () => {
      if (lastY < 70) window.scrollBy(0, -14);
      else if (lastY > window.innerHeight - 70) window.scrollBy(0, 14);
      raf = requestAnimationFrame(edge);
    };
    raf = requestAnimationFrame(edge);
    const onMove = (e: PointerEvent) => {
      lastY = e.clientY;
      setGhost({ x: e.clientX, y: e.clientY });
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-page-index]");
      if (el) {
        const idx = Number(el.dataset.pageIndex);
        over.current = idx;
        setOverIndex(idx);
      }
    };
    const finish = (commit: boolean) => {
      const to = over.current;
      if (commit && to !== null && to !== from) setItems((xs) => moveItem(xs, from, to));
      over.current = null;
      setDragFrom(null);
      setOverIndex(null);
      setGhost(null);
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") finish(false); };
    // Once a page is picked up, the finger moves the page instead of scrolling the screen.
    const noScroll = (e: TouchEvent) => { if (e.cancelable) e.preventDefault(); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchmove", noScroll, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchmove", noScroll);
    };
  }, [dragFrom]);

  const unchanged = items.length === shown && items.every((x, i) => x.source === i + 1 && x.turn === 0);
  const key = `${file?.name}|${file?.size}|${items.map((x) => `${x.source}:${x.turn}`).join(",")}`;
  const current = result && result.key === key ? result : null;

  async function save() {
    if (!bytes || items.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const out = await organizePdf(bytes, items);
      setResult({ key, blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }) });
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  const name = file ? `${safeFileName(baseName(file.name), "document")}-organized.pdf` : "organized.pdf";
  const previewItem = previewAt !== null ? items[previewAt] : undefined;
  const pct = ((zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100;
  const stepPreview = (d: number) => setPreviewAt((p) => (p === null ? p : Math.min(items.length - 1, Math.max(0, p + d))));
  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.choose}>
        <SingleFile file={file} rules={rules} typesLabel={t.types} status={bytes ? t.pages(count) : file && !error ? t.reading : null} onFile={open} onClear={() => { job.current++; clearThumbs(); releaseDoc(); closePreview(); setFile(null); setBytes(null); setItems([]); setError(null); setResult(null); }} />
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
      </Panel>

      {bytes && (
        <Panel
          title={t.pagesTitle}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted">{t.kept(items.length, count)}</span>
              <Button variant="ghost" size="sm" disabled={unchanged} onClick={reset}>{t.reset}</Button>
            </div>
          }
        >
          <p className="text-sm text-muted">{t.hint}</p>
          {count > MAX_THUMBS && <StatusMessage tone="info">{t.many(MAX_THUMBS)}</StatusMessage>}
          {items.length === 0 && <StatusMessage tone="info">{t.empty}</StatusMessage>}

          <div className="flex items-center gap-2 self-start rounded-full border border-line bg-surface-2 px-2 py-1 shadow-sm">
            <button type="button" aria-label={t.zoomOut} disabled={zoom <= ZOOM_MIN} onClick={() => changeZoom(zoom - ZOOM_STEP * 2)} className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-fg disabled:opacity-40">
              <span aria-hidden="true" className="block h-0.5 w-3.5 rounded bg-current" />
            </button>
            <input
              id="organize-zoom"
              type="range"
              className="zoom-range w-36 sm:w-52"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={ZOOM_STEP}
              value={zoom}
              aria-label={t.zoom}
              onChange={(e) => changeZoom(Number(e.target.value))}
              style={{ ["--fill" as string]: `${pct}%` }}
            />
            <button type="button" aria-label={t.zoomIn} disabled={zoom >= ZOOM_MAX} onClick={() => changeZoom(zoom + ZOOM_STEP * 2)} className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-fg disabled:opacity-40">
              <span aria-hidden="true" className="relative block size-3.5"><span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded bg-current" /><span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded bg-current" /></span>
            </button>
            <span className="min-w-10 text-end text-xs font-medium tabular-nums text-muted" aria-hidden="true">{Math.round((zoom / ZOOM_DEFAULT) * 100)}%</span>
          </div>

          <ul className="grid items-start gap-3" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${zoom}px, 100%), ${zoom}px))` }}>
            {items.map((it, i) => (
              <li
                key={it.source}
                data-page-index={i}
                className={`relative flex flex-col gap-2 rounded-lg border p-2 ${overIndex === i && dragFrom !== null && dragFrom !== i ? "border-accent bg-accent-soft" : "border-line"} ${dragFrom === i ? "opacity-40" : ""}`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={t.preview(it.source)}
                  onPointerDown={(e) => press(i, e)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPreview(i); } }}
                  onContextMenu={(e) => e.preventDefault()}
                  className={`select-none rounded-md [-webkit-touch-callout:none] [touch-action:pan-y] focus-visible:outline-2 ${dragFrom === null ? "cursor-pointer" : "cursor-grabbing"}`}
                >
                  <PageImage src={thumbs[it.source - 1]} size={sizes[it.source - 1]} turn={it.turn} alt={t.page(it.source)} />
                </div>
                <button
                  type="button"
                  aria-label={t.drag(it.source)}
                  onPointerDown={(e) => grab(i, e)}
                  className="absolute start-3 top-3 z-10 grid size-8 cursor-grab touch-none place-items-center rounded-md bg-surface/90 text-muted shadow-sm hover:text-fg active:cursor-grabbing"
                >
                  <Icon name="arrow-up-down" size={15} className="rotate-90" />
                </button>
                <span className="text-center text-xs text-muted">{t.page(it.source)}</span>
                <div className="flex w-full flex-wrap items-center justify-center gap-0.5">
                  <Button variant="ghost" size="sm" className="!px-1.5" aria-label={t.earlier(it.source)} disabled={i === 0} onClick={() => move(i, i - 1)}><Icon name="chevron-up" size={16} className="-rotate-90 rtl:rotate-90" /></Button>
                  <Button variant="ghost" size="sm" className="!px-1.5" aria-label={t.later(it.source)} disabled={i === items.length - 1} onClick={() => move(i, i + 1)}><Icon name="chevron-down" size={16} className="-rotate-90 rtl:rotate-90" /></Button>
                  <Button variant="ghost" size="sm" className="!px-1.5" aria-label={t.left(it.source)} onClick={() => turn(i, -90)}><Icon name="rotate-ccw" size={16} /></Button>
                  <Button variant="ghost" size="sm" className="!px-1.5" aria-label={t.right(it.source)} onClick={() => turn(i, 90)}><Icon name="rotate-cw" size={16} /></Button>
                  <Button variant="ghost" size="sm" className="!px-1.5 text-danger" aria-label={t.remove(it.source)} onClick={() => remove(i)}><Icon name="trash" size={16} /></Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <Button size="lg" onClick={save} disabled={unchanged || items.length === 0 || busy}>
              <Icon name={busy ? "loader" : "layers"} size={18} className={busy ? "animate-spin" : undefined} /> {busy ? t.saving : t.save}
            </Button>
            {current && <DownloadButton filename={name} getBlob={() => current.blob} variant="primary" size="md" />}
            {unchanged && <span className="text-sm text-muted">{t.nothing}</span>}
          </div>
        </Panel>
      )}

      <dialog
        ref={dialog}
        aria-label={previewItem ? t.page(previewItem.source) : t.pagesTitle}
        onClose={() => setPreviewAt(null)}
        // A touch tap opens the preview on release and the browser then sends its click to whatever is on top, which is now the backdrop; ignore that one.
        onClick={(e) => { if (e.target === dialog.current && !justOpened.current) closePreview(); }}
        onKeyDown={(e) => {
          const rtl = document.documentElement.dir === "rtl";
          if (e.key === "ArrowRight") stepPreview(rtl ? -1 : 1);
          if (e.key === "ArrowLeft") stepPreview(rtl ? 1 : -1);
        }}
        className="m-auto max-h-[94dvh] w-[min(60rem,94vw)] max-w-none overflow-hidden rounded-xl border border-line bg-canvas p-0 text-fg shadow-overlay backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        {previewItem && previewAt !== null && (
          <div className="flex max-h-[94dvh] flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{t.previewTitle(previewItem.source, previewAt + 1, items.length)}</p>
              <button type="button" aria-label={t.close} onClick={closePreview} className="grid size-9 place-items-center rounded-md hover:bg-surface-2"><Icon name="x" size={20} /></button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-lg bg-surface-2 p-3">
              <PageImage
                src={previewImg && previewImg.source === previewItem.source ? previewImg.url : thumbs[previewItem.source - 1]}
                size={sizes[previewItem.source - 1]}
                turn={previewItem.turn}
                alt={t.page(previewItem.source)}
                maxHeight="72dvh"
              />
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" disabled={previewAt === 0} onClick={() => stepPreview(-1)} aria-label={t.prev}><Icon name="chevron-up" size={16} className="-rotate-90 rtl:rotate-90" /> {t.prev}</Button>
              <Button variant="secondary" size="sm" disabled={previewAt === items.length - 1} onClick={() => stepPreview(1)} aria-label={t.next}>{t.next} <Icon name="chevron-down" size={16} className="-rotate-90 rtl:rotate-90" /></Button>
            </div>
          </div>
        )}
      </dialog>

      {ghost && dragFrom !== null && items[dragFrom] && thumbs[items[dragFrom]!.source - 1] && (
        // eslint-disable-next-line @next/next/no-img-element -- local object URL
        <img
          src={thumbs[items[dragFrom]!.source - 1]}
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed z-50 w-20 rounded-md border-2 border-accent bg-surface shadow-lg"
          style={{ left: ghost.x, top: ghost.y, transform: `translate(-50%, -50%) rotate(${items[dragFrom]!.turn}deg)` }}
        />
      )}
    </div>
  );
}
