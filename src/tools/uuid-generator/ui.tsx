"use client";

import { useMemo, useState } from "react";
import { Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton, DownloadButton } from "@/components/ui/actions";
import { Checkbox, Field, Segmented, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { useIsClient } from "@/components/ui/use-is-client";
import { useLocale } from "@/components/i18n/locale-provider";
import { generateUuids, MAX_UUID_COUNT, type UuidVersion } from "./logic";

const strings = {
  en: {
    options: "Options", version: "Version", v4: "v4 · random", v7: "v7 · time-ordered", howMany: (max: number) => `How many? (1–${max})`, countError: (max: number) => `Enter a whole number from 1 to ${max}.`,
    uppercase: "Uppercase", hyphens: "Include hyphens", generate: "Generate", generated: (n: number) => `Generated UUID${n === 1 ? "" : "s"}`, copyAll: "Copy all", copy: "Copy",
    press: "Press Generate to create UUIDs.", copyN: (i: number) => `Copy UUID ${i}`,
  },
  ar: {
    options: "الخيارات", version: "الإصدار", v4: "v4 · عشوائي", v7: "v7 · مرتّب زمنيًا", howMany: (max: number) => `كم معرّفًا؟ (1–${max})`, countError: (max: number) => `أدخل عددًا صحيحًا من 1 إلى ${max}.`,
    uppercase: "أحرف كبيرة", hyphens: "تضمين الشرطات", generate: "توليد", generated: (n: number) => (n === 1 ? "المعرّف المولَّد" : "المعرّفات المولَّدة"), copyAll: "نسخ الكل", copy: "نسخ",
    press: "اضغط «توليد» لإنشاء معرّفات UUID.", copyN: (i: number) => `نسخ المعرّف ${i}`,
  },
};

export default function UuidGenerator() {
  const t = strings[useLocale()];
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
      <Panel title={t.options}>
        <Segmented legend={t.version} value={version} onChange={setVersion} options={[{ value: "v4", label: t.v4 }, { value: "v7", label: t.v7 }]} />
        <Field label={t.howMany(MAX_UUID_COUNT)} error={countValid ? null : t.countError(MAX_UUID_COUNT)}>
          {(p) => <TextInput {...p} inputMode="numeric" value={countText} onChange={(e) => setCountText(e.target.value)} />}
        </Field>
        <div>
          <Checkbox label={t.uppercase} checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} />
          <Checkbox label={t.hyphens} checked={hyphens} onChange={(e) => setHyphens(e.target.checked)} />
        </div>
        <Button onClick={generate} disabled={!countValid}>
          <Icon name="refresh-cw" size={18} /> {t.generate}
        </Button>
      </Panel>
      <Panel
        title={t.generated(shown.length)}
        actions={
          <>
            <CopyButton value={joined} label={shown.length > 1 ? t.copyAll : t.copy} />
            <DownloadButton filename="uuids.txt" disabled={!joined} getBlob={() => new Blob([joined + "\n"], { type: "text/plain;charset=utf-8" })} />
          </>
        }
      >
        {shown.length === 0 ? (
          <StatusMessage tone="info">{t.press}</StatusMessage>
        ) : (
          <ul className="flex flex-col gap-2" aria-live="polite">
            {shown.map((u, i) => (
              <li key={`${i}-${u}`} className="flex items-center justify-between gap-3 rounded-md bg-surface-2 py-1.5 ps-4 pe-2">
                <code dir="ltr" className="min-w-0 break-all font-mono text-[0.9rem]">{u}</code>
                <CopyButton value={u} label={t.copy} ariaLabel={t.copyN(i + 1)} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </Workspace>
  );
}
