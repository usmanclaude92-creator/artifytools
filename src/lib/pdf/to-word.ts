/** PDF → Word (.docx) in the browser: pdf.js reads positioned text, text-layout rebuilds paragraphs, docx writes the file. */
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { renderPage } from "./render";
import { bodySize, normalizeArabic, pageBlocks, type Block, type TextItem } from "./text-layout";

export interface PageText {
  width: number;
  height: number;
  items: TextItem[];
}

interface FontInfo {
  name?: string;
  bold?: boolean;
  black?: boolean;
  italic?: boolean;
}

export async function readPageText(doc: PDFDocumentProxy, pageNumber: number): Promise<PageText> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  // Loading the operator list makes pdf.js resolve the fonts, so we can tell bold and italic text apart.
  await page.getOperatorList().catch(() => null);
  const fonts = new Map<string, FontInfo>();
  const fontOf = (id: string): FontInfo => {
    if (!fonts.has(id)) {
      let f: FontInfo = {};
      try {
        if (page.commonObjs.has(id)) f = page.commonObjs.get(id) as FontInfo;
      } catch {
        /* not loaded */
      }
      fonts.set(id, f);
    }
    return fonts.get(id)!;
  };

  const items: TextItem[] = [];
  for (const raw of content.items) {
    if (!("str" in raw) || !raw.str) continue;
    const t = raw.transform as number[];
    const [vx, vy] = viewport.convertToViewportPoint(t[4]!, t[5]!);
    const size = Math.hypot(t[2]!, t[3]!) || Math.hypot(t[0]!, t[1]!) || 11;
    const f = fontOf(raw.fontName);
    const name = f.name ?? "";
    items.push({
      str: normalizeArabic(raw.str),
      x: vx!,
      y: vy!,
      width: raw.width,
      size,
      rtl: raw.dir === "rtl",
      bold: Boolean(f.bold || f.black || /bold|black|heavy|semibold|demi/i.test(name)),
      italic: Boolean(f.italic || /italic|oblique/i.test(name)),
    });
  }
  page.cleanup();
  return { width: viewport.width, height: viewport.height, items };
}

export interface ConvertSummary {
  pages: number;
  headings: number;
  paragraphs: number;
  /** Pages with no text (usually scans), added as pictures. */
  imagePages: number[];
}

const twip = (pt: number) => Math.round(pt * 20);
const halfPt = (pt: number) => Math.max(12, Math.round(pt * 2));

export async function pdfToDocx(doc: PDFDocumentProxy, opts: { pageBreaks: boolean; onProgress?: (done: number, total: number) => void }): Promise<{ blob: Blob; summary: ConvertSummary; preview: Block[] }> {
  const docx = await import("docx");
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } = docx;
  const total = doc.numPages;
  const pages: PageText[] = [];
  for (let p = 1; p <= total; p++) {
    pages.push(await readPageText(doc, p));
    opts.onProgress?.(p * 0.5, total);
  }
  const body = bodySize(pages.flatMap((p) => p.items));
  const first = pages[0]!;
  const allLefts = pages.flatMap((p) => p.items.map((i) => i.x));
  const marginPt = Math.min(90, Math.max(36, allLefts.length ? Math.min(...allLefts) : 72));
  const contentWidthPt = first.width - 2 * marginPt;

  const summary: ConvertSummary = { pages: total, headings: 0, paragraphs: 0, imagePages: [] };
  const preview: Block[] = [];
  const children: InstanceType<typeof Paragraph>[] = [];
  const headingLevels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3];

  for (const [index, page] of pages.entries()) {
    const breakBefore = opts.pageBreaks && index > 0;
    const blocks = pageBlocks(page.items, page.width, body);
    if (!blocks.length) {
      // No text on this page (usually a scan): keep it as a picture so nothing is lost.
      const img = await renderPage(doc, index + 1, { dpi: 150, format: "jpg", quality: 0.85 });
      const wPx = (contentWidthPt * 96) / 72;
      const hPx = wPx * (img.height / img.width);
      children.push(
        new Paragraph({
          pageBreakBefore: breakBefore,
          alignment: AlignmentType.CENTER,
          children: [new ImageRun({ type: "jpg", data: await img.blob.arrayBuffer(), transformation: { width: Math.round(wPx), height: Math.round(hPx) } })],
        }),
      );
      summary.imagePages.push(index + 1);
    }
    blocks.forEach((b, i) => {
      if (preview.length < 6) preview.push(b);
      if (b.kind === "heading") summary.headings++;
      else summary.paragraphs++;
      const size = halfPt(b.kind === "heading" ? b.size : Math.abs(b.size - body) < 1 ? body : b.size);
      children.push(
        new Paragraph({
          heading: b.kind === "heading" ? headingLevels[b.level - 1] : undefined,
          bidirectional: b.rtl || undefined,
          alignment: b.align === "center" ? AlignmentType.CENTER : undefined,
          pageBreakBefore: breakBefore && i === 0 && !summary.imagePages.includes(index + 1) ? true : undefined,
          spacing: { after: b.kind === "heading" ? 120 : 160 },
          children: b.runs.map(
            (r) =>
              new TextRun({
                text: r.text,
                bold: r.bold || undefined,
                italics: r.italic || undefined,
                rightToLeft: b.rtl || undefined,
                boldComplexScript: r.bold || undefined,
                italicsComplexScript: r.italic || undefined,
                size,
                sizeComplexScript: size,
                color: b.kind === "heading" ? "000000" : undefined,
              }),
          ),
        }),
      );
    });
    opts.onProgress?.(total * 0.5 + (index + 1) * 0.5, total);
  }

  if (!children.length) children.push(new Paragraph({ children: [] }));
  const document = new Document({
    creator: "Artify Tools",
    styles: { default: { document: { run: { font: { ascii: "Calibri", hAnsi: "Calibri", cs: "Arial" }, size: halfPt(body), sizeComplexScript: halfPt(body) } } } },
    sections: [
      {
        properties: { page: { size: { width: twip(first.width), height: twip(first.height) }, margin: { top: twip(54), bottom: twip(54), left: twip(marginPt), right: twip(marginPt) } } },
        children,
      },
    ],
  });
  const blob = await Packer.toBlob(document);
  return { blob, summary, preview };
}
