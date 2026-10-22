"use client";

import { useMemo, useState } from "react";
import { IdleHint, Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/actions";
import { Checkbox, Field, Segmented, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { decodeBase64, encodeBase64, type Base64Mode, type TextOutcome } from "./logic";

export default function Base64Tool() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Base64Mode>("encode");
  const [urlSafe, setUrlSafe] = useState(false);
  const [padding, setPadding] = useState(true);

  const outcome: TextOutcome | null = useMemo(() => {
    if (!text) return null;
    if (mode === "encode") return { ok: true, output: encodeBase64(text, { urlSafe, padding }) };
    return decodeBase64(text);
  }, [text, mode, urlSafe, padding]);
  const output = outcome?.ok ? outcome.output : "";

  return (
    <div className="flex flex-col gap-5">
      <Panel title="Options">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <Segmented legend="Action" value={mode} onChange={setMode} options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }]} />
          {mode === "encode" && (
            <>
              <Checkbox label="URL-safe alphabet" hint="Uses - and _ instead of + and /" checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} />
              <Checkbox label="Include = padding" checked={padding} onChange={(e) => setPadding(e.target.checked)} />
            </>
          )}
        </div>
        <StatusMessage tone="info">Base64 is an encoding, not encryption. Anyone can decode it, so don’t use it to hide secrets.</StatusMessage>
      </Panel>
      <Workspace>
        <Panel
          title="Input"
          actions={
            <Button variant="ghost" size="sm" disabled={!text} onClick={() => setText("")}>
              <Icon name="rotate-ccw" size={16} /> Clear
            </Button>
          }
        >
          <Field label={<span className="sr-only">Text to {mode}</span>}>
            {(p) => <TextArea {...p} rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder={mode === "encode" ? "Text to encode…" : "SGVsbG8sIFdvcmxkIQ=="} spellCheck={false} />}
          </Field>
        </Panel>
        <Panel
          title="Result"
          actions={
            <>
              <CopyButton value={output} />
              <Button variant="secondary" size="sm" disabled={!output} onClick={() => { setText(output); setMode(mode === "encode" ? "decode" : "encode"); }}>
                <Icon name="arrow-up-down" size={16} /> Swap
              </Button>
            </>
          }
        >
          {!text && <IdleHint>The {mode === "encode" ? "Base64" : "decoded text"} appears here.</IdleHint>}
          {outcome && !outcome.ok && <StatusMessage tone="error">{outcome.error}</StatusMessage>}
          {outcome?.ok && (
            <Field label={<span className="sr-only">Result</span>}>
              {(p) => <TextArea {...p} rows={9} readOnly value={output} spellCheck={false} className="break-all" />}
            </Field>
          )}
        </Panel>
      </Workspace>
    </div>
  );
}
