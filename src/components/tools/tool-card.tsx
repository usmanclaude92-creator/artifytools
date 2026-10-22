import Link from "next/link";
import { Badge, IconTile } from "@/components/ui/misc";
import { cx } from "@/components/ui/cx";
import { categoryTones } from "@/lib/tools/tones";
import type { DirectoryItem } from "@/lib/tools/registry";

/** Whole-card click target via a stretched link on the heading (keeps one tab stop, valid markup). */
export function ToolCard({ tool, showCategory = true, heading: Heading = "h3" }: { tool: DirectoryItem; showCategory?: boolean; heading?: "h2" | "h3" }) {
  const tone = categoryTones[tool.categoryId];
  return (
    <article className="card card-interactive relative flex h-full flex-col gap-3.5 p-5 focus-within:ring-2 focus-within:ring-[var(--focus)]">
      <div className="flex items-start justify-between gap-3">
        <IconTile name={tool.icon} tone={tone} />
        <div className="flex flex-wrap justify-end gap-1.5">
          {tool.status === "beta" && <Badge tone="warning">Beta</Badge>}
          {tool.aiPowered && <Badge tone="accent">AI</Badge>}
        </div>
      </div>
      <div className="flex-1">
        <Heading className="text-[1.02rem] font-semibold leading-snug">
          <Link href={`/tools/${tool.slug}`} className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none">
            {tool.name}
          </Link>
        </Heading>
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted">{tool.description}</p>
      </div>
      {showCategory && (
        <div>
          <span className={cx("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", `tile-${tone}`)}>{tool.categoryName}</span>
        </div>
      )}
    </article>
  );
}

export function ToolGrid({ tools, showCategory = true, columns = 4, heading }: { tools: DirectoryItem[]; showCategory?: boolean; columns?: 3 | 4 | 5; heading?: "h2" | "h3" }) {
  const cols = columns === 5 ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" : columns === 4 ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <ul className={`grid gap-4 ${cols}`}>
      {tools.map((t) => (
        <li key={t.id}>
          <ToolCard tool={t} showCategory={showCategory} heading={heading} />
        </li>
      ))}
    </ul>
  );
}
