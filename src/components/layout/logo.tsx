import Image from "next/image";
import { cx } from "@/components/ui/cx";

/** The full brand lockup artwork (mark, wordmark, tagline, parent brand), in light and dark versions. */
const LOCKUP = { light: "/brand/artify-tools-logo-light.webp", dark: "/brand/artify-tools-logo-dark.webp", width: 1192, height: 316 };

/** Lockup image at `height` px; the theme decides which version shows (see .logo-on-light / .logo-on-dark). */
export function LogoLockupImage({ height, className, priority }: { height: number; className?: string; priority?: boolean }) {
  const width = Math.round((height * LOCKUP.width) / LOCKUP.height);
  return (
    <span className={cx("inline-block shrink-0 select-none", className)} style={{ width, height }}>
      <Image src={LOCKUP.light} alt="" width={width} height={height} unoptimized priority={priority} draggable={false} className="logo-on-light size-full" />
      <Image src={LOCKUP.dark} alt="" width={width} height={height} unoptimized priority={priority} draggable={false} className="logo-on-dark size-full" />
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
