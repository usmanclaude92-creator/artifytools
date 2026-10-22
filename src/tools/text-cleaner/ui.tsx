"use client";

import { useMemo, useState } from "react";
import { Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton, DownloadButton } from "@/components/ui/actions";
import { Checkbox, Field, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { cleanText, defaultCleanOptions, type CleanOptions } from "./logic";

const optionList: { key: keyof CleanOptions; label: string; hint?: string }[] = [
  { key: "trimLines", label: "Trim each line" },
  { key: "collapseSpaces", label: "Collapse repeated spaces" },
  { key: "collapseBlankLines", label: "Collapse multiple blank lines" },
  { key: "removeBlankLines", label: "Remove all blank lines" },
  { key: "joinLines", label: "Join lines into one", hint: "Replaces line breaks with spaces" },
  { key: "removeInvisible", label: "Remove invisible characters", hint: "Zero-width spaces, BOM, soft hyphens" },
  { key: "straightenQuotes", label: "Straighten quotes & dashes", hint: "“ ” ‘ ’ – — … → \" ' - ..." },
  { key: "stripTags", label: "Strip HTML tags", hint: "Text only — not a security sanitiser" },
];

export default function TextCleaner() {
  const [text, setText] = useState("");
  const [opts, setOpts] = useState<CleanOptions>(defaultCleanOptions);
  const output = useMemo(() => cleanText(text, opts), [text, opts]);
  const changed = text !== "" && output !== text;

  return (
    <div className="flex flex-col gap-5">
      <Panel title="Clean-up options">
        <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
          {optionList.map((o) => (
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
          title="Input"
          actions={
            <Button variant="ghost" size="sm" onClick={() => setText("")} disabled={!text}>
              <Icon name="rotate-ccw" size={16} /> Clear
            </Button>
          }
        >
          <Field label={<span className="sr-only">Text to clean</span>}>
            {(p) => <TextArea {...p} rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste messy text here…" />}
          </Field>
        </Panel>
        <Panel
          title="Cleaned text"
          actions={
            <>
              <CopyButton value={output} />
              <DownloadButton filename="cleaned-text.txt" disabled={!output} getBlob={() => new Blob([output], { type: "text/plain;charset=utf-8" })} />
            </>
          }
        >
          <Field label={<span className="sr-only">Cleaned text</span>}>
            {(p) => <TextArea {...p} rows={12} value={output} readOnly placeholder="Cleaned text appears here" />}
          </Field>
          <p className="text-sm text-muted" role="status">
            {!text ? "Paste some text to begin." : changed ? `${(text.length - output.length).toLocaleString("en-US")} characters removed or changed.` : "No changes needed with the selected options."}
          </p>
        </Panel>
      </Workspace>
    </div>
  );
}
