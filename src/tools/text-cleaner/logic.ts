export interface CleanOptions {
  trimLines: boolean;
  collapseSpaces: boolean;
  removeBlankLines: boolean;
  collapseBlankLines: boolean;
  joinLines: boolean;
  straightenQuotes: boolean;
  removeInvisible: boolean;
  stripTags: boolean;
}

export const defaultCleanOptions: CleanOptions = {
  trimLines: true,
  collapseSpaces: true,
  removeBlankLines: false,
  collapseBlankLines: true,
  joinLines: false,
  straightenQuotes: false,
  removeInvisible: true,
  stripTags: false,
};

// Zero-width space/joiners, BOM, soft hyphen, word joiner, bidi marks.
const INVISIBLE = /[​-‏⁠﻿­‪-‮]/gu;

/** Text-only tag removal. The result is plain text and is never rendered as HTML. */
function stripTags(text: string): string {
  let prev: string;
  let out = text;
  do {
    prev = out;
    out = out.replace(/<\/?[a-zA-Z!][^<>]*>/g, "");
  } while (out !== prev);
  return out;
}

export function cleanText(input: string, o: CleanOptions): string {
  let t = input.replace(/\r\n?/g, "\n");
  if (o.removeInvisible) t = t.replace(INVISIBLE, "");
  if (o.stripTags) t = stripTags(t);
  if (o.straightenQuotes) {
    t = t.replace(/[‘’‚′]/g, "'").replace(/[“”„″]/g, '"');
    t = t.replace(/[–—]/g, "-").replace(/…/g, "...");
  }
  // Non-breaking and other exotic spaces → normal spaces
  t = t.replace(/[   -   　]/g, " ");
  let lines = t.split("\n");
  if (o.collapseSpaces) lines = lines.map((l) => l.replace(/[ \t]{2,}/g, " "));
  if (o.trimLines) lines = lines.map((l) => l.trim());
  if (o.removeBlankLines) lines = lines.filter((l) => l.trim() !== "");
  if (o.joinLines) {
    const joined = lines.filter((l) => l.trim() !== "").join(" ");
    return (o.collapseSpaces ? joined.replace(/ {2,}/g, " ") : joined).trim();
  }
  let out = lines.join("\n");
  if (o.collapseBlankLines) out = out.replace(/\n{3,}/g, "\n\n");
  return o.trimLines ? out.trim() : out;
}
