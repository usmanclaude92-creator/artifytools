"use client";

import { useEffect, useRef, useState } from "react";
import { FileDropZone } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton, DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Checkbox, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { baseName, safeFileName } from "@/lib/files/names";
import { formatBytes } from "@/lib/files/size";
import { paragraphsToDocx } from "@/lib/ocr/docx";
import { createOcr, type OcrEngine, type OcrLang } from "@/lib/ocr/ocr";
import { joinPages, toParagraphs } from "@/lib/ocr/text";
import { mergePdfs, PdfError } from "@/lib/pdf/pdf";
import { openPdf, renderPage } from "@/lib/pdf/render";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
const isPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);

const strings = {
  en: {
    langs: "Language of the text", eng: "English", ara: "Arabic", langHint: "Choose every language that appears. Each extra language makes reading a little slower.", langError: "Choose at least one language.",
    add: "Add images or a PDF", types: "JPG, PNG, WebP or PDF",
    searchable: "Also make a searchable PDF (the original pages with selectable text)",
    run: "Extract text", loading: "Loading the reading engine (first time only, a few MB)…", reading: (p: number, n: number, pct: number) => `Reading page ${p} of ${n} · ${pct}%`,
    result: "Extracted text", pageLabel: (n: number) => `— Page ${n} —`,
    stats: (pages: number, conf: number) => `${pages} page${pages === 1 ? "" : "s"} · estimated accuracy ${conf}%`,
    lowConf: "Accuracy looks low. Use a sharper, straight, well-lit image, and check the selected languages.",
    empty: "No text was found. Check the selected language and that the image isn't blurry or too small.",
    copy: "Copy text", txt: "Download .txt", word: "Download Word", pdf: "Download searchable PDF",
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then add it again.", invalid: "This file couldn't be read.", failed: "Reading failed. Try a smaller image or fewer pages." },
    stale: "Settings changed. Extract again to update the result.", remove: (n: string) => `Remove ${n}`,
  },
  ar: {
    langs: "لغة النص", eng: "الإنجليزية", ara: "العربية", langHint: "اختر كل لغة تظهر في النص. كل لغة إضافية تجعل القراءة أبطأ قليلًا.", langError: "اختر لغة واحدة على الأقل.",
    add: "أضف صورًا أو ملف PDF", types: "JPG أو PNG أو WebP أو PDF",
    searchable: "إنشاء ملف PDF قابل للبحث أيضًا (الصفحات الأصلية مع نص قابل للتحديد)",
    run: "استخراج النص", loading: "جارٍ تحميل محرك القراءة (أول مرة فقط، بضعة ميغابايت)…", reading: (p: number, n: number, pct: number) => `جارٍ قراءة الصفحة ${p} من ${n} · ${pct}%`,
    result: "النص المستخرج", pageLabel: (n: number) => `— الصفحة ${n} —`,
    stats: (pages: number, conf: number) => `${arCount(pages, "صفحة واحدة", "صفحتان", "صفحات", "صفحة")} · الدقة التقديرية ${conf}%`,
    lowConf: "تبدو الدقة منخفضة. استخدم صورة أوضح ومستقيمة وجيدة الإضاءة، وتحقق من اللغات المختارة.",
    empty: "لم يُعثر على نص. تحقق من اللغة المختارة ومن أن الصورة ليست ضبابية أو صغيرة جدًا.",
    copy: "نسخ النص", txt: "تنزيل .txt", word: "تنزيل Word", pdf: "تنزيل PDF قابل للبحث",
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم أضفه مجددًا.", invalid: "تعذّرت قراءة هذا الملف.", failed: "فشلت القراءة. جرّب صورة أصغر أو صفحات أقل." },
    stale: "تغيّرت الإعدادات. استخرج النص مجددًا لتحديث النتيجة.", remove: (n: string) => `إزالة ${n}`,
  },
};

interface Result {
  key: string;
  pages: string[];
  confidence: number;
  pdf: Blob | null;
}

/** Draws an image upright (phone photos) and returns it as PNG for the OCR engine. */
async function uprightImage(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const c = document.createElement("canvas");
  c.width = bmp.width;
  c.height = bmp.height;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.92));
}

export default function ImageToText() {
  const locale = useLocale();
  const t = strings[locale];
  const [langs, setLangs] = useState<OcrLang[]>(locale === "ar" ? ["ara", "eng"] : ["eng"]);
  const [files, setFiles] = useState<File[]>([]);
  const [searchable, setSearchable] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const engine = useRef<{ key: string; ocr: OcrEngine } | null>(null);

  useEffect(() => () => void engine.current?.ocr.terminate(), []);

  const key = `${files.map((f) => `${f.name}:${f.size}`).join("|")}#${[...langs].sort().join("+")}#${searchable}`;
  const current = result && result.key === key ? result : null;
  const stem = files.length === 1 ? safeFileName(baseName(files[0]!.name), "text") : "extracted-text";

  function toggle(l: OcrLang, on: boolean) {
    setLangs((ls) => (on ? [...new Set([...ls, l])] : ls.filter((x) => x !== l)));
  }

  async function run() {
    if (!files.length || !langs.length) return;
    setError(null);
    setStatus(t.loading);
    try {
      const langKey = [...langs].sort().join("+");
      if (engine.current?.key !== langKey) {
        await engine.current?.ocr.terminate();
        engine.current = null;
      }
      let page = 0, total = 0;
      const progress = (stage: "loading" | "reading", f: number) => setStatus(stage === "loading" ? t.loading : t.reading(page, total, Math.round(f * 100)));
      engine.current ??= { key: langKey, ocr: await createOcr(langs, (s, f) => progress(s, f)) };
      const ocr = engine.current.ocr;

      // Expand PDFs into page images, keeping the order files were added in.
      const jobs: (() => Promise<Blob>)[] = [];
      for (const f of files) {
        if (isPdf(f)) {
          let doc;
          try {
            doc = await openPdf(new Uint8Array(await f.arrayBuffer()));
          } catch (e) {
            throw new Error(e instanceof PdfError && e.code === "encrypted" ? t.errors.encrypted : t.errors.invalid);
          }
          for (let p = 1; p <= doc.numPages; p++) jobs.push(async () => (await renderPage(doc, p, { dpi: 300, format: "jpg", quality: 0.9 })).blob);
        } else jobs.push(() => uprightImage(f));
      }
      total = jobs.length;
      const texts: string[] = [];
      const pdfs: Uint8Array[] = [];
      let conf = 0;
      for (const [i, job] of jobs.entries()) {
        page = i + 1;
        setStatus(t.reading(page, total, 0));
        const r = await ocr.recognize(await job(), { pdf: searchable });
        texts.push(r.text);
        conf += r.confidence;
        if (r.pdf) pdfs.push(r.pdf);
      }
      const pdf = searchable && pdfs.length ? new Blob([(await mergePdfs(pdfs)).buffer as ArrayBuffer], { type: "application/pdf" }) : null;
      setResult({ key, pages: texts, confidence: Math.round(conf / Math.max(1, total)), pdf });
    } catch (e) {
      setError(e instanceof Error && Object.values(t.errors).includes(e.message) ? e.message : t.errors.failed);
    } finally {
      setStatus(null);
    }
  }

  const text = current ? joinPages(current.pages, t.pageLabel) : "";
  const busy = status !== null;

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.langs}>
        <div className="flex flex-wrap gap-x-6">
          <Checkbox label={t.ara} checked={langs.includes("ara")} onChange={(e) => toggle("ara", e.target.checked)} disabled={busy} />
          <Checkbox label={t.eng} checked={langs.includes("eng")} onChange={(e) => toggle("eng", e.target.checked)} disabled={busy} />
        </div>
        {langs.length ? <p className="text-sm text-muted">{t.langHint}</p> : <StatusMessage tone="error">{t.langError}</StatusMessage>}
      </Panel>

      <Panel title={t.add}>
        <FileDropZone rules={rules} onFiles={(fs) => setFiles((cur) => [...cur, ...fs].slice(0, rules.maxFiles ?? 20))} existing={files} typesLabel={t.types} />
        {files.length > 0 && (
          <ul className="flex flex-col gap-2">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-lg border border-line p-3">
                <Icon name={isPdf(f) ? "file-text" : "image"} size={20} className="shrink-0 text-muted" />
                <p className="min-w-0 flex-1 truncate font-medium" title={f.name}><bdi>{f.name}</bdi></p>
                <span className="text-sm text-muted">{formatBytes(f.size, locale)}</span>
                <Button variant="ghost" size="sm" aria-label={t.remove(f.name)} disabled={busy} onClick={() => setFiles((cur) => cur.filter((_, k) => k !== i))}>
                  <Icon name="x" size={16} />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <Checkbox label={t.searchable} checked={searchable} onChange={(e) => setSearchable(e.target.checked)} disabled={busy} />
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <Button size="lg" onClick={run} disabled={!files.length || !langs.length || busy}>
            <Icon name={busy ? "loader" : "type"} size={18} className={busy ? "animate-spin" : undefined} /> {t.run}
          </Button>
          {status && <span role="status" className="text-sm text-muted">{status}</span>}
        </div>
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
      </Panel>

      {result && (
        <Panel title={t.result}>
          {!current ? (
            <p className="text-sm text-muted">{t.stale}</p>
          ) : !text.replace(/—.*—/g, "").trim() ? (
            <StatusMessage tone="warning">{t.empty}</StatusMessage>
          ) : (
            <>
              <p className="text-sm text-muted">{t.stats(current.pages.length, current.confidence)}</p>
              {current.confidence < 70 && <StatusMessage tone="warning">{t.lowConf}</StatusMessage>}
              <TextArea aria-label={t.result} readOnly value={text} rows={14} className="!font-sans" />
              <div className="flex flex-wrap gap-2">
                <CopyButton value={text} label={t.copy} size="md" />
                <DownloadButton filename={`${stem}.txt`} getBlob={() => new Blob([text], { type: "text/plain;charset=utf-8" })} label={t.txt} size="md" />
                <DownloadButton filename={`${stem}.docx`} getBlob={() => paragraphsToDocx(current.pages.map(toParagraphs))} label={t.word} size="md" />
                {current.pdf && <DownloadButton filename={`${stem}-searchable.pdf`} getBlob={() => current.pdf!} label={t.pdf} size="md" />}
              </div>
            </>
          )}
        </Panel>
      )}
    </div>
  );
}
