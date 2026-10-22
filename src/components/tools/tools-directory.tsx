"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, Select } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/feedback";
import { Icon, type IconName } from "@/components/ui/icon";
import { cx } from "@/components/ui/cx";
import { Pagination } from "@/components/ui/pagination";
import { searchTools } from "@/lib/search";
import { processingLabels } from "@/lib/tools/labels";
import type { DirectoryItem } from "@/lib/tools/registry";
import type { ProcessingMode } from "@/lib/tools/types";
import { ToolGrid } from "./tool-card";

const PAGE_SIZE = 12;

type Sort = "recommended" | "az" | "za" | "new";

interface Props {
  tools: DirectoryItem[];
  categories: { slug: string; name: string; icon: IconName }[];
}

interface Filters {
  q: string;
  category: string;
  ai: boolean;
  processing: string;
  sort: Sort;
  page: number;
}

function readFilters(params: URLSearchParams): Filters {
  const sort = params.get("sort");
  return {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    ai: params.get("ai") === "1",
    processing: params.get("processing") ?? "",
    sort: sort === "az" || sort === "za" || sort === "new" ? sort : "recommended",
    page: Math.max(1, Number(params.get("page")) || 1),
  };
}

function buildQuery(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q);
  if (f.category) p.set("category", f.category);
  if (f.ai) p.set("ai", "1");
  if (f.processing) p.set("processing", f.processing);
  if (f.sort !== "recommended") p.set("sort", f.sort);
  if (f.page > 1) p.set("page", String(f.page));
  return p.toString();
}

export function ToolsDirectory({ tools, categories }: Props) {
  const searchParams = useSearchParams();
  const urlKey = searchParams.toString();

  // Filters live in local state so every control responds instantly. The URL is kept in sync
  // with history.replaceState (shareable links), and URL changes that did *not* come from this
  // component (e.g. the header search navigating here) are adopted back into state.
  const [filters, setFilters] = useState<Filters>(() => readFilters(new URLSearchParams(urlKey)));
  const [seenKey, setSeenKey] = useState(urlKey);
  const [pending, setPending] = useState<string[]>([]); // our own writes the router hasn't reported yet
  if (urlKey !== seenKey) {
    setSeenKey(urlKey);
    const idx = pending.indexOf(urlKey);
    if (idx === -1) {
      setFilters(readFilters(new URLSearchParams(urlKey)));
      setPending([]);
    } else {
      setPending(pending.slice(idx + 1));
    }
  }

  function update(patch: Partial<Filters>) {
    const next = { ...filters, ...patch };
    if (!("page" in patch)) next.page = 1;
    setFilters(next);
    const qs = buildQuery(next);
    if (qs !== (pending.at(-1) ?? urlKey)) setPending([...pending, qs]);
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  const hasAi = tools.some((t) => t.aiPowered);
  const distinctDates = new Set(tools.map((t) => t.lastUpdated)).size > 1;
  const modes = [...new Set(tools.map((t) => t.processingMode))];
  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tools) m.set(t.categorySlug, (m.get(t.categorySlug) ?? 0) + 1);
    return m;
  }, [tools]);

  const sort: Sort = filters.sort === "new" && !distinctDates ? "recommended" : filters.sort;

  const results = useMemo(() => {
    let list = tools;
    if (filters.category) list = list.filter((t) => t.categorySlug === filters.category);
    if (filters.ai) list = list.filter((t) => t.aiPowered);
    if (filters.processing) list = list.filter((t) => t.processingMode === filters.processing);
    const q = filters.q.trim();
    if (q) {
      const matched = searchTools(list, q);
      if (sort === "recommended") return matched; // relevance order
      list = matched;
    }
    const sorted = [...list];
    if (sort === "az") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "za") sorted.sort((a, b) => b.name.localeCompare(a.name));
    else if (sort === "new") sorted.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated) || a.name.localeCompare(b.name));
    else sorted.sort((a, b) => a.popularRank - b.popularRank || a.name.localeCompare(b.name));
    return sorted;
  }, [tools, filters.category, filters.ai, filters.processing, filters.q, sort]);

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const visible = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.q.trim()) activeChips.push({ key: "q", label: `Search: “${filters.q.trim()}”`, clear: () => update({ q: "" }) });
  if (filters.category) {
    const c = categories.find((c) => c.slug === filters.category);
    if (c) activeChips.push({ key: "category", label: `Category: ${c.name}`, clear: () => update({ category: "" }) });
  }
  if (filters.ai) activeChips.push({ key: "ai", label: "AI-powered", clear: () => update({ ai: false }) });
  if (filters.processing && filters.processing in processingLabels) {
    activeChips.push({ key: "processing", label: processingLabels[filters.processing as ProcessingMode].label, clear: () => update({ processing: "" }) });
  }
  const clearAll = () => {
    update({ q: "", category: "", ai: false, processing: "", sort: "recommended" });
  };

  const chip = (active: boolean) =>
    cx(
      "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
      active ? "border-accent bg-accent-soft text-accent-text" : "border-line-strong bg-surface hover:bg-surface-2",
    );

  const sideItem = (active: boolean) =>
    cx(
      "flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium transition-colors",
      active ? "bg-accent-soft text-accent-text" : "text-muted hover:bg-surface-2 hover:text-fg",
    );

  return (
    <div>
      <div className="relative">
        <Icon name="search" size={20} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          aria-label="Search all tools"
          placeholder="Search tools by name, task, or keyword"
          value={filters.q}
          onChange={(e) => update({ q: e.target.value })}
          className="field-control h-14 rounded-xl ps-12 text-base shadow-[var(--shadow-sm)]"
          autoComplete="off"
        />
      </div>

      {/* Below lg the categories are a wrapping chip row; from lg up they move to the sidebar. */}
      <div className="mt-4 flex flex-wrap items-center gap-2 lg:hidden" role="group" aria-label="Filter by category">
        <button type="button" className={chip(!filters.category)} aria-pressed={!filters.category} onClick={() => update({ category: "" })}>
          All <span className="text-muted">{tools.length}</span>
        </button>
        {categories.map((c) => (
          <button key={c.slug} type="button" className={chip(filters.category === c.slug)} aria-pressed={filters.category === c.slug} onClick={() => update({ category: filters.category === c.slug ? "" : c.slug })}>
            {c.name} <span className="text-muted">{categoryCounts.get(c.slug) ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[13.5rem_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Categories">
          <div role="group" aria-label="Filter by category" className="sticky top-24 space-y-1">
            <button type="button" className={sideItem(!filters.category)} aria-pressed={!filters.category} onClick={() => update({ category: "" })}>
              <Icon name="layers" size={17} />
              <span className="flex-1">All tools</span>
              <span className="text-xs">{tools.length}</span>
            </button>
            {categories.map((c) => (
              <button key={c.slug} type="button" className={sideItem(filters.category === c.slug)} aria-pressed={filters.category === c.slug} onClick={() => update({ category: filters.category === c.slug ? "" : c.slug })}>
                <Icon name={c.icon} size={17} />
                <span className="flex-1">{c.name}</span>
                <span className="text-xs">{categoryCounts.get(c.slug) ?? 0}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <div className="flex flex-wrap items-center gap-x-5">
              {hasAi && <Checkbox label="AI-powered only" checked={filters.ai} onChange={(e) => update({ ai: e.target.checked })} />}
              {modes.length > 1 && (
                <label className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Processing</span>
                  <Select value={filters.processing} onChange={(e) => update({ processing: e.target.value })} className="!min-h-10 !w-auto py-1.5">
                    <option value="">Any</option>
                    {modes.map((m) => (
                      <option key={m} value={m}>{processingLabels[m].label}</option>
                    ))}
                  </Select>
                </label>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="font-medium">Sort by</span>
              <Select value={sort} onChange={(e) => update({ sort: e.target.value as Sort })} className="!min-h-10 !w-auto py-1.5">
                <option value="recommended">{filters.q.trim() ? "Best match" : "Recommended"}</option>
                <option value="az">Name A–Z</option>
                <option value="za">Name Z–A</option>
                {distinctDates && <option value="new">Recently added</option>}
              </Select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-5">
            <p role="status" aria-live="polite" className="me-2 text-sm font-medium">
              {results.length} tool{results.length === 1 ? "" : "s"}
              {results.length > PAGE_SIZE && <span className="font-normal text-muted"> · page {page} of {pageCount}</span>}
            </p>
            {activeChips.map((c) => (
              <button key={c.key} type="button" onClick={c.clear} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-sm hover:bg-line">
                {c.label}
                <Icon name="x" size={14} />
                <span className="sr-only">Remove filter</span>
              </button>
            ))}
            {activeChips.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear all
              </Button>
            )}
          </div>

          <div className="mt-5">
            {visible.length > 0 ? (
              <ToolGrid tools={visible} heading="h2" columns={3} />
            ) : (
              <EmptyState icon="search" title="No tools match your filters">
                <p>Try a different search, or remove some filters.</p>
                <Button className="mt-5" onClick={clearAll}>
                  Clear all filters
                </Button>
              </EmptyState>
            )}
          </div>

          <Pagination
            page={page}
            pageCount={pageCount}
            onChange={(p) => {
              update({ page: p });
              document.getElementById("main")?.scrollIntoView({ block: "start" });
            }}
          />
        </div>
      </div>
    </div>
  );
}
