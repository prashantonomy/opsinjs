import type { Metadata } from "next"
import Link from "next/link"

import {
  Container,
  FactTable,
  Grid,
  Mono,
  PageHeader,
  Panel,
  Prose,
} from "@/app/_shared/ui"
import { routes, viewPath } from "@/lib/routes"
import { pageMetadata } from "@/app/_shared/seo"
import {
  JsonLd,
  breadcrumbLd,
  graph,
} from "@/app/_shared/structured-data"

export const metadata: Metadata = pageMetadata({
  title: "Medicines app",
  description:
    "A single-page diabetes medicines diary built only from opsinjs parts. It records and reminds, and it refuses to calculate a dose or advise on a missed one.",
  path: routes.showcaseMedicinesApp(),
  type: "website",
  section: "Showcase",
})

/**
 * `/showcase/diabetes-medicines-app` is the one thing under `/showcase` that is
 * not an entry, and the page says so before it says anything else.
 *
 * WHY IT SITS HERE RATHER THAN ON THE SHOWCASE ITSELF. The showcase publishes a
 * bar: a real product, real readers, a named team who agreed to appear. This app
 * clears none of it, because opsinjs built it and nobody uses it. Putting it in
 * the grid would be the fiction that page exists to refuse. Putting it one level
 * down, with the difference stated in the first paragraph, is how a design system
 * shows its own work without pretending somebody else's.
 *
 * WHY THE APP IS IN AN IFRAME AND NOT ON THIS PAGE. The `opsin-*` utilities the
 * kit is written in live in `app/product.css`, which only `app/(view)/layout.tsx`
 * loads. Rendering the app inside the documentation chrome would show it wearing
 * this site's clothes, which on a system whose thesis is "the docs chrome is not
 * the product" would be a lie told by omission. The frame points at the same
 * `/view` route the specimen's documentation page frames.
 */

/** The frame the app renders in. A phone width, because that is what it is for. */
const FRAME_WIDTH = 402

/** Tall enough that a destination is readable without the frame scrolling first. */
const FRAME_HEIGHT = 760

/** What the app composes, for the count and for the list further down. */
const COMPOSES = [
  "accordion",
  "badge",
  "button",
  "callout",
  "card",
  "care-card",
  "checkbox",
  "combobox",
  "consent-sheet",
  "dialog",
  "disclaimer-note",
  "divider",
  "dose-tracker",
  "empty-state",
  "field",
  "icon-button",
  "link",
  "log-sheet",
  "menu",
  "number-field",
  "radio-group",
  "relative-time",
  "segmented-control",
  "select",
  "sheet",
  "source-citation",
  "stepper",
  "surface",
  "switch",
  "tab-bar",
  "term",
  "textarea",
  "timeline-entry",
  "value",
  "visually-hidden",
]

/** What it deliberately leaves out, and the one-line reason for each. */
const LEFT_OUT: { id: string; reason: string }[] = [
  {
    id: "status-pill",
    reason:
      "A medicines record states no clinical level, so there is no status for a pill to carry.",
  },
  {
    id: "alert-banner",
    reason:
      "It takes a clinical status. Supply running low is a fact about a pack, not a level of urgency.",
  },
  {
    id: "metric-tile",
    reason:
      "It draws a measurement with a unit and a measurement time. A count of logged doses is neither.",
  },
  {
    id: "goal-ring",
    reason:
      "A ring filling towards a goal turns a medicines record into a score somebody can lose.",
  },
  {
    id: "progress",
    reason: "The same objection, drawn as a bar.",
  },
  {
    id: "trend-sparkline",
    reason:
      "A line through dose events asserts a direction, and a direction about somebody's medicines is an interpretation.",
  },
  {
    id: "toast",
    reason:
      "A confirmation that leaves on a timer takes the undo with it, and this audience reads slowly.",
  },
  {
    id: "tooltip",
    reason:
      "Hover is unavailable on touch, and nothing here is safe to hide behind it.",
  },
]

export default function MedicinesAppShowcasePage() {
  const src = viewPath({ kind: "screen", name: "diabetes-medicines-app" })

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
            { name: "Medicines app", path: routes.showcaseMedicinesApp() },
          ]),
        ])}
      />
      <PageHeader
        eyebrow="Built by opsinjs, not an entry"
        title="A diabetes medicines app, built only from opsinjs"
        lead="One page, four destinations, thirty-five components. It records the medicines somebody takes and reminds them at times they chose. It calculates no dose, changes no dose, and says nothing about what to do about a dose they did not take."
      >
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          This is not a showcase entry and it is not trying to be one. Nobody
          uses it, no team ships it, and every medicine, dose and time in it is
          invented. It is here because a design system that has never assembled
          its own parts into a product has not finished arguing its case.{" "}
          <Link
            className="underline underline-offset-4"
            href={routes.showcase()}
          >
            The bar a real entry has to clear
          </Link>{" "}
          is published on the showcase and this clears none of it.
        </p>
      </PageHeader>

      <Container className="py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <div className="order-2 lg:order-1">
            <section>
              <h2 className="text-lg font-semibold tracking-tight">
                What it is
              </h2>
              <Prose className="mt-3">
                <p>
                  A free, browser-only medicines diary for somebody who takes
                  several medicines for diabetes. It keeps a list they typed in,
                  it reminds them at times they set themselves, it records what
                  they say they took, and it hands that record back in a form
                  they can take to an appointment. There is no account, no
                  sign-in, no server and no network call.
                </p>
              </Prose>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-semibold tracking-tight">
                What it refuses, and why that is the design
              </h2>
              <Prose className="mt-3">
                <p>
                  The refusals are the interesting part. Software that works out
                  an insulin dose from the carbohydrate in a meal is the worked
                  example the UK regulator uses for a medical device, and a
                  disclaimer does not exempt an app that qualifies as one. So
                  the refusals are in the code rather than in a paragraph: there
                  is no dose arithmetic anywhere, no strength picker, no
                  prefilled dose, no interaction checking, no threshold the app
                  owns, and no answer to “what do I do about a dose I missed”
                  beyond naming the people who can give one.
                </p>
                <p>
                  It also never marks a dose as missed. It cannot know. A dose
                  reaches that state only when the person presses a control that
                  says “I did not take it”, and a dose nobody has answered for
                  stays unanswered however long ago it was due. No clock moves
                  it.
                </p>
              </Prose>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-semibold tracking-tight">
                What it shows about the system
              </h2>
              <Prose className="mt-3">
                <p>
                  The headline finding is a refusal too: the app carries{" "}
                  <strong>neither colour axis</strong>. A medicines record
                  states no clinical level and names no category, so nothing in
                  it is tinted from either ramp and every state is told in a
                  word and a shape. That is not the kit falling short. It is
                  what obeying{" "}
                  <Link href={routes.docs("health", "two-colour-axes")}>
                    the two-axes rule
                  </Link>{" "}
                  looks like when a product genuinely has no business on either.
                </p>
                <p>
                  Building it also found two defects that no single-component
                  preview would ever show. A popup control placed inside a sheet
                  renders its list behind the sheet and cannot be pressed, and
                  the tab bar pushes the page sideways at the largest text size.
                  Both are measured in a browser rather than argued from the
                  source, and both are written down rather than quietly worked
                  around.
                </p>
                <p>
                  The specimen page under Screens carries the rest: the
                  composition tree, the safety notes, the accessibility
                  contract, and the ten questions that stayed open.
                </p>
                <p>
                  <Link href={routes.docs("screens", "diabetes-medicines-app")}>
                    Read the specimen page
                  </Link>
                </p>
              </Prose>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-semibold tracking-tight">
                What it composes
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {COMPOSES.length} of the {60} components on the roster, in one
                file.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {COMPOSES.map((id) => (
                  <li key={id}>
                    <Link
                      className="inline-block border border-border px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                      href={routes.docs("components", id)}
                    >
                      {id}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-semibold tracking-tight">
                What it leaves out, and why
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                A showcase that reached for every component would be a showcase
                arguing for decoration. Each of these was considered and
                declined.
              </p>
              <div className="mt-4">
                <FactTable
                  caption="Eight components on the roster that this app does not reach for."
                  columns={["Component", "Why not"]}
                  rows={LEFT_OUT.map((entry) => [
                    <Link
                      key={entry.id}
                      href={routes.docs("components", entry.id)}
                    >
                      <Mono>{entry.id}</Mono>
                    </Link>,
                    entry.reason,
                  ])}
                />
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-semibold tracking-tight">
                Before you copy anything out of it
              </h2>
              <Grid cols={2} className="mt-6">
                <Panel>
                  <h3 className="font-medium">It has had no clinical review</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    No clinical safety officer, no hazard log, no clinical
                    safety case, no data protection impact assessment. None of
                    those is claimed and none has happened. The refusals are the
                    part worth copying; the assembly is a proposal.
                  </p>
                </Panel>
                <Panel>
                  <h3 className="font-medium">
                    Every figure in it is invented
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    The medicines are called “Morning tablet” and “Bedtime pen”.
                    No real drug, no real strength, no real schedule, and the
                    clock is fixed so the app says the same thing every time it
                    is built.
                  </p>
                </Panel>
                <Panel>
                  <h3 className="font-medium">
                    The components are audited, not independently reviewed
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    The API may change in any release with no deprecation
                    cycle. Every component has been audited against WCAG 2.2 AA
                    by its authors, in a static source pass and a rendered pass,
                    so what shipped is not an independent accessibility review
                    and no clinical review has happened yet. It is not ready for
                    a production health surface, and neither is this.
                  </p>
                </Panel>
                <Panel>
                  <h3 className="font-medium">Nothing is stored</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    What you type into the frame stays in the page and is gone
                    on reload. A demonstration that left a medicines list behind
                    in a shared browser would be the one hazard a mock can
                    genuinely cause.
                  </p>
                </Panel>
              </Grid>
            </section>
          </div>

          <div className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold tracking-tight">
                The app, running
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Rendered under the opsinjs product theme, in a frame at phone
                width. The controls work.
              </p>
              <div className="mt-4 flex justify-center overflow-x-auto">
                <iframe
                  title="A diabetes medicines app built from opsinjs components"
                  src={src}
                  loading="lazy"
                  className="shrink-0 border border-border bg-background"
                  style={{
                    width: FRAME_WIDTH,
                    maxWidth: "100%",
                    height: FRAME_HEIGHT,
                  }}
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                <a
                  className="underline underline-offset-4"
                  href={src}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  Open it in its own tab
                </a>{" "}
                at <Mono>{src}</Mono>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </>
  )
}
