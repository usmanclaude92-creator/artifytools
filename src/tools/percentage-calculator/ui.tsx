"use client";

import { useMemo, useState } from "react";
import { IdleHint, Panel, ResultRow, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { Field, Segmented, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { calculatePercentage, type PercentageMode } from "./logic";

const modes: Record<PercentageMode, { label: string; a: string; b: string; question: string }> = {
  of: { label: "X% of Y", a: "Percentage (%)", b: "Number", question: "What is X% of Y?" },
  "is-what": { label: "X is what % of Y", a: "Value (X)", b: "Total (Y)", question: "X is what percent of Y?" },
  change: { label: "% change", a: "From (old value)", b: "To (new value)", question: "Percentage change from X to Y" },
};

export default function PercentageCalculator() {
  const [mode, setMode] = useState<PercentageMode>("of");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const m = modes[mode];
  const touched = a.trim() !== "" || b.trim() !== "";
  const outcome = useMemo(() => (touched ? calculatePercentage(mode, a, b) : null), [mode, a, b, touched]);
  const incomplete = !a.trim() || !b.trim();

  return (
    <Workspace>
      <Panel title="Calculate">
        <Segmented
          legend="What do you want to know?"
          value={mode}
          onChange={setMode}
          options={(Object.keys(modes) as PercentageMode[]).map((k) => ({ value: k, label: modes[k].label }))}
        />
        <p className="text-sm text-muted">{m.question}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={m.a}>
            {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={a} onChange={(e) => setA(e.target.value)} placeholder="e.g. 15" />}
          </Field>
          <Field label={m.b}>
            {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={b} onChange={(e) => setB(e.target.value)} placeholder="e.g. 200" />}
          </Field>
        </div>
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setA("");
              setB("");
            }}
            disabled={!touched}
          >
            <Icon name="rotate-ccw" size={16} /> Reset
          </Button>
        </div>
      </Panel>

      <Panel title="Result">
        {!outcome && <IdleHint>Enter two numbers to see the answer.</IdleHint>}
        {outcome && !outcome.ok && (incomplete ? <IdleHint>{outcome.error}</IdleHint> : <StatusMessage tone="error">{outcome.error}</StatusMessage>)}
        {outcome?.ok && (
          <div className="flex flex-col gap-3" aria-live="polite">
            <ResultRow label="Answer" value={outcome.result.value} emphasis />
            <p className="text-[0.95rem]">{outcome.result.sentence}</p>
            <p className="text-sm text-muted">
              Calculated as <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em]">{outcome.result.formula}</code>
            </p>
          </div>
        )}
      </Panel>
    </Workspace>
  );
}
