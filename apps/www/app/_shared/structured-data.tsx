import { absoluteUrl, site } from "@/lib/routes"
import { SITE_DESCRIPTION, SITE_LANG } from "@/app/_shared/seo"

/**
 * schema.org JSON-LD: four small builders and the element that emits them.
 *
 * It sits beside `seo.ts` under `app/_shared` for the reason given there. `lib/`
 * is the published runtime and every type it exports becomes a reference page;
 * a `Crumb` is not vocabulary anybody builds against.
 *
 * WHAT THIS IS FOR, AND WHAT IT IS NOT FOR. Structured data does not rank a
 * page. Google says so directly, and says again in its guidance on the
 * generative features that no special schema is needed to appear in them. What
 * it does is tell a parser which of the strings on a page is the name of the
 * thing, which is the publisher, and where the page sits in a hierarchy, so
 * that a result can be drawn as something other than a title and a URL. On a
 * corpus four hundred pages deep, the breadcrumb is the one that pays: without
 * it a result for a page five levels down prints a bare truncated URL, and with
 * it the reader sees the path before they click.
 *
 * EVERY FIELD HERE IS CHECKABLE. AGENTS.md §9 bans invented evidence, and a
 * structured-data block is evidence with a machine reading it. So there is no
 * `datePublished` on an article whose publication date nobody recorded, no
 * `aggregateRating` on software nobody has rated, no postal address and no
 * founding date for an organisation that has published none. `dateModified`
 * appears only where a page carries a real `reviewed` date in its frontmatter,
 * which is the same field the sitemap reports as `lastmod`. A missing
 * recommended field costs a warning in a testing tool. A fabricated one is a
 * lie told at scale.
 *
 * TWO TYPES ARE DELIBERATELY ABSENT.
 *
 * `FAQPage` is the obvious thing to reach for on a documentation site and it is
 * gone: Google stopped showing the FAQ rich result on 7 May 2026 and the
 * documentation for it now carries a deprecation notice. Markup for a feature
 * that no longer exists is weight with no lift.
 *
 * `WebSite.potentialAction` with a `SearchAction`, the sitelinks search box, was
 * deprecated in 2023 and is ignored. The site has search, on every page, bound
 * to a key. It does not need to say so in a vocabulary nothing reads.
 *
 * THE `@id` VALUES ARE THE POINT OF SPLITTING THIS UP. Each entity is declared
 * once, at a stable fragment URL, and every other block refers to it rather than
 * restating it. That is what lets a parser understand that the publisher of a
 * page, the owner of the site and the organisation with the GitHub account are
 * one thing, instead of three organisations that happen to share a name.
 */

/** Stable identities. Fragments, so they never collide with a real route. */
const ORGANIZATION_ID = `${site.url}/#organization`
const WEBSITE_ID = `${site.url}/#website`

/** Anything with an `@type`. Kept loose: schema.org is not a closed vocabulary. */
export type JsonLdNode = Record<string, unknown>

/**
 * The publisher.
 *
 * `logo` points at the PNG rather than at `app/icon.svg`, and for the same
 * reason the PNG exists at all: the formats Google reads reliably are raster
 * ones. It is 192 square, comfortably over the 112 pixel minimum height the
 * logo guidelines ask for.
 *
 * `sameAs` carries the repository and nothing else. It is the list of other
 * profiles that are provably the same entity, and opsinjs has exactly one that
 * is provable today. An npm scope with nothing published under it is a claim
 * about a page that does not exist, which is the thing `/official` was written
 * to warn readers about.
 */
export function organizationLd(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: site.name,
    url: site.url,
    description: SITE_DESCRIPTION,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icon1.png"),
      width: 192,
      height: 192,
      caption: `${site.name} mark`,
    },
    sameAs: [site.github],
  }
}

/** The site itself, owned by the organisation above. */
export function webSiteLd(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: site.name,
    url: site.url,
    description: SITE_DESCRIPTION,
    inLanguage: SITE_LANG,
    publisher: { "@id": ORGANIZATION_ID },
  }
}

export interface Crumb {
  name: string
  /** Root-relative. Made absolute here, because `item` must be a full URL. */
  path: string
}

/**
 * The trail from the front door to this page.
 *
 * Positions are numbered from the array rather than from the slug, so a level
 * with no page of its own (`reference/generated` is the only one) drops out
 * without leaving a hole in the sequence. Google requires `position` to be
 * consecutive and starting at 1; a gap invalidates the whole list.
 *
 * Returns undefined for a trail of one, which is the front page. A breadcrumb
 * whose only entry is the page you are on describes nothing.
 */
export function breadcrumbLd(crumbs: Crumb[]): JsonLdNode | undefined {
  if (crumbs.length < 2) return undefined

  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  }
}

export interface ArticleLdInput {
  title: string
  description: string
  /** Root-relative path of the page. */
  path: string
  /** Absolute URL of the social card. It is a real image of this page's title. */
  image: string
  /** The `reviewed` frontmatter date, where the page carries one. */
  reviewed?: string
}

/**
 * One documentation page.
 *
 * `TechArticle` rather than `Article`, because that is what these are, and
 * because the subtype is the honest one: schema.org defines it as an article
 * about a technical subject with a prerequisite reader, which describes every
 * page in this corpus and none of the news and blog shapes `Article` is usually
 * reaching for.
 *
 * `dateModified` is the page's review date and appears only when there is one.
 * It is the same value the sitemap publishes as `lastmod`, from the same field,
 * so a crawler that reads both cannot be told two different stories. There is no
 * `datePublished`: this corpus records when a page was last read through, not
 * when it first appeared, and inventing the second from the first would be a
 * fabricated date in a machine-readable field.
 */
export function techArticleLd(input: ArticleLdInput): JsonLdNode {
  const url = absoluteUrl(input.path)
  const reviewedDate = input.reviewed ? new Date(input.reviewed) : undefined
  const dateModified =
    reviewedDate && !Number.isNaN(reviewedDate.getTime())
      ? input.reviewed
      : undefined

  return {
    "@type": "TechArticle",
    "@id": `${url}#article`,
    headline: input.title,
    description: input.description,
    url,
    mainEntityOfPage: url,
    inLanguage: SITE_LANG,
    image: input.image,
    isPartOf: { "@id": WEBSITE_ID },
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    ...(dateModified ? { dateModified } : {}),
  }
}

/**
 * Wrap one or more entities in a single `@graph`.
 *
 * One script tag per document rather than four. The `@graph` form is what makes
 * the `@id` references above resolve within the document instead of asking a
 * parser to stitch separate blocks together, and it is the form Google's own
 * examples use for exactly this case.
 */
export function graph(nodes: (JsonLdNode | undefined)[]): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter((node): node is JsonLdNode => node !== undefined),
  }
}

/**
 * <JsonLd> renders one schema.org graph into the document.
 *
 * IT IS A PLAIN `<script>`, NOT `next/script`. A structured-data block has to be
 * in the server-rendered HTML, because the parser that reads it is a crawler
 * rather than a browser and it is reading the response, not a hydrated DOM.
 * `next/script` at any strategy defers to the client runtime, which is the one
 * place this must not be.
 *
 * THE ESCAPE IS NOT DECORATION. `JSON.stringify` will happily emit the two
 * characters that close a script element if a page title ever contains them, and
 * the browser's tokeniser ends the script at that point no matter what the JSON
 * thinks. Escaping `<` as `<` is valid JSON, parses back to the same
 * string, and cannot terminate the element. Every title in this corpus is
 * author-written prose, which is exactly the input that eventually contains an
 * angle bracket.
 *
 * This is not an MDX component and never becomes one. The MDX vocabulary is
 * closed (AGENTS.md, anatomy contract, MDX001); this is used by route files,
 * which is also why it is not under `components/`.
 */
export function JsonLd({ data }: { data: JsonLdNode }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}
