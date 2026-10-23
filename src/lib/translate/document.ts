/** Reading a PDF's text structure for translation, and writing the translated Word file. */
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { readPageText } from "@/lib/pdf/to-word";
import { bodySize, pageBlocks } from "@/lib/pdf/text-layout";
import { RTL_LANGUAGES } from "./chunks";

export interface DocBlock {
  kind: "heading" | "paragraph";
  level: 1 | 2 | 3;
  text: string;
  center: boolean;
  /** The PDF page it came from (1-based). */
  page: number;
}

export async function readDocument(doc: PDFDocumentProxy, onProgress?: (done: number, total: number) => void): Promise<DocBlock[]> {
  const pages = [];
  for (let p = 1; p <= doc.numPages; p++) {
    pages.push(await readPageText(doc, p));
    onProgress?.(p, doc.numPages);
  }
  const body = bodySize(pages.flatMap((p) => p.items));
  return pages.flatMap((page, i) =>
    pageBlocks(page.items, page.width, body).map((b) => ({
      kind: b.kind,
      level: b.level,
      text: b.runs.map((r) => r.text).join("").replace(/\s+/g, " ").trim(),
      center: b.align === "center",
      page: i + 1,
    })),
  ).filter((b) => b.text);
}

export async function translatedDocx(blocks: DocBlock[], texts: string[], target: string, pageBreaks: boolean): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");
  const rtl = RTL_LANGUAGES.has(target);
  const levels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3];
  const children = blocks.map(
    (b, i) =>
      new Paragraph({
        heading: b.kind === "heading" ? levels[b.level - 1] : undefined,
        bidirectional: rtl || undefined,
        alignment: b.center ? AlignmentType.CENTER : undefined,
        pageBreakBefore: pageBreaks && i > 0 && blocks[i - 1]!.page !== b.page ? true : undefined,
        spacing: { after: b.kind === "heading" ? 120 : 160 },
        children: [new TextRun({ text: texts[i] ?? "", rightToLeft: rtl || undefined })],
      }),
  );
  const doc = new Document({
    creator: "Artify Tools",
    styles: { default: { document: { run: { font: { ascii: "Calibri", hAnsi: "Calibri", cs: "Arial", eastAsia: "Microsoft YaHei" }, size: 22, sizeComplexScript: 24 } } } },
    sections: [{ children: children.length ? children : [new Paragraph({ children: [] })] }],
  });
  return Packer.toBlob(doc);
}
