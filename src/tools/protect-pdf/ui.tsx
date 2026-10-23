"use client";

import { useState } from "react";
import { SingleFile } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Checkbox, Field, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { arCount } from "@/lib/messages";
import { baseName, safeFileName } from "@/lib/files/names";
import { inspectPdf, PdfError, type PdfErrorCode } from "@/lib/pdf/pdf";
import { protectPdf } from "@/lib/pdf/security";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
const MIN = 4;

const strings = {
  en: {
    choose: "Choose a PDF", types: "PDF", pages: (n: number) => `${n} page${n === 1 ? "" : "s"}`, reading: "Reading your PDF…",
    options: "Password", password: "Password to open the PDF", confirm: "Type it again", show: "Show passwords",
    tooShort: (n: number) => `Use at least ${n} characters.`, mismatch: "The passwords don't match.",
    permissions: "After opening, allow people to…", print: "Print", copy: "Copy text and images", edit: "Edit, comment and rearrange pages",
    permissionsNote: "Most PDF apps respect these settings, but they can't stop someone who can open the file from, for example, taking screenshots.",
    protect: "Protect PDF", protecting: "Encrypting…", done: "Protected with AES encryption. Keep the password safe: it can't be recovered.",
    errors: { encrypted: "This PDF is already password-protected. Unlock it first if you want to change the password.", invalid: "This file couldn't be read as a PDF. It may be damaged." } as Record<PdfErrorCode, string>,
    failed: "Protecting failed. The file may be damaged.",
  },
  ar: {
    choose: "اختر ملف PDF", types: "PDF", pages: (n: number) => arCount(n, "صفحة واحدة", "صفحتان", "صفحات", "صفحة"), reading: "جارٍ قراءة ملف PDF…",
    options: "كلمة المرور", password: "كلمة المرور لفتح الملف", confirm: "أعد كتابتها", show: "إظهار كلمات المرور",
    tooShort: (n: number) => `استخدم ${n} أحرف على الأقل.`, mismatch: "كلمتا المرور غير متطابقتين.",
    permissions: "بعد فتح الملف، اسمح بـ…", print: "الطباعة", copy: "نسخ النصوص والصور", edit: "التعديل والتعليق وإعادة ترتيب الصفحات",
    permissionsNote: "تحترم معظم تطبيقات PDF هذه الإعدادات، لكنها لا تمنع من يستطيع فتح الملف من التقاط لقطات للشاشة مثلًا.",
    protect: "حماية الملف", protecting: "جارٍ التشفير…", done: "تمت الحماية بتشفير AES. احتفظ بكلمة المرور في مكان آمن، فلا يمكن استعادتها.",
    errors: { encrypted: "هذا الملف محمي بكلمة مرور أصلًا. فك حمايته أولًا إن أردت تغيير كلمة المرور.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا." } as Record<PdfErrorCode, string>,
    failed: "فشلت الحماية. قد يكون الملف تالفًا.",
  },
};

export default function ProtectPdf() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(false);
  const [allowEditing, setAllowEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ key: string; blob: Blob } | null>(null);

  async function open(f: File) {
    setFile(f);
    setBytes(null);
    setError(null);
    setResult(null);
    try {
      const b = new Uint8Array(await f.arrayBuffer());
      setCount((await inspectPdf(b)).pageCount);
      setBytes(b);
    } catch (e) {
      setError(e instanceof PdfError ? t.errors[e.code] : t.errors.invalid);
    }
  }

  const tooShort = pw.length > 0 && pw.length < MIN;
  const mismatch = pw2.length > 0 && pw !== pw2;
  const valid = pw.length >= MIN && pw === pw2;
  const key = `${file?.name}|${file?.size}|${pw}|${allowPrinting}|${allowCopying}|${allowEditing}`;
  const current = result && result.key === key ? result : null;

  async function protect() {
    if (!bytes || !valid) return;
    setBusy(true);
    setError(null);
    try {
      const out = await protectPdf(bytes, { userPassword: pw, allowPrinting, allowCopying, allowEditing });
      setResult({ key, blob: new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }) });
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.choose}>
        <SingleFile file={file} rules={rules} typesLabel={t.types} busy={busy} status={bytes ? t.pages(count) : file && !error ? t.reading : null} onFile={open} onClear={() => { setFile(null); setBytes(null); setResult(null); setError(null); }} />
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
      </Panel>

      {bytes && (
        <Panel title={t.options}>
          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); void protect(); }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.password} error={tooShort ? t.tooShort(MIN) : null}>
                {(p) => <TextInput {...p} dir="ltr" type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />}
              </Field>
              <Field label={t.confirm} error={mismatch ? t.mismatch : null}>
                {(p) => <TextInput {...p} dir="ltr" type={show ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />}
              </Field>
            </div>
            <Checkbox label={t.show} checked={show} onChange={(e) => setShow(e.target.checked)} />
            <fieldset className="flex flex-col">
              <legend className="mb-1 text-sm font-medium">{t.permissions}</legend>
              <Checkbox label={t.print} checked={allowPrinting} onChange={(e) => setAllowPrinting(e.target.checked)} />
              <Checkbox label={t.copy} checked={allowCopying} onChange={(e) => setAllowCopying(e.target.checked)} />
              <Checkbox label={t.edit} checked={allowEditing} onChange={(e) => setAllowEditing(e.target.checked)} />
              <p className="text-sm text-muted">{t.permissionsNote}</p>
            </fieldset>
            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <Button size="lg" type="submit" disabled={busy || !valid}>
                <Icon name={busy ? "loader" : "lock"} size={18} className={busy ? "animate-spin" : undefined} /> {busy ? t.protecting : t.protect}
              </Button>
              {current && file && <DownloadButton filename={`${safeFileName(baseName(file.name), "document")}-protected.pdf`} getBlob={() => current.blob} variant="primary" size="md" />}
            </div>
            {current && <StatusMessage tone="success">{t.done}</StatusMessage>}
          </form>
        </Panel>
      )}
    </div>
  );
}
