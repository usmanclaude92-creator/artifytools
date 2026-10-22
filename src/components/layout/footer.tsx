import Link from "@/components/ui/locale-link";
import { siteConfig } from "@/lib/config";
import { Logo } from "./logo";
import { footerGroups } from "./nav-links";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link href="/" aria-label="Artify Tools home" className="inline-block rounded-md">
            <Logo />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{siteConfig.tagline} Thoughtfully designed online tools for writing, calculating, and building — most of them running right in your browser.</p>
          {siteConfig.contactEmail && (
            <p className="mt-4 text-sm text-muted">
              Contact: <a href={`mailto:${siteConfig.contactEmail}`} className="font-medium text-accent-text underline underline-offset-2">{siteConfig.contactEmail}</a>
            </p>
          )}
        </div>
        {footerGroups.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <h2 className="text-sm font-semibold">{g.title}</h2>
            <ul className="mt-4 space-y-1">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-9 items-center text-sm text-muted transition-colors hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Artify Tools. All rights reserved.</p>
          <p>Most tools run entirely in your browser.</p>
        </div>
      </div>
    </footer>
  );
}
