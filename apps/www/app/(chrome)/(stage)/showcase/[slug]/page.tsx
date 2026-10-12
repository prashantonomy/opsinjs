import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { pageMetadata } from "@/app/_shared/seo"
import { JsonLd, breadcrumbLd, graph } from "@/app/_shared/structured-data"
import { ShowcaseStage } from "@/components/showcase/stage"
import { routes } from "@/lib/routes"
import { showcases, type Showcase } from "@/lib/showcases"

/**
 * `/showcase/<slug>` is one showcase screen on its own: the screen, and a small
 * bar in the top right corner that leads back to `/showcase` and switches the
 * theme and the screen size.
 * Nothing else is drawn. It has the shape of the clawscale showcase pages,
 * which are the app and nothing else. On a window 1024px or wider the screen
 * fills it and the bar floats over its corner. On a narrower window the screen
 * starts below the bar, for the reason `components/showcase/stage.tsx` gives.
 *
 * WHAT IS NOT HERE, ON PURPOSE. No site header, no footer, no search and no
 * prose. What the screen refuses and which components it composes belong on
 * the pattern pages, and the review caveat is printed on `/showcase`, above the
 * cards that open these pages. A reader can also arrive here directly, from
 * search or from a link in the docs, so each screen says on its own surface
 * that it is a demonstration or an example, and a screenshot of it cannot pass
 * for a real record.
 *
 * Every entry in `lib/showcases.ts` gets a page, and nothing else does.
 */
export const dynamicParams = false

export function generateStaticParams(): { slug: string }[] {
  return showcases.map((showcase) => ({ slug: showcase.slug }))
}

function findShowcase(slug: string): Showcase | undefined {
  return showcases.find((showcase) => showcase.slug === slug)
}

export async function generateMetadata(
  props: PageProps<"/showcase/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params
  const showcase = findShowcase(slug)
  if (!showcase) return {}
  return pageMetadata({
    title: showcase.title,
    description: showcase.description,
    path: routes.showcaseScreen(showcase.slug),
    type: "website",
    section: "Showcase",
  })
}

export default async function ShowcaseScreenPage(
  props: PageProps<"/showcase/[slug]">
) {
  const { slug } = await props.params
  const showcase = findShowcase(slug)
  if (!showcase) notFound()

  return (
    <>
      {/*
        The trail Google prints in place of a truncated URL. It renders
        nothing, so the page still draws the screen and the bar alone.
      */}
      <JsonLd
        data={graph([
          breadcrumbLd([
            { name: "Introduction", path: routes.home() },
            { name: "Showcase", path: routes.showcase() },
            {
              name: showcase.title,
              path: routes.showcaseScreen(showcase.slug),
            },
          ]),
        ])}
      />
      <ShowcaseStage name={showcase.slug} title={showcase.title} />
    </>
  )
}
