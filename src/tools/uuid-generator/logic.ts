export type UuidVersion = "v4" | "v7";
export type RandomBytes = (length: number) => Uint8Array;

export interface UuidOptions {
  version: UuidVersion;
  count: number;
  uppercase: boolean;
  hyphens: boolean;
}

export const MAX_UUID_COUNT = 100;

export const secureRandomBytes: RandomBytes = (length) => {
  const out = new Uint8Array(length);
  crypto.getRandomValues(out);
  return out;
};

function format(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function uuidV4(rng: RandomBytes = secureRandomBytes): string {
  const b = rng(16);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  return format(b);
}

/**
 * RFC 9562 UUIDv7: 48-bit Unix ms timestamp, 12-bit counter (rand_a) and 62 random bits.
 * Within a batch the counter increments so UUIDs sort in generation order.
 */
export function uuidV7Batch(count: number, now: number, rng: RandomBytes = secureRandomBytes): string[] {
  const out: string[] = [];
  let ts = now;
  let counter = ((rng(2)[0]! << 8) | rng(1)[0]!) & 0x7ff; // start low to leave headroom
  for (let n = 0; n < count; n++) {
    if (counter > 0xfff) {
      ts += 1;
      counter = 0;
    }
    const b = rng(16);
    // 48-bit timestamp
    const t = BigInt(ts);
    for (let i = 0; i < 6; i++) b[i] = Number((t >> BigInt(8 * (5 - i))) & 0xffn);
    b[6] = 0x70 | ((counter >> 8) & 0x0f);
    b[7] = counter & 0xff;
    b[8] = (b[8]! & 0x3f) | 0x80;
    out.push(format(b));
    counter++;
  }
  return out;
}

export function generateUuids(o: UuidOptions, rng: RandomBytes = secureRandomBytes, now = Date.now()): string[] {
  const count = Math.min(Math.max(Math.floor(o.count) || 1, 1), MAX_UUID_COUNT);
  const raw = o.version === "v7" ? uuidV7Batch(count, now, rng) : Array.from({ length: count }, () => uuidV4(rng));
  return raw.map((u) => {
    const v = o.hyphens ? u : u.replace(/-/g, "");
    return o.uppercase ? v.toUpperCase() : v;
  });
}
