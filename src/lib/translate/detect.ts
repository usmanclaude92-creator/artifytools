/** Guessing the language of a text from its letters and common words (pure, unit-tested). */
import type { Lang } from "./languages";

const count = (text: string, re: RegExp) => text.match(re)?.length ?? 0;

const WORDS: Partial<Record<Lang, string>> = {
  en: "the and of to in is that it for with as was on are this be by at from or have not you we they which",
  fr: "le la les de des du et est en un une que qui pour dans pas sur au avec ce il elle nous vous sont plus par",
  de: "der die das und ist nicht ein eine zu den von mit sich auf für dem im auch es wir sie ich aber wie oder",
  es: "el la los las de que y en un una es por con para no se su al lo como más pero sus este esta del son",
  it: "il lo la gli le di che e è un una per con non si da come più ma sono del della nel anche questo",
  nl: "de het een en van ik te dat die in is niet op aan met als voor zijn er maar om ook dan wij ze",
  sv: "och i att det som en på är av för med till den har de inte om ett men var jag vi sig så",
  da: "og i at det er en til på af for med som den har de ikke om et men var jeg vi sig så",
  fi: "ja on ei että se oli hän mutta kun tai niin myös ovat olla joka sen kuin vain",
  pl: "i w nie na to się z do że jest jak ale po co tak za od przez dla czy już",
  cs: "a v se na je že s z do to by jak ale pro od po tak už jsou být",
  hu: "a az és hogy nem egy is van volt meg de már ez mint csak még el",
  ro: "și în de la cu nu un o pe care este se că pentru mai din sunt dar ca",
  tr: "ve bir bu için ile da de çok daha gibi ama var olan ne kadar değil ben sen",
  id: "yang dan di dari ini itu untuk dengan tidak akan pada adalah ke juga sebagai atau oleh kami kita",
  vi: "và của là có không được một những trong cho các này với để khi đã",
};
const STOP: [Lang, Set<string>][] = Object.entries(WORDS).map(([l, w]) => [l as Lang, new Set(w!.split(" "))]);

/** Letters that point at one Latin-script language over the others. */
const HINTS: [Lang, RegExp][] = [
  ["vi", /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỷỹỵ]/giu],
  ["pl", /[ąćęłńśźż]/giu],
  ["cs", /[ěščřžýůďťň]/giu],
  ["hu", /[őű]/giu],
  ["ro", /[ăâîșțşţ]/giu],
  ["tr", /[ğışİ]/giu],
  ["de", /[äöüß]/giu],
  ["fi", /[äö]/giu],
  ["es", /[ñ¿¡]/giu],
  ["fr", /[àâçéèêëîïôûùœ]/giu],
];

/**
 * The most likely language of `text`, limited to `allowed`. Scripts decide Arabic, Chinese, Japanese, Korean,
 * Hindi, Thai and Cyrillic; for Latin-script text the common words and accents are counted.
 * Returns null when there is nothing to go on.
 */
export function detectLanguage(text: string, allowed: readonly Lang[]): Lang | null {
  const sample = text.slice(0, 4000);
  const ok = (l: Lang) => allowed.includes(l);
  const arabic = count(sample, /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g);
  const han = count(sample, /[一-鿿]/g);
  const kana = count(sample, /[぀-ヿ]/g);
  const hangul = count(sample, /[가-힯]/g);
  const deva = count(sample, /[ऀ-ॿ]/g);
  const thai = count(sample, /[฀-๿]/g);
  const cyr = count(sample, /[Ѐ-ӿ]/g);
  const latin = count(sample, /[A-Za-zÀ-ɏḀ-ỿ]/g);
  const top = Math.max(arabic, han + kana, hangul, deva, thai, cyr, latin);
  if (top === 0) return null;
  if (top === arabic) return ok("ar") ? "ar" : null;
  if (top === han + kana) return kana > han * 0.1 && ok("ja") ? "ja" : ok("zh") ? "zh" : null;
  if (top === hangul) return ok("ko") ? "ko" : null;
  if (top === deva) return ok("hi") ? "hi" : null;
  if (top === thai) return ok("th") ? "th" : null;
  if (top === cyr) return count(sample, /[іїєґІЇЄҐ]/g) > 0 && ok("uk") ? "uk" : ok("ru") ? "ru" : ok("uk") ? "uk" : null;

  const words = sample.toLowerCase().match(/[\p{L}']+/gu) ?? [];
  const scores = new Map<Lang, number>();
  for (const [lang, set] of STOP) {
    if (!ok(lang)) continue;
    scores.set(lang, words.filter((w) => set.has(w)).length / Math.max(words.length, 1));
  }
  for (const [lang, re] of HINTS) if (ok(lang)) scores.set(lang, (scores.get(lang) ?? 0) + (count(sample, re) / Math.max(latin, 1)) * 2.5);
  const best = [...scores.entries()].sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0.02 ? best[0] : ok("en") ? "en" : null;
}
