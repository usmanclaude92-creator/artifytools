"use client";

import { Aref_Ruqaa, Caveat, Dancing_Script, Great_Vibes } from "next/font/google";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Segmented, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { cx } from "@/components/ui/cx";
import { canvasToSignature, trimCanvas, typedSignature, uploadedSignature, type SignatureImage } from "@/lib/images/signature";

const dancing = Dancing_Script({ subsets: ["latin"], weight: "600", display: "swap" });
const vibes = Great_Vibes({ subsets: ["latin"], weight: "400", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], weight: "600", display: "swap" });
const ruqaa = Aref_Ruqaa({ subsets: ["arabic", "latin"], weight: "700", display: "swap" });
const FONTS = [vibes, dancing, caveat, ruqaa];

type Mode = "draw" | "type" | "upload";
const INKS = ["#111827", "#1d4ed8"];

export interface SignatureLabels {
  method: string;
  modes: Record<Mode, string>;
  drawHint: string;
  clear: string;
  ink: string;
  inks: string[];
  name: string;
  namePlaceholder: string;
  style: string;
  upload: string;
  uploadHint: string;
  clean: string;
  cleanHint: string;
  add: string;
  empty: string;
  badImage: string;
}

/** Draw, type or upload a signature; "add" hands a trimmed transparent PNG to the page editor. */
export function SignaturePad({ labels, onAdd, defaultName = "" }: { labels: SignatureLabels; onAdd: (sig: SignatureImage) => void; defaultName?: string }) {
  const [mode, setMode] = useState<Mode>("draw");
  const [ink, setInk] = useState(INKS[0]!);
  const [name, setName] = useState(defaultName);
  const [font, setFont] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [clean, setClean] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawn, setDrawn] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);

  // Size the drawing canvas to its box at the screen's pixel density.
  useEffect(() => {
    if (mode !== "draw") return;
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    const dpr = Math.max(2, window.devicePixelRatio || 1);
    c.width = Math.round(r.width * dpr);
    c.height = Math.round(r.height * dpr);
  }, [mode]);

  function point(e: PointerEvent<HTMLCanvasElement>) {
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  }
  function down(e: PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    last.current = point(e);
  }
  function moveTo(e: PointerEvent<HTMLCanvasElement>) {
    if (!last.current) return;
    const p = point(e);
    const g = canvas.current!.getContext("2d")!;
    g.strokeStyle = ink;
    g.lineWidth = canvas.current!.width / 160;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.beginPath();
    g.moveTo(last.current.x, last.current.y);
    const mid = { x: (last.current.x + p.x) / 2, y: (last.current.y + p.y) / 2 };
    g.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y);
    g.lineTo(p.x, p.y);
    g.stroke();
    last.current = p;
    setDrawn(true);
  }
  function clear() {
    const c = canvas.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setDrawn(false);
  }

  async function add() {
    setError(null);
    let sig: SignatureImage | null = null;
    if (mode === "draw") {
      const t = drawn ? trimCanvas(canvas.current!, 12) : null;
      sig = t ? await canvasToSignature(t) : null;
    } else if (mode === "type") {
      sig = name.trim() ? await typedSignature(name.trim(), FONTS[font]!.style.fontFamily, ink) : null;
    } else if (file) {
      try {
        sig = await uploadedSignature(file, clean);
      } catch {
        setError(labels.badImage);
        return;
      }
    }
    if (!sig) {
      setError(labels.empty);
      return;
    }
    onAdd(sig);
  }

  return (
    <div className="flex flex-col gap-4">
      <Segmented legend={labels.method} value={mode} onChange={(m) => { setMode(m); setError(null); setDrawn(false); }} options={(["draw", "type", "upload"] as Mode[]).map((m) => ({ value: m, label: labels.modes[m] }))} />
      {mode !== "upload" && (
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">{labels.ink}</legend>
          <span className="text-sm text-muted" aria-hidden="true">{labels.ink}</span>
          {INKS.map((c, i) => (
            <button key={c} type="button" aria-label={labels.inks[i]} aria-pressed={ink === c} onClick={() => setInk(c)} className={cx("size-8 rounded-full border-2", ink === c ? "border-[var(--accent)]" : "border-line")} style={{ backgroundColor: c }} />
          ))}
        </fieldset>
      )}
      {mode === "draw" && (
        <div className="flex flex-col gap-2">
          <canvas
            ref={canvas}
            aria-label={labels.drawHint}
            role="img"
            className="h-44 w-full touch-none rounded-lg border-2 border-dashed border-line-strong bg-white"
            onPointerDown={down}
            onPointerMove={moveTo}
            onPointerUp={() => (last.current = null)}
            onPointerCancel={() => (last.current = null)}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted">{labels.drawHint}</span>
            <Button variant="ghost" size="sm" onClick={clear} disabled={!drawn}><Icon name="eraser" size={16} /> {labels.clear}</Button>
          </div>
        </div>
      )}
      {mode === "type" && (
        <>
          <Field label={labels.name}>
            {(p) => <TextInput {...p} dir="auto" value={name} onChange={(e) => setName(e.target.value)} placeholder={labels.namePlaceholder} maxLength={60} />}
          </Field>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">{labels.style}</legend>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map((f, i) => (
                <button key={i} type="button" aria-pressed={font === i} onClick={() => setFont(i)} className={cx("min-h-16 truncate rounded-lg border-2 bg-white px-3 text-2xl", f.className, font === i ? "border-[var(--accent)]" : "border-line")} style={{ color: ink }} dir="auto">
                  {name.trim() || labels.namePlaceholder}
                </button>
              ))}
            </div>
          </fieldset>
        </>
      )}
      {mode === "upload" && (
        <>
          <Field label={labels.upload} hint={file ? file.name : labels.uploadHint}>
            {(p) => <input {...p} type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null); }} className="field-control py-2" />}
          </Field>
          <Checkbox label={labels.clean} hint={labels.cleanHint} checked={clean} onChange={(e) => setClean(e.target.checked)} />
        </>
      )}
      {error && <StatusMessage tone="error">{error}</StatusMessage>}
      <div>
        <Button onClick={add}><Icon name="check" size={17} /> {labels.add}</Button>
      </div>
    </div>
  );
}
