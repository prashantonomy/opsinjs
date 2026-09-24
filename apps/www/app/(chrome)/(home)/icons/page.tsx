import type { Metadata } from "next"
import Link from "next/link"

import { routes } from "@/lib/routes"
import { Container, Mono, PageHeader, Panel, Prose } from "@/app/_shared/ui"
import { pageMetadata } from "@/app/_shared/seo"
import {
  JsonLd,
  breadcrumbLd,
  graph,
} from "@/app/_shared/structured-data"
import { IconBrowser } from "./icon-browser"

export const metadata: Metadata = pageMetadata({
  title: "Icon browser",
  description:
    "The curated opsinjs icon inventory: one library, a documented job for every glyph, and an explicit rule against symbols that imply clinical authority.",
  path: routes.icons(),
  type: "website",
  section: "Foundations",
})

/**
 * `/icons` is the browsable inventory.
 *
 * The interesting half of this page is not the grid; it is the prohibition
 * underneath it. A consumer health app that decorates itself with caducei,
 * stethoscopes and red crosses is making a claim about who is speaking, and in a
 * product whose entire safety argument rests on the reader understanding that an
 * app is not a clinician, that claim is the most expensive decoration available.
 */
export default function IconsPage() {
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
            { name: "Icons", path: routes.icons() },
          ]),
        ])}
      />
      <PageHeader
        eyebrow="Foundations"
        title="Icons"
        lead="One library, one weight, and a documented job for every glyph. This page also names the symbols this system will not use, and says why."
      />

      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <Prose>
            <p>
              opsinjs uses <strong>lucide</strong> and nothing else. One library
              means one stroke weight, one optical size and one set of
              metaphors; two libraries means two warning triangles on the same
              screen, drawn slightly differently, and a reader who has to work
              out whether the difference means something.
            </p>
            <p>
              Icons here are documented the way components are: each one has a
              job written next to it. An icon without a stated job gets used for
              whatever it looks like, which is how a stethoscope ends up
              labelling a settings screen.
            </p>
            <p>
              The rule that matters most:{" "}
              <strong>an icon never carries clinical status on its own.</strong>{" "}
              Status is a word, a shape and a colour together. Somebody using a
              screen reader gets the word; somebody printing the page in
              greyscale gets the shape; somebody glancing at it in sunlight gets
              the colour. Any one of those failing must not take the meaning
              with it.
            </p>
          </Prose>

          <Panel className="h-fit">
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              Related
            </h2>
            <ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>
                <Link
                  className="text-foreground underline underline-offset-4"
                  href={routes.docs("foundations", "iconography")}
                >
                  Iconography
                </Link>{" "}
                covers sizing, alignment and the optical rules.
              </li>
              <li>
                <Link
                  className="text-foreground underline underline-offset-4"
                  href={routes.docs("handbook", "icons")}
                >
                  Icons in practice
                </Link>{" "}
                covers importing, tree-shaking and the client-boundary question.
              </li>
              <li>
                <Link
                  className="text-foreground underline underline-offset-4"
                  href={routes.docs("accessibility", "colour-independence")}
                >
                  Colour independence
                </Link>{" "}
                covers the greyscale and colour-vision audit these shapes exist
                to pass.
              </li>
              <li>
                <Link
                  className="text-foreground underline underline-offset-4"
                  href={routes.docs("content", "alt-text-and-descriptions")}
                >
                  Alt text and descriptions
                </Link>{" "}
                says when a glyph needs a label and when it must be hidden.
              </li>
            </ul>
          </Panel>
        </div>

        <hr className="my-10 border-border" />

        <IconBrowser />

        {/* ------------------------------------------------------------ */}
        <section className="mt-16">
          <h2 className="text-lg font-semibold tracking-tight">
            Symbols this system will not use
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Not a matter of taste. Each of these makes a claim about authority,
            provenance or institutional identity that a consumer health app is
            not entitled to make, and a reader who believes the claim will act
            on the screen differently.
          </p>

          <ul className="mt-5 divide-y divide-border overflow-hidden rounded-lg border border-border">
            <ProhibitedSymbol
              symbol="The red cross on white"
              reason="A protected emblem under the Geneva Conventions and the national legislation implementing them. Using it decoratively is not merely misleading about who is speaking; it is a misuse of a protected sign."
              instead="Use the status glyphs. Urgency is expressed by the status axis, not by borrowing an emergency organisation's identity."
            />
            <ProhibitedSymbol
              symbol="The caduceus and the Rod of Asclepius"
              reason="They read as “a doctor is telling you this”. The whole safety position of a consumer health product is that it is not a clinician and does not diagnose; an icon that says otherwise undoes a paragraph of careful wording."
              instead="Use a category glyph for what the measurement is, and a Term or CareCard for who is actually speaking."
            />
            <ProhibitedSymbol
              symbol="Stethoscopes, white coats, clipboards with ticks"
              reason="Clinical-authority props. They shift a reading from “here is your number” to “this has been reviewed”, which is a claim about a workflow that did not happen."
              instead="If a value genuinely has been reviewed by a clinician, say so in words with a date and a name. That is provenance, and provenance is text."
            />
            <ProhibitedSymbol
              symbol="Prescription and pharmacy marks"
              reason="They imply a dispensing or prescribing relationship. Medication features record what somebody says they took; they do not prescribe, and the iconography must not suggest they do."
              instead="Use the Pill glyph for a dose record, and put the prescribing relationship in the copy where it can be qualified."
            />
            <ProhibitedSymbol
              symbol="Heart-rate lines as decoration"
              reason="An ECG trace used as ornament on a page with no ECG data teaches readers that the trace is meaningless, which is a bad habit to build in an app that may one day show a real one."
              instead="Use TrendSparkline where there is real data, and nothing where there is not."
            />
          </ul>

          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Stated as guidance rather than as law: this is the opinion of this
            design system about the products it is for, argued from the safety
            position set out in{" "}
            <Link
              className="text-foreground underline underline-offset-4"
              href={routes.docs("start", "safety-scope-and-limitations")}
            >
              safety, scope and limitations
            </Link>
            . The one exception is the protected-emblem point, which is a matter
            of law in most jurisdictions rather than of design.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-lg font-semibold tracking-tight">
            Using these icons
          </h2>
          <Prose className="mt-3">
            <p>
              Import by name from <Mono>lucide-react</Mono>. Every icon in this
              inventory is a named export, so the import is tree-shaken and you
              pay for the glyphs you use rather than for the library. The copy
              button on each card gives you the exact import line.
            </p>
            <p>
              Size icons in the same ladder as text rather than in pixels chosen
              per screen, and hide decorative glyphs from assistive technology
              with <Mono>aria-hidden</Mono>. An icon that duplicates an adjacent
              label is noise when it is announced twice. The generated component
              pages carry the specific rule for each component that ships an
              icon.
            </p>
          </Prose>
        </section>
      </Container>
    </>
  )
}

function ProhibitedSymbol({
  symbol,
  reason,
  instead,
}: {
  symbol: string
  reason: string
  instead: string
}) {
  return (
    <li className="bg-card p-4">
      <h3 className="font-medium">{symbol}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {reason}
      </p>
      <p className="mt-2 text-sm leading-relaxed">
        <span className="font-medium text-muted-foreground">Instead: </span>
        {instead}
      </p>
    </li>
  )
}
