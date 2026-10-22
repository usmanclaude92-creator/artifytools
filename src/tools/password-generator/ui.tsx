"use client";

import { useMemo, useState } from "react";
import { IdleHint, Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/actions";
import { Checkbox, Field, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { cx } from "@/components/ui/cx";
import { useIsClient } from "@/components/ui/use-is-client";
import { generatePassword, MAX_LENGTH, MIN_LENGTH, strengthLabel, type PasswordOptions, type PasswordOutcome } from "./logic";

const initial: PasswordOptions = { length: 20, lowercase: true, uppercase: true, digits: true, symbols: true, excludeAmbiguous: false };

export default function PasswordGenerator() {
  const [opts, setOpts] = useState<PasswordOptions>(initial);
  const [lengthText, setLengthText] = useState(String(initial.length));
  const [generated, setOutcome] = useState<PasswordOutcome | null>(null);
  const [visible, setVisible] = useState(true);
  // Random output must not be part of the server-rendered HTML, so the first password is made after hydration.
  const isClient = useIsClient();
  const firstPassword = useMemo(() => (isClient ? generatePassword(initial) : null), [isClient]);
  const outcome = generated ?? firstPassword;

  function apply(next: PasswordOptions) {
    setOpts(next);
    setOutcome(generatePassword(next));
  }

  const lengthNum = Number(lengthText);
  const lengthValid = Number.isInteger(lengthNum) && lengthNum >= MIN_LENGTH && lengthNum <= MAX_LENGTH;
  const typeKeys = ["lowercase", "uppercase", "digits", "symbols"] as const;
  const strength = outcome?.ok ? strengthLabel(outcome.entropyBits) : null;

  return (
    <Workspace className="lg:grid-cols-[2fr_3fr]">
      <Panel title="Settings">
        <div className="flex flex-col gap-3">
          <Field label={`Length (${MIN_LENGTH}–${MAX_LENGTH})`} error={lengthValid ? null : `Enter a whole number from ${MIN_LENGTH} to ${MAX_LENGTH}.`}>
            {(p) => (
              <TextInput
                {...p}
                inputMode="numeric"
                value={lengthText}
                onChange={(e) => {
                  setLengthText(e.target.value);
                  const n = Number(e.target.value);
                  if (Number.isInteger(n) && n >= MIN_LENGTH && n <= MAX_LENGTH) apply({ ...opts, length: n });
                }}
              />
            )}
          </Field>
          <input
            type="range"
            min={MIN_LENGTH}
            max={MAX_LENGTH}
            value={lengthValid ? lengthNum : opts.length}
            aria-label="Password length slider"
            onChange={(e) => {
              setLengthText(e.target.value);
              apply({ ...opts, length: Number(e.target.value) });
            }}
            className="h-11 w-full cursor-pointer accent-[var(--accent)]"
          />
        </div>
        <fieldset>
          <legend className="mb-1 text-sm font-medium">Include</legend>
          {typeKeys.map((k) => (
            <Checkbox
              key={k}
              label={{ lowercase: "Lowercase (a–z)", uppercase: "Uppercase (A–Z)", digits: "Digits (0–9)", symbols: "Symbols (!@#$…)" }[k]}
              checked={opts[k]}
              onChange={(e) => apply({ ...opts, [k]: e.target.checked })}
            />
          ))}
        </fieldset>
        <Checkbox label="Exclude look-alike characters" hint="Removes I, l, 1, O, 0, o" checked={opts.excludeAmbiguous} onChange={(e) => apply({ ...opts, excludeAmbiguous: e.target.checked })} />
      </Panel>

      <Panel title="Your password">
        {!outcome && <IdleHint>Generating…</IdleHint>}
        {outcome && !outcome.ok && <StatusMessage tone="error">{outcome.error}</StatusMessage>}
        {outcome?.ok && strength && (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-line bg-surface-2 p-4">
              <output aria-live="polite" className={cx("block break-all font-mono text-xl leading-relaxed sm:text-2xl", !visible && "tracking-widest")}>
                {visible ? outcome.password : "•".repeat(outcome.password.length)}
              </output>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => apply(opts)}>
                <Icon name="refresh-cw" size={18} /> Generate new
              </Button>
              <CopyButton value={outcome.password} size="md" label="Copy password" toastMessage="Password copied" />
              <Button variant="ghost" onClick={() => setVisible((v) => !v)} aria-pressed={!visible}>
                {visible ? "Hide" : "Show"}
              </Button>
            </div>
            <div>
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span className="font-medium">Strength: {strength.label}</span>
                <span className="text-muted">≈ {outcome.entropyBits} bits of entropy</span>
              </div>
              <div className="flex gap-1.5" aria-hidden="true">
                {[1, 2, 3, 4].map((n) => (
                  <span key={n} className={cx("h-2 flex-1 rounded-full", n <= strength.level ? "bg-accent" : "bg-surface-2")} />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted">Generated on your device and never sent anywhere. Save it in a password manager and use a unique password for every account.</p>
          </div>
        )}
      </Panel>
    </Workspace>
  );
}
