"use client";

import { useMemo, useState } from "react";
import { IdleHint, Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/actions";
import { Checkbox, Field, Segmented, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { transformUrl, type UrlMode, type UrlScope } from "./logic";

export default function UrlEncoderDecoder() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<UrlMode>("encode");
  const [scope, setScope] = useState<UrlScope>("component");
  const [plus, setPlus] = useState(false);
  const outcome = useMemo(() => (text ? transformUrl(text, mode, scope, plus) : null), [text, mode, scope, plus]);
  const output = outcome?.ok ? outcome.output : "";

  return (
    <div className="flex flex-col gap-5">
      <Panel title="Options">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <Segmented legend="Action" value={mode} onChange={setMode} options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }]} />
          <Segmented legend="Scope" value={scope} onChange={setScope} options={[{ value: "component", label: "Component" }, { value: "full", label: "Full URL" }]} />
          {mode === "decode" && <Checkbox label="Treat + as space" hint="For HTML form query strings" checked={plus} onChange={(e) => setPlus(e.target.checked)} />}
        </div>
        <p className="text-sm text-muted">
          {scope === "component" ? "Component mode also encodes / ? & = # so a value can’t break a URL." : "Full URL mode keeps the characters that give a URL its structure (: / ? & = #)."}
        </p>
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
          <Field label={<span className="sr-only">Text to {mode}</span>} error={outcome && !outcome.ok ? outcome.error : null}>
            {(p) => <TextArea {...p} rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder={mode === "encode" ? "coffee & cream" : "coffee%20%26%20cream"} spellCheck={false} />}
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
          {!text && <IdleHint>The {mode === "encode" ? "encoded" : "decoded"} text appears here.</IdleHint>}
          {outcome && !outcome.ok && <StatusMessage tone="error">{outcome.error}</StatusMessage>}
          {outcome?.ok && (
            <Field label={<span className="sr-only">Result</span>}>
              {(p) => <TextArea {...p} rows={9} readOnly value={output} spellCheck={false} />}
            </Field>
          )}
        </Panel>
      </Workspace>
    </div>
  );
}
