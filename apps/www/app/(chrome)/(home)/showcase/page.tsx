import type { Metadata } from "next"
import Link from "next/link"

import { Container, FactTable, PageHeader } from "@/app/_shared/ui"
import { showcasePreviews } from "@/components/showcase/previews"
import { routes, site } from "@/lib/routes"
import { showcases } from "@/lib/showcases"
import { pageMetadata } from "@/app/_shared/seo"
import {
  JsonLd,
  breadcrumbLd,
  graph,
} from "@/app/_shared/structured-data"

export const metadata: Metadata = pageMetadata({
  title: "Showcase",
  description:
    "Whole screens built only from opsinjs components. opsinjs built both of them, every figure in them is invented, and none has had a clinical review.",
  path: routes.showcase(),
  type: "website",
  section: "Showcase",
})

/** The bar an entry from another team has to clear, set before anyone asked. */
const ENTRY_TESTS: [string, string][] = [
  [
    "A real product with real readers",
    "Shipped and reachable by somebody who is not on the team. Concept work and internal demos belong somewhere else.",
  ],
  [
    "A named team who agreed to appear",
    "Entries are opt in, attributed, and removed on request without discussion.",
  ],
  [
    "Screens with the colour axes intact",
    "A product that themed opsinjs into one colour axis is welcome to, and it is not an example of this system working.",
  ],
  [
    "No patient data, ever",
    "Screenshots use synthetic readings, because a plausible series beside a date and a place can identify somebody.",
  ],
]

/**
 * `/showcase` has the shape of the clawscale showcase: a short header, then one
 * card per screen with a drawing of it, a tag, a sentence and the components
 * it leans on. The grid reads `lib/showcases.ts`.
 *
 * EVERY CARD IS OPSINJS'S OWN WORK, and the header says so before the grid
 * does. The bar a team's entry would have to clear is printed under the grid,
 * because the medicines app page links here for it and because a showcase is
 * the one page most tempted to fill itself with things nobody shipped.
 */
export default function ShowcasePage() {
  return (
    <>
      {/*
        The trail Google prints in place of a truncated URL. The site
        entity and the publisher are declared once on the root layout and
        referred to by `@id`, so this block carries only what is local to
        this page.
      */}
      <JsonLd
        data={graph([
          breadcrumbLd([
            { name: "Introduction", path: routes.home() },
            { name: "Showcase", path: routes.showcase() },
          ]),
        ])}
      />
      <PageHeader
        eyebrow="Built by opsinjs"
        title="Showcase"
        lead="Whole screens built only from opsinjs components. opsinjs built both of them and every figure in them is invented. No opsinjs component has had an accessibility review or a clinical review, so neither screen is for a production health surface."
      />

      <Container className="py-10">
        <ul className="grid list-none gap-5 p-0 sm:grid-cols-[repeat(auto-fill,minmax(min(100%,26rem),1fr))]">
          {showcases.map((showcase) => {
            const Preview = showcasePreviews[showcase.slug]
            return (
              <li
                key={showcase.slug}
                className="relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-foreground/25 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring"
              >
                <div className="aspect-8/5 border-b border-border [&_svg]:block [&_svg]:size-full">
                  <Preview />
                </div>
                <div className="flex flex-col gap-1.5 px-5 pt-4 pb-5">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                    <h2 className="text-lg font-semibold tracking-tight">
                      {/* The title link covers the whole card, so the card is one target with one name. */}
                      <Link
                        href={showcase.href}
                        className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                      >
                        {showcase.title}
                      </Link>
                    </h2>
                    <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] tracking-wide whitespace-nowrap text-muted-foreground">
                      {showcase.domain}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {showcase.description}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {showcase.components} components, among them{" "}
                    {showcase.highlights.join(", ")}.
                  </p>
                </div>
              </li>
            )
          })}
        </ul>

        <section className="mt-14 max-w-3xl">
          <h2 className="text-lg font-semibold tracking-tight">
            Entries from other teams
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            None yet. An entry will have to clear four tests, published while
            there was nothing to put here so that nobody&apos;s first request
            set the bar.
          </p>
          <div className="mt-4">
            <FactTable
              caption="What an entry from another team will have to show."
              columns={["Test", "What it means"]}
              rows={ENTRY_TESTS}
            />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Building something with opsinjs?{" "}
            <a
              className="underline underline-offset-4"
              href={site.github}
              rel="noreferrer noopener"
              target="_blank"
            >
              Say so on GitHub
            </a>
            . Until then,{" "}
            <Link
              className="underline underline-offset-4"
              href={routes.docs("patterns")}
            >
              the patterns
            </Link>{" "}
            show the components working together one screen at a time.
          </p>
        </section>
      </Container>
    </>
  )
}
