"use client";

import Link from "@/components/ui/locale-link";
import { usePathname } from "next/navigation";
import { stripLocale } from "@/lib/i18n";
import { useEffect, useRef } from "react";
import { buttonClasses } from "@/components/ui/button";
import { cx } from "@/components/ui/cx";
import { Icon } from "@/components/ui/icon";
import { ThemeToggle } from "@/components/ui/theme";
import { SearchDialog } from "@/components/search/search-dialog";
import type { SearchCategoryLink } from "@/components/search/search-combobox";
import type { SearchItem } from "@/lib/tools/registry";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useMessages } from "@/components/i18n/locale-provider";
import { Logo } from "./logo";
import { primaryNav } from "./nav-links";

interface Props {
  items: SearchItem[];
  categories: SearchCategoryLink[];
  suggestions: SearchItem[];
}

export function Header({ items, categories, suggestions }: Props) {
  const pathname = stripLocale(usePathname());
  const menuRef = useRef<HTMLDialogElement>(null);
  const t = useMessages();

  // Close the mobile menu after any navigation.
  useEffect(() => {
    menuRef.current?.close();
  }, [pathname]);

  // "All Tools" is only current on the directory itself, not on every tool page under /tools.
  const isActive = (href: string) => pathname === href || (href !== "/tools" && pathname.startsWith(href + "/"));

  return (
    <header className="sticky top-0 z-header border-b border-line/80 bg-surface/85 backdrop-blur-lg supports-[backdrop-filter]:bg-surface/75">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" aria-label={t.common.homeAria} className="-ms-1 rounded-md p-1">
          <Logo priority />
        </Link>

        <nav aria-label={t.nav.primaryLabel} className="ms-6 hidden xl:block">
          <ul className="flex items-center gap-1">
            {primaryNav.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={cx(
                    "inline-flex min-h-10 items-center whitespace-nowrap rounded-md px-3 text-[0.95rem] font-medium transition-colors hover:text-fg",
                    isActive(l.href) ? "text-fg" : "text-muted",
                  )}
                >
                  {t.nav[l.key] as string}
                  {isActive(l.href) && <span className="sr-only">{t.common.currentPage}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ms-auto flex items-center gap-1 sm:gap-2">
          <SearchDialog items={items} categories={categories} suggestions={suggestions} />
          <span className="hidden sm:contents">
            <LanguageSwitcher />
            <ThemeToggle />
          </span>
          {/* With the full menu showing (xl), "All Tools" is already in it, so the button would only crowd the bar. */}
          <span className="hidden md:block xl:hidden">
            <Link href="/tools" className={buttonClasses({ size: "md", className: "rounded-full px-5 shadow-[0_8px_22px_-8px_rgba(124,58,237,0.65)]" })}>
              {t.nav.exploreTools} <Icon name="arrow-right" size={16} />
            </Link>
          </span>
          <button
            type="button"
            aria-label={t.nav.openMenu}
            aria-haspopup="dialog"
            onClick={() => menuRef.current?.showModal()}
            className="grid size-11 place-items-center rounded-md text-fg hover:bg-surface-2 xl:hidden"
          >
            <Icon name="menu" size={22} />
          </button>
        </div>
      </div>

      <dialog
        ref={menuRef}
        aria-label={t.nav.menu}
        onClick={(e) => { if (e.target === menuRef.current) menuRef.current?.close(); }}
        className="m-0 ms-auto h-dvh max-h-none w-[min(22rem,100vw)] max-w-none border-s border-line bg-canvas p-0 text-fg shadow-overlay backdrop:bg-black/50"
      >
        <div className="flex h-full flex-col p-5">
          <div className="flex items-center justify-between">
            <Logo />
            <button type="button" aria-label={t.nav.closeMenu} onClick={() => menuRef.current?.close()} className="grid size-11 place-items-center rounded-md hover:bg-surface-2">
              <Icon name="x" size={22} />
            </button>
          </div>
          <nav aria-label={t.nav.mobileLabel} className="mt-6 flex-1 overflow-y-auto">
            <ul className="flex flex-col gap-1">
              {primaryNav.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => menuRef.current?.close()}
                    aria-current={isActive(l.href) ? "page" : undefined}
                    className={cx("flex min-h-12 items-center justify-between rounded-md px-3 text-lg font-medium hover:bg-surface-2", isActive(l.href) && "bg-accent-soft text-accent-text")}
                  >
                    {t.nav[l.key] as string}
                    <Icon name="chevron-right" size={18} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {/* On phones the language and theme switches live here instead of the header bar. */}
          <div className="mb-4 flex items-center gap-2 border-t border-line pt-4 sm:hidden">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <Link href="/tools" onClick={() => menuRef.current?.close()} className={buttonClasses({ size: "lg", className: "w-full rounded-full" })}>
            {t.nav.exploreTools} <Icon name="arrow-right" size={17} />
          </Link>
        </div>
      </dialog>
    </header>
  );
}
