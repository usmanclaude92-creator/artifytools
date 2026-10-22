import type { Metadata } from "next";
import { CategoryCard } from "@/components/categories/category-card";
import { PageHeader } from "@/components/layout/page-header";
import { getPublishedCategories, getToolsByCategory } from "@/lib/tools/registry";
import { getLocale, getT } from "@/lib/locale-server";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const p = (await getT()).pages.categories;
  return pageMetadata({ title: p.metaTitle, description: p.metaDescription, path: "/categories", locale: await getLocale() });
}

export default async function CategoriesPage() {
  const p = (await getT()).pages.categories;
  const cats = getPublishedCategories();
  return (
    <>
      <PageHeader title={p.title} description={p.description} breadcrumbs={[{ name: (await getT()).common.home, href: "/" }, { name: p.title }]} />
      <div className="container-page py-10">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <li key={c.id}>
              <CategoryCard category={c} count={getToolsByCategory(c.id).length} heading="h2" />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
