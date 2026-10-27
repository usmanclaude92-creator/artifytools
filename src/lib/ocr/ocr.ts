/** Browser OCR with Tesseract (WebAssembly). Engine and language models are served from our own domain. */
import type Tesseract from "tesseract.js";

export const TESSERACT_VERSION = "6.0.1";
const ASSETS = `/vendor/tesseract-${TESSERACT_VERSION}`;
export type OcrLang = "eng" | "ara";

/** One recognised word with its box in image pixels; `lineTop`/`lineBottom` are the box of the line it sits on. */
export interface OcrWord {
  text: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  lineTop: number;
  lineBottom: number;
  confidence: number;
}

export interface OcrEngine {
  recognize(image: Blob, opts: { pdf: boolean }): Promise<{ text: string; confidence: number; pdf: Uint8Array | null }>;
  /** Words with their positions, for rebuilding table rows from a scan. */
  recognizeWords(image: Blob): Promise<OcrWord[]>;
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
    async recognizeWords(image) {
      const { data } = await worker.recognize(image, {}, { blocks: true });
      const words: OcrWord[] = [];
      for (const block of data.blocks ?? []) {
        for (const para of block.paragraphs) {
          for (const line of para.lines) {
            for (const w of line.words) {
              const text = w.text.replace(/[\u200E\u200F\u202A-\u202E]/g, "").trim();
              if (!text) continue;
              words.push({ text, x0: w.bbox.x0, x1: w.bbox.x1, y0: w.bbox.y0, y1: w.bbox.y1, lineTop: line.bbox.y0, lineBottom: line.bbox.y1, confidence: w.confidence });
            }
          }
        }
      }
      return words;
    },
    terminate: () => worker.terminate().then(() => undefined),
  };
}
