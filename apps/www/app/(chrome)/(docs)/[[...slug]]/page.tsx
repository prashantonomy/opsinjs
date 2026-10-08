import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createRelativeLink } from "fumadocs-ui/mdx"
import { Pencil } from "lucide-react"

import { getMDXComponents } from "@/components/mdx"
import { source } from "@/lib/source"
import { docsMarkdownPath, docsPath, editUrl, ogUrl, site } from "@/lib/routes"
import { pageMetadata } from "@/app/_shared/seo"
import {
  JsonLd,
  breadcrumbLd,
  graph,
  techArticleLd,
  type Crumb,
} from "@/app/_shared/structured-data"

/**
 * The breadcrumb trail for a page, built from its own slug.
 *
 * WHY NOT `getBreadcrumbItems` FROM fumadocs. That walks the PAGE TREE, and the
 * top-level guides sit in the tree beside the section folders rather than
 * under them. A breadcrumb in a search result is a promise about the address
 * bar, so it has to be built from the address. There is no visible breadcrumb;
 * this trail exists only in the structured data.
 * It also returns `name` as a ReactNode, which is the wrong type for a field
 * that has to end up as a JSON string.
 *
 * Every folder in the corpus but one carries an `index.mdx`, so each prefix
 * resolves to a real page with a real title. `reference/generated` is the
 * exception and simply drops out of the trail; `breadcrumbLd` renumbers, so the
 * positions stay consecutive, which Google requires.
 */
function docsCrumbs(slug: string[] | undefined, title: string): Crumb[] {
  const segments = slug ?? []
  const crumbs: Crumb[] = [{ name: "Introduction", path: docsPath() }]

  for (let depth = 1; depth < segments.length; depth += 1) {
    const prefix = segments.slice(0, depth)
    const ancestor = source.getPage(prefix)
    if (ancestor) crumbs.push({ name: ancestor.data.title, path: ancestor.url })
  }

  if (segments.length > 0) crumbs.push({ name: title, path: docsPath(...segments) })
  return crumbs
}

/**
 * Every documentation page.
 *
 * THE ONE RULE THIS FILE EXISTS TO KEEP: it never reads `searchParams`.
 *
 * Reading `searchParams` in a page opts that route out of static generation, and
 * because this is the optional catch-all for the entire corpus, "that route" is
 * every documentation page on the site. The `?base=&style=` switcher described
 * in the component anatomy therefore lives in a CLIENT component. That
 * component reads `useSearchParams()` and re-points an `<IframePreview>` at a
 * `/view/[base]/[style]/[kind]/[name]` URL, which is the surface where the
 * base × style matrix legitimately lives as real path segments. The docs page
 * itself has exactly one canonical, un-namespaced URL per component, which is
 * also the only URL an agent can guess. See addendum A6 and locked decision 6.
 *
 * `params` is a Promise in Next 16 and is awaited. `PageProps<'/[[...slug]]'>`
 * comes from `next typegen`, which the `typecheck` script runs before `tsc`.
 */
export default async function Page(props: PageProps<"/[[...slug]]">) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body

  /*
    The two per-page entities. The breadcrumb is the one that changes what a
    result looks like: without it, a page five levels down prints a truncated
    URL under its title. The article block carries the review date as
    `dateModified`, which is the same field and the same value the sitemap
    reports as `lastmod`, so the two surfaces cannot tell a crawler different
    stories about when this page was last looked at.
  */
  const structured = graph([
    breadcrumbLd(docsCrumbs(params.slug, page.data.title)),
    techArticleLd({
      title: page.data.title,
      description: page.data.description ?? "",
      path: page.url,
      image: ogUrl({
        title: page.data.title,
        description: page.data.description,
        status: page.data.status,
        section: params.slug?.[0],
      }),
      reviewed: page.data.reviewed,
    }),
  ])

  return (
    <div className="docs-page">
      <JsonLd data={structured} />
      {site.sourcePublic ? (
        <a
          className="docs-edit-link"
          href={editUrl(page.path)}
          target="_blank"
          rel="noreferrer noopener"
          data-print="hide"
        >
          <Pencil aria-hidden="true" />
          Edit this page
        </a>
      ) : null}
      <article className="docs-article">
        <h1 className="docs-title">{page.data.title}</h1>
        {page.data.description ? (
          <p className="docs-lead">{page.data.description}</p>
        ) : null}
        <div className="prose docs-prose">
          {/*
            `createRelativeLink` resolves the relative file links MDX pages are
            required to use (`../health/alerts.mdx`) into real URLs, so this
            resolver is the only thing that knows what a documentation URL
            looks like.
          */}
          <MDX
            components={getMDXComponents({
              a: createRelativeLink(source, page),
            })}
          />
        </div>
      </article>
    </div>
  )
}

export function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(
  props: PageProps<"/[[...slug]]">
): Promise<Metadata> {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  /**
   * `pageMetadata` in app/_shared/seo.ts builds the whole object: the
   * canonical, the Open Graph card, the Twitter card, the locale and the
   * alternate representations. It is shared with the eleven routes outside
   * this corpus, which is the only reason they have a canonical at all. Every
   * one of them used to declare a bare title and description and nothing else.
   *
   * The social card is one `/og` service for the whole site rather than a
   * per-route `opengraph-image.tsx`. The per-route form has to deal with an
   * optional catch-all, a Promise `params` and the generated-image `id`
   * parameter all at once, and gets you one image per page for the trouble. A
   * single endpoint driven by the frontmatter is less code and, more usefully,
   * means the status chip on the card comes from the same field the page header
   * renders. A component that goes from `planned` to `shipped` updates its card
   * without anybody remembering to, and a page that declares no phase sends
   * none, so its card carries no chip.
   *
   * THE MARKDOWN TWIN IS ADVERTISED, NOT SUBMITTED. `alternates.types` puts a
   * `<link rel="alternate" type="text/markdown">` in the head, which is how a
   * client that prefers text finds the twin without knowing the `.md`
   * convention. The twin itself answers with a `Link: rel="canonical"` header
   * pointing back here, which is what Google asks for on an alternate
   * representation that lives at its own URL, and it is why four hundred
   * near-identical markdown documents do not compete with the pages they are
   * twins of. See `app/llms.mdx/[[...slug]]/route.ts`.
   */
  return pageMetadata({
    title: page.data.title,
    description: page.data.description ?? "",
    path: page.url,
    type: "article",
    status: page.data.status,
    section: params.slug?.[0],
    markdownPath: docsMarkdownPath(...(params.slug ?? [])),
  })
}
