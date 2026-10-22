"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { IdleHint, Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton, DownloadButton } from "@/components/ui/actions";
import { Checkbox, Field, Segmented, Select, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { MAX_JSON_CHARS, processJson, type Indent } from "./logic";

type Mode = "format" | "minify" | "validate";

export default function JsonFormatter() {
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
      setFileError(`That file is too large (limit about ${(MAX_JSON_CHARS / 1_000_000).toFixed(0)} MB).`);
      return;
    }
    if (!/\.(json|txt)$/i.test(file.name) && !/json|text\/plain/.test(file.type)) {
      setFileError("Please choose a .json or .txt file.");
      return;
    }
    try {
      setText(await file.text());
    } catch {
      setFileError("The file couldn't be read.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const output = result?.ok ? result.output : "";

  return (
    <div className="flex flex-col gap-5">
      <Panel title="Options">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <Segmented
            legend="Action"
            value={mode}
            onChange={setMode}
            options={[
              { value: "format", label: "Format" },
              { value: "minify", label: "Minify" },
              { value: "validate", label: "Validate" },
            ]}
          />
          <Field label="Indentation" className="w-40">
            {(p) => (
              <Select {...p} value={String(indent)} disabled={mode !== "format"} onChange={(e) => setIndent(e.target.value === "tab" ? "tab" : (Number(e.target.value) as 2 | 4))}>
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="tab">Tab</option>
              </Select>
            )}
          </Field>
          <Checkbox label="Sort keys A–Z" checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} disabled={mode === "validate"} />
        </div>
      </Panel>

      <Workspace>
        <Panel
          title="Input"
          actions={
            <>
              <input ref={fileRef} type="file" accept=".json,.txt,application/json,text/plain" className="hidden" id="json-file" aria-hidden="true" tabIndex={-1} onChange={(e) => onFile(e.target.files?.[0])} />
              <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                <Icon name="upload" size={16} /> Open file
              </Button>
              <Button variant="ghost" size="sm" disabled={!text} onClick={() => { setText(""); setFileError(null); }}>
                <Icon name="rotate-ccw" size={16} /> Clear
              </Button>
            </>
          }
        >
          {fileError && <StatusMessage tone="error">{fileError}</StatusMessage>}
          <Field label={<span className="sr-only">JSON input</span>}>
            {(p) => (
              <TextArea
                {...p}
                ref={inputRef}
                rows={16}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={'{ "paste": "your JSON here" }'}
                spellCheck={false}
                className="min-h-80 whitespace-pre"
                aria-invalid={result && !result.ok ? true : undefined}
              />
            )}
          </Field>
        </Panel>

        <Panel
          title={mode === "validate" ? "Validation" : "Output"}
          actions={
            mode !== "validate" && (
              <>
                <CopyButton value={output} />
                <DownloadButton filename={mode === "minify" ? "data.min.json" : "data.json"} disabled={!output} getBlob={() => new Blob([output], { type: "application/json" })} />
              </>
            )
          }
        >
          {!result && <IdleHint>Paste JSON on the left to {mode === "validate" ? "validate" : mode} it.</IdleHint>}
          {result && !result.ok && (
            <StatusMessage tone="error">
              <p className="font-semibold">Invalid JSON — line {result.error.line}, column {result.error.column}</p>
              <p className="mt-1">{result.error.message}</p>
              {result.error.line > 0 && text.length > 0 && result.error.message !== "Paste or type some JSON to get started." && (
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => goToError(result.error.line, result.error.column)}>
                  Jump to error
                </Button>
              )}
            </StatusMessage>
          )}
          {result?.ok && (
            <>
              <StatusMessage tone="success">
                Valid JSON — {result.stats.keys.toLocaleString("en-US")} key{result.stats.keys === 1 ? "" : "s"}, depth {result.stats.depth}, {result.stats.bytes.toLocaleString("en-US")} bytes.
              </StatusMessage>
              {mode !== "validate" && (
                <Field label={<span className="sr-only">Formatted output</span>}>
                  {(p) => <TextArea {...p} rows={14} readOnly value={output} spellCheck={false} className="min-h-64 whitespace-pre" />}
                </Field>
              )}
            </>
          )}
        </Panel>
      </Workspace>
    </div>
  );
}
