import Link from "@/components/ui/locale-link";
import { IconTile } from "@/components/ui/misc";
import { categoryTones } from "@/lib/tools/tones";
import type { Category } from "@/lib/tools/types";

/** `count` is optional: the home page omits it, the categories page shows the real number. */
export function CategoryCard({ category, count, heading: Heading = "h3" }: { category: Category; count?: number; heading?: "h2" | "h3" }) {
  return (
    <article className="card card-interactive relative flex h-full flex-col gap-3.5 p-5 focus-within:ring-2 focus-within:ring-[var(--focus)]">
      <IconTile name={category.icon} tone={categoryTones[category.id]} />
      <div>
        <Heading className="text-[1.02rem] font-semibold leading-snug">
          <Link href={`/categories/${category.slug}`} className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none">
            {category.name}
          </Link>
        </Heading>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{category.description}</p>
        {count !== undefined && (
          <p className="mt-2 text-sm font-medium text-accent-text">
            {count} tool{count === 1 ? "" : "s"}
          </p>
        )}
      </div>
    </article>
  );
}
