"use client";

import Link from "@/components/ui/locale-link";
import { useRouter } from "next/navigation";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { localizeHref } from "@/lib/i18n";
import { useId, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/components/ui/cx";
import { searchTools } from "@/lib/search";
import type { SearchItem } from "@/lib/tools/registry";

export interface SearchCategoryLink {
  name: string;
  slug: string;
}

interface Props {
  items: SearchItem[];
  categories: SearchCategoryLink[];
  /** Shown when the query is empty (dialog only). */
  suggestions?: SearchItem[];
  variant: "hero" | "dialog";
  autoFocus?: boolean;
  onNavigate?: () => void;
  placeholder?: string;
  inputId?: string;
}

export function SearchCombobox({ items, categories, suggestions, variant, autoFocus, onNavigate, placeholder, inputId }: Props) {
  const t = useMessages();
  const router = useRouter();
  const locale = useLocale();
  const uid = useId();
  const listId = `${uid}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const trimmed = query.trim();
  const results = useMemo(() => (trimmed ? searchTools(items, trimmed, 8) : (suggestions ?? [])), [items, trimmed, suggestions]);
  const showList = (variant === "dialog" || open) && (trimmed !== "" || (suggestions?.length ?? 0) > 0);
  const noResults = trimmed !== "" && results.length === 0;
  const active = results.length ? Math.min(activeIndex, results.length - 1) : -1;

  function go(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(localizeHref(href, locale));
  }

  function submit() {
    const item = active >= 0 ? results[active] : undefined;
    if (item && (trimmed || variant === "dialog")) go(`/tools/${item.slug}`);
    else if (trimmed) go(`/tools?q=${encodeURIComponent(trimmed)}`);
    else if (variant === "hero") go("/tools");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setOpen(true);
        if (results.length) setActiveIndex((active + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setOpen(true);
        if (results.length) setActiveIndex((active - 1 + results.length) % results.length);
        break;
      case "Home":
        if (showList && results.length) { e.preventDefault(); setActiveIndex(0); }
        break;
      case "End":
        if (showList && results.length) { e.preventDefault(); setActiveIndex(results.length - 1); }
        break;
      case "Enter": {
        if (e.nativeEvent.isComposing) return;
        e.preventDefault();
        submit();
        break;
      }
      case "Escape":
        if (variant === "hero" && open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Icon name="search" size={20} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showList && results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${uid}-opt-${active}` : undefined}
          aria-label={t.search.label}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus={autoFocus}
          enterKeyHint="search"
          placeholder={placeholder ?? t.search.placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={(e) => {
            // Keep the list open while interacting with it.
            if (!e.relatedTarget || !e.currentTarget.parentElement?.parentElement?.contains(e.relatedTarget as Node)) setOpen(false);
          }}
          onKeyDown={onKeyDown}
          className={cx(
            "w-full border border-line-strong bg-surface ps-12 text-base shadow-sm transition-shadow placeholder:text-muted focus-visible:border-accent focus-visible:shadow-[0_0_0_4px_var(--accent-soft)] focus-visible:outline-none",
            variant === "hero" ? "h-14 rounded-2xl pe-28 shadow-[var(--shadow-md)] sm:h-[3.75rem]" : "h-14 rounded-lg pe-12",
          )}
        />
        {query && (
          <button
            type="button"
            aria-label={t.search.clear}
            onClick={() => { setQuery(""); setActiveIndex(0); inputRef.current?.focus(); }}
            className={cx("absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg", variant === "hero" ? "end-16" : "end-2")}
          >
            <Icon name="x" size={18} />
          </button>
        )}
        {variant === "hero" && (
          <button
            type="button"
            aria-label={t.search.submit}
            onClick={submit}
            className="absolute end-2.5 top-1/2 grid h-10 w-12 -translate-y-1/2 place-items-center rounded-xl bg-accent text-accent-fg shadow-sm transition-colors hover:bg-accent-hover sm:h-11 sm:w-14"
          >
            <Icon name="arrow-right" size={20} />
          </button>
        )}
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {trimmed ? (results.length ? t.search.results(results.length) : t.search.noResultsAnnounce) : ""}
      </div>

      {showList && !noResults && (
        <div
          className={cx(
            "overflow-hidden rounded-lg border border-line bg-surface text-start",
            variant === "hero" ? "absolute inset-x-0 top-full z-30 mt-2 shadow-overlay" : "mt-3",
          )}
        >
          {!trimmed && <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-muted">{t.search.popular}</p>}
          <ul id={listId} role="listbox" aria-label={t.search.matching} className="max-h-[22rem] overflow-y-auto p-1.5">
            {results.map((r, i) => (
              <li
                key={r.id}
                id={`${uid}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseMove={() => i !== active && setActiveIndex(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(`/tools/${r.slug}`)}
                className={cx("flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5", i === active && "bg-accent-soft")}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface-2 text-accent-text">
                  <Icon name={r.icon} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {r.name}
                    {r.status !== "active" && <span className="ms-2 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">{r.status === "beta" ? t.common.beta : t.common.comingSoon}</span>}
                  </span>
                  <span className="block truncate text-sm text-muted">{r.description}</span>
                </span>
                <span className="hidden shrink-0 text-xs text-muted sm:block">{r.categoryName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* The listbox element must exist for aria-controls even when closed. */}
      {!(showList && !noResults) && <ul id={listId} role="listbox" aria-label={t.search.matching} hidden />}

      {noResults && (
        <div className={cx("rounded-lg border border-line bg-surface p-5 text-start", variant === "hero" ? "absolute inset-x-0 top-full z-30 mt-2 shadow-overlay" : "mt-3")}>
          <p className="font-medium">{t.search.noMatch(trimmed)}</p>
          <p className="mt-1 text-sm text-muted">{t.search.tryDifferent}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/categories/${c.slug}`}
                  onClick={() => onNavigate?.()}
                  className="inline-flex min-h-9 items-center rounded-full border border-line-strong px-3.5 text-sm hover:bg-surface-2"
                >
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/tools" onClick={() => onNavigate?.()} className="inline-flex min-h-9 items-center rounded-full bg-accent px-3.5 text-sm font-medium text-accent-fg hover:bg-accent-hover">
                {t.search.allTools}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
