import { cx } from "./cx";
import { Icon } from "./icon";

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  const btn = "grid min-h-11 min-w-11 place-items-center rounded-md border px-3 text-sm font-medium transition-colors";
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
      <button type="button" className={cx(btn, "border-line-strong hover:bg-surface-2 disabled:opacity-40")} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <Icon name="chevron-right" size={16} className="rotate-180" />
      </button>
      <ul className="flex items-center gap-2">
        {pages.map((p) => (
          <li key={p}>
            <button
              type="button"
              onClick={() => onChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={cx(btn, p === page ? "border-accent bg-accent text-accent-fg" : "border-line-strong hover:bg-surface-2")}
            >
              {p}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className={cx(btn, "border-line-strong hover:bg-surface-2 disabled:opacity-40")} disabled={page >= pageCount} onClick={() => onChange(page + 1)} aria-label="Next page">
        <Icon name="chevron-right" size={16} />
      </button>
    </nav>
  );
}
