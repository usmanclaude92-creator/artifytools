"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/components/ui/cx";
import { useLocale } from "@/components/i18n/locale-provider";
import { createOcr, type OcrEngine } from "@/lib/ocr/ocr";
import { openPdf, renderPage } from "@/lib/pdf/render";
import { findChequeRect, layoutFromWords, pageScale, type FoundFields } from "@/lib/cheque/scan";
import { FIELD_IDS, type FieldBox, type FieldId } from "@/lib/cheque/templates";

export interface ScanResult { width: number; height: number; fields: Record<FieldId, FieldBox> }

interface Frac { x0: number; y0: number; x1: number; y1: number }
const MIN = 0.05;
const MAX_SIDE = 3600;
const OCR_WIDTH = 2600;
const clamp = (v: number) => Math.min(1, Math.max(0, v));

const strings = {
  en: {
    title: "Measure from an A4 copy", open: "Detect from an A4 scan",
    steps: [
      "Copy or scan your cheque onto one A4 sheet, with the cheque flat and straight.",
      "Print it at 100% (set Scale to “Actual size” or 100%, not “Fit to page”) so the cheque keeps its real size on the sheet.",
      "Scan that printed sheet flat, or photograph it straight on with the whole sheet in view. Scans at 200–300 dpi work best.",
      "Upload it below. Check the outline we found around the cheque and drag its corners if it is off.",
      "Press Detect fields. We read the printed labels (Date, Pay, Rupees, the amount box…) to place each field. Then press Use this size.",
    ],
    choose: "Choose the scan (image or PDF)", reading: "Reading the scan…", notA4: "This doesn't look like a whole A4 sheet, so the size can't be measured. Scan the full page flat, with all four edges in view.",
    failed: "That file couldn't be read. Try a JPG, PNG or PDF of the scan.", noCheque: "No cheque was found on the page. Check that the copy is dark enough, or drag the outline over the cheque.",
    outline: "Cheque outline", size: (w: number, h: number) => `Measured size: ${w} × ${h} mm`, detect: "Detect fields", detecting: "Reading the labels…", loadingOcr: "Preparing OCR…",
    apply: "Use this size", close: "Close", found: "Found from its label", estimated: "Estimated: adjust it under Adjust positions", fieldNames: { date: "Date", payee: "Payee", words1: "Words line 1", words2: "Words line 2", figures: "Figures", crossing: "Crossing" } as Record<FieldId, string>,
    summary: (n: number) => `${n} of 6 fields were found from printed labels. The rest use typical positions; fine-tune them under Adjust positions and test-print on plain paper.`,
    corner: (n: string) => `Cheque outline corner ${n}`, privacy: "The scan stays in your browser. Nothing is uploaded.",
  },
  ar: {
    title: "القياس من نسخة A4", open: "الاكتشاف من مسح A4",
    steps: [
      "انسخ شيكك أو امسحه ضوئيًا على ورقة A4 واحدة، مع وضع الشيك مسطحًا ومستقيمًا.",
      "اطبعها بنسبة 100% (اضبط الحجم على «الحجم الفعلي» أو 100% وليس «ملاءمة الصفحة») ليحتفظ الشيك بحجمه الحقيقي على الورقة.",
      "امسح الورقة المطبوعة ضوئيًا وهي مسطحة، أو صوّرها من الأمام مع ظهور الورقة كاملة. أفضل دقة للمسح 200–300 نقطة.",
      "ارفعها هنا. راجع الإطار الذي وجدناه حول الشيك واسحب زواياه إن لم يكن دقيقًا.",
      "اضغط «اكتشاف الحقول». نقرأ العناوين المطبوعة (التاريخ، ادفعوا، المبلغ…) لوضع كل حقل. ثم اضغط «استخدام هذا المقاس».",
    ],
    choose: "اختر ملف المسح (صورة أو PDF)", reading: "جارٍ قراءة المسح…", notA4: "لا تبدو هذه ورقة A4 كاملة، فلا يمكن قياس الحجم. امسح الصفحة كاملة وهي مسطحة مع ظهور حوافها الأربع.",
    failed: "تعذّرت قراءة الملف. جرّب صورة JPG أو PNG أو ملف PDF للمسح.", noCheque: "لم نعثر على شيك في الصفحة. تأكد أن النسخة داكنة بما يكفي، أو اسحب الإطار فوق الشيك.",
    outline: "إطار الشيك", size: (w: number, h: number) => `المقاس المقيس: ${w} × ${h} مم`, detect: "اكتشاف الحقول", detecting: "جارٍ قراءة العناوين…", loadingOcr: "جارٍ تجهيز OCR…",
    apply: "استخدام هذا المقاس", close: "إغلاق", found: "وُجد من عنوانه", estimated: "تقديري: عدّله من «ضبط المواضع»", fieldNames: { date: "التاريخ", payee: "المستفيد", words1: "سطر المبلغ بالحروف 1", words2: "سطر المبلغ بالحروف 2", figures: "المبلغ بالأرقام", crossing: "الشطب" } as Record<FieldId, string>,
    summary: (n: number) => `وُجد ${n} من 6 حقول من العناوين المطبوعة. والباقي بمواضع نموذجية؛ عدّلها من «ضبط المواضع» وجرّب الطباعة على ورق عادي.`,
    corner: (n: string) => `زاوية إطار الشيك ${n}`, privacy: "يبقى المسح داخل متصفحك ولا يُرفع.",
  },
};

/** Measures a cheque from a copy printed on A4: finds the cheque on the sheet, then reads its printed labels with OCR. */
export function A4Scan({ onApply, onClose }: { onApply: (r: ScanResult) => void; onClose: () => void }) {
  const locale = useLocale();
  const t = strings[locale];
  const [preview, setPreview] = useState<string | null>(null);
  const [rect, setRect] = useState<Frac | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ size: ScanResult; found: FoundFields } | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number; mmPerPx: number } | null>(null);
  const page = useRef<{ canvas: HTMLCanvasElement; mmPerPx: number } | null>(null);
  const url = useRef<string | null>(null);
  const engine = useRef<OcrEngine | null>(null);
  const drag = useRef<string | null>(null);

  useEffect(() => () => {
    if (url.current) URL.revokeObjectURL(url.current);
    void engine.current?.terminate();
  }, []);

  async function load(file: File) {
    setError(null);
    setResult(null);
    setRect(null);
    setBusy(t.reading);
    try {
      let source: Blob = file;
      if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
        const doc = await openPdf(new Uint8Array(await file.arrayBuffer()));
        source = (await renderPage(doc, 1, { dpi: 200, format: "jpg", quality: 0.92 })).blob;
        void doc.destroy();
      }
      const bmp = await createImageBitmap(source);
      const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bmp.width * k);
      canvas.height = Math.round(bmp.height * k);
      canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      bmp.close();
      const scale = pageScale(canvas.width, canvas.height);
      if (!scale.ok) { setError(t.notA4); setPreview(null); return; }
      page.current = { canvas, mmPerPx: scale.mmPerPx };
      setDims({ w: canvas.width, h: canvas.height, mmPerPx: scale.mmPerPx });
      // Small grey copy to find the outline of the cheque.
      const s = Math.min(1, 1000 / Math.max(canvas.width, canvas.height));
      const small = document.createElement("canvas");
      small.width = Math.round(canvas.width * s);
      small.height = Math.round(canvas.height * s);
      const sctx = small.getContext("2d", { willReadFrequently: true })!;
      sctx.drawImage(canvas, 0, 0, small.width, small.height);
      const px = sctx.getImageData(0, 0, small.width, small.height).data;
      const gray = new Uint8Array(small.width * small.height);
      for (let i = 0; i < gray.length; i++) gray[i] = (px[i * 4]! * 0.299 + px[i * 4 + 1]! * 0.587 + px[i * 4 + 2]! * 0.114) | 0;
      const found = findChequeRect(gray, small.width, small.height);
      const blob = await new Promise<Blob | null>((res) => small.toBlob(res, "image/jpeg", 0.85));
      if (url.current) URL.revokeObjectURL(url.current);
      url.current = blob ? URL.createObjectURL(blob) : null;
      setPreview(url.current);
      if (found) setRect({ x0: found.x0 / small.width, y0: found.y0 / small.height, x1: found.x1 / small.width, y1: found.y1 / small.height });
      else { setRect({ x0: 0.1, y0: 0.1, x1: 0.9, y1: 0.4 }); setError(t.noCheque); }
    } catch {
      setError(t.failed);
      setPreview(null);
    } finally {
      setBusy(null);
    }
  }

  const frac = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.closest<HTMLElement>("[data-scan-page]")!.getBoundingClientRect();
    return { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) };
  };
  const move = (corner: string, e: React.PointerEvent<HTMLElement>) => {
    if (drag.current !== corner || !rect) return;
    const p = frac(e);
    setResult(null);
    setRect({
      x0: corner.includes("w") ? Math.min(p.x, rect.x1 - MIN) : rect.x0,
      x1: corner.includes("e") ? Math.max(p.x, rect.x0 + MIN) : rect.x1,
      y0: corner.includes("n") ? Math.min(p.y, rect.y1 - MIN) : rect.y0,
      y1: corner.includes("s") ? Math.max(p.y, rect.y0 + MIN) : rect.y1,
    });
  };

  async function detect() {
    const pg = page.current;
    if (!pg || !rect) return;
    setError(null);
    try {
      const { canvas, mmPerPx } = pg;
      const sx = Math.round(rect.x0 * canvas.width), sy = Math.round(rect.y0 * canvas.height);
      const sw = Math.round((rect.x1 - rect.x0) * canvas.width), sh = Math.round((rect.y1 - rect.y0) * canvas.height);
      const width = +(sw * mmPerPx).toFixed(1), height = +(sh * mmPerPx).toFixed(1);
      const k = Math.min(1, OCR_WIDTH / sw);
      const crop = document.createElement("canvas");
      crop.width = Math.round(sw * k);
      crop.height = Math.round(sh * k);
      crop.getContext("2d")!.drawImage(canvas, sx, sy, sw, sh, 0, 0, crop.width, crop.height);
      const blob = await new Promise<Blob | null>((res) => crop.toBlob(res, "image/png"));
      if (!blob) throw new Error("encode");
      if (!engine.current) {
        setBusy(t.loadingOcr);
        engine.current = await createOcr(["eng", "ara"], () => undefined);
      }
      setBusy(t.detecting);
      const words = await engine.current.recognizeWords(blob);
      const { fields, found } = layoutFromWords(words, { width, height }, crop.width / width);
      setResult({ size: { width, height, fields }, found });
    } catch {
      setError(t.failed);
    } finally {
      setBusy(null);
    }
  }

  const pct = (v: number) => `${v * 100}%`;
  const foundCount = result ? FIELD_IDS.filter((f) => result.found[f]).length : 0;
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line p-4" data-testid="a4-scan">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{t.title}</p>
        <Button variant="ghost" size="sm" onClick={onClose}>{t.close}</Button>
      </div>
      <ol className="flex list-decimal flex-col gap-1.5 ps-5 text-sm text-muted">
        {t.steps.map((s) => <li key={s}>{s}</li>)}
      </ol>
      <p className="text-xs text-muted">{t.privacy}</p>
      <label className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-2">
        <Icon name="upload" size={17} /> {t.choose}
        <input type="file" accept="image/*,application/pdf,.pdf" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = ""; }} />
      </label>
      {error && <StatusMessage tone="error">{error}</StatusMessage>}
      {preview && rect && (
        <div className="flex flex-col gap-3">
          <div data-scan-page className="relative mx-auto w-full max-w-md select-none overflow-hidden rounded-lg border border-line bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
            <img src={preview} alt="" draggable={false} className="block w-full" />
            <div className="pointer-events-none absolute border-2 border-accent" data-testid="scan-outline" style={{ left: pct(rect.x0), top: pct(rect.y0), width: pct(rect.x1 - rect.x0), height: pct(rect.y1 - rect.y0) }}>
              {result && FIELD_IDS.map((f) => {
                const b = result.size.fields[f], w = result.size.width, h = result.size.height;
                return <span key={f} title={t.fieldNames[f]} className={cx("absolute border", result.found[f] ? "border-success bg-success/20" : "border-warning bg-warning/20")} style={{ left: pct(b.x / w), top: pct(b.y / h), width: pct(b.w / w), height: pct(b.h / h) }} />;
              })}
            </div>
            {(["nw", "ne", "sw", "se"] as const).map((c) => (
              <div
                key={c}
                role="button"
                tabIndex={0}
                aria-label={t.corner(c)}
                data-corner={c}
                className="absolute grid size-9 -translate-x-1/2 -translate-y-1/2 cursor-move place-items-center [touch-action:none]"
                style={{ left: pct(c.includes("w") ? rect.x0 : rect.x1), top: pct(c.includes("n") ? rect.y0 : rect.y1) }}
                onPointerDown={(e) => { drag.current = c; e.currentTarget.setPointerCapture(e.pointerId); }}
                onPointerMove={(e) => move(c, e)}
                onPointerUp={() => { drag.current = null; }}
                onPointerCancel={() => { drag.current = null; }}
              >
                <span className="size-3.5 rounded-full border-2 border-accent bg-surface shadow-sm" />
              </div>
            ))}
          </div>
          {dims && <p className="text-sm font-medium" data-testid="scan-size">{t.size(+((rect.x1 - rect.x0) * dims.w * dims.mmPerPx).toFixed(1), +((rect.y1 - rect.y0) * dims.h * dims.mmPerPx).toFixed(1))}</p>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={detect} disabled={busy !== null}>
              <Icon name={busy ? "loader" : "wand"} size={17} className={busy ? "animate-spin" : undefined} /> {busy ?? t.detect}
            </Button>
            {result && <Button variant="secondary" onClick={() => onApply(result.size)}><Icon name="check" size={17} /> {t.apply}</Button>}
          </div>
          {result && (
            <div className="flex flex-col gap-2">
              <StatusMessage tone={foundCount >= 3 ? "success" : "warning"}>{t.summary(foundCount)}</StatusMessage>
              <ul className="grid gap-1 text-sm sm:grid-cols-2">
                {FIELD_IDS.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className={cx("size-2.5 rounded-full", result.found[f] ? "bg-success" : "bg-warning")} />
                    <span className="font-medium">{t.fieldNames[f]}</span>
                    <span className="text-muted">{result.found[f] ? t.found : t.estimated}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
