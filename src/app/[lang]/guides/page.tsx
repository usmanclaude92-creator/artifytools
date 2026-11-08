import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { GuideList } from "@/components/guides/guide-list";
import { guides } from "@/lib/guides/guides";
import { pageMetadata } from "@/lib/seo/metadata";
import { getLocale } from "@/lib/locale-server";
import { absoluteUrl } from "@/lib/config";

/** Guides are written in English; the Arabic URL shows the same text and points search engines at the English page. */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const meta = pageMetadata({
    title: "Guides",
    description: "Step-by-step guides for everyday document and file tasks: merging and compressing PDFs, converting bank statements, writing cheque amounts in words, resizing images and keeping files private.",
    path: "/guides",
  });
  const english = { canonical: absoluteUrl("/guides") };
  return locale === "ar" ? { ...meta, alternates: english, robots: { index: false, follow: true } } : { ...meta, alternates: english };
}

export default function GuidesPage() {
  return (
    <>
      <PageHeader
        title="Guides"
        description="Plain-language, step-by-step help for everyday document and file tasks, with the free tools that do the job."
        breadcrumbs={[{ name: "Home", href: "/" }, { name: "Guides" }]}
      />
      <div lang="en" dir="ltr" className="container-page py-10">
        <GuideList items={guides} />
      </div>
    </>
  );
}
