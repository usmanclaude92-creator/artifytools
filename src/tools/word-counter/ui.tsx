"use client";

import { useMemo, useState } from "react";
import { Panel, Stat, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { Field, TextArea } from "@/components/ui/form";
import { CopyButton } from "@/components/ui/actions";
import { Icon } from "@/components/ui/icon";
import { analyzeText, formatDuration } from "./logic";

const fmt = new Intl.NumberFormat("en-US");

export default function WordCounter() {
  const [text, setText] = useState("");
  const stats = useMemo(() => analyzeText(text), [text]);
  const summary = [
    `Words: ${fmt.format(stats.words)}`,
    `Characters: ${fmt.format(stats.characters)}`,
    `Characters (no spaces): ${fmt.format(stats.charactersNoSpaces)}`,
    `Sentences: ${fmt.format(stats.sentences)}`,
    `Paragraphs: ${fmt.format(stats.paragraphs)}`,
    `Lines: ${fmt.format(stats.lines)}`,
    `Reading time: ${formatDuration(stats.readingMinutes)}`,
    `Speaking time: ${formatDuration(stats.speakingMinutes)}`,
  ].join("\n");

  return (
    <Workspace className="lg:grid-cols-[3fr_2fr]">
      <Panel
        title="Your text"
        actions={
          <Button variant="ghost" size="sm" onClick={() => setText("")} disabled={!text}>
            <Icon name="rotate-ccw" size={16} /> Clear
          </Button>
        }
      >
        <Field label={<span className="sr-only">Text to analyse</span>}>
          {(p) => (
            <TextArea
              {...p}
              rows={14}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste your text here…"
              className="min-h-72 font-sans text-base"
              spellCheck
            />
          )}
        </Field>
      </Panel>

      <Panel title="Statistics" actions={<CopyButton value={summary} label="Copy results" disabled={!text} />}>
        <dl className="grid grid-cols-2 gap-3" aria-live="polite">
          <Stat label="Words" value={fmt.format(stats.words)} />
          <Stat label="Characters" value={fmt.format(stats.characters)} />
          <Stat label="No spaces" value={fmt.format(stats.charactersNoSpaces)} />
          <Stat label="Sentences" value={fmt.format(stats.sentences)} />
          <Stat label="Paragraphs" value={fmt.format(stats.paragraphs)} />
          <Stat label="Lines" value={fmt.format(stats.lines)} />
        </dl>
        <dl className="grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
          <div>
            <dt className="text-muted">Reading time</dt>
            <dd className="font-semibold">{formatDuration(stats.readingMinutes)}</dd>
          </div>
          <div>
            <dt className="text-muted">Speaking time</dt>
            <dd className="font-semibold">{formatDuration(stats.speakingMinutes)}</dd>
          </div>
        </dl>
        {stats.topWords.length > 0 ? (
          <div className="border-t border-line pt-4">
            <h3 className="mb-2 text-sm font-medium">Most repeated words</h3>
            <ul className="flex flex-wrap gap-2">
              {stats.topWords.map((w) => (
                <li key={w.word} className="rounded-full bg-surface-2 px-3 py-1 text-sm">
                  {w.word} <span className="text-muted">×{w.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          !text && <p className="border-t border-line pt-4 text-sm text-muted">Start typing to see statistics update live.</p>
        )}
      </Panel>
    </Workspace>
  );
}
