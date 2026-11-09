import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { GuideList } from "@/components/guides/guide-list";
import { guidesFor } from "@/lib/guides/guides";
import { guideText } from "@/lib/guides/text";
import { pageMetadata } from "@/lib/seo/metadata";
import { getLocale } from "@/lib/locale-server";
import { absoluteUrl } from "@/lib/config";
import { localizeHref } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = guideText[locale];
  const meta = pageMetadata({ title: t.indexTitle, description: t.indexMeta, path: "/guides", locale });
  return { ...meta, alternates: { canonical: absoluteUrl(localizeHref("/guides", locale)) } };
}

export default async function GuidesPage() {
  const locale = await getLocale();
  const t = guideText[locale];
  return (
    <>
      <PageHeader title={t.indexTitle} description={t.indexIntro} breadcrumbs={[{ name: t.home, href: "/" }, { name: t.guides }]} />
      <div className="container-page py-10">
        <GuideList items={guidesFor(locale)} />
      </div>
    </>
  );
}
