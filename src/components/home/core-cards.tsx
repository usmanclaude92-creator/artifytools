"use client";

import { useState } from "react";
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
 * The core section cards: all the same height when closed, so titles, descriptions,
 * chips and links line up. "More" opens one card in place (the others keep their size).
 */
export function CoreCards({ cards, labels }: { cards: CoreCardData[]; labels: { more: string; less: string; comingSoon: string } }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ul className="mt-6 grid items-start gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const isOpen = open === c.id;
        const panel = `core-${c.id}-more`;
        return (
          <li key={c.id}>
            <article
              className={cx(
                "card card-interactive relative flex flex-col gap-3 p-5 sm:p-6 focus-within:ring-2 focus-within:ring-[var(--focus)]",
                isOpen && "ring-2 ring-[var(--accent)] shadow-[0_18px_50px_-12px_rgba(101,71,255,0.35)]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <IconTile name={c.icon} tone={c.tone} className="size-14 rounded-xl" size={26} />
                {c.soon && <Badge tone="warning">{labels.comingSoon}</Badge>}
              </div>
              <h3 className="line-clamp-2 md:min-h-[2.6em] text-[1.15rem] font-bold leading-[1.3] tracking-tight">
                <Link href={c.href} className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none">{c.name}</Link>
              </h3>
              {isOpen ? (
                <div id={panel} className="relative z-10 flex flex-col gap-3">
                  <p className="text-[0.93rem] leading-relaxed text-muted">{c.description}</p>
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
                </div>
              ) : (
                <>
                  <p className="line-clamp-3 md:min-h-[4.65em] text-[0.93rem] leading-[1.55] text-muted">{c.short}</p>
                  {/* One row of chips; any that don't fit wrap out of sight instead of being cut in half. */}
                  <ul className="relative z-10 flex h-[34px] flex-wrap gap-1.5 overflow-hidden pt-px">
                    {c.quick.map((q) => (
                      <li key={q.slug}><Link href={`/tools/${q.slug}`} className={chip}>{q.name}</Link></li>
                    ))}
                  </ul>
                </>
              )}
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-text">
                  {c.footer} <Icon name="arrow-right" size={14} />
                </span>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? panel : undefined}
                  aria-label={`${isOpen ? labels.less : labels.more}: ${c.name}`}
                  onClick={() => setOpen(isOpen ? null : c.id)}
                  className="relative z-10 inline-flex min-h-9 items-center gap-1 rounded-full border border-line bg-surface px-3 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent-text"
                >
                  {isOpen ? labels.less : labels.more}
                  <Icon name={isOpen ? "chevron-up" : "chevron-down"} size={15} />
                </button>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
