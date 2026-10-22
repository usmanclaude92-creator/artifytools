export type UrlMode = "encode" | "decode";
/** component → encodeURIComponent (encodes / ? & = #); full → encodeURI (keeps URL structure) */
export type UrlScope = "component" | "full";

export type TextOutcome = { ok: true; output: string } | { ok: false; error: string };

export function transformUrl(input: string, mode: UrlMode, scope: UrlScope, plusAsSpace = false): TextOutcome {
  try {
    if (mode === "encode") {
      return { ok: true, output: scope === "component" ? encodeURIComponent(input) : encodeURI(input) };
    }
    const prepared = plusAsSpace ? input.replace(/\+/g, " ") : input;
    return { ok: true, output: scope === "component" ? decodeURIComponent(prepared) : decodeURI(prepared) };
  } catch {
    return {
      ok: false,
      error:
        mode === "decode"
          ? 'This text contains an invalid percent-sequence (for example a "%" not followed by two hex digits, or bytes that aren\'t valid UTF-8).'
          : "This text contains an unpaired surrogate character and can't be encoded as UTF-8.",
    };
  }
}
