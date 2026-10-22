import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

export function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumbs,
  compact,
  children,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  breadcrumbs?: Crumb[];
  /** Tighter header for tool pages so the workspace is visible sooner. */
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-line">
      <div className={compact ? "container-page pb-6 pt-6" : "container-page pb-10 pt-8 sm:pb-12 sm:pt-10"}>
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} compact={compact} />}
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className={compact ? "max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl" : "max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl"}>{title}</h1>
        {description && <p className={compact ? "mt-2 max-w-2xl text-base text-muted sm:text-lg" : "mt-4 max-w-2xl text-lg text-muted"}>{description}</p>}
        {children}
      </div>
    </div>
  );
}
