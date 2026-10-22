"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StatusMessage } from "@/components/ui/feedback";
import { cx } from "@/components/ui/cx";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";
import { acceptAttribute, formatBytes, validateFiles, type FileLike, type FileRules, type Rejection } from "@/lib/files";

/**
 * Pick, drop or paste files. Everything stays in the browser: the component only hands the
 * accepted File objects to `onFiles` and explains, in plain language, why any file was refused.
 */
export function FileDropZone({
  rules,
  onFiles,
  existing = [],
  typesLabel,
  allowPaste = true,
  disabled,
  className,
}: {
  rules: FileRules;
  onFiles: (files: File[]) => void;
  /** Files already selected, so count and total-size limits include them. */
  existing?: FileLike[];
  /** Human-readable list of accepted types, e.g. "JPG, PNG or WebP". */
  typesLabel: string;
  allowPaste?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const t = useMessages().files;
  const locale = useLocale();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const [over, setOver] = useState(false);
  const [rejections, setRejections] = useState<Rejection<File>[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const multiple = rules.maxFiles > 1;

  // Latest values for the document-level paste listener without re-subscribing every render.
  const latest = useRef({ existing, rules, onFiles, disabled });
  useEffect(() => {
    latest.current = { existing, rules, onFiles, disabled };
  });

  function take(list: FileList | File[] | null | undefined) {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    const { existing: ex, rules: r, onFiles: cb } = latest.current;
    const { accepted, rejected } = validateFiles(files, ex, r);
    setRejections(rejected);
    setAnnouncement(accepted.length ? t.added(accepted.length) : "");
    if (accepted.length) cb(accepted);
  }
  const takeRef = useRef(take);
  useEffect(() => {
    takeRef.current = take;
  });

  useEffect(() => {
    if (!allowPaste) return;
    const onPaste = (e: ClipboardEvent) => {
      if (latest.current.disabled) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA)$/.test(target.tagName))) return;
      const files = e.clipboardData?.files;
      if (files && files.length) {
        e.preventDefault();
        takeRef.current(files);
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [allowPaste]);

  const maxLabel = formatBytes(rules.maxFileBytes, locale);
  const totalLabel = rules.maxTotalBytes ? formatBytes(rules.maxTotalBytes, locale) : "";
  const reasonText = (r: Rejection<File>) => {
    // First-strong isolate marks keep an Arabic name inside an English sentence (or the reverse) in order.
    const name = `\u2068${r.file.name || "—"}\u2069`;
    switch (r.reason) {
      case "type": return t.rejected.type(name);
      case "size": return t.rejected.size(name, maxLabel);
      case "empty": return t.rejected.empty(name);
      case "count": return t.rejected.count(name, rules.maxFiles);
      case "total": return t.rejected.total(name, totalLabel);
    }
  };

  return (
    <div className={cx("flex flex-col gap-3", className)}>
      <div
        data-dropzone
        data-over={over || undefined}
        onDragEnter={(e) => {
          if (disabled || !e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          depth.current++;
          setOver(true);
        }}
        onDragOver={(e) => {
          if (disabled || !e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={() => {
          depth.current = Math.max(0, depth.current - 1);
          if (depth.current === 0) setOver(false);
        }}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          depth.current = 0;
          setOver(false);
          take(e.dataTransfer.files);
        }}
        onClick={(e) => {
          if (disabled || (e.target as HTMLElement).closest("button")) return;
          inputRef.current?.click();
        }}
        className={cx(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          over ? "border-accent bg-accent-soft" : "border-line-strong bg-surface hover:border-accent/60 hover:bg-surface-2",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <span className="grid size-14 place-items-center rounded-full bg-accent-soft text-accent-text">
          <Icon name="upload" size={26} />
        </span>
        <p className="text-lg font-semibold">{over ? t.dropActive : t.dropTitle(multiple)}</p>
        <Button onClick={() => inputRef.current?.click()} disabled={disabled}>
          <Icon name="file" size={18} /> {t.choose(multiple)}
        </Button>
        {allowPaste && <p className="hidden text-sm text-muted sm:block">{t.orPaste}</p>}
        <p className="text-sm text-muted">{t.limits(typesLabel, maxLabel, rules.maxFiles)}</p>
        <p className="inline-flex items-center gap-1.5 text-xs text-muted">
          <Icon name="lock" size={13} /> {t.privacy}
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          accept={acceptAttribute(rules.accept)}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            take(e.target.files);
            e.target.value = ""; // allow choosing the same file again
          }}
        />
      </div>
      <p role="status" className="sr-only">{announcement}</p>
      {rejections.length > 0 && (
        <StatusMessage tone="warning">
          <ul className="space-y-1">
            {rejections.map((r, i) => (
              <li key={`${i}-${r.file.name}`}>{reasonText(r)}</li>
            ))}
          </ul>
        </StatusMessage>
      )}
    </div>
  );
}
