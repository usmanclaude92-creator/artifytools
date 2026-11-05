"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { addChild, addSibling, canRemoveLevel, childrenOf, depths, moveSibling, nodeById, removeNode, STATUSES, subtreeIds, uid, updateNode, levelColor, MAX_LEVELS, type PlannerData, type Status } from "@/lib/planner/model";
import type { PlannerStrings } from "./strings";

type Commit = (next: PlannerData) => void;

/** Details and actions for the selected box. */
export function Inspector({ data, id, commit, select, readOnly, t }: { data: PlannerData; id: string | null; commit: Commit; select: (id: string | null) => void; readOnly: boolean; t: PlannerStrings }) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const node = id ? nodeById(data, id) : undefined;
  if (!node) return <p className="rounded-xl border border-dashed border-line-strong p-4 text-sm text-muted">{t.pick}</p>;
  const level = data.levels[depths(data).get(node.id) ?? 0];
  const inside = subtreeIds(data, node.id).size - 1;
  const set = (patch: Parameters<typeof updateNode>[2]) => commit(updateNode(data, node.id, patch));

  if (readOnly) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4" data-testid="planner-details">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: level?.color }}>{level?.name}</p>
        <h3 className="text-lg font-semibold" dir="auto">{node.title || t.untitled}</h3>
        {node.status !== "none" && <p className="text-sm">{t.statuses[node.status]}</p>}
        {node.due && <p className="text-sm" dir="ltr">{node.due}</p>}
        {node.note && <p className="whitespace-pre-wrap text-sm text-muted" dir="auto">{node.note}</p>}
        {node.tags.length > 0 && <ul className="flex flex-wrap gap-1.5">{node.tags.map((tid) => { const tag = data.tags.find((x) => x.id === tid); return tag ? <li key={tid} className="rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: tag.color, color: tag.color }}>{tag.name}</li> : null; })}</ul>}
      </div>
    );
  }

  const isRoot = node.parent === null;
  const sibs = node.parent ? childrenOf(data, node.parent) : [];
  const at = sibs.findIndex((s) => s.id === node.id);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4" data-testid="planner-details">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: level?.color }}>{t.level}: {level?.name}</p>
      <Field label={t.title}>{(p) => <TextInput {...p} value={node.title} onChange={(e) => set({ title: e.target.value.slice(0, 200) })} placeholder={t.untitled} />}</Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.status}>
          {(p) => (
            <Select {...p} value={node.status} onChange={(e) => set({ status: e.target.value as Status })}>
              {STATUSES.map((s) => <option key={s} value={s}>{t.statuses[s]}</option>)}
            </Select>
          )}
        </Field>
        <Field label={t.due}>{(p) => <TextInput {...p} type="date" dir="ltr" value={node.due} onChange={(e) => set({ due: e.target.value })} />}</Field>
      </div>
      <Field label={t.note}>{(p) => <TextArea {...p} rows={3} value={node.note} onChange={(e) => set({ note: e.target.value.slice(0, 2000) })} />}</Field>
      {data.tags.length > 0 && (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm font-medium">{t.tagsOf}</legend>
          {data.tags.map((tag) => (
            <Checkbox key={tag.id} label={<span className="inline-flex items-center gap-2"><span className="size-3 rounded-full" style={{ background: tag.color }} />{tag.name || t.newTag}</span>} checked={node.tags.includes(tag.id)} onChange={(e) => set({ tags: e.target.checked ? [...node.tags, tag.id] : node.tags.filter((x) => x !== tag.id) })} />
          ))}
        </fieldset>
      )}
      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
        <Button size="sm" onClick={() => { const r = addChild(data, node.id, ""); commit(r.data); select(r.id); }}><Icon name="plus" size={15} /> {t.addChild}</Button>
        {!isRoot && <Button size="sm" variant="secondary" onClick={() => { const r = addSibling(data, node.id, ""); commit(r.data); select(r.id); }}>{t.addSibling}</Button>}
        {!isRoot && <Button size="sm" variant="ghost" disabled={at <= 0} onClick={() => commit(moveSibling(data, node.id, -1))}>{t.earlier}</Button>}
        {!isRoot && <Button size="sm" variant="ghost" disabled={at < 0 || at >= sibs.length - 1} onClick={() => commit(moveSibling(data, node.id, 1))}>{t.later}</Button>}
        {!isRoot && confirm !== node.id && <Button size="sm" variant="ghost" className="text-danger" onClick={() => (inside > 0 ? setConfirm(node.id) : (select(node.parent), commit(removeNode(data, node.id))))}><Icon name="trash" size={15} /> {t.remove}</Button>}
      </div>
      {confirm === node.id && (
        <div role="alert" className="flex flex-wrap items-center gap-2 rounded-lg bg-danger-soft p-3 text-sm">
          <span className="flex-1">{t.removeBranch(inside)}</span>
          <Button size="sm" variant="secondary" onClick={() => setConfirm(null)}>{t.cancel}</Button>
          <Button size="sm" className="!bg-danger" onClick={() => { setConfirm(null); select(node.parent); commit(removeNode(data, node.id)); }}>{t.confirmRemove}</Button>
        </div>
      )}
    </div>
  );
}

/** Levels (names and colours) and tags: the parts the user shapes to fit their own plan. */
export function StructurePanel({ data, commit, t }: { data: PlannerData; commit: Commit; t: PlannerStrings }) {
  const counts = new Map<number, number>();
  for (const d of depths(data).values()) counts.set(d, (counts.get(d) ?? 0) + 1);
  const setLevel = (i: number, patch: Partial<{ name: string; color: string }>) => commit({ ...data, levels: data.levels.map((l, k) => (k === i ? { ...l, ...patch } : l)) });
  const setTag = (id: string, patch: Partial<{ name: string; color: string }>) => commit({ ...data, tags: data.tags.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  return (
    <div className="grid gap-6 @2xl:grid-cols-2">
      <section aria-labelledby="levels-h" className="flex flex-col gap-3">
        <div>
          <h3 id="levels-h" className="text-sm font-semibold">{t.levels}</h3>
          <p className="text-xs text-muted">{t.levelsHelp}</p>
        </div>
        <ol className="flex flex-col gap-2">
          {data.levels.map((l, i) => (
            <li key={l.id} className="flex items-center gap-2">
              <span className="w-5 text-center text-xs text-muted">{i + 1}</span>
              <input type="color" aria-label={`${t.levelColor} ${i + 1}`} value={l.color} onChange={(e) => setLevel(i, { color: e.target.value })} className="size-9 shrink-0 cursor-pointer rounded-md border border-line-strong bg-surface p-0.5" />
              <TextInput aria-label={`${t.levelName} ${i + 1}`} value={l.name} onChange={(e) => setLevel(i, { name: e.target.value.slice(0, 60) })} className="!min-h-9 min-w-0 flex-1 py-1" />
              <span className="hidden w-20 text-xs text-muted sm:inline">{counts.get(i) ? t.levelBoxes(counts.get(i)!) : t.levelEmpty}</span>
              {i === data.levels.length - 1 && data.levels.length > 1 && (
                <button type="button" aria-label={`${t.removeLevel}`} title={canRemoveLevel(data, i) ? t.removeLevel : t.levelKeep} disabled={!canRemoveLevel(data, i)} onClick={() => commit({ ...data, levels: data.levels.slice(0, -1) })} className="grid size-9 place-items-center rounded-md text-muted hover:text-danger disabled:opacity-40"><Icon name="trash" size={15} /></button>
              )}
            </li>
          ))}
        </ol>
        <div><Button size="sm" variant="secondary" disabled={data.levels.length >= MAX_LEVELS} onClick={() => commit({ ...data, levels: [...data.levels, { id: uid("l"), name: `${t.level} ${data.levels.length + 1}`, color: levelColor(data.levels.length) }] })}><Icon name="plus" size={15} /> {t.addLevel}</Button></div>
      </section>

      <section aria-labelledby="tags-h" className="flex flex-col gap-3">
        <div>
          <h3 id="tags-h" className="text-sm font-semibold">{t.tags}</h3>
          <p className="text-xs text-muted">{t.tagsHelp}</p>
        </div>
        <ul className="flex flex-col gap-2">
          {data.tags.map((tag) => (
            <li key={tag.id} className="flex items-center gap-2">
              <input type="color" aria-label={`${t.levelColor}: ${tag.name}`} value={tag.color} onChange={(e) => setTag(tag.id, { color: e.target.value })} className="size-9 shrink-0 cursor-pointer rounded-md border border-line-strong bg-surface p-0.5" />
              <TextInput aria-label={t.tagName} value={tag.name} onChange={(e) => setTag(tag.id, { name: e.target.value.slice(0, 40) })} className="!min-h-9 min-w-0 flex-1 py-1" />
              <button type="button" aria-label={`${t.removeTag}: ${tag.name}`} onClick={() => commit({ ...data, tags: data.tags.filter((x) => x.id !== tag.id), nodes: data.nodes.map((n) => ({ ...n, tags: n.tags.filter((x) => x !== tag.id) })) })} className="grid size-9 place-items-center rounded-md text-muted hover:text-danger"><Icon name="trash" size={15} /></button>
            </li>
          ))}
        </ul>
        <div><Button size="sm" variant="secondary" disabled={data.tags.length >= 40} onClick={() => commit({ ...data, tags: [...data.tags, { id: uid("t"), name: t.newTag, color: levelColor(data.tags.length + 2) }] })}><Icon name="plus" size={15} /> {t.addTag}</Button></div>
      </section>
    </div>
  );
}
