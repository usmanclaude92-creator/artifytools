"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Field, Segmented, Select, TextArea, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { safeFileName } from "@/lib/files/names";
import { toSvg } from "@/lib/planner/export";
import { layout, type LayoutKind } from "@/lib/planner/layout";
import { nodeById, parseOutline, sanitize, setCollapsedAll, TEMPLATE_IDS, template, updateNode, type PlannerData, type TemplateId } from "@/lib/planner/model";
import { decodeShare, shareLink, tokenFromHash } from "@/lib/planner/share";
import { loadStored, newMapId, saveStored, type StoredMap } from "@/lib/planner/store";
import { finish, lib } from "@/lib/pdf/pdf";
import { MapCanvas } from "./canvas";
import { OutlineView } from "./outline";
import { Inspector, StructurePanel } from "./panels";
import { strings } from "./strings";

type ViewKind = LayoutKind | "outline";
const HISTORY = 100;

async function svgToPng(svg: string, width: number, height: number): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("render")); img.src = url; });
    // Keep the picture within what a browser canvas can hold.
    const scale = Math.min(2, 8000 / Math.max(width, height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(width * scale));
    c.height = Math.max(1, Math.round(height * scale));
    const g = c.getContext("2d")!;
    g.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function AdvProjectPlanner() {
  const locale = useLocale();
  const t = strings[locale];
  const [data, setData] = useState<PlannerData>(() => template("blank", t.names));
  const [mapId, setMapId] = useState(() => newMapId());
  const [maps, setMaps] = useState<StoredMap[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<ViewKind>("down");
  const [readOnly, setReadOnly] = useState(false);
  const [fitKey, setFitKey] = useState("start");
  const [notice, setNotice] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [newKind, setNewKind] = useState<TemplateId>("project");
  const [outline, setOutline] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [counts, setCounts] = useState({ undo: 0, redo: 0 });
  const hist = useRef<{ past: PlannerData[]; future: PlannerData[]; at: number }>({ past: [], future: [], at: 0 });
  const loaded = useRef(false);

  const sync = () => setCounts({ undo: hist.current.past.length, redo: hist.current.future.length });

  const open = useCallback((id: string, d: PlannerData) => {
    hist.current = { past: [], future: [], at: 0 };
    setCounts({ undo: 0, redo: 0 });
    setMapId(id);
    setData(d);
    setSelected(d.nodes[0]?.id ?? null);
    setFitKey(`${id}:${Date.now()}`);
    setLink(null);
    setConfirmDelete(false);
  }, []);

  // Client-only start-up: a shared link wins, otherwise the plans saved in this browser.
  useEffect(() => {
    void (async () => {
      const token = tokenFromHash(window.location.hash);
      const shared = token ? await decodeShare(token) : null;
      const stored = loadStored();
      if (window.matchMedia("(max-width: 767px)").matches) setView("outline");
      if (shared) {
        setReadOnly(true);
        open("shared", shared);
      } else if (stored) {
        setMaps(stored.maps);
        const cur = stored.maps.find((m) => m.id === stored.current)!;
        open(cur.id, cur.data);
      } else {
        const first = template("blank", t.names);
        const id = newMapId();
        setMaps([{ id, updated: Date.now(), data: first }]);
        open(id, first);
      }
      loaded.current = true;
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, after the page loads in the browser
  }, []);

  // Autosave in this browser (never for a shared, read-only plan). A change is also saved at once when the page is left.
  const latest = useRef({ data, mapId, maps, readOnly });
  useEffect(() => { latest.current = { data, mapId, maps, readOnly }; });
  useEffect(() => {
    if (!loaded.current || readOnly) return;
    const timer = window.setTimeout(() => {
      setMaps((list) => {
        const next = list.some((m) => m.id === mapId) ? list.map((m) => (m.id === mapId ? { ...m, data, updated: Date.now() } : m)) : [...list, { id: mapId, updated: Date.now(), data }];
        saveStored({ current: mapId, maps: next });
        return next;
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [data, mapId, readOnly]);
  useEffect(() => {
    const flush = () => {
      const { data: d, mapId: id, maps: list, readOnly: ro } = latest.current;
      if (!loaded.current || ro) return;
      saveStored({ current: id, maps: list.some((m) => m.id === id) ? list.map((m) => (m.id === id ? { ...m, data: d, updated: Date.now() } : m)) : [...list, { id, updated: Date.now(), data: d }] });
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  const commit = useCallback((next: PlannerData) => {
    const h = hist.current;
    const now = Date.now();
    // Typing in one field counts as a single step.
    if (now - h.at > 700) { h.past = [...h.past.slice(-(HISTORY - 1)), data]; }
    h.at = now;
    h.future = [];
    setData(next);
    sync();
  }, [data]);

  const undo = () => {
    const h = hist.current;
    const prev = h.past[h.past.length - 1];
    if (!prev) return;
    h.past = h.past.slice(0, -1);
    h.future = [data, ...h.future];
    h.at = 0;
    setData(prev);
    if (selected && !nodeById(prev, selected)) setSelected(prev.nodes[0]?.id ?? null);
    sync();
  };
  const redo = () => {
    const h = hist.current;
    const nxt = h.future[0];
    if (!nxt) return;
    h.future = h.future.slice(1);
    h.past = [...h.past, data];
    h.at = 0;
    setData(nxt);
    sync();
  };

  const toggle = (id: string) => {
    const n = nodeById(data, id);
    if (!n) return;
    const next = updateNode(data, id, { collapsed: !n.collapsed });
    if (readOnly) setData(next); else commit(next);
  };

  const kind: LayoutKind = view === "outline" ? "down" : view;
  const file = safeFileName(data.name, "plan");

  async function exportAs(what: "png" | "svg" | "pdf" | "json") {
    setNotice(null);
    setBusy(t.exporting);
    try {
      if (what === "json") { downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `${file}.json`); return; }
      const svg = toSvg(data, kind, locale === "ar");
      const l = layout(data, kind);
      if (what === "svg") { downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${file}.svg`); return; }
      const png = await svgToPng(svg, l.width, l.height);
      if (what === "png") { downloadBlob(png, `${file}.png`); return; }
      const { PDFDocument } = await lib();
      const doc = await PDFDocument.create();
      const img = await doc.embedPng(new Uint8Array(await png.arrayBuffer()));
      const w = Math.max(200, l.width * 0.75), h = Math.max(200, l.height * 0.75);
      doc.addPage([w, h]).drawImage(img, { x: 0, y: 0, width: w, height: h });
      downloadBlob(new Blob([(await finish(doc)).buffer as ArrayBuffer], { type: "application/pdf" }), `${file}.pdf`);
    } catch {
      setNotice({ tone: "error", text: t.exportFailed });
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    setNotice(null);
    const { url, long } = await shareLink(data, `${window.location.origin}${window.location.pathname}`);
    setLink(url);
    let copied = true;
    try { await navigator.clipboard.writeText(url); } catch { copied = false; }
    setNotice({ tone: long ? "info" : "success", text: `${copied ? t.shareDone : t.shareCopyFailed}${long ? ` ${t.shareLong}` : ""}` });
  }

  const addMap = (d: PlannerData) => {
    const id = newMapId();
    setMaps((list) => [...list, { id, updated: Date.now(), data: d }]);
    open(id, d);
    setView((v) => v);
  };
  const makeCopy = () => {
    window.history.replaceState(null, "", window.location.pathname);
    setReadOnly(false);
    addMap({ ...data, name: data.name });
  };
  const removeMap = () => {
    const rest = maps.filter((m) => m.id !== mapId);
    if (rest.length === 0) { const d = template("blank", t.names); const id = newMapId(); setMaps([{ id, updated: Date.now(), data: d }]); open(id, d); return; }
    setMaps(rest);
    saveStored({ current: rest[0]!.id, maps: rest });
    open(rest[0]!.id, rest[0]!.data);
  };
  async function importFile(f: File | undefined) {
    if (!f) return;
    try {
      const d = sanitize(JSON.parse(await f.text()));
      if (!d) throw new Error("invalid");
      addMap(d);
      setNotice({ tone: "success", text: t.savedOk });
    } catch {
      setNotice({ tone: "error", text: t.importError });
    }
  }

  const hasKids = useMemo(() => data.nodes.some((n) => n.parent), [data]);

  return (
    <div className="flex flex-col gap-5">
      {readOnly && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-accent bg-accent-soft p-4">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t.readOnlyTitle}: {data.name}</p>
            <p className="text-sm text-muted">{t.readOnlyText}</p>
          </div>
          <Button onClick={makeCopy}>{t.makeCopy}</Button>
        </div>
      )}

      <Panel title={data.name}>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented legend={t.viewLabel} value={view} onChange={setView} options={(["down", "right", "radial", "outline"] as ViewKind[]).map((v) => ({ value: v, label: t.views[v] }))} />
          <div className="flex flex-wrap items-center gap-1.5">
            {!readOnly && (
              <>
                <Button size="sm" variant="secondary" aria-label={t.undo} title={t.undo} disabled={counts.undo === 0} onClick={undo}><Icon name="rotate-ccw" size={16} /></Button>
                <Button size="sm" variant="secondary" aria-label={t.redo} title={t.redo} disabled={counts.redo === 0} onClick={redo}><Icon name="rotate-cw" size={16} /></Button>
              </>
            )}
            {hasKids && (
              <>
                <Button size="sm" variant="ghost" onClick={() => (readOnly ? setData(setCollapsedAll(data, true)) : commit(setCollapsedAll(data, true)))}>{t.collapseAll}</Button>
                <Button size="sm" variant="ghost" onClick={() => (readOnly ? setData(setCollapsedAll(data, false)) : commit(setCollapsedAll(data, false)))}>{t.expandAll}</Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 @4xl:grid-cols-[minmax(0,1fr)_20rem] @4xl:items-start">
          {view === "outline" ? (
            <OutlineView data={data} selected={selected} onSelect={setSelected} onToggle={toggle} t={t} />
          ) : (
            <MapCanvas data={data} kind={kind} selected={selected} onSelect={setSelected} onToggle={toggle} t={t} fitKey={fitKey} />
          )}
          <Inspector data={data} id={selected} commit={commit} select={setSelected} readOnly={readOnly} t={t} />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button size="sm" variant="secondary" onClick={share}><Icon name="link" size={15} /> {t.share}</Button>
          <span className="text-sm font-medium text-muted">{t.exportTitle}:</span>
          {(["png", "svg", "pdf", "json"] as const).map((k) => (
            <Button key={k} size="sm" variant="ghost" disabled={busy !== null} onClick={() => void exportAs(k)}><Icon name="download" size={15} /> {t[k]}</Button>
          ))}
          {busy && <span className="text-sm text-muted">{busy}</span>}
        </div>
        {link && <Field label={t.shareField}>{(p) => <TextInput {...p} readOnly dir="ltr" value={link} onFocus={(e) => e.currentTarget.select()} />}</Field>}
        {notice && <StatusMessage tone={notice.tone}>{notice.text}</StatusMessage>}
      </Panel>

      {!readOnly && (
        <>
          <Panel title={t.structure}><StructurePanel data={data} commit={commit} t={t} /></Panel>

          <Panel title={t.mapsTitle}>
            <div className="grid gap-5 @3xl:grid-cols-2">
              <div className="flex flex-col gap-3">
                <Field label={t.mapName}>{(p) => <TextInput {...p} value={data.name} onChange={(e) => commit({ ...data, name: e.target.value.slice(0, 80) })} />}</Field>
                <Field label={t.open}>
                  {(p) => (
                    <Select {...p} value={mapId} onChange={(e) => { const m = maps.find((x) => x.id === e.target.value); if (m) open(m.id, m.data); }}>
                      {maps.map((m) => <option key={m.id} value={m.id}>{m.id === mapId ? data.name : m.data.name}</option>)}
                    </Select>
                  )}
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => addMap({ ...data, name: `${data.name} (2)`, nodes: data.nodes })}>{t.dup}</Button>
                  {!confirmDelete ? (
                    <Button size="sm" variant="ghost" className="text-danger" onClick={() => setConfirmDelete(true)}><Icon name="trash" size={15} /> {t.del}</Button>
                  ) : (
                    <>
                      <Button size="sm" className="!bg-danger" onClick={removeMap}>{t.confirmRemove}</Button>
                      <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>{t.cancel}</Button>
                    </>
                  )}
                  <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-fg">
                    <Icon name="upload" size={15} /> {t.imp}
                    <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { void importFile(e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                </div>
                <div className="flex flex-wrap items-end gap-2 border-t border-line pt-3">
                  <Field label={t.newFrom} className="min-w-40 flex-1">
                    {(p) => (
                      <Select {...p} value={newKind} onChange={(e) => setNewKind(e.target.value as TemplateId)}>
                        {TEMPLATE_IDS.map((id) => <option key={id} value={id}>{t.templates[id]}</option>)}
                      </Select>
                    )}
                  </Field>
                  <Button onClick={() => addMap(template(newKind, t.names))}>{t.create}</Button>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">{t.outlineTitle}</h3>
                <p className="text-xs text-muted">{t.outlineHelp}</p>
                <TextArea aria-label={t.outlineTitle} rows={6} value={outline} onChange={(e) => setOutline(e.target.value)} placeholder={"My plan\n  Phase 1\n    Task A\n    Task B\n  Phase 2"} />
                <div>
                  <Button variant="secondary" onClick={() => { const d = parseOutline(outline, t.defaultName); if (!d) { setNotice({ tone: "error", text: t.outlineError }); return; } setNotice(null); setOutline(""); addMap(d); }}>{t.outlineBuild}</Button>
                </div>
              </div>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
