/**
 * Minimal exact decimal arithmetic on BigInt so money / percentage maths never
 * suffers from binary floating-point error (0.1 + 0.2 === 0.30000000000000004).
 * Rounding is "half away from zero", the convention used for invoices and tax.
 */
export class Decimal {
  private constructor(
    readonly unscaled: bigint,
    readonly scale: number,
  ) {}

  static of(unscaled: bigint, scale = 0): Decimal {
    return new Decimal(unscaled, scale);
  }

  static fromInt(n: number): Decimal {
    return new Decimal(BigInt(n), 0);
  }

  /**
   * Parses a plain decimal string. Accepts an optional sign, "." as the decimal
   * separator, and comma thousands separators in well-formed positions
   * ("1,234.56"). Returns null for anything else (no exponents, no "Infinity").
   */
  static parse(input: string): Decimal | null {
    let s = input.trim().replace(/[\s_]/g, "");
    if (!s || s.length > 40) return null;
    if (s.includes(",")) {
      if (!/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) return null;
      s = s.replace(/,/g, "");
    }
    const m = /^([+-])?(\d*)(?:\.(\d*))?$/.exec(s);
    if (!m) return null;
    const [, sign, intPart = "", frac = ""] = m;
    if (!intPart && !frac) return null;
    const digits = (intPart || "0") + frac;
    const value = BigInt(digits) * (sign === "-" ? -1n : 1n);
    return new Decimal(value, frac.length);
  }

  private static align(a: Decimal, b: Decimal): [bigint, bigint, number] {
    const scale = Math.max(a.scale, b.scale);
    return [
      a.unscaled * 10n ** BigInt(scale - a.scale),
      b.unscaled * 10n ** BigInt(scale - b.scale),
      scale,
    ];
  }

  add(o: Decimal): Decimal {
    const [x, y, scale] = Decimal.align(this, o);
    return new Decimal(x + y, scale);
  }

  sub(o: Decimal): Decimal {
    const [x, y, scale] = Decimal.align(this, o);
    return new Decimal(x - y, scale);
  }

  mul(o: Decimal): Decimal {
    return new Decimal(this.unscaled * o.unscaled, this.scale + o.scale);
  }

  /** Division rounded (half away from zero) to `places` decimals. Throws on divide-by-zero. */
  div(o: Decimal, places: number): Decimal {
    if (o.unscaled === 0n) throw new RangeError("Division by zero");
    const num = this.unscaled * 10n ** BigInt(o.scale + places);
    const den = o.unscaled * 10n ** BigInt(this.scale);
    return new Decimal(divRound(num, den), places);
  }

  neg(): Decimal {
    return new Decimal(-this.unscaled, this.scale);
  }

  abs(): Decimal {
    return this.unscaled < 0n ? this.neg() : this;
  }

  /** Round to `places` decimals (half away from zero). */
  round(places: number): Decimal {
    if (this.scale <= places) return this;
    const factor = 10n ** BigInt(this.scale - places);
    return new Decimal(divRound(this.unscaled, factor), places);
  }

  cmp(o: Decimal): -1 | 0 | 1 {
    const [x, y] = Decimal.align(this, o);
    return x < y ? -1 : x > y ? 1 : 0;
  }

  isZero(): boolean {
    return this.unscaled === 0n;
  }

  isNegative(): boolean {
    return this.unscaled < 0n;
  }

  /** Fixed-point string with exactly `places` decimals; optional thousands grouping. */
  toFixed(places: number, opts: { group?: boolean } = {}): string {
    const r = this.round(places);
    const negative = r.unscaled < 0n;
    let digits = (negative ? -r.unscaled : r.unscaled).toString();
    const need = r.scale + 1;
    if (digits.length < need) digits = "0".repeat(need - digits.length) + digits;
    // Pad out to the requested number of places.
    const padded = digits + "0".repeat(Math.max(0, places - r.scale));
    const intLen = padded.length - Math.max(places, r.scale);
    let intPart = padded.slice(0, intLen);
    const fracPart = padded.slice(intLen, intLen + places);
    if (opts.group) intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const body = places > 0 ? `${intPart}.${fracPart}` : intPart;
    const isZero = /^[0.,]*$/.test(body);
    return negative && !isZero ? `-${body}` : body;
  }
}

function divRound(num: bigint, den: bigint): bigint {
  const negative = num < 0n !== den < 0n;
  const n = num < 0n ? -num : num;
  const d = den < 0n ? -den : den;
  let q = n / d;
  if ((n % d) * 2n >= d) q += 1n;
  return negative ? -q : q;
}
