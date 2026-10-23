import Image from "next/image";
import { cx } from "@/components/ui/cx";

/** The Artify Tools mark: the ribbon A with the tool and app icons around it. */
const MARK = { src: "/brand/artify-tools-mark.webp", width: 375, height: 283 };

export function LogoMark({ height = 36, className, priority }: { height?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src={MARK.src}
      alt=""
      width={Math.round((height * MARK.width) / MARK.height)}
      height={height}
      unoptimized
      priority={priority}
      className={cx("shrink-0 select-none", className)}
      draggable={false}
    />
  );
}

/** "Artify" in the text colour, "Tools" in the brand gradient. Always Latin, also on Arabic pages. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span dir="ltr" className={cx("whitespace-nowrap font-extrabold tracking-tight", className)}>
      Artify <span className="text-brand-gradient">Tools</span>
    </span>
  );
}

/** Header/menu lockup: mark + wordmark. */
export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5", className)}>
      <LogoMark height={30} priority={priority} />
      <Wordmark className="text-[1.05rem]" />
    </span>
  );
}

/** Footer lockup: larger mark and wordmark (the link), with the tagline and parent-brand line beside it. */
export function LogoLockup({ tagline, byLine, homeLabel, homeLink: HomeLink }: { tagline: string; byLine: string; homeLabel: string; homeLink: React.ComponentType<{ href: string; "aria-label": string; className?: string; children: React.ReactNode }> }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark height={56} />
      <div className="flex flex-col">
        <HomeLink href="/" aria-label={homeLabel} className="rounded-md">
          <Wordmark className="text-2xl leading-tight" />
        </HomeLink>
        <p className="text-sm font-medium text-fg">{tagline}</p>
        <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted">{byLine}</p>
      </div>
    </div>
  );
}
