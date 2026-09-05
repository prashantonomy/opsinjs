import type { Metadata } from "next"
import Link from "next/link"

import {
  CategorySpecimen,
  Container,
  CtaLink,
  Grid,
  ImplementationStatusNotice,
  LinkCard,
  Mono,
  Panel,
  Section,
  StatusSpecimen,
} from "@/app/_shared/ui"
import { getConsidered } from "@/lib/catalogue"
import { builtComponentCount } from "@/lib/registry"
import { agentRoutes, registryRoutes, routes, site } from "@/lib/routes"

export const metadata: Metadata = {
  /* `absolute` because the group layout appends " — opsinjs" to every title
     below it, and this one already opens with the name. */
  title: { absolute: "opsinjs — a design system for consumer health apps" },
  description: site.tagline,
}

/**
 * The landing page.
 *
 * It has one job: tell a developer, in under a minute, what this system decides
 * that a general-purpose one does not — and tell them honestly which part of it
 * is built, which part is a specification, and which part was considered and
 * refused. A landing page that oversells a scaffold costs more trust than it
 * buys attention, and on a health system trust is the entire product. The same
 * is true of one that undersells it: a page still claiming nothing is built the
 * week components start shipping is wrong in the direction that costs a reader
 * the working code they came for. Which is why the counts on this page are read
 * from `builtComponentCount()` rather than typed: a sentence that names a number
 * is a sentence that can be caught being wrong, and the fix is to stop typing
 * the number rather than to remember to update it.
 *
 * Every specimen below renders from the live token layer. Nothing on this page
 * has a colour, a duration or an easing curve typed into it: the status ladder,
 * the material ladder and the motion demonstration all read CSS custom
 * properties that `scripts/build-tokens.mts` writes from `tokens/*.json`. That
 * is not a purity exercise — it means the front page cannot quietly disagree
 * with the documentation, which is the failure mode of every design system
 * landing page that ships hand-picked hex values.
 */
export default function HomePage() {
  return (
    <>
      <style>{demoStyles}</style>

      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-border py-16 sm:py-24">
        <Container>
          <p className="mb-4 font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase">
            React · Next.js · consumer and patient-facing health
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            A design system for health apps where the person reading the number
            is the patient.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
            Somebody opens an app and sees that their blood pressure is 148 over
            96, or that their HbA1c has moved from 41 to 46. They are not a
            clinician. They have to decide whether that is nothing, something
            for Tuesday, or a reason to phone somebody now. opsinjs is the set
            of components, tokens and rules for building that screen — and it
            takes positions on colour, wording and precision that a
            general-purpose design system has no basis to take.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <CtaLink href={routes.docs()}>Read the documentation</CtaLink>
            <CtaLink href={routes.docs("components")} variant="secondary">
              Browse the components
            </CtaLink>
            <CtaLink href={routes.playground()} variant="secondary">
              Open the playground
            </CtaLink>
          </div>

          <div className="mt-10 max-w-2xl">
            <ImplementationStatusNotice
              href={routes.docs("project", "state-of-the-system")}
            >
              Nothing is published to npm. opsinjs is distributed the shadcn
              way — registry source copied into your project — and{" "}
              {builtComponentCount()} components are implemented and installable
              that way today. All of them are alpha: the API may change in any
              release without a deprecation cycle, none has been through an
              independent accessibility or clinical review, and none is ready
              for a production health surface. Each page carries intent, when
              not to use it and what to use instead, the clinical contract, the
              API, and the accessibility bar — including what has not been
              measured.
            </ImplementationStatusNotice>
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Differentiator 1 — the colour engine                             */}
      {/* ---------------------------------------------------------------- */}
      <Section
        id="colour"
        title="A colour engine with two axes that never meet"
        lead="Most systems have one colour dimension and overload it. Health data has two genuinely independent ones, and collapsing them is how an app tells somebody their sleep tracking is an emergency."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              Status — the verdict
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Four ordinal levels, high chroma, always carrying a word and a
              shape as well as a colour. Deliberately not{" "}
              <Mono>ok / info / warning / error</Mono>: that vocabulary imports
              a software-failure frame into a clinical one, and
              &ldquo;error&rdquo; is the wrong word for a person&rsquo;s blood
              pressure.
            </p>
            <div className="mt-4">
              <StatusSpecimen />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              Category — the identity
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              What kind of measurement this is. Low chroma on purpose, so that a
              category swatch can never be misread as urgency. Category colours
              are for chart lines, glyphs and section identity — never for the
              surface of something that reports a result.
            </p>
            <div className="mt-4">
              <CategorySpecimen />
            </div>
          </div>
        </div>

        <Panel className="mt-8">
          <p className="text-sm leading-relaxed">
            <strong className="font-medium">The invariant:</strong> an element
            takes its colour from exactly one axis. A tile that is both{" "}
            <em>cardio</em> and <em>urgent</em> gets its category from a glyph
            or a label and its status from the surface — never two competing
            reds. The playground&rsquo;s two-axis lab refuses to render a mixed
            pair and explains why, and the lint rules exist so the refusal
            happens in your editor rather than in review.
          </p>
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link
              className="underline underline-offset-4"
              href={routes.docs("health", "two-colour-axes")}
            >
              The two colour axes
            </Link>
            <Link
              className="underline underline-offset-4"
              href={routes.docs(
                "foundations",
                "colour",
                "how-the-engine-works"
              )}
            >
              How the engine works
            </Link>
            <Link
              className="underline underline-offset-4"
              href={routes.colors()}
            >
              Browse every ramp
            </Link>
            <Link
              className="underline underline-offset-4"
              href={routes.playgroundStatus()}
            >
              Two-axis lab
            </Link>
          </p>
        </Panel>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Differentiator 2 — the material ladder                           */}
      {/* ---------------------------------------------------------------- */}
      <Section
        id="materials"
        title="A material ladder with a floor you can measure"
        lead="Translucency is the default aesthetic of every modern health app, and it is also the most reliable way to fail a contrast check without noticing. Six named rungs, each with a stated minimum scrim, an opaque fallback and a published measurement."
      >
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="opsin-backdrop rounded-lg p-5">
            <ul className="space-y-3">
              {[0, 1, 2, 3, 4, 5].map((rung) => (
                <li
                  key={rung}
                  className="opsin-rung rounded-md px-4 py-3 text-sm"
                  data-material-rung={rung}
                  style={{
                    background: `var(--opsin-material-${rung}-bg)`,
                    backdropFilter: `blur(var(--opsin-material-${rung}-blur))`,
                    WebkitBackdropFilter: `blur(var(--opsin-material-${rung}-blur))`,
                    border: `1px solid var(--opsin-material-${rung}-border)`,
                    boxShadow: `var(--opsin-material-${rung}-shadow)`,
                    color: rung === 5 ? "oklch(0.99 0 0)" : "var(--foreground)",
                  }}
                >
                  <span className="font-mono text-xs opacity-70">
                    rung {rung}
                  </span>
                  <span className="ml-3">{materialRungCaptions[rung]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The backdrop is deliberately hostile — high chroma, hard edges,
              stripes. A ladder demonstrated over a tasteful grey photograph
              proves nothing. Every rung above is drawn from the token layer:
              background, blur radius, border and shadow are all custom
              properties, so what you are looking at is the shipped definition
              rather than an illustration of it.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The rungs are numbered rather than named here on purpose — the
              names, and the rule for choosing between them, belong to the
              Materials documentation, and a specimen should not quietly become
              a second definition.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Under <Mono>prefers-reduced-transparency: reduce</Mono> every
              translucent rung collapses to its opaque fallback and drops its
              blur. Nothing else moves, so the layout is identical with and
              without it. Turn it on in your operating system and reload this
              page — the ladder above will change and nothing will shift.
            </p>
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <Link
                className="underline underline-offset-4"
                href={routes.docs("foundations", "materials", "the-ladder")}
              >
                The ladder
              </Link>
              <Link
                className="underline underline-offset-4"
                href={routes.docs(
                  "foundations",
                  "materials",
                  "the-contrast-floor"
                )}
              >
                The contrast floor
              </Link>
              <Link
                className="underline underline-offset-4"
                href={routes.docs("accessibility", "contrast-conformance")}
              >
                Measured conformance
              </Link>
            </p>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Differentiator 3 — motion tokens                                 */}
      {/* ---------------------------------------------------------------- */}
      <Section
        id="motion"
        title="Motion as tokens, with a degradation you can watch"
        lead="Springs are authored as physical parameters and compiled into CSS linear() easings, so the same curve runs in a plain transition with no animation library in the bundle. Every token declares what it becomes under reduced motion — per token, not as a global kill switch."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <Panel>
            <p className="text-xs font-medium tracking-wide uppercase">
              <Mono>--opsin-ease-spring</Mono>
            </p>
            <div className="opsin-motion-track mt-5">
              <span aria-hidden className="opsin-motion-dot" />
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              The overshoot is the point: a spring settles, it does not arrive.
              If this dot is sitting still, your system is asking for reduced
              motion and this demonstration has correctly stopped asking for
              your attention.
            </p>
          </Panel>

          <div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Motion in a health interface has one prohibition that a general
              system does not:{" "}
              <strong className="font-medium text-foreground">
                urgency is never carried by motion
              </strong>
              . A pulsing badge is unreadable to somebody with vestibular
              sensitivity, invisible in a screenshot sent to a clinician, and
              gone entirely under reduced motion — three ways for the most
              important thing on the screen to disappear.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Under <Mono>prefers-reduced-motion: reduce</Mono> the duration
              tokens collapse to 1ms and the spring flattens to{" "}
              <Mono>linear(0, 1)</Mono>. The state change still happens — an
              element still arrives, it simply arrives immediately. Removing the
              transition entirely is a different bug: it makes interfaces feel
              broken rather than calm.
            </p>
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <Link
                className="underline underline-offset-4"
                href={routes.docs("foundations", "motion", "springs-as-tokens")}
              >
                Springs as tokens
              </Link>
              <Link
                className="underline underline-offset-4"
                href={routes.docs("foundations", "motion", "reduced-motion")}
              >
                Reduced motion
              </Link>
              <Link
                className="underline underline-offset-4"
                href={routes.docs("health", "motion-in-health-ui")}
              >
                Motion in health UI
              </Link>
            </p>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* The vertical                                                      */}
      {/* ---------------------------------------------------------------- */}
      <Section
        id="health"
        title="What it decides for you"
        lead="A design system for a health app is mostly a set of refusals. These are the ones opsinjs makes on your behalf, each written up as a testable rule rather than a principle."
      >
        <Grid cols={3}>
          <LinkCard
            href={routes.docs("health", "reference-ranges")}
            title="“Normal” is a banned word"
          >
            A reading inside a reference range is not normal, and a reading
            outside one is not abnormal — the range is a population statistic,
            not a verdict on a person. The system supplies the wording that says
            what is actually true.
          </LinkCard>
          <LinkCard
            href={routes.docs("health", "alarm-fatigue")}
            title="One urgent surface per screen"
          >
            Escalation has a budget. If everything is urgent then nothing is,
            and the component that finally matters is the one the reader has
            learned to dismiss.
          </LinkCard>
          <LinkCard
            href={routes.docs("health", "numbers-units-precision")}
            title="A number never travels without its unit"
          >
            Precision is a property of the measurement, not of the formatter.
            Rounding rules, significant figures and how many decimals a person
            can act on are all decided once, centrally.
          </LinkCard>
          <LinkCard
            href={routes.docs("health", "unit-systems")}
            title="Unit systems are correctness, not localisation"
          >
            mmol/L against mg/dL, kilograms against stones, Celsius against
            Fahrenheit. Getting this wrong is not an inconvenience for the
            reader; it is a wrong answer delivered confidently.
          </LinkCard>
          <LinkCard
            href={routes.docs("health", "uncertainty-and-staleness")}
            title="“We do not know” is a rendered state"
          >
            Empty, loading, error, stale and partial are defined once for every
            data surface. A three-day-old reading presented as current is a
            safety problem with a spinner in front of it.
          </LinkCard>
          <LinkCard
            href={routes.docs("health", "trends-and-change")}
            title="Direction is separated from valence"
          >
            Up is not good and down is not bad; it depends entirely on the
            measurement. The arrow and the verdict are different tokens because
            they are different facts.
          </LinkCard>
        </Grid>

        <p className="mt-6 text-sm text-muted-foreground">
          <Link
            className="text-foreground underline underline-offset-4"
            href={routes.docs("health")}
          >
            All of the health doctrine
          </Link>{" "}
          — and the honest boundary:{" "}
          <Link
            className="text-foreground underline underline-offset-4"
            href={routes.docs("start", "safety-scope-and-limitations")}
          >
            opsinjs is not a medical device
          </Link>{" "}
          and confers no regulatory status on anything built with it.
        </p>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Honesty                                                           */}
      {/* ---------------------------------------------------------------- */}
      <Section
        id="today"
        title="What is real today"
        lead="Written down rather than implied, because a scaffold that reads like a product is the fastest way to lose a reader permanently."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Panel>
            <h3 className="font-medium">Real and usable now</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li>
                <strong className="font-medium text-foreground">Tokens.</strong>{" "}
                Two colour axes, six material rungs, spring easings, and the
                type, space and shape scales — authored as JSON and compiled
                into the CSS this page is drawn with.
              </li>
              <li>
                <strong className="font-medium text-foreground">
                  Doctrine.
                </strong>{" "}
                Health, accessibility, content and foundations are written
                against those tokens and do not depend on any component
                existing.
              </li>
              <li>
                <strong className="font-medium text-foreground">
                  Measured numbers.
                </strong>{" "}
                Contrast figures, token tables and catalogue rows are generated
                and committed, and CI fails when a checked-in artefact drifts
                from its source.
              </li>
            </ul>
          </Panel>
          <Panel>
            <h3 className="font-medium">Specified, not built</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li>
                <strong className="font-medium text-foreground">
                  Twenty-four components.
                </strong>{" "}
                Each has a page carrying a full specification and a
                machine-readable not-implemented marker. None has an
                implementation.
              </li>
              <li>
                <strong className="font-medium text-foreground">
                  Around thirty more.
                </strong>{" "}
                Considered, recorded in the catalogue, deliberately without a
                page — because a page here has to carry a real specification.
              </li>
              <li>
                <strong className="font-medium text-foreground">
                  No packages.
                </strong>{" "}
                Nothing is published to npm. Any package claiming to be opsinjs
                today is not ours; see{" "}
                <Link
                  className="text-foreground underline underline-offset-4"
                  href={routes.official()}
                >
                  official resources
                </Link>
                .
              </li>
            </ul>
          </Panel>
        </div>

        <p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Link
            className="text-foreground underline underline-offset-4"
            href={routes.docs("project", "roadmap")}
          >
            Roadmap
          </Link>
          <Link
            className="text-foreground underline underline-offset-4"
            href={routes.docs("project", "release-phases")}
          >
            What each status promises
          </Link>
          <Link
            className="text-foreground underline underline-offset-4"
            href={routes.docs("project", "decisions")}
          >
            Architecture decisions
          </Link>
        </p>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Agents                                                            */}
      {/* ---------------------------------------------------------------- */}
      <Section
        id="agents"
        title="Built to be read by assistants, not just by people"
        lead="Most of the code written against a design system this year will be generated. A system that only documents itself for humans is a system that will be used incorrectly at scale."
      >
        <Grid cols={4}>
          <LinkCard href={agentRoutes.llms()} title="llms.txt" meta="curated">
            A curated index with absolute URLs and a status per entry, plus four
            shards so a client can fetch only the health doctrine or only the
            component specifications.
          </LinkCard>
          <LinkCard
            href={routes.docs("agents", "raw-markdown-api")}
            title="Every page as .md"
            meta="processed"
          >
            Append <Mono>.md</Mono> to any documentation URL for the processed
            markdown — JSX resolved into text, not raw MDX an assistant has to
            guess at.
          </LinkCard>
          <LinkCard
            href={registryRoutes.catalog()}
            title="registry.json"
            meta="shadcn spec"
          >
            A shadcn-specification registry, so the standard MCP server and CLI
            work against opsinjs with no bespoke tooling.
          </LinkCard>
          <LinkCard
            href={routes.docs("agents", "rules-for-agents")}
            title="Rules for agents"
            meta="enforced"
          >
            Tokens not hex. Status not colour. Never invent a component. The
            agent skill enforces these on every generation.
          </LinkCard>
        </Grid>

        <Panel className="mt-6">
          <p className="text-sm leading-relaxed">
            <strong className="font-medium">
              The promise that governs all of it:
            </strong>{" "}
            asking this site about a component that does not exist returns a
            definitive answer, never a 404. A 404 is the one response that
            invites an assistant to invent an API and hand it to somebody
            building a screen that shows a person their own test results.
          </p>
        </Panel>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Closing                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-16">
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight">
            Start with the part that is finished.
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            The tokens and the doctrine are the system. The components are the
            part that will take the longest and matter the least, because a
            beautifully-built RangeBar that uses the wrong colour axis is worse
            than no RangeBar at all.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <CtaLink href={routes.docs("start")}>Start here</CtaLink>
            <CtaLink href={routes.docs("health")} variant="secondary">
              Read the health doctrine
            </CtaLink>
            <CtaLink href={routes.colors()} variant="secondary">
              Browse the colour system
            </CtaLink>
          </div>
        </Container>
      </section>
    </>
  )
}

const materialRungCaptions: Record<number, string> = {
  0: "The page itself. Opaque, no border, no shadow.",
  1: "A card. Opaque, bordered, flat.",
  2: "A card that has lifted. Opaque, bordered, with a shadow.",
  3: "The first translucent rung. Light blur, subtle border.",
  4: "A floating overlay. Heavy blur, a stronger shadow.",
  5: "A scrim. Darkens what is behind a modal surface.",
}

/**
 * Styles for the two specimens that cannot be expressed as utility classes: a
 * deliberately hostile backdrop, and a keyframe animation driven by the motion
 * tokens.
 *
 * Every value that belongs to the system is read from a custom property. The
 * literal numbers here are geometry — a track width, a dot size — and geometry
 * is not a token.
 */
const demoStyles = `
.opsin-backdrop {
  background-color: oklch(0.55 0.09 250);
  background-image:
    radial-gradient(closest-side at 18% 20%, oklch(0.84 0.17 85 / 0.95), transparent),
    radial-gradient(closest-side at 82% 26%, oklch(0.62 0.21 25 / 0.9), transparent),
    radial-gradient(closest-side at 38% 88%, oklch(0.74 0.18 152 / 0.9), transparent),
    repeating-linear-gradient(115deg, oklch(1 0 0 / 0.18) 0 10px, transparent 10px 24px);
}

.opsin-motion-track {
  position: relative;
  width: 240px;
  max-width: 100%;
  height: 24px;
  border-radius: 9999px;
  background: var(--muted);
}

.opsin-motion-dot {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  background: var(--opsin-status-steady-line);
}

@media (prefers-reduced-motion: no-preference) {
  .opsin-motion-dot {
    animation: opsin-travel 4s var(--opsin-ease-spring) infinite;
  }
}

@keyframes opsin-travel {
  0%, 12% { transform: translateX(0); }
  50%, 62% { transform: translateX(216px); }
  100% { transform: translateX(0); }
}
`
