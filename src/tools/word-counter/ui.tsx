"use client";

import { useMemo, useState } from "react";
import { Panel, Stat, Workspace } from "@/components/tools/parts";
import { Button } from "@/components/ui/button";
import { Field, TextArea } from "@/components/ui/form";
import { CopyButton } from "@/components/ui/actions";
import { Icon } from "@/components/ui/icon";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { analyzeText, formatDuration } from "./logic";

const strings = {
  en: {
    yourText: "Your text", toAnalyse: "Text to analyse", placeholder: "Type or paste your text here…", statistics: "Statistics", copyResults: "Copy results",
    words: "Words", characters: "Characters", noSpacesLong: "Characters (no spaces)", noSpaces: "No spaces", sentences: "Sentences", paragraphs: "Paragraphs", lines: "Lines",
    reading: "Reading time", speaking: "Speaking time", repeated: "Most repeated words", start: "Start typing to see statistics update live.",
    duration: (s: string) => s,
  },
  ar: {
    yourText: "نصّك", toAnalyse: "النص المراد تحليله", placeholder: "اكتب نصك أو الصقه هنا…", statistics: "الإحصاءات", copyResults: "نسخ النتائج",
    words: "الكلمات", characters: "الأحرف", noSpacesLong: "الأحرف (دون مسافات)", noSpaces: "دون مسافات", sentences: "الجمل", paragraphs: "الفقرات", lines: "الأسطر",
    reading: "وقت القراءة", speaking: "وقت الإلقاء", repeated: "الكلمات الأكثر تكرارًا", start: "ابدأ الكتابة لترى الإحصاءات تتحدّث مباشرة.",
    duration: (s: string) => s.replace(/(\d+) min/, "$1 د").replace(/(\d+) sec/, "$1 ث"),
  },
};

const fmt = new Intl.NumberFormat("en-US");

export default function WordCounter() {
  const t = strings[useLocale()];
  const ui = useMessages().ui;
  const dur = (m: number) => t.duration(formatDuration(m));
  const [text, setText] = useState("");
  const stats = useMemo(() => analyzeText(text), [text]);
  const summary = [
    `${t.words}: ${fmt.format(stats.words)}`,
    `${t.characters}: ${fmt.format(stats.characters)}`,
    `${t.noSpacesLong}: ${fmt.format(stats.charactersNoSpaces)}`,
    `${t.sentences}: ${fmt.format(stats.sentences)}`,
    `${t.paragraphs}: ${fmt.format(stats.paragraphs)}`,
    `${t.lines}: ${fmt.format(stats.lines)}`,
    `${t.reading}: ${dur(stats.readingMinutes)}`,
    `${t.speaking}: ${dur(stats.speakingMinutes)}`,
  ].join("\n");

  return (
    <Workspace className="lg:grid-cols-[3fr_2fr]">
      <Panel
        title={t.yourText}
        actions={
          <Button variant="ghost" size="sm" onClick={() => setText("")} disabled={!text}>
            <Icon name="rotate-ccw" size={16} /> {ui.clear}
          </Button>
        }
      >
        <Field label={<span className="sr-only">{t.toAnalyse}</span>}>
          {(p) => (
            <TextArea
              {...p}
              rows={14}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.placeholder}
              className="min-h-72 font-sans text-base"
              spellCheck
            />
          )}
        </Field>
      </Panel>

      <Panel title={t.statistics} actions={<CopyButton value={summary} label={t.copyResults} disabled={!text} />}>
        <dl className="grid grid-cols-2 gap-3" aria-live="polite">
          <Stat label={t.words} value={fmt.format(stats.words)} />
          <Stat label={t.characters} value={fmt.format(stats.characters)} />
          <Stat label={t.noSpaces} value={fmt.format(stats.charactersNoSpaces)} />
          <Stat label={t.sentences} value={fmt.format(stats.sentences)} />
          <Stat label={t.paragraphs} value={fmt.format(stats.paragraphs)} />
          <Stat label={t.lines} value={fmt.format(stats.lines)} />
        </dl>
        <dl className="grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
          <div>
            <dt className="text-muted">{t.reading}</dt>
            <dd className="font-semibold">{dur(stats.readingMinutes)}</dd>
          </div>
          <div>
            <dt className="text-muted">{t.speaking}</dt>
            <dd className="font-semibold">{dur(stats.speakingMinutes)}</dd>
          </div>
        </dl>
        {stats.topWords.length > 0 ? (
          <div className="border-t border-line pt-4">
            <h3 className="mb-2 text-sm font-medium">{t.repeated}</h3>
            <ul className="flex flex-wrap gap-2">
              {stats.topWords.map((w) => (
                <li key={w.word} className="rounded-full bg-surface-2 px-3 py-1 text-sm">
                  {w.word} <span className="text-muted">×{w.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          !text && <p className="border-t border-line pt-4 text-sm text-muted">{t.start}</p>
        )}
      </Panel>
    </Workspace>
  );
}
