"use client";

import { useMemo, useState } from "react";
import { IdleHint, Panel, ResultRow, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { Field, Segmented, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { calculateVat, type VatMode } from "./logic";

const quickRates = ["5", "10", "20", "25"];

export default function VatCalculator() {
  const [mode, setMode] = useState<VatMode>("add");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("20");
  const touched = amount.trim() !== "";
  const outcome = useMemo(() => (touched ? calculateVat(mode, amount, rate) : null), [mode, amount, rate, touched]);

  return (
    <Workspace>
      <Panel title="Calculate">
        <Segmented
          legend="Direction"
          value={mode}
          onChange={setMode}
          options={[
            { value: "add", label: "Add VAT (net → gross)" },
            { value: "remove", label: "Remove VAT (gross → net)" },
          ]}
        />
        <Field label={mode === "add" ? "Amount excluding VAT (net)" : "Amount including VAT (gross)"}>
          {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 100.00" />}
        </Field>
        <Field label="VAT rate (%)" hint="Enter the rate that applies to your transaction.">
          {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={rate} onChange={(e) => setRate(e.target.value)} />}
        </Field>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Quick rates">
          <span className="text-sm text-muted">Quick fill:</span>
          {quickRates.map((r) => (
            <Button key={r} variant="secondary" size="sm" onClick={() => setRate(r)} aria-pressed={rate === r}>
              {r}%
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => { setAmount(""); setRate("20"); }} disabled={!touched && rate === "20"}>
            <Icon name="rotate-ccw" size={16} /> Reset
          </Button>
        </div>
      </Panel>

      <Panel title="Result">
        {!outcome && <IdleHint>Enter an amount to see the net, VAT, and gross figures.</IdleHint>}
        {outcome && !outcome.ok && <StatusMessage tone="error">{outcome.error}</StatusMessage>}
        {outcome?.ok && (
          <div className="flex flex-col gap-3" aria-live="polite">
            <ResultRow label="Net (excluding VAT)" value={outcome.result.net} copyLabel="net amount" />
            <ResultRow label={`VAT at ${outcome.result.rate}`} value={outcome.result.vat} copyLabel="VAT amount" />
            <ResultRow label="Gross (including VAT)" value={outcome.result.gross} copyLabel="gross amount" emphasis />
          </div>
        )}
      </Panel>
    </Workspace>
  );
}
