import type { FileRules } from "@/lib/files/rules";
import type { InputKind, ToolDefinition, ToolFileSpec } from "./types";

/** Picker rules for a file tool, so the drop zone and the tool page can never disagree. */
export function fileRulesFor(spec: ToolFileSpec): FileRules {
  return { accept: spec.accept, maxFileBytes: spec.maxFileBytes, maxFiles: spec.maxFiles, maxTotalBytes: spec.maxTotalBytes };
}

export function inputKindOf(tool: Pick<ToolDefinition, "files">): InputKind {
  const spec = tool.files;
  if (!spec) return "text";
  const accepts = spec.accept.map((a) => a.toLowerCase());
  const isPdf = accepts.some((a) => a === "application/pdf" || a === ".pdf");
  const isImage = accepts.some((a) => a.startsWith("image/") || /^\.(jpe?g|png|webp|gif|avif|heic|bmp|svg)$/.test(a));
  if (isPdf && !isImage) return "pdf";
  if (isImage && !isPdf) return "images";
  return "files";
}

/** "JPG, PNG or WebP" / "JPG وPNG أو WebP" style lists. */
export function formatList(items: string[], locale: "en" | "ar", conjunction: "or" | "and" = "or"): string {
  if (items.length <= 1) return items[0] ?? "";
  const word = locale === "ar" ? (conjunction === "or" ? "أو" : "و") : conjunction;
  const head = items.slice(0, -1).join(locale === "ar" ? "، " : ", ");
  const last = items[items.length - 1]!;
  return locale === "ar" ? `${head} ${word === "و" ? `و${last}` : `${word} ${last}`}` : `${head} ${word} ${last}`;
}
