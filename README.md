# Artify Tools

**Powerful tools. Beautifully simple.** — https://artifytools.com

A premium collection of online tools built with Next.js (App Router), TypeScript, and Tailwind CSS v4.
Most tools run entirely in the browser; every tool page discloses exactly where data is processed.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

| Script | What it does |
| --- | --- |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript) |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm test` | Vitest unit tests (tool logic, registry integrity, search, AI boundary) |
| `npm run test:e2e` | Playwright end-to-end + axe accessibility tests against `next start` (run `npm run build` first). Set `PLAYWRIGHT_CHROMIUM_PATH` to use a preinstalled Chromium. |

## Architecture

```
src/
  app/                  Routes (/, /tools, /tools/[slug], /categories, /ai-tools, legal pages, sitemap, robots, OG images, /api/ai/*)
  components/
    layout/             Header, mobile nav, footer, breadcrumbs, page header
    search/             Search combobox (hero) and command-palette dialog (header, Ctrl/⌘K)
    tools/              Tool card/grid, directory, tool-page sections, tool-components.tsx (code-split UI map)
    ui/                 Design-system primitives: button, form controls, feedback, toast, copy/download actions, theme, pagination
    home/               Homepage sections
  lib/
    tools/              types.ts, categories.ts, registry.ts (single source of truth), labels.ts
    search.ts           Local ranked search (no external service)
    decimal.ts          Exact BigInt decimal arithmetic for calculators
    seo/ config.ts      Metadata helper, canonical URLs (https://artifytools.com)
    ai/                 Provider interface, Anthropic provider, request validation, rate limiter
  tools/<slug>/         meta.ts (registry entry + page content), logic.ts (pure, tested), ui.tsx (client workspace)
tests/e2e/              Playwright specs (site, tools, a11y)
```

Design tokens (colour, shadow, motion, focus, layout, z-index) live in `src/app/globals.css`; light is the default theme, dark is opt-in via the header toggle.

### Adding a tool

1. Create `src/tools/<slug>/{meta.ts,logic.ts,ui.tsx}` (copy an existing tool). Keep processing in `logic.ts` and add tests.
2. Import its `meta` in `src/lib/tools/registry.ts` and add it to `tools`.
3. Register the UI loader in `src/components/tools/tool-components.tsx`.

Directory, categories, search, related tools, featured/popular sections, sitemap, metadata, JSON-LD, and OG images all derive from the registry.
Set `status: "active"` only when the tool works and is tested; `beta` pages are `noindex` and excluded from the sitemap; `coming-soon` tools are not routable. A category is published automatically once it has a non-coming-soon tool.

`processingMode` must describe the real implementation (`browser-local`, `server-side`, `external-provider`); a unit test guards the obvious mismatches.

## Configuration

Nothing is required for the browser-based tools. See `.env.example`.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Public support address shown on `/contact`. Hidden until set (public, not secret). |
| `ANTHROPIC_API_KEY` | **Server-only.** Enables the AI Text Summarizer beta. Without it the tool reports "requires configuration" and the API returns 503. |
| `AI_MODEL` | Optional model override (default `claude-haiku-5-5`). |

Never prefix secrets with `NEXT_PUBLIC_`. The AI route validates input size, rate-limits per IP (in-memory — use a shared store or an edge rule on multi-instance/serverless deployments), enforces a 30 s timeout, rejects cross-origin posts, and never logs request content.

## Privacy model

- No cookies, analytics, or ad scripts. The only stored value is the theme preference (`localStorage["artify-theme"]`).
- 15 tools are `browser-local`. The AI Text Summarizer is `external-provider` and says so before use.
