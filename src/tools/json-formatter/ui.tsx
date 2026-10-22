"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { IdleHint, Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton, DownloadButton } from "@/components/ui/actions";
import { Checkbox, Field, Segmented, Select, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { translateMessage, type MessageRule } from "@/lib/translate-message";
import { MAX_JSON_CHARS, processJson, type Indent } from "./logic";

const foundAr = (x: string) =>
  x === "end of input" ? "نهاية المدخل" : x === "a single quote (JSON strings use double quotes)" ? "علامة اقتباس مفردة (نصوص JSON تستخدم علامات اقتباس مزدوجة)" : x;

const rulesAr: MessageRule[] = [
  [/^Unexpected end of input — expected a value$/, "نهاية غير متوقعة للمدخل — كان متوقعًا وجود قيمة"],
  [/^Unexpected (.+) — expected a value$/, (x) => `وُجد ${foundAr(x)} بشكل غير متوقع — كان متوقعًا وجود قيمة`],
  [/^Trailing comma — remove the comma before the closing brace$/, "فاصلة زائدة — احذف الفاصلة قبل القوس المعقوف الختامي }"],
  [/^Trailing comma — remove the comma before the closing bracket$/, "فاصلة زائدة — احذف الفاصلة قبل القوس المربع الختامي ]"],
  [/^Expected a property name in double quotes, found (.+)$/, (x) => `كان متوقعًا اسم خاصية بين علامتي اقتباس مزدوجتين، لكن وُجد ${foundAr(x)}`],
  [/^Expected ":" after the property name, found (.+)$/, (x) => `كان متوقعًا ":" بعد اسم الخاصية، لكن وُجد ${foundAr(x)}`],
  [/^Expected "," or "\}" after the value, found (.+)$/, (x) => `كان متوقعًا "," أو "}" بعد القيمة، لكن وُجد ${foundAr(x)}`],
  [/^Expected "," or "\]" after the value, found (.+)$/, (x) => `كان متوقعًا "," أو "]" بعد القيمة، لكن وُجد ${foundAr(x)}`],
  [/^Invalid \\u escape — expected four hex digits$/, "تهريب \\u غير صالح — كان متوقعًا أربعة أرقام ست عشرية"],
  [/^Invalid escape sequence (.+)$/, (x) => `تسلسل تهريب غير صالح ${x}`],
  [/^Unescaped control character in string \(use \\n or \\t instead\)$/, "حرف تحكم غير مهرَّب داخل النص (استخدم \\n أو \\t بدلًا منه)"],
  [/^Unterminated string — missing closing double quote$/, "نص غير مكتمل — علامة الاقتباس المزدوجة الختامية مفقودة"],
  [/^Invalid number — a "-" must be followed by digits$/, "رقم غير صالح — يجب أن تتبع العلامة \"-\" أرقام"],
  [/^Invalid number — leading zeros are not allowed$/, "رقم غير صالح — الأصفار البادئة غير مسموح بها"],
  [/^Unexpected (.+) after the end of the JSON value$/, (x) => `وُجد ${foundAr(x)} بعد نهاية قيمة JSON`],
  [/^Input is too large \(limit (.+) characters\)\.$/, "المدخل كبير جدًا (الحد $1 حرف)."],
  [/^Paste or type some JSON to get started\.$/, "الصق JSON أو اكتبه للبدء."],
  [/^This isn't valid JSON\.$/, "هذا ليس JSON صالحًا."],
];

const strings = {
  en: {
    tooLarge: (mb: string) => `That file is too large (limit about ${mb} MB).`, wrongType: "Please choose a .json or .txt file.", unreadable: "The file couldn't be read.",
    options: "Options", action: "Action", format: "Format", minify: "Minify", validate: "Validate", indentation: "Indentation", spaces2: "2 spaces", spaces4: "4 spaces", tab: "Tab", sortKeys: "Sort keys A–Z",
    input: "Input", openFile: "Open file", jsonInput: "JSON input", validation: "Validation", output: "Output",
    idle: (mode: string) => `Paste JSON on the left to ${mode === "validate" ? "validate" : mode} it.`,
    invalid: (line: number, col: number) => `Invalid JSON — line ${line}, column ${col}`, jump: "Jump to error",
    valid: (keys: number, depth: number, bytes: number) => `Valid JSON — ${keys.toLocaleString("en-US")} key${keys === 1 ? "" : "s"}, depth ${depth}, ${bytes.toLocaleString("en-US")} bytes.`,
    formatted: "Formatted output", rules: null,
  },
  ar: {
    tooLarge: (mb: string) => `الملف كبير جدًا (الحد نحو ${mb} ميغابايت).`, wrongType: "يُرجى اختيار ملف ‎.json أو ‎.txt.", unreadable: "تعذّرت قراءة الملف.",
    options: "الخيارات", action: "الإجراء", format: "تنسيق", minify: "ضغط", validate: "تحقق", indentation: "المسافة البادئة", spaces2: "مسافتان", spaces4: "4 مسافات", tab: "Tab", sortKeys: "ترتيب المفاتيح أبجديًا",
    input: "المدخل", openFile: "فتح ملف", jsonInput: "مدخل JSON", validation: "نتيجة التحقق", output: "المخرج",
    idle: (mode: string) => (mode === "validate" ? "الصق JSON في مربع الإدخال للتحقق منه." : mode === "minify" ? "الصق JSON في مربع الإدخال لضغطه." : "الصق JSON في مربع الإدخال لتنسيقه."),
    invalid: (line: number, col: number) => `JSON غير صالح — السطر ${line}، العمود ${col}`, jump: "الانتقال إلى الخطأ",
    valid: (keys: number, depth: number, bytes: number) => `JSON صالح — المفاتيح: ${keys.toLocaleString("en-US")}، العمق: ${depth}، الحجم: ${bytes.toLocaleString("en-US")} بايت.`,
    formatted: "المخرج المنسّق", rules: rulesAr,
  },
};

type Mode = "format" | "minify" | "validate";

export default function JsonFormatter() {
  const t = strings[useLocale()];
  const ui = useMessages().ui;
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("format");
  const [indent, setIndent] = useState<Indent>(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const deferred = useDeferredValue(text);
  const result = useMemo(() => (deferred.trim() ? processJson(deferred, mode, { indent, sortKeys }) : null), [deferred, mode, indent, sortKeys]);

  function goToError(line: number, column: number) {
    const el = inputRef.current;
    if (!el) return;
    const lines = text.split("\n");
    let offset = 0;
    for (let i = 0; i < line - 1; i++) offset += (lines[i]?.length ?? 0) + 1;
    offset += column - 1;
    el.focus();
    el.setSelectionRange(offset, Math.min(offset + 1, text.length));
  }

  async function onFile(file: File | undefined) {
    setFileError(null);
    if (!file) return;
    if (file.size > MAX_JSON_CHARS) {
      setFileError(t.tooLarge((MAX_JSON_CHARS / 1_000_000).toFixed(0)));
      return;
    }
    if (!/\.(json|txt)$/i.test(file.name) && !/json|text\/plain/.test(file.type)) {
      setFileError(t.wrongType);
      return;
    }
    try {
      setText(await file.text());
    } catch {
      setFileError(t.unreadable);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const output = result?.ok ? result.output : "";

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.options}>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <Segmented
            legend={t.action}
            value={mode}
            onChange={setMode}
            options={[
              { value: "format", label: t.format },
              { value: "minify", label: t.minify },
              { value: "validate", label: t.validate },
            ]}
          />
          <Field label={t.indentation} className="w-40">
            {(p) => (
              <Select {...p} value={String(indent)} disabled={mode !== "format"} onChange={(e) => setIndent(e.target.value === "tab" ? "tab" : (Number(e.target.value) as 2 | 4))}>
                <option value="2">{t.spaces2}</option>
                <option value="4">{t.spaces4}</option>
                <option value="tab">{t.tab}</option>
              </Select>
            )}
          </Field>
          <Checkbox label={t.sortKeys} checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} disabled={mode === "validate"} />
        </div>
      </Panel>

      <Workspace>
        <Panel
          title={t.input}
          actions={
            <>
              <input ref={fileRef} type="file" accept=".json,.txt,application/json,text/plain" className="hidden" id="json-file" aria-hidden="true" tabIndex={-1} onChange={(e) => onFile(e.target.files?.[0])} />
              <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                <Icon name="upload" size={16} /> {t.openFile}
              </Button>
              <Button variant="ghost" size="sm" disabled={!text} onClick={() => { setText(""); setFileError(null); }}>
                <Icon name="rotate-ccw" size={16} /> {ui.clear}
              </Button>
            </>
          }
        >
          {fileError && <StatusMessage tone="error">{fileError}</StatusMessage>}
          <Field label={<span className="sr-only">{t.jsonInput}</span>}>
            {(p) => (
              <TextArea
                {...p}
                ref={inputRef}
                rows={16}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={'{ "paste": "your JSON here" }'}
                spellCheck={false}
                dir="ltr"
                className="min-h-80 whitespace-pre"
                aria-invalid={result && !result.ok ? true : undefined}
              />
            )}
          </Field>
        </Panel>

        <Panel
          title={mode === "validate" ? t.validation : t.output}
          actions={
            mode !== "validate" && (
              <>
                <CopyButton value={output} />
                <DownloadButton filename={mode === "minify" ? "data.min.json" : "data.json"} disabled={!output} getBlob={() => new Blob([output], { type: "application/json" })} />
              </>
            )
          }
        >
          {!result && <IdleHint>{t.idle(mode)}</IdleHint>}
          {result && !result.ok && (
            <StatusMessage tone="error">
              <p className="font-semibold">{t.invalid(result.error.line, result.error.column)}</p>
              <p className="mt-1">{translateMessage(result.error.message, t.rules)}</p>
              {result.error.line > 0 && text.length > 0 && result.error.message !== "Paste or type some JSON to get started." && (
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => goToError(result.error.line, result.error.column)}>
                  {t.jump}
                </Button>
              )}
            </StatusMessage>
          )}
          {result?.ok && (
            <>
              <StatusMessage tone="success">
                {t.valid(result.stats.keys, result.stats.depth, result.stats.bytes)}
              </StatusMessage>
              {mode !== "validate" && (
                <Field label={<span className="sr-only">{t.formatted}</span>}>
                  {(p) => <TextArea {...p} rows={14} readOnly value={output} spellCheck={false} dir="ltr" className="min-h-64 whitespace-pre" />}
                </Field>
              )}
            </>
          )}
        </Panel>
      </Workspace>
    </div>
  );
}
