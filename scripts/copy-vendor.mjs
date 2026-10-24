// Copies browser-only assets from node_modules into public/vendor so they are served
// as static files from our own domain (versioned folders, so caches never mix releases).
import { copyFileSync, cpSync, mkdirSync, readFileSync } from "node:fs";

const nm = (p) => new URL(`../node_modules/${p}`, import.meta.url);
const version = (pkg) => JSON.parse(readFileSync(nm(`${pkg}/package.json`), "utf8")).version;
const dir = (name) => {
  const u = new URL(`../public/vendor/${name}/`, import.meta.url);
  mkdirSync(u, { recursive: true });
  return u;
};

// pdf.js: worker, character maps, standard fonts.
const pdf = dir(`pdfjs-${version("pdfjs-dist")}`);
copyFileSync(nm("pdfjs-dist/legacy/build/pdf.worker.min.mjs"), new URL("pdf.worker.min.mjs", pdf));
cpSync(nm("pdfjs-dist/cmaps/"), new URL("cmaps/", pdf), { recursive: true });
cpSync(nm("pdfjs-dist/standard_fonts/"), new URL("standard_fonts/", pdf), { recursive: true });

// Tesseract OCR: worker, LSTM engine (with and without SIMD), English and Arabic models.
const ocr = dir(`tesseract-${version("tesseract.js")}`);
copyFileSync(nm("tesseract.js/dist/worker.min.js"), new URL("worker.min.js", ocr));
for (const f of ["tesseract-core-simd-lstm.wasm.js", "tesseract-core-lstm.wasm.js"]) copyFileSync(nm(`tesseract.js-core/${f}`), new URL(f, ocr));
for (const lang of ["eng", "ara"]) copyFileSync(nm(`@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`), new URL(`${lang}.traineddata.gz`, ocr));

// ONNX Runtime Web (background removal): one engine with WebGPU and a WebAssembly fallback.
const ort = dir(`ort-${version("onnxruntime-web")}`);
for (const f of ["ort-wasm-simd-threaded.jsep.mjs", "ort-wasm-simd-threaded.jsep.wasm"]) copyFileSync(nm(`onnxruntime-web/dist/${f}`), new URL(f, ort));

// Transformers.js (text translator): the ONNX Runtime WebAssembly engine it ships with, served from our own domain.
const hf = dir(`transformers-${version("@huggingface/transformers")}`);
const hfOrt = (f) => nm(`@huggingface/transformers/node_modules/onnxruntime-web/dist/${f}`);
for (const f of ["ort-wasm-simd-threaded.asyncify.mjs", "ort-wasm-simd-threaded.asyncify.wasm"]) copyFileSync(hfOrt(f), new URL(f, hf));
