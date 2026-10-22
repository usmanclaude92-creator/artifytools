import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { Icon } from "@/components/ui/icon";

export function AnnouncementBar() {
  return (
    <div className="bg-accent bg-(image:--gradient-btn) text-accent-fg">
      <div className="container-page flex min-h-9 flex-wrap items-center justify-center gap-x-3 gap-y-0.5 py-1.5 text-center text-[0.8rem] font-medium">
        <p>{siteConfig.announcement}</p>
        <Link href="/tools" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
          Explore tools <Icon name="arrow-right" size={13} />
        </Link>
      </div>
    </div>
  );
}
