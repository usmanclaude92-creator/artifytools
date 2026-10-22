"use client";

import { useMemo, useState } from "react";
import { Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton, DownloadButton } from "@/components/ui/actions";
import { Checkbox, Field, Segmented, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { useIsClient } from "@/components/ui/use-is-client";
import { generateUuids, MAX_UUID_COUNT, type UuidVersion } from "./logic";

export default function UuidGenerator() {
  const [version, setVersion] = useState<UuidVersion>("v4");
  const [countText, setCountText] = useState("5");
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [generated, setRaw] = useState<string[] | null>(null);
  // Values are random, so the first batch is created after hydration to keep server HTML deterministic.
  const isClient = useIsClient();
  const firstBatch = useMemo(() => (isClient ? generateUuids({ version: "v4", count: 5, uppercase: false, hyphens: true }) : []), [isClient]);
  const raw = generated ?? firstBatch;

  const count = Number(countText);
  const countValid = Number.isInteger(count) && count >= 1 && count <= MAX_UUID_COUNT;

  function generate() {
    if (!countValid) return;
    setRaw(generateUuids({ version, count, uppercase: false, hyphens: true }));
  }

  const shown = useMemo(
    () => raw.map((u) => (hyphens ? u : u.replace(/-/g, "")))
      .map((u) => (uppercase ? u.toUpperCase() : u)),
    [raw, uppercase, hyphens],
  );
  const joined = shown.join("\n");

  return (
    <Workspace className="lg:grid-cols-[2fr_3fr]">
      <Panel title="Options">
        <Segmented legend="Version" value={version} onChange={setVersion} options={[{ value: "v4", label: "v4 · random" }, { value: "v7", label: "v7 · time-ordered" }]} />
        <Field label={`How many? (1–${MAX_UUID_COUNT})`} error={countValid ? null : `Enter a whole number from 1 to ${MAX_UUID_COUNT}.`}>
          {(p) => <TextInput {...p} inputMode="numeric" value={countText} onChange={(e) => setCountText(e.target.value)} />}
        </Field>
        <div>
          <Checkbox label="Uppercase" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} />
          <Checkbox label="Include hyphens" checked={hyphens} onChange={(e) => setHyphens(e.target.checked)} />
        </div>
        <Button onClick={generate} disabled={!countValid}>
          <Icon name="refresh-cw" size={18} /> Generate
        </Button>
      </Panel>
      <Panel
        title={`Generated UUID${shown.length === 1 ? "" : "s"}`}
        actions={
          <>
            <CopyButton value={joined} label={shown.length > 1 ? "Copy all" : "Copy"} />
            <DownloadButton filename="uuids.txt" disabled={!joined} getBlob={() => new Blob([joined + "\n"], { type: "text/plain;charset=utf-8" })} />
          </>
        }
      >
        {shown.length === 0 ? (
          <StatusMessage tone="info">Press Generate to create UUIDs.</StatusMessage>
        ) : (
          <ul className="flex flex-col gap-2" aria-live="polite">
            {shown.map((u, i) => (
              <li key={`${i}-${u}`} className="flex items-center justify-between gap-3 rounded-md bg-surface-2 py-1.5 ps-4 pe-2">
                <code className="min-w-0 break-all font-mono text-[0.9rem]">{u}</code>
                <CopyButton value={u} label="Copy" ariaLabel={`Copy UUID ${i + 1}`} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </Workspace>
  );
}
