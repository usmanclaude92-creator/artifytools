"use client";

import { useEffect, useRef, useState } from "react";
import { FileDropZone } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { acceptAttribute, formatBytes, validateFiles, type Rejection } from "@/lib/files";
import { baseName, safeFileName } from "@/lib/files/names";
import { moveItem, organizePdfs } from "@/lib/pdf/organize";
import { inspectPdf, PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { openPdf, renderPage, type RenderedDoc } from "@/lib/pdf/render";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
const MAX_PAGES = 300; // across all files
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
    clearAll: "Clear all", replace: "Replace File", addMore: "Add More Files", removeFile: (name: string) => `Remove ${name}`, filesTitle: "Your files", pageOf: (n: number, name: string) => `Page ${n} of ${name}`, shortPage: (n: number, f: number) => `File ${f} · Page ${n}`,
    badFile: (name: string) => `“${name}” couldn't be read as a PDF, so it wasn't added.`, lockedFile: (name: string) => `“${name}” is password-protected, so it wasn't added. Unlock it first.`,
    pagesTitle: "Pages", hint: "Click a page to preview it. Press and hold, or drag, to move it. Delete what you don't need and rotate any sideways page.",
    kept: (k: number, n: number) => `${k} of ${n} pages kept`, reset: "Reset",
    zoom: "Thumbnail size", zoomOut: "Smaller thumbnails", zoomIn: "Larger thumbnails",
    preview: (n: number) => `Preview page ${n}`, previewTitle: (n: number, pos: number, total: number) => `Page ${n} · position ${pos} of ${total}`, close: "Close preview", prev: "Previous page", next: "Next page",
    earlier: (n: number) => `Move page ${n} earlier`, later: (n: number) => `Move page ${n} later`, left: (n: number) => `Rotate page ${n} left`, right: (n: number) => `Rotate page ${n} right`,
    remove: (n: number) => `Delete page ${n}`, page: (n: number) => `Page ${n}`,
    save: "Save organized PDF", saving: "Saving…", nothing: "Reorder, delete or rotate a page first.", empty: "Every page is deleted. Press Reset to bring them back.",
    many: (n: number) => `Only ${n} pages can be organized at once, so some pages weren't added. Split a long PDF first.`,
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    failed: "Saving failed. The file may be damaged.",
  },
  ar: {
    choose: "اختر ملف PDF", types: "PDF", pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"), reading: "جارٍ قراءة ملف PDF…",
    clearAll: "مسح الكل", replace: "استبدال الملف", addMore: "إضافة ملفات أخرى", removeFile: (name: string) => `إزالة ${name}`, filesTitle: "ملفاتك", pageOf: (n: number, name: string) => `الصفحة ${n} من ${name}`, shortPage: (n: number, f: number) => `الملف ${f} · الصفحة ${n}`,
    badFile: (name: string) => `تعذّرت قراءة «${name}» كملف PDF، فلم يُضف.`, lockedFile: (name: string) => `«${name}» محمي بكلمة مرور، فلم يُضف. فك حمايته أولًا.`,
    pagesTitle: "الصفحات", hint: "انقر على صفحة لمعاينتها. اضغط مطولًا أو اسحب لنقلها. احذف ما لا تحتاجه ودوّر أي صفحة مائلة.",
    kept: (k: number, n: number) => `${k} من ${n} صفحة محتفظ بها`, reset: "إعادة ضبط",
    zoom: "حجم المصغّرات", zoomOut: "مصغّرات أصغر", zoomIn: "مصغّرات أكبر",
    preview: (n: number) => `معاينة الصفحة ${n}`, previewTitle: (n: number, pos: number, total: number) => `الصفحة ${n} · الموضع ${pos} من ${total}`, close: "إغلاق المعاينة", prev: "الصفحة السابقة", next: "الصفحة التالية",
    earlier: (n: number) => `تقديم الصفحة ${n}`, later: (n: number) => `تأخير الصفحة ${n}`, left: (n: number) => `تدوير الصفحة ${n} لليسار`, right: (n: number) => `تدوير الصفحة ${n} لليمين`,
    remove: (n: number) => `حذف الصفحة ${n}`, page: (n: number) => `الصفحة ${n}`,
    save: "حفظ الملف بعد التنظيم", saving: "جارٍ الحفظ…", nothing: "رتّب صفحة أو احذفها أو دوّرها أولًا.", empty: "حُذفت كل الصفحات. اضغط «إعادة ضبط» لاسترجاعها.",
    many: (n: number) => `يمكن تنظيم ${n} صفحة فقط في المرة الواحدة، لذلك لم تُضف بعض الصفحات. قسّم الملف الطويل أولًا.`,
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    failed: "فشل الحفظ. قد يكون الملف تالفًا.",
  },
};

interface Item { doc: number; source: number; turn: number }
interface Doc { id: number; file: File; bytes: Uint8Array; pageCount: number }
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
 * A page image that fills its frame exactly. The frame takes the page's own (upright) proportions and keeps them
 * when the page is turned, so turning never resizes the card; a sideways page is scaled down to fit inside it.
 */
function PageImage({ src, size, turn, alt, maxHeight }: { src?: string; size?: Size; turn: number; alt: string; maxHeight?: string }) {
  const sideways = turn % 180 !== 0;
  const w = size?.w ?? 3;
  const h = size?.h ?? 4;
  const aspect = Math.min(2.5, Math.max(0.4, w / h));
  // Turned a quarter, the picture's sides swap: scale it so its turned shape fits the same frame.
  const fit = sideways ? `${aspect * Math.min(1, 1 / (aspect * aspect)) * 100}%` : "100%";
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
            // Unturned: fill the frame. Turned a quarter: fit inside the unchanged frame.
            width: fit,
            height: fit,
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
  const fm = useMessages().files;
  const [docs, setDocs] = useState<Doc[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [sizes, setSizes] = useState<Record<string, Size>>({});
  const [items, setItems] = useState<Item[]>([]);
  // The size controls only appear after a file is chosen, so reading the saved size up front can't cause a hydration mismatch.
  const [zoom, setZoom] = useState(readZoom);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const [previewAt, setPreviewAt] = useState<number | null>(null);
  const [previewImg, setPreviewImg] = useState<{ key: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejections, setRejections] = useState<Rejection<File>[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState<{ key: string; blob: Blob } | null>(null);
  const [busy, setBusy] = useState(false);
  const urls = useRef<Map<string, string>>(new Map());
  const pdfs = useRef<Map<number, RenderedDoc>>(new Map());
  const generation = useRef(0); // bumped whenever the whole set is replaced, which cancels in-flight thumbnail work
  const nextId = useRef(1);
  const pageTotal = useRef(0);
  const over = useRef<number | null>(null);
  const pointerY = useRef(0);
  const justOpened = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const addInput = useRef<HTMLInputElement>(null);
  const previewJob = useRef(0);
  const previewUrl = useRef<string | null>(null);

  const changeZoom = (v: number) => {
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v));
    setZoom(next);
    try { localStorage.setItem(ZOOM_KEY, String(next)); } catch { /* storage unavailable */ }
  };

  const forget = (id?: number) => {
    // Free the thumbnails and the open PDF of one file, or of every file.
    for (const [key, u] of [...urls.current]) {
      if (id === undefined || key.startsWith(`${id}:`)) { URL.revokeObjectURL(u); urls.current.delete(key); }
    }
    for (const [docId, d] of [...pdfs.current]) {
      if (id === undefined || docId === id) { void d.destroy(); pdfs.current.delete(docId); }
    }
  };
  useEffect(() => () => {
    const u = urls.current;
    const p = pdfs.current;
    u.forEach((x) => URL.revokeObjectURL(x));
    p.forEach((d) => void d.destroy());
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
  }, []);

  const key = (it: { doc: number; source: number }) => `${it.doc}:${it.source}`;
  const freshItems = (list: Doc[], limit = MAX_PAGES): Item[] => {
    const out: Item[] = [];
    for (const d of list) for (let p = 1; p <= d.pageCount && out.length < limit; p++) out.push({ doc: d.id, source: p, turn: 0 });
    return out;
  };

  async function readFiles(files: File[], replace: boolean) {
    const id = replace ? ++generation.current : generation.current;
    if (replace) {
      forget();
      closePreview();
      setDocs([]);
      setItems([]);
      setThumbs({});
      setSizes({});
      pageTotal.current = 0;
    }
    setError(null);
    setResult(null);
    setTruncated(false);
    setReading(true);
    const added: Doc[] = [];
    let cut = false;
    for (const f of files) {
      if (generation.current !== id) return;
      try {
        const bytes = new Uint8Array(await f.arrayBuffer());
        const info = await inspectPdf(bytes);
        const room = MAX_PAGES - pageTotal.current;
        if (room <= 0) { cut = true; continue; }
        const used = Math.min(info.pageCount, room);
        if (used < info.pageCount) cut = true;
        const doc: Doc = { id: nextId.current++, file: f, bytes, pageCount: used };
        pageTotal.current += used;
        added.push(doc);
        setDocs((x) => [...x, doc]);
        setItems((x) => [...x, ...freshItems([doc])]);
      } catch (e) {
        const name = `⁨${f.name}⁩`;
        setError(e instanceof PdfError && e.code === "encrypted" ? t.lockedFile(name) : t.badFile(name));
      }
    }
    setTruncated(cut);
    setReading(false);
    // Thumbnails fill in file by file, page by page, so the grid is usable straight away.
    for (const doc of added) {
      if (generation.current !== id) return;
      try {
        const d = await openPdf(doc.bytes);
        if (generation.current !== id) { void d.destroy(); return; }
        pdfs.current.set(doc.id, d);
        for (let p = 1; p <= doc.pageCount; p++) {
          if (generation.current !== id || !pdfs.current.has(doc.id)) break;
          const r = await renderPage(d, p, { dpi: THUMB_DPI, format: "jpg", quality: 0.75 });
          if (!pdfs.current.has(doc.id)) break; // the file was removed meanwhile
          const k = `${doc.id}:${p}`;
          const u = URL.createObjectURL(r.blob);
          urls.current.set(k, u);
          setThumbs((x) => ({ ...x, [k]: u }));
          setSizes((x) => ({ ...x, [k]: { w: r.width, h: r.height } }));
        }
      } catch {
        setError(t.errors.invalid);
      }
    }
  }

  const pick = (list: FileList | null, replace: boolean) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    // A replacement starts from nothing, so the limits are checked against no existing files.
    const existing = replace ? [] : docs.map((d) => d.file);
    const { accepted, rejected } = validateFiles(files, existing, rules);
    setRejections(rejected);
    if (accepted.length) void readFiles(replace ? accepted.slice(0, 1) : accepted, replace);
  };

  const removeDoc = (id: number) => {
    forget(id);
    closePreview();
    pageTotal.current -= docs.find((d) => d.id === id)?.pageCount ?? 0;
    setDocs((x) => x.filter((d) => d.id !== id));
    setItems((x) => x.filter((it) => it.doc !== id));
    setThumbs((x) => Object.fromEntries(Object.entries(x).filter(([k]) => !k.startsWith(`${id}:`))));
    setSizes((x) => Object.fromEntries(Object.entries(x).filter(([k]) => !k.startsWith(`${id}:`))));
    setResult(null);
  };

  const clearAll = () => {
    generation.current++;
    forget();
    closePreview();
    pageTotal.current = 0;
    setDocs([]);
    setItems([]);
    setThumbs({});
    setSizes({});
    setError(null);
    setResult(null);
    setRejections([]);
    setTruncated(false);
  };

  const docIndex = (id: number) => docs.findIndex((d) => d.id === id);
  const multi = docs.length > 1;
  const labelOf = (it: Item) => (multi ? t.pageOf(it.source, docs[docIndex(it.doc)]?.file.name ?? "") : t.page(it.source));
  const turn = (i: number, d: number) => setItems((xs) => xs.map((x, k) => (k === i ? { ...x, turn: (x.turn + d + 360) % 360 } : x)));
  const remove = (i: number) => setItems((xs) => xs.filter((_, k) => k !== i));
  const move = (from: number, to: number) => setItems((xs) => moveItem(xs, from, to));
  const reset = () => setItems(freshItems(docs));
  const totalPages = docs.reduce((n, d) => n + d.pageCount, 0);

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
  const previewItem = previewAt !== null ? items[previewAt] : undefined;
  const previewKey = previewItem ? key(previewItem) : undefined;
  useEffect(() => {
    if (!previewKey) return;
    const [docId, page] = previewKey.split(":").map(Number) as [number, number];
    const d = pdfs.current.get(docId);
    if (!d) return;
    const id = ++previewJob.current;
    void renderPage(d, page, { dpi: PREVIEW_DPI, format: "jpg", quality: 0.88 }).then((r) => {
      if (previewJob.current !== id) return;
      const u = URL.createObjectURL(r.blob);
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = u;
      setPreviewImg({ key: previewKey, url: u });
    }).catch(() => { /* the thumbnail stays as the fallback */ });
  }, [previewKey]);

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

  // One file with every page in its original order and no turns is exactly the input: nothing to save.
  const unchanged = docs.length === 1 && items.length === docs[0]!.pageCount && items.every((x, i) => x.doc === docs[0]!.id && x.source === i + 1 && x.turn === 0);
  const saveKey = `${docs.map((d) => `${d.file.name}|${d.file.size}`).join(";")}|${items.map((x) => `${x.doc}.${x.source}:${x.turn}`).join(",")}`;
  const current = result && result.key === saveKey ? result : null;

  async function save() {
    if (items.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const order = new Map(docs.map((d, i) => [d.id, i] as const));
      const out = await organizePdfs(docs.map((d) => d.bytes), items.map((x) => ({ file: order.get(x.doc)!, source: x.source, turn: x.turn })));
      setResult({ key: saveKey, blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }) });
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  const name = docs.length === 1 ? `${safeFileName(baseName(docs[0]!.file.name), "document")}-organized.pdf` : "organized.pdf";
  const pct = ((zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100;
  const stepPreview = (d: number) => setPreviewAt((p) => (p === null ? p : Math.min(items.length - 1, Math.max(0, p + d))));
  const reasonText = (r: Rejection<File>) => {
    const n = `⁨${r.file.name || "—"}⁩`;
    const max = formatBytes(rules.maxFileBytes, locale);
    switch (r.reason) {
      case "type": return fm.rejected.type(n);
      case "size": return fm.rejected.size(n, max);
      case "empty": return fm.rejected.empty(n);
      case "count": return fm.rejected.count(n, rules.maxFiles);
      case "total": return fm.rejected.total(n, formatBytes(rules.maxTotalBytes ?? 0, locale));
    }
  };
  const accept = acceptAttribute(rules.accept);

  return (
    <div className="flex flex-col gap-5">
      <Panel title={docs.length > 1 ? t.filesTitle : t.choose}>
        {docs.length === 0 ? (
          <FileDropZone rules={rules} onFiles={(fs) => void readFiles(fs, true)} typesLabel={t.types} disabled={reading} />
        ) : (
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-2">
              {docs.map((d, n) => (
                <li key={d.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-md bg-surface-2 text-muted"><Icon name="file-text" size={22} /></span>
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate font-medium" title={d.file.name}>{multi && <span className="me-1.5 text-muted">{n + 1}.</span>}<bdi>{d.file.name}</bdi></p>
                    <p className="text-sm text-muted">{formatBytes(d.file.size, locale)} · {t.pages(d.pageCount)}</p>
                  </div>
                  {multi && (
                    <button type="button" aria-label={t.removeFile(d.file.name)} onClick={() => removeDoc(d.id)} className="grid size-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-danger">
                      <Icon name="x" size={18} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" disabled={reading} onClick={() => replaceInput.current?.click()}>
                <Icon name="rotate-ccw" size={16} /> {t.replace}
              </Button>
              <Button variant="secondary" size="sm" disabled={reading || docs.length >= rules.maxFiles} onClick={() => addInput.current?.click()}>
                <Icon name="upload" size={16} /> {t.addMore}
              </Button>
              {reading && <span className="inline-flex items-center gap-1.5 text-sm text-muted"><Icon name="loader" size={15} className="animate-spin" /> {t.reading}</span>}
            </div>
            <input ref={replaceInput} type="file" className="sr-only" tabIndex={-1} aria-hidden="true" accept={accept} onChange={(e) => { pick(e.target.files, true); e.target.value = ""; }} />
            <input ref={addInput} type="file" className="sr-only" tabIndex={-1} aria-hidden="true" accept={accept} multiple onChange={(e) => { pick(e.target.files, false); e.target.value = ""; }} />
          </div>
        )}
        {rejections.length > 0 && (
          <StatusMessage tone="warning">
            <ul className="space-y-1">{rejections.map((r, i) => <li key={`${i}-${r.file.name}`}>{reasonText(r)}</li>)}</ul>
          </StatusMessage>
        )}
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
        {docs.length === 0 && reading && <p className="text-sm text-muted">{t.reading}</p>}
      </Panel>

      {docs.length > 0 && (
        <Panel
          title={t.pagesTitle}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted">{t.kept(items.length, totalPages)}</span>
              <Button variant="ghost" size="sm" disabled={unchanged} onClick={reset}>{t.reset}</Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>{t.clearAll}</Button>
          <div className="flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2 py-1 shadow-sm">
            <button type="button" aria-label={t.zoomOut} disabled={zoom <= ZOOM_MIN} onClick={() => changeZoom(zoom - ZOOM_STEP * 2)} className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-fg disabled:opacity-40">
              <span aria-hidden="true" className="block h-0.5 w-3.5 rounded bg-current" />
            </button>
            <input
              id="organize-zoom"
              type="range"
              className="zoom-range w-24 sm:w-36"
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
            </div>
          }
        >
          <p className="text-sm text-muted">{t.hint}</p>
          {truncated && <StatusMessage tone="info">{t.many(MAX_PAGES)}</StatusMessage>}
          {items.length === 0 && <StatusMessage tone="info">{t.empty}</StatusMessage>}

          <ul className="grid items-start gap-3" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${zoom}px, 100%), ${zoom}px))` }}>
            {items.map((it, i) => (
              <li
                key={key(it)}
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
                  <PageImage src={thumbs[key(it)]} size={sizes[key(it)]} turn={it.turn} alt={labelOf(it)} />
                </div>
                <span className="text-center text-xs text-muted">{multi ? t.shortPage(it.source, docIndex(it.doc) + 1) : t.page(it.source)}</span>
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
        aria-label={previewItem ? labelOf(previewItem) : t.pagesTitle}
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
                src={previewImg && previewImg.key === key(previewItem) ? previewImg.url : thumbs[key(previewItem)]}
                size={sizes[key(previewItem)]}
                turn={previewItem.turn}
                alt={labelOf(previewItem)}
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

      {ghost && dragFrom !== null && items[dragFrom] && thumbs[key(items[dragFrom]!)] && (
        // eslint-disable-next-line @next/next/no-img-element -- local object URL
        <img
          src={thumbs[key(items[dragFrom]!)]}
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed z-50 w-20 rounded-md border-2 border-accent bg-surface shadow-lg"
          style={{ left: ghost.x, top: ghost.y, transform: `translate(-50%, -50%) rotate(${items[dragFrom]!.turn}deg)` }}
        />
      )}
    </div>
  );
}
