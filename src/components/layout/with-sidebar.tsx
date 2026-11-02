import type { ReactNode } from "react";

/**
 * Main content with a sidebar at the end of the line (right in English, left in Arabic, because the grid follows
 * the page direction). Below the xl breakpoint the sidebar drops under the content so the main column keeps its width.
 */
export function WithSidebar({ children, sidebar }: { children: ReactNode; sidebar: ReactNode }) {
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
      <div className="min-w-0 @container">{children}</div>
      <aside className="min-w-0 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-7rem)] xl:overflow-y-auto xl:overscroll-contain">{sidebar}</aside>
    </div>
  );
}
