"use client";

import { useState } from "react";
import { SingleFile } from "@/components/files";
import { Panel } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { StatusMessage } from "@/components/ui/feedback";
import { Field, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale } from "@/components/i18n/locale-provider";
import { baseName, safeFileName } from "@/lib/files/names";
import { PdfSecurityError, securityState, unlockPdf, type SecurityError } from "@/lib/pdf/security";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);
type State = "none" | "restricted" | "password";

const strings = {
  en: {
    choose: "Choose a protected PDF", types: "PDF", checking: "Checking…",
    states: { none: "Not protected", restricted: "Has restrictions", password: "Needs a password to open" } as Record<State, string>,
    none: "This PDF isn't password-protected, so there's nothing to unlock.",
    restricted: "This PDF opens without a password but has restrictions (for example on printing or copying). Unlocking saves a copy without them.",
    password: "Password", passwordHint: "The password you use to open this PDF.", show: "Show password", hide: "Hide password",
    unlock: "Unlock PDF", unlocking: "Unlocking…", done: "Unlocked. The new copy opens without a password.",
    note: "Only unlock files you own or have permission to change. This tool can't recover forgotten passwords.",
    errors: { "wrong-password": "That password is incorrect. Check it and try again.", "needs-password": "Enter the password first.", invalid: "This file couldn't be read as a PDF. It may be damaged.", "not-encrypted": "This PDF isn't protected." } as Record<SecurityError, string>,
  },
  ar: {
    choose: "اختر ملف PDF محميًا", types: "PDF", checking: "جارٍ الفحص…",
    states: { none: "غير محمي", restricted: "عليه قيود", password: "يحتاج إلى كلمة مرور لفتحه" } as Record<State, string>,
    none: "هذا الملف غير محمي بكلمة مرور، فلا يوجد ما يُفك.",
    restricted: "يُفتح هذا الملف دون كلمة مرور لكن عليه قيود (مثل منع الطباعة أو النسخ). يحفظ فك الحماية نسخة دون هذه القيود.",
    password: "كلمة المرور", passwordHint: "كلمة المرور التي تفتح بها هذا الملف.", show: "إظهار كلمة المرور", hide: "إخفاء كلمة المرور",
    unlock: "فك حماية الملف", unlocking: "جارٍ فك الحماية…", done: "تم فك الحماية. تُفتح النسخة الجديدة دون كلمة مرور.",
    note: "لا تفك حماية إلا الملفات التي تملكها أو المسموح لك بتعديلها. لا تستطيع هذه الأداة استعادة كلمات المرور المنسية.",
    errors: { "wrong-password": "كلمة المرور غير صحيحة. تحقق منها وحاول مجددًا.", "needs-password": "أدخل كلمة المرور أولًا.", invalid: "تعذّرت قراءة هذا الملف كملف PDF، وقد يكون تالفًا.", "not-encrypted": "هذا الملف غير محمي." } as Record<SecurityError, string>,
  },
};

export default function UnlockPdf() {
  const locale = useLocale();
  const t = strings[locale];
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);

  async function open(f: File) {
    setFile(f);
    setBytes(null);
    setState(null);
    setError(null);
    setResult(null);
    setPassword("");
    try {
      const b = new Uint8Array(await f.arrayBuffer());
      setState(await securityState(b));
      setBytes(b);
    } catch (e) {
      setError(t.errors[e instanceof PdfSecurityError ? e.code : "invalid"]);
    }
  }

  async function unlock() {
    if (!bytes) return;
    setBusy(true);
    setError(null);
    try {
      const out = await unlockPdf(bytes, state === "password" ? password : "");
      setResult(new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" }));
    } catch (e) {
      setError(t.errors[e instanceof PdfSecurityError ? e.code : "invalid"]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.choose}>
        <SingleFile file={file} rules={rules} typesLabel={t.types} busy={busy} status={state ? t.states[state] : file && !error ? t.checking : null} onFile={open} onClear={() => { setFile(null); setBytes(null); setState(null); setResult(null); setError(null); }} />
        {state === "none" && <StatusMessage tone="info">{t.none}</StatusMessage>}
        {state === "restricted" && <StatusMessage tone="info">{t.restricted}</StatusMessage>}
        {state && state !== "none" && !result && (
          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); void unlock(); }}>
            {state === "password" && (
              <Field label={t.password} hint={t.passwordHint}>
                {(p) => (
                  <div className="flex max-w-md gap-2">
                    <TextInput {...p} dir="ltr" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" autoFocus />
                    <Button type="button" variant="secondary" aria-label={show ? t.hide : t.show} onClick={() => setShow((s) => !s)}><Icon name="eye" size={18} /></Button>
                  </div>
                )}
              </Field>
            )}
            <div>
              <Button size="lg" type="submit" disabled={busy || (state === "password" && !password)}>
                <Icon name={busy ? "loader" : "lock"} size={18} className={busy ? "animate-spin" : undefined} /> {busy ? t.unlocking : t.unlock}
              </Button>
            </div>
          </form>
        )}
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
        {result && file && (
          <div className="flex flex-wrap items-center gap-3">
            <StatusMessage tone="success">{t.done}</StatusMessage>
            <DownloadButton filename={`${safeFileName(baseName(file.name), "document")}-unlocked.pdf`} getBlob={() => result} variant="primary" size="md" />
          </div>
        )}
        <p className="text-sm text-muted">{t.note}</p>
      </Panel>
    </div>
  );
}
