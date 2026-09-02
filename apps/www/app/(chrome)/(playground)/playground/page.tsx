import type { Metadata } from "next"
import Link from "next/link"

import { Container, Grid, PageHeader, Panel, Prose } from "@/app/_shared/ui"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Playground",
  description:
    "Three tools: derive a theme from a brand colour, check any colour pair against APCA and WCAG 2.2, and see why the two colour axes may never be combined on one element.",
}

/**
 * `/playground` — the index of the three tools.
 */
export default function PlaygroundPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tools"
        title="Playground"
        lead="Three instruments that answer questions the documentation can only describe. All three run against the same colour implementation CI uses, so an answer here is the answer the build gives."
      />

      <Container className="py-10">
        <Grid cols={3}>
          <ToolCard
            href={routes.playgroundTheme()}
            title="Theme generator"
            summary="A brand colour in, a lightness ramp out, with every step checked against the contrast floor before you commit to it."
            detail="Most brand colours cannot survive being used as a text colour, and finding that out during an accessibility review is expensive. This shows you where the ramp fails while the decision is still cheap."
          />
          <ToolCard
            href={routes.playgroundContrast()}
            title="Contrast oracle"
            summary="Any two colours, measured with APCA Lc and the WCAG 2.2 ratio side by side, with the verdict against the opsinjs floor."
            detail="Both numbers, always, because they disagree and the disagreement is informative: WCAG 2.2 is what a procurement questionnaire asks about and APCA is the better predictor of whether text is actually readable."
          />
          <ToolCard
            href={routes.playgroundStatus()}
            title="Two-axis lab"
            summary="Combine a measurement category with a clinical status, and watch the lab refuse to render the pair that would be unsafe."
            detail="The most opinionated artefact on this site. It is easier to understand a rule you have tried to break than one you have read, so this one lets you try."
          />
        </Grid>

        <section className="mt-14">
          <h2 className="text-lg font-semibold tracking-tight">
            Why there are three and not six
          </h2>
          <Prose className="mt-3">
            <p>
              An earlier plan had six: these three plus a motion editor, a
              material composer and a type-scale explorer. Three shipped and
              three were cut, because a navigation item pointing at a tool that
              half works costs more than a missing tool does — a reader who
              opens an empty instrument concludes something about the rest of
              the site, and they are usually right to.
            </p>
            <p>
              The three that survived share a property: each answers a question
              with a <em>number or a refusal</em>, not with an opinion. Motion,
              materials and type are better served by specimens embedded in the
              pages that explain them, where the surrounding prose supplies the
              judgement a slider cannot.{" "}
              <Link href={routes.docs("project", "decisions")}>
                The decision log
              </Link>{" "}
              records the cut.
            </p>
          </Prose>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold tracking-tight">
            What these tools will not do
          </h2>
          <Panel className="mt-3">
            <ul className="space-y-3 text-sm leading-relaxed">
              <li>
                <strong className="font-medium">Guess a number.</strong> Every
                measurement comes from the contrast service. If it does not
                respond, the readout says so and stays empty. A plausible figure
                invented in the browser is the one thing a contrast tool must
                never produce, because it will end up in a design review.
              </li>
              <li>
                <strong className="font-medium">
                  Certify anything as accessible.
                </strong>{" "}
                A passing contrast ratio is one criterion out of many. It says
                nothing about focus order, target size, announcements or whether
                the sentence beside the number makes sense to the person reading
                it.
              </li>
              <li>
                <strong className="font-medium">
                  Publish numbers for your theme.
                </strong>{" "}
                The conformance figures on this site describe the shipped
                presets. Change a token and they no longer describe you — which
                is what{" "}
                <Link
                  className="text-foreground underline underline-offset-4"
                  href={routes.docs("theming", "validating-your-theme")}
                >
                  validating your theme
                </Link>{" "}
                is for.
              </li>
            </ul>
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
  detail,
}: {
  href: string
  title: string
  summary: string
  detail: string
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <h2 className="font-medium">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed">{summary}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {detail}
      </p>
    </Link>
  )
}
