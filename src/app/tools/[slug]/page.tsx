import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ToolWorkspace } from "@/components/tools/tool-components";
import { Examples, Faq, HowTo, PrivacyDisclosure, RelatedTools, StatusNotice, ToolHeader } from "@/components/tools/tool-sections";
import { JsonLd } from "@/components/ui/json-ld";
import { absoluteUrl, siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo/metadata";
import { getCategory } from "@/lib/tools/categories";
import { getPublishedTools, getRelatedTools, getTool, toDirectoryItem } from "@/lib/tools/registry";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getPublishedTools().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool || tool.status === "coming-soon") return { title: "Tool not found" };
  return pageMetadata({
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
  const tool = getTool(slug);
  if (!tool || tool.status === "coming-soon") notFound();

  const category = getCategory(tool.category);
  const related = getRelatedTools(tool, 3).map(toDirectoryItem);
  const url = absoluteUrl(`/tools/${tool.slug}`);

  const structuredData: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "All Tools", item: absoluteUrl("/tools") },
        { "@type": "ListItem", position: 3, name: category.name, item: absoluteUrl(`/categories/${category.slug}`) },
        { "@type": "ListItem", position: 4, name: tool.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: tool.name,
      url,
      description: tool.description,
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
              { name: "Home", href: "/" },
              { name: "All Tools", href: "/tools" },
              { name: category.name, href: `/categories/${category.slug}` },
              { name: tool.name },
            ]}
          />
          <ToolHeader tool={tool} categoryName={category.name} categorySlug={category.slug} />
        </div>
      </div>
      <div className="container-page py-8 sm:py-10">
        <StatusNotice tool={tool} />
        {/* The workspace comes first: people arrive to use the tool, not to read about it. */}
        <ToolWorkspace toolId={tool.id} />

        <div className="mt-8">
          <PrivacyDisclosure tool={tool} />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-4">
            <HowTo steps={tool.howTo} />
            <Examples examples={tool.examples} />
            <Faq faqs={tool.faqs} />
          </div>
          <div className="space-y-6">
            <RelatedTools tools={related} />
            <section aria-labelledby="about-heading" className="card p-5">
              <h2 id="about-heading" className="text-[0.95rem] font-semibold">About this tool</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
                {tool.intro.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
