import type { IconName } from "@/components/ui/icon";

export interface AppDefinition {
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: IconName;
  /** Where the app lives: an internal path or an external URL. */
  href: string;
}

/**
 * Single source of truth for the Apps section. To add an app, append an entry;
 * the /apps directory and sitemap pick it up automatically.
 */
export const apps: readonly AppDefinition[] = [];

export function getApps(): AppDefinition[] {
  return [...apps];
}
