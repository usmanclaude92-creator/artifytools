"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

function ToolSkeleton() {
  return (
    <div className="grid animate-pulse gap-5 lg:grid-cols-2" aria-hidden="true">
      <div className="card h-80 bg-surface-2" />
      <div className="card h-80 bg-surface-2" />
    </div>
  );
}

const load = (loader: () => Promise<{ default: ComponentType }>) =>
  dynamic(loader, { loading: () => <ToolSkeleton /> });

/**
 * Maps a tool id to its (code-split) workspace component. Each tool's JavaScript
 * is only downloaded on its own page. Register new tools here.
 */
const components: Record<string, ComponentType> = {
  "word-counter": load(() => import("@/tools/word-counter/ui")),
  "case-converter": load(() => import("@/tools/case-converter/ui")),
  "text-cleaner": load(() => import("@/tools/text-cleaner/ui")),
  "remove-duplicate-lines": load(() => import("@/tools/remove-duplicate-lines/ui")),
  "percentage-calculator": load(() => import("@/tools/percentage-calculator/ui")),
  "vat-calculator": load(() => import("@/tools/vat-calculator/ui")),
  "discount-calculator": load(() => import("@/tools/discount-calculator/ui")),
  "json-formatter": load(() => import("@/tools/json-formatter/ui")),
  "url-encoder-decoder": load(() => import("@/tools/url-encoder-decoder/ui")),
  "base64-encoder-decoder": load(() => import("@/tools/base64-encoder-decoder/ui")),
  "uuid-generator": load(() => import("@/tools/uuid-generator/ui")),
  "password-generator": load(() => import("@/tools/password-generator/ui")),
  "qr-code-generator": load(() => import("@/tools/qr-code-generator/ui")),
  "date-difference": load(() => import("@/tools/date-difference/ui")),
  "color-converter": load(() => import("@/tools/color-converter/ui")),
  "ai-text-summarizer": load(() => import("@/tools/ai-text-summarizer/ui")),
  "merge-pdf": load(() => import("@/tools/merge-pdf/ui")),
  "split-pdf": load(() => import("@/tools/split-pdf/ui")),
  "jpg-to-pdf": load(() => import("@/tools/jpg-to-pdf/ui")),
  "compress-pdf": load(() => import("@/tools/compress-pdf/ui")),
  "compress-image": load(() => import("@/tools/compress-image/ui")),
  "amount-in-words": load(() => import("@/tools/amount-in-words/ui")),
  "cheque-printer": load(() => import("@/tools/cheque-printer/ui")),
  "pdf-to-jpg": load(() => import("@/tools/pdf-to-jpg/ui")),
  "resize-image": load(() => import("@/tools/resize-image/ui")),
  "crop-image": load(() => import("@/tools/crop-image/ui")),
  "pdf-to-word": load(() => import("@/tools/pdf-to-word/ui")),
  "word-to-pdf": load(() => import("@/tools/word-to-pdf/ui")),
  "image-to-text": load(() => import("@/tools/image-to-text/ui")),
  "translate-pdf": load(() => import("@/tools/translate-pdf/ui")),
  "text-translator": load(() => import("@/tools/text-translator/ui")),
  "remove-background": load(() => import("@/tools/remove-background/ui")),
  "excel-to-pdf": load(() => import("@/tools/excel-to-pdf/ui")),
  "pdf-to-excel": load(() => import("@/tools/pdf-to-excel/ui")),
  "rotate-pdf": load(() => import("@/tools/rotate-pdf/ui")),
  "organize-pdf": load(() => import("@/tools/organize-pdf/ui")),
  "add-page-numbers": load(() => import("@/tools/add-page-numbers/ui")),
  "watermark-pdf": load(() => import("@/tools/watermark-pdf/ui")),
  "unlock-pdf": load(() => import("@/tools/unlock-pdf/ui")),
  "protect-pdf": load(() => import("@/tools/protect-pdf/ui")),
  "end-of-service-calculator": load(() => import("@/tools/end-of-service-calculator/ui")),
  "hijri-date-converter": load(() => import("@/tools/hijri-date-converter/ui")),
  "bank-statement-converter": load(() => import("@/tools/bank-statement-converter/ui")),
  "sign-pdf": load(() => import("@/tools/sign-pdf/ui")),
  "edit-pdf": load(() => import("@/tools/edit-pdf/ui")),
  "image-converter": load(() => import("@/tools/image-converter/ui")),
};

export function ToolWorkspace({ toolId }: { toolId: string }) {
  const Component = components[toolId];
  if (!Component) return null;
  return <Component />;
}

export function hasToolComponent(toolId: string): boolean {
  return toolId in components;
}
