"use client";

import { useEffect, useMemo, useState } from "react";
import { IdleHint, Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/ui/actions";
import { Field, Select, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Spinner, StatusMessage } from "@/components/ui/feedback";
import {
  errorCorrectionLevels, generateQr, qrContrastWarning, validateQrInput,
  type ErrorCorrection, type QrArtifacts, type QrOptions,
} from "./logic";

interface Outcome {
  key: string;
  artifacts?: QrArtifacts;
  error?: string;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body = ""] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(head ?? "")?.[1] ?? "image/png";
  const bin = atob(body);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

export default function QrCodeGenerator() {
  const [text, setText] = useState("");
  const [level, setLevel] = useState<ErrorCorrection>("M");
  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(2);
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#ffffff");
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const options: QrOptions = useMemo(
    () => ({ text, errorCorrection: level, size, margin, foreground: fg, background: bg }),
    [text, level, size, margin, fg, bg],
  );
  const key = JSON.stringify(options);
  const validationError = validateQrInput(options);
  const hasText = text.trim() !== "";

  useEffect(() => {
    if (!hasText || validationError) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const artifacts = await generateQr(options);
        if (!cancelled) setOutcome({ key, artifacts });
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "";
          setOutcome({ key, error: /too big|capacity|amount of data/i.test(msg) ? "That content is too long to fit in a QR code at this error-correction level. Shorten it or choose a lower level." : "The QR code couldn't be generated." });
        }
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, hasText, validationError, options]);

  const current = outcome && outcome.key === key ? outcome : null;
  const warning = qrContrastWarning(fg, bg);
  const svgUrl = current?.artifacts ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(current.artifacts.svg)}` : null;

  return (
    <Workspace className="lg:grid-cols-[3fr_2fr]">
      <Panel
        title="Content & style"
        actions={
          <Button variant="ghost" size="sm" disabled={!text} onClick={() => setText("")}>
            <Icon name="rotate-ccw" size={16} /> Clear
          </Button>
        }
      >
        <Field label="Text or URL" error={validationError}>
          {(p) => <TextArea {...p} rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="https://example.com" className="font-sans text-base" />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Error correction">
            {(p) => (
              <Select {...p} value={level} onChange={(e) => setLevel(e.target.value as ErrorCorrection)}>
                {errorCorrectionLevels.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="PNG size">
            {(p) => (
              <Select {...p} value={size} onChange={(e) => setSize(Number(e.target.value))}>
                {[256, 512, 1024, 2048].map((s) => (
                  <option key={s} value={s}>{s} × {s} px</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Margin">
            {(p) => (
              <Select {...p} value={margin} onChange={(e) => setMargin(Number(e.target.value))}>
                {[0, 1, 2, 4, 6].map((m) => (
                  <option key={m} value={m}>{m} modules</option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Foreground color">
            {(p) => <input {...p} type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-11 w-full cursor-pointer rounded-md border border-line-strong bg-surface p-1" />}
          </Field>
          <Field label="Background color">
            {(p) => <input {...p} type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-11 w-full cursor-pointer rounded-md border border-line-strong bg-surface p-1" />}
          </Field>
        </div>
        {warning && <StatusMessage tone="warning">{warning}</StatusMessage>}
      </Panel>

      <Panel title="Preview">
        {!hasText && <IdleHint>Enter text or a link to create your QR code.</IdleHint>}
        {hasText && validationError && <StatusMessage tone="error">{validationError}</StatusMessage>}
        {hasText && !validationError && !current && <Spinner label="Generating" />}
        {current?.error && <StatusMessage tone="error">{current.error}</StatusMessage>}
        {current?.artifacts && svgUrl && (
          <div className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL, not a remote asset */}
            <img src={svgUrl} alt="Generated QR code" width={280} height={280} className="aspect-square w-full max-w-72 rounded-md border border-line" />
            <p className="text-sm text-muted" role="status">
              {current.artifacts.modules} × {current.artifacts.modules} modules · scan with your phone to test before sharing
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <DownloadButton variant="primary" size="md" label="Download PNG" filename="qr-code.png" getBlob={() => dataUrlToBlob(current.artifacts!.pngDataUrl)} />
              <DownloadButton size="md" label="Download SVG" filename="qr-code.svg" getBlob={() => new Blob([current.artifacts!.svg], { type: "image/svg+xml" })} />
            </div>
          </div>
        )}
      </Panel>
    </Workspace>
  );
}
