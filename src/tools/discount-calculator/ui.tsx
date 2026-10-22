"use client";

import { useMemo, useState } from "react";
import { IdleHint, Panel, ResultRow, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { Field, Segmented, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { discountFromPrices, priceAfterDiscount } from "./logic";

type Mode = "price" | "percent";

export default function DiscountCalculator() {
  const [mode, setMode] = useState<Mode>("price");
  const [original, setOriginal] = useState("");
  const [discount, setDiscount] = useState("");
  const [extra, setExtra] = useState("");
  const [sale, setSale] = useState("");

  const touched = original.trim() !== "" || (mode === "price" ? discount.trim() !== "" || extra.trim() !== "" : sale.trim() !== "");
  const outcome = useMemo(() => {
    if (!touched) return null;
    return mode === "price" ? priceAfterDiscount(original, discount, extra) : discountFromPrices(original, sale);
  }, [mode, original, discount, extra, sale, touched]);
  const incomplete = mode === "price" ? !original.trim() || !discount.trim() : !original.trim() || !sale.trim();

  return (
    <Workspace>
      <Panel title="Calculate">
        <Segmented
          legend="What do you want to know?"
          value={mode}
          onChange={setMode}
          options={[
            { value: "price", label: "Price after discount" },
            { value: "percent", label: "Find the discount" },
          ]}
        />
        <Field label="Original price">
          {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={original} onChange={(e) => setOriginal(e.target.value)} placeholder="e.g. 80.00" />}
        </Field>
        {mode === "price" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Discount (%)">
              {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="e.g. 25" />}
            </Field>
            <Field label="Extra discount (%) — optional" hint="Applied to the reduced price.">
              {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="e.g. 10" />}
            </Field>
          </div>
        ) : (
          <Field label="Sale price">
            {(p) => <TextInput {...p} inputMode="decimal" autoComplete="off" value={sale} onChange={(e) => setSale(e.target.value)} placeholder="e.g. 60.00" />}
          </Field>
        )}
        <div>
          <Button variant="ghost" size="sm" disabled={!touched} onClick={() => { setOriginal(""); setDiscount(""); setExtra(""); setSale(""); }}>
            <Icon name="rotate-ccw" size={16} /> Reset
          </Button>
        </div>
      </Panel>

      <Panel title="Result">
        {!outcome && <IdleHint>Enter a price and discount to see your savings.</IdleHint>}
        {outcome && !outcome.ok && (incomplete ? <IdleHint>{outcome.error}</IdleHint> : <StatusMessage tone="error">{outcome.error}</StatusMessage>)}
        {outcome?.ok && (
          <div className="flex flex-col gap-3" aria-live="polite">
            {mode === "price" ? (
              <>
                <ResultRow label="You pay" value={outcome.result.final} emphasis />
                <ResultRow label="You save" value={outcome.result.saved} />
                <ResultRow label="Effective discount" value={outcome.result.effectivePercent} />
              </>
            ) : (
              <>
                <ResultRow label="Discount" value={outcome.result.effectivePercent} emphasis />
                <ResultRow label="Amount saved" value={outcome.result.saved} />
                <ResultRow label="Sale price" value={outcome.result.final} />
              </>
            )}
          </div>
        )}
      </Panel>
    </Workspace>
  );
}
