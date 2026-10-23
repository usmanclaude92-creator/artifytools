"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/ui/locale-link";
import { Icon, type IconName } from "@/components/ui/icon";
import { Badge, IconTile } from "@/components/ui/misc";
import { cx } from "@/components/ui/cx";
import type { Tone } from "@/lib/tools/tones";

export interface CoreCardData {
  id: string;
  icon: IconName;
  tone: Tone;
  href: string;
  name: string;
  short: string;
  description: string;
  soon: boolean;
  /** Up to three tools shown while the card is closed. */
  quick: { slug: string; name: string }[];
  /** Every tool in the section, shown when the card is open. */
  all: { slug: string; name: string }[];
  /** Category pages linked when the card is open (for cards that span several). */
  categories: { href: string; label: string }[];
  footer: string;
}

const chip = "inline-flex min-h-8 items-center whitespace-nowrap rounded-full border border-line bg-surface-2 px-3 text-[0.82rem] font-medium text-fg transition-colors hover:border-accent hover:text-accent-text";

/**
 * The core section cards: all the same height, so titles, descriptions, chips and links
 * line up. "More" opens a panel over that card (and whatever is below it) with every tool
 * in the section; the row itself never moves. Escape or a click outside closes it.
 */
export function CoreCards({ cards, labels }: { cards: CoreCardData[]; labels: { more: string; close: string; comingSoon: string } }) {
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(null);
      root.current?.querySelector<HTMLButtonElement>(`[data-more="${open}"]`)?.focus();
    };
    const onDown = (e: MouseEvent) => {
      if (!(e.target as Element).closest(`[data-panel="${open}"],[data-more="${open}"]`)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    root.current?.querySelector<HTMLElement>(`[data-panel="${open}"] a`)?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <ul ref={root} className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const isOpen = open === c.id;
        const panel = `core-${c.id}-panel`;
        return (
          <li key={c.id} className={cx("relative", isOpen && "z-20")}>
            <article className="card card-interactive relative flex h-full flex-col gap-3 p-5 sm:p-6 focus-within:ring-2 focus-within:ring-[var(--focus)]">
              <div className="flex items-start justify-between gap-3">
                <IconTile name={c.icon} tone={c.tone} className="size-14 rounded-xl" size={26} />
                {c.soon && <Badge tone="warning">{labels.comingSoon}</Badge>}
              </div>
              <h3 className="line-clamp-2 text-[1.15rem] font-bold leading-[1.3] tracking-tight md:min-h-[2.6em]">
                <Link href={c.href} className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none">{c.name}</Link>
              </h3>
              <p className="line-clamp-3 text-[0.93rem] leading-[1.55] text-muted md:min-h-[4.65em]">{c.short}</p>
              {/* One row of chips; any that don't fit wrap out of sight instead of being cut in half. */}
              <ul className="relative z-10 flex h-[34px] flex-wrap gap-1.5 overflow-hidden pt-px">
                {c.quick.map((q) => (
                  <li key={q.slug}><Link href={`/tools/${q.slug}`} className={chip}>{q.name}</Link></li>
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-text">
                  {c.footer} <Icon name="arrow-right" size={14} />
                </span>
                <button
                  type="button"
                  data-more={c.id}
                  aria-expanded={isOpen}
                  aria-controls={panel}
                  aria-label={`${labels.more}: ${c.name}`}
                  onClick={() => setOpen(isOpen ? null : c.id)}
                  className="relative z-10 inline-flex min-h-9 items-center gap-1 rounded-full border border-line bg-surface px-3 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent-text"
                >
                  {labels.more} <span aria-hidden="true">+</span>
                </button>
              </div>
            </article>

            {isOpen && (
              <div
                id={panel}
                data-panel={c.id}
                role="region"
                aria-label={c.name}
                className="absolute inset-x-0 top-0 z-30 flex min-h-full flex-col gap-3 rounded-[var(--radius-lg,1rem)] border-2 border-[var(--accent)] bg-surface p-5 shadow-[0_24px_60px_-12px_rgba(30,20,80,0.35)] sm:p-6"
              >
                <p className="text-[1.15rem] font-bold leading-[1.3] tracking-tight">{c.name}</p>
                <ul className="flex flex-wrap gap-1.5">
                  {c.all.map((q) => (
                    <li key={q.slug}><Link href={`/tools/${q.slug}`} className={chip}>{q.name}</Link></li>
                  ))}
                </ul>
                {c.categories.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {c.categories.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className="inline-flex min-h-8 items-center gap-1 text-sm font-semibold text-accent-text hover:underline">
                          {l.label} <Icon name="arrow-right" size={14} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <Link href={c.href} className="inline-flex items-center gap-1 text-sm font-semibold text-accent-text hover:underline">
                    {c.footer} <Icon name="arrow-right" size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(null);
                      root.current?.querySelector<HTMLButtonElement>(`[data-more="${c.id}"]`)?.focus();
                    }}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line bg-surface px-3 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent-text"
                  >
                    {labels.close} <Icon name="x" size={15} />
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
