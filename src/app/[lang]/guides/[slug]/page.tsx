import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import Link from "@/components/ui/locale-link";
import { Faq } from "@/components/tools/tool-sections";
import { JsonLd } from "@/components/ui/json-ld";
import { Rich, plain } from "@/components/guides/rich";
import { absoluteUrl, siteConfig } from "@/lib/config";
import { getGuide, guidesFor, type Guide } from "@/lib/guides/guides";
import { guideText } from "@/lib/guides/text";
import { pageMetadata } from "@/lib/seo/metadata";
import { getLocale } from "@/lib/locale-server";
import { getTool } from "@/lib/tools/registry";
import { localizeTool } from "@/lib/tools/localize";
import { localizeHref, locales, type Locale } from "@/lib/i18n";

type Params = { lang: string; slug: string };

export function generateStaticParams(): Params[] {
  return locales.flatMap((lang) => guidesFor(lang === "ar" ? "ar" : "en").map((g) => ({ lang, slug: g.slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const g = getGuide(slug, locale);
  if (!g) return { title: "Not found" };
  // A guide exists in one language only, so it has no translations to point to.
  const meta = pageMetadata({ title: g.title, description: g.description, path: `/guides/${g.slug}`, locale });
  return { ...meta, alternates: { canonical: absoluteUrl(localizeHref(`/guides/${g.slug}`, locale)) } };
}

export default async function GuidePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const locale: Locale = await getLocale();
  const g: Guide | undefined = getGuide(slug, locale);
  if (!g) notFound();
  const t = guideText[locale];
  const url = absoluteUrl(localizeHref(`/guides/${g.slug}`, locale));
  const tools = g.tools.map((id) => getTool(id)).filter((x) => x !== undefined).map((x) => localizeTool(x, locale));
  const all = guidesFor(locale);
  const related = (g.related ?? []).map((s) => all.find((x) => x.slug === s)).filter((x): x is Guide => Boolean(x));
  const more = related.length ? related : all.filter((x) => x.slug !== g.slug).slice(0, 3);
  const date = new Date(`${g.updated}T00:00:00Z`).toLocaleDateString(locale === "ar" ? "ar" : "en", { dateStyle: "long", timeZone: "UTC" });

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: g.title,
            description: g.description,
            inLanguage: locale,
            dateModified: g.updated,
            datePublished: g.updated,
            mainEntityOfPage: url,
            about: tools.map((x) => ({ "@type": "SoftwareApplication", name: x.name, url: absoluteUrl(localizeHref(`/tools/${x.slug}`, locale)) })),
            author: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
            publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url, logo: { "@type": "ImageObject", url: absoluteUrl("/brand/artify-tools-logo-light-600.webp") } },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t.home, item: absoluteUrl(localizeHref("/", locale)) },
              { "@type": "ListItem", position: 2, name: t.guides, item: absoluteUrl(localizeHref("/guides", locale)) },
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
      <PageHeader title={g.title} description={g.description} breadcrumbs={[{ name: t.home, href: "/" }, { name: t.guides, href: "/guides" }, { name: g.title }]} />
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <article className="max-w-3xl">
          {g.summary && (
            <div className="rounded-xl border border-accent bg-accent-soft p-5">
              <p className="text-sm font-semibold">{t.shortAnswer}</p>
              <p className="mt-1.5 leading-relaxed"><Rich text={g.summary} /></p>
            </div>
          )}
          <p className="mt-6 text-lg leading-relaxed"><Rich text={g.intro} /></p>
          {g.sections.length > 3 && (
            <nav aria-label={t.contents} className="mt-6 rounded-xl border border-line p-4">
              <p className="text-sm font-semibold">{t.contents}</p>
              <ol className="mt-2 list-decimal space-y-1 ps-5 text-sm">
                {g.sections.map((s, i) => <li key={s.heading}><a href={`#s${i + 1}`} className="text-accent-text underline-offset-4 hover:underline">{s.heading}</a></li>)}
              </ol>
            </nav>
          )}
          {g.sections.map((s, i) => (
            <section key={s.heading} id={`s${i + 1}`} className="mt-9 scroll-mt-24">
              <h2 className="text-xl font-semibold tracking-tight">{s.heading}</h2>
              {s.paragraphs.map((p) => (
                <p key={p} className="mt-3 leading-relaxed text-muted"><Rich text={p} /></p>
              ))}
              {s.list && (
                s.list.ordered ? (
                  <ol className="mt-3 list-decimal space-y-2 ps-6 text-muted marker:font-semibold">{s.list.items.map((x) => <li key={x} className="ps-1 leading-relaxed"><Rich text={x} /></li>)}</ol>
                ) : (
                  <ul className="mt-3 list-disc space-y-2 ps-6 text-muted">{s.list.items.map((x) => <li key={x} className="ps-1 leading-relaxed"><Rich text={x} /></li>)}</ul>
                )
              )}
            </section>
          ))}
          <div className="mt-10"><Faq faqs={g.faqs.map((f) => ({ question: f.question, answer: plain(f.answer) }))} /></div>
          <p className="mt-8 text-sm text-muted">{t.byline(siteConfig.name, date)}</p>
        </article>
        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <section aria-labelledby="tools-heading" className="card p-5">
            <h2 id="tools-heading" className="text-base font-semibold">{t.toolsFor}</h2>
            <ul className="mt-3 space-y-2">
              {tools.map((x) => (
                <li key={x.id}>
                  <Link href={`/tools/${x.slug}`} className="inline-flex min-h-9 items-center text-sm font-medium text-accent-text underline-offset-4 hover:underline">{x.name}</Link>
                  <p className="text-xs text-muted">{x.description}</p>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="more-heading" className="card p-5">
            <h2 id="more-heading" className="text-base font-semibold">{t.moreGuides}</h2>
            <ul className="mt-3 space-y-1">
              {more.map((o) => (
                <li key={o.slug}><Link href={`/guides/${o.slug}`} className="inline-flex min-h-9 items-center text-sm text-muted hover:text-fg">{o.title}</Link></li>
              ))}
              <li><Link href="/guides" className="inline-flex min-h-9 items-center text-sm font-medium text-accent-text">{t.allGuides}</Link></li>
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
