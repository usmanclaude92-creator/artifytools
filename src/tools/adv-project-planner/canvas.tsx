"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { BOX, edgePath, layout, type LayoutKind } from "@/lib/planner/layout";
import { childrenOf, depths, nodeById, subtreeIds, type PlannerData, type Status } from "@/lib/planner/model";
import type { PlannerStrings } from "./strings";

const STATUS_DOT: Record<Status, string> = { none: "transparent", todo: "#64748b", doing: "#2563eb", done: "#0f9d6b", blocked: "#dc2626" };
const MIN_K = 0.15;
const MAX_K = 2.5;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface View { x: number; y: number; k: number }

/** The plan drawn on a canvas you can drag and zoom. Boxes are real buttons, so the keyboard and screen readers work. */
export function MapCanvas({ data, kind, selected, onSelect, onToggle, t, fitKey }: {
  data: PlannerData;
  kind: LayoutKind;
  selected: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  t: PlannerStrings;
  /** Changes when the view should be fitted again (new plan, new layout). */
  fitKey: string;
}) {
  const lay = useMemo(() => layout(data, kind), [data, kind]);
  const dep = useMemo(() => depths(data), [data]);
  const pos = useMemo(() => new Map(lay.placed.map((p) => [p.id, p])), [lay]);
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const [width, setWidth] = useState(0);
  const [maxH, setMaxH] = useState(640);
  const viewRef = useRef(view);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; k: number } | null>(null);
  const moved = useRef(false);
  const layRef = useRef(lay);
  // Kept in step after each render, before the fit below runs.
  useLayoutEffect(() => { layRef.current = lay; viewRef.current = view; });

  const fit = useCallback(() => {
    const el = box.current;
    const l = layRef.current;
    if (!el || !l.width) return;
    const cw = el.clientWidth, ch = el.clientHeight;
    const k = clamp(Math.min(cw / l.width, ch / l.height) * 0.97, 0.3, 1.15);
    setView({ k, x: Math.max(8, (cw - l.width * k) / 2), y: Math.max(8, (ch - l.height * k) / 2) });
  }, []);
  // The canvas is as tall as the plan needs at this width (so a short plan does not float in empty space), up to most of the screen.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => { setWidth(el.clientWidth); setMaxH(Math.round(window.innerHeight * 0.7)); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const height = width ? Math.round(Math.min(maxH, Math.max(340, (width * lay.height) / Math.max(lay.width, 1) + 64))) : 480;

  const measured = width > 0;
  // Refit only when the plan or layout is replaced, not on every edit.
  useLayoutEffect(() => { fit(); }, [fitKey, kind, fit, measured]);

  const zoomAt = useCallback((factor: number, cx?: number, cy?: number) => {
    const el = box.current;
    if (!el) return;
    const px = cx ?? el.clientWidth / 2, py = cy ?? el.clientHeight / 2;
    setView((v) => {
      const k = clamp(v.k * factor, MIN_K, MAX_K);
      const f = k / v.k;
      return { k, x: px - (px - v.x) * f, y: py - (py - v.y) * f };
    });
  }, []);

  // Wheel zoom needs a non-passive listener so the page does not scroll at the same time.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0025), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { dist: Math.hypot(a!.x - b!.x, a!.y - b!.y), k: viewRef.current.k };
    }
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pointers.current.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      const r = e.currentTarget.getBoundingClientRect();
      const mx = (a!.x + b!.x) / 2 - r.left, my = (a!.y + b!.y) / 2 - r.top;
      const target = clamp(gesture.current.k * (d / gesture.current.dist), MIN_K, MAX_K);
      zoomAt(target / viewRef.current.k, mx, my);
    } else if (pointers.current.size === 1) {
      moved.current = true;
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
    }
  };
  const up = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current = null;
  };

  const kidsCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of data.nodes) if (n.parent) m.set(n.parent, (m.get(n.parent) ?? 0) + 1);
    return m;
  }, [data]);

  const tagColor = useMemo(() => new Map(data.tags.map((x) => [x.id, x.color])), [data.tags]);

  return (
    <div className="relative">
      <div
        ref={box}
        role="region"
        aria-label={t.mapLabel}
        data-testid="planner-canvas"
        className="relative cursor-grab touch-none select-none overflow-hidden rounded-xl border border-line bg-surface-2 active:cursor-grabbing"
        style={{ height }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <div className="absolute start-0 top-0 origin-top-left" style={{ width: lay.width, height: lay.height, transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`, direction: "ltr" }}>
          <svg width={lay.width} height={lay.height} className="absolute inset-0" aria-hidden="true">
            {lay.bands.map((b) => {
              const lv = data.levels[b.depth];
              if (!lv) return null;
              return (
                <g key={b.depth} data-level-band={b.depth}>
                  <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={lv.color} fillOpacity={0.07} />
                  {kind === "down" ? (
                    <>
                      <line x1={0} y1={b.y + b.h} x2={b.w} y2={b.y + b.h} stroke={lv.color} strokeOpacity={0.45} />
                      <text x={12} y={b.y + b.h / 2 + 6} fill={lv.color} fontSize={18} fontWeight={700}>{lv.name}</text>
                    </>
                  ) : (
                    <>
                      <line x1={b.x + b.w} y1={0} x2={b.x + b.w} y2={b.h} stroke={lv.color} strokeOpacity={0.45} />
                      <text x={b.x + 12} y={22} fill={lv.color} fontSize={18} fontWeight={700}>{lv.name}</text>
                    </>
                  )}
                </g>
              );
            })}
            {lay.rings.filter((r) => r.r > 0).map((r) => {
              const lv = data.levels[r.depth];
              if (!lv) return null;
              return (
                <g key={r.depth} data-level-band={r.depth}>
                  <circle cx={lay.cx} cy={lay.cy} r={r.r} fill="none" stroke={lv.color} strokeOpacity={0.4} strokeDasharray="6 6" />
                  <text x={lay.cx} y={lay.cy - r.r - BOX.h / 2 - 6} fill={lv.color} fontSize={16} fontWeight={700} textAnchor="middle">{lv.name}</text>
                </g>
              );
            })}
            {lay.edges.map((e) => {
              const a = pos.get(e.from), b = pos.get(e.to);
              return a && b ? <path key={e.to} d={edgePath(kind, a, b)} fill="none" stroke="var(--line-strong)" strokeWidth={1.6} /> : null;
            })}
          </svg>
          {lay.placed.map((p) => {
            const n = nodeById(data, p.id)!;
            const lv = data.levels[dep.get(p.id) ?? 0];
            const color = lv?.color ?? "#7c3aed";
            const count = kidsCount.get(p.id) ?? 0;
            const total = n.collapsed ? subtreeIds(data, p.id).size - 1 : count;
            return (
              <div key={p.id} className="absolute" style={{ left: p.x, top: p.y, width: BOX.w, height: BOX.h }}>
                <button
                  type="button"
                  data-node={p.id}
                  aria-pressed={selected === p.id}
                  aria-label={`${n.title || t.untitled}, ${lv?.name ?? ""}`}
                  onClick={() => { if (!moved.current) onSelect(p.id); }}
                  className={`flex size-full cursor-pointer flex-col overflow-hidden rounded-[10px] border-[1.5px] bg-surface text-start shadow-sm transition-shadow hover:shadow-md ${selected === p.id ? "ring-2 ring-accent ring-offset-2 ring-offset-surface-2" : ""}`}
                  style={{ borderColor: color }}
                >
                  <span className="h-1.5 w-full shrink-0" style={{ background: color }} />
                  <span dir="auto" className="line-clamp-2 px-3 pt-1.5 text-[13px] font-semibold leading-tight text-fg">{n.title || t.untitled}</span>
                  <span className="mt-auto flex items-center gap-1.5 px-3 pb-1.5 text-[11px] text-muted">
                    {n.status !== "none" && <span className="size-2.5 shrink-0 rounded-full" style={{ background: STATUS_DOT[n.status] }} title={t.statuses[n.status]} />}
                    {n.due && <span dir="ltr" className="tabular-nums">{n.due}</span>}
                    <span className="ms-auto flex gap-1">{n.tags.slice(0, 4).map((id) => <span key={id} className="size-2 rounded-full" style={{ background: tagColor.get(id) ?? "#64748b" }} />)}</span>
                  </span>
                </button>
                {count > 0 && (
                  <button
                    type="button"
                    aria-label={`${n.collapsed ? t.expand : t.collapse}: ${n.title || t.untitled}`}
                    aria-expanded={!n.collapsed}
                    onClick={() => onToggle(p.id)}
                    className="absolute -bottom-3 start-1/2 z-10 grid h-6 min-w-6 -translate-x-1/2 place-items-center rounded-full border border-line-strong bg-surface px-1.5 text-[11px] font-semibold text-muted shadow-sm hover:text-fg"
                  >
                    {n.collapsed ? `+${total}` : <Icon name="minus" size={12} />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="absolute end-3 top-3 flex flex-col gap-1.5">
        <CanvasButton label={t.zoomIn} onClick={() => zoomAt(1.25)}><Icon name="plus" size={16} /></CanvasButton>
        <CanvasButton label={t.zoomOut} onClick={() => zoomAt(0.8)}><Icon name="minus" size={16} /></CanvasButton>
        <CanvasButton label={t.fit} onClick={fit}><Icon name="rows" size={16} /></CanvasButton>
      </div>
    </div>
  );
}

function CanvasButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="grid size-9 place-items-center rounded-lg border border-line-strong bg-surface text-fg shadow-sm hover:bg-surface-2">
      {children}
    </button>
  );
}

/** Children of a node in order (used by the outline too). */
export { childrenOf };
