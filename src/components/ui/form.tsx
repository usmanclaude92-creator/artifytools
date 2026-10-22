"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cx } from "./cx";

interface FieldRenderProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  className?: string;
  children: (props: FieldRenderProps) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx("field-control", className)} {...props} />;
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  // dir="auto": text follows its own direction (Arabic right-to-left, code and English left-to-right).
  return <textarea dir="auto" className={cx("field-control resize-y font-mono text-[0.9rem] leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cx("field-control appearance-auto pe-8", className)} {...props}>
      {children}
    </select>
  );
}

/** Labelled checkbox with a generous hit area. */
export function Checkbox({
  label,
  hint,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: ReactNode; hint?: ReactNode }) {
  return (
    <label className={cx("flex min-h-11 cursor-pointer items-start gap-3 rounded-md py-2 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60", className)}>
      <input type="checkbox" className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--accent)]" {...props} />
      <span className="text-[0.95rem] leading-snug">
        {label}
        {hint && <span className="mt-0.5 block text-sm text-muted">{hint}</span>}
      </span>
    </label>
  );
}

/** Radio-group styled as a segmented control; arrow keys move selection natively. */
export function Segmented<T extends string>({
  legend,
  value,
  onChange,
  options,
  name,
  className,
}: {
  legend: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  name?: string;
  className?: string;
}) {
  const groupName = useId();
  return (
    <fieldset className={cx("min-w-0", className)}>
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      <div className="inline-flex max-w-full flex-wrap gap-1 rounded-lg bg-surface-2 p-1">
        {options.map((o) => (
          <label
            key={o.value}
            className="relative min-h-10 cursor-pointer rounded-md px-3.5 py-2 text-sm font-medium text-muted transition-colors has-[:checked]:bg-surface has-[:checked]:text-fg has-[:checked]:shadow-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] hover:text-fg"
          >
            <input
              type="radio"
              name={name ?? groupName}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
