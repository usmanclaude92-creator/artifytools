/**
 * Background removal in the browser: ORMBG (Apache-2.0) run with ONNX Runtime Web,
 * on the GPU (WebGPU) when available, otherwise on the CPU (WebAssembly).
 * The image never leaves the device; only the model is downloaded, once, and cached.
 */
import type * as Ort from "onnxruntime-web";
import { alphaToMask, applyMask, keptFraction, MODEL_SIZE, toModelInput } from "./mask";

export const ORT_VERSION = "1.22.0";
/** Pinned to an exact revision so the file can never change under us. */
export const MODEL_URL = "https://huggingface.co/d30social/ormbg-ortweb/resolve/b66cbea6744d43dc4177649ec21000d9da71d142/onnx/model_fp16.onnx";
export const MODEL_BYTES = 88_100_000;
const CACHE = "artify-models-v1";

export type Stage = { kind: "download"; loaded: number; total: number } | { kind: "starting" } | { kind: "working" };

async function fetchModel(onStage: (s: Stage) => void): Promise<ArrayBuffer> {
  let cache: Cache | null = null;
  try {
    cache = await caches.open(CACHE);
    const hit = await cache.match(MODEL_URL);
    if (hit) return await hit.arrayBuffer();
  } catch {
    cache = null; // private mode or storage blocked: just download
  }
  const res = await fetch(MODEL_URL);
  if (!res.ok || !res.body) throw new Error("model-download");
  const total = Number(res.headers.get("content-length")) || MODEL_BYTES;
  const reader = res.body.getReader();
  const parts: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
    loaded += value.length;
    onStage({ kind: "download", loaded, total });
  }
  const bytes = new Uint8Array(loaded);
  let o = 0;
  for (const p of parts) {
    bytes.set(p, o);
    o += p.length;
  }
  try {
    await cache?.put(MODEL_URL, new Response(bytes, { headers: { "content-type": "application/octet-stream" } }));
  } catch {
    /* storage full: fine, we just download next time */
  }
  return bytes.buffer;
}

export interface Remover {
  backend: "webgpu" | "wasm";
  /** Returns the cut-out as an RGBA canvas at the image's own size, plus how much of the picture was kept. */
  cutout(bitmap: ImageBitmap): Promise<{ canvas: HTMLCanvasElement; kept: number }>;
}

export async function createRemover(onStage: (s: Stage) => void): Promise<Remover> {
  const ort = (await import("onnxruntime-web/webgpu")) as typeof Ort;
  ort.env.wasm.wasmPaths = `/vendor/ort-${ORT_VERSION}/`;
  ort.env.wasm.numThreads = typeof crossOriginIsolated !== "undefined" && crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
  const model = await fetchModel(onStage);
  onStage({ kind: "starting" });
  let session: Ort.InferenceSession;
  let backend: Remover["backend"] = "wasm";
  const hasGpu = typeof navigator !== "undefined" && "gpu" in navigator && (await (navigator as unknown as { gpu: { requestAdapter(): Promise<unknown> } }).gpu.requestAdapter().catch(() => null));
  try {
    if (!hasGpu) throw new Error("no-gpu");
    session = await ort.InferenceSession.create(model, { executionProviders: ["webgpu"] });
    backend = "webgpu";
  } catch {
    session = await ort.InferenceSession.create(model, { executionProviders: ["wasm"] });
  }

  return {
    backend,
    async cutout(bitmap) {
      onStage({ kind: "working" });
      // Model input: the picture squeezed to 1024×1024.
      const small = document.createElement("canvas");
      small.width = small.height = MODEL_SIZE;
      const sctx = small.getContext("2d", { willReadFrequently: true })!;
      sctx.drawImage(bitmap, 0, 0, MODEL_SIZE, MODEL_SIZE);
      const input = new ort.Tensor("float32", toModelInput(sctx.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE).data), [1, 3, MODEL_SIZE, MODEL_SIZE]);
      const result = await session.run({ [session.inputNames[0]!]: input });
      const alpha = result[session.outputNames[0]!]!.data as Float32Array;
      input.dispose();

      // Mask back to full size (smoothly scaled by the canvas), then into the image's alpha channel.
      sctx.putImageData(new ImageData(alphaToMask(alpha), MODEL_SIZE, MODEL_SIZE), 0, 0);
      const out = document.createElement("canvas");
      out.width = bitmap.width;
      out.height = bitmap.height;
      const octx = out.getContext("2d", { willReadFrequently: true })!;
      octx.imageSmoothingQuality = "high";
      octx.drawImage(small, 0, 0, out.width, out.height);
      const mask = octx.getImageData(0, 0, out.width, out.height);
      octx.clearRect(0, 0, out.width, out.height);
      octx.drawImage(bitmap, 0, 0);
      const pixels = octx.getImageData(0, 0, out.width, out.height);
      applyMask(pixels.data, mask.data);
      octx.putImageData(pixels, 0, 0);
      small.width = small.height = 0;
      return { canvas: out, kept: keptFraction(alpha) };
    },
  };
}
