import { NextResponse, type NextRequest } from "next/server"

import { RETIRED_PAGES } from "@/lib/redirects"
import { routes } from "@/lib/routes"

/**
 * proxy.ts is Next 16's replacement for `middleware.ts`.
 *
 * FILE LOCATION. This must sit beside `app/`, not inside it. Next resolves the
 * proxy convention at the project root (or `src/`) only: `app/proxy.ts` is not a
 * route file and would be silently ignored, producing exactly the kind of decoy
 * the scaffold deleted `next.config.ts` to avoid. The file manifest lists it as
 * `app/proxy.ts`; that entry is wrong and this location is the working one.
 * Verified against `next@16.3.4` (`dist/build/index.js`: the proxy detection
 * regexp is applied to `path.join(appDir, '..')` and only accepts a match at the
 * convention level, `/` or `/src`).
 *
 * SCOPE. Redirects only. No authentication, no locale negotiation, no feature
 * flags, no rewriting of documentation content. Everything this file does must
 * be expressible as "this URL used to mean something, and now it means that
 * one". The reason is §14 of the locked decisions: there is no `[lang]` segment
 * yet, and the retrofit stays cheap only while URL construction lives in
 * `lib/routes.ts` and URL interpretation lives here and nowhere else.
 *
 * WHY THERE IS ANYTHING HERE AT ALL ON A NEW SITE. One of the redirects below
 * is already load-bearing:
 *
 *  - Mixed-case documentation paths are a real, constant source of dead links,
 *    because slugs get capitalised by chat clients, ticket trackers and people
 *    typing from memory. The corpus is entirely lower-case and hyphenated, so
 *    folding a path to lower case is unambiguous and cannot collide.
 *
 * ADDING ONE. A redirect is permanent (308) when the old URL is genuinely gone,
 * and temporary (307) when it may come back. Record the reason in the table, not
 * in a commit message.
 */

/**
 * The generated per-symbol API pages. Case-sensitive by construction. See the
 * guard in the case-folding branch below.
 *
 * EVERY PATH IN THIS FILE IS BUILT WITH `routes.docs()`, NEVER BY CONCATENATION.
 * The corpus is rooted: `DOCS_BASE` is empty, so `routes.docs()` is `/` and
 * `${routes.docs()}/reference/api` would be `//reference/api`, which matches
 * nothing and fails silently. `routes.docs("reference", "api")` is `/reference/api`
 * whatever the base is, which is the whole reason that function exists.
 */
const API_PREFIX = `${routes.docs("reference", "api")}/`
const TYPES_PAGE = routes.docs("reference", "generated", "types")
/** Where the corpus lived before it moved to the root. */
const LEGACY_DOCS_PREFIX = "/docs"

/** Exact-match redirects. Keys are lower-cased paths without a trailing slash. */
const EXACT_REDIRECTS: Record<string, { to: string; permanent: boolean }> = {
  // Cut before launch; the tool surface is /playground and the isolated render
  // surface is /view. See project/decisions.

  // fumadocs serves content/docs/index.mdx at /docs. `/docs/index` is what
  // people type when they have seen the file tree rather than the site.
  [routes.docs("index")]: { to: routes.docs(), permanent: true },

  // The curated agent index is a file, and the extension is part of its name.
  "/llms": { to: "/llms.txt", permanent: true },
  "/llms.md": { to: "/llms.txt", permanent: true },

  // Arriving with another system's map. A reader who has used shadcn/ui reaches
  // for /docs/installation; ours is a group, under Start here. 307, because if
  // a top-level installation page is ever written this URL becomes its own.
  [routes.docs("installation")]: {
    to: routes.docs("getting-started"),
    permanent: true,
  },
}

/**
 * Prefix rewrites, tried in order, longest-specific first.
 *
 * These are not aliases anybody should link to; they are the URLs people guess
 * from another system's shape, and every one of them is cheaper to answer than
 * to 404. check-llms probes each family in live mode.
 */
const PREFIX_REDIRECTS: { from: string; to: string; permanent: boolean }[] = [
  // The American spelling. Prose on this site is British and the path follows
  // it, but `color` is the spelling in every CSS property and every code
  // identifier we publish, so it is the spelling a developer will type. The
  // whole subtree redirects, not only its index.
  {
    from: routes.docs("foundations", "color"),
    to: routes.docs("foundations", "colour"),
    permanent: true,
  },
  // The per-base URL shape (`/docs/components/base/button`). opsinjs has
  // exactly one canonical, un-namespaced URL per component. That is locked
  // decision 6, and the base × style matrix lives on /view instead. A reader
  // who has internalised the namespaced shape lands on the real page.
  {
    from: routes.docs("components", "base"),
    to: routes.docs("components"),
    permanent: true,
  },
]

export default function proxy(request: NextRequest) {
  const url = request.nextUrl
  const pathname = url.pathname

  /* The path with any trailing slash removed, which is the form every table
     above is keyed in, and its lower-cased twin, which is what the tables are
     matched against.

     THE NAME MATTERS. The obvious name for this variable is a banned glossary
     word with `-ised` on the end, and tokens/glossary.json:19 bans that word
     outright across the system, code identifiers included; check-a11y's A11Y010
     segments identifiers against a suffix list that carries `-ise`, `-ised` and
     `-isation` for exactly that reason. `canonicalPath` says the same thing and
     survives the check. This file sits outside A11Y010's SCAN_DIRS today; it
     should read the same as one that does not. */
  const canonicalPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname
  const lower = canonicalPath.toLowerCase()

  /* A retired page, the .md twin of one, or either under the old `/docs`
     prefix, answered in one hop. The corpus moved from `/docs` to the root
     before ADR 0026 folded four hundred pages into about a hundred and
     fifteen, and lib/redirects.ts names where each one went. A per-symbol API
     page goes to its section on the Types page. */
  const legacy =
    lower === LEGACY_DOCS_PREFIX || lower.startsWith(`${LEGACY_DOCS_PREFIX}/`)
  const unprefixed = legacy
    ? lower.slice(LEGACY_DOCS_PREFIX.length) || "/"
    : lower
  const twin = unprefixed.endsWith(".md")
  const page = twin ? unprefixed.slice(0, -3) : unprefixed
  if (page.startsWith(API_PREFIX) || page === API_PREFIX.slice(0, -1)) {
    const target = url.clone()
    target.pathname = TYPES_PAGE
    target.hash = page.slice(API_PREFIX.length)
    return NextResponse.redirect(target, 308)
  }
  const destination = RETIRED_PAGES[page] ?? (legacy ? page : undefined)
  if (destination) {
    const target = url.clone()
    target.pathname = twin
      ? destination === "/"
        ? "/index.md"
        : `${destination}.md`
      : destination
    return NextResponse.redirect(target, 308)
  }

  const exact = EXACT_REDIRECTS[lower]
  if (exact) {
    const target = url.clone()
    target.pathname = exact.to
    return NextResponse.redirect(target, exact.permanent ? 308 : 307)
  }

  for (const rule of PREFIX_REDIRECTS) {
    /* Both sides are compared without a trailing slash, so a rule written with
       one and a rule written without behave identically, and the bare prefix
       (`/docs/components/base`) redirects rather than 404ing on its own. */
    const from = rule.from.replace(/\/$/, "")
    if (lower !== from && !lower.startsWith(`${from}/`)) continue
    const target = url.clone()
    const rewritten = rule.to.replace(/\/$/, "") + lower.slice(from.length)
    /* One hop, not two: a prefix rewrite that lands on a retired page goes
       straight to the page that absorbed it. */
    target.pathname = RETIRED_PAGES[rewritten] ?? rewritten
    return NextResponse.redirect(target, rule.permanent ? 308 : 307)
  }

  // Case folding, documentation paths only. Query and hash are preserved so a
  // deep link into a section survives the redirect.
  //
  // The per-symbol API pages are the one exception, and they have to be. Their
  // slugs ARE TypeScript symbol names (addendum B11: <ApiLink> resolves to
  // /docs/reference/api/<Symbol>), so `Oklch` and `oklch` are two different
  // exports and lower-casing is not a canonical form but a rename. Without this
  // guard every one of those pages 308s to a URL that does not exist, which is
  // exactly what it did: 43 pages and every .md twin returned 404 while each
  // page itself built and prerendered perfectly.
  //
  // THE GUARD USED TO NAME A `/docs` PREFIX AND NOW NAMES NOTHING, because the
  // corpus is rooted and every path this proxy sees is a documentation path.
  // The exclusions moved into `config.matcher` below, which already keeps the
  // registry, the API, the preview shell and the metadata routes out.
  if (!canonicalPath.startsWith(API_PREFIX) && canonicalPath !== lower) {
    const target = url.clone()
    target.pathname = lower
    return NextResponse.redirect(target, 308)
  }

  return NextResponse.next()
}

/**
 * Keep the proxy off everything it has no opinion about: static assets, the
 * image optimiser, the metadata routes, the registry and the chrome-less
 * preview shell. `/view` is excluded deliberately. It is fetched once per
 * iframe on pages that embed several, and a redirect check there is pure cost.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/|r/|view/|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)",
  ],
}
