import type { Messages } from "@/lib/messages";

type NavKey = keyof Messages["nav"];

export const primaryNav: readonly { href: string; key: NavKey }[] = [
  { href: "/tools", key: "tools" },
  { href: "/apps", key: "apps" },
  { href: "/categories", key: "categories" },
  { href: "/ai-tools", key: "aiTools" },
  { href: "/for-professionals", key: "forProfessionals" },
  { href: "/about", key: "about" },
];

export const footerGroups: readonly { title: "explore" | "company" | "legal"; links: readonly { href: string; key: NavKey }[] }[] = [
  {
    title: "explore",
    links: [
      { href: "/tools", key: "tools" },
      { href: "/apps", key: "apps" },
      { href: "/categories", key: "categories" },
      { href: "/ai-tools", key: "aiTools" },
      { href: "/for-professionals", key: "forProfessionals" },
    ],
  },
  {
    title: "company",
    links: [
      { href: "/about", key: "about" },
      { href: "/contact", key: "contact" },
      { href: "/help", key: "help" },
      { href: "/changelog", key: "changelog" },
    ],
  },
  {
    title: "legal",
    links: [
      { href: "/privacy", key: "privacy" },
      { href: "/terms", key: "terms" },
      { href: "/cookies", key: "cookies" },
    ],
  },
];
