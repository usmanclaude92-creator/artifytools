export const siteConfig = {
  name: "Artify Tools",
  url: "https://artifytools.com",
  tagline: "Powerful tools. Beautifully simple.",
  supporting: "Your everyday digital workspace.",
  description:
    "Discover thoughtfully designed online tools that help you create, calculate, convert, organize, and get more done — without unnecessary complexity.",
  /** Public support address. Only rendered when a real mailbox has been configured. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || undefined,
} as const;

export function absoluteUrl(path = "/"): string {
  return new URL(path, siteConfig.url).toString();
}
