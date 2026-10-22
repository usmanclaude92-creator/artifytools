"use client";

import { useMemo, useState } from "react";
import { Panel, Stat, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton, DownloadButton } from "@/components/ui/actions";
import { Checkbox, Field, Select, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { removeDuplicateLines, type DedupeOptions, type SortMode } from "./logic";

export default function RemoveDuplicateLines() {
  const [text, setText] = useState("");
  const [opts, setOpts] = useState<DedupeOptions>({ caseSensitive: true, trimLines: true, keepBlank: false, sort: "none" });
  const result = useMemo(() => removeDuplicateLines(text, opts), [text, opts]);
  const set = <K extends keyof DedupeOptions>(k: K, v: DedupeOptions[K]) => setOpts((o) => ({ ...o, [k]: v }));

  return (
    <div className="flex flex-col gap-5">
      <Panel title="Options">
        <div className="grid items-end gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
          <Checkbox label="Case-sensitive" hint="“Apple” and “apple” differ" checked={opts.caseSensitive} onChange={(e) => set("caseSensitive", e.target.checked)} />
          <Checkbox label="Trim spaces" hint="Ignore leading/trailing spaces" checked={opts.trimLines} onChange={(e) => set("trimLines", e.target.checked)} />
          <Checkbox label="Keep blank lines" checked={opts.keepBlank} onChange={(e) => set("keepBlank", e.target.checked)} />
          <Field label="Sort">
            {(p) => (
              <Select {...p} value={opts.sort} onChange={(e) => set("sort", e.target.value as SortMode)}>
                <option value="none">Keep original order</option>
                <option value="asc">A → Z</option>
                <option value="desc">Z → A</option>
              </Select>
            )}
          </Field>
        </div>
      </Panel>
      <Workspace>
        <Panel
          title="Input (one item per line)"
          actions={
            <Button variant="ghost" size="sm" onClick={() => setText("")} disabled={!text}>
              <Icon name="rotate-ccw" size={16} /> Clear
            </Button>
          }
        >
          <Field label={<span className="sr-only">List to de-duplicate</span>}>
            {(p) => <TextArea {...p} rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder={"apple\nbanana\napple"} />}
          </Field>
        </Panel>
        <Panel
          title="Unique lines"
          actions={
            <>
              <CopyButton value={result.output} />
              <DownloadButton filename="unique-lines.txt" disabled={!result.output} getBlob={() => new Blob([result.output], { type: "text/plain;charset=utf-8" })} />
            </>
          }
        >
          <Field label={<span className="sr-only">Unique lines</span>}>
            {(p) => <TextArea {...p} rows={12} value={result.output} readOnly placeholder="Unique lines appear here" />}
          </Field>
          <dl className="grid grid-cols-3 gap-3" aria-live="polite">
            <Stat label="Lines in" value={result.totalLines} />
            <Stat label="Unique" value={result.uniqueLines} />
            <Stat label="Removed" value={result.removed} />
          </dl>
        </Panel>
      </Workspace>
    </div>
  );
}
