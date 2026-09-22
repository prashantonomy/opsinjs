/**
 * THE ONLY PLACE A URL IS CONSTRUCTED.
 *
 * Every path in the application comes from here. `assert-ia.mts` fails the
 * build on a hardcoded `/docs/` anywhere in `.ts` or `.tsx` outside this file
 * and `lib/source.ts`, with a short allowlist for the four places a literal is
 * unavoidable: `next.config.mjs` (the rewrite source), `app/robots.ts`,
 * `app/sitemap.ts` and `lib/layout.shared.tsx`. In MDX, absolute `/docs/` links
 * are banned outright. Content uses relative file links resolved by fumadocs'
 * `createRelativeLink`.
 *
 * WHY THIS IS WORTH A FILE. ADR 0005 records that opsinjs ships without a
 * `[lang]` segment, and the reason that decision is affordable rather than
 * permanent is this module: adding a locale segment later means changing
 * `docsPath` and `absoluteUrl` and nothing else. A codebase with three hundred
 * string literals cannot make that promise, and a documentation site that
 * cannot be translated is a documentation site with a ceiling on who it is for.
 *
 * CONVENTIONS. Everything returns a root-relative path except `absoluteUrl`
 * and the handful of helpers that must produce a full URL. `llms.txt`
 * requires absolute URLs, sitemaps require absolute URLs, and Open Graph
 * requires absolute URLs. Nothing here has a trailing slash except `/`.
 */

/* ── the site itself ────────────────────────────────────────────────────── */

export const site = {
  name: "opsinjs",
  /** The one-line claim. Used in metadata, in llms.txt and on the OG card. */
  tagline:
    "A React design system for consumer health products, built for the person reading their own results.",
  /**
   * The canonical origin. Overridable so that preview deployments generate
   * their own absolute URLs instead of pointing every OG card and every
   * llms.txt entry at production.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://opsinjs.pensievelabs.org",
  github: "https://github.com/prashantonomy/opsinjs",
  npmScope: "@opsinjs",
  /** The registry namespace a consumer adds to their components.json. */
  registryNamespace: "@opsinjs",
  /** Where the docs corpus lives in the repository, for "Edit this page". */
  contentRoot: "apps/www/content/docs",
  defaultBranch: "main",
} as const

/**
 * The docs base segment. Everything else derives from it.
 *
 * IT IS EMPTY, AND THAT IS THE WHOLE SITE DESIGN. The documentation is not a
 * section of opsinjs.org, it is opsinjs.org: the introduction renders at `/`,
 * Components at `/components`, a component at `/components/button`. There is no
 * landing page in front of it and no `/docs` prefix behind it.
 *
 * The four non-docs routes (`/colors`, `/tokens`, `/icons`, `/showcase`,
 * `/official`, `/playground`) still win over the catch-all, because Next
 * resolves a static segment before a `[[...slug]]`. The rule that keeps it
 * that way: no top-level folder under `content/docs/` may be named after one
 * of them. `assert-ia.mts` checks that collision directly.
 *
 * Restoring a prefix is still this one line plus the two `/` literals in
 * `next.config.mjs`, which is the property ADR 0005 wanted from this module.
 */
export const DOCS_BASE = ""

/* ── low-level helpers ──────────────────────────────────────────────────── */

/** Join path segments into a root-relative path, dropping empties and stray slashes. */
export function joinPath(
  ...segments: (string | number | undefined | null)[]
): string {
  const parts = segments
    .filter(
      (segment): segment is string | number =>
        segment !== undefined && segment !== null && segment !== ""
    )
    .map((segment) => String(segment).replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
  return "/" + parts.join("/")
}

/** Turn a root-relative path into a full URL on the canonical origin. */
export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString()
}

/* ── docs ───────────────────────────────────────────────────────────────── */

/**
 * The URL of a docs page from its slug segments. `docsPath()` is the docs
 * index. This is the function a locale segment would be inserted into.
 */
export function docsPath(...slugs: (string | undefined)[]): string {
  return joinPath(DOCS_BASE, ...slugs)
}

/**
 * The same page as processed markdown: `/components/range-bar.md`.
 *
 * The index is `/index.md` rather than `/.md`, which is not a path. Every other
 * page appends `.md` to its own path.
 */
export function docsMarkdownPath(...slugs: (string | undefined)[]): string {
  const path = docsPath(...slugs)
  return path === "/" ? "/index.md" : `${path}.md`
}

/** A component specification page, by catalogue id. */
export function componentPath(id: string): string {
  return docsPath("components", id)
}

/**
 * A health doctrine page, by the page id that `governedBy` and `implements`
 * use.
 */
export function healthPath(id: string): string {
  return docsPath("health", id)
}

export function foundationsPath(...slugs: string[]): string {
  return docsPath("foundations", ...slugs)
}

export function accessibilityPath(...slugs: string[]): string {
  return docsPath("accessibility", ...slugs)
}

export function referencePath(...slugs: string[]): string {
  return docsPath("reference", ...slugs)
}

/** A generated per-symbol API page. `<ApiLink>` resolves here, never to an anchor. */
export function apiSymbolPath(symbol: string): string {
  return docsPath("reference", "api", symbol)
}

/**
 * A doctrine page reference as written in frontmatter, such as
 * `two-colour-axes`, or `foundations/colour/contrast-and-apca` when it is not
 * in Health.
 *
 * Bare ids resolve under Health because that is where the overwhelming majority
 * of `governedBy` entries point; anything with a slash is treated as a full
 * slug from the docs root. Keeping both forms working is what lets a component
 * page say `governedBy: [two-colour-axes]` without a path.
 */
export function doctrinePath(reference: string): string {
  return reference.includes("/")
    ? docsPath(...reference.split("/"))
    : healthPath(reference)
}

/** "Edit this page" on GitHub, from a source file path relative to the content root. */
export function editUrl(relativeFilePath: string): string {
  return `${site.github}/edit/${site.defaultBranch}/${site.contentRoot}/${relativeFilePath.replace(/^\/+/, "")}`
}

/** A prefilled docs issue. Used by `<Feedback>` when the feedback endpoint is unavailable. */
export function issueUrl(params: {
  title: string
  page: string
  version?: string
}): string {
  const query = new URLSearchParams({
    template: "docs-issue.yml",
    title: params.title,
    page: params.page,
  })
  if (params.version) query.set("version", params.version)
  return `${site.github}/issues/new?${query.toString()}`
}

/* ── the chrome-less preview surface ────────────────────────────────────── */

export const DEFAULT_BASE = "base"
export const DEFAULT_STYLE = "base-lyra"

/** What a `/view` route can render. */
export type ViewKind = "component" | "example" | "screen"

/**
 * Everything a chrome-less preview URL can carry. Name and kind become path
 * segments, and the rest become query parameters applied before first paint.
 */
export interface ViewParams {
  name: string
  kind?: ViewKind
  base?: string
  style?: string
  /** Colour mode. Applied before first paint by the (view) layout's inline script. */
  mode?: "light" | "dark"
  density?: "comfortable" | "compact"
  /** Text-size step, matching tokens/type.json `textSizeSteps`. */
  text?: 100 | 125 | 150 | 200
  /** An `opsinjs-*` preset code, applied as a theme. */
  theme?: string
}

/**
 * `/view/base/base-lyra/component/range-bar?mode=dark&text=200`.
 *
 * The base and style are PATH segments here and query parameters on a docs
 * page. That asymmetry is deliberate and is decision 6: a documentation page
 * has exactly one canonical URL per component so that an agent can guess it,
 * while `/view` is a machine and iframe surface where every combination must be
 * separately addressable and separately screenshotted.
 */
export function viewPath(params: ViewParams): string {
  const {
    name,
    kind = "component",
    base = DEFAULT_BASE,
    style = DEFAULT_STYLE,
  } = params
  const path = joinPath("view", base, style, kind, name)
  const query = new URLSearchParams()
  if (params.mode) query.set("mode", params.mode)
  if (params.density) query.set("density", params.density)
  if (params.text && params.text !== 100) query.set("text", String(params.text))
  if (params.theme) query.set("theme", params.theme)
  const search = query.toString()
  return search ? `${path}?${search}` : path
}

/**
 * The `?base=&style=` query a docs page uses for the same switch. Returns an
 * empty string at the defaults so the canonical URL stays clean.
 */
export function baseStyleQuery(
  base: string = DEFAULT_BASE,
  style: string = DEFAULT_STYLE
): string {
  const query = new URLSearchParams()
  if (base !== DEFAULT_BASE) query.set("base", base)
  if (style !== DEFAULT_STYLE) query.set("style", style)
  const search = query.toString()
  return search ? `?${search}` : ""
}

/* ── the registry ───────────────────────────────────────────────────────── */

export const registryRoutes = {
  /** The catalog. Required by the shadcn MCP server. */
  catalog: () => "/r/registry.json",
  /** The light index: name, type, status, category, links, aliases. */
  index: () => "/r/index.json",
  /** One item at the default base and style. */
  item: (name: string) => joinPath("r", `${name}.json`),
  /** One item at an explicit style. */
  styledItem: (style: string, name: string) =>
    joinPath("r", "styles", style, `${name}.json`),
  /** A theme-only registry item materialised from an `opsinjs-*` preset code. */
  theme: (preset: string) => joinPath("r", "themes", `${preset}.json`),
  /** The offline agent bundle. */
  docsBundle: () => "/r/docs.json",
}

/** What a consumer types to install an item. Rendered by `<ComponentInstall>`. */
export function registryInstallUrl(name: string): string {
  return absoluteUrl(registryRoutes.item(name))
}

/* ── machine surfaces ───────────────────────────────────────────────────── */

export const agentRoutes = {
  llms: () => "/llms.txt",
  llmsFull: () => "/llms-full.txt",
  llmsComponents: () => "/llms-components.txt",
  llmsHealth: () => "/llms-health.txt",
  llmsFoundations: () => "/llms-foundations.txt",
  llmsReference: () => "/llms-reference.txt",
  /** The processed-markdown twin route. `/docs/:path*.md` rewrites to it. */
  processedMarkdown: (...slugs: string[]) => joinPath("llms.mdx", ...slugs),
}

export const apiRoutes = {
  search: () => "/api/search",
  contrast: () => "/api/contrast",
  feedback: () => "/api/feedback",
}

/**
 * The OG image service. One endpoint for the whole site. There is no per-route
 * opengraph-image.
 */
export function ogUrl(params: {
  title: string
  description?: string
  status?: string
  section?: string
}): string {
  const query = new URLSearchParams({ title: params.title })
  if (params.description) query.set("description", params.description)
  if (params.status) query.set("status", params.status)
  if (params.section) query.set("section", params.section)
  return absoluteUrl(`/og?${query.toString()}`)
}

/* ── human routes outside the docs tree ─────────────────────────────────── */

export const routes = {
  home: () => "/",
  /**
   * The docs index, or any page under it: `routes.docs("health",
   * "two-colour-axes")`. The same function as `docsPath`, exposed on the
   * routes object because that is how almost every call site reaches for it.
   */
  docs: docsPath,
  components: () => docsPath("components"),
  health: () => docsPath("health"),
  foundations: () => docsPath("foundations"),
  accessibility: () => docsPath("accessibility"),
  handbook: () => docsPath("handbook"),
  agents: () => docsPath("agents"),
  reference: () => docsPath("reference"),
  roadmap: () => docsPath("project", "roadmap"),
  changelog: () => docsPath("project", "changelog"),
  releasePhases: () => docsPath("project", "release-phases"),
  start: () => docsPath("start"),
  recipes: () => docsPath("recipes"),

  colors: () => "/colors",
  tokens: () => "/tokens",
  icons: () => "/icons",
  showcase: () => "/showcase",
  /**
   * The one thing on the showcase that is not an entry: the medicines app opsinjs
   * built out of its own parts. The literal is written here rather than composed
   * from segments because `assert-ia.mts` proves a route is reachable by finding
   * its path as a literal string somewhere under `app/`, `components/` or `lib/`,
   * and this file is where every path in the application is spelled.
   */
  showcaseMedicinesApp: () => "/showcase/diabetes-medicines-app",
  official: () => "/official",

  playground: () => "/playground",
  playgroundTheme: () => "/playground/theme",
  playgroundContrast: () => "/playground/contrast",
  playgroundStatus: () => "/playground/status",

  rss: () => "/rss.xml",
  sitemap: () => "/sitemap.xml",
  robots: () => "/robots.txt",
}


/**
 * Routes that exist but are not reachable from the top nav or the sidebar, and
 * are allowed not to be.
 *
 * `assert-ia.mts` walks every `page.tsx` under `app/` and requires it to be
 * reachable from the frozen top nav, from the docs tree, or from this list.
 * That check stops the site reproducing the orphaned-live-page problem it
 * criticises elsewhere. Each entry names who reaches it, because "nothing links
 * to this" is only acceptable when something else does.
 */
export const ORPHAN_ALLOWLIST: { path: string; reachedBy: string }[] = [
  {
    path: "/showcase",
    reachedBy:
      "Linked from the landing page and the footer; deliberately not in the top nav while it is empty.",
  },
  {
    path: "/showcase/diabetes-medicines-app",
    reachedBy:
      "Linked from /showcase and from the screen specimen page under Screens. It is a first-party specimen rather than a showcase entry, so it sits beneath the showcase rather than in it.",
  },
  {
    path: "/official",
    reachedBy:
      "Linked from the footer and from /docs/project/official-resources. An anti-impersonation page is found by search, not by navigation.",
  },
  { path: "/icons", reachedBy: "Linked from /docs/foundations/iconography." },
  {
    path: "/tokens",
    reachedBy:
      "Linked from the Colors page, the Foundations index and every generated token table.",
  },
  {
    path: "/view",
    reachedBy:
      "Iframe and Playwright target only. Disallowed in robots.txt and excluded from the sitemap.",
  },
]
