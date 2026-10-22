export type Base64Mode = "encode" | "decode";
export type TextOutcome = { ok: true; output: string } | { ok: false; error: string };

export interface Base64Options {
  urlSafe: boolean;
  padding: boolean;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function encodeBase64(text: string, o: Base64Options): string {
  let out = bytesToBase64(new TextEncoder().encode(text));
  if (o.urlSafe) out = out.replace(/\+/g, "-").replace(/\//g, "_");
  if (!o.padding) out = out.replace(/=+$/, "");
  return out;
}

export function decodeBase64(input: string): TextOutcome {
  let s = input.replace(/\s+/g, "");
  if (!s) return { ok: true, output: "" };
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const invalid = /[^A-Za-z0-9+/=]/.exec(s);
  if (invalid) return { ok: false, error: `Invalid character "${invalid[0]}" — Base64 uses only A–Z, a–z, 0–9, "+", "/" (or "-", "_") and "=".` };
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) return { ok: false, error: 'Padding "=" may only appear at the end (at most two).' };
  const unpadded = s.replace(/=+$/, "");
  if (unpadded.length % 4 === 1) return { ok: false, error: "The length is invalid — a trailing group of one character can't encode any data." };
  const padded = unpadded + "=".repeat((4 - (unpadded.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    return { ok: false, error: "This isn't valid Base64." };
  }
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  try {
    return { ok: true, output: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, error: "The data decoded successfully but isn't valid UTF-8 text — it may be binary data such as an image or file." };
  }
}
