import type { Metadata } from "next"
import Link from "next/link"

import { Container, Grid, PageHeader, Panel } from "@/app/_shared/ui"
import { routes } from "@/lib/routes"
import { pageMetadata } from "@/app/_shared/seo"
import {
  JsonLd,
  breadcrumbLd,
  graph,
} from "@/app/_shared/structured-data"

export const metadata: Metadata = pageMetadata({
  title: "Playground",
  description:
    "Three tools: build a theme from a brand colour, check a colour pair against APCA and WCAG 2.2, and test the two colour axes.",
  path: routes.playground(),
  type: "website",
  section: "Tools",
})

/**
 * `/playground` is the index of the three tools.
 */
export default function PlaygroundPage() {
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
            { name: "Playground", path: routes.playground() },
          ]),
        ])}
      />
      <PageHeader
        eyebrow="Tools"
        title="Playground"
        lead="Three tools. All three run on the same colour code CI uses, so an answer here is the answer the build gives."
      />

      <Container className="py-10">
        <Grid cols={3}>
          <ToolCard
            href={routes.playgroundTheme()}
            title="Theme generator"
            summary="Put in a brand colour, get a lightness ramp out. Every step is checked against the contrast floor."
          />
          <ToolCard
            href={routes.playgroundContrast()}
            title="Contrast oracle"
            summary="Measure any two colours with APCA Lc and the WCAG 2.2 ratio, side by side, against the opsinjs floor."
          />
          <ToolCard
            href={routes.playgroundStatus()}
            title="Two-axis lab"
            summary="Pair a measurement category with a clinical status, and watch the lab refuse the unsafe ones."
          />
        </Grid>

        <section className="mt-12">
          <h2 className="text-lg font-semibold tracking-tight">Cautions</h2>
          <Panel className="mt-3">
            <p className="text-sm leading-relaxed">
              These numbers describe the shipped presets. Change a token and
              they no longer describe your theme. Use{" "}
              <Link
                className="text-foreground underline underline-offset-4"
                href={routes.docs("theming")}
              >
                validating your theme
              </Link>{" "}
              instead.
            </p>
          </Panel>
        </section>
      </Container>
    </>
  )
}

function ToolCard({
  href,
  title,
  summary,
}: {
  href: string
  title: string
  summary: string
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <h2 className="font-medium">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {summary}
      </p>
    </Link>
  )
}
