import Link from "@/components/ui/locale-link";
import type { Guide } from "@/lib/guides/guides";

/** Cards linking to guides (the guides index and "Related guides" on tool pages). */
export function GuideList({ items }: { items: Guide[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((g) => (
        <li key={g.slug}>
          <Link href={`/guides/${g.slug}`} className="card block h-full p-5 transition-colors hover:border-accent">
            <h3 className="text-base font-semibold">{g.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{g.description}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
