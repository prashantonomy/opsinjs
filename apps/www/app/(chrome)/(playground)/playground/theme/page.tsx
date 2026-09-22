import type { Metadata } from "next"
import Link from "next/link"

import { Container, Mono, PageHeader, Prose } from "@/app/_shared/ui"
import { ThemeTool } from "./theme-tool"
import { routes } from "@/lib/routes"
import { pageMetadata } from "@/app/_shared/seo"
import {
  JsonLd,
  breadcrumbLd,
  graph,
} from "@/app/_shared/structured-data"

export const metadata: Metadata = pageMetadata({
  title: "Theme generator",
  description:
    "Take a brand colour through a lightness ramp and see, step by step, where it stops being readable. The measurement uses the same contrast implementation the build runs.",
  path: routes.playgroundTheme(),
  type: "website",
  section: "Playground",
})

export default function ThemePlaygroundPage() {
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
            { name: "Theme generator", path: routes.playgroundTheme() },
          ]),
        ])}
      />
      <PageHeader
        eyebrow="Playground"
        title="Theme generator"
        lead="Most brand colours cannot be used as a text colour, and the cheapest moment to discover that is before anyone has built anything with them."
      />

      <Container className="py-10">
        <ThemeTool />

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              What the shipped engine adds
            </h2>
            <Prose className="mt-3">
              <p>
                The ramp above is derived in the browser and is deliberately
                simple: your hue, your chroma scaled by a factor, a pinned
                lightness. The colour engine that ships with opsinjs does three
                further things, and each of them exists because the simple
                version is wrong in a way that is hard to see.
              </p>
              <p>
                <strong>Chroma clamping per hue.</strong> The sRGB gamut is not
                a cylinder. At a given lightness, yellow can carry far more
                chroma than blue, and asking for more than the gamut holds does
                not produce a vivid colour. It produces a silently compressed
                one whose lightness has moved. The engine finds the boundary for
                each hue and lightness rather than guessing.
              </p>
              <p>
                <strong>Display-P3 escalation.</strong> On a wide-gamut display
                the ramp gains chroma without moving in lightness, so the
                measured contrast is unchanged and only the saturation grows.
                That is why the escalation is safe to apply automatically:
                nothing about meaning changes with gamut.
              </p>
              <p>
                <strong>Roles by measurement, not by position.</strong> A
                &ldquo;600&rdquo; is not a text colour because it is a 600. The
                engine assigns the surface, line and ink roles by validating
                candidate pairs against the floor, which is why the shipped
                ramps have different role boundaries for different hues.
              </p>
            </Prose>
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Where a brand colour is allowed to appear
            </h2>
            <Prose className="mt-3">
              <p>
                In a health interface, less far than you would expect. The two
                colour axes are already spoken for: status carries the verdict,
                category carries identity, and both are defined by the system
                rather than by a brand.
              </p>
              <p>
                A brand ramp gets the chrome. The chrome covers buttons, links,
                selection, navigation and the focus ring if it clears the floor.
                The ramp does not get a status level, and it does not get to
                tint a surface that reports a result. A brand blue reused as
                &ldquo;the good colour&rdquo; is how a system ends up with two
                vocabularies for the same idea, and the reader learns neither.
              </p>
              <p>
                <Link href={routes.docs("theming", "category-palettes")}>
                  Adding a category without contaminating the status axis
                </Link>{" "}
                covers the one case where a brand does legitimately extend the
                system, and{" "}
                <Link href={routes.docs("theming", "status-palettes")}>
                  status palettes
                </Link>{" "}
                explains why redefining the other axis is almost always a
                mistake.
              </p>
            </Prose>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold tracking-tight">
            Preset codes and taking this further
          </h2>
          <Prose className="mt-3">
            <p>
              A finished theme is distributable as an <Mono>opsinjs-*</Mono>{" "}
              preset code. It is a short, copyable string that encodes the whole
              configuration and can be applied with the CLI. The encoder is part
              of the theming tools and is not published yet, so this page hands
              you CSS rather than a code it cannot generate honestly.{" "}
              <Link href={routes.docs("registry", "preset-codes")}>
                Preset codes
              </Link>{" "}
              documents the format.
            </p>
            <p>
              When you have a theme,{" "}
              <Link href={routes.docs("theming", "validating-your-theme")}>
                validate it
              </Link>
              : the conformance figures published on this site describe the
              shipped presets, and the moment you change a token they describe
              something else. The check runs in CI and is the difference between
              a theme that is accessible and a theme that was accessible when
              somebody last looked.
            </p>
            <p>
              Individual pairs can be checked in{" "}
              <Link href={routes.playgroundContrast()}>
                the contrast oracle
              </Link>
              , and the shipped ramps are browsable at{" "}
              <Link href={routes.colors()}>/colors</Link>.
            </p>
          </Prose>
        </section>
      </Container>
    </>
  )
}
