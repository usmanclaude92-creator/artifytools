import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import Link from "@/components/ui/locale-link";
import { Faq } from "@/components/tools/tool-sections";
import { JsonLd } from "@/components/ui/json-ld";
import { absoluteUrl, siteConfig } from "@/lib/config";
import { getGuide, guides } from "@/lib/guides/guides";
import { pageMetadata } from "@/lib/seo/metadata";
import { getLocale } from "@/lib/locale-server";
import { getTool } from "@/lib/tools/registry";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return { title: "Guide not found" };
  const locale = await getLocale();
  const meta = pageMetadata({ title: g.title, description: g.description, path: `/guides/${g.slug}` });
  const english = { canonical: absoluteUrl(`/guides/${g.slug}`) };
  return locale === "ar" ? { ...meta, alternates: english, robots: { index: false, follow: true } } : { ...meta, alternates: english };
}

export default async function GuidePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();
  const tools = g.tools.map((id) => getTool(id)).filter((t) => t !== undefined);
  const url = absoluteUrl(`/guides/${g.slug}`);
  const others = guides.filter((x) => x.slug !== g.slug).slice(0, 4);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: g.title,
            description: g.description,
            inLanguage: "en",
            dateModified: g.updated,
            datePublished: g.updated,
            mainEntityOfPage: url,
            author: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
            publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("/guides") },
              { "@type": "ListItem", position: 3, name: g.title, item: url },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: g.faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
          },
        ]}
      />
      <PageHeader title={g.title} description={g.description} breadcrumbs={[{ name: "Home", href: "/" }, { name: "Guides", href: "/guides" }, { name: g.title }]} />
      <div lang="en" dir="ltr" className="container-page grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <article className="max-w-3xl">
          <p className="text-lg leading-relaxed">{g.intro}</p>
          {g.sections.map((s) => (
            <section key={s.heading} className="mt-9">
              <h2 className="text-xl font-semibold tracking-tight">{s.heading}</h2>
              {s.paragraphs.map((p) => (
                <p key={p} className="mt-3 leading-relaxed text-muted">{p}</p>
              ))}
              {s.list && (
                s.list.ordered ? (
                  <ol className="mt-3 list-decimal space-y-2 ps-6 text-muted marker:font-semibold">{s.list.items.map((i) => <li key={i} className="ps-1 leading-relaxed">{i}</li>)}</ol>
                ) : (
                  <ul className="mt-3 list-disc space-y-2 ps-6 text-muted">{s.list.items.map((i) => <li key={i} className="ps-1 leading-relaxed">{i}</li>)}</ul>
                )
              )}
            </section>
          ))}
          <div className="mt-10"><Faq faqs={g.faqs} /></div>
          <p className="mt-8 text-sm text-muted">Last updated {new Date(`${g.updated}T00:00:00Z`).toLocaleDateString("en", { dateStyle: "long", timeZone: "UTC" })}.</p>
        </article>
        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <section aria-labelledby="tools-heading" className="card p-5">
            <h2 id="tools-heading" className="text-base font-semibold">Free tools for this</h2>
            <ul className="mt-3 space-y-1">
              {tools.map((t) => (
                <li key={t.id}>
                  <Link href={`/tools/${t.slug}`} className="inline-flex min-h-9 items-center text-sm font-medium text-accent-text underline-offset-4 hover:underline">{t.name}</Link>
                  <p className="text-xs text-muted">{t.description}</p>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="more-heading" className="card p-5">
            <h2 id="more-heading" className="text-base font-semibold">More guides</h2>
            <ul className="mt-3 space-y-1">
              {others.map((o) => (
                <li key={o.slug}><Link href={`/guides/${o.slug}`} className="inline-flex min-h-9 items-center text-sm text-muted hover:text-fg">{o.title}</Link></li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
