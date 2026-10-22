"use client";

import { useEffect, useRef, useState } from "react";
import { IdleHint, Panel, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/actions";
import { Field, Segmented, TextArea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Spinner, StatusMessage } from "@/components/ui/feedback";
import { MAX_SUMMARY_INPUT_CHARS } from "@/lib/ai/request";
import type { SummaryLength } from "@/lib/ai/types";

type State =
  | { phase: "idle" }
  | { phase: "processing" }
  | { phase: "success"; summary: string }
  | { phase: "error"; message: string };

export default function AiTextSummarizer() {
  // null = still checking. The key lives on the server, so availability is checked at runtime.
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [text, setText] = useState("");
  const [length, setLength] = useState<SummaryLength>("medium");
  const [state, setState] = useState<State>({ phase: "idle" });
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/status", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ configured?: boolean }>)
      .then((d) => !cancelled && setAiConfigured(Boolean(d.configured)))
      .catch(() => !cancelled && setAiConfigured(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const tooLong = text.length > MAX_SUMMARY_INPUT_CHARS;
  const canSubmit = aiConfigured && text.trim() !== "" && !tooLong && state.phase !== "processing";

  async function submit() {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setState({ phase: "processing" });
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, length }),
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => ({}))) as { summary?: string; message?: string };
      if (!res.ok || !data.summary) {
        setState({ phase: "error", message: data.message ?? "Something went wrong. Please try again." });
        return;
      }
      setState({ phase: "success", summary: data.summary });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setState({ phase: "error", message: "Couldn't reach the server. Check your connection and try again." });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {aiConfigured === false && (
        <StatusMessage tone="warning">
          <p className="font-semibold">Requires configuration</p>
          <p className="mt-1">This deployment has no AI provider configured, so summarizing is turned off. The site operator needs to set a server-side API key (see the project’s README). No summary will be fabricated.</p>
        </StatusMessage>
      )}
      <StatusMessage tone="info">When you press Summarize, your text is sent to Artify’s server and on to a third-party AI provider. Don’t submit confidential information you aren’t allowed to share.</StatusMessage>
      <Workspace>
        <Panel
          title="Text to summarize"
          actions={
            <Button variant="ghost" size="sm" disabled={!text} onClick={() => { abort.current?.abort(); setText(""); setState({ phase: "idle" }); }}>
              <Icon name="rotate-ccw" size={16} /> Clear
            </Button>
          }
        >
          <Field label={<span className="sr-only">Text to summarize</span>} error={tooLong ? `Text is ${text.length.toLocaleString("en-US")} characters; the limit is ${MAX_SUMMARY_INPUT_CHARS.toLocaleString("en-US")}.` : null} hint={`${text.length.toLocaleString("en-US")} / ${MAX_SUMMARY_INPUT_CHARS.toLocaleString("en-US")} characters`}>
            {(p) => <TextArea {...p} rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste an article, report, or email thread…" className="font-sans text-base" />}
          </Field>
          <Segmented legend="Summary length" value={length} onChange={setLength} options={[{ value: "short", label: "Short" }, { value: "medium", label: "Medium" }, { value: "long", label: "Detailed" }]} />
          <div>
            <Button onClick={submit} disabled={!canSubmit}>
              <Icon name="sparkles" size={18} /> {state.phase === "processing" ? "Summarizing…" : "Summarize"}
            </Button>
          </div>
        </Panel>
        <Panel title="Summary" actions={state.phase === "success" && <CopyButton value={state.summary} />}>
          {state.phase === "idle" && <IdleHint>{aiConfigured !== false ? "Your summary will appear here." : "Summaries are unavailable until an AI provider is configured."}</IdleHint>}
          {state.phase === "processing" && <Spinner label="Summarizing" />}
          {state.phase === "error" && <StatusMessage tone="error">{state.message}</StatusMessage>}
          {state.phase === "success" && (
            <div aria-live="polite">
              <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed">{state.summary}</p>
              <p className="mt-4 text-sm text-muted">AI-generated. It may contain errors — check important details against the original.</p>
            </div>
          )}
        </Panel>
      </Workspace>
    </div>
  );
}
