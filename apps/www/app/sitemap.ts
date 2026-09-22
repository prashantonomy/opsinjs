import type { MetadataRoute } from "next"

import { routes, site } from "@/lib/routes"
import { source } from "@/lib/source"

/**
 * sitemap.xml.
 *
 * Contents: every documentation page, plus the ten hand-written routes that
 * live outside the corpus, each named through `routes` in `lib/routes.ts` so
 * that this file and the site footer cannot drift apart.
 *
 * Three deliberate omissions.
 *
 * 1. THE `.md` TWINS. Every documentation page is also served as processed
 *    markdown at the same URL with `.md` appended. Those are not disallowed in
 *    robots.txt, because an assistant fetching one should get it. Listing them
 *    here would nevertheless submit a second, textually near-identical copy of
 *    the entire corpus for indexing, which is the textbook duplicate-content
 *    mistake. The canonical HTML page is what belongs in a sitemap; the twin
 *    is an API.
 *
 * 2. `/view/**`. Chrome-less preview shells, disallowed in robots.txt.
 *
 * 3. `/r/**` and the `llms-*.txt` shards. Machine surfaces, versioned and
 *    linked from the Agents documentation, not search destinations.
 *
 * `lastModified` is set from a page's `reviewed` frontmatter date where it has
 * one, and left unset otherwise. It is emphatically NOT set to the build time:
 * a sitemap that claims every page changed at 03:00 this morning because CI ran
 * is a sitemap that has taught crawlers to ignore its dates. On a documentation
 * site whose whole freshness policy is "pages carry a review date and expire",
 * the review date is the only honest answer available at build time. It is the
 * same field, with the same value, that each page publishes as `dateModified`
 * in its own structured data, so the two surfaces cannot tell a crawler
 * different stories about when a page was last read through.
 *
 * THERE IS NO `priority` AND NO `changeFrequency`, and both used to be here.
 *
 * Google ignores them. It has said so for years, and the reason is worth
 * restating because the fields look like they should work: they are a
 * publisher's self-assessment, every publisher's self-assessment says their
 * pages are important and change often, and a signal nobody can be wrong about
 * is a signal nobody can use. `lastmod` survived that cull precisely because it
 * is checkable against the page.
 *
 * The honesty argument is the stronger one here anyway. The `changeFrequency`
 * on every documentation entry read `weekly`. Four hundred specification pages
 * do not change weekly, the site publishes a review cadence per page that says
 * so in `reviewEvery`, and a corpus that fails its own build over an unbacked
 * claim in prose should not be shipping one in XML.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = source.getPages()

  const docs: MetadataRoute.Sitemap = pages.map((page) => {
    const reviewed =
      typeof page.data.reviewed === "string" ? page.data.reviewed : undefined
    const reviewedDate = reviewed ? new Date(reviewed) : undefined
    return {
      url: `${site.url}${page.url}`,
      lastModified:
        reviewedDate && !Number.isNaN(reviewedDate.getTime())
          ? reviewedDate
          : undefined,
    }
  })

  /*
    The routes that live outside the corpus. Each is named through `routes` in
    lib/routes.ts so that this file and the site footer cannot drift apart.

    None carries a `lastModified`. These are React pages rather than MDX, so
    there is no `reviewed` frontmatter to read and no honest date available at
    build time. An omitted `lastmod` costs nothing: Google uses the value when
    it is consistently accurate and ignores the field otherwise, so a guess here
    would at best be ignored and at worst teach a crawler to ignore the four
    hundred real dates above.
  */
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${site.url}${routes.home()}` },
    { url: `${site.url}${routes.colors()}` },
    { url: `${site.url}${routes.tokens()}` },
    { url: `${site.url}${routes.icons()}` },
    { url: `${site.url}${routes.playground()}` },
    { url: `${site.url}${routes.playgroundTheme()}` },
    { url: `${site.url}${routes.playgroundContrast()}` },
    { url: `${site.url}${routes.playgroundStatus()}` },
    { url: `${site.url}${routes.official()}` },
    { url: `${site.url}${routes.showcase()}` },
    { url: `${site.url}${routes.showcaseMedicinesApp()}` },
  ]

  /*
    DEDUPLICATED, because the front door is reachable two ways from here and
    always was. `DOCS_BASE` is empty, so the corpus index renders at `/` and
    arrives in `docs` with that URL, while `routes.home()` is the same `/` in
    the hand-written list above. A sitemap that submits one URL twice is not
    fatal, and it is the kind of thing a validator flags and a maintainer then
    has to re-derive from scratch.

    The docs entry wins, because it is the one carrying a review date. `Map`
    preserves insertion order and a later `set` on an existing key replaces the
    value without moving it, so the front door keeps its position at the head of
    the file and gains its `lastmod`.
  */
  const merged = new Map<string, MetadataRoute.Sitemap[number]>()
  for (const entry of [...staticRoutes, ...docs]) merged.set(entry.url, entry)
  return [...merged.values()]
}
