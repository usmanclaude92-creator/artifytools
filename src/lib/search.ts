/**
 * Lightweight local search over the tool registry. No external service.
 * Ranking: exact name > name prefix > name contains > tag/keyword phrase >
 * individual token matches in name/tags/keywords/category > description.
 * Every (non-filler) query token must match something, so results stay relevant.
 */

export interface SearchableTool {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  keywords: string[];
  categoryName: string;
}

const FILLER = new Set([
  "a", "an", "the", "to", "of", "for", "and", "or", "in", "on", "my", "me", "with", "from", "into",
  "between", "is", "i", "do", "need", "want", "can", "how", "what", "find", "get", "make", "use",
  "online", "free", "tool", "tools", "your", "this", "that", "some", "it",
  // Arabic
  "في", "من", "على", "إلى", "الى", "عن", "كيف", "أداة", "اداة", "أدوات", "ادوات", "الأداة", "مجاني", "مجانا", "مجانًا", "أونلاين", "اونلاين", "اريد", "أريد",
]);

/** Crude, symmetric stemmer so "dates"/"date", "calculate"/"calculator" meet. */
/** Folds Arabic spelling variants and drops the article "ال" so "الكلمات" matches "كلمات". */
function normalizeArabic(word: string): string {
  let w = word
    .replace(/[\u064B-\u0652\u0640]/g, "") // harakat and tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
  for (const prefix of ["وال", "بال", "لل", "ال"]) {
    if (w.startsWith(prefix) && w.length - prefix.length >= 2) {
      w = w.slice(prefix.length);
      break;
    }
  }
  return w;
}

export function stem(word: string): string {
  if (/[\u0600-\u06FF]/.test(word)) return normalizeArabic(word);
  let w = word.toLowerCase();
  if (w.length <= 3) return w;
  for (const suffix of ["ing", "ed", "er", "or", "es", "s", "e"]) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 3) {
      w = w.slice(0, -suffix.length);
      break;
    }
  }
  return w;
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

export function tokenizeQuery(query: string): string[] {
  const all = words(query);
  const meaningful = all.filter((w) => !FILLER.has(w));
  return (meaningful.length ? meaningful : all).map(stem);
}

function fieldMatches(fieldWords: string[], token: string): boolean {
  return fieldWords.some((w) => w === token || w.startsWith(token));
}

export function scoreTool(tool: SearchableTool, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const tokens = tokenizeQuery(q);
  if (!tokens.length) return 0;

  const name = tool.name.toLowerCase();
  const nameWords = words(tool.name).map(stem);
  const tagWords = words(tool.tags.join(" ")).map(stem);
  const kwWords = words(tool.keywords.join(" ")).map(stem);
  const catWords = words(tool.categoryName).map(stem);
  const descWords = words(tool.description).map(stem);

  let score = 0;
  if (name === q) score += 1000;
  else if (name.startsWith(q)) score += 700;
  else if (name.includes(q)) score += 500;

  const phraseHaystack = [...tool.tags, ...tool.keywords].map((s) => s.toLowerCase());
  if (phraseHaystack.some((p) => p === q)) score += 450;
  else if (phraseHaystack.some((p) => p.includes(q))) score += 250;

  for (const token of tokens) {
    let best = 0;
    if (fieldMatches(nameWords, token)) best = 100;
    else if (fieldMatches(tagWords, token)) best = 70;
    else if (fieldMatches(kwWords, token)) best = 60;
    else if (fieldMatches(catWords, token)) best = 40;
    else if (fieldMatches(descWords, token)) best = 20;
    if (best === 0) return 0; // every token must match
    score += best;
  }
  return score;
}

export function searchTools<T extends SearchableTool>(tools: T[], query: string, limit = Infinity): T[] {
  if (!query.trim()) return [];
  return tools
    .map((tool) => ({ tool, score: scoreTool(tool, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
    .slice(0, limit)
    .map((r) => r.tool);
}
