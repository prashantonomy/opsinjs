import type { Metadata } from "next"

import { absoluteUrl, ogUrl, routes, site } from "@/lib/routes"

/**
 * THE ONE PLACE A PAGE'S SEARCH AND SOCIAL METADATA IS SHAPED.
 *
 * `lib/routes.ts` is the only place a URL is built. This is the only place a
 * `Metadata` object is built from one. The split matters because the two
 * mistakes are different: a wrong URL is visible the moment somebody clicks it,
 * and a missing canonical is invisible forever. Thirteen route files used to
 * declare a bare `{ title, description }` each, which meant thirteen pages with
 * no canonical, no Open Graph card and no locale, and no single place to notice.
 *
 * WHY IT LIVES UNDER `app/_shared` AND NOT UNDER `lib`. `lib/` is the design
 * system's own runtime: the status vocabulary, the colour maths, the tokens, the
 * registry. `scripts/build-reference.mts` walks it and publishes a reference page
 * for every type it exports, because everything in there is public vocabulary
 * somebody builds against. None of this is. It is how one documentation site
 * describes itself to a crawler, which is the definition of a helper for the
 * hand-written routes, and that is what `app/_shared` holds.
 *
 * WHY A SELF-REFERENTIAL CANONICAL ON EVERY PAGE. Google treats a sitemap entry
 * as a weak canonical signal and `rel="canonical"` as a strong one, and says
 * plainly to put one on the canonical page itself. This site hands out URLs that
 * pick up query strings on the way back: `?base=` and `?style=` on a component
 * page, the ramp and token browsers' own state, and whatever a referrer appends.
 * Without a self-referential canonical each of those is a separate URL competing
 * with the page it came from.
 *
 * WHAT IS DELIBERATELY NOT HERE. No `keywords`: Google has ignored the meta
 * keywords tag since 2009 and a field nobody reads is a field that goes stale
 * and lies. No verification tokens: they belong in the deployment environment,
 * not in a file anybody can fork.
 */

/**
 * The document language, as a BCP 47 tag.
 *
 * `en` was accurate and imprecise. The corpus is British English by rule
 * (AGENTS.md §10), the feed already declares `en-GB`, and a reader searching
 * "colour contrast" is the reader this site is for. The tag is what tells a
 * search engine and a screen reader which pronunciation and which spelling
 * convention to expect, so it should say which English rather than that it is
 * one of them.
 */
export const SITE_LANG = "en-GB"

/** The same language in the underscore form Open Graph requires. */
export const OG_LOCALE = "en_GB"

/**
 * The default description, used on any surface that has no better one of its
 * own. It is `site.tagline` rather than a second copy of it, so the sentence on
 * the OG card, in `llms.txt` and in a search result cannot drift apart.
 */
export const SITE_DESCRIPTION = site.tagline

/**
 * The alternate representations every page advertises.
 *
 * The feed is here rather than only on the root layout because Next merges
 * metadata shallowly: a page that declares `alternates` replaces its parent's
 * `alternates` whole, so a feed link declared once at the root would vanish from
 * every page that sets a canonical, which is every page. Repeating one entry is
 * cheaper than a feed nobody's reader can find.
 */
function alternateTypes(
  extra?: Record<string, string>
): Record<string, string> {
  return {
    "application/rss+xml": absoluteUrl(routes.rss()),
    ...extra,
  }
}

export interface PageMetadataInput {
  /** The page title, without the system name. The layout template appends it. */
  title: string
  description: string
  /** Root-relative path of the page this metadata describes. */
  path: string
  /** `article` for a documentation page, `website` for a tool or index page. */
  type?: "article" | "website"
  /** Release phase, on a component page. Drives the chip on the social card. */
  status?: string
  /** First path segment, printed as the eyebrow on the social card. */
  section?: string
  /** Root-relative path of the processed-markdown twin, where there is one. */
  markdownPath?: string
}

/**
 * Title, description, canonical, Open Graph and the Twitter card, from one
 * description of the page.
 *
 * The social card is the site's own `/og` service, driven by the same title,
 * description and release phase the page header renders, so a component that
 * moves from `planned` to `shipped` updates its card without anybody
 * remembering to.
 */
export function pageMetadata(input: PageMetadataInput): Metadata {
  const url = absoluteUrl(input.path)
  const image = ogUrl({
    title: input.title,
    description: input.description,
    status: input.status,
    section: input.section,
  })

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: url,
      types: alternateTypes(
        input.markdownPath
          ? { "text/markdown": absoluteUrl(input.markdownPath) }
          : undefined
      ),
    },
    openGraph: {
      type: input.type ?? "article",
      siteName: site.name,
      locale: OG_LOCALE,
      url,
      title: input.title,
      description: input.description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          /*
            The card is a typographic panel carrying the title, the description
            and at most one release chip. Describing it as a picture of the
            component would be a claim about an image that does not contain one,
            on a site whose whole argument is against exactly that.
          */
          alt: `${input.title}. ${site.name} documentation card.`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  }
}

/**
 * The metadata every route inherits, declared once on the chrome root layout.
 *
 * IT CARRIES NO `title`, AND THAT IS LOAD-BEARING. `app/(chrome)/not-found.tsx`
 * hoists its own `<title>` from the render tree, because a `not-found` file is
 * neither a layout nor a page and so cannot export metadata. A `title.default`
 * here would put a second `<title>` in that document's head. The three nested
 * groups declare the template instead, where every descendant is a real page.
 *
 * `metadataBase` is the reason this export exists at all. Without it Next
 * resolves every relative URL in `openGraph`, `twitter` and `alternates`
 * against `http://localhost:3000` and warns once per build. Nothing here
 * happens to pass a relative URL today, which is precisely the kind of thing
 * that stays true until the day somebody adds one.
 *
 * THE ROBOTS DIRECTIVES ARE THE POINT OF THE REST OF IT. `max-image-preview:
 * large` is what permits a full-size thumbnail in Google Images and Discover;
 * the default without it is a thumbnail small enough to be worthless.
 * `max-snippet: -1` lifts the snippet length cap, and Google's own guidance on
 * its generative features says a page is eligible only if it is indexed and
 * eligible to be shown with a snippet. A site that publishes safety prose has
 * an interest in that prose being quotable in full rather than truncated
 * halfway through a warning.
 *
 * WHAT THE DIRECTIVE DOES NOT SAY, AND WHY THE OMISSION IS DELIBERATE. There is
 * no `index` and no `follow` here. Both are what a crawler does with a page it
 * was not told anything about, so declaring them adds a word to four hundred
 * pages and changes nothing on any of them. It also actively breaks one page.
 * The two 404 files hoist their own `noindex` out of the render tree, because a
 * `not-found` file is neither a layout nor a page and cannot export metadata,
 * and an inherited `index, follow` meant that document shipped two robots tags
 * that contradicted each other. Google resolves a contradiction by taking the
 * most restrictive reading and would have got the right answer, which is not the
 * same as the page being right. With the defaults left unstated the 404 carries
 * one directive that limits previews and one that says `noindex`, and those two
 * combine rather than argue.
 *
 * They are also declared for every crawler rather than under `googleBot`. The
 * preview limits come from the European copyright directive and Bing reads them
 * too, so scoping them to one crawler would have been one tag's worth of markup
 * spent narrowing its own audience.
 */
export const siteMetadata: Metadata = {
  metadataBase: new URL(site.url),
  description: SITE_DESCRIPTION,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.github }],
  creator: site.name,
  publisher: site.name,
  /*
    A documentation site has no telephone numbers, no postal addresses and no
    dates that want linkifying, and Safari's automatic detection turns strings
    such as an error code or a token value into tap targets. Off is correct here
    and is also one fewer thing between a reader and a copy button.
  */
  formatDetection: { telephone: false, email: false, address: false },
  robots: {
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  alternates: { types: alternateTypes() },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: OG_LOCALE,
    url: site.url,
    title: `${site.name} · a design system for consumer health apps`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: ogUrl({ title: site.name, description: SITE_DESCRIPTION }),
        width: 1200,
        height: 630,
        alt: `${site.name}. ${SITE_DESCRIPTION}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} · a design system for consumer health apps`,
    description: SITE_DESCRIPTION,
    images: [ogUrl({ title: site.name, description: SITE_DESCRIPTION })],
  },
}
