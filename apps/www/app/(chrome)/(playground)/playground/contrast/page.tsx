import type { Metadata } from "next"
import Link from "next/link"

import { routes } from "@/lib/routes"
import { Container, Mono, PageHeader, Prose } from "@/app/_shared/ui"
import { pageMetadata } from "@/app/_shared/seo"
import {
  JsonLd,
  breadcrumbLd,
  graph,
} from "@/app/_shared/structured-data"
import { ContrastTool } from "./contrast-tool"

export const metadata: Metadata = pageMetadata({
  title: "Contrast oracle",
  description:
    "Measure any colour pair with APCA Lc and the WCAG 2.2 ratio side by side, against the same implementation opsinjs CI runs.",
  path: routes.playgroundContrast(),
  type: "website",
  section: "Playground",
})

export default function ContrastPlaygroundPage() {
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
            { name: "Contrast oracle", path: routes.playgroundContrast() },
          ]),
        ])}
      />
      <PageHeader
        eyebrow="Playground"
        title="Contrast oracle"
        lead="Two numbers for every pair, because they measure different things and the disagreement between them is the interesting part."
      />

      <Container className="py-10">
        <ContrastTool />

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Why both numbers
            </h2>
            <Prose className="mt-3">
              <p>
                The WCAG 2.2 contrast ratio is the figure written into
                procurement questionnaires, accessibility statements and
                regulation. You will be asked for it, and the answer has to be
                available. It is also a model of luminance contrast that
                predicts readability imperfectly. The imperfection shows most
                visibly for light text on mid-tone backgrounds, where the model
                is generous, and for very dark palettes, where it is harsh.
              </p>
              <p>
                APCA is the perceptual model developed for WCAG 3. It accounts
                for polarity, because dark-on-light and light-on-dark are
                genuinely different problems, and it accounts for text size and
                weight. That is why its answer is a signed lightness contrast
                rather than a symmetric ratio. It has no legal standing.
              </p>
              <p>
                opsinjs treats APCA as the design floor and WCAG 2.2 as the
                compliance floor, and publishes both for every token pair rather
                than choosing. A pair that fails either one does not ship.
              </p>
            </Prose>
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              What a passing number does not tell you
            </h2>
            <Prose className="mt-3">
              <p>
                Contrast is one criterion. A screen can clear every threshold on
                this page and still be unreadable to the person it was built
                for: a number without its unit, a trend arrow whose direction is
                meaningless without knowing whether up is good, a status
                conveyed by colour alone to somebody printing in greyscale.
              </p>
              <p>
                It also says nothing about the surface underneath. Translucent
                material rungs are measured against a worst-case backdrop with a
                minimum scrim, and that measurement is generated rather than
                checked by eye. See{" "}
                <Link
                  href={routes.docs("foundations", "materials")}
                >
                  the contrast floor in Materials
                </Link>
                .
              </p>
              <p>
                Finally: the figures published on this site describe the shipped
                presets. The moment you change a token they describe something
                else, which is what{" "}
                <Link href={routes.docs("theming")}>
                  validating your theme in Theming
                </Link>{" "}
                exists for.
              </p>
            </Prose>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold tracking-tight">
            The same measurement, three ways
          </h2>
          <Prose className="mt-3">
            <p>
              This tool posts to <Mono>/api/contrast</Mono>. So does{" "}
              <Mono>pnpm contrast</Mono>, which regenerates the committed
              conformance table, and so does the CI gate that fails a build when
              a measured pair regresses. There is one implementation,
              hand-written in <Mono>lib/color/</Mono>, with no colour library in
              the dependency tree. An answer you get here is therefore the
              answer the build gets, and not an approximation of it.
            </p>
            <p>
              <Link
                href={routes.docs("foundations", "colour")}
              >
                Contrast and APCA
              </Link>{" "}
              ·{" "}
              <Link href={routes.docs("reference", "generated", "contrast")}>
                Measured contrast for every token pair
              </Link>{" "}
              ·{" "}
              <Link href={routes.docs("foundations", "accessibility")}>
                Accessibility
              </Link>
            </p>
          </Prose>
        </section>
      </Container>
    </>
  )
}
