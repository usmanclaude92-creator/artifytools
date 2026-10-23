"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { PdfPagePreview, SingleFile } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Checkbox, Field, Select, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { baseName, safeFileName } from "@/lib/files/names";
import type { FileRules } from "@/lib/files/rules";
import { annotatePdf, type Annotation } from "@/lib/pdf/annotate";
import { PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { openPdf } from "@/lib/pdf/render";
import { textBlock, uploadedSignature, type SignatureImage } from "@/lib/images/signature";
import { PageEditor, type EditorItem } from "./page-editor";
import { SignaturePad, type SignatureLabels } from "./signature-pad";

export type AnnotatorMode = "sign" | "edit";

const strings = {
  en: {
    choose: "Choose a PDF", types: "PDF", pages: (n: number) => `${n} page${n === 1 ? "" : "s"}`, reading: "Reading your PDF…",
    signTitle: "1. Create your signature", placeTitle: (sign: boolean) => (sign ? "2. Place it on the page" : "Edit the pages"),
    tools: "Add to the page", addText: "Add text", addDate: "Add date", whiteout: "White-out", addImage: "Add image", addSignature: "Add signature", closeSignature: "Hide signature",
    placeHint: "Items are added to the page you're viewing. Drag to move, drag the round corner to resize, or select one and use the arrow keys. Delete removes it.",
    editor: { page: (n: number, t: number) => `Page ${n} of ${t}`, prev: "Previous page", next: "Next page", remove: "Remove", itemHint: "Drag or use arrow keys to move; Delete removes it", loading: "Loading page…", clickToPlace: "Click on the page to place it" },
    selected: "Selected item", text: "Text", size: "Size", color: "Colour", bold: "Bold", whiteColor: "Box colour",
    labels: { signature: "Signature", text: "Text", date: "Date", whiteout: "White-out box", image: "Image" },
    newText: "Your text",
    count: (n: number) => (n === 0 ? "Nothing added yet." : `${n} item${n === 1 ? "" : "s"} added.`),
    apply: (sign: boolean) => (sign ? "Sign PDF" : "Save PDF"), applying: "Saving…", result: "Your PDF", preview: (n: number) => `Page ${n} of the result`, stale: "You changed something. Save again to update the file.",
    badImage: "That image couldn't be used. Choose a PNG, JPG or WebP file.",
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    failed: "Saving failed. The file may be damaged.",
    signature: {
      method: "How to sign", modes: { draw: "Draw", type: "Type", upload: "Upload" }, drawHint: "Sign in the box with your mouse, finger or pen.", clear: "Clear",
      ink: "Ink", inks: ["Black ink", "Blue ink"], name: "Your name", namePlaceholder: "Your name", style: "Style",
      upload: "Signature image", uploadHint: "A photo or scan of your signature on white paper.", clean: "Remove the white background", cleanHint: "Makes the paper transparent so only the ink shows.",
      add: "Add signature to this page", empty: "Draw, type or choose your signature first.", badImage: "That image couldn't be used. Choose a PNG, JPG or WebP file.",
    } as SignatureLabels,
  },
  ar: {
    choose: "اختر ملف PDF", types: "PDF", pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"), reading: "جارٍ قراءة ملف PDF…",
    signTitle: "1. أنشئ توقيعك", placeTitle: (sign: boolean) => (sign ? "2. ضعه على الصفحة" : "عدّل الصفحات"),
    tools: "أضف إلى الصفحة", addText: "إضافة نص", addDate: "إضافة التاريخ", whiteout: "تغطية بالأبيض", addImage: "إضافة صورة", addSignature: "إضافة توقيع", closeSignature: "إخفاء التوقيع",
    placeHint: "تُضاف العناصر إلى الصفحة المعروضة. اسحب للتحريك، واسحب الزاوية الدائرية لتغيير الحجم، أو حدّد عنصرًا واستخدم الأسهم. يحذفه زر Delete.",
    editor: { page: (n: number, t: number) => `الصفحة ${n} من ${t}`, prev: "الصفحة السابقة", next: "الصفحة التالية", remove: "إزالة", itemHint: "اسحب أو استخدم الأسهم للتحريك، واضغط Delete للحذف", loading: "جارٍ تحميل الصفحة…", clickToPlace: "انقر على الصفحة لوضعه" },
    selected: "العنصر المحدد", text: "النص", size: "الحجم", color: "اللون", bold: "عريض", whiteColor: "لون المربع",
    labels: { signature: "توقيع", text: "نص", date: "تاريخ", whiteout: "مربع تغطية", image: "صورة" },
    newText: "نصك هنا",
    count: (n: number) => (n === 0 ? "لم تُضف شيئًا بعد." : `أُضيف ${arCount(n, "عنصر واحد", "عنصران", "عناصر", "عنصرًا", "عنصر")}.`),
    apply: (sign: boolean) => (sign ? "توقيع ملف PDF" : "حفظ ملف PDF"), applying: "جارٍ الحفظ…", result: "ملف PDF الخاص بك", preview: (n: number) => `الصفحة ${n} من النتيجة`, stale: "غيّرت شيئًا. احفظ مجددًا لتحديث الملف.",
    badImage: "تعذّر استخدام هذه الصورة. اختر ملف PNG أو JPG أو WebP.",
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    failed: "فشل الحفظ. قد يكون الملف تالفًا.",
    signature: {
      method: "طريقة التوقيع", modes: { draw: "ارسم", type: "اكتب", upload: "ارفع صورة" }, drawHint: "وقّع داخل المربع بالفأرة أو بإصبعك أو بالقلم.", clear: "مسح",
      ink: "الحبر", inks: ["حبر أسود", "حبر أزرق"], name: "اسمك", namePlaceholder: "اسمك", style: "الخط",
      upload: "صورة التوقيع", uploadHint: "صورة أو مسح ضوئي لتوقيعك على ورق أبيض.", clean: "إزالة الخلفية البيضاء", cleanHint: "تجعل الورق شفافًا فيظهر الحبر فقط.",
      add: "أضف التوقيع إلى هذه الصفحة", empty: "ارسم توقيعك أو اكتبه أو اختر صورته أولًا.", badImage: "تعذّر استخدام هذه الصورة. اختر ملف PNG أو JPG أو WebP.",
    } as SignatureLabels,
  },
};

let seq = 0;
const nextId = () => `i${++seq}`;

/** Shared editor for Sign PDF and Edit PDF: place signatures, text, dates, images and white-out boxes. */
export function PdfAnnotator({ mode, rules, outputSuffix }: { mode: AnnotatorMode; rules: FileRules; outputSuffix: string }) {
  const locale = useLocale();
  const t = strings[locale];
  const sign = mode === "sign";
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [sizes, setSizes] = useState<{ w: number; h: number }[]>([]);
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<EditorItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPad, setShowPad] = useState(sign);
  const [result, setResult] = useState<{ key: string; bytes: Uint8Array; page: number } | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => void doc?.destroy(), [doc]);

  async function open(f: File) {
    setFile(f);
    setBytes(null);
    setDoc(null);
    setItems([]);
    setResult(null);
    setError(null);
    setPage(0);
    try {
      const b = new Uint8Array(await f.arrayBuffer());
      const d = await openPdf(b);
      const s: { w: number; h: number }[] = [];
      for (let i = 1; i <= d.numPages; i++) {
        const vp = (await d.getPage(i)).getViewport({ scale: 1 });
        s.push({ w: vp.width, h: vp.height });
      }
      setSizes(s);
      setDoc(d);
      setBytes(b);
    } catch (e) {
      setError(e instanceof PdfError ? t.errors[e.code] : t.errors.invalid);
    }
  }

  const size = sizes[page] ?? { w: 595, h: 842 };
  const family = () => (typeof document === "undefined" ? "sans-serif" : getComputedStyle(document.body).fontFamily);

  /** Adds an image-like item centred on the current page, `wFrac` wide, keeping its proportions. */
  function addImage(img: SignatureImage, label: string, wFrac: number) {
    let w = wFrac;
    let h = (w * size.w * img.height) / img.width / size.h;
    if (h > 0.2) { w *= 0.2 / h; h = 0.2; }
    const id = nextId();
    setItems((xs) => [...xs, { id, page, x: (1 - w) / 2, y: 0.62 - h / 2, w, h, kind: "image", url: img.url, png: img.png, lock: true, label: `${label} (${t.editor.page(page + 1, sizes.length)})` }]);
    setSelected(id);
  }

  async function addText(text: string, label: string, y = 0.45) {
    const pt = 12;
    const img = await textBlock(text, { pt, color: "#111827", bold: false, family: family() });
    const id = nextId();
    const w = img.wPt / size.w, h = img.hPt / size.h;
    setItems((xs) => [...xs, { id, page, x: (1 - w) / 2, y, w, h, kind: "text", url: img.url, png: img.png, lock: true, text, pt, color: "#111827", bold: false, label: `${label} (${t.editor.page(page + 1, sizes.length)})` }]);
    setSelected(id);
  }

  function addWhiteout() {
    const id = nextId();
    setItems((xs) => [...xs, { id, page, x: 0.35, y: 0.4, w: 0.3, h: 0.04, kind: "rect", color: "#ffffff", lock: false, label: `${t.labels.whiteout} (${t.editor.page(page + 1, sizes.length)})` }]);
    setSelected(id);
  }

  async function pickImage(f: File | undefined) {
    if (!f) return;
    try {
      const img = await uploadedSignature(f, false);
      if (img) addImage(img, t.labels.image, 0.4);
    } catch {
      setError(t.badImage);
    }
  }

  const today = () => new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date());

  /** Re-renders a text item after its text or style changed, keeping its position. */
  async function restyle(id: string, patch: Partial<{ text: string; pt: number; color: string; bold: boolean }>) {
    const it = items.find((i) => i.id === id);
    if (!it || it.kind !== "text") return;
    const next = { text: it.text, pt: it.pt, color: it.color, bold: it.bold, ...patch };
    setItems((xs) => xs.map((x) => (x.id === id && x.kind === "text" ? { ...x, ...next } : x)));
    const img = await textBlock(next.text || " ", { pt: next.pt, color: next.color, bold: next.bold, family: family() });
    const s = sizes[it.page]!;
    setItems((xs) => xs.map((x) => (x.id === id && x.kind === "text" ? { ...x, url: img.url, png: img.png, w: img.wPt / s.w, h: img.hPt / s.h } : x)));
  }

  const sel = items.find((i) => i.id === selected) ?? null;
  const key = items.map((i) => `${i.id}:${i.page}:${i.x.toFixed(4)}:${i.y.toFixed(4)}:${i.w.toFixed(4)}:${i.h.toFixed(4)}:${i.kind === "rect" ? i.color : i.url}`).join("|");
  const current = result && result.key === key ? result : null;

  async function apply() {
    if (!bytes || !items.length) return;
    setBusy(true);
    setError(null);
    try {
      const anns: Annotation[] = items.map((i) => (i.kind === "rect" ? { kind: "rect", page: i.page, x: i.x, y: i.y, w: i.w, h: i.h, color: i.color } : { kind: "image", page: i.page, x: i.x, y: i.y, w: i.w, h: i.h, png: i.png }));
      const out = await annotatePdf(bytes, anns);
      setResult({ key, bytes: out, page: Math.min(...items.map((i) => i.page)) + 1 });
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.choose}>
        <SingleFile file={file} rules={rules} typesLabel={t.types} busy={busy} status={doc ? t.pages(sizes.length) : file && !error ? t.reading : null} onFile={open} onClear={() => { setFile(null); setBytes(null); setDoc(null); setItems([]); setResult(null); setError(null); }} />
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
      </Panel>

      {doc && bytes && (
        <>
          {sign && (
            <Panel title={t.signTitle}>
              <SignaturePad labels={t.signature} onAdd={(s) => addImage(s, t.labels.signature, 0.3)} />
              <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                <Button variant="secondary" size="sm" onClick={() => addText(today(), t.labels.date, 0.75)}><Icon name="calendar-range" size={16} /> {t.addDate}</Button>
                <Button variant="secondary" size="sm" onClick={() => addText(t.newText, t.labels.text)}><Icon name="type" size={16} /> {t.addText}</Button>
              </div>
            </Panel>
          )}

          <Panel title={t.placeTitle(sign)}>
            {!sign && (
              <div className="flex flex-col gap-3">
                <div role="group" aria-label={t.tools} className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => addText(t.newText, t.labels.text)}><Icon name="type" size={16} /> {t.addText}</Button>
                  <Button variant="secondary" size="sm" onClick={addWhiteout}><Icon name="eraser" size={16} /> {t.whiteout}</Button>
                  <Button variant="secondary" size="sm" onClick={() => imageInput.current?.click()}><Icon name="image" size={16} /> {t.addImage}</Button>
                  <Button variant="secondary" size="sm" onClick={() => setShowPad((v) => !v)} aria-expanded={showPad}><Icon name="wand" size={16} /> {showPad ? t.closeSignature : t.addSignature}</Button>
                  <Button variant="secondary" size="sm" onClick={() => addText(today(), t.labels.date, 0.75)}><Icon name="calendar-range" size={16} /> {t.addDate}</Button>
                  <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { void pickImage(e.target.files?.[0]); e.target.value = ""; }} />
                </div>
                {showPad && (
                  <div className="rounded-lg border border-line p-4">
                    <SignaturePad labels={t.signature} onAdd={(s) => { addImage(s, t.labels.signature, 0.3); setShowPad(false); }} />
                  </div>
                )}
              </div>
            )}
            <p className="text-sm text-muted">{t.placeHint}</p>
            <div className="grid gap-5 lg:grid-cols-[1fr_17rem]">
              <PageEditor doc={doc} page={page} onPage={(p) => { setPage(p); setSelected(null); }} sizes={sizes} items={items} onItems={setItems} selected={selected} onSelect={setSelected} placing={false} onPlace={() => {}} labels={t.editor} />
              <aside className="flex flex-col gap-3" aria-label={t.selected}>
                <p className="text-sm text-muted" aria-live="polite">{t.count(items.length)}</p>
                {sel?.kind === "text" && (
                  <div className="flex flex-col gap-3 rounded-lg border border-line p-3">
                    <p className="text-sm font-semibold">{t.selected}</p>
                    <Field label={t.text}>
                      {(p) => <TextArea {...p} rows={3} value={sel.text} onChange={(e) => void restyle(sel.id, { text: e.target.value })} className="font-sans" />}
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t.size}>
                        {(p) => (
                          <Select {...p} value={sel.pt} onChange={(e) => void restyle(sel.id, { pt: Number(e.target.value) })}>
                            {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 40].map((n) => <option key={n} value={n}>{n} pt</option>)}
                          </Select>
                        )}
                      </Field>
                      <Field label={t.color}>
                        {(p) => <input {...p} type="color" value={sel.color} onChange={(e) => void restyle(sel.id, { color: e.target.value })} className="h-11 w-full cursor-pointer rounded-md border border-line-strong bg-transparent" />}
                      </Field>
                    </div>
                    <Checkbox label={t.bold} checked={sel.bold} onChange={(e) => void restyle(sel.id, { bold: e.target.checked })} />
                  </div>
                )}
                {sel?.kind === "rect" && (
                  <div className="flex flex-col gap-3 rounded-lg border border-line p-3">
                    <p className="text-sm font-semibold">{t.selected}</p>
                    <Field label={t.whiteColor}>
                      {(p) => <input {...p} type="color" value={sel.color} onChange={(e) => setItems((xs) => xs.map((x) => (x.id === sel.id && x.kind === "rect" ? { ...x, color: e.target.value } : x)))} className="h-11 w-full cursor-pointer rounded-md border border-line-strong bg-transparent" />}
                    </Field>
                  </div>
                )}
              </aside>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <Button size="lg" onClick={apply} disabled={busy || items.length === 0}>
                <Icon name={busy ? "loader" : sign ? "wand" : "check"} size={18} className={busy ? "animate-spin" : undefined} /> {busy ? t.applying : t.apply(sign)}
              </Button>
            </div>
          </Panel>

          {result && (
            <Panel title={t.result}>
              {!current ? (
                <p className="text-sm text-muted">{t.stale}</p>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <DownloadButton filename={`${safeFileName(baseName(file?.name ?? "document"), "document")}-${outputSuffix}.pdf`} getBlob={() => new Blob([current.bytes.buffer as ArrayBuffer], { type: "application/pdf" })} variant="primary" size="md" />
                  </div>
                  <PdfPagePreview bytes={current.bytes} page={current.page} alt={t.preview(current.page)} />
                </div>
              )}
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
