"use client";

import { useMemo, useState } from "react";
import { IdleHint, Panel, Stat, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { dateDifference } from "./logic";

const nf = new Intl.NumberFormat("en-US");
const plural = (n: number, unit: string) => `${nf.format(n)} ${unit}${n === 1 ? "" : "s"}`;

function todayIso(): string {
  const d = new Date();
  return `${String(d.getFullYear()).padStart(4, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DateDifference() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [inclusive, setInclusive] = useState(false);
  const touched = start !== "" || end !== "";
  const outcome = useMemo(() => (touched ? dateDifference(start, end, inclusive) : null), [start, end, inclusive, touched]);
  const incomplete = !start || !end;

  return (
    <Workspace>
      <Panel title="Choose dates">
        <Field label="Start date">
          {(p) => (
            <div className="flex gap-2">
              <TextInput {...p} type="date" value={start} min="0001-01-01" max="9999-12-31" onChange={(e) => setStart(e.target.value)} />
              <Button variant="secondary" onClick={() => setStart(todayIso())}>Today</Button>
            </div>
          )}
        </Field>
        <Field label="End date">
          {(p) => (
            <div className="flex gap-2">
              <TextInput {...p} type="date" value={end} min="0001-01-01" max="9999-12-31" onChange={(e) => setEnd(e.target.value)} />
              <Button variant="secondary" onClick={() => setEnd(todayIso())}>Today</Button>
            </div>
          )}
        </Field>
        <Checkbox label="Include the end date" hint="Counts both the first and last day (e.g. 1st–3rd is 3 days)" checked={inclusive} onChange={(e) => setInclusive(e.target.checked)} />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" disabled={!start && !end} onClick={() => { setStart(end); setEnd(start); }}>
            <Icon name="arrow-up-down" size={16} /> Swap dates
          </Button>
          <Button variant="ghost" size="sm" disabled={!touched} onClick={() => { setStart(""); setEnd(""); setInclusive(false); }}>
            <Icon name="rotate-ccw" size={16} /> Reset
          </Button>
        </div>
      </Panel>

      <Panel title="Difference">
        {!outcome && <IdleHint>Pick a start and end date to see the difference.</IdleHint>}
        {outcome && !outcome.ok && (incomplete ? <IdleHint>{outcome.error}</IdleHint> : <StatusMessage tone="error">{outcome.error}</StatusMessage>)}
        {outcome?.ok && (
          <div className="flex flex-col gap-4" aria-live="polite">
            {outcome.result.swapped && <StatusMessage tone="info">The end date is before the start date, so the dates were swapped for this result.</StatusMessage>}
            <div className="rounded-md bg-accent-soft px-4 py-4">
              <p className="text-sm text-muted">Time between</p>
              <p className="text-xl font-semibold sm:text-2xl">
                {[
                  outcome.result.years ? plural(outcome.result.years, "year") : "",
                  outcome.result.months ? plural(outcome.result.months, "month") : "",
                  outcome.result.days || (!outcome.result.years && !outcome.result.months) ? plural(outcome.result.days, "day") : "",
                ].filter(Boolean).join(", ")}
              </p>
              <p className="mt-1 text-sm text-muted">{outcome.result.startWeekday} → {outcome.result.endWeekday}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              <Stat label="Total days" value={nf.format(outcome.result.totalDays)} />
              <Stat label="Weeks" value={`${nf.format(outcome.result.weeks)}`} hint={`+ ${plural(outcome.result.remainderDays, "day")}`} />
              <Stat label="Business days" value={nf.format(outcome.result.businessDays)} hint="Mon–Fri, no holidays" />
              <Stat label="Hours" value={nf.format(outcome.result.totalHours)} hint="Calendar days × 24" />
            </dl>
          </div>
        )}
      </Panel>
    </Workspace>
  );
}
