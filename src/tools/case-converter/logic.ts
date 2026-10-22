export type CaseMode =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "alternating";

export const caseModes: { id: CaseMode; label: string; example: string }[] = [
  { id: "upper", label: "UPPER CASE", example: "HELLO WORLD" },
  { id: "lower", label: "lower case", example: "hello world" },
  { id: "title", label: "Title Case", example: "Hello World" },
  { id: "sentence", label: "Sentence case", example: "Hello world" },
  { id: "camel", label: "camelCase", example: "helloWorld" },
  { id: "pascal", label: "PascalCase", example: "HelloWorld" },
  { id: "snake", label: "snake_case", example: "hello_world" },
  { id: "kebab", label: "kebab-case", example: "hello-world" },
  { id: "constant", label: "CONSTANT_CASE", example: "HELLO_WORLD" },
  { id: "alternating", label: "aLtErNaTiNg", example: "hElLo WoRlD" },
];

const SMALL_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "per", "the", "to", "vs", "via",
]);

/** Splits identifiers and phrases into lowercase words ("fooBar-baz qux" → foo bar baz qux). */
export function splitWords(text: string): string[] {
  return text
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1 $2")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

const cap = (w: string) => (w ? w[0]!.toUpperCase() + w.slice(1) : w);

function titleCase(text: string): string {
  let first = true;
  return text
    .toLowerCase()
    .replace(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu, (word, offset: number) => {
      const isFirst = first;
      first = false;
      const after = text.slice(offset + word.length).trim();
      const isLast = after === "";
      if (!isFirst && !isLast && SMALL_WORDS.has(word)) return word;
      return cap(word);
    });
}

function sentenceCase(text: string): string {
  const lower = text.toLowerCase();
  return lower.replace(/(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu, (_m, lead: string, ch: string) => lead + ch.toUpperCase());
}

export function convertCase(text: string, mode: CaseMode): string {
  switch (mode) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return titleCase(text);
    case "sentence":
      return sentenceCase(text);
    case "camel": {
      const w = splitWords(text);
      return w.map((x, i) => (i === 0 ? x : cap(x))).join("");
    }
    case "pascal":
      return splitWords(text).map(cap).join("");
    case "snake":
      return splitWords(text).join("_");
    case "kebab":
      return splitWords(text).join("-");
    case "constant":
      return splitWords(text).join("_").toUpperCase();
    case "alternating": {
      let i = 0;
      return Array.from(text)
        .map((ch) => {
          if (!/\p{L}/u.test(ch)) return ch;
          return i++ % 2 === 0 ? ch.toLowerCase() : ch.toUpperCase();
        })
        .join("");
    }
  }
}
