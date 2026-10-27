"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import type { SearchItem } from "@/lib/tools/registry";

const cache = new Map<string, Promise<SearchItem[]>>();

/** Downloads the search list for a language once per visit (see app/api/search-index). */
export function loadSearchIndex(locale: string): Promise<SearchItem[]> {
  let p = cache.get(locale);
  if (!p) {
    p = fetch(`/api/search-index/${locale}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<SearchItem[]>;
      })
      .catch((e) => {
        cache.delete(locale); // let the next attempt try again
        throw e;
      });
    cache.set(locale, p);
  }
  return p;
}

/** The search list, fetched once `enabled` turns true; null until it has arrived. */
export function useSearchIndex(enabled: boolean): SearchItem[] | null {
  const locale = useLocale();
  const [items, setItems] = useState<SearchItem[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    loadSearchIndex(locale).then((list) => live && setItems(list), () => {});
    return () => {
      live = false;
    };
  }, [enabled, locale]);
  return items;
}
