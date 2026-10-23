/** Browser OCR with Tesseract (WebAssembly). Engine and language models are served from our own domain. */
import type Tesseract from "tesseract.js";

export const TESSERACT_VERSION = "6.0.1";
const ASSETS = `/vendor/tesseract-${TESSERACT_VERSION}`;
export type OcrLang = "eng" | "ara";

export interface OcrEngine {
  recognize(image: Blob, opts: { pdf: boolean }): Promise<{ text: string; confidence: number; pdf: Uint8Array | null }>;
  terminate(): Promise<void>;
}

/** Starts a worker for `langs`. `onProgress` gets (stage, 0–1) while models load and pages are read. */
export async function createOcr(langs: OcrLang[], onProgress: (stage: "loading" | "reading", fraction: number) => void): Promise<OcrEngine> {
  const { createWorker, OEM, PSM } = await import("tesseract.js");
  const worker: Tesseract.Worker = await createWorker(langs, OEM.LSTM_ONLY, {
    workerPath: `${ASSETS}/worker.min.js`,
    corePath: ASSETS,
    langPath: ASSETS,
    gzip: true,
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress("reading", m.progress);
      else onProgress("loading", m.progress);
    },
  });
  await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
  return {
    async recognize(image, { pdf }) {
      const { data } = await worker.recognize(image, { pdfTitle: "OCR", pdfTextOnly: false } as Partial<Tesseract.RecognizeOptions>, { text: true, pdf });
      // Tesseract wraps right-to-left lines in invisible direction marks; drop them.
      const text = (data.text ?? "").replace(/[\u200E\u200F\u202A-\u202E]/g, "").replace(/^[ \t]+/gm, "");
      return { text, confidence: data.confidence ?? 0, pdf: data.pdf ? new Uint8Array(data.pdf) : null };
    },
    terminate: () => worker.terminate().then(() => undefined),
  };
}
