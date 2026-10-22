import type { Metadata } from "next";
import Link from "@/components/ui/locale-link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/misc";
import { pageMetadata } from "@/lib/seo/metadata";
import { getLocale, getT } from "@/lib/locale-server";
import { localizeTool } from "@/lib/tools/localize";
import { getActiveTools, getPublishedTools } from "@/lib/tools/registry";

export async function generateMetadata(): Promise<Metadata> {
  const p = (await getT()).pages.changelog;
  return pageMetadata({ title: p.title, description: p.metaDescription, path: "/changelog", locale: await getLocale() });
}

export default async function ChangelogPage() {
  const locale = await getLocale();
  const m = await getT();
  const p = m.pages.changelog;
  const active = getActiveTools().map((t) => localizeTool(t, locale));
  const beta = getPublishedTools().filter((t) => t.status === "beta").map((t) => localizeTool(t, locale));
  return (
    <>
      <PageHeader title={p.title} description={p.description} breadcrumbs={[{ name: m.common.home, href: "/" }, { name: p.title }]} />
      <div className="container-page py-10">
        <article className="max-w-3xl" aria-labelledby="v010">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="v010" className="text-2xl font-semibold">{p.v010}</h2>
            <Badge tone="accent">{p.v010Date}</Badge>
          </div>
          <div className="prose-artify mt-2">
            <p>{p.firstRelease}</p>
            <h3>{p.toolsHeading(active.length)}</h3>
            <ul>
              {active.map((t) => (
                <li key={t.id}><Link href={`/tools/${t.slug}`}>{t.name}</Link> — {t.description}</li>
              ))}
            </ul>
            {beta.length > 0 && (
              <>
                <h3>{p.beta}</h3>
                <ul>
                  {beta.map((t) => (
                    <li key={t.id}><Link href={`/tools/${t.slug}`}>{t.name}</Link> — {p.betaNote}</li>
                  ))}
                </ul>
              </>
            )}
            <h3>{p.platform}</h3>
            <ul>
              {p.platformItems.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </>
  );
}
