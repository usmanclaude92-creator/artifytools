"use client";

import type { ReactNode } from "react";
import { CopyButton } from "@/components/ui/actions";
import { cx } from "@/components/ui/cx";
import { useMessages } from "@/components/i18n/locale-provider";

/** Two-column workspace on desktop (input | output), single column on mobile. */
export function Workspace({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("grid gap-5 lg:grid-cols-2", className)}>{children}</div>;
}

export function Panel({
  title,
  actions,
  children,
  className,
  as: Tag = "section",
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  as?: "section" | "div";
}) {
  return (
    <Tag className={cx("card flex min-w-0 flex-col gap-4 p-5 sm:p-6", className)} aria-label={title}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </Tag>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-md bg-surface-2 px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight">{value}</dd>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function ResultRow({
  label,
  value,
  copyLabel,
  emphasis,
}: {
  label: string;
  value: string;
  copyLabel?: string;
  emphasis?: boolean;
}) {
  const m = useMessages().ui;
  return (
    <div className={cx("flex items-center justify-between gap-3 rounded-md px-4 py-3", emphasis ? "bg-accent-soft" : "bg-surface-2")}>
      <div className="min-w-0">
        <div className="text-sm text-muted">{label}</div>
        <div className={cx("font-semibold tabular-nums [overflow-wrap:anywhere]", emphasis ? "text-2xl" : "text-lg")}>{value}</div>
      </div>
      <CopyButton value={value} ariaLabel={m.copyAria(copyLabel ?? label)} />
    </div>
  );
}

/** Placeholder shown before the user has provided input. */
export function IdleHint({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-md border border-dashed border-line-strong px-4 py-8 text-center text-sm text-muted">
      {children}
    </div>
  );
}
