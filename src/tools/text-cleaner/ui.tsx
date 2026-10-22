"use client";

import { useMemo, useState } from "react";
import { Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton, DownloadButton } from "@/components/ui/actions";
import { Checkbox, Field, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { cleanText, defaultCleanOptions, type CleanOptions } from "./logic";

type Option = { key: keyof CleanOptions; label: string; hint?: string };

const strings = {
  en: {
    options: [
      { key: "trimLines", label: "Trim each line" },
      { key: "collapseSpaces", label: "Collapse repeated spaces" },
      { key: "collapseBlankLines", label: "Collapse multiple blank lines" },
      { key: "removeBlankLines", label: "Remove all blank lines" },
      { key: "joinLines", label: "Join lines into one", hint: "Replaces line breaks with spaces" },
      { key: "removeInvisible", label: "Remove invisible characters", hint: "Zero-width spaces, BOM, soft hyphens" },
      { key: "straightenQuotes", label: "Straighten quotes & dashes", hint: "“ ” ‘ ’ – — … → \" ' - ..." },
      { key: "stripTags", label: "Strip HTML tags", hint: "Text only — not a security sanitiser" },
    ] as Option[],
    optionsTitle: "Clean-up options", input: "Input", toClean: "Text to clean", placeholder: "Paste messy text here…", cleaned: "Cleaned text", cleanedPlaceholder: "Cleaned text appears here",
    begin: "Paste some text to begin.", changed: (n: string) => `${n} characters removed or changed.`, noChanges: "No changes needed with the selected options.",
  },
  ar: {
    options: [
      { key: "trimLines", label: "قصّ مسافات كل سطر" },
      { key: "collapseSpaces", label: "دمج المسافات المتكررة" },
      { key: "collapseBlankLines", label: "دمج الأسطر الفارغة المتعددة" },
      { key: "removeBlankLines", label: "حذف كل الأسطر الفارغة" },
      { key: "joinLines", label: "دمج الأسطر في سطر واحد", hint: "يستبدل فواصل الأسطر بمسافات" },
      { key: "removeInvisible", label: "حذف الأحرف غير المرئية", hint: "المسافات ذات العرض الصفري وعلامة BOM والشرطات الناعمة" },
      { key: "straightenQuotes", label: "توحيد علامات الاقتباس والشرطات", hint: "تحويل “ ” ‘ ’ – — … إلى \" ' - ..." },
      { key: "stripTags", label: "إزالة وسوم HTML", hint: "للنص فقط — وليست أداة تعقيم أمنية" },
    ] as Option[],
    optionsTitle: "خيارات التنظيف", input: "النص الأصلي", toClean: "النص المراد تنظيفه", placeholder: "الصق النص غير المرتب هنا…", cleaned: "النص المنظّف", cleanedPlaceholder: "يظهر النص المنظّف هنا",
    begin: "الصق نصًا للبدء.", changed: (n: string) => `عدد الأحرف المحذوفة أو المعدّلة: ${n}.`, noChanges: "لا يحتاج النص إلى تغييرات بالخيارات المحددة.",
  },
};

export default function TextCleaner() {
  const t = strings[useLocale()];
  const ui = useMessages().ui;
  const [text, setText] = useState("");
  const [opts, setOpts] = useState<CleanOptions>(defaultCleanOptions);
  const output = useMemo(() => cleanText(text, opts), [text, opts]);
  const changed = text !== "" && output !== text;

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.optionsTitle}>
        <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.options.map((o) => (
            <Checkbox
              key={o.key}
              label={o.label}
              hint={o.hint}
              checked={opts[o.key]}
              onChange={(e) => setOpts((prev) => ({ ...prev, [o.key]: e.target.checked }))}
            />
          ))}
        </div>
      </Panel>
      <Workspace>
        <Panel
          title={t.input}
          actions={
            <Button variant="ghost" size="sm" onClick={() => setText("")} disabled={!text}>
              <Icon name="rotate-ccw" size={16} /> {ui.clear}
            </Button>
          }
        >
          <Field label={<span className="sr-only">{t.toClean}</span>}>
            {(p) => <TextArea {...p} rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder={t.placeholder} />}
          </Field>
        </Panel>
        <Panel
          title={t.cleaned}
          actions={
            <>
              <CopyButton value={output} />
              <DownloadButton filename="cleaned-text.txt" disabled={!output} getBlob={() => new Blob([output], { type: "text/plain;charset=utf-8" })} />
            </>
          }
        >
          <Field label={<span className="sr-only">{t.cleaned}</span>}>
            {(p) => <TextArea {...p} rows={12} value={output} readOnly placeholder={t.cleanedPlaceholder} />}
          </Field>
          <p className="text-sm text-muted" role="status">
            {!text ? t.begin : changed ? t.changed((text.length - output.length).toLocaleString("en-US")) : t.noChanges}
          </p>
        </Panel>
      </Workspace>
    </div>
  );
}
