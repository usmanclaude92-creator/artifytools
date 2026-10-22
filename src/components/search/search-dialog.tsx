"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useMessages } from "@/components/i18n/locale-provider";
import type { SearchItem } from "@/lib/tools/registry";
import { SearchCombobox, type SearchCategoryLink } from "./search-combobox";

interface Props {
  items: SearchItem[];
  categories: SearchCategoryLink[];
  suggestions: SearchItem[];
}

/** Header search: a modal command-palette built on the native <dialog> element (focus trap + Esc for free). */
export function SearchDialog({ items, categories, suggestions }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const t = useMessages();
  // Counts openings: 0 = never opened (nothing rendered yet); each opening remounts the
  // combobox so it starts with an empty query. The <dialog> itself stays mounted.
  const [openCount, setOpenCount] = useState(0);

  function openDialog() {
    setOpenCount((c) => c + 1);
    requestAnimationFrame(() => {
      const d = dialogRef.current;
      if (d && !d.open) d.showModal();
    });
  }
  function closeDialog() {
    dialogRef.current?.close();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // An input inside a just-closed dialog can still be the active element for a moment; it isn't "typing".
      const typing = target && !target.closest("dialog:not([open])") && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        openDialog();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDialog}
        aria-haspopup="dialog"
        title={t.search.openTitle}
        className="inline-flex size-11 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <Icon name="search" size={20} />
        <span className="sr-only">{t.search.open}</span>
      </button>
      {openCount > 0 && (
        <dialog
          ref={dialogRef}
          aria-label={t.search.label}
          onClick={(e) => { if (e.target === dialogRef.current) closeDialog(); }}
          onClose={() => {
            // Navigation closes the dialog too; only restore focus if nothing else has claimed it.
            if (!document.activeElement || document.activeElement === document.body || dialogRef.current?.contains(document.activeElement)) triggerRef.current?.focus();
          }}
          className="m-0 mx-auto mt-[8vh] w-[min(40rem,calc(100vw-1.5rem))] max-w-none rounded-xl border border-line bg-canvas p-3 text-fg shadow-overlay backdrop:bg-black/50 open:animate-[artify-rise_200ms_ease-out]"
        >
          <SearchCombobox key={openCount} items={items} categories={categories} suggestions={suggestions} variant="dialog" autoFocus onNavigate={closeDialog} />
          <div className="mt-3 flex items-center justify-between px-1 text-xs text-muted">
            <span>{t.search.dialogHint}</span>
            <button type="button" onClick={closeDialog} className="rounded px-2 py-1 hover:bg-surface-2">{t.search.close}</button>
          </div>
        </dialog>
      )}
    </>
  );
}
