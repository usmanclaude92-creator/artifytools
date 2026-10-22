import type { Metadata } from "next";
import Link from "@/components/ui/locale-link";
import { PageHeader } from "@/components/layout/page-header";
import { buttonClasses } from "@/components/ui/button";
import { IconTile } from "@/components/ui/misc";
import { getApps } from "@/lib/apps";
import { pageMetadata } from "@/lib/seo/metadata";
import { getLocale, getT } from "@/lib/locale-server";

export async function generateMetadata(): Promise<Metadata> {
  const p = (await getT()).pages.apps;
  return pageMetadata({ title: p.title, description: p.metaDescription, path: "/apps", locale: await getLocale() });
}

export default async function AppsPage() {
  const apps = getApps();
  const t = await getT();
  const p = t.pages.apps;
  return (
    <>
      <PageHeader
        title={p.title}
        description={p.description}
        breadcrumbs={[{ name: t.common.home, href: "/" }, { name: p.title }]}
      />
      <div className="container-page py-10">
        {apps.length === 0 ? (
          <div className="card mx-auto flex max-w-xl flex-col items-center gap-4 p-10 text-center">
            <IconTile name="layers" tone="violet" />
            <h2 className="text-xl font-semibold">{p.emptyTitle}</h2>
            <p className="text-muted">{p.emptyText}</p>
            <Link href="/tools" className={buttonClasses({ size: "md" })}>
              {p.browse}
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {apps.map((a) => (
              <li key={a.slug}>
                <article className="card card-interactive relative flex h-full flex-col gap-3.5 p-5 focus-within:ring-2 focus-within:ring-[var(--focus)]">
                  <IconTile name={a.icon} />
                  <div className="flex-1">
                    <h2 className="text-[1.02rem] font-semibold leading-snug">
                      <Link href={a.href} className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none">
                        {a.name}
                      </Link>
                    </h2>
                    <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted">{a.description}</p>
                  </div>
                  <span className="tile-violet inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-medium">{a.category}</span>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
