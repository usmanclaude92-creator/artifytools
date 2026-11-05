"use client";

import { Icon } from "@/components/ui/icon";
import { childrenOf, depths, type PlannerData } from "@/lib/planner/model";
import type { PlannerStrings } from "./strings";

const DOT: Record<string, string> = { todo: "#64748b", doing: "#2563eb", done: "#0f9d6b", blocked: "#dc2626" };

/** The same plan as an indented list: the main view on phones, and the easiest to use with a keyboard or screen reader. */
export function OutlineView({ data, selected, onSelect, onToggle, t }: { data: PlannerData; selected: string | null; onSelect: (id: string) => void; onToggle: (id: string) => void; t: PlannerStrings }) {
  const dep = depths(data);
  const root = data.nodes[0];
  if (!root) return null;
  const row = (id: string, level: number) => {
    const n = data.nodes.find((x) => x.id === id)!;
    const kids = childrenOf(data, id);
    const lv = data.levels[dep.get(id) ?? 0];
    return (
      <li key={id} role="treeitem" aria-expanded={kids.length ? !n.collapsed : undefined} aria-selected={selected === id} aria-level={level + 1}>
        <div className={`flex min-h-11 items-center gap-1.5 rounded-lg ps-[calc(var(--indent)*1.25rem)] pe-2 ${selected === id ? "bg-accent-soft" : "hover:bg-surface-2"}`} style={{ ["--indent" as string]: level }}>
          {kids.length ? (
            <button type="button" aria-label={`${n.collapsed ? t.expand : t.collapse}: ${n.title || t.untitled}`} onClick={() => onToggle(id)} className="grid size-8 shrink-0 place-items-center rounded-md text-muted hover:text-fg">
              <Icon name={n.collapsed ? "chevron-right" : "chevron-down"} size={16} />
            </button>
          ) : <span className="size-8 shrink-0" />}
          <span className="size-3 shrink-0 rounded-full" style={{ background: lv?.color }} aria-hidden="true" />
          <button type="button" data-node={id} onClick={() => onSelect(id)} className="min-w-0 flex-1 py-1.5 text-start text-sm font-medium" dir="auto">
            <span className="block truncate">{n.title || t.untitled}</span>
            <span className="block text-[11px] font-normal text-muted">{lv?.name}{n.due ? ` · ${n.due}` : ""}</span>
          </button>
          {n.status !== "none" && <span className="size-2.5 shrink-0 rounded-full" style={{ background: DOT[n.status] }} title={t.statuses[n.status]} />}
        </div>
        {kids.length > 0 && !n.collapsed && <ul role="group">{kids.map((k) => row(k.id, level + 1))}</ul>}
      </li>
    );
  };
  return <ul role="tree" aria-label={t.mapLabel} className="rounded-xl border border-line bg-surface p-2">{row(root.id, 0)}</ul>;
}
