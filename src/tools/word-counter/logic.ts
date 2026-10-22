export interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingMinutes: number;
  speakingMinutes: number;
  topWords: { word: string; count: number }[];
}

export const READING_WPM = 238;
export const SPEAKING_WPM = 130;

const hasSegmenter = typeof Intl !== "undefined" && "Segmenter" in Intl;

function countGraphemes(text: string): number {
  if (hasSegmenter) {
    let n = 0;
    for (const _ of new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)) {
      void _;
      n++;
    }
    return n;
  }
  return Array.from(text).length;
}

// Scripts written without spaces between words need real segmentation.
const UNSPACED = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Khmer}\p{Script=Lao}\p{Script=Myanmar}]/u;

/**
 * Whitespace-delimited tokens (so "well-known" and "don't" are one word, as in
 * most word processors); tokens in unspaced scripts are segmented with Intl.Segmenter.
 */
function wordList(text: string): string[] {
  const out: string[] = [];
  for (const token of text.split(/\s+/)) {
    if (!/[\p{L}\p{N}]/u.test(token)) continue;
    if (hasSegmenter && UNSPACED.test(token)) {
      for (const s of new Intl.Segmenter(undefined, { granularity: "word" }).segment(token)) {
        if (s.isWordLike) out.push(s.segment);
      }
    } else {
      out.push(token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""));
    }
  }
  return out;
}

function countSentences(text: string): number {
  if (!text.trim()) return 0;
  if (hasSegmenter) {
    let n = 0;
    for (const s of new Intl.Segmenter(undefined, { granularity: "sentence" }).segment(text)) {
      if (s.segment.trim() && /[\p{L}\p{N}]/u.test(s.segment)) n++;
    }
    return n;
  }
  return text.split(/[.!?]+(?:\s|$)/).filter((s) => /[\p{L}\p{N}]/u.test(s)).length;
}

const STOP_WORDS = new Set(
  "a an and are as at be but by for from has have he her his i in is it its of on or she that the their they this to was we were will with you your".split(
    " ",
  ),
);

export function analyzeText(text: string): TextStats {
  const words = wordList(text);
  const counts = new Map<string, number>();
  for (const w of words) {
    const key = w.toLowerCase();
    if (key.length < 3 || STOP_WORDS.has(key) || /^\d+$/.test(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const topWords = [...counts.entries()]
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));

  const trimmed = text.trim();
  return {
    words: words.length,
    characters: countGraphemes(text),
    charactersNoSpaces: countGraphemes(text.replace(/\s/gu, "")),
    sentences: countSentences(text),
    paragraphs: trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0,
    lines: text === "" ? 0 : text.split(/\r\n|\r|\n/).length,
    readingMinutes: words.length / READING_WPM,
    speakingMinutes: words.length / SPEAKING_WPM,
    topWords,
  };
}

/** "under a minute", "1 min 30 sec", "12 min" */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0 sec";
  const totalSeconds = Math.round(minutes * 60);
  if (totalSeconds < 60) return `${Math.max(totalSeconds, 1)} sec`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return s && m < 10 ? `${m} min ${s} sec` : `${m} min`;
}
