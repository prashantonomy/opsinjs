import type { Metadata } from "next"
import Link from "next/link"

import { Container, Grid, PageHeader, Panel, Prose } from "@/app/_shared/ui"
import { routes, site } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Showcase",
  description:
    "Products built with opsinjs. One so far, and opsinjs built it. This page carries that one, and says what an entry from another team will have to prove before it appears here.",
}

/**
 * `/showcase` carries one thing, and it is opsinjs's own.
 *
 * A showcase is the one page on a design-system site that is pure social proof,
 * which makes it the one page most likely to be filled with side projects,
 * concept work and screenshots of the system's own examples. The bar for an entry
 * was published while there was nothing to put here, which is the only time it
 * could be set honestly, and it has not moved since.
 *
 * WHAT THE MEDICINES APP IS DOING AT THE TOP OF IT. It is the system assembled
 * into a product, and a reader who came to this page came to see exactly that. It
 * would still be dishonest to list it in the grid below as though somebody else
 * had shipped it, so it is named as opsinjs's own work, above the empty state
 * rather than beneath it, and the four tests it fails are printed directly
 * underneath. Burying it below an empty box was the earlier arrangement and it
 * hid the one piece of evidence the page has.
 */
export default function ShowcasePage() {
  return (
    <>
      <PageHeader
        eyebrow="One built, none submitted"
        title="Showcase"
        lead="One thing has been built with opsinjs, and opsinjs built it. Nobody else has shipped anything yet, so there are no entries from other teams, and saying so is more useful than a grid of invented screenshots."
      />

      <Container className="py-10">
        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            One thing opsinjs built itself, which is not an entry
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            It is named as opsinjs&apos;s own work rather than listed as an
            entry, deliberately. It clears none of the four tests below: nobody
            uses it, no team shipped it, and every figure in it is invented. It
            is here because a design system that has never assembled its own
            parts into a product has not finished arguing its case, and because
            the argument is more useful made in a running application than in
            another page of prose.
          </p>
          <div className="mt-6">
            <Panel>
              <h3 className="font-medium">A diabetes medicines app</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                One page, four destinations, thirty-five components. It records
                the medicines somebody takes and reminds them at times they
                chose. It calculates no dose, changes no dose, and says nothing
                about what to do about a dose they did not take, and those three
                refusals are in the code rather than in a disclaimer. It carries
                neither colour axis, which is the finding rather than a gap.
              </p>
              <p className="mt-4 text-sm">
                <Link
                  className="underline underline-offset-4"
                  href={routes.showcaseMedicinesApp()}
                >
                  Open the app and read why it refuses what it refuses
                </Link>
              </p>
            </Panel>
          </div>
        </section>

        <div className="mt-14 rounded-lg border border-dashed border-border bg-muted/40 p-8 text-center">
          <p className="text-lg font-medium">
            No entries from other teams yet.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            opsinjs has no published packages, and every implemented component
            has been audited against WCAG 2.2 AA by its own authors rather than
            independently reviewed: the API may change in any release without a
            deprecation cycle, neither an independent accessibility review nor a
            clinical review has taken place, and none of it is ready for a
            production health surface until a clinician signs it. Nothing can
            have shipped to real readers on that, so an entry on this page today
            would be a fiction. It would be a fiction on the page whose entire
            purpose is evidence.
          </p>
          <p className="mt-5 text-sm">
            <Link
              className="underline underline-offset-4"
              href={routes.docs(
                "project",
                "decisions",
                "0025-the-audit-is-author-run",
              )}
            >
              Why the audit is author-run, not independent
            </Link>{" "}
            &middot;{" "}
            <Link
              className="underline underline-offset-4"
              href={routes.docs("project", "roadmap")}
            >
              What has to happen first
            </Link>
          </p>
        </div>

        <section className="mt-14">
          <h2 className="text-lg font-semibold tracking-tight">
            What an entry will have to show
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Published while there was nothing to put on this page, so that the
            bar was not set by whoever asked first.
          </p>

          <Grid cols={2} className="mt-6">
            <Panel>
              <h3 className="font-medium">A real product with real readers</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Shipped and reachable by somebody who is not on the team.
                Concept work, portfolio pieces and internal demos are
                interesting and belong somewhere else. The value of a showcase
                is that it is evidence the system survives contact with
                production.
              </p>
            </Panel>
            <Panel>
              <h3 className="font-medium">A named team who agreed to appear</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Health products have regulatory and commercial sensitivities
                that a marketing site does not get to decide on their behalf.
                Entries are opt-in, attributed, and removable on request without
                discussion.
              </p>
            </Panel>
            <Panel>
              <h3 className="font-medium">Screens with the axes intact</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                A product that has themed opsinjs into a single-axis colour
                system is welcome to do so, because it is your product. It is
                still not an example of this system working. The showcase is a
                claim about the system, so the entry has to be one.
              </p>
            </Panel>
            <Panel>
              <h3 className="font-medium">No patient data, ever</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Screenshots use synthetic readings. Not a formality: a plausible
                blood-glucose series is identifying in combination with a date
                and a location, and a marketing page is exactly where that gets
                forgotten.
              </p>
            </Panel>
          </Grid>
        </section>

        <section className="mt-14">
          <h2 className="text-lg font-semibold tracking-tight">
            In the meantime
          </h2>
          <Prose className="mt-3">
            <p>
              Beside the app above,{" "}
              <Link href={routes.docs("screens")}>the screen specimens</Link>{" "}
              are the other place to look. Each one is a whole-screen
              specification showing the two colour axes, the material ladder and
              the motion tokens working together rather than one component at a
              time. Most of them are specifications, and they say so, but
              together with the app they are the best available answer to “what
              does a system built this way actually look like”.
            </p>
            <p>
              Building something with these ideas before the components exist is
              entirely possible, since the tokens and the doctrine are the
              substantial part. If you are doing that,{" "}
              <a href={site.github} rel="noreferrer noopener" target="_blank">
                say so on GitHub
              </a>
              . The first entries here will come from people who did that.
            </p>
            <p>
              You can also see the system applied to itself:{" "}
              <Link href={routes.colors()}>the colour browser</Link> and{" "}
              <Link href={routes.playground()}>the playground</Link> are drawn
              entirely from the token layer.
            </p>
          </Prose>
        </section>
      </Container>
    </>
  )
}
