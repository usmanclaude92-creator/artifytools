import type { Metadata } from "next";
import Link from "@/components/ui/locale-link";
import { PageHeader } from "@/components/layout/page-header";
import { buttonClasses } from "@/components/ui/button";
import { IconTile } from "@/components/ui/misc";
import { getApps } from "@/lib/apps";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Apps",
  description: "Browse Artify apps: focused products built with the same care as our tools.",
  path: "/apps",
});

export default function AppsPage() {
  const apps = getApps();
  return (
    <>
      <PageHeader
        title="Apps"
        description="Focused products from Artify, built with the same care as our tools."
        breadcrumbs={[{ name: "Home", href: "/" }, { name: "Apps" }]}
      />
      <div className="container-page py-10">
        {apps.length === 0 ? (
          <div className="card mx-auto flex max-w-xl flex-col items-center gap-4 p-10 text-center">
            <IconTile name="layers" tone="violet" />
            <h2 className="text-xl font-semibold">Apps are on the way</h2>
            <p className="text-muted">No apps are listed yet. In the meantime, every Artify tool is free to use.</p>
            <Link href="/tools" className={buttonClasses({ size: "md" })}>
              Browse all tools
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
