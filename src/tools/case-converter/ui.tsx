"use client";

import { useMemo, useState } from "react";
import { Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/actions";
import { Field, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/components/ui/cx";
import { caseModes, convertCase, type CaseMode } from "./logic";

export default function CaseConverter() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<CaseMode>("title");
  const output = useMemo(() => convertCase(text, mode), [text, mode]);

  return (
    <div className="flex flex-col gap-5">
      <Panel title="Case style">
        <div role="radiogroup" aria-label="Case style" className="flex flex-wrap gap-2">
          {caseModes.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              onClick={() => setMode(m.id)}
              className={cx(
                "min-h-10 rounded-md border px-3.5 py-2 text-sm font-medium transition-colors",
                mode === m.id ? "border-accent bg-accent-soft text-accent-text" : "border-line-strong bg-surface hover:bg-surface-2",
              )}
            >
              {m.label}
            </button>
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
          <Field label={<span className="sr-only">Text to convert</span>}>
            {(p) => <TextArea {...p} rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste text…" className="font-sans text-base" />}
          </Field>
        </Panel>
        <Panel title="Result" actions={<CopyButton value={output} />}>
          <Field label={<span className="sr-only">Converted text</span>}>
            {(p) => <TextArea {...p} rows={10} value={output} readOnly placeholder="Converted text appears here" className="font-sans text-base" />}
          </Field>
        </Panel>
      </Workspace>
    </div>
  );
}
