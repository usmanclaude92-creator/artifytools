import type { ReactNode } from "react";
import { cx } from "./cx";
import { Icon, type IconName } from "./icon";
import type { Tone } from "@/lib/tools/tones";

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "accent" | "success" | "warning"; className?: string }) {
  const tones = {
    neutral: "bg-surface-2 text-muted",
    accent: "bg-accent-soft text-accent-text",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
  };
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function IconTile({ name, size = 22, className, tone = "violet" }: { name: IconName; size?: number; className?: string; tone?: Tone }) {
  return (
    <span className={cx("grid size-11 shrink-0 place-items-center rounded-md", `tile-${tone}`, className)}>
      <Icon name={name} size={size} />
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cx("max-w-2xl", className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 id={id} className="text-3xl font-semibold sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-lg text-muted">{description}</p>}
    </div>
  );
}
