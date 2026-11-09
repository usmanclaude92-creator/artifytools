import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { WithSidebar } from "@/components/layout/with-sidebar";
import type { ReactNode } from "react";
import { ToolWorkspace } from "@/components/tools/tool-components";
import { Examples, Faq, HowTo, PrivacyDisclosure, RelatedTools, StatusNotice, ToolHeader } from "@/components/tools/tool-sections";
import { JsonLd } from "@/components/ui/json-ld";
import { absoluteUrl, siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo/metadata";
import { getCategory } from "@/lib/tools/categories";
import { getPublishedTools, getRelatedTools, getTool, toDirectoryItem } from "@/lib/tools/registry";
import { localizeCategory, localizeTool } from "@/lib/tools/localize";
import { getLocale, getT } from "@/lib/locale-server";
import { localizeHref } from "@/lib/i18n";
import { GuideList } from "@/components/guides/guide-list";
import { guidesForTool } from "@/lib/guides/guides";
import { Rich } from "@/components/guides/rich";
import { deepDiveFor } from "@/lib/tools/deep-dives";

type Params = { slug: string };

/** The usual page has a sidebar of related tools; a full-width tool (a big workspace) goes without. */
function MaybeSidebar({ on, sidebar, children }: { on: boolean; sidebar: ReactNode; children: ReactNode }) {
  return on ? <WithSidebar sidebar={sidebar}>{children}</WithSidebar> : <div className="min-w-0 @container">{children}</div>;
}

export function generateStaticParams(): Params[] {
  return getPublishedTools().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const raw = getTool(slug);
  const locale = await getLocale();
  if (!raw) return { title: (await getT()).toolPage.notFound };
  const tool = localizeTool(raw, locale);
  return pageMetadata({
    locale,
    title: tool.seoTitle,
    description: tool.seoDescription,
    path: `/tools/${tool.slug}`,
    absoluteTitle: true,
    // Only fully working tools are promoted to search engines.
    noindex: tool.status !== "active",
  });
}

export default async function ToolPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const raw = getTool(slug);
  if (!raw) notFound();
  const locale = await getLocale();
  const t = await getT();
  const tool = localizeTool(raw, locale);
  const abs = (path: string) => absoluteUrl(localizeHref(path, locale));

  const category = localizeCategory(getCategory(tool.category), locale);
  const related = getRelatedTools(raw, 8).map((r) => toDirectoryItem(r, locale));
  const url = abs(`/tools/${tool.slug}`);
  const toolGuides = guidesForTool(tool.id, locale);
  const deepDive = deepDiveFor(tool.id, locale);

  const structuredData: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.common.home, item: abs("/") },
        { "@type": "ListItem", position: 2, name: t.toolPage.allTools, item: abs("/tools") },
        { "@type": "ListItem", position: 3, name: category.name, item: abs(`/categories/${category.slug}`) },
        { "@type": "ListItem", position: 4, name: tool.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: tool.name,
      url,
      description: tool.description,
      inLanguage: locale,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any (web browser)",
      publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: tool.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ];

  return (
    <>
      <JsonLd data={structuredData} />
      <div className="border-b border-line">
        <div className="container-page pb-8 pt-6 sm:pt-8">
          <Breadcrumbs
            compact
            items={[
              { name: t.common.home, href: "/" },
              { name: t.toolPage.allTools, href: "/tools" },
              { name: category.name, href: `/categories/${category.slug}` },
              { name: tool.name },
            ]}
          />
          <ToolHeader tool={tool} categoryName={category.name} categorySlug={category.slug} />
        </div>
      </div>
      <div className="container-page py-8 sm:py-10">
        <MaybeSidebar on={!tool.fullWidth} sidebar={<RelatedTools tools={related} />}>
          <StatusNotice tool={tool} />
          {/* The workspace comes first: people arrive to use the tool, not to read about it. */}
          {tool.status !== "coming-soon" && <ToolWorkspace toolId={tool.id} />}

          <div className="mt-8">
            <PrivacyDisclosure tool={tool} />
          </div>

          <div className="mt-10 space-y-4">
            <HowTo steps={tool.howTo} />
            <Examples examples={tool.examples} />
            <Faq faqs={tool.faqs} />
            <section aria-labelledby="about-heading" className="card p-5">
              <h2 id="about-heading" className="text-[0.95rem] font-semibold">{t.toolPage.about}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
                {tool.intro.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
            {deepDive && (
              <section aria-labelledby="tips-heading" className="card p-5">
                <h2 id="tips-heading" className="text-[0.95rem] font-semibold">{locale === "ar" ? `نصائح ومشكلات شائعة: ${tool.name}` : `Tips and common problems: ${tool.name}`}</h2>
                {deepDive.map((d) => (
                  <div key={d.heading} className="mt-4">
                    <h3 className="text-sm font-semibold">{d.heading}</h3>
                    <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted">
                      {d.paragraphs.map((p) => <p key={p}><Rich text={p} /></p>)}
                    </div>
                  </div>
                ))}
              </section>
            )}
            {toolGuides.length > 0 && (
              <section aria-labelledby="guides-heading" className="card p-5">
                <h2 id="guides-heading" className="text-[0.95rem] font-semibold">{locale === "ar" ? "الأدلة" : "Guides"}</h2>
                <div className="mt-4"><GuideList items={toolGuides} /></div>
              </section>
            )}
          </div>
          {tool.fullWidth && <div className="mt-6"><RelatedTools tools={related} /></div>}
        </MaybeSidebar>
      </div>
    </>
  );
}
