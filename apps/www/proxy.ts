import { NextResponse, type NextRequest } from "next/server"

import { LEGACY_ROOT_SEGMENTS, RETIRED_PAGES } from "@/lib/redirects"
import { docsMarkdownPath, routes } from "@/lib/routes"

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
 * `routes.docs("reference", "api")` is right whatever the base is, and the
 * base has already moved twice: from `/docs` to the root and back (ADR 0027).
 * A concatenation against an empty base produced `//reference/api`, which
 * matches nothing and fails silently.
 */
const API_PREFIX = `${routes.docs("reference", "api")}/`
/** The same prefix relative to the docs base, which is how a legacy path is read. */
const API_RELATIVE = "/reference/api"
const TYPES_PAGE = routes.docs("reference", "generated", "types")
/** The docs base, `/docs`. */
const DOCS_PREFIX = routes.docs()

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

/**
 * A redirect target built from the request path must stay on this site.
 *
 * Next writes a same-origin redirect's `Location` as the bare path, and a path
 * that begins with two slashes, or with a slash and a backslash, is read by a
 * browser as another host: `//evil.example` is an open redirect. The platform
 * in front of the site collapses repeated slashes before this file runs, so
 * nothing reaches that today, but the proxy should not depend on it. Every
 * target derived from the request passes through here.
 */
function onThisSite(pathname: string): string {
  return pathname.replace(/^[/\\]+/, "/")
}

export default function proxy(request: NextRequest) {
  const url = request.nextUrl
  const pathname = url.pathname

  /* A path with a malformed percent-escape, such as `/%E0%A4`, names no page.
     Left alone it was folded to lower case, redirected, and then answered with
     a 500 when the router failed to decode it. It is a bad request, so it is
     answered as one here, before any redirect below can repeat it. */
  try {
    decodeURIComponent(pathname)
  } catch {
    return new NextResponse(null, { status: 400 })
  }

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

  /* A retired page, the .md twin of one, or a page from the period when the
     corpus was rooted, answered in one hop. The corpus lived under `/docs`,
     moved to the root on 2026-09-20 and came back under `/docs` with ADR 0027,
     so a documentation path can arrive in either form. `page` is the path
     relative to the docs base in both cases, which is the form
     lib/redirects.ts is keyed in. A rooted path is recognised by its first
     segment, from the frozen list in that file, so the landing page and the
     tool pages are never taken for one. The rooted index twin was
     `/index.md`. A per-symbol API page goes to its section on the Types page. */
  const twin = lower.endsWith(".md")
  const bare = twin ? lower.slice(0, -3) : lower
  let page: string | undefined
  let rooted = false
  if (bare === DOCS_PREFIX || bare.startsWith(`${DOCS_PREFIX}/`)) {
    page = bare.slice(DOCS_PREFIX.length) || "/"
  } else if (twin && bare === "/index") {
    page = "/"
    rooted = true
  } else if (LEGACY_ROOT_SEGMENTS.has(bare.split("/")[1] ?? "")) {
    page = bare
    rooted = true
  }
  if (page !== undefined) {
    if (page === API_RELATIVE || page.startsWith(`${API_RELATIVE}/`)) {
      const target = url.clone()
      target.pathname = TYPES_PAGE
      target.hash = page.slice(API_RELATIVE.length + 1)
      return NextResponse.redirect(target, 308)
    }
    const destination = RETIRED_PAGES[page] ?? (rooted ? page : undefined)
    if (destination) {
      const segments = destination.split("/")
      const target = url.clone()
      target.pathname = onThisSite(
        twin ? docsMarkdownPath(...segments) : routes.docs(...segments)
      )
      return NextResponse.redirect(target, 308)
    }
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
       straight to the page that absorbed it. The table is keyed relative to
       the docs base, so the base comes off for the lookup and back on for the
       target. */
    const retired = rewritten.startsWith(`${DOCS_PREFIX}/`)
      ? RETIRED_PAGES[rewritten.slice(DOCS_PREFIX.length)]
      : undefined
    target.pathname = onThisSite(
      retired ? routes.docs(...retired.split("/")) : rewritten
    )
    return NextResponse.redirect(target, rule.permanent ? 308 : 307)
  }

  // Case folding. Query and hash are preserved so a deep link into a section
  // survives the redirect.
  //
  // The per-symbol API pages are the one exception, and they have to be. Their
  // slugs ARE TypeScript symbol names (addendum B11: <ApiLink> resolves to
  // /docs/reference/api/<Symbol>), so `Oklch` and `oklch` are two different
  // exports and lower-casing is not a canonical form but a rename. Without this
  // guard every one of those pages 308s to a URL that does not exist, which is
  // exactly what it did: 43 pages and every .md twin returned 404 while each
  // page itself built and prerendered perfectly.
  //
  // The fold applies to every path the matcher lets through, not only to the
  // documentation, because the landing page and the tool pages are lower case
  // too. `config.matcher` below keeps the registry, the API, the preview shell
  // and the metadata routes out.
  if (!canonicalPath.startsWith(API_PREFIX) && canonicalPath !== lower) {
    const target = url.clone()
    target.pathname = onThisSite(lower)
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
