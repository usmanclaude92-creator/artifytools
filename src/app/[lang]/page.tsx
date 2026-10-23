import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { ClosingCta, CoreSections, HowItWorks, MoreTools, PopularTools, PrivacySection, PromoBanner, TrustStrip } from "@/components/home/sections";
import { JsonLd } from "@/components/ui/json-ld";
import { absoluteUrl, siteConfig } from "@/lib/config";
import { getPublishedCategories, getSearchItems } from "@/lib/tools/registry";
import { pageMetadata } from "@/lib/seo/metadata";
import { getLocale, getT } from "@/lib/locale-server";
import { localizeHref } from "@/lib/i18n";
import { localizeCategory } from "@/lib/tools/localize";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getT();
  return pageMetadata({
    title: `${siteConfig.name} — ${t.site.tagline}`,
    description: t.site.description,
    path: "/",
    absoluteTitle: true,
    locale,
  });
}

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getT();
  const categories = getPublishedCategories().map((c) => ({ name: localizeCategory(c, locale).name, slug: c.slug }));
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteConfig.name,
          url: absoluteUrl(localizeHref("/", locale)),
          description: t.site.description,
          inLanguage: locale,
          potentialAction: {
            "@type": "SearchAction",
            target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl(localizeHref("/tools", locale))}?q={search_term_string}` },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <Hero items={getSearchItems(locale)} categories={categories} />
      <CoreSections />
      <PopularTools />
      <TrustStrip />
      <MoreTools />
      <PromoBanner />
      <HowItWorks />
      <PrivacySection />
      <ClosingCta />
    </>
  );
}
