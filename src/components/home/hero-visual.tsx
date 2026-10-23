import { Icon, type IconName } from "@/components/ui/icon";
import Image from "next/image";

/**
 * Decorative brand illustration: the Artify Tools app icon surrounded by floating tool tiles
 * (images, documents, code, calculators) on soft orbital curves. SVG/CSS plus the logo mark.
 */
const tiles: { icon: IconName; className: string; float: string; tone: string }[] = [
  { icon: "image", className: "right-[6%] top-[4%] size-[4.5rem] sm:size-20", float: "motion-float", tone: "tile-blue" },
  { icon: "file-text", className: "left-[4%] top-[50%] size-[4.25rem] sm:size-[4.75rem]", float: "motion-float-delayed", tone: "tile-violet" },
  { icon: "code", className: "bottom-[4%] right-[14%] size-[4.5rem] sm:size-20", float: "motion-float", tone: "tile-violet" },
  { icon: "calculator", className: "left-[18%] top-[8%] size-14 sm:size-16", float: "motion-float-delayed", tone: "tile-green" },
];

export function HeroVisual() {
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-[1/0.92] w-full max-w-[34rem] select-none">
      {/* ambient glow */}
      <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--accent)_26%,transparent),transparent)] blur-2xl" />

      {/* orbital curves */}
      <svg viewBox="0 0 100 92" className="absolute inset-0 size-full" fill="none">
        <defs>
          <linearGradient id="orbit-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3895ff" stopOpacity="0.0" />
            <stop offset="0.5" stopColor="#6547ff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#3895ff" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="48" rx="46" ry="19" transform="rotate(-24 50 48)" stroke="url(#orbit-a)" strokeWidth="0.5" />
        <ellipse cx="50" cy="48" rx="40" ry="31" transform="rotate(18 50 48)" stroke="url(#orbit-a)" strokeWidth="0.35" />
        <circle cx="86" cy="30" r="1" fill="#6547ff" fillOpacity="0.6" />
        <circle cx="18" cy="72" r="0.8" fill="#3895ff" fillOpacity="0.6" />
      </svg>

      {/* layered glass plate behind the hero tile */}
      <div className="glass-tile absolute left-1/2 top-[48%] size-[46%] -translate-x-1/2 -translate-y-1/2 rotate-6 rounded-[2rem]" />
      <div className="glass-tile absolute left-1/2 top-[48%] size-[40%] -translate-x-[48%] -translate-y-[54%] -rotate-3 rounded-[1.75rem] opacity-70" />

      {/* central Artify Tools app icon */}
      <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2">
        <div className="motion-float grid size-[7.25rem] place-items-center hero-logo-tile rounded-[1.9rem] sm:size-40">
          <Image src="/brand/artify-tools-mark-full.webp" alt="" width={388} height={340} unoptimized priority draggable={false} className="h-auto w-[84%] select-none object-contain" />
        </div>
      </div>

      {tiles.map((t) => (
        <div key={t.icon} className={`absolute ${t.className}`}>
          <div className={`${t.float} glass-tile grid size-full place-items-center rounded-[1.4rem] bg-surface text-accent-text`}>
            <span className={`grid size-[58%] place-items-center rounded-xl ${t.tone}`}>
              <Icon name={t.icon} size={28} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
