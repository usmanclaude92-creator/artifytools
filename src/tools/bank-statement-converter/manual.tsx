"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { createOcr, type OcrEngine } from "@/lib/ocr/ocr";
import { renderPage, renderRegion, type RenderedDoc } from "@/lib/pdf/render";
import type { TextItem } from "@/lib/pdf/text-layout";
import { wordsToItems } from "@/lib/statement/ocr-items";
import { detectSplits, suggestTable, type Column, type Role } from "@/lib/statement/parse";
import { autoRowLines, mergeRows } from "@/lib/statement/rows";

export interface PageData {
  width: number;
  height: number;
  items: TextItem[];
}

export interface ManualStrings {
  help: string; addTable: string; moveTable: string; autoFit: string; addColumn: string; removeColumn: string; addRow: string; removeRow: string; removeTable: string; pickLine: string; nothingFound: string; selectTable: (n: number) => string; moveRow: (n: number) => string;
  column: (n: number) => string; roles: Record<Role, string>; convert: string; converting: string; noTables: string; scanned: string; detectFailed: string; detected: string;
  ocrLoading: string; ocrReading: (d: number, n: number) => string; failed: string; page: (n: number) => string; removeLine: (n: number) => string; moveLine: (n: number) => string;
}

interface Box {
  id: number;
  page: number;
  /** Fractions of the page (0–1). */
  x0: number; y0: number; x1: number; y1: number;
  /** Column lines as fractions of the page width, sorted, inside the box. */
  splits: number[];
  roles: Role[];
  /** Row lines as fractions of the page height, sorted, inside the box. Empty = rows are found automatically. */
  rows: number[];
}

const PREVIEW_DPI = 80;
const MAX_PAGES = 60;
const MIN_SIZE = 0.02;
/** Touch: how long a finger rests before a drag draws a table (a quicker swipe just scrolls the page). */
const HOLD_MS = 280;
const SLOP = 10;
const ROLE_ORDER: Role[] = ["date", "description", "debit", "credit", "amount", "balance", "other"];
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/** Draws tables on the pages, labels their columns, and reads only what is inside them. */
/** What the marked tables contain: one list of text items per table, and the columns the user set for it. */
export interface ManualInput {
  pages: TextItem[][];
  columns: (Column[] | null)[];
}

export function ManualSelect({ doc, pages, t, onRead }: { doc: RenderedDoc; pages: PageData[]; t: ManualStrings; onRead: (input: ManualInput | null) => void }) {
  const shown = Math.min(pages.length, MAX_PAGES);
  const [images, setImages] = useState<string[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [draft, setDraft] = useState<{ page: number; x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [pick, setPick] = useState<"col" | "row" | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const urls = useRef<string[]>([]);
  const nextId = useRef(1);
  const start = useRef<{ x: number; y: number } | null>(null);
  const pending = useRef<{ cx: number; cy: number; timer: number } | null>(null);
  const drawingActive = useRef(false);
  const moving = useRef<{ id: number; px: number; py: number; box: Box } | null>(null);
  const engine = useRef<OcrEngine | null>(null);
  const run = useRef(0);

  // Page previews, one after another so the first pages appear straight away.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      for (let p = 1; p <= shown; p++) {
        if (cancelled) return;
        try {
          const r = await renderPage(doc, p, { dpi: PREVIEW_DPI, format: "jpg", quality: 0.8 });
          if (cancelled) return;
          const u = URL.createObjectURL(r.blob);
          urls.current.push(u);
          setImages((x) => [...x, u]);
        } catch {
          return;
        }
      }
    })();
    const made = urls.current;
    return () => {
      cancelled = true;
      made.forEach((u) => URL.revokeObjectURL(u));
      urls.current = [];
      void engine.current?.terminate();
      engine.current = null;
    };
  }, [doc, shown]);

  const point = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) };
  };

  const clearPending = () => {
    if (pending.current) window.clearTimeout(pending.current.timer);
    pending.current = null;
  };
  // Mouse and pen draw straight away. A finger must rest for a moment first, so swiping still scrolls the page.
  const onDown = (page: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || e.target !== e.currentTarget) return;
    const el = e.currentTarget;
    const id = e.pointerId;
    const p = point(e);
    const begin = () => {
      try { el.setPointerCapture(id); } catch { /* the pointer is already gone */ }
      drawingActive.current = true;
      try { navigator.vibrate?.(12); } catch { /* not supported */ }
      start.current = p;
      setDraft({ page, x0: p.x, y0: p.y, x1: p.x, y1: p.y });
    };
    if (e.pointerType === "mouse" || e.pointerType === "pen") { begin(); return; }
    clearPending();
    pending.current = { cx: e.clientX, cy: e.clientY, timer: window.setTimeout(() => { pending.current = null; begin(); }, HOLD_MS) };
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pending.current) {
      if (Math.hypot(e.clientX - pending.current.cx, e.clientY - pending.current.cy) > SLOP) clearPending(); // it is a scroll
      return;
    }
    if (!start.current) return;
    const p = point(e);
    setDraft((d) => (d ? { ...d, x0: Math.min(start.current!.x, p.x), y0: Math.min(start.current!.y, p.y), x1: Math.max(start.current!.x, p.x), y1: Math.max(start.current!.y, p.y) } : d));
  };
  const onUp = () => {
    clearPending();
    drawingActive.current = false;
    const d = draft;
    start.current = null;
    setDraft(null);
    if (!d || d.x1 - d.x0 < MIN_SIZE || d.y1 - d.y0 < MIN_SIZE) return;
    const id = nextId.current++;
    setBoxes((bs) => [...bs, { id, page: d.page, x0: d.x0, y0: d.y0, x1: d.x1, y1: d.y1, splits: [], roles: ["description"], rows: [] }]);
    setSelected(id);
    onRead(null);
  };

  // While a table is being drawn, the finger draws instead of scrolling the screen. The listener sits on the page
  // overlay from the start (not added after a re-render), so the very first move of the drag is already caught.
  const blockTouch = useRef((e: TouchEvent) => { if (drawingActive.current && e.cancelable) e.preventDefault(); });
  const attachOverlay = useCallback((el: HTMLDivElement | null) => {
    if (el) el.addEventListener("touchmove", blockTouch.current, { passive: false });
  }, []);
  useEffect(() => clearPending, []);

  const resize = (b: Box, corner: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const r = e.currentTarget.closest<HTMLElement>("[data-testid^=overlay]")!.getBoundingClientRect();
    const px = clamp((e.clientX - r.left) / r.width);
    const py = clamp((e.clientY - r.top) / r.height);
    patch(b.id, (x) => {
      let { x0, y0, x1, y1 } = x;
      if (corner.includes("w")) x0 = Math.min(px, x1 - MIN_SIZE); else x1 = Math.max(px, x0 + MIN_SIZE);
      if (corner.includes("n")) y0 = Math.min(py, y1 - MIN_SIZE); else y1 = Math.max(py, y0 + MIN_SIZE);
      return { ...x, x0, y0, x1, y1, splits: x.splits.map((sp) => clamp(sp, x0 + 0.01, x1 - 0.01)), rows: x.rows.map((r) => clamp(r, y0 + 0.005, y1 - 0.005)) };
    });
  };

  // One tap marks the transactions table on every page that has none yet: the page's own text says where it sits.
  const addAll = () => {
    const added: Box[] = [];
    const anyText = pages.some((x) => x.items.length > 0);
    for (let page = 1; page <= shown; page++) {
      if (boxes.some((x) => x.page === page)) continue;
      const pg = pages[page - 1]!;
      const r = pg.items.length ? suggestTable(pg.items) : null;
      if (pg.items.length > 0 && !r) continue; // a page of text with no transactions (terms, notes)
      if (pg.items.length === 0 && anyText) continue; // a picture-only page in a document that has real text
      const box: Box = r
        ? { id: nextId.current++, page, x0: clamp(r.x0 / pg.width), x1: clamp(r.x1 / pg.width), y0: clamp(r.y0 / pg.height), y1: clamp(r.y1 / pg.height), splits: [], roles: ["description"], rows: [] }
        : { id: nextId.current++, page, x0: 0.05, x1: 0.95, y0: 0.25, y1: 0.7, splits: [], roles: ["description"], rows: [] };
      const found = r ? detectSplits(pg.items, [r.y0, r.y1]) : null;
      if (found) {
        box.splits = found.splits.map((x) => clamp(x / pg.width, box.x0 + 0.01, box.x1 - 0.01));
        box.roles = found.roles;
      }
      added.push(box);
    }
    if (added.length === 0) { setNote(t.nothingFound); return; }
    setBoxes((bs) => [...bs, ...added]);
    setSelected(added[0]!.id);
    setNote(null);
    onRead(null);
  };

  const moveStart = (b: Box, e: React.PointerEvent<HTMLElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = e.currentTarget.closest<HTMLElement>("[data-testid^=overlay]")!.getBoundingClientRect();
    moving.current = { id: b.id, px: (e.clientX - r.left) / r.width, py: (e.clientY - r.top) / r.height, box: b };
  };
  const moveBy = (e: React.PointerEvent<HTMLElement>) => {
    const m = moving.current;
    if (!m || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const r = e.currentTarget.closest<HTMLElement>("[data-testid^=overlay]")!.getBoundingClientRect();
    const b = m.box;
    const dx = clamp((e.clientX - r.left) / r.width - m.px, -b.x0, 1 - b.x1);
    const dy = clamp((e.clientY - r.top) / r.height - m.py, -b.y0, 1 - b.y1);
    patch(b.id, (x) => ({ ...x, x0: b.x0 + dx, x1: b.x1 + dx, y0: b.y0 + dy, y1: b.y1 + dy, splits: b.splits.map((sp) => sp + dx), rows: b.rows.map((r) => r + dy) }));
  };

  const patch = (id: number, f: (b: Box) => Box) => { setBoxes((bs) => bs.map((b) => (b.id === id ? f(b) : b))); onRead(null); };
  const removeBox = (id: number) => { setBoxes((bs) => bs.filter((b) => b.id !== id)); setSelected(null); setPick(null); onRead(null); };

  const addSplit = (b: Box) => {
    // Split the widest column in half.
    const edges = [b.x0, ...b.splits, b.x1];
    let at = 0;
    for (let i = 1; i < edges.length - 1; i++) if (edges[i + 1]! - edges[i]! > edges[at + 1]! - edges[at]!) at = i;
    if (edges.length === 2) at = 0;
    const mid = (edges[at]! + edges[at + 1]!) / 2;
    const splits = [...b.splits];
    splits.splice(at, 0, mid);
    const roles = [...b.roles];
    roles.splice(at + 1, 0, "other");
    patch(b.id, (x) => ({ ...x, splits, roles }));
  };
  const removeSplit = (b: Box, i: number) => { patch(b.id, (x) => ({ ...x, splits: x.splits.filter((_, k) => k !== i), roles: x.roles.filter((_, k) => k !== i + 1) })); setPick(null); };
  const moveSplit = (b: Box, i: number, v: number) => {
    const lo = (i === 0 ? b.x0 : b.splits[i - 1]!) + 0.01;
    const hi = (i === b.splits.length - 1 ? b.x1 : b.splits[i + 1]!) - 0.01;
    patch(b.id, (x) => ({ ...x, splits: x.splits.map((s, k) => (k === i ? clamp(v, lo, hi) : s)) }));
  };

  const addRow = (b: Box) => {
    const pg = pages[b.page - 1]!;
    if (b.rows.length === 0) {
      // First press: one line between every text line, which the user then trims or moves.
      const auto = autoRowLines(pg.items, b.y0 * pg.height, b.y1 * pg.height).map((v) => v / pg.height);
      patch(b.id, (x) => ({ ...x, rows: auto.length > 0 ? auto : [(x.y0 + x.y1) / 2] }));
      return;
    }
    const edges = [b.y0, ...b.rows, b.y1];
    let at = 0;
    for (let i = 0; i < edges.length - 1; i++) if (edges[i + 1]! - edges[i]! > edges[at + 1]! - edges[at]!) at = i;
    const mid = (edges[at]! + edges[at + 1]!) / 2;
    patch(b.id, (x) => ({ ...x, rows: [...x.rows, mid].sort((p, q) => p - q) }));
  };
  const removeRow = (b: Box, i: number) => { patch(b.id, (x) => ({ ...x, rows: x.rows.filter((_, k) => k !== i) })); setPick(null); };
  const moveRow = (b: Box, i: number, v: number) => {
    const lo = (i === 0 ? b.y0 : b.rows[i - 1]!) + 0.003;
    const hi = (i === b.rows.length - 1 ? b.y1 : b.rows[i + 1]!) - 0.003;
    patch(b.id, (x) => ({ ...x, rows: x.rows.map((r, k) => (k === i ? clamp(v, lo, hi) : r)) }));
  };

  const inside = (b: Box) => {
    const pg = pages[b.page - 1]!;
    const x0 = b.x0 * pg.width, x1 = b.x1 * pg.width, y0 = b.y0 * pg.height, y1 = b.y1 * pg.height;
    return { x0, x1, y0, y1, items: pg.items.filter((it) => { const cx = it.x + it.width / 2, cy = it.y - it.size * 0.3; return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1; }) };
  };

  // Re-reads the page text: refits the table area, then the column lines and their headings.
  const autoFit = (b: Box) => {
    const pg = pages[b.page - 1]!;
    const area = pg.items.length ? suggestTable(pg.items) : null;
    const found = area ? detectSplits(pg.items, [area.y0, area.y1]) : null;
    if (!area) { setNote(t.detectFailed); return; }
    setNote(found ? null : t.detectFailed);
    patch(b.id, (x) => {
      const nx0 = clamp(area.x0 / pg.width), nx1 = clamp(area.x1 / pg.width), ny0 = clamp(area.y0 / pg.height), ny1 = clamp(area.y1 / pg.height);
      return { ...x, x0: nx0, x1: nx1, y0: ny0, y1: ny1, rows: [], ...(found ? { splits: found.splits.map((v) => clamp(v / pg.width, nx0 + 0.01, nx1 - 0.01)), roles: found.roles } : {}) };
    });
  };

  async function ocrBox(b: Box, onStep: () => void): Promise<TextItem[]> {
    if (!engine.current) {
      setBusy(t.ocrLoading);
      engine.current = await createOcr(["eng", "ara"], () => undefined);
    }
    const r = inside(b);
    const { blob, pxPerPt } = await renderRegion(doc, b.page, { x: r.x0, y: r.y0, w: r.x1 - r.x0, h: r.y1 - r.y0 }, 220);
    const words = await engine.current.recognizeWords(blob);
    onStep();
    return wordsToItems(words, pxPerPt, { x: r.x0, y: r.y0 });
  }

  async function convert() {
    if (boxes.length === 0) { setNote(t.noTables); return; }
    const id = ++run.current;
    setError(null);
    setNote(null);
    try {
      const ordered = [...boxes].sort((a, b) => a.page - b.page || a.y0 - b.y0);
      const virtual: TextItem[][] = [];
      const columns: (Column[] | null)[] = [];
      let done = 0;
      for (const b of ordered) {
        const pg = pages[b.page - 1]!;
        const r = inside(b);
        let items = r.items;
        if (pg.items.length === 0) {
          setBusy(t.ocrReading(done + 1, ordered.length));
          items = await ocrBox(b, () => { done++; });
          if (run.current !== id) return;
        }
        const edges = [r.x0, ...b.splits.map((s) => s * pg.width), r.x1];
        virtual.push(b.rows.length > 0 ? mergeRows(items, b.rows.map((v) => v * pg.height), edges.slice(1, -1)) : items);
        const custom = b.splits.length > 0 || b.roles.some((x) => x !== "description");
        columns.push(custom ? b.roles.map((role, i) => ({ role, x0: edges[i]!, x1: edges[i + 1]! })) : null);
      }
      onRead({ pages: virtual, columns });
    } catch {
      setError(t.failed);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{t.help}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="md" onClick={addAll} disabled={busy !== null}><Icon name="crop" size={18} /> {t.addTable}</Button>
        <Button size="md" onClick={convert} disabled={busy !== null || boxes.length === 0}>
          <Icon name={busy ? "loader" : "wand"} size={18} className={busy ? "animate-spin" : undefined} /> {busy ?? t.convert}
        </Button>
      </div>
      {note && <StatusMessage tone="info">{note}</StatusMessage>}
      {error && <StatusMessage tone="error">{error}</StatusMessage>}

      <ol className="flex flex-col gap-6">
        {Array.from({ length: shown }, (_, i) => i + 1).map((p) => {
          const pageBoxes = boxes.filter((b) => b.page === p);
          const scanned = pages[p - 1]!.items.length === 0;
          return (
            <li key={p} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold">{t.page(p)}{scanned && <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">{t.scanned}</span>}</p>
              </div>
              <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-lg border border-line bg-surface-2" style={{ aspectRatio: `${pages[p - 1]!.width} / ${pages[p - 1]!.height}` }}>
                {images[p - 1] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local object URL
                  <img src={images[p - 1]} alt={t.page(p)} draggable={false} className="absolute inset-0 size-full select-none" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center"><Icon name="loader" size={22} className="animate-spin text-muted" /></span>
                )}
                <div
                  data-testid={`overlay-${p}`}
                  className="absolute inset-0 cursor-crosshair [touch-action:pan-y]"
                  onPointerDown={(e) => onDown(p, e)}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  onPointerCancel={() => { clearPending(); drawingActive.current = false; start.current = null; setDraft(null); }}
                  onContextMenu={(e) => e.preventDefault()}
                  ref={attachOverlay}
                >
                  {pageBoxes.map((b) => (
                    <div key={b.id} className="pointer-events-none absolute border-2 border-accent bg-accent/10" style={{ left: `${b.x0 * 100}%`, top: `${b.y0 * 100}%`, width: `${(b.x1 - b.x0) * 100}%`, height: `${(b.y1 - b.y0) * 100}%` }}>
                      <button
                        type="button"
                        aria-label={t.selectTable(boxes.indexOf(b) + 1)}
                        aria-pressed={b.id === selected}
                        onClick={() => { setSelected(b.id); setPick(null); }}
                        className="pointer-events-auto absolute -top-px start-0 grid size-6 place-items-center rounded-br bg-accent text-[0.75rem] font-semibold text-accent-fg"
                      >{boxes.indexOf(b) + 1}</button>
                      <div className="pointer-events-none absolute inset-x-0 bottom-full flex" style={{ height: 0 }}>
                        {b.roles.map((role, i) => {
                          const edges = [b.x0, ...b.splits, b.x1];
                          return (
                            <div key={i} className="pointer-events-auto absolute bottom-0 px-px" style={{ left: `${((edges[i]! - b.x0) / (b.x1 - b.x0)) * 100}%`, width: `${((edges[i + 1]! - edges[i]!) / (b.x1 - b.x0)) * 100}%` }}>
                              <select
                                aria-label={t.column(i + 1)}
                                value={role}
                                onFocus={() => setSelected(b.id)}
                                onChange={(e) => patch(b.id, (x) => ({ ...x, roles: x.roles.map((r, k) => (k === i ? (e.target.value as Role) : r)) }))}
                                className="block !h-6 !min-h-0 w-full min-w-0 truncate rounded-sm border border-accent bg-surface !px-0.5 !py-0 !text-[11px] font-medium leading-none text-accent-text"
                              >
                                {ROLE_ORDER.map((r) => <option key={r} value={r}>{t.roles[r]}</option>)}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                      {b.id === selected && (
                        <div
                          role="toolbar"
                          aria-label={t.selectTable(boxes.indexOf(b) + 1)}
                          className="pointer-events-auto absolute start-8 z-10 flex gap-1 rounded-lg border border-accent bg-surface p-1 shadow-md"
                          style={b.y0 > 0.09 ? { bottom: "100%", marginBottom: 30 } : { top: "100%", marginTop: 6 }}
                        >
                          {([
                            ["col-add", "columns", t.addColumn, () => addSplit(b), false],
                            ["col-del", "minus", t.removeColumn, () => setPick(pick === "col" ? null : "col"), pick === "col"],
                            ["row-add", "rows", t.addRow, () => addRow(b), false],
                            ["row-del", "minus", t.removeRow, () => setPick(pick === "row" ? null : "row"), pick === "row"],
                            ["fit", "wand", t.autoFit, () => autoFit(b), false],
                            ["del", "trash", t.removeTable, () => removeBox(b.id), false],
                          ] as const).map(([k, icon, label, fn, on]) => (
                            <button
                              key={k}
                              type="button"
                              aria-label={label}
                              title={label}
                              aria-pressed={k === "col-del" || k === "row-del" ? on : undefined}
                              disabled={(k === "fit" && pages[b.page - 1]!.items.length === 0) || (k === "col-del" && b.splits.length === 0) || (k === "row-del" && b.rows.length === 0)}
                              onClick={fn}
                              className={`grid size-9 place-items-center rounded-md hover:bg-surface-2 disabled:opacity-40 ${k === "del" ? "text-danger" : "text-accent-text"} ${on ? "bg-accent text-accent-fg hover:bg-accent" : ""}`}
                            >
                              <span className="relative"><Icon name={icon} size={18} />{k.endsWith("add") && <Icon name="plus" size={9} className="absolute -end-1 -top-1" />}{k.endsWith("del") && <Icon name="minus" size={9} className="absolute -end-1 -top-1" />}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {pick && b.id === selected && <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-accent px-2 py-0.5 text-center text-[0.7rem] text-accent-fg">{t.pickLine}</span>}
                      <div
                        role="button"
                        aria-label={t.moveTable}
                        tabIndex={0}
                        className="pointer-events-auto absolute -top-4 end-1 grid size-9 -translate-y-1/2 cursor-move place-items-center rounded-full border-2 border-accent bg-surface text-accent-text shadow-sm [touch-action:none]"
                        style={{ top: 0 }}
                        onPointerDown={(e) => moveStart(b, e)}
                        onPointerMove={moveBy}
                      >
                        <Icon name="arrow-up-down" size={16} />
                      </div>
                      {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                        <div
                          key={corner}
                          aria-hidden="true"
                          data-handle={corner}
                          className="pointer-events-auto absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center [touch-action:none]"
                          style={{ left: corner.includes("w") ? 0 : "100%", top: corner.includes("n") ? 0 : "100%", cursor: corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize" }}
                          onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); }}
                          onPointerMove={(e) => resize(b, corner, e)}
                        >
                          <span className="size-3.5 rounded-full border-2 border-accent bg-surface shadow-sm" />
                        </div>
                      ))}
                      {b.splits.map((s, k) => (
                        <div
                          key={k}
                          role="slider"
                          aria-label={t.moveLine(k + 1)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(s * 100)}
                          tabIndex={0}
                          className="pointer-events-auto absolute inset-y-0 -ms-2 w-4 cursor-col-resize [touch-action:none]"
                          style={{ left: `${((s - b.x0) / (b.x1 - b.x0)) * 100}%` }}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            if (pick === "col" && b.id === selected) { removeSplit(b, k); return; }
                            setSelected(b.id);
                            e.currentTarget.setPointerCapture(e.pointerId);
                          }}
                          onPointerMove={(e) => {
                            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                            const r = e.currentTarget.closest<HTMLElement>("[data-testid^=overlay]")!.getBoundingClientRect();
                            moveSplit(b, k, (e.clientX - r.left) / r.width);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowLeft") moveSplit(b, k, s - 0.005);
                            if (e.key === "ArrowRight") moveSplit(b, k, s + 0.005);
                          }}
                        >
                          <span className={`absolute inset-y-0 start-1/2 w-0.5 -translate-x-1/2 ${pick === "col" && b.id === selected ? "bg-danger" : "bg-accent"}`} />
                        </div>
                      ))}
                      {b.rows.map((v, k) => (
                        <div
                          key={`r${k}`}
                          role="slider"
                          aria-label={t.moveRow(k + 1)}
                          aria-orientation="vertical"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(v * 100)}
                          tabIndex={0}
                          className="pointer-events-auto absolute inset-x-0 -mt-2 h-4 cursor-row-resize [touch-action:none]"
                          style={{ top: `${((v - b.y0) / (b.y1 - b.y0)) * 100}%` }}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            if (pick === "row" && b.id === selected) { removeRow(b, k); return; }
                            setSelected(b.id);
                            e.currentTarget.setPointerCapture(e.pointerId);
                          }}
                          onPointerMove={(e) => {
                            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                            const r = e.currentTarget.closest<HTMLElement>("[data-testid^=overlay]")!.getBoundingClientRect();
                            moveRow(b, k, (e.clientY - r.top) / r.height);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowUp") moveRow(b, k, v - 0.003);
                            if (e.key === "ArrowDown") moveRow(b, k, v + 0.003);
                          }}
                        >
                          <span className={`absolute inset-x-0 top-1/2 h-px -translate-y-1/2 border-t border-dashed ${pick === "row" && b.id === selected ? "border-danger" : "border-accent"}`} />
                        </div>
                      ))}
                    </div>
                  ))}
                  {draft && draft.page === p && draft.x1 - draft.x0 < MIN_SIZE && draft.y1 - draft.y0 < MIN_SIZE && (
                    <span className="pointer-events-none absolute size-7 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-2 border-accent bg-accent/20" style={{ left: `${draft.x0 * 100}%`, top: `${draft.y0 * 100}%` }} />
                  )}
                  {draft && draft.page === p && (
                    <div className="pointer-events-none absolute border-2 border-dashed border-accent bg-accent/10" style={{ left: `${draft.x0 * 100}%`, top: `${draft.y0 * 100}%`, width: `${(draft.x1 - draft.x0) * 100}%`, height: `${(draft.y1 - draft.y0) * 100}%` }} />
                  )}
                </div>
              </div>

            </li>
          );
        })}
      </ol>
      {pages.length > shown && <StatusMessage tone="info">{t.page(shown)} / {pages.length}</StatusMessage>}
    </div>
  );
}
