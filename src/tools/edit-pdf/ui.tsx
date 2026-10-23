"use client";

import { PdfAnnotator } from "@/components/pdf-editor/pdf-annotator";
import { fileRulesFor } from "@/lib/tools/file-spec";
import { meta } from "./meta";

const rules = fileRulesFor(meta.files!);

export default function Tool() {
  return <PdfAnnotator mode="edit" rules={rules} outputSuffix="edited" />;
}
