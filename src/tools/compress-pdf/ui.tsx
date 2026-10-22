"use client";

import { useState } from "react";
import { FileDropZone } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Segmented } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { baseName, safeFileName } from "@/lib/files/names";
import { formatBytes, savingsPercent } from "@/lib/files/size";
import { canvasJpegEncoder } from "@/lib/pdf/canvas-encoder";
import { compressPdf, type CompressLevel } from "@/lib/pdf/compress";
import { PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
/** Below this saving the result isn't worth a new file. */
const MEANINGFUL = 3;

const strings = {
  en: {
    choose: "Choose a PDF", types: "PDF", another: "Choose another file",
    level: "Compression level", levels: { light: "Light", balanced: "Balanced", strong: "Strong" } as Record<CompressLevel, string>,
    levelHints: { light: "Best quality, for printing.", balanced: "Good quality, much smaller. Best for email and uploads.", strong: "Smallest file, for strict size limits. Photos look softer." } as Record<CompressLevel, string>,
    compress: "Compress PDF", compressing: "Compressing…", result: "Result", before: "Before", after: "After",
    saved: (p: number) => `${p}% smaller`, images: (done: number, found: number) => (found === 0 ? "No images found inside this PDF." : `${done} of ${found} images re-compressed.`),
    download: "Download compressed PDF",
    noGain: "This PDF is already compact. It's mostly text, or its images are already well compressed, so your original file is the best version.",
    tryStrong: "Try Strong for a smaller file.",
    errors: { encrypted: "This PDF is password-protected. Unlock it first, then choose it again.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    failed: "Compression failed. The file may be damaged.",
  },
  ar: {
    choose: "اختر ملف PDF", types: "PDF", another: "اختيار ملف آخر",
    level: "مستوى الضغط", levels: { light: "خفيف", balanced: "متوازن", strong: "قوي" } as Record<CompressLevel, string>,
    levelHints: { light: "أفضل جودة، للطباعة.", balanced: "جودة جيدة وحجم أصغر بكثير. الأنسب للبريد والرفع على المواقع.", strong: "أصغر حجم، للحدود الصارمة. تبدو الصور أنعم قليلًا." } as Record<CompressLevel, string>,
    compress: "ضغط الملف", compressing: "جارٍ الضغط…", result: "النتيجة", before: "قبل", after: "بعد",
    saved: (p: number) => `أصغر بنسبة ${p}%`, images: (done: number, found: number) => (found === 0 ? "لا توجد صور داخل هذا الملف." : `أُعيد ضغط ${done} من أصل ${found} صورة.`),
    download: "تنزيل الملف المضغوط",
    noGain: "هذا الملف صغير أصلًا؛ إما أن معظمه نص، أو أن صوره مضغوطة جيدًا، لذا فملفك الأصلي هو أفضل نسخة.",
    tryStrong: "جرّب المستوى «قوي» للحصول على ملف أصغر.",
    errors: { encrypted: "هذا الملف محمي بكلمة مرور. فك حمايته أولًا ثم اختره مجددًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    failed: "فشل الضغط. قد يكون الملف تالفًا.",
  },
};

interface Result {
  key: string;
  blob: Blob;
  before: number;
  found: number;
  done: number;
}

export default function CompressPdf() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressLevel>("balanced");
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const key = `${file?.name}|${file?.size}|${level}`;
  const current = result && result.key === key ? result : null;
  const stem = file ? safeFileName(baseName(file.name), "document") : "document";

  async function run() {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      const input = new Uint8Array(await file.arrayBuffer());
      const r = await compressPdf(input, level, canvasJpegEncoder, setProgress);
      setResult({ key, blob: new Blob([r.bytes.buffer as ArrayBuffer], { type: "application/pdf" }), before: file.size, found: r.imagesFound, done: r.imagesCompressed });
    } catch (e) {
      setError(e instanceof PdfError ? t.errors[e.code] : t.failed);
    } finally {
      setProgress(null);
    }
  }

  if (!file) {
    return (
      <Panel title={t.choose}>
        <FileDropZone rules={rules} onFiles={(fs) => { if (fs[0]) { setFile(fs[0]); setResult(null); setError(null); } }} typesLabel={t.types} />
      </Panel>
    );
  }

  const saved = current ? savingsPercent(current.before, current.blob.size) : 0;
  const worthIt = current && saved >= MEANINGFUL;

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.choose}>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-surface-2 text-muted"><Icon name="file-text" size={22} /></span>
          <div className="min-w-0 flex-1 basis-40">
            <p className="truncate font-medium" title={file.name}><bdi>{file.name}</bdi></p>
            <p className="text-sm text-muted">{formatBytes(file.size, locale)}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { setFile(null); setResult(null); setError(null); }}>
            <Icon name="rotate-ccw" size={16} /> {t.another}
          </Button>
        </div>
      </Panel>

      <Panel title={t.level}>
        <Segmented legend={t.level} value={level} onChange={setLevel} options={(["light", "balanced", "strong"] as CompressLevel[]).map((v) => ({ value: v, label: t.levels[v] }))} />
        <p className="text-sm text-muted">{t.levelHints[level]}</p>
        <div className="border-t border-line pt-4">
          <Button size="lg" onClick={run} disabled={progress !== null}>
            <Icon name={progress !== null ? "loader" : "file-archive"} size={18} className={progress !== null ? "animate-spin" : undefined} />
            {progress !== null ? `${t.compressing} ${Math.round(progress * 100)}%` : t.compress}
          </Button>
        </div>
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
      </Panel>

      {current && (
        <Panel title={t.result}>
          {worthIt ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md bg-surface-2 px-4 py-3">
                  <p className="text-sm text-muted">{t.before}</p>
                  <p className="text-2xl font-semibold tabular-nums">{formatBytes(current.before, locale)}</p>
                </div>
                <div className="rounded-md bg-accent-soft px-4 py-3">
                  <p className="text-sm text-muted">{t.after}</p>
                  <p className="text-2xl font-semibold tabular-nums">{formatBytes(current.blob.size, locale)}</p>
                </div>
                <div className="rounded-md bg-success-soft px-4 py-3">
                  <p className="text-sm text-muted">&nbsp;</p>
                  <p className="text-2xl font-semibold text-success">{t.saved(saved)}</p>
                </div>
              </div>
              <p className="text-sm text-muted">{t.images(current.done, current.found)}</p>
              <div>
                <DownloadButton variant="primary" size="md" label={t.download} filename={`${stem}-compressed.pdf`} getBlob={() => current.blob} />
              </div>
            </>
          ) : (
            <StatusMessage tone="info">
              <p>{t.noGain}</p>
              {level !== "strong" && current.found > 0 && <p className="mt-1">{t.tryStrong}</p>}
            </StatusMessage>
          )}
        </Panel>
      )}
    </div>
  );
}
