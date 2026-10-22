import Link from "@/components/ui/locale-link";
import { buttonClasses } from "@/components/ui/button";
import { getPublishedCategories } from "@/lib/tools/registry";
import { getT } from "@/lib/locale-server";

export default async function NotFound() {
  const t = await getT();
  const cats = getPublishedCategories();
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{t.notFound.title}</h1>
      <p className="mt-4 max-w-md text-lg text-muted">{t.notFound.text}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/tools" className={buttonClasses({ size: "lg" })}>{t.notFound.explore}</Link>
        <Link href="/" className={buttonClasses({ variant: "secondary", size: "lg" })}>{t.notFound.home}</Link>
      </div>
      <ul className="mt-10 flex flex-wrap justify-center gap-2">
        {cats.map((c) => (
          <li key={c.id}>
            <Link href={`/categories/${c.slug}`} className="inline-flex min-h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium hover:bg-surface-2">
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
