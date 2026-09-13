import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page"
import { createRelativeLink } from "fumadocs-ui/mdx"

import { PageTemplate } from "@/components/docs/page-template"
import { getMDXComponents } from "@/components/mdx"
import { source } from "@/lib/source"
import { absoluteUrl, docsMarkdownPath, ogUrl, site } from "@/lib/routes"

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
 * `params` is a Promise in Next 16 and is awaited. `PageProps<'/docs/[[...slug]]'>`
 * comes from `next typegen`, which the `typecheck` script runs before `tsc`.
 */
export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        {/*
          PageTemplate is the contract enforcer. A page declares its `kind` in
          frontmatter, the kind fixes its headings, and the declared `status`
          fixes which of those headings are required. A component page at
          `planned` owes eleven sections, and a stable one owes twenty-two.
          Handing it the table of contents is what lets it check the page it is
          wrapping instead of trusting the author, and a missing required
          section fails the build rather than shipping a heading with three
          sentences under it.
        */}
        <PageTemplate
          kind={page.data.kind}
          status={page.data.status}
          category={page.data.category}
          toc={page.data.toc}
          path={page.url}
        >
          {/*
            `createRelativeLink` resolves the relative file links that MDX pages
            are required to use (`../health/alarm-fatigue.mdx`) into real URLs.
            Absolute `/docs/...` links are banned in MDX precisely so that this
            resolver is the only thing that knows what a documentation URL looks
            like. Keeping that knowledge in one place is what makes a future
            `[lang]` segment a one-file change instead of a corpus-wide
            find-and-replace.
          */}
          <MDX
            components={getMDXComponents({
              a: createRelativeLink(source, page),
            })}
          />
        </PageTemplate>
      </DocsBody>
    </DocsPage>
  )
}

export function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(
  props: PageProps<"/docs/[[...slug]]">
): Promise<Metadata> {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const url = absoluteUrl(page.url)

  /**
   * One OG image service for the whole corpus rather than a per-route
   * `opengraph-image.tsx`. The per-route form has to deal with an optional
   * catch-all, a Promise `params` and the generated-image `id` parameter all at
   * once, and gets you one image per page for the trouble. A single `/og`
   * endpoint driven by the frontmatter is less code and, more usefully, means
   * the status badge on the social card comes from the same field the page
   * header renders. A component that goes from `planned` to `alpha` updates its
   * card without anybody remembering to.
   *
   * The URL is built by `ogUrl` in lib/routes rather than assembled here, for
   * the same reason every other path is: one place knows the shape.
   */
  const image = ogUrl({
    title: page.data.title,
    description: page.data.description,
    status: page.data.status,
    section: params.slug?.[0],
  })

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: url,
      types: {
        // The processed-markdown twin. Advertising it here is how a client that
        // prefers text finds it without having to know the `.md` convention.
        "text/markdown": absoluteUrl(docsMarkdownPath(...(params.slug ?? []))),
      },
    },
    openGraph: {
      type: "article",
      siteName: site.name,
      url,
      title: page.data.title,
      description: page.data.description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: page.data.title,
      description: page.data.description,
      images: [image],
    },
  }
}
