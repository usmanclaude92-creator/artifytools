"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { buttonClasses } from "@/components/ui/button";
import { cx } from "@/components/ui/cx";
import { Icon } from "@/components/ui/icon";
import { ThemeToggle } from "@/components/ui/theme";
import { SearchDialog } from "@/components/search/search-dialog";
import type { SearchCategoryLink } from "@/components/search/search-combobox";
import type { SearchItem } from "@/lib/tools/registry";
import { Logo } from "./logo";
import { primaryNav } from "./nav-links";

interface Props {
  items: SearchItem[];
  categories: SearchCategoryLink[];
  suggestions: SearchItem[];
}

export function Header({ items, categories, suggestions }: Props) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDialogElement>(null);

  // Close the mobile menu after any navigation.
  useEffect(() => {
    menuRef.current?.close();
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-header border-b border-line bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" aria-label="Artify Tools home" className="-ml-1 rounded-md p-1">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="ml-6 hidden lg:block">
          <ul className="flex items-center gap-1">
            {primaryNav.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={cx(
                    "inline-flex min-h-10 items-center rounded-md px-3 text-[0.95rem] font-medium transition-colors hover:text-fg",
                    isActive(l.href) ? "text-fg" : "text-muted",
                  )}
                >
                  {l.label}
                  {isActive(l.href) && <span className="sr-only"> (current page)</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <SearchDialog items={items} categories={categories} suggestions={suggestions} />
          <ThemeToggle />
          <span className="hidden md:block">
            <Link href="/tools" className={buttonClasses({ size: "md", className: "rounded-full px-5 shadow-[0_8px_22px_-8px_rgba(101,71,255,0.7)]" })}>
              Explore Tools <Icon name="arrow-right" size={16} />
            </Link>
          </span>
          <button
            type="button"
            aria-label="Open menu"
            aria-haspopup="dialog"
            onClick={() => menuRef.current?.showModal()}
            className="grid size-11 place-items-center rounded-md text-fg hover:bg-surface-2 lg:hidden"
          >
            <Icon name="menu" size={22} />
          </button>
        </div>
      </div>

      <dialog
        ref={menuRef}
        aria-label="Menu"
        onClick={(e) => { if (e.target === menuRef.current) menuRef.current?.close(); }}
        className="m-0 ml-auto h-dvh max-h-none w-[min(22rem,100vw)] max-w-none border-l border-line bg-canvas p-0 text-fg shadow-overlay backdrop:bg-black/50"
      >
        <div className="flex h-full flex-col p-5">
          <div className="flex items-center justify-between">
            <Logo />
            <button type="button" aria-label="Close menu" onClick={() => menuRef.current?.close()} className="grid size-11 place-items-center rounded-md hover:bg-surface-2">
              <Icon name="x" size={22} />
            </button>
          </div>
          <nav aria-label="Mobile" className="mt-6 flex-1 overflow-y-auto">
            <ul className="flex flex-col gap-1">
              {primaryNav.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => menuRef.current?.close()}
                    aria-current={isActive(l.href) ? "page" : undefined}
                    className={cx("flex min-h-12 items-center justify-between rounded-md px-3 text-lg font-medium hover:bg-surface-2", isActive(l.href) && "bg-accent-soft text-accent-text")}
                  >
                    {l.label}
                    <Icon name="chevron-right" size={18} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link href="/tools" onClick={() => menuRef.current?.close()} className={buttonClasses({ size: "lg", className: "w-full rounded-full" })}>
            Explore Tools <Icon name="arrow-right" size={17} />
          </Link>
        </div>
      </dialog>
    </header>
  );
}
