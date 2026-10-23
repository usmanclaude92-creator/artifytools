import { cx } from "@/components/ui/cx";

/** The full brand lockup artwork (mark, wordmark, tagline, parent brand), in light and dark versions. */
const LOCKUP = { width: 1192, height: 316 };
const SIZES = [400, 600, 800];
const srcSet = (theme: "light" | "dark") => [...SIZES.map((w) => `/brand/artify-tools-logo-${theme}-${w}.webp ${w}w`), `/brand/artify-tools-logo-${theme}.webp ${LOCKUP.width}w`].join(", ");

/**
 * Lockup image at `height` px; the theme decides which version shows (see .logo-on-light / .logo-on-dark).
 * Both are lazy so the hidden one (display: none) is never downloaded, and srcset picks the
 * smallest file that is sharp at the screen's pixel density.
 */
export function LogoLockupImage({ height, className }: { height: number; className?: string; priority?: boolean }) {
  const width = Math.round((height * LOCKUP.width) / LOCKUP.height);
  const img = (theme: "light" | "dark") => (
    // eslint-disable-next-line @next/next/no-img-element -- static artwork with a hand-made srcset
    <img src={`/brand/artify-tools-logo-${theme}-${SIZES[0]}.webp`} srcSet={srcSet(theme)} sizes={`${width}px`} alt="" width={width} height={height} loading="lazy" decoding="async" draggable={false} className={`logo-on-${theme} size-full`} />
  );
  return (
    <span className={cx("inline-block shrink-0 select-none", className)} style={{ width, height }}>
      {img("light")}
      {img("dark")}
    </span>
  );
}

/** Header and menu logo. */
export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return <LogoLockupImage height={52} priority={priority} className={className} />;
}

/** Footer logo: the lockup, larger, linking home; tagline and parent brand also given as text for screen readers. */
export function LogoLockup({ tagline, byLine, homeLabel, homeLink: HomeLink }: { tagline: string; byLine: string; homeLabel: string; homeLink: React.ComponentType<{ href: string; "aria-label": string; className?: string; children: React.ReactNode }> }) {
  return (
    <div>
      <HomeLink href="/" aria-label={homeLabel} className="inline-block rounded-md">
        <LogoLockupImage height={84} className="max-w-full" />
      </HomeLink>
      <p className="sr-only">{tagline} {byLine}</p>
    </div>
  );
}
