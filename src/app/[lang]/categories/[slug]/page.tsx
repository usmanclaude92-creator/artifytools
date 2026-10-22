import type { Metadata } from "next";
import Link from "@/components/ui/locale-link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ToolGrid } from "@/components/tools/tool-card";
import { JsonLd } from "@/components/ui/json-ld";
import { absoluteUrl } from "@/lib/config";
import { pageMetadata } from "@/lib/seo/metadata";
import { getCategoryBySlug, getPublishedCategories, getToolsByCategory, toDirectoryItem } from "@/lib/tools/registry";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getPublishedCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return pageMetadata({
    title: `${category.name} Tools`,
    description: `${category.description} Free ${category.name.toLowerCase()} tools from Artify Tools.`,
    path: `/categories/${category.slug}`,
  });
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();
  const tools = getToolsByCategory(category.id).map(toDirectoryItem);
  const others = getPublishedCategories().filter((c) => c.id !== category.id);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Categories", item: absoluteUrl("/categories") },
            { "@type": "ListItem", position: 3, name: category.name, item: absoluteUrl(`/categories/${category.slug}`) },
          ],
        }}
      />
      <PageHeader
        title={category.name}
        description={category.description}
        breadcrumbs={[{ name: "Home", href: "/" }, { name: "Categories", href: "/categories" }, { name: category.name }]}
      />
      <div className="container-page py-10">
        <p className="mb-6 text-sm font-medium text-muted">{tools.length} tool{tools.length === 1 ? "" : "s"}</p>
        <ToolGrid tools={tools} showCategory={false} heading="h2" />
        {others.length > 0 && (
          <section aria-labelledby="other-cats" className="mt-16">
            <h2 id="other-cats" className="text-xl font-semibold">Other categories</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {others.map((c) => (
                <li key={c.id}>
                  <Link href={`/categories/${c.slug}`} className="inline-flex min-h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium hover:bg-surface-2">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
