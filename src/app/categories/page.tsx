import type { Metadata } from "next";
import { CategoryCard } from "@/components/categories/category-card";
import { PageHeader } from "@/components/layout/page-header";
import { getPublishedCategories, getToolsByCategory } from "@/lib/tools/registry";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Tool Categories",
  description: "Browse Artify tools by category: text and writing, calculators, developer tools, productivity, and security.",
  path: "/categories",
});

export default function CategoriesPage() {
  const cats = getPublishedCategories();
  return (
    <>
      <PageHeader
        title="Categories"
        description="Every category here contains working tools. New categories appear as soon as their first tool is ready."
        breadcrumbs={[{ name: "Home", href: "/" }, { name: "Categories" }]}
      />
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
