/**
 * In-browser PDF compression. Most of a large PDF's size is photos and scans, so we
 * re-encode those images smaller (downscaled + JPEG) and leave text, fonts and vector
 * graphics untouched — the text stays sharp and selectable. The actual pixel encoding
 * is injected (a canvas in the browser), so everything else is unit-tested in Node.
 */
import type { PDFDocument as PDFDocumentType, PDFNumber as PDFNumberType, PDFRawStream as PDFRawStreamType, PDFRef } from "pdf-lib";
import { PdfError } from "./pdf";

export type CompressLevel = "light" | "balanced" | "strong";

export const LEVELS: Record<CompressLevel, { maxSide: number; quality: number }> = {
  light: { maxSide: 3000, quality: 0.82 },
  balanced: { maxSide: 2000, quality: 0.7 },
  strong: { maxSide: 1300, quality: 0.5 },
};

/** Only images at least this large (pixels) are worth re-encoding. */
const MIN_PIXELS = 160 * 160;
/** Keep the new image only if it saves at least this share of its bytes. */
const MIN_SAVING = 0.1;

export type EncoderInput =
  | { kind: "jpeg"; bytes: Uint8Array }
  | { kind: "raw"; rgba: Uint8ClampedArray; width: number; height: number };

/** Re-encodes an image as JPEG no larger than `maxSide` px on its longest side. */
export type JpegEncoder = (input: EncoderInput, maxSide: number, quality: number) => Promise<{ bytes: Uint8Array; width: number; height: number } | null>;

export interface CompressResult {
  bytes: Uint8Array;
  imagesFound: number;
  imagesCompressed: number;
}

/** Undoes PNG row predictors (DecodeParms /Predictor 10–15). Returns null for unsupported data. */
export function unpredictPng(data: Uint8Array, columns: number, colors: number, rows: number): Uint8Array | null {
  const bpp = colors;
  const rowLen = columns * colors;
  if (data.length < rows * (rowLen + 1)) return null;
  const out = new Uint8Array(rows * rowLen);
  for (let y = 0; y < rows; y++) {
    const filter = data[y * (rowLen + 1)]!;
    const src = y * (rowLen + 1) + 1;
    const dst = y * rowLen;
    for (let x = 0; x < rowLen; x++) {
      const raw = data[src + x]!;
      const a = x >= bpp ? out[dst + x - bpp]! : 0;
      const b = y > 0 ? out[dst - rowLen + x]! : 0;
      const c = x >= bpp && y > 0 ? out[dst - rowLen + x - bpp]! : 0;
      let v: number;
      switch (filter) {
        case 0: v = raw; break;
        case 1: v = raw + a; break;
        case 2: v = raw + b; break;
        case 3: v = raw + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v = raw + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: return null;
      }
      out[dst + x] = v & 0xff;
    }
  }
  return out;
}

/** Gray or RGB 8-bit samples → RGBA for a canvas. */
export function toRgba(samples: Uint8Array, colors: 1 | 3, width: number, height: number): Uint8ClampedArray | null {
  if (samples.length < width * height * colors) return null;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, j = 0; i < width * height; i++, j += colors) {
    out[i * 4] = samples[j]!;
    out[i * 4 + 1] = samples[colors === 3 ? j + 1 : j]!;
    out[i * 4 + 2] = samples[colors === 3 ? j + 2 : j]!;
    out[i * 4 + 3] = 255;
  }
  return out;
}

export async function compressPdf(input: Uint8Array, level: CompressLevel, encode: JpegEncoder, onProgress?: (fraction: number) => void): Promise<CompressResult> {
  const lib = await import("pdf-lib");
  const { PDFDocument, PDFName, PDFRawStream, PDFDict, PDFArray, PDFRef: Ref, decodePDFRawStream, EncryptedPDFError } = lib;
  let doc: PDFDocumentType;
  try {
    doc = await PDFDocument.load(input, { updateMetadata: false });
  } catch (err) {
    if (err instanceof EncryptedPDFError || /encrypt/i.test(String((err as Error)?.message))) throw new PdfError("encrypted");
    throw new PdfError("invalid");
  }
  const ctx = doc.context;
  const name = (n: string) => PDFName.of(n);
  const { maxSide, quality } = LEVELS[level];

  // Collect image XObjects first so progress can be reported.
  const images: { ref: PDFRef; stream: PDFRawStreamType }[] = [];
  for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
    if (obj instanceof PDFRawStream && obj.dict.get(name("Subtype")) === name("Image")) images.push({ ref, stream: obj });
  }

  let compressed = 0;
  for (let i = 0; i < images.length; i++) {
    const { ref, stream } = images[i]!;
    const d = stream.dict;
    try {
      const width = (d.lookup(name("Width")) as PDFNumberType | undefined)?.asNumber() ?? 0;
      const height = (d.lookup(name("Height")) as PDFNumberType | undefined)?.asNumber() ?? 0;
      const bpc = (d.lookup(name("BitsPerComponent")) as PDFNumberType | undefined)?.asNumber() ?? 8;
      const filterObj = d.lookup(name("Filter"));
      const filters = filterObj instanceof PDFArray ? filterObj.asArray().map((f) => f.toString()) : filterObj ? [filterObj.toString()] : [];
      if (d.get(name("ImageMask")) || width * height < MIN_PIXELS || bpc !== 8) continue;

      let source: EncoderInput | null = null;
      if (filters.length === 1 && filters[0] === "/DCTDecode") {
        // Only plain colour spaces: spot colours (Separation/DeviceN) and decode arrays would change appearance.
        const cs = d.lookup(name("ColorSpace"));
        const plain = cs === name("DeviceRGB") || cs === name("DeviceGray") || cs === name("DeviceCMYK") || (cs instanceof PDFArray && cs.lookup(0) === name("ICCBased"));
        if (!plain || d.get(name("Decode"))) continue;
        source = { kind: "jpeg", bytes: stream.contents };
      } else if (filters.length === 1 && filters[0] === "/FlateDecode") {
        const cs = d.lookup(name("ColorSpace"));
        let colors: 1 | 3 | null = null;
        if (cs === name("DeviceRGB")) colors = 3;
        else if (cs === name("DeviceGray")) colors = 1;
        else if (cs instanceof PDFArray && cs.lookup(0) === name("ICCBased")) {
          const n = (cs.lookup(1) as PDFRawStreamType).dict.lookup(name("N")) as PDFNumberType | undefined;
          colors = n?.asNumber() === 3 ? 3 : n?.asNumber() === 1 ? 1 : null;
        }
        if (!colors || d.get(name("Decode")) || d.get(name("Mask"))) continue;
        let samples = decodePDFRawStream(stream).decode();
        const parms = d.lookup(name("DecodeParms"));
        const predictor = parms instanceof PDFDict ? ((parms.lookup(name("Predictor")) as PDFNumberType | undefined)?.asNumber() ?? 1) : 1;
        if (predictor >= 10) {
          const un = unpredictPng(samples, width, colors, height);
          if (!un) continue;
          samples = un;
        } else if (predictor !== 1) continue;
        const rgba = toRgba(samples, colors, width, height);
        if (!rgba) continue;
        source = { kind: "raw", rgba, width, height };
      }
      if (!source) continue;

      const encoded = await encode(source, maxSide, quality);
      if (!encoded || encoded.bytes.length > stream.contents.length * (1 - MIN_SAVING)) continue;

      const dict = ctx.obj({
        Type: "XObject",
        Subtype: "Image",
        Width: encoded.width,
        Height: encoded.height,
        ColorSpace: "DeviceRGB",
        BitsPerComponent: 8,
        Filter: "DCTDecode",
        Length: encoded.bytes.length,
      });
      // Keep transparency and rendering hints; colour keys and decode arrays no longer apply.
      for (const key of ["SMask", "Interpolate", "Intent", "Metadata"]) {
        const v = d.get(name(key));
        if (v) dict.set(name(key), v);
      }
      const mask = d.get(name("Mask"));
      if (mask instanceof Ref) dict.set(name("Mask"), mask);
      ctx.assign(ref, PDFRawStream.of(dict, encoded.bytes));
      compressed++;
    } catch {
      // An image we can't handle is simply left as it was.
    } finally {
      onProgress?.((i + 1) / Math.max(images.length, 1));
      if (i % 3 === 2) await new Promise((r) => setTimeout(r, 0));
    }
  }
  onProgress?.(1);
  const bytes = await doc.save({ useObjectStreams: true });
  return { bytes, imagesFound: images.length, imagesCompressed: compressed };
}
