/** Password protection and unlocking, with the pdf-lib fork that supports encryption (loaded on demand). */
export type SecurityError = "wrong-password" | "needs-password" | "invalid" | "not-encrypted";

export class PdfSecurityError extends Error {
  constructor(public code: SecurityError) {
    super(code);
  }
}

const fork = () => import("@cantoo/pdf-lib");

/** Is the file encrypted, and does it open without a password (restrictions only)? */
export async function securityState(bytes: Uint8Array): Promise<"none" | "restricted" | "password"> {
  const { PDFDocument } = await fork();
  try {
    await PDFDocument.load(bytes, { updateMetadata: false });
    return "none";
  } catch (e) {
    if (!/encrypt/i.test(String((e as Error).message))) throw new PdfSecurityError("invalid");
  }
  try {
    await PDFDocument.load(bytes, { password: "", updateMetadata: false });
    return "restricted";
  } catch {
    return "password";
  }
}

export async function unlockPdf(bytes: Uint8Array, password: string): Promise<Uint8Array> {
  const { PDFDocument } = await fork();
  let doc;
  try {
    doc = await PDFDocument.load(bytes, { password, updateMetadata: false });
  } catch (e) {
    const msg = String((e as Error).message);
    if (/password/i.test(msg)) throw new PdfSecurityError(password ? "wrong-password" : "needs-password");
    throw new PdfSecurityError("invalid");
  }
  doc.setProducer("Artify Tools (tools.artifysols.com)");
  return doc.save({ useObjectStreams: true });
}

export interface ProtectOptions {
  userPassword: string;
  /** Allows changing permissions later; a random one is used when empty. */
  ownerPassword?: string;
  allowPrinting: boolean;
  allowCopying: boolean;
  allowEditing: boolean;
}

export async function protectPdf(bytes: Uint8Array, o: ProtectOptions): Promise<Uint8Array> {
  const { PDFDocument, PDFHeader } = await fork();
  let doc;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (e) {
    throw new PdfSecurityError(/encrypt/i.test(String((e as Error).message)) ? "needs-password" : "invalid");
  }
  // PDF 1.7 header → AES-128 encryption (instead of RC4 for older headers).
  doc.context.header = PDFHeader.forVersion(1, 7);
  const owner = o.ownerPassword || Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => b.toString(36)).join("");
  doc.encrypt({
    userPassword: o.userPassword,
    ownerPassword: owner,
    permissions: {
      printing: o.allowPrinting ? "highResolution" : false,
      copying: o.allowCopying,
      modifying: o.allowEditing,
      annotating: o.allowEditing,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: o.allowEditing,
    },
  });
  doc.setProducer("Artify Tools (tools.artifysols.com)");
  return doc.save({ useObjectStreams: false });
}
