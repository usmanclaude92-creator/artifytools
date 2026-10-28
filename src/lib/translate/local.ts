/**
 * Translation in the browser: Helsinki-NLP Opus-MT models (Apache-2.0) run with Transformers.js on
 * WebAssembly. The text never leaves the device; only the model is downloaded (once, then cached).
 * Each direction is its own model; the list and pinned revisions are in models.ts.
 */
import { MODELS } from "./models";

export const TRANSFORMERS_VERSION = "4.3.1";

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

/** A hook for tests: when set, it supplies the translator for a model instead of downloading one. */
type TestHook = (model: string) => LocalTranslator | Promise<LocalTranslator>;

export async function createLocalTranslator(model: string, onStage: (s: Stage) => void, doneBytes = 0, allBytes = 0): Promise<LocalTranslator> {
  const hook = (globalThis as { __ARTIFY_TRANSLATE__?: TestHook }).__ARTIFY_TRANSLATE__;
  if (hook) return hook(model);

  const info = MODELS[model];
  if (!info) throw new Error(`No translation model for ${model}`);
  const { env, pipeline } = await import("@huggingface/transformers");
  env.allowLocalModels = false;
  const base = `/vendor/transformers-${TRANSFORMERS_VERSION}/`;
  const wasm = env.backends.onnx.wasm;
  if (wasm) {
    wasm.wasmPaths = { mjs: `${base}ort-wasm-simd-threaded.asyncify.mjs`, wasm: `${base}ort-wasm-simd-threaded.asyncify.wasm` };
    wasm.numThreads = 1;
  }

  // Several files download at once; add them up for one progress bar (across every model of a route).
  const files = new Map<string, { loaded: number; total: number }>();
  const progress_callback = (e: ProgressEvent) => {
    if (e.status !== "progress" || !e.file || !e.total) return;
    files.set(e.file, { loaded: e.loaded ?? 0, total: e.total });
    let loaded = 0;
    for (const f of files.values()) loaded += f.loaded;
    onStage({ kind: "download", loaded: doneBytes + Math.min(loaded, info.bytes), total: Math.max(allBytes, doneBytes + info.bytes) });
  };

  const run = await pipeline("translation", `Xenova/opus-mt-${model}`, { revision: info.revision, dtype: "q8", device: "wasm", progress_callback });
  onStage({ kind: "starting" });
  return {
    async translate(text) {
      const out = (await run(text, { max_new_tokens: 400 })) as { translation_text: string }[];
      return out[0]?.translation_text ?? "";
    },
  };
}

/** A translator for a route of models: each piece of text goes through them one after another. */
export async function createRoute(route: string[], onStage: (s: Stage) => void, engine: (model: string, doneBytes: number, allBytes: number) => Promise<LocalTranslator> = (m, d, a) => createLocalTranslator(m, onStage, d, a)): Promise<LocalTranslator> {
  const all = route.reduce((n, m) => n + (MODELS[m]?.bytes ?? 0), 0);
  const steps: LocalTranslator[] = [];
  let done = 0;
  for (const model of route) {
    steps.push(await engine(model, done, all));
    done += MODELS[model]?.bytes ?? 0;
  }
  return {
    async translate(text) {
      let out = text;
      for (const step of steps) out = await step.translate(out);
      return out;
    },
  };
}
