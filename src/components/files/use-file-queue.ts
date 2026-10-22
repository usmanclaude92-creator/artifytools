"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type QueueStatus = "queued" | "processing" | "done" | "error" | "cancelled";

export interface QueueItem<R> {
  id: string;
  file: File;
  status: QueueStatus;
  /** 0–1 while processing, when the processor reports it. */
  progress?: number;
  result?: R;
  /** A message safe to show, when the processor threw a FileProcessingError. */
  error?: string;
}

/** Throw this from a processor to show its message to the user; other errors show a generic message. */
export class FileProcessingError extends Error {}

export type FileProcessor<R> = (file: File, ctx: { signal: AbortSignal; onProgress: (fraction: number) => void }) => Promise<R>;

let nextId = 0;

/**
 * A small in-browser job queue for file tools: add files, process them with limited
 * concurrency, report progress, cancel, remove and reorder. Nothing leaves the device.
 */
export function useFileQueue<R>(processor: FileProcessor<R>, { concurrency = 2, autoStart = true }: { concurrency?: number; autoStart?: boolean } = {}) {
  const [items, setItems] = useState<QueueItem<R>[]>([]);
  const itemsRef = useRef<QueueItem<R>[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const processorRef = useRef(processor);
  useEffect(() => {
    processorRef.current = processor;
  });

  const commit = useCallback((next: QueueItem<R>[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);
  const patch = useCallback((id: string, change: Partial<QueueItem<R>>) => {
    commit(itemsRef.current.map((it) => (it.id === id ? { ...it, ...change } : it)));
  }, [commit]);

  // pump re-calls itself when a job finishes; go through a ref so the callback can refer to itself.
  const pumpRef = useRef<() => void>(() => {});
  const pump = useCallback(() => {
    let running = itemsRef.current.filter((it) => it.status === "processing").length;
    for (const item of itemsRef.current) {
      if (running >= concurrency) break;
      if (item.status !== "queued") continue;
      running++;
      const controller = new AbortController();
      controllers.current.set(item.id, controller);
      patch(item.id, { status: "processing", progress: 0, error: undefined });
      processorRef
        .current(item.file, { signal: controller.signal, onProgress: (p) => !controller.signal.aborted && patch(item.id, { progress: Math.min(1, Math.max(0, p)) }) })
        .then(
          (result) => !controller.signal.aborted && patch(item.id, { status: "done", progress: 1, result }),
          (err: unknown) => !controller.signal.aborted && patch(item.id, { status: "error", error: err instanceof FileProcessingError ? err.message : undefined }),
        )
        .finally(() => {
          controllers.current.delete(item.id);
          if (!controller.signal.aborted) pumpRef.current();
        });
    }
  }, [concurrency, patch]);
  useEffect(() => {
    pumpRef.current = pump;
  }, [pump]);

  const add = useCallback((files: File[]) => {
    const added = files.map((file) => ({ id: `f${++nextId}`, file, status: "queued" as const }));
    commit([...itemsRef.current, ...added]);
    if (autoStart) pump();
  }, [autoStart, commit, pump]);

  const remove = useCallback((id: string) => {
    controllers.current.get(id)?.abort();
    commit(itemsRef.current.filter((it) => it.id !== id));
    pump();
  }, [commit, pump]);

  const move = useCallback((id: string, delta: -1 | 1) => {
    const list = [...itemsRef.current];
    const i = list.findIndex((it) => it.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j]!, list[i]!];
    commit(list);
  }, [commit]);

  const cancel = useCallback(() => {
    for (const c of controllers.current.values()) c.abort();
    commit(itemsRef.current.map((it) => (it.status === "queued" || it.status === "processing" ? { ...it, status: "cancelled" as const, progress: undefined } : it)));
  }, [commit]);

  const clear = useCallback(() => {
    for (const c of controllers.current.values()) c.abort();
    commit([]);
  }, [commit]);

  /** Re-runs every item (e.g. after the user changes a setting), or only failed/cancelled ones. */
  const rerun = useCallback((which: "all" | "failed" = "all") => {
    for (const c of controllers.current.values()) c.abort();
    commit(itemsRef.current.map((it) => (which === "all" || it.status === "error" || it.status === "cancelled" ? { ...it, status: "queued" as const, progress: undefined, result: undefined, error: undefined } : it)));
    pump();
  }, [commit, pump]);

  useEffect(() => {
    const map = controllers.current;
    return () => {
      for (const c of map.values()) c.abort();
    };
  }, []);

  const busy = items.some((it) => it.status === "queued" || it.status === "processing");
  return { items, add, remove, move, cancel, clear, rerun, start: pump, busy };
}
