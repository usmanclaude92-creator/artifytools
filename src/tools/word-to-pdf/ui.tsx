"use client";

import { useEffect, useRef, useState } from "react";
import { FileDropZone } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { formatBytes } from "@/lib/files/size";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);

const strings = {
  en: {
    choose: "Choose a Word document", types: "DOCX", another: "Choose another file", reading: "Opening your document…",
    preview: "Preview", save: "Save as PDF", hint: "Your browser's print window opens. Choose “Save as PDF” (or “Microsoft Print to PDF”) as the printer, then save. On a phone, choose Print, then share or save the PDF.",
    pages: (n: number) => `${n} page${n === 1 ? "" : "s"} in the preview`,
    errors: { invalid: "This file couldn't be opened as a Word document (.docx). Old .doc files must be saved as .docx in Word first.", print: "The print window couldn't be opened. Try again, or allow pop-ups for this site." },
    note: "Fonts that aren't installed on this device are replaced with similar ones, so line breaks can differ slightly from Word.",
  },
  ar: {
    choose: "اختر مستند Word", types: "DOCX", another: "اختيار ملف آخر", reading: "جارٍ فتح المستند…",
    preview: "المعاينة", save: "حفظ بصيغة PDF", hint: "ستفتح نافذة الطباعة في متصفحك. اختر «حفظ بتنسيق PDF» (أو Microsoft Print to PDF) كطابعة ثم احفظ. وعلى الهاتف اختر «طباعة» ثم شارك ملف PDF أو احفظه.",
    pages: (n: number) => `${n} صفحة في المعاينة`,
    errors: { invalid: "تعذّر فتح هذا الملف كمستند Word ‏(.docx). يجب حفظ ملفات .doc القديمة بصيغة .docx في Word أولًا.", print: "تعذّر فتح نافذة الطباعة. حاول مجددًا أو اسمح بالنوافذ المنبثقة لهذا الموقع." },
    note: "تُستبدل الخطوط غير المثبتة على هذا الجهاز بخطوط مشابهة، لذا قد تختلف نهايات الأسطر قليلًا عن Word.",
  },
};

const FRAME_CSS = `
  html, body { margin: 0; padding: 0; background: #f4f1fa; }
  body { zoom: var(--zoom, 1); }
  .docx-wrapper { background: transparent !important; padding: 12px 0 !important; }
  .docx-wrapper > section.docx { box-shadow: 0 1px 4px rgb(0 0 0 / 0.15) !important; margin-bottom: 12px !important; }
  @media print {
    html, body { background: #fff !important; zoom: 1 !important; }
    .docx-wrapper { padding: 0 !important; display: block !important; }
    .docx-wrapper > section.docx { box-shadow: none !important; margin: 0 !important; break-after: page; }
    .docx-wrapper > section.docx:last-child { break-after: auto; }
  }`;

export default function WordToPdf() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const pageWidthPx = useRef(816);

  // Keep the preview's zoom and height in step with the available width.
  useEffect(() => {
    if (!ready) return;
    const el = holder.current, f = frame.current;
    if (!el || !f?.contentDocument) return;
    const fit = () => {
      const d = f.contentDocument!;
      const zoom = Math.min(1, (el.clientWidth - 2) / (pageWidthPx.current + 24));
      d.documentElement.style.setProperty("--zoom", String(zoom));
      f.style.height = `${Math.min(900, Math.ceil(d.body.scrollHeight * zoom) + 4)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready]);

  async function open(f: File) {
    setFile(f);
    setError(null);
    setReady(false);
    // Wait for the iframe to mount.
    for (let i = 0; i < 30 && !frame.current; i++) await new Promise((r) => requestAnimationFrame(r));
    const iframe = frame.current;
    const d = iframe?.contentDocument;
    if (!iframe || !d) return;
    d.open();
    d.write(`<!doctype html><html><head><meta charset="utf-8"><title>${f.name.replace(/[<>&]/g, "")}</title><style>${FRAME_CSS}</style></head><body><div id="s"></div><div id="b"></div></body></html>`);
    d.close();
    try {
      const { renderAsync } = await import("docx-preview");
      await renderAsync(f, d.getElementById("b")!, d.getElementById("s")!, { inWrapper: true, hideWrapperOnPrint: true, breakPages: true, ignoreLastRenderedPageBreak: true, experimental: true, useBase64URL: true, renderHeaders: true, renderFooters: true, renderFootnotes: true });
      // Right-to-left paragraphs (Arabic, Hebrew) aren't always marked; let their first letter decide.
      for (const para of d.querySelectorAll<HTMLElement>("section.docx p")) {
        const strong = /[A-Za-z\u00C0-\u024F\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.exec(para.textContent ?? "");
        if (strong && /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(strong[0])) {
          para.dir = "rtl";
          if (para.style.textAlign === "left") para.style.textAlign = "right";
        }
      }
      const sections = d.querySelectorAll<HTMLElement>("section.docx");
      if (!sections.length) throw new Error("empty");
      const first = sections[0]!;
      pageWidthPx.current = first.getBoundingClientRect().width || 816;
      // Print at the document's own page size, without browser margins.
      const style = d.createElement("style");
      style.textContent = `@page { size: ${first.style.width || "210mm"} ${first.style.minHeight || first.style.height || "297mm"}; margin: 0; }`;
      d.head.appendChild(style);
      await Promise.all([...d.images].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }))));
      setPageCount(sections.length);
      setReady(true);
    } catch {
      setError(t.errors.invalid);
    }
  }

  function save() {
    const w = frame.current?.contentWindow;
    try {
      w!.focus();
      w!.print();
    } catch {
      setError(t.errors.print);
    }
  }

  if (!file) {
    return (
      <Panel title={t.choose}>
        <FileDropZone rules={rules} onFiles={(fs) => fs[0] && open(fs[0])} typesLabel={t.types} />
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.choose}>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-surface-2 text-muted"><Icon name="file-text" size={22} /></span>
          <div className="min-w-0 flex-1 basis-40">
            <p className="truncate font-medium" title={file.name}><bdi>{file.name}</bdi></p>
            <p className="text-sm text-muted">{formatBytes(file.size, locale)} · {ready ? t.pages(pageCount) : error ? "" : t.reading}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { setFile(null); setReady(false); setError(null); }}>
            <Icon name="rotate-ccw" size={16} /> {t.another}
          </Button>
        </div>
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
        {ready && (
          <div className="flex flex-col gap-3 border-t border-line pt-4">
            <div>
              <Button size="lg" onClick={save}>
                <Icon name="download" size={18} /> {t.save}
              </Button>
            </div>
            <p className="text-sm text-muted">{t.hint}</p>
          </div>
        )}
      </Panel>

      <Panel title={t.preview} className={ready ? undefined : "hidden"}>
        <div ref={holder} className="overflow-hidden rounded-lg border border-line">
          <iframe ref={frame} title={t.preview} className="block h-[480px] w-full bg-[#f4f1fa]" sandbox="allow-same-origin allow-modals" />
        </div>
        <p className="text-sm text-muted">{t.note}</p>
      </Panel>
    </div>
  );
}
