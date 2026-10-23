"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileDropZone } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/feedback";
import { Checkbox, Field, Segmented, Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { formatBytes } from "@/lib/files/size";
import { csvSheet, readWorkbook, SHEET_CSS, sheetHtml, type SheetOut } from "@/lib/excel/model";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
type Orientation = "auto" | "portrait" | "landscape";
type Paper = "a4" | "letter";
const PAPER = { a4: { w: 210, h: 297 }, letter: { w: 215.9, h: 279.4 } };
const MARGIN_MM = 10;
const mmToPx = (mm: number) => (mm * 96) / 25.4;

const strings = {
  en: {
    choose: "Choose a spreadsheet", types: "XLSX or CSV", another: "Choose another file", reading: "Opening your spreadsheet…",
    sheetCount: (n: number) => `${n} sheet${n === 1 ? "" : "s"}`,
    options: "Page setup", sheets: "Sheets to include", paper: "Paper size", papers: { a4: "A4", letter: "Letter" } as Record<Paper, string>,
    orientation: "Orientation", orientations: { auto: "Automatic", portrait: "Portrait", landscape: "Landscape" } as Record<Orientation, string>,
    fit: "Fit each sheet to the page width", grid: "Show gridlines", names: "Show sheet names as headings",
    save: "Save as PDF", hint: "Your browser's print window opens. Choose “Save as PDF” (or “Microsoft Print to PDF”) as the printer, then save. On a phone, choose Print, then share or save the PDF.",
    preview: "Preview", truncated: (name: string) => `“${name}” is very large; only the first 5,000 rows and 100 columns are included.`,
    noSheets: "Choose at least one sheet.", empty: "This spreadsheet has no cells with content.",
    errors: { invalid: "This file couldn't be opened as a spreadsheet. Old .xls files must be saved as .xlsx first.", print: "The print window couldn't be opened. Try again." },
  },
  ar: {
    choose: "اختر جدول بيانات", types: "XLSX أو CSV", another: "اختيار ملف آخر", reading: "جارٍ فتح الملف…",
    sheetCount: (n: number) => arCount(n, "ورقة واحدة", "ورقتان", "أوراق", "ورقة"),
    options: "إعداد الصفحة", sheets: "الأوراق المطلوبة", paper: "حجم الورق", papers: { a4: "A4", letter: "Letter" } as Record<Paper, string>,
    orientation: "الاتجاه", orientations: { auto: "تلقائي", portrait: "طولي", landscape: "عرضي" } as Record<Orientation, string>,
    fit: "ملاءمة كل ورقة لعرض الصفحة", grid: "إظهار خطوط الشبكة", names: "إظهار أسماء الأوراق كعناوين",
    save: "حفظ بصيغة PDF", hint: "ستفتح نافذة الطباعة في متصفحك. اختر «حفظ بتنسيق PDF» (أو Microsoft Print to PDF) كطابعة ثم احفظ. وعلى الهاتف اختر «طباعة» ثم شارك ملف PDF أو احفظه.",
    preview: "المعاينة", truncated: (name: string) => `الورقة «${name}» كبيرة جدًا؛ أُدرجت أول 5,000 صف و100 عمود فقط.`,
    noSheets: "اختر ورقة واحدة على الأقل.", empty: "لا يحتوي هذا الملف على خلايا بها بيانات.",
    errors: { invalid: "تعذّر فتح هذا الملف كجدول بيانات. يجب حفظ ملفات .xls القديمة بصيغة .xlsx أولًا.", print: "تعذّر فتح نافذة الطباعة. حاول مجددًا." },
  },
};

export default function ExcelToPdf() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<boolean[]>([]);
  const [paper, setPaper] = useState<Paper>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [fit, setFit] = useState(true);
  const [grid, setGrid] = useState(true);
  const [names, setNames] = useState(true);
  const frame = useRef<HTMLIFrameElement>(null);
  const holder = useRef<HTMLDivElement>(null);

  async function open(f: File) {
    setFile(f);
    setSheets(null);
    setError(null);
    try {
      let list: SheetOut[];
      if (/\.csv$/i.test(f.name) || f.type === "text/csv") {
        list = [csvSheet(await f.text(), f.name.replace(/\.csv$/i, ""))];
      } else {
        const ExcelJS = (await import("exceljs")).default;
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(await f.arrayBuffer());
        list = readWorkbook(wb);
      }
      setSheets(list);
      setPicked(list.map((s) => s.rows.length > 0));
      setNames(list.length > 1);
    } catch {
      setError(t.errors.invalid);
    }
  }

  const chosen = useMemo(() => (sheets ?? []).filter((s, i) => picked[i] && s.rows.length > 0), [sheets, picked]);
  const widest = Math.max(0, ...chosen.map((s) => s.cols.reduce((a, b) => a + b, 0)));
  const size = PAPER[paper];
  const portraitWidth = mmToPx(size.w - 2 * MARGIN_MM);
  const landscape = orientation === "landscape" || (orientation === "auto" && widest > portraitWidth * 1.05);
  const pageW = landscape ? size.h : size.w;
  const pageH = landscape ? size.w : size.h;
  const printable = mmToPx(pageW - 2 * MARGIN_MM);

  // Render the chosen sheets into the preview frame, laid out exactly as they will print.
  useEffect(() => {
    const d = frame.current?.contentDocument;
    if (!d || !chosen.length) return;
    const body = chosen
      .map((s) => {
        const w = s.cols.reduce((a, b) => a + b, 0);
        const zoom = fit && w > printable ? printable / w : 1;
        return sheetHtml(s, { gridlines: grid, title: names }).replace('<section class="sheet', `<section style="zoom:${zoom.toFixed(4)}" class="sheet`);
      })
      .join("");
    d.open();
    d.write(`<!doctype html><html><head><meta charset="utf-8"><title>${(file?.name ?? "").replace(/[<>&]/g, "")}</title><style>
      html,body{margin:0;background:#f4f1fa}
      .page{background:#fff;width:${pageW}mm;min-height:${pageH}mm;box-sizing:border-box;padding:${MARGIN_MM}mm;margin:12px auto;box-shadow:0 1px 4px rgb(0 0 0/.15)}
      body{zoom:var(--zoom,1)}
      ${SHEET_CSS}
      .sheet + .sheet{break-before:page;page-break-before:always}
      @page{size:${pageW}mm ${pageH}mm;margin:${MARGIN_MM}mm}
      @media print{html,body{background:#fff;zoom:1!important}.page{width:auto;min-height:0;padding:0;margin:0;box-shadow:none}.sheet tr{break-inside:avoid}}
    </style></head><body><div class="page">${body}</div></body></html>`);
    d.close();
    const el = holder.current, f = frame.current!;
    const fitFrame = () => {
      if (!el || !f.contentDocument?.body) return;
      const z = Math.min(1, (el.clientWidth - 2) / (mmToPx(pageW) + 24));
      f.contentDocument.documentElement.style.setProperty("--zoom", String(z));
      f.style.height = `${Math.min(900, Math.ceil(f.contentDocument.body.scrollHeight * z) + 4)}px`;
    };
    fitFrame();
    const ro = new ResizeObserver(fitFrame);
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [chosen, fit, grid, names, pageW, pageH, printable, file]);

  function save() {
    try {
      frame.current!.contentWindow!.focus();
      frame.current!.contentWindow!.print();
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

  const nonEmpty = sheets?.filter((s) => s.rows.length > 0).length ?? 0;
  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.choose}>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-surface-2 text-muted"><Icon name="file-text" size={22} /></span>
          <div className="min-w-0 flex-1 basis-40">
            <p className="truncate font-medium" title={file.name}><bdi>{file.name}</bdi></p>
            <p className="text-sm text-muted">{formatBytes(file.size, locale)} · {sheets ? t.sheetCount(sheets.length) : error ? "" : t.reading}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { setFile(null); setSheets(null); setError(null); }}>
            <Icon name="rotate-ccw" size={16} /> {t.another}
          </Button>
        </div>
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
        {sheets && nonEmpty === 0 && <StatusMessage tone="warning">{t.empty}</StatusMessage>}
      </Panel>

      {sheets && nonEmpty > 0 && (
        <Panel title={t.options}>
          {sheets.length > 1 && (
            <fieldset className="flex flex-col gap-1">
              <legend className="mb-1.5 text-sm font-medium">{t.sheets}</legend>
              <div className="flex flex-wrap gap-x-6">
                {sheets.map((s, i) => (
                  <Checkbox key={i} label={s.name} checked={Boolean(picked[i])} disabled={s.rows.length === 0} onChange={(e) => setPicked((p) => p.map((v, k) => (k === i ? e.target.checked : v)))} />
                ))}
              </div>
            </fieldset>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Segmented legend={t.orientation} value={orientation} onChange={setOrientation} options={(["auto", "portrait", "landscape"] as Orientation[]).map((v) => ({ value: v, label: t.orientations[v] }))} />
            <Field label={t.paper}>
              {(p) => (
                <Select {...p} value={paper} onChange={(e) => setPaper(e.target.value as Paper)} className="max-w-48">
                  {(["a4", "letter"] as Paper[]).map((v) => <option key={v} value={v}>{t.papers[v]}</option>)}
                </Select>
              )}
            </Field>
          </div>
          <div>
            <Checkbox label={t.fit} checked={fit} onChange={(e) => setFit(e.target.checked)} />
            <Checkbox label={t.grid} checked={grid} onChange={(e) => setGrid(e.target.checked)} />
            <Checkbox label={t.names} checked={names} onChange={(e) => setNames(e.target.checked)} />
          </div>
          {chosen.filter((s) => s.truncated).map((s) => <StatusMessage key={s.name} tone="warning">{t.truncated(s.name)}</StatusMessage>)}
          {chosen.length === 0 ? (
            <StatusMessage tone="error">{t.noSheets}</StatusMessage>
          ) : (
            <div className="flex flex-col gap-3 border-t border-line pt-4">
              <div>
                <Button size="lg" onClick={save}><Icon name="download" size={18} /> {t.save}</Button>
              </div>
              <p className="text-sm text-muted">{t.hint}</p>
            </div>
          )}
        </Panel>
      )}

      <Panel title={t.preview} className={sheets && chosen.length ? undefined : "hidden"}>
        <div ref={holder} className="overflow-hidden rounded-lg border border-line">
          <iframe ref={frame} title={t.preview} className="block h-[480px] w-full bg-[#f4f1fa]" sandbox="allow-same-origin allow-modals" />
        </div>
      </Panel>
    </div>
  );
}
