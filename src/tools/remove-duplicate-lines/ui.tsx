"use client";

import { useMemo, useState } from "react";
import { Panel, Stat, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton, DownloadButton } from "@/components/ui/actions";
import { Checkbox, Field, Select, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { removeDuplicateLines, type DedupeOptions, type SortMode } from "./logic";

const strings = {
  en: {
    options: "Options", caseSensitive: "Case-sensitive", caseHint: "“Apple” and “apple” differ", trim: "Trim spaces", trimHint: "Ignore leading/trailing spaces", keepBlank: "Keep blank lines",
    sort: "Sort", keepOrder: "Keep original order", asc: "A → Z", desc: "Z → A", input: "Input (one item per line)", toDedupe: "List to de-duplicate", placeholder: "apple\nbanana\napple",
    unique: "Unique lines", uniquePlaceholder: "Unique lines appear here", linesIn: "Lines in", uniqueStat: "Unique", removed: "Removed",
  },
  ar: {
    options: "الخيارات", caseSensitive: "مراعاة حالة الأحرف", caseHint: "«Apple» و«apple» مختلفتان", trim: "قصّ المسافات", trimHint: "تجاهل المسافات في بداية السطر ونهايته", keepBlank: "إبقاء الأسطر الفارغة",
    sort: "الترتيب", keepOrder: "الإبقاء على الترتيب الأصلي", asc: "تصاعدي (أ ← ي)", desc: "تنازلي (ي ← أ)", input: "القائمة (عنصر في كل سطر)", toDedupe: "القائمة المراد إزالة التكرار منها", placeholder: "تفاح\nموز\nتفاح",
    unique: "الأسطر الفريدة", uniquePlaceholder: "تظهر الأسطر الفريدة هنا", linesIn: "الأسطر المُدخلة", uniqueStat: "الفريدة", removed: "المحذوفة",
  },
};

export default function RemoveDuplicateLines() {
  const t = strings[useLocale()];
  const ui = useMessages().ui;
  const [text, setText] = useState("");
  const [opts, setOpts] = useState<DedupeOptions>({ caseSensitive: true, trimLines: true, keepBlank: false, sort: "none" });
  const result = useMemo(() => removeDuplicateLines(text, opts), [text, opts]);
  const set = <K extends keyof DedupeOptions>(k: K, v: DedupeOptions[K]) => setOpts((o) => ({ ...o, [k]: v }));

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t.options}>
        <div className="grid items-end gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
          <Checkbox label={t.caseSensitive} hint={t.caseHint} checked={opts.caseSensitive} onChange={(e) => set("caseSensitive", e.target.checked)} />
          <Checkbox label={t.trim} hint={t.trimHint} checked={opts.trimLines} onChange={(e) => set("trimLines", e.target.checked)} />
          <Checkbox label={t.keepBlank} checked={opts.keepBlank} onChange={(e) => set("keepBlank", e.target.checked)} />
          <Field label={t.sort}>
            {(p) => (
              <Select {...p} value={opts.sort} onChange={(e) => set("sort", e.target.value as SortMode)}>
                <option value="none">{t.keepOrder}</option>
                <option value="asc">{t.asc}</option>
                <option value="desc">{t.desc}</option>
              </Select>
            )}
          </Field>
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
          <Field label={<span className="sr-only">{t.toDedupe}</span>}>
            {(p) => <TextArea {...p} rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder={t.placeholder} />}
          </Field>
        </Panel>
        <Panel
          title={t.unique}
          actions={
            <>
              <CopyButton value={result.output} />
              <DownloadButton filename="unique-lines.txt" disabled={!result.output} getBlob={() => new Blob([result.output], { type: "text/plain;charset=utf-8" })} />
            </>
          }
        >
          <Field label={<span className="sr-only">{t.unique}</span>}>
            {(p) => <TextArea {...p} rows={12} value={result.output} readOnly placeholder={t.uniquePlaceholder} />}
          </Field>
          <dl className="grid grid-cols-3 gap-3" aria-live="polite">
            <Stat label={t.linesIn} value={result.totalLines} />
            <Stat label={t.uniqueStat} value={result.uniqueLines} />
            <Stat label={t.removed} value={result.removed} />
          </dl>
        </Panel>
      </Workspace>
    </div>
  );
}
