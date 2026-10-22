import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { getPublishedCategories } from "@/lib/tools/registry";

export default function NotFound() {
  const cats = getPublishedCategories();
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">We couldn’t find that page</h1>
      <p className="mt-4 max-w-md text-lg text-muted">The tool or page you’re looking for doesn’t exist or may have moved. Try searching, or browse a category.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/tools" className={buttonClasses({ size: "lg" })}>Explore All Tools</Link>
        <Link href="/" className={buttonClasses({ variant: "secondary", size: "lg" })}>Go home</Link>
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
