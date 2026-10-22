/**
 * Images → PDF: page layout (pure, unit-tested) and document building with pdf-lib.
 * JPEGs are embedded as-is (no re-compression) unless they need rotating; other formats
 * arrive here already converted to PNG by the browser.
 */

export type PageSize = "fit" | "a4" | "letter";
export type Orientation = "auto" | "portrait" | "landscape";
export type Margin = "none" | "small" | "large";

export interface LayoutOptions {
  pageSize: PageSize;
  orientation: Orientation;
  margin: Margin;
}

/** Points (1/72 inch). */
const SIZES: Record<Exclude<PageSize, "fit">, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};
const MM = 72 / 25.4;
const MARGINS: Record<Margin, number> = { none: 0, small: 10 * MM, large: 20 * MM };
/** Images are treated as 96 dpi when the page follows the image size. */
const PX_TO_PT = 72 / 96;

export interface Placement {
  pageWidth: number;
  pageHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Where an image of `w`×`h` pixels goes on its page. The image is never stretched or cropped. */
export function layoutImage(w: number, h: number, o: LayoutOptions): Placement {
  const margin = MARGINS[o.margin];
  if (o.pageSize === "fit") {
    const width = w * PX_TO_PT;
    const height = h * PX_TO_PT;
    return { pageWidth: width + 2 * margin, pageHeight: height + 2 * margin, x: margin, y: margin, width, height };
  }
  const [short, long] = SIZES[o.pageSize];
  const landscape = o.orientation === "landscape" || (o.orientation === "auto" && w > h);
  const pageWidth = landscape ? long : short;
  const pageHeight = landscape ? short : long;
  const boxW = pageWidth - 2 * margin;
  const boxH = pageHeight - 2 * margin;
  const scale = Math.min(boxW / w, boxH / h);
  const width = w * scale;
  const height = h * scale;
  return { pageWidth, pageHeight, x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height };
}

/**
 * EXIF orientation of a JPEG (1–8), or 1 when absent. Phones store photos sideways and set
 * this flag; values 2–8 mean the pixels must be rotated/flipped before placing them.
 */
export function jpegOrientation(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 4 || view.getUint16(0) !== 0xffd8) return 1;
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    const marker = view.getUint16(offset);
    const size = view.getUint16(offset + 2);
    if (marker === 0xffe1 && offset + 10 <= bytes.length && view.getUint32(offset + 4) === 0x45786966) {
      const tiff = offset + 10;
      if (tiff + 8 > bytes.length) return 1;
      const little = view.getUint16(tiff) === 0x4949;
      const first = view.getUint32(tiff + 4, little);
      const dir = tiff + first;
      if (dir + 2 > bytes.length) return 1;
      const entries = view.getUint16(dir, little);
      for (let i = 0; i < entries; i++) {
        const entry = dir + 2 + i * 12;
        if (entry + 12 > bytes.length) return 1;
        if (view.getUint16(entry, little) === 0x0112) {
          const v = view.getUint16(entry + 8, little);
          return v >= 1 && v <= 8 ? v : 1;
        }
      }
      return 1;
    }
    if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) return 1; // start of scan: no EXIF ahead
    offset += 2 + size;
  }
  return 1;
}

export interface PreparedImage {
  format: "jpg" | "png";
  bytes: Uint8Array;
  width: number;
  height: number;
}

export async function buildImagePdf(images: PreparedImage[], options: LayoutOptions, onProgress?: (fraction: number) => void): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  for (let i = 0; i < images.length; i++) {
    const img = images[i]!;
    const embedded = img.format === "jpg" ? await doc.embedJpg(img.bytes) : await doc.embedPng(img.bytes);
    const place = layoutImage(img.width, img.height, options);
    const page = doc.addPage([place.pageWidth, place.pageHeight]);
    page.drawImage(embedded, { x: place.x, y: place.y, width: place.width, height: place.height });
    onProgress?.((i + 1) / images.length);
    await new Promise((r) => setTimeout(r, 0));
  }
  doc.setProducer("Artify Tools (tools.artifysols.com)");
  doc.setCreator("Artify Tools");
  return doc.save({ useObjectStreams: true });
}
