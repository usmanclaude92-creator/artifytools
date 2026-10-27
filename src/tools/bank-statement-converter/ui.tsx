"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileDropZone } from "@/components/files";
import { Panel, Stat } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Field, Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/components/ui/cx";
import { useLocale } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { localizeHref } from "@/lib/i18n";
import { baseName, safeFileName } from "@/lib/files/names";
import { formatBytes } from "@/lib/files/size";
import { PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { openPdf, renderRegion, type RenderedDoc } from "@/lib/pdf/render";
import { createOcr, type OcrEngine } from "@/lib/ocr/ocr";
import { wordsToItems } from "@/lib/statement/ocr-items";
import type { TextItem } from "@/lib/pdf/text-layout";
import { readPageText } from "@/lib/pdf/to-word";
import { ManualSelect, type ManualInput, type ManualStrings, type PageData } from "./manual";
import { parseStatement, type DateOrder, type Role, type Statement } from "@/lib/statement/parse";
import { statementToCsv, statementToXlsx, type ExportLabels } from "@/lib/statement/export";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
type OrderChoice = DateOrder | "auto";
const PREVIEW_ROWS = 100;

const strings = {
  en: {
    choose: "Choose a bank statement (PDF)", types: "PDF", another: "Choose another file",
    pages: (n: number) => `${n} page${n === 1 ? "" : "s"}`, reading: (d: number, n: number) => `Reading page ${d} of ${n}…`,
    modeTitle: "How should the statement be read?", auto: "Automatic Conversion", autoHint: "Reads the statement for you. Scanned pages are read with OCR.",
    manual: "Manual Selection", manualHint: "Mark the tables on the pages yourself, then convert only those.",
    ocrLoading: "Preparing OCR…", ocrPage: (d: number, n: number) => `Reading scanned page ${d} of ${n} with OCR…`, ocrFailed: "OCR couldn't read the scanned pages. Try Manual Selection.", ocrUsed: (pages: number[]) => `Page${pages.length === 1 ? "" : "s"} ${pages.join(", ")} ${pages.length === 1 ? "was a scan and was" : "were scans and were"} read with OCR. Check the amounts against the PDF.`,
    manualStrings: {
      help: "Drag on a page to mark a table. Add column lines and choose what each column holds, then press Convert. Only what is inside your tables is converted.",
      drawOn: "Drawing tables", drawOff: "Scrolling (tap to draw)", table: (n: number, p: number) => `Table ${n} · page ${p}`, detect: "Detect columns", addColumn: "Add column line", removeTable: "Remove table",
      column: (n: number) => `Column ${n}`, roles: { date: "Date", description: "Description", debit: "Debit", credit: "Credit", amount: "Amount", balance: "Balance", other: "Ignore" } as Record<Role, string>,
      convert: "Convert selected tables", converting: "Converting…", noTables: "Mark at least one table first.", scanned: "Scanned page: read with OCR", detectFailed: "No column headings were found in this table. Add column lines by hand.", detected: "Columns detected.",
      ocrLoading: "Preparing OCR…", ocrReading: (d: number, n: number) => `Reading table ${d} of ${n} with OCR…`, failed: "Converting the tables failed. Try marking them again.", page: (n: number) => `Page ${n}`,
      removeLine: (n: number) => `Remove column line ${n}`, moveLine: (n: number) => `Move column line ${n}`,
    } satisfies ManualStrings,
    result: "Transactions", dateOrder: "Date format", orders: { auto: "Detect automatically", dmy: "Day first (31/12/2026)", mdy: "Month first (12/31/2026)" } as Record<OrderChoice, string>,
    found: "Transactions", moneyIn: "Money in (credits)", moneyOut: "Money out (debits)", check: "Balance check",
    allMatch: (n: number) => `All ${n} balances match`, someWrong: (n: number) => `${n} row${n === 1 ? "" : "s"} don't match`, notChecked: "No running balance to check",
    opening: "Opening balance", closing: "Closing balance",
    newestFirst: "This statement lists the newest transactions first. They are kept in that order, and the balance check runs from the bottom up.",
    noHeader: "No column headings were found, so the columns were worked out from the layout. Check the debit and credit columns before you rely on them.",
    mismatchHelp: "Highlighted rows don't follow from the balance above them. A transaction may be missing or split across lines; compare them with the PDF.",
    empty: (pages: number[]) => `Page${pages.length === 1 ? "" : "s"} ${pages.join(", ")} had no text (probably scanned) and ${pages.length === 1 ? "was" : "were"} skipped.`,
    noText: "This PDF has no selectable text and OCR found no readable text either, so there are no transactions to read.", ocr: "Try Manual Selection, or Image to Text (OCR) for poor scans.",
    none: "No transactions were found. This tool reads statements laid out as a table with dates and amounts; for other PDFs, try PDF to Excel.", pdfToExcel: "Open PDF to Excel",
    preview: (shown: number, all: number) => (shown < all ? `First ${shown} of ${all} transactions` : `${all} transactions`),
    downloadXlsx: "Download Excel", downloadCsv: "Download CSV",
    errors: { encrypted: "This statement is password-protected. Unlock it first with Unlock PDF, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    failed: "Reading the statement failed. The file may be damaged.",
    export: {
      sheet: "Transactions", summarySheet: "Summary", date: "Date", description: "Description", debit: "Debit", credit: "Credit", balance: "Balance", check: "Balance check",
      ok: "✓", mismatch: (e: string) => `✗ expected ${e}`, unchecked: "", total: "Total",
    },
    sumLabels: { transactions: "Transactions", opening: "Opening balance", closing: "Closing balance", debits: "Total debits", credits: "Total credits", mismatches: "Rows that don't match" },
  },
  ar: {
    choose: "اختر كشف الحساب البنكي (PDF)", types: "PDF", another: "اختيار ملف آخر",
    pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"), reading: (d: number, n: number) => `جارٍ قراءة الصفحة ${d} من ${n}…`,
    modeTitle: "كيف يُقرأ كشف الحساب؟", auto: "تحويل تلقائي", autoHint: "يقرأ الكشف عنك، وتُقرأ الصفحات الممسوحة بتقنية OCR.",
    manual: "تحديد يدوي", manualHint: "حدّد الجداول على الصفحات بنفسك ثم حوّلها وحدها.",
    ocrLoading: "جارٍ تجهيز OCR…", ocrPage: (d: number, n: number) => `جارٍ قراءة الصفحة الممسوحة ${d} من ${n} بتقنية OCR…`, ocrFailed: "تعذّرت قراءة الصفحات الممسوحة بتقنية OCR. جرّب التحديد اليدوي.", ocrUsed: (pages: number[]) => `${pages.length === 1 ? "الصفحة" : "الصفحات"} ${pages.join("، ")} ${pages.length === 1 ? "كانت ممسوحة وقُرئت" : "كانت ممسوحة وقُرئت"} بتقنية OCR. قارن المبالغ بملف PDF.`,
    manualStrings: {
      help: "اسحب على الصفحة لتحديد جدول. أضف خطوط الأعمدة واختر محتوى كل عمود ثم اضغط تحويل. يُحوَّل فقط ما داخل جداولك.",
      drawOn: "رسم الجداول", drawOff: "التمرير (اضغط للرسم)", table: (n: number, p: number) => `الجدول ${n} · الصفحة ${p}`, detect: "اكتشاف الأعمدة", addColumn: "إضافة خط عمود", removeTable: "حذف الجدول",
      column: (n: number) => `العمود ${n}`, roles: { date: "التاريخ", description: "البيان", debit: "مدين", credit: "دائن", amount: "المبلغ", balance: "الرصيد", other: "تجاهل" } as Record<Role, string>,
      convert: "تحويل الجداول المحددة", converting: "جارٍ التحويل…", noTables: "حدّد جدولًا واحدًا على الأقل أولًا.", scanned: "صفحة ممسوحة: تُقرأ بتقنية OCR", detectFailed: "لم نجد عناوين أعمدة في هذا الجدول. أضف خطوط الأعمدة يدويًا.", detected: "تم اكتشاف الأعمدة.",
      ocrLoading: "جارٍ تجهيز OCR…", ocrReading: (d: number, n: number) => `جارٍ قراءة الجدول ${d} من ${n} بتقنية OCR…`, failed: "فشل تحويل الجداول. حاول تحديدها مجددًا.", page: (n: number) => `الصفحة ${n}`,
      removeLine: (n: number) => `حذف خط العمود ${n}`, moveLine: (n: number) => `تحريك خط العمود ${n}`,
    } satisfies ManualStrings,
    result: "العمليات", dateOrder: "صيغة التاريخ", orders: { auto: "اكتشاف تلقائي", dmy: "اليوم أولًا (31/12/2026)", mdy: "الشهر أولًا (12/31/2026)" } as Record<OrderChoice, string>,
    found: "العمليات", moneyIn: "الإيداعات (دائن)", moneyOut: "المسحوبات (مدين)", check: "مطابقة الرصيد",
    allMatch: (n: number) => `كل الأرصدة مطابقة (${n})`, someWrong: (n: number) => `${arCount(n, "صف واحد", "صفان", "صفوف", "صفًا", "صف")} غير مطابق`, notChecked: "لا يوجد رصيد جارٍ للمطابقة",
    opening: "الرصيد الافتتاحي", closing: "الرصيد الختامي",
    newestFirst: "يعرض هذا الكشف أحدث العمليات أولًا. احتفظنا بالترتيب نفسه، وتجري مطابقة الرصيد من الأسفل إلى الأعلى.",
    noHeader: "لم نجد عناوين للأعمدة، لذا استنتجنا الأعمدة من تنسيق الصفحة. راجع عمودي المدين والدائن قبل الاعتماد عليهما.",
    mismatchHelp: "الصفوف المظللة لا يتطابق رصيدها مع الرصيد السابق. قد تكون عملية ناقصة أو مقسّمة على عدة أسطر؛ قارنها بملف PDF.",
    empty: (pages: number[]) => `لا يوجد نص في ${pages.length === 1 ? "الصفحة" : "الصفحات"} ${pages.join("، ")} (غالبًا ممسوحة ضوئيًا)، لذا تم تخطيها.`,
    noText: "لا يحتوي ملف PDF هذا على نص قابل للتحديد ولم تجد تقنية OCR نصًا مقروءًا أيضًا، لذا لا توجد عمليات لقراءتها.", ocr: "جرّب التحديد اليدوي، أو أداة تحويل الصورة إلى نص (OCR) للمسوحات الضعيفة.",
    none: "لم نعثر على عمليات. تقرأ هذه الأداة الكشوف المنسقة كجدول فيه تواريخ ومبالغ؛ وللملفات الأخرى جرّب تحويل PDF إلى Excel.", pdfToExcel: "افتح تحويل PDF إلى Excel",
    preview: (shown: number, all: number) => (shown < all ? `أول ${shown} من ${all} عملية` : arCount(all, "عملية واحدة", "عمليتان", "عمليات", "عملية")),
    downloadXlsx: "تنزيل Excel", downloadCsv: "تنزيل CSV",
    errors: { encrypted: "كشف الحساب هذا محمي بكلمة مرور. فك حمايته أولًا بأداة فك حماية PDF ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    failed: "فشلت قراءة كشف الحساب. قد يكون الملف تالفًا.",
    export: {
      sheet: "العمليات", summarySheet: "الملخص", date: "التاريخ", description: "البيان", debit: "مدين", credit: "دائن", balance: "الرصيد", check: "مطابقة الرصيد",
      ok: "✓", mismatch: (e: string) => `✗ المتوقع ${e}`, unchecked: "", total: "الإجمالي",
    },
    sumLabels: { transactions: "عدد العمليات", opening: "الرصيد الافتتاحي", closing: "الرصيد الختامي", debits: "إجمالي المدين", credits: "إجمالي الدائن", mismatches: "صفوف غير مطابقة" },
  },
};

export default function BankStatementConverter() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pages, setPages] = useState<PageData[] | null>(null);
  const [doc, setDoc] = useState<RenderedDoc | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderChoice>("auto");
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [ocrItems, setOcrItems] = useState<Record<number, TextItem[]>>({});
  const [ocrBusy, setOcrBusy] = useState<string | null>(null);
  const [manual, setManual] = useState<ManualInput | null>(null);
  const generation = useRef(0);
  const ocrStarted = useRef(-1);

  const release = () => {
    generation.current++;
    ocrStarted.current = -1;
    setDoc((d) => { void d?.destroy(); return null; });
  };
  useEffect(() => () => { generation.current++; }, []);

  async function open(f: File) {
    release();
    const id = generation.current;
    setFile(f);
    setPages(null);
    setError(null);
    setOrder("auto");
    setOcrItems({});
    setOcrBusy(null);
    setManual(null);
    try {
      const d = await openPdf(new Uint8Array(await f.arrayBuffer()));
      if (generation.current !== id) { void d.destroy(); return; }
      setPageCount(d.numPages);
      const out: PageData[] = [];
      for (let p = 1; p <= d.numPages; p++) {
        setProgress({ done: p, total: d.numPages });
        const r = await readPageText(d, p);
        out.push({ width: r.width, height: r.height, items: r.items });
      }
      if (generation.current !== id) { void d.destroy(); return; }
      setDoc(d);
      setPages(out);
    } catch (e) {
      setError(e instanceof PdfError ? t.errors[e.code] : t.failed);
    } finally {
      setProgress(null);
    }
  }

  // Automatic mode reads scanned pages (no text layer) with OCR, once per file.
  useEffect(() => {
    if (mode !== "auto" || !doc || !pages || ocrStarted.current === generation.current) return;
    const empty = pages.map((p, i) => (p.items.length ? -1 : i)).filter((i) => i >= 0);
    if (empty.length === 0) return;
    // A statement that already has its transactions as text may end with a picture-only page of terms and
    // conditions. OCR is for statements that are scans, not for those extra pages.
    if (empty.length < pages.length && parseStatement(pages.map((p) => p.items)).transactions.length > 0) return;
    const id = generation.current;
    ocrStarted.current = id;
    let engine: OcrEngine | null = null;
    void (async () => {
      try {
        setOcrBusy(t.ocrLoading);
        engine = await createOcr(["eng", "ara"], () => undefined);
        for (let k = 0; k < empty.length; k++) {
          if (generation.current !== id) return;
          const i = empty[k]!;
          setOcrBusy(t.ocrPage(k + 1, empty.length));
          const pg = pages[i]!;
          const { blob, pxPerPt } = await renderRegion(doc, i + 1, { x: 0, y: 0, w: pg.width, h: pg.height }, 220);
          const items = wordsToItems(await engine.recognizeWords(blob), pxPerPt);
          if (generation.current !== id) return;
          setOcrItems((o) => ({ ...o, [i]: items }));
        }
      } catch {
        if (generation.current === id) setError(t.ocrFailed);
      } finally {
        void engine?.terminate();
        if (generation.current === id) setOcrBusy(null);
      }
    })();
  }, [mode, doc, pages, t]);

  const autoPages = useMemo(() => (pages ? pages.map((p, i) => (p.items.length ? p.items : ocrItems[i] ?? [])) : null), [pages, ocrItems]);
  const autoStatement = useMemo(() => (autoPages ? parseStatement(autoPages, { dateOrder: order }) : null), [autoPages, order]);
  const manualStatement = useMemo(() => (manual ? parseStatement(manual.pages, { dateOrder: order, columns: manual.columns }) : null), [manual, order]);
  const statement = mode === "auto" ? autoStatement : manualStatement;
  const ocrUsed = pages ? pages.flatMap((p, i) => (!p.items.length && (ocrItems[i]?.length ?? 0) > 0 ? [i + 1] : [])) : [];
  const name = safeFileName(baseName(file?.name ?? "statement"), "statement");
  const money = (n: number | null, s: Statement) => (n === null ? "" : n.toLocaleString("en-US", { minimumFractionDigits: s.decimals, maximumFractionDigits: s.decimals }));

  const exportLabels = (s: Statement): ExportLabels => ({
    ...t.export,
    summary: [
      { label: t.sumLabels.transactions, value: () => s.transactions.length },
      { label: t.sumLabels.opening, value: () => s.opening },
      { label: t.sumLabels.closing, value: () => s.closing ?? s.transactions[s.newestFirst ? 0 : s.transactions.length - 1]?.balance ?? null },
      { label: t.sumLabels.debits, value: () => s.totalDebit },
      { label: t.sumLabels.credits, value: () => s.totalCredit },
      { label: t.sumLabels.mismatches, value: () => s.mismatches },
    ],
  });

  if (!file) {
    return (
      <Panel title={t.choose}>
        <FileDropZone rules={rules} onFiles={(fs) => fs[0] && open(fs[0])} typesLabel={t.types} />
      </Panel>
    );
  }

  const ocrLink = <Link href={localizeHref("/tools/image-to-text", locale)} className="font-semibold underline">{t.ocr}</Link>;
  const allEmpty = mode === "auto" && !ocrBusy && statement && pages && statement.emptyPages.length === pages.length;
  const s = statement;
  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.choose}>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-surface-2 text-muted"><Icon name="file-text" size={22} /></span>
          <div className="min-w-0 flex-1 basis-40">
            <p className="truncate font-medium" title={file.name}><bdi>{file.name}</bdi></p>
            <p className="text-sm text-muted">
              {formatBytes(file.size, locale)}
              {pageCount > 0 && ` · ${t.pages(pageCount)}`}
              {progress && <span role="status"> · {t.reading(progress.done, progress.total)}</span>}
              {ocrBusy && mode === "auto" && <span role="status"> · {ocrBusy}</span>}
            </p>
          </div>
          <Button variant="secondary" size="sm" disabled={progress !== null} onClick={() => { release(); setFile(null); setPages(null); setError(null); setPageCount(0); setManual(null); setOcrItems({}); setOcrBusy(null); }}>
            <Icon name="rotate-ccw" size={16} /> {t.another}
          </Button>
        </div>
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
      </Panel>

      {pages && (
        <Panel title={t.modeTitle}>
          <div role="radiogroup" aria-label={t.modeTitle} className="grid gap-3 sm:grid-cols-2">
            {([["auto", t.auto, t.autoHint], ["manual", t.manual, t.manualHint]] as const).map(([value, label, hint]) => (
              <label
                key={value}
                className={cx("flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors", mode === value ? "border-accent bg-accent-soft" : "border-line hover:border-accent/60")}
              >
                <input type="radio" name="statement-mode" value={value} checked={mode === value} onChange={() => setMode(value)} className="mt-1 size-4 accent-[var(--accent)]" />
                <span>
                  <span className="block font-semibold">{label}</span>
                  <span className="mt-0.5 block text-sm text-muted">{hint}</span>
                </span>
              </label>
            ))}
          </div>
          {mode === "manual" && doc && <ManualSelect key={file?.name} doc={doc} pages={pages} t={t.manualStrings} onRead={setManual} />}
        </Panel>
      )}

      {s && (
        <Panel
          title={t.result}
          actions={s.transactions.length > 0 ? (
            <>
              <DownloadButton filename={`${name}.xlsx`} getBlob={() => statementToXlsx(s, exportLabels(s))} label={t.downloadXlsx} variant="primary" size="md" />
              <DownloadButton filename={`${name}.csv`} getBlob={() => statementToCsv(s, t.export)} label={t.downloadCsv} size="md" />
            </>
          ) : undefined}
        >
          {allEmpty ? (
            <StatusMessage tone="warning">{t.noText} {ocrLink}</StatusMessage>
          ) : s.transactions.length === 0 ? (
            <StatusMessage tone="warning">
              {t.none} <Link href={localizeHref("/tools/pdf-to-excel", locale)} className="font-semibold underline">{t.pdfToExcel}</Link>
            </StatusMessage>
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label={t.found} value={s.transactions.length.toLocaleString("en-US")} />
                <Stat label={t.moneyIn} value={money(s.totalCredit, s)} />
                <Stat label={t.moneyOut} value={money(s.totalDebit, s)} />
                <div className={cx("rounded-md px-4 py-3", s.mismatches ? "bg-warning-soft" : s.checked ? "bg-success-soft" : "bg-surface-2")}>
                  <dt className="text-sm text-muted">{t.check}</dt>
                  <dd className={cx("mt-0.5 flex items-center gap-1.5 text-lg font-semibold", s.mismatches ? "text-warning" : s.checked ? "text-success" : "")}>
                    <Icon name={s.mismatches ? "triangle-alert" : s.checked ? "circle-check" : "info"} size={18} />
                    {s.mismatches ? t.someWrong(s.mismatches) : s.checked ? t.allMatch(s.checked) : t.notChecked}
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <Field label={t.dateOrder} className="w-full max-w-xs">
                  {(p) => (
                    <Select {...p} value={order} onChange={(e) => setOrder(e.target.value as OrderChoice)}>
                      {(["auto", "dmy", "mdy"] as OrderChoice[]).map((o) => <option key={o} value={o}>{t.orders[o]}</option>)}
                    </Select>
                  )}
                </Field>
                <p className="text-sm text-muted tabular-nums">
                  {s.opening !== null && <>{t.opening}: <strong className="text-fg">{money(s.opening, s)}</strong></>}
                  {s.opening !== null && s.closing !== null && " · "}
                  {s.closing !== null && <>{t.closing}: <strong className="text-fg">{money(s.closing, s)}</strong></>}
                </p>
              </div>
              {s.mismatches > 0 && <StatusMessage tone="warning">{t.mismatchHelp}</StatusMessage>}
              {s.newestFirst && s.checked > 0 && <StatusMessage tone="info">{t.newestFirst}</StatusMessage>}
              {!s.headerFound && <StatusMessage tone="info">{t.noHeader}</StatusMessage>}
              {mode === "auto" && ocrUsed.length > 0 && <StatusMessage tone="info">{t.ocrUsed(ocrUsed)}</StatusMessage>}
              {mode === "auto" && !ocrBusy && s.emptyPages.length > 0 && <StatusMessage tone="info">{t.empty(s.emptyPages)} {ocrLink}</StatusMessage>}

              <div className="relative overflow-x-auto rounded-lg border border-line" dir={s.rtl ? "rtl" : undefined}>
                <table className="w-full min-w-[640px] text-sm">
                  <caption className="sr-only">{t.preview(Math.min(PREVIEW_ROWS, s.transactions.length), s.transactions.length)}</caption>
                  <thead className="bg-surface-2 text-muted">
                    <tr>
                      {[t.export.date, t.export.description, t.export.debit, t.export.credit, t.export.balance].map((h, i) => (
                        <th key={h} scope="col" className={cx("px-3 py-2 font-medium", i >= 2 ? "text-end" : "text-start")}>{h}</th>
                      ))}
                      <th scope="col" className="w-10 px-2 py-2"><span className="sr-only">{t.check}</span></th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {s.transactions.slice(0, PREVIEW_ROWS).map((tx, i) => (
                      <tr key={i} className={cx("border-t border-line align-top", tx.check === "mismatch" && "bg-warning-soft")}>
                        <td className="whitespace-nowrap px-3 py-2">{tx.date ?? tx.dateText}</td>
                        <td className="px-3 py-2" dir="auto">{tx.description}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-end">{money(tx.debit, s)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-end">{money(tx.credit, s)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-end">{money(tx.balance, s)}</td>
                        <td className="px-2 py-2 text-center">
                          {tx.check === "ok" && <Icon name="check" size={15} className="text-success" />}
                          {tx.check === "mismatch" && (
                            <span title={t.export.mismatch(tx.expected!.toFixed(s.decimals))}>
                              <Icon name="triangle-alert" size={15} className="text-warning" />
                              <span className="sr-only">{t.export.mismatch(tx.expected!.toFixed(s.decimals))}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted">{t.preview(Math.min(PREVIEW_ROWS, s.transactions.length), s.transactions.length)}</p>
            </>
          )}
        </Panel>
      )}
    </div>
  );
}
