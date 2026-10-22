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
};

export function ToolWorkspace({ toolId }: { toolId: string }) {
  const Component = components[toolId];
  if (!Component) return null;
  return <Component />;
}

export function hasToolComponent(toolId: string): boolean {
  return toolId in components;
}
