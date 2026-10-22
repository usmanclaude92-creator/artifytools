"use client";

import { useMemo, useState } from "react";
import { Panel, ResultRow, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { contrastRatio, formatHsl, formatRgb, parseColor, rgbToHex, rgbToHsl, type Rgb } from "./logic";

const DEFAULT = "#5B3DF5";
const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const BLACK: Rgb = { r: 0, g: 0, b: 0 };

function ContrastCard({ label, fg, bg }: { label: string; fg: Rgb; bg: Rgb }) {
  const ratio = contrastRatio(fg, bg);
  const checks: [string, boolean][] = [
    ["AA normal text (4.5:1)", ratio >= 4.5],
    ["AA large text (3:1)", ratio >= 3],
    ["AAA normal text (7:1)", ratio >= 7],
  ];
  return (
    <div className="rounded-md border border-line p-4">
      {/* Sample is generated content on an image-role swatch, so it illustrates the pairing without being page text. */}
      <div
        role="img"
        aria-label={`Sample text colored ${rgbToHex(fg)} on ${rgbToHex(bg)}`}
        data-sample="Aa — Sample text"
        className="mb-3 grid h-14 place-items-center rounded-md text-lg font-semibold before:content-[attr(data-sample)]"
        style={{ background: rgbToHex(bg), color: rgbToHex(fg) }}
      />
      <p className="font-semibold">
        {label}: {ratio.toFixed(2)}:1
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {checks.map(([name, pass]) => (
          <li key={name} className="flex items-center gap-2">
            <Icon name={pass ? "circle-check" : "circle-alert"} size={16} className={pass ? "text-success" : "text-danger"} />
            <span>
              {name}: <strong>{pass ? "Pass" : "Fail"}</strong>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ColorConverter() {
  const [value, setValue] = useState(DEFAULT);
  const parsed = useMemo(() => parseColor(value), [value]);
  const rgb = parsed.ok ? parsed.rgb : null;
  const hex = rgb ? rgbToHex(rgb) : DEFAULT;

  return (
    <div className="flex flex-col gap-5">
      <Workspace>
        <Panel title="Pick or enter a color">
          <div className="flex items-end gap-3">
            <Field label="Color value" className="flex-1" error={parsed.ok ? null : parsed.error} hint="HEX, rgb(), hsl() or three numbers">
              {(p) => <TextInput {...p} value={value} onChange={(e) => setValue(e.target.value)} spellCheck={false} autoComplete="off" />}
            </Field>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Picker
              <input
                type="color"
                value={hex.toLowerCase()}
                onChange={(e) => setValue(e.target.value.toUpperCase())}
                className="h-11 w-16 cursor-pointer rounded-md border border-line-strong bg-surface p-1"
              />
            </label>
          </div>
          <div className="h-28 rounded-lg border border-line" style={{ background: rgb ? hex : "transparent" }} role="img" aria-label={rgb ? `Preview of ${hex}` : "No valid color to preview"} />
          <div>
            <Button variant="ghost" size="sm" onClick={() => setValue(DEFAULT)} disabled={value === DEFAULT}>
              <Icon name="rotate-ccw" size={16} /> Reset
            </Button>
          </div>
        </Panel>
        <Panel title="Converted values">
          {rgb ? (
            <div className="flex flex-col gap-3" aria-live="polite">
              <ResultRow label="HEX" value={hex} emphasis />
              <ResultRow label="RGB" value={formatRgb(rgb)} />
              <ResultRow label="HSL" value={formatHsl(rgbToHsl(rgb))} />
            </div>
          ) : (
            <StatusMessage tone="error">{parsed.ok ? "" : parsed.error}</StatusMessage>
          )}
        </Panel>
      </Workspace>
      {rgb && (
        <Panel title="Contrast (WCAG)">
          <div className="grid gap-4 md:grid-cols-3">
            <ContrastCard label="This color on white" fg={rgb} bg={WHITE} />
            <ContrastCard label="White on this color" fg={WHITE} bg={rgb} />
            <ContrastCard label="Black on this color" fg={BLACK} bg={rgb} />
          </div>
        </Panel>
      )}
    </div>
  );
}
