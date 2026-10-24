/**
 * Translation in the browser: Helsinki-NLP Opus-MT models (Apache-2.0) run with Transformers.js on
 * WebAssembly. The text never leaves the device; only the model is downloaded (once, then cached).
 * Each direction is its own model, so every language pair is listed here explicitly.
 */

export type LocalLanguage = "ar" | "en";
export type LocalPair = "ar-en" | "en-ar";

interface PairInfo {
  source: LocalLanguage;
  target: LocalLanguage;
  model: string;
  /** Pinned to an exact revision so the files can never change under us. */
  revision: string;
  /** Approximate download (8-bit weights, tokenizer and config), for the "first use" notice. */
  bytes: number;
}

export const LOCAL_PAIRS: Record<LocalPair, PairInfo> = {
  "ar-en": { source: "ar", target: "en", model: "Xenova/opus-mt-ar-en", revision: "09c7556866400dcc53562ba8d7035119e7d9a2c1", bytes: 118_000_000 },
  "en-ar": { source: "en", target: "ar", model: "Xenova/opus-mt-en-ar", revision: "034a684356c19021a187cda4d7f823298b913921", bytes: 118_000_000 },
};

export const TRANSFORMERS_VERSION = "4.3.1";

export function pairFor(source: LocalLanguage): LocalPair {
  return source === "ar" ? "ar-en" : "en-ar";
}

export type Stage = { kind: "download"; loaded: number; total: number } | { kind: "starting" };

export interface LocalTranslator {
  translate(text: string): Promise<string>;
}

interface ProgressEvent {
  status: string;
  file?: string;
  loaded?: number;
  total?: number;
}

export async function createLocalTranslator(pair: LocalPair, onStage: (s: Stage) => void): Promise<LocalTranslator> {
  const info = LOCAL_PAIRS[pair];
  const { env, pipeline } = await import("@huggingface/transformers");
  env.allowLocalModels = false;
  const base = `/vendor/transformers-${TRANSFORMERS_VERSION}/`;
  const wasm = env.backends.onnx.wasm;
  if (wasm) {
    wasm.wasmPaths = { mjs: `${base}ort-wasm-simd-threaded.asyncify.mjs`, wasm: `${base}ort-wasm-simd-threaded.asyncify.wasm` };
    wasm.numThreads = 1;
  }

  // Several files download at once; add them up for one progress bar.
  const files = new Map<string, { loaded: number; total: number }>();
  const progress_callback = (e: ProgressEvent) => {
    if (e.status !== "progress" || !e.file || !e.total) return;
    files.set(e.file, { loaded: e.loaded ?? 0, total: e.total });
    let loaded = 0;
    let total = 0;
    for (const f of files.values()) {
      loaded += f.loaded;
      total += f.total;
    }
    onStage({ kind: "download", loaded, total: Math.max(total, info.bytes) });
  };

  const run = await pipeline("translation", info.model, { revision: info.revision, dtype: "q8", device: "wasm", progress_callback });
  onStage({ kind: "starting" });
  return {
    async translate(text) {
      const out = (await run(text, { max_new_tokens: 400 })) as { translation_text: string }[];
      return out[0]?.translation_text ?? "";
    },
  };
}
