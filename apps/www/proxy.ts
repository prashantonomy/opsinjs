import { NextResponse, type NextRequest } from "next/server"

import { routes } from "@/lib/routes"

/**
 * proxy.ts — Next 16's replacement for `middleware.ts`.
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
 * WHY THERE IS ANYTHING HERE AT ALL ON A NEW SITE. Two of the redirects below
 * are already load-bearing:
 *
 *  - `/harness` was the name an earlier revision of this specification gave to
 *    the isolated render surface. It was cut; `/playground` is the tool surface
 *    and `/view` is the isolated one. Anything already linking to the old name
 *    should land somewhere useful rather than on a 404.
 *  - Mixed-case documentation paths are a real, constant source of dead links,
 *    because slugs get capitalised by chat clients, ticket trackers and people
 *    typing from memory. The corpus is entirely lower-case and hyphenated, so
 *    normalising case is unambiguous and cannot collide.
 *
 * ADDING ONE. A redirect is permanent (308) when the old URL is genuinely gone,
 * and temporary (307) when it may come back. Record the reason in the table, not
 * in a commit message.
 */

const DOCS_PREFIX = routes.docs()

/** Exact-match redirects. Keys are lower-cased paths without a trailing slash. */
const EXACT_REDIRECTS: Record<string, { to: string; permanent: boolean }> = {
  // Cut before launch; the tool surface is /playground and the isolated render
  // surface is /view. See project/decisions.
  "/harness": { to: "/playground", permanent: true },

  // fumadocs serves content/docs/index.mdx at /docs. `/docs/index` is what
  // people type when they have seen the file tree rather than the site.
  [`${DOCS_PREFIX}/index`]: { to: DOCS_PREFIX, permanent: true },

  // The curated agent index is a file, and the extension is part of its name.
  "/llms": { to: "/llms.txt", permanent: true },
  "/llms.md": { to: "/llms.txt", permanent: true },
}

export default function proxy(request: NextRequest) {
  const url = request.nextUrl
  const pathname = url.pathname
  const normalised =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname

  const exact = EXACT_REDIRECTS[normalised.toLowerCase()]
  if (exact) {
    const target = url.clone()
    target.pathname = exact.to
    return NextResponse.redirect(target, exact.permanent ? 308 : 307)
  }

  // Case normalisation, documentation paths only. Query and hash are preserved
  // so a deep link into a section survives the redirect.
  if (
    normalised.startsWith(`${DOCS_PREFIX}/`) &&
    normalised !== normalised.toLowerCase()
  ) {
    const target = url.clone()
    target.pathname = normalised.toLowerCase()
    return NextResponse.redirect(target, 308)
  }

  return NextResponse.next()
}

/**
 * Keep the proxy off everything it has no opinion about: static assets, the
 * image optimiser, the metadata routes, the registry and the chrome-less
 * preview shell. `/view` is excluded deliberately — it is fetched once per
 * iframe on pages that embed several, and a redirect check there is pure cost.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/|r/|view/|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)",
  ],
}
