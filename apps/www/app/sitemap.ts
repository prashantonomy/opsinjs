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
 * the review date is the only honest answer available at build time.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  /* ADR 0008 - considered component pages are resolvable but not published.
     The considered roster is currently empty, so this filter removes nothing
     today. It stays because any future considered page is thin by design, and
     putting one in front of a search engine serves nobody. The audience that
     needs a definitive "this does not exist" answer reaches such pages through
     search on the site, the .md twins and /r/index.json, none of which depend
     on the sitemap. */
  const pages = source
    .getPages()
    .filter(
      (page) =>
        !(page.data.kind === "component" && page.data.status === "considered"),
    )

  const docs: MetadataRoute.Sitemap = pages.map((page) => {
    const reviewed =
      typeof page.data.reviewed === "string" ? page.data.reviewed : undefined
    const reviewedDate = reviewed ? new Date(reviewed) : undefined
    const isIndex = page.url.split("/").filter(Boolean).length <= 2

    return {
      url: `${site.url}${page.url}`,
      lastModified:
        reviewedDate && !Number.isNaN(reviewedDate.getTime())
          ? reviewedDate
          : undefined,
      // Index pages of the sixteen sidebar groups are the entry points people
      // and crawlers actually land on; leaf specifications sit one rung below.
      // Nothing on this site is a 1.0 except the front door.
      priority: isIndex ? 0.8 : 0.6,
      changeFrequency: "weekly",
    }
  })

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${site.url}${routes.home()}`,
      priority: 1,
      changeFrequency: "weekly",
    },
    {
      url: `${site.url}${routes.colors()}`,
      priority: 0.8,
      changeFrequency: "weekly",
    },
    {
      url: `${site.url}${routes.tokens()}`,
      priority: 0.8,
      changeFrequency: "weekly",
    },
    {
      url: `${site.url}${routes.icons()}`,
      priority: 0.6,
      changeFrequency: "monthly",
    },
    {
      url: `${site.url}${routes.playground()}`,
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      url: `${site.url}${routes.playgroundTheme()}`,
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      url: `${site.url}${routes.playgroundContrast()}`,
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      url: `${site.url}${routes.playgroundStatus()}`,
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      url: `${site.url}${routes.official()}`,
      priority: 0.5,
      changeFrequency: "yearly",
    },
    {
      url: `${site.url}${routes.showcase()}`,
      priority: 0.3,
      changeFrequency: "yearly",
    },
    {
      url: `${site.url}${routes.showcaseMedicinesApp()}`,
      priority: 0.6,
      changeFrequency: "monthly",
    },
  ]

  return [...staticRoutes, ...docs]
}
