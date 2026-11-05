/** Read-only links: the whole plan travels inside the link (after the #), so nothing is stored on a server. */
import { sanitize, type PlannerData } from "./model";

export const SHARE_PARAM = "plan=";
/** Beyond this the link may be refused by chat apps and browsers; the file export is the safer way to share. */
export const SHARE_SOFT_LIMIT = 8000;

const toB64 = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64 = (text: string) => {
  const s = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
};

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const blob = new Blob([bytes.buffer as ArrayBuffer]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(blob).arrayBuffer());
}

/** Compact form of the plan: collapsed state is left out, empty fields are dropped. */
function slim(data: PlannerData) {
  return {
    v: 1,
    name: data.name,
    levels: data.levels,
    tags: data.tags,
    nodes: data.nodes.map((n) => ({ id: n.id, parent: n.parent, title: n.title, ...(n.note ? { note: n.note } : {}), ...(n.status !== "none" ? { status: n.status } : {}), ...(n.due ? { due: n.due } : {}), ...(n.tags.length ? { tags: n.tags } : {}) })),
  };
}

export async function encodeShare(data: PlannerData): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(slim(data)));
  if (typeof CompressionStream === "undefined") return `0.${toB64(raw)}`;
  return `1.${toB64(await pipe(raw, new CompressionStream("deflate-raw")))}`;
}

export async function decodeShare(token: string): Promise<PlannerData | null> {
  try {
    const kind = token.slice(0, 2);
    const body = fromB64(token.slice(2));
    let raw: Uint8Array;
    if (kind === "1.") {
      if (typeof DecompressionStream === "undefined") return null;
      raw = await pipe(body, new DecompressionStream("deflate-raw"));
    } else if (kind === "0.") raw = body;
    else return null;
    if (raw.length > 4_000_000) return null;
    return sanitize(JSON.parse(new TextDecoder().decode(raw)));
  } catch {
    return null;
  }
}

export async function shareLink(data: PlannerData, base: string): Promise<{ url: string; long: boolean }> {
  const token = await encodeShare(data);
  const url = `${base}#${SHARE_PARAM}${token}`;
  return { url, long: url.length > SHARE_SOFT_LIMIT };
}

/** The token in a page's hash, if there is one. */
export function tokenFromHash(hash: string): string | null {
  const h = hash.replace(/^#/, "");
  return h.startsWith(SHARE_PARAM) ? h.slice(SHARE_PARAM.length) : null;
}
