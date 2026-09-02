import type { Metadata } from "next"
import Link from "next/link"

import { Container, Grid, PageHeader, Panel, Prose } from "@/app/_shared/ui"
import { routes, site } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Showcase",
  description:
    "Products built with opsinjs. Empty, because nothing has been built with it yet — and this page says what an entry will have to prove before it appears here.",
}

/**
 * `/showcase` — reserved, and empty on purpose.
 *
 * The route exists now so that the criteria can be published now. A showcase is
 * the one page on a design-system site that is pure social proof, which makes it
 * the one page most likely to be filled with side projects, concept work and
 * screenshots of the system's own examples. Deciding the bar while the page is
 * empty is the only time it can be decided honestly.
 */
export default function ShowcasePage() {
  return (
    <>
      <PageHeader
        eyebrow="Reserved"
        title="Showcase"
        lead="Nothing has been built with opsinjs, so there is nothing here. That will be true for a while, and saying so is more useful than a grid of invented screenshots."
      />

      <Container className="py-10">
        <div className="rounded-lg border border-dashed border-border bg-muted/40 p-8 text-center">
          <p className="text-lg font-medium">No entries yet.</p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            opsinjs has no published packages and no implemented components. A
            product cannot have been built with a system that cannot yet be
            installed, so an entry on this page today would be a fiction — and a
            fiction on the page whose entire purpose is evidence.
          </p>
          <p className="mt-5 text-sm">
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
            Published now, while the page is empty, so that the bar is not set
            by whoever asks first.
          </p>

          <Grid cols={2} className="mt-6">
            <Panel>
              <h3 className="font-medium">A real product with real readers</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Shipped and reachable by somebody who is not on the team.
                Concept work, portfolio pieces and internal demos are
                interesting and belong somewhere else — the value of a showcase
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
                system is welcome to do so — it is your product — but it is not
                an example of this system working. The showcase is a claim about
                the system, so the entry has to be one.
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
              The nearest thing to a showcase today is{" "}
              <Link href={routes.docs("screens")}>the screen specimens</Link> —
              whole-screen specifications that show the two colour axes, the
              material ladder and the motion tokens working together rather than
              one component at a time. They are specifications too, and they say
              so, but they are the best available answer to “what does a system
              built this way actually look like”.
            </p>
            <p>
              If you are building something with these ideas before the
              components exist — which is entirely possible, since the tokens
              and the doctrine are the substantial part —{" "}
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
