"use client";

import { useCallback, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/components/ui/cx";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { formatBytes } from "@/lib/files";
import type { QueueItem } from "./use-file-queue";

const THUMB_LIMIT = 30_000_000;

/** Image preview from a local object URL, released when the row goes away. Formats the browser
 * can't show (HEIC in most browsers) fall back to an image icon instead of a broken picture. */
function Thumb({ file }: { file: File }) {
  const ref = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img) return;
      const url = URL.createObjectURL(file);
      img.src = url;
      return () => URL.revokeObjectURL(url);
    },
    [file],
  );
  return (
    <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-surface-2 text-muted">
      <Icon name="image" size={20} />
      {/* eslint-disable-next-line @next/next/no-img-element -- local object URL, not a remote asset */}
      <img ref={ref} alt="" className="absolute inset-0 size-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
    </span>
  );
}

export function FileList<R>({
  items,
  onRemove,
  onMove,
  onClear,
  actions,
  className,
}: {
  items: QueueItem<R>[];
  onRemove?: (id: string) => void;
  /** Show up/down buttons (e.g. to set PDF merge order). */
  onMove?: (id: string, delta: -1 | 1) => void;
  onClear?: () => void;
  /** Extra controls per row, e.g. a download button for a finished file. */
  actions?: (item: QueueItem<R>) => ReactNode;
  className?: string;
}) {
  const t = useMessages().files;
  const locale = useLocale();
  if (items.length === 0) return null;
  const total = items.reduce((s, it) => s + it.file.size, 0);

  return (
    <section aria-label={t.listLabel} className={cx("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-medium">{t.summary(items.length, formatBytes(total, locale))}</p>
        {onClear && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <Icon name="trash" size={16} /> {t.clearAll}
          </Button>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((it, i) => (
          <li key={it.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-line bg-surface p-3">
            {it.file.type.startsWith("image/") && it.file.size <= THUMB_LIMIT ? (
              <Thumb file={it.file} />
            ) : (
              <span className="grid size-12 shrink-0 place-items-center rounded-md bg-surface-2 text-muted">
                <Icon name="file" size={22} />
              </span>
            )}
            <div className="min-w-0 flex-1 basis-40">
              {/* <bdi> keeps each name in its own direction while the row aligns with the page. */}
              <p className="truncate font-medium" title={it.file.name}><bdi>{it.file.name}</bdi></p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                <span>{formatBytes(it.file.size, locale)}</span>
                <span aria-hidden="true">·</span>
                <span className={cx(it.status === "done" && "text-success", it.status === "error" && "text-danger")}>
                  {it.status === "processing" && <Icon name="loader" size={14} className="me-1 inline animate-spin align-[-2px]" />}
                  {t.status[it.status]}
                </span>
              </p>
              {it.status === "processing" && it.progress !== undefined && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label={it.file.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(it.progress * 100)}>
                  <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.round(it.progress * 100)}%` }} />
                </div>
              )}
              {it.status === "error" && <p className="mt-1 text-sm text-danger">{it.error ?? t.unknownError}</p>}
            </div>
            {/* On narrow screens the controls drop to their own line so the file name keeps its width. */}
            <div className="ms-auto flex shrink-0 items-center justify-end gap-1 max-sm:w-full">
              {actions?.(it)}
              {onMove && (
                <>
                  <Button variant="ghost" size="sm" className="!px-2" aria-label={t.moveUp(it.file.name)} disabled={i === 0} onClick={() => onMove(it.id, -1)}>
                    <Icon name="chevron-up" size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" className="!px-2" aria-label={t.moveDown(it.file.name)} disabled={i === items.length - 1} onClick={() => onMove(it.id, 1)}>
                    <Icon name="chevron-down" size={16} />
                  </Button>
                </>
              )}
              {onRemove && (
                <Button variant="ghost" size="sm" className="!px-2" aria-label={t.remove(it.file.name)} onClick={() => onRemove(it.id)}>
                  <Icon name="x" size={16} />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
