import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ToolGrid } from "@/components/tools/tool-card";
import { ToolsDirectory } from "@/components/tools/tools-directory";
import { getPublishedCategories, getPublishedTools, toDirectoryItem } from "@/lib/tools/registry";
import { localizeCategory } from "@/lib/tools/localize";
import { getLocale, getT } from "@/lib/locale-server";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const p = (await getT()).pages.tools;
  return pageMetadata({ title: p.title, description: p.metaDescription, path: "/tools", locale: await getLocale() });
}

export default async function ToolsPage() {
  const locale = await getLocale();
  const p = (await getT()).pages.tools;
  const items = getPublishedTools().map((t) => toDirectoryItem(t, locale));
  const categories = getPublishedCategories().map((c) => localizeCategory(c, locale)).map((c) => ({ slug: c.slug, name: c.name, icon: c.icon }));
  return (
    <>
      <PageHeader title={p.title} description={p.description} breadcrumbs={[{ name: (await getT()).common.home, href: "/" }, { name: p.title }]} />
      <div className="container-page py-10">
        {/* The static grid is the server-rendered fallback (also what crawlers and no-JS visitors see). */}
        <Suspense fallback={<ToolGrid tools={items} heading="h2" />}>
          <ToolsDirectory tools={items} categories={categories} />
        </Suspense>
      </div>
    </>
  );
}
