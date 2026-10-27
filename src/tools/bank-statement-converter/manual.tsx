"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { createOcr, type OcrEngine } from "@/lib/ocr/ocr";
import { renderPage, renderRegion, type RenderedDoc } from "@/lib/pdf/render";
import type { TextItem } from "@/lib/pdf/text-layout";
import { wordsToItems } from "@/lib/statement/ocr-items";
import { detectColumns, type Column, type Role } from "@/lib/statement/parse";

export interface PageData {
  width: number;
  height: number;
  items: TextItem[];
}

export interface ManualStrings {
  help: string; table: (n: number, page: number) => string; detect: string; addColumn: string; removeTable: string;
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
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const urls = useRef<string[]>([]);
  const nextId = useRef(1);
  const start = useRef<{ x: number; y: number } | null>(null);
  const pending = useRef<{ cx: number; cy: number; timer: number } | null>(null);
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
    const d = draft;
    start.current = null;
    setDraft(null);
    if (!d || d.x1 - d.x0 < MIN_SIZE || d.y1 - d.y0 < MIN_SIZE) return;
    setBoxes((bs) => [...bs, { id: nextId.current++, page: d.page, x0: d.x0, y0: d.y0, x1: d.x1, y1: d.y1, splits: [], roles: ["description"] }]);
    onRead(null);
  };

  // While a table is being drawn, the finger draws instead of scrolling the screen.
  useEffect(() => {
    if (!draft) return;
    const block = (e: TouchEvent) => { if (e.cancelable) e.preventDefault(); };
    window.addEventListener("touchmove", block, { passive: false });
    return () => window.removeEventListener("touchmove", block);
  }, [draft]);
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
      return { ...x, x0, y0, x1, y1, splits: x.splits.map((sp) => clamp(sp, x0 + 0.01, x1 - 0.01)) };
    });
  };

  const patch = (id: number, f: (b: Box) => Box) => { setBoxes((bs) => bs.map((b) => (b.id === id ? f(b) : b))); onRead(null); };
  const removeBox = (id: number) => { setBoxes((bs) => bs.filter((b) => b.id !== id)); onRead(null); };

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
  const removeSplit = (b: Box, i: number) => patch(b.id, (x) => ({ ...x, splits: x.splits.filter((_, k) => k !== i), roles: x.roles.filter((_, k) => k !== i + 1) }));
  const moveSplit = (b: Box, i: number, v: number) => {
    const lo = (i === 0 ? b.x0 : b.splits[i - 1]!) + 0.01;
    const hi = (i === b.splits.length - 1 ? b.x1 : b.splits[i + 1]!) - 0.01;
    patch(b.id, (x) => ({ ...x, splits: x.splits.map((s, k) => (k === i ? clamp(v, lo, hi) : s)) }));
  };

  const inside = (b: Box) => {
    const pg = pages[b.page - 1]!;
    const x0 = b.x0 * pg.width, x1 = b.x1 * pg.width, y0 = b.y0 * pg.height, y1 = b.y1 * pg.height;
    return { x0, x1, y0, y1, items: pg.items.filter((it) => { const cx = it.x + it.width / 2, cy = it.y - it.size * 0.3; return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1; }) };
  };

  const detect = (b: Box) => {
    const { items } = inside(b);
    // The headings may sit above the box (when only the rows were marked), so fall back to the whole page.
    const cols = detectColumns(items) ?? detectColumns(pages[b.page - 1]!.items);
    if (!cols || cols.length < 2) { setNote(t.detectFailed); return; }
    setNote(null);
    const pg = pages[b.page - 1]!;
    const sorted = [...cols].sort((a, c) => a.x0 - c.x0);
    const splits = sorted.slice(0, -1).map((c, i) => clamp((c.x1 + sorted[i + 1]!.x0) / 2 / pg.width, b.x0 + 0.01, b.x1 - 0.01));
    patch(b.id, (x) => ({ ...x, splits, roles: sorted.map((c) => c.role) }));
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
        virtual.push(items);
        const edges = [r.x0, ...b.splits.map((s) => s * pg.width), r.x1];
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
              <p className="flex items-center gap-2 text-sm font-semibold">{t.page(p)}{scanned && <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">{t.scanned}</span>}</p>
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
                  onPointerCancel={() => { clearPending(); start.current = null; setDraft(null); }}
                >
                  {pageBoxes.map((b) => (
                    <div key={b.id} className="pointer-events-none absolute border-2 border-accent bg-accent/10" style={{ left: `${b.x0 * 100}%`, top: `${b.y0 * 100}%`, width: `${(b.x1 - b.x0) * 100}%`, height: `${(b.y1 - b.y0) * 100}%` }}>
                      <span className="absolute -top-px start-0 rounded-br bg-accent px-1.5 text-[0.7rem] font-semibold text-accent-fg">{boxes.indexOf(b) + 1}</span>
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
                          <span className="absolute inset-y-0 start-1/2 w-0.5 -translate-x-1/2 bg-accent" />
                        </div>
                      ))}
                    </div>
                  ))}
                  {draft && draft.page === p && (
                    <div className="pointer-events-none absolute border-2 border-dashed border-accent bg-accent/10" style={{ left: `${draft.x0 * 100}%`, top: `${draft.y0 * 100}%`, width: `${(draft.x1 - draft.x0) * 100}%`, height: `${(draft.y1 - draft.y0) * 100}%` }} />
                  )}
                </div>
              </div>

              {pageBoxes.map((b) => (
                <div key={b.id} className="flex flex-col gap-2 rounded-lg border border-line p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{t.table(boxes.indexOf(b) + 1, p)}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Button variant="secondary" size="sm" onClick={() => detect(b)} disabled={scanned}>{t.detect}</Button>
                      <Button variant="secondary" size="sm" onClick={() => addSplit(b)}>{t.addColumn}</Button>
                      <Button variant="ghost" size="sm" className="text-danger" onClick={() => removeBox(b.id)}><Icon name="trash" size={15} /> {t.removeTable}</Button>
                    </div>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {b.roles.map((role, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <label className="sr-only" htmlFor={`role-${b.id}-${i}`}>{t.column(i + 1)}</label>
                        <select
                          id={`role-${b.id}-${i}`}
                          aria-label={t.column(i + 1)}
                          value={role}
                          onChange={(e) => patch(b.id, (x) => ({ ...x, roles: x.roles.map((r, k) => (k === i ? (e.target.value as Role) : r)) }))}
                          className="field-control !min-h-9 !w-auto !py-1 text-sm"
                        >
                          {ROLE_ORDER.map((r) => <option key={r} value={r}>{t.roles[r]}</option>)}
                        </select>
                        {i < b.splits.length && (
                          <button type="button" aria-label={t.removeLine(i + 1)} onClick={() => removeSplit(b, i)} className="grid size-7 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-danger"><Icon name="x" size={14} /></button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </li>
          );
        })}
      </ol>
      {pages.length > shown && <StatusMessage tone="info">{t.page(shown)} / {pages.length}</StatusMessage>}
    </div>
  );
}
