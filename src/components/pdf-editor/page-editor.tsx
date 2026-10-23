"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/components/ui/cx";
import { clampBox } from "@/lib/pdf/annotate";

/** Something placed on a page, in fractions of the page as displayed (origin top-left). */
export type EditorItem = {
  id: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
} & (
  | { kind: "image"; url: string; png: Uint8Array; /** keep proportions when resizing */ lock: true }
  | { kind: "text"; url: string; png: Uint8Array; lock: true; text: string; pt: number; color: string; bold: boolean }
  | { kind: "rect"; color: string; lock: false }
);

export interface EditorLabels {
  page: (n: number, total: number) => string;
  prev: string;
  next: string;
  remove: string;
  itemHint: string;
  loading: string;
  clickToPlace: string;
}

type Drag = { id: string; mode: "move" | "resize"; startX: number; startY: number; box: { x: number; y: number; w: number; h: number }; rect: DOMRect };

/**
 * One page at a time, with the items placed on it: drag to move, drag the corner to resize,
 * arrow keys nudge, Delete removes. The page image comes from pdf.js; items are HTML on top.
 */
export function PageEditor({
  doc,
  page,
  onPage,
  sizes,
  items,
  onItems,
  selected,
  onSelect,
  placing,
  onPlace,
  labels,
}: {
  doc: PDFDocumentProxy;
  page: number;
  onPage: (p: number) => void;
  /** Displayed size of each page in points. */
  sizes: { w: number; h: number }[];
  items: EditorItem[];
  onItems: (items: EditorItem[]) => void;
  selected: string | null;
  onSelect: (id: string | null) => void;
  /** When set, a click on the page calls onPlace with the clicked point. */
  placing: boolean;
  onPlace: (page: number, fx: number, fy: number) => void;
  labels: EditorLabels;
}) {
  const [urls, setUrls] = useState<Record<number, string>>({});
  const surface = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const latest = useRef(items);
  useLayoutEffect(() => {
    latest.current = items;
  }, [items]);

  useEffect(() => {
    if (urls[page]) return;
    let cancelled = false;
    (async () => {
      const { renderPage } = await import("@/lib/pdf/render");
      const r = await renderPage(doc, page + 1, { dpi: 110, format: "jpg", quality: 0.88 });
      if (!cancelled) setUrls((u) => ({ ...u, [page]: URL.createObjectURL(r.blob) }));
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [doc, page, urls]);

  useEffect(() => () => Object.values(urls).forEach((u) => URL.revokeObjectURL(u)), [urls]);

  const size = sizes[page] ?? { w: 595, h: 842 };
  const update = (id: string, patch: Partial<{ x: number; y: number; w: number; h: number }>) =>
    onItems(latest.current.map((it) => (it.id === id ? (clampBox({ ...it, ...patch }) as EditorItem) : it)));

  function start(e: PointerEvent, it: EditorItem, mode: Drag["mode"]) {
    e.stopPropagation();
    e.preventDefault();
    onSelect(it.id);
    const rect = surface.current!.getBoundingClientRect();
    drag.current = { id: it.id, mode, startX: e.clientX, startY: e.clientY, box: { x: it.x, y: it.y, w: it.w, h: it.h }, rect };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function move(e: PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / d.rect.width;
    const dy = (e.clientY - d.startY) / d.rect.height;
    const it = latest.current.find((i) => i.id === d.id);
    if (!it) return;
    if (d.mode === "move") update(d.id, { x: d.box.x + dx, y: d.box.y + dy });
    else {
      const w = Math.max(0.02, d.box.w + dx);
      // Images and text keep their proportions; white-out boxes stretch freely.
      const h = it.lock ? (w * d.box.h) / d.box.w : Math.max(0.01, d.box.h + dy);
      update(d.id, { w, h });
    }
  }

  function end() {
    drag.current = null;
  }

  function key(e: KeyboardEvent, it: EditorItem) {
    const step = e.shiftKey ? 0.02 : 0.004;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      update(it.id, { x: it.x + moves[e.key]![0], y: it.y + moves[e.key]![1] });
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onItems(latest.current.filter((i) => i.id !== it.id));
      onSelect(null);
    } else if (e.key === "Escape") onSelect(null);
  }

  const onPageItems = items.filter((i) => i.page === page);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label={labels.prev}>
          <Icon name="chevron-right" size={16} className="rotate-180 rtl:rotate-0" /> <span className="hidden sm:inline">{labels.prev}</span>
        </Button>
        <span className="text-sm font-medium tabular-nums" aria-live="polite">{labels.page(page + 1, sizes.length)}</span>
        <Button variant="secondary" size="sm" disabled={page >= sizes.length - 1} onClick={() => onPage(page + 1)} aria-label={labels.next}>
          <span className="hidden sm:inline">{labels.next}</span> <Icon name="chevron-right" size={16} className="rtl:rotate-180" />
        </Button>
      </div>
      {placing && <p className="text-center text-sm font-medium text-accent-text">{labels.clickToPlace}</p>}
      <div className="grid place-items-center rounded-lg bg-surface-2 p-2 sm:p-4">
        <div
          ref={surface}
          dir="ltr"
          className={cx("relative w-full max-w-[720px] touch-none select-none bg-white shadow-md", placing && "cursor-crosshair")}
          style={{ aspectRatio: `${size.w} / ${size.h}` }}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerDown={(e) => {
            if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset.page) return;
            const r = surface.current!.getBoundingClientRect();
            if (placing) onPlace(page, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
            else onSelect(null);
          }}
        >
          {urls[page] ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL of the rendered page
            <img data-page="1" src={urls[page]} alt={labels.page(page + 1, sizes.length)} className="pointer-events-auto absolute inset-0 size-full" draggable={false} />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-sm text-muted"><Icon name="loader" size={22} className="animate-spin" /><span className="sr-only">{labels.loading}</span></span>
          )}
          {onPageItems.map((it) => {
            const isSel = selected === it.id;
            return (
              <div
                key={it.id}
                role="button"
                tabIndex={0}
                aria-label={`${it.label}. ${labels.itemHint}`}
                aria-pressed={isSel}
                onPointerDown={(e) => start(e, it, "move")}
                onKeyDown={(e) => key(e, it)}
                onFocus={() => onSelect(it.id)}
                className={cx("absolute cursor-move outline-none", isSel ? "ring-2 ring-[var(--accent)]" : "hover:ring-1 hover:ring-[var(--accent)]/60")}
                style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%`, width: `${it.w * 100}%`, height: `${it.h * 100}%`, backgroundColor: it.kind === "rect" ? it.color : undefined, boxShadow: it.kind === "rect" && !isSel ? "inset 0 0 0 1px rgba(0,0,0,0.12)" : undefined }}
              >
                {it.kind !== "rect" && (
                  // eslint-disable-next-line @next/next/no-img-element -- local object URL
                  <img src={it.url} alt="" className="pointer-events-none size-full" draggable={false} />
                )}
                {isSel && (
                  <>
                    <button
                      type="button"
                      aria-label={labels.remove}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); onItems(latest.current.filter((i) => i.id !== it.id)); onSelect(null); }}
                      className="absolute -right-3 -top-3 grid size-7 place-items-center rounded-full bg-danger text-white shadow"
                    >
                      <Icon name="x" size={14} />
                    </button>
                    <span
                      aria-hidden="true"
                      onPointerDown={(e) => start(e, it, "resize")}
                      className="absolute -bottom-2.5 -right-2.5 size-5 cursor-nwse-resize rounded-full border-2 border-white bg-[var(--accent)] shadow"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
