"use client";

import type { ReactNode } from "react";
import { useMessages } from "@/components/i18n/locale-provider";
import { cx } from "./cx";
import { Icon, type IconName } from "./icon";

type Tone = "error" | "success" | "info" | "warning";

const tones: Record<Tone, { box: string; icon: IconName; label: string }> = {
  error: { box: "border-danger/40 bg-danger-soft text-danger", icon: "circle-alert", label: "Error" },
  success: { box: "border-success/40 bg-success-soft text-success", icon: "circle-check", label: "Success" },
  info: { box: "border-line bg-accent-soft text-fg", icon: "info", label: "Note" },
  warning: { box: "border-warning/40 bg-warning-soft text-warning", icon: "triangle-alert", label: "Warning" },
};

/**
 * Inline status message. Errors use role="alert" (announced immediately); everything
 * else uses role="status" (polite). Icon + label ensure meaning isn't colour-only.
 */
export function StatusMessage({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  const t = tones[tone];
  const label = useMessages().ui.tones[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cx("flex items-start gap-3 rounded-md border px-4 py-3 text-sm", t.box, className)}>
      <Icon name={t.icon} size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 text-fg">
        <span className="sr-only">{label}: </span>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({
  icon = "search",
  title,
  children,
  className,
}: {
  icon?: IconName;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center rounded-lg border border-dashed border-line-strong px-6 py-12 text-center", className)}>
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-surface-2 text-muted">
        <Icon name={icon} size={22} />
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children && <div className="mt-2 max-w-md text-muted">{children}</div>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  const m = useMessages().ui;
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-muted">
      <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      {label ?? m.loading}…
    </span>
  );
}
