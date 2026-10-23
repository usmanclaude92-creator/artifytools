import type { OcrParagraph } from "./text";

/** A simple Word file from OCR paragraphs, page by page. */
export async function paragraphsToDocx(pages: OcrParagraph[][]): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun } = await import("docx");
  const children = pages.flatMap((paras, pageIndex) =>
    (paras.length ? paras : [{ text: "", rtl: false }]).map(
      (p, i) =>
        new Paragraph({
          bidirectional: p.rtl || undefined,
          pageBreakBefore: pageIndex > 0 && i === 0 ? true : undefined,
          spacing: { after: 160 },
          children: [new TextRun({ text: p.text, rightToLeft: p.rtl || undefined })],
        }),
    ),
  );
  const doc = new Document({
    creator: "Artify Tools",
    styles: { default: { document: { run: { font: { ascii: "Calibri", hAnsi: "Calibri", cs: "Arial" }, size: 22, sizeComplexScript: 24 } } } },
    sections: [{ children }],
  });
  return Packer.toBlob(doc);
}
