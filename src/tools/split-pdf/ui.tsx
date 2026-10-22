"use client";

import { useMemo, useState } from "react";
import { DownloadAllButton, FileDropZone } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Field, Segmented, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { baseName, safeFileName } from "@/lib/files/names";
import { formatBytes } from "@/lib/files/size";
import { inspectPdf, PdfError, splitPdf, type LoadedPdf, type PdfErrorCode } from "@/lib/pdf/pdf";
import { chunkPages, describeGroup, parseRanges, type RangeError } from "@/lib/pdf/ranges";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
type Mode = "ranges" | "every" | "chunk";

const strings = {
  en: {
    choose: "Choose a PDF", types: "PDF", reading: "Reading your PDF…", another: "Choose another file",
    pages: (n: number) => `${n} page${n === 1 ? "" : "s"}`,
    how: "How to split", modes: { ranges: "Custom ranges", every: "Every page", chunk: "Every few pages" } as Record<Mode, string>,
    ranges: "Page ranges", rangesHint: "Separate with commas. Each item becomes one file, e.g. 1-3, 5, 8-", chunk: "Pages per file",
    willCreate: (n: number) => `This creates ${n} file${n === 1 ? "" : "s"}.`, more: (n: number) => `and ${n} more`,
    split: "Split PDF", splitting: "Splitting…", results: "Your files", pageLabel: (g: string) => (g.includes("-") || g.includes("_") ? `Pages ${g.replace(/_/g, ", ")}` : `Page ${g}`),
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    range: (e: RangeError) =>
      e.code === "empty" ? "Enter at least one page or range." : e.code === "syntax" ? `“${e.token}” isn't a page or range. Use numbers like 3 or 2-5.` : e.code === "reversed" ? `“${e.token}” runs backwards. Write the smaller page first.` : `This PDF has ${e.pageCount} pages, so page ${e.page} doesn't exist.`,
    chunkError: (max: number) => `Enter a whole number from 1 to ${max}.`, failed: "Splitting failed. The file may be damaged.", stale: "Settings changed. Split again to update the files.",
  },
  ar: {
    choose: "اختر ملف PDF", types: "PDF", reading: "جارٍ قراءة ملف PDF…", another: "اختيار ملف آخر",
    pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"),
    how: "طريقة التقسيم", modes: { ranges: "نطاقات مخصصة", every: "كل صفحة", chunk: "كل بضع صفحات" } as Record<Mode, string>,
    ranges: "نطاقات الصفحات", rangesHint: "افصل بفواصل. يصبح كل عنصر ملفًا واحدًا، مثل: \u20661-3, 5, 8-\u2069", chunk: "عدد الصفحات في كل ملف",
    willCreate: (n: number) => `سيُنشئ هذا ${arCount(n, "ملفًا واحدًا", "ملفين", "ملفات", "ملفًا", "ملف")}.`, more: (n: number) => `و${n} غيرها`,
    split: "تقسيم الملف", splitting: "جارٍ التقسيم…", results: "ملفاتك", pageLabel: (g: string) => (g.includes("-") || g.includes("_") ? `الصفحات ${g.replace(/_/g, "، ")}` : `الصفحة ${g}`),
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    range: (e: RangeError) =>
      e.code === "empty" ? "أدخل صفحة أو نطاقًا واحدًا على الأقل." : e.code === "syntax" ? `«${e.token}» ليس صفحة أو نطاقًا. استخدم أرقامًا مثل 3 أو 2-5.` : e.code === "reversed" ? `النطاق «${e.token}» معكوس. اكتب الصفحة الأصغر أولًا.` : `يحتوي هذا الملف على ${arCount(e.pageCount, "صفحة واحدة", "صفحتين", "صفحات", "صفحة")}، لذا لا توجد الصفحة ${e.page}.`,
    chunkError: (max: number) => `أدخل عددًا صحيحًا من 1 إلى ${max}.`, failed: "فشل التقسيم. قد يكون الملف تالفًا.", stale: "تغيّرت الإعدادات. قسّم مجددًا لتحديث الملفات.",
  },
};

interface Part {
  name: string;
  label: string;
  pages: number;
  blob: Blob;
}

export default function SplitPdf() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("ranges");
  const [ranges, setRanges] = useState("");
  const [chunkText, setChunkText] = useState("2");
  const [parts, setParts] = useState<{ key: string; list: Part[] } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  async function open(f: File) {
    setFile(f);
    setPdf(null);
    setParts(null);
    setLoadError(null);
    try {
      setPdf(await inspectPdf(new Uint8Array(await f.arrayBuffer())));
    } catch (e) {
      setLoadError(e instanceof PdfError ? t.errors[e.code] : t.errors.invalid);
    }
  }

  const pageCount = pdf?.pageCount ?? 0;
  const chunk = Number(chunkText);
  const chunkValid = Number.isInteger(chunk) && chunk >= 1 && chunk <= Math.max(1, pageCount);
  const plan = useMemo((): { groups: number[][] } | { error: string } | null => {
    if (!pdf) return null;
    if (mode === "every") return { groups: chunkPages(pdf.pageCount, 1) };
    if (mode === "chunk") return chunkValid ? { groups: chunkPages(pdf.pageCount, chunk) } : { error: t.chunkError(pdf.pageCount) };
    if (!ranges.trim()) return null;
    const r = parseRanges(ranges, pdf.pageCount);
    return r.ok ? { groups: r.groups } : { error: t.range(r.error) };
  }, [pdf, mode, ranges, chunk, chunkValid, t]);

  const groups = plan && "groups" in plan ? plan.groups : null;
  const key = `${file?.name}|${file?.size}|${JSON.stringify(groups)}`;
  const current = parts && parts.key === key ? parts.list : null;
  const stem = file ? safeFileName(baseName(file.name), "document") : "document";

  async function split() {
    if (!pdf || !groups) return;
    setFailed(false);
    setProgress(0);
    try {
      const outputs = await splitPdf(pdf.bytes, groups, setProgress);
      setParts({
        key,
        list: outputs.map((bytes, i) => {
          const g = describeGroup(groups[i]!);
          return { name: `${stem}-${groups[i]!.length === 1 ? "page" : "pages"}-${g}.pdf`, label: t.pageLabel(g), pages: groups[i]!.length, blob: new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }) };
        }),
      });
    } catch {
      setFailed(true);
    } finally {
      setProgress(null);
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
            <p className="text-sm text-muted">{formatBytes(file.size, locale)}{pdf && ` · ${t.pages(pdf.pageCount)}`}{!pdf && !loadError && ` · ${t.reading}`}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { setFile(null); setPdf(null); setParts(null); setLoadError(null); }}>
            <Icon name="rotate-ccw" size={16} /> {t.another}
          </Button>
        </div>
        {loadError && <StatusMessage tone="error">{loadError}</StatusMessage>}
      </Panel>

      {pdf && (
        <Panel title={t.how}>
          <Segmented legend={t.how} value={mode} onChange={setMode} options={(["ranges", "every", "chunk"] as Mode[]).map((v) => ({ value: v, label: t.modes[v] }))} />
          {mode === "ranges" && (
            <Field label={t.ranges} hint={t.rangesHint} error={plan && "error" in plan ? plan.error : null}>
              {(p) => <TextInput {...p} dir="ltr" value={ranges} onChange={(e) => setRanges(e.target.value)} placeholder={`1-3, 5, 8-${pdf.pageCount}`} autoComplete="off" className="max-w-md" />}
            </Field>
          )}
          {mode === "chunk" && (
            <Field label={t.chunk} error={plan && "error" in plan ? plan.error : null}>
              {(p) => <TextInput {...p} inputMode="numeric" value={chunkText} onChange={(e) => setChunkText(e.target.value)} className="max-w-32" />}
            </Field>
          )}
          {groups && (
            <p className="text-sm text-muted">
              {t.willCreate(groups.length)}{" "}
              <span dir="ltr">{groups.slice(0, 6).map((g) => describeGroup(g).replace(/_/g, ",")).join(" · ")}</span>
              {groups.length > 6 && ` ${t.more(groups.length - 6)}`}
            </p>
          )}
          <div className="border-t border-line pt-4">
            <Button size="lg" onClick={split} disabled={!groups || progress !== null}>
              <Icon name={progress !== null ? "loader" : "scissors"} size={18} className={progress !== null ? "animate-spin" : undefined} />
              {progress !== null ? `${t.splitting} ${Math.round(progress * 100)}%` : t.split}
            </Button>
          </div>
        </Panel>
      )}

      {(current || failed || (parts && !current)) && (
        <Panel title={t.results} actions={current && current.length > 1 ? <DownloadAllButton files={current} zipName={`${stem}-split.zip`} /> : undefined}>
          {failed && <StatusMessage tone="error">{t.failed}</StatusMessage>}
          {parts && !current && !failed && <p className="text-sm text-muted">{t.stale}</p>}
          {current && (
            <ul className="flex flex-col gap-2">
              {current.map((part) => (
                <li key={part.name} className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-text"><Icon name="file-text" size={20} /></span>
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate font-medium" title={part.name}><bdi>{part.name}</bdi></p>
                    <p className="text-sm text-muted">{part.label} · {formatBytes(part.blob.size, locale)}</p>
                  </div>
                  <DownloadButton filename={part.name} getBlob={() => part.blob} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
}
