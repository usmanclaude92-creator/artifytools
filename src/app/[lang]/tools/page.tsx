import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ToolGrid } from "@/components/tools/tool-card";
import { ToolsDirectory } from "@/components/tools/tools-directory";
import { getPublishedCategories, getPublishedTools, toDirectoryItem } from "@/lib/tools/registry";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "All Tools",
  description: "Browse and search every Artify tool: text, calculators, developer utilities, and more. Most run privately in your browser.",
  path: "/tools",
});

export default function ToolsPage() {
  const items = getPublishedTools().map(toDirectoryItem);
  const categories = getPublishedCategories().map((c) => ({ slug: c.slug, name: c.name, icon: c.icon }));
  return (
    <>
      <PageHeader
        title="All Tools"
        description="Discover our complete collection of useful online tools."
        breadcrumbs={[{ name: "Home", href: "/" }, { name: "All Tools" }]}
      />
      <div className="container-page py-10">
        {/* The static grid is the server-rendered fallback (also what crawlers and no-JS visitors see). */}
        <Suspense fallback={<ToolGrid tools={items} heading="h2" />}>
          <ToolsDirectory tools={items} categories={categories} />
        </Suspense>
      </div>
    </>
  );
}
