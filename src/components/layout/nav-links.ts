export const primaryNav = [
  { href: "/tools", label: "All Tools" },
  { href: "/apps", label: "Apps" },
  { href: "/categories", label: "Categories" },
  { href: "/ai-tools", label: "AI Tools" },
  { href: "/for-professionals", label: "For Professionals" },
  { href: "/about", label: "About" },
] as const;

export const footerGroups = [
  {
    title: "Explore",
    links: [
      { href: "/tools", label: "All Tools" },
      { href: "/apps", label: "Apps" },
      { href: "/categories", label: "Categories" },
      { href: "/ai-tools", label: "AI Tools" },
      { href: "/for-professionals", label: "For Professionals" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/help", label: "Help" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
] as const;
