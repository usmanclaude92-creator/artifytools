export interface PasswordOptions {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

export const MIN_LENGTH = 8;
export const MAX_LENGTH = 128;

const SETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
} as const;
const AMBIGUOUS = /[Il1O0o]/g;

export type RandomInt = (maxExclusive: number) => number;

/** Uniform integer in [0, max) from Web Crypto using rejection sampling (no modulo bias). */
export const secureRandomInt: RandomInt = (max) => {
  if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) throw new RangeError("max out of range");
  const limit = Math.floor(2 ** 32 / max) * max;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0]! < limit) return buf[0]! % max;
  }
};

export function activeSets(o: PasswordOptions): string[] {
  const sets: string[] = [];
  for (const key of ["lowercase", "uppercase", "digits", "symbols"] as const) {
    if (!o[key]) continue;
    const chars = o.excludeAmbiguous ? SETS[key].replace(AMBIGUOUS, "") : SETS[key];
    if (chars) sets.push(chars);
  }
  return sets;
}

export type PasswordOutcome = { ok: true; password: string; entropyBits: number } | { ok: false; error: string };

export function generatePassword(o: PasswordOptions, rand: RandomInt = secureRandomInt): PasswordOutcome {
  const sets = activeSets(o);
  if (sets.length === 0) return { ok: false, error: "Select at least one character type." };
  if (!Number.isInteger(o.length) || o.length < MIN_LENGTH || o.length > MAX_LENGTH) {
    return { ok: false, error: `Length must be between ${MIN_LENGTH} and ${MAX_LENGTH}.` };
  }
  const pool = sets.join("");
  const chars: string[] = sets.map((s) => s[rand(s.length)]!); // guarantee one of each selected type
  while (chars.length < o.length) chars.push(pool[rand(pool.length)]!);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return { ok: true, password: chars.join(""), entropyBits: estimateEntropy(o.length, pool.length) };
}

/** length × log2(pool). An estimate for random generation, not a guarantee. */
export function estimateEntropy(length: number, poolSize: number): number {
  return Math.round(length * Math.log2(Math.max(poolSize, 1)));
}

export function strengthLabel(bits: number): { label: string; level: 1 | 2 | 3 | 4 } {
  if (bits < 50) return { label: "Weak", level: 1 };
  if (bits < 70) return { label: "Fair", level: 2 };
  if (bits < 100) return { label: "Strong", level: 3 };
  return { label: "Very strong", level: 4 };
}
