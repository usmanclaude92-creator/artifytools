import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { AiShowcase, CategoriesSection, ClosingCta, HowItWorks, PopularTools, PrivacySection, PromoBanner } from "@/components/home/sections";
import { JsonLd } from "@/components/ui/json-ld";
import { absoluteUrl, siteConfig } from "@/lib/config";
import { getPublishedCategories, getSearchItems } from "@/lib/tools/registry";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  path: "/",
  absoluteTitle: true,
});

export default function HomePage() {
  const categories = getPublishedCategories().map((c) => ({ name: c.name, slug: c.slug }));
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteConfig.name,
          url: absoluteUrl("/"),
          description: siteConfig.description,
          potentialAction: {
            "@type": "SearchAction",
            target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/tools")}?q={search_term_string}` },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <Hero items={getSearchItems()} categories={categories} />
      <PopularTools />
      <CategoriesSection />
      <PromoBanner />
      <HowItWorks />
      <AiShowcase />
      <PrivacySection />
      <ClosingCta />
    </>
  );
}
