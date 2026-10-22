import type { Metadata } from "next";
import Link from "@/components/ui/locale-link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ToolGrid } from "@/components/tools/tool-card";
import { JsonLd } from "@/components/ui/json-ld";
import { absoluteUrl } from "@/lib/config";
import { localizeHref } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/locale-server";
import { pageMetadata } from "@/lib/seo/metadata";
import { localizeCategory } from "@/lib/tools/localize";
import { getCategoryBySlug, getPublishedCategories, getToolsByCategory, toDirectoryItem } from "@/lib/tools/registry";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getPublishedCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const p = (await getT()).pages.category;
  const raw = getCategoryBySlug(slug);
  if (!raw) return { title: p.notFound };
  const category = localizeCategory(raw, locale);
  return pageMetadata({
    title: p.metaTitle(category.name),
    description: p.metaDescription(category.name, category.description),
    path: `/categories/${category.slug}`,
    locale,
  });
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const raw = getCategoryBySlug(slug);
  if (!raw) notFound();
  const locale = await getLocale();
  const t = await getT();
  const category = localizeCategory(raw, locale);
  const tools = getToolsByCategory(category.id).map((tool) => toDirectoryItem(tool, locale));
  const others = getPublishedCategories().filter((c) => c.id !== category.id).map((c) => localizeCategory(c, locale));
  const abs = (path: string) => absoluteUrl(localizeHref(path, locale));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: t.common.home, item: abs("/") },
            { "@type": "ListItem", position: 2, name: t.pages.categories.title, item: abs("/categories") },
            { "@type": "ListItem", position: 3, name: category.name, item: abs(`/categories/${category.slug}`) },
          ],
        }}
      />
      <PageHeader
        title={category.name}
        description={category.description}
        breadcrumbs={[{ name: t.common.home, href: "/" }, { name: t.pages.categories.title, href: "/categories" }, { name: category.name }]}
      />
      <div className="container-page py-10">
        <p className="mb-6 text-sm font-medium text-muted">{t.common.tools(tools.length)}</p>
        <ToolGrid tools={tools} showCategory={false} heading="h2" />
        {others.length > 0 && (
          <section aria-labelledby="other-cats" className="mt-16">
            <h2 id="other-cats" className="text-xl font-semibold">{t.pages.category.others}</h2>
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
