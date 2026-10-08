import type { Metadata } from "next"
import Link from "next/link"

import { Container, Mono, PageHeader, Panel, Prose } from "@/app/_shared/ui"
import { TokenBrowser } from "./token-browser"
import { routes } from "@/lib/routes"
import { pageMetadata } from "@/app/_shared/seo"
import {
  JsonLd,
  breadcrumbLd,
  graph,
} from "@/app/_shared/structured-data"

export const metadata: Metadata = pageMetadata({
  title: "Token browser",
  description:
    "Every opsinjs design token read live from the running stylesheet: colour, materials, motion, shape and target sizes, with the value each resolves to here.",
  path: routes.tokens(),
  type: "website",
  section: "Foundations",
})

/**
 * `/tokens` is the token browser.
 *
 * The manifest asks for grouping by tier and namespace. It groups by NAMESPACE
 * only, and the omission is deliberate rather than lazy: tier is a property of
 * the token SOURCE, and the source is `tokens/*.json`, not the stylesheet. The
 * three tiers are primitive, semantic and component. A CSS custom property
 * carries no tier. Inventing one from a naming convention would produce a
 * classification that is usually right and occasionally, invisibly wrong, on
 * the one page whose job is to be exhaustive and literal. The tier is published
 * where it is known: in the generated token reference, which is emitted from
 * the JSON.
 */
export default function TokensPage() {
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
            { name: "Tokens", path: routes.tokens() },
          ]),
        ])}
      />
      <PageHeader
        eyebrow="Tokens"
        title="Every token, as your browser resolves it"
        lead="Read from the running stylesheet rather than from a list, so this page reports what is actually in effect once dark mode, the Display-P3 escalation and your accessibility preferences have all been applied."
      />

      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <Prose>
            <p>
              Design tokens exist so that a decision is made once and referenced
              everywhere. That is only true if the reference is cheap to find,
              which is what this page is for: search, copy the{" "}
              <Mono>var()</Mono>, move on.
            </p>
            <p>
              The values are not typed anywhere. They are authored as JSON in{" "}
              <Mono>tokens/*.json</Mono>, compiled into{" "}
              <Mono>app/tokens.generated.css</Mono> by a build script, and read
              back out of the browser here. The panel at the top of the list
              tells you whether the generated layer is loaded or whether you are
              looking at the authored fallbacks a clean clone ships with.
            </p>
            <p>
              Three of these namespaces change with your operating system
              settings, and the page will show you that they have. Turn on
              reduced motion and every duration becomes 1ms. Turn on reduced
              transparency and the translucent material rungs become opaque. Use
              a wide-gamut display and the status ramps escalate their chroma
              without moving in lightness, so the measured contrast is unchanged
              and only the saturation grows.
            </p>
          </Prose>

          <Panel className="h-fit">
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              Where each thing lives
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The signpost, repeated verbatim across the site:{" "}
              <strong className="font-medium text-foreground">
                Foundations is what a token means. Handbook and Theming are how
                you change it. Reference is the generated list of every one.
              </strong>
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>
                <Link
                  className="text-foreground underline underline-offset-4"
                  href={routes.docs("theming")}
                >
                  Theming
                </Link>{" "}
                covers the three tiers, why a component may never reference a
                primitive, and adding your own tokens so they survive an upgrade.
              </li>
              <li>
                <Link
                  className="text-foreground underline underline-offset-4"
                  href={routes.docs("reference", "generated", "tokens")}
                >
                  Generated token reference
                </Link>{" "}
                has the full table with tier, source file and what each token
                controls.
              </li>
              <li>
                <Link
                  className="text-foreground underline underline-offset-4"
                  href={routes.colors()}
                >
                  Colour browser
                </Link>{" "}
                has the two axes on their own, with format switching.
              </li>
            </ul>
          </Panel>
        </div>

        <hr className="my-10 border-border" />

        <TokenBrowser />

        <section className="mt-14">
          <h2 className="text-lg font-semibold tracking-tight">
            If this list looks short
          </h2>
          <Prose className="mt-3">
            <p>
              It enumerates custom properties, and a scale is only listed once
              it has been emitted as one. The type and space scales are authored
              in <Mono>tokens/type.json</Mono> and{" "}
              <Mono>tokens/space.json</Mono> and are consumed today through
              Tailwind&rsquo;s own theme rather than through an{" "}
              <Mono>--opsin-</Mono> property, so they appear in the generated
              reference before they appear here. When the build script emits
              them, this page will pick them up with no change to this file.
              That behaviour is the entire argument for reading the stylesheet
              instead of keeping a list.
            </p>
          </Prose>
        </section>
      </Container>
    </>
  )
}
