import Link from "@/components/ui/locale-link";
import { Icon } from "@/components/ui/icon";
import { getT } from "@/lib/locale-server";

export interface Crumb {
  name: string;
  href?: string;
}

export async function Breadcrumbs({ items, compact }: { items: Crumb[]; compact?: boolean }) {
  const t = await getT();
  return (
    <nav aria-label={t.common.breadcrumb} className={compact ? "mb-3" : "mb-5"}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={c.name} className="flex items-center gap-1.5">
              {c.href && !last ? (
                <Link href={c.href} className="rounded underline-offset-4 hover:text-fg hover:underline">
                  {c.href === "/" ? t.common.home : c.name}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "text-fg" : undefined}>
                  {c.name}
                </span>
              )}
              {!last && <Icon name="chevron-right" size={14} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
