import type { Metadata } from "next"
import Link from "next/link"

import {
  Container,
  CtaLink,
  FactTable,
  ImplementationStatusNotice,
  Mono,
  Panel,
  Section,
  StatusSpecimen,
} from "@/app/_shared/ui"
import { getConsidered } from "@/lib/catalogue"
import { builtComponentCount } from "@/lib/registry"
import { agentRoutes, registryRoutes, routes, site } from "@/lib/routes"

export const metadata: Metadata = {
  /* `absolute` because the group layout appends " · opsinjs" to every title
     below it, and this one already opens with the name. */
  title: { absolute: "opsinjs is a design system for consumer health apps" },
  description: site.tagline,
}

/**
 * The landing page.
 *
 * It tells a developer what this system decides that a general-purpose one does
 * not, and which part of it is built. The counts are read from
 * `builtComponentCount()` and `getConsidered().length` rather than typed,
 * because a typed number is a sentence that goes quietly wrong.
 *
 * DELIBERATELY SHORT, AND MOSTLY TABLES. The substance is a set of parallel
 * decisions, and a table varies where the facts vary and nowhere else. Four
 * cuts got it here from roughly two and a half thousand words, and each is a
 * rule worth keeping when this page grows again:
 *
 *   - A column repeating one value down every row is a sentence, not a column.
 *     The material ladder lost two that way.
 *   - Prose restating the table beside it is deleted, not rewritten. Six cards
 *     under "What it decides for you" went for that reason.
 *   - Two sections arguing the same point merge. Materials and motion share one
 *     paragraph about degradation, so they share one section.
 *   - A closing section whose links repeat the hero's is navigation, not copy.
 *
 * Every specimen renders from the live token layer, so the front page cannot
 * quietly disagree with the documentation. The only literal colours are the
 * deliberately hostile demo backdrop at the foot of this file, which is an
 * adversarial test surface rather than a system value.
 *
 * The figures in the tables are transcribed from `tokens/material.json` and
 * `tokens/motion.json`. Nothing diffs a JSX table against its source, so a
 * change to either file has to be mirrored here by hand.
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
            A design system for consumer and patient-facing health products
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
            opsinjs is the components, tokens and rules for the screen where a
            patient reads their own result: a blood pressure of 148 over 96, or
            an HbA1c that has moved from 41 to 46. The reader is not a clinician
            and has to decide whether that is nothing, something for Tuesday, or
            a reason to phone somebody.
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
              way, and {builtComponentCount()} components are installable as
              source. All are alpha: the API may change in any release without a
              deprecation cycle, none has had an independent accessibility or
              clinical review, and none is production-ready.
            </ImplementationStatusNotice>
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* The colour axes                                                  */}
      {/* ---------------------------------------------------------------- */}
      <Section
        id="colour"
        title="The two colour axes"
        lead="Health data carries two independent colour dimensions. Collapsing them is how an app tells somebody their sleep tracking is an emergency."
      >
        <FactTable
          columns={[
            "Axis",
            "Question it answers",
            "Chroma",
            "Carries",
            "Never carries",
            "Assigned by",
          ]}
          rows={[
            [
              "Status",
              "How does this sit against what was expected?",
              "High",
              "A result surface, badge or border",
              "Chart series, section headers",
              "The product, from thresholds it owns",
            ],
            [
              "Category",
              "What kind of measurement is this?",
              "Low",
              "Chart lines, glyphs, section identity",
              "Anything reporting a result",
              "The metric, fixed for good",
            ],
          ]}
        />

        <div className="mt-8">
          <StatusSpecimen />
        </div>

        <Panel className="mt-8">
          <p className="text-sm leading-relaxed">
            An element takes its colour from one axis only, and status is never
            carried by colour alone: every level renders a colour, an icon and a
            word. The vocabulary is{" "}
            <Mono>steady / watch / attention / urgent</Mono>, not{" "}
            <Mono>ok / info / warning / error</Mono>, because
            &ldquo;error&rdquo; is the wrong frame for a blood pressure.
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
      {/* Material and motion                                              */}
      {/* ---------------------------------------------------------------- */}
      <Section
        id="tokens"
        title="Material and motion tokens"
        lead="Six material rungs each answer a different question about what is behind a surface. Four springs are compiled from physical parameters into CSS linear() easings, so the curve runs with no animation library. Settle durations are measured, not chosen."
      >
        <FactTable
          columns={[
            "Rung",
            "Question it answers",
            "Surface",
            "Blur",
            "Minimum scrim",
          ]}
          rows={[
            [
              "canvas",
              "The page itself?",
              "Opaque, no border or shadow",
              "None",
              "None",
            ],
            [
              "card",
              "A distinct piece of content?",
              "Opaque, bordered, flat",
              "None",
              "None",
            ],
            [
              "raised",
              "Above the page, not covering it?",
              "Opaque, bordered, shadowed",
              "None",
              "None",
            ],
            [
              "sheet",
              "Covering the page, still visible?",
              "Translucent, subtle border",
              "20px",
              "0.82",
            ],
            [
              "overlay",
              "Chrome floating over content?",
              "Translucent, strong shadow",
              "28px",
              "0.74",
            ],
            [
              "scrim",
              "Everything behind unusable?",
              "Translucent, no border",
              "2px",
              "0.44",
            ],
          ]}
        />

        <FactTable
          className="mt-6"
          columns={[
            "Token",
            "Settles",
            "Overshoot",
            "Use",
            "Under reduced motion",
          ]}
          rows={[
            [
              <Mono key="s">spring-snap</Mono>,
              "283ms",
              "1.52%",
              "Direct manipulation by the reader",
              "Snaps to the end state",
            ],
            [
              <Mono key="t">spring-settle</Mono>,
              "382ms",
              "0.88%",
              "Popovers, tooltips, menus",
              "A 100ms cross-fade",
            ],
            [
              <Mono key="c">spring-calm</Mono>,
              "550ms",
              "None",
              "A health value changing on screen",
              "Renders the final value at once",
            ],
            [
              <Mono key="h">spring-sheet</Mono>,
              "483ms",
              "None",
              "Sheets and dialogs travelling far",
              "A 120ms cross-fade in place",
            ],
          ]}
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
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
                  <span className="ml-3">{materialRungNames[rung]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="opsin-motion-track">
              <span aria-hidden className="opsin-motion-dot" />
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              The backdrop is deliberately hostile, because a ladder shown over
              a tasteful grey photograph proves nothing. Every rung and the
              curve are drawn from the token layer. A health value never sits on
              a translucent rung, and neither overshooting spring may animate
              one, because for one frame it shows a number that is untrue.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              <strong className="font-medium text-foreground">
                Urgency is never carried by motion.
              </strong>{" "}
              A pulsing badge is unreadable with vestibular sensitivity, absent
              from a screenshot sent to a clinician, and gone under reduced
              motion. Under <Mono>prefers-reduced-transparency</Mono> each
              translucent rung swaps to its opaque fallback; under{" "}
              <Mono>prefers-reduced-motion</Mono> durations collapse to 1ms and
              the spring flattens to <Mono>linear(0, 1)</Mono>.
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
                href={routes.docs("health", "motion-in-health-ui")}
              >
                Motion in health UI
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
      {/* What it decides                                                   */}
      {/* ---------------------------------------------------------------- */}
      <Section
        id="health"
        title="What it decides for you"
        lead="Six refusals the system applies on your behalf. It fixes the presentation, never the clinical content, and every row names who owns the rest."
      >
        <FactTable
          columns={[
            "Decision",
            "What opsinjs fixes",
            "What it refuses to decide",
            "Who owns the refused part",
          ]}
          rows={[
            [
              <Link
                key="r"
                className="underline underline-offset-4"
                href={routes.docs("health", "reference-ranges")}
              >
                Reference ranges
              </Link>,
              "The word “normal” is banned from any result string",
              "Which values the range spans",
              "The laboratory or clinical team",
            ],
            [
              <Link
                key="a"
                className="underline underline-offset-4"
                href={routes.docs("health", "alarm-fatigue")}
              >
                Escalation budget
              </Link>,
              "One urgent surface per screen",
              "Which reading earns it",
              "The product, against thresholds it owns",
            ],
            [
              <Link
                key="n"
                className="underline underline-offset-4"
                href={routes.docs("health", "numbers-units-precision")}
              >
                Numbers and precision
              </Link>,
              "Rounding, significant figures, never a bare number",
              "How many decimals are justified",
              "The device or assay",
            ],
            [
              <Link
                key="u"
                className="underline underline-offset-4"
                href={routes.docs("health", "unit-systems")}
              >
                Unit systems
              </Link>,
              "mmol/L against mg/dL, kilograms against stones, Celsius against Fahrenheit",
              "Which system this reader expects",
              "The product, from locale and preference",
            ],
            [
              <Link
                key="s"
                className="underline underline-offset-4"
                href={routes.docs("health", "uncertainty-and-staleness")}
              >
                Missing and stale data
              </Link>,
              "Empty, loading, error, stale, partial, defined once",
              "When a reading becomes stale",
              "The product; staleness depends on the metric",
            ],
            [
              <Link
                key="t"
                className="underline underline-offset-4"
                href={routes.docs("health", "trends-and-change")}
              >
                Direction and valence
              </Link>,
              "The arrow and the verdict are separate tokens",
              "Which direction is favourable",
              "The product and its clinical lead",
            ],
          ]}
        />

        <p className="mt-6 text-sm text-muted-foreground">
          <Link
            className="text-foreground underline underline-offset-4"
            href={routes.docs("health")}
          >
            All of the health doctrine
          </Link>{" "}
          sets out the rest.{" "}
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
      {/* Implementation status                                             */}
      {/* ---------------------------------------------------------------- */}
      <Section
        id="today"
        title="Implementation status"
        lead="The counts are read at build time from the registry and the catalogue, never typed."
      >
        <FactTable
          columns={["Thing", "Count", "What exists", "What does not"]}
          rows={[
            [
              "Components",
              String(builtComponentCount()),
              "Rendered live, installable as source",
              "A stable API, an independent review, a package",
            ],
            [
              "Considered components",
              String(getConsidered().length),
              "An address giving the refusal and alternative",
              "An implementation, and none is intended",
            ],
            [
              "Screens",
              "5",
              "Results, trends, daily log, onboarding, consent",
              "An implementation of any of the five",
            ],
            [
              "Token layers",
              "6",
              "Colour, material, motion, type, space, shape",
              "Nothing; this is the finished part",
            ],
            [
              "Doctrine pillars",
              "4",
              "Health, accessibility, content, foundations",
              "External clinical review",
            ],
            [
              "Generated artefacts",
              "9",
              "Contrast figures, token tables, catalogue rows",
              "Measured contrast for every pair",
            ],
          ]}
        />

        <p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Link
            className="text-foreground underline underline-offset-4"
            href={routes.official()}
          >
            Official resources
          </Link>
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
        </p>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Machine-readable surfaces                                         */}
      {/* ---------------------------------------------------------------- */}
      <Section
        id="agents"
        title="Machine-readable surfaces"
        lead="Every page and component is published at a stable address in a standard format."
      >
        <FactTable
          columns={["Surface", "Address", "Format", "Intended consumer"]}
          rows={[
            [
              "Curated index",
              <MonoLink key="a" href={agentRoutes.llms()} />,
              "Plain text",
              "An assistant orienting in the corpus",
            ],
            [
              "Full corpus",
              <MonoLink key="b" href={agentRoutes.llmsFull()} />,
              "Plain text",
              "A client with room for every page",
            ],
            [
              "Health shard",
              <MonoLink key="c" href={agentRoutes.llmsHealth()} />,
              "Plain text",
              "A client needing the doctrine alone",
            ],
            [
              <Link
                key="d"
                className="underline underline-offset-4"
                href={routes.docs("agents", "raw-markdown-api")}
              >
                Processed markdown
              </Link>,
              <Mono key="d2">.md</Mono>,
              "Markdown",
              "A client fetching one known page",
            ],
            [
              "Registry catalogue",
              <MonoLink key="e" href={registryRoutes.catalog()} />,
              "shadcn registry specification",
              "The standard shadcn CLI and MCP server",
            ],
            [
              "Registry index",
              <MonoLink key="f" href={registryRoutes.index()} />,
              "JSON",
              "A tool resolving an id in bulk",
            ],
            [
              "Offline bundle",
              <MonoLink key="g" href={registryRoutes.docsBundle()} />,
              "JSON",
              "An agent working offline",
            ],
          ]}
        />

        <Panel className="mt-6">
          <p className="text-sm leading-relaxed">
            Asking about a component that does not exist returns a definitive
            answer rather than a 404, because a 404 invites an assistant to
            invent an API for a screen showing somebody their own results.{" "}
            <Link
              className="underline underline-offset-4"
              href={routes.docs("agents", "rules-for-agents")}
            >
              Rules for agents
            </Link>{" "}
            are enforced on every generation.
          </p>
        </Panel>
      </Section>
    </>
  )
}

/**
 * A machine surface's address, rendered as monospace and reachable.
 *
 * These are static artefacts rather than Next routes, so they take a plain
 * anchor: routing them through `next/link` would buy a client-side transition
 * to a file the router cannot render.
 */
function MonoLink({ href }: { href: string }) {
  return (
    <a className="underline underline-offset-4" href={href}>
      <Mono>{href}</Mono>
    </a>
  )
}

/**
 * The rung names, for the specimen's row labels. What each rung is made of is
 * in the table above; a specimen label names the rung and stops, so that it
 * cannot quietly become a second definition.
 */
const materialRungNames: Record<number, string> = {
  0: "canvas",
  1: "card",
  2: "raised",
  3: "sheet",
  4: "overlay",
  5: "scrim",
}

/**
 * Styles for the two specimens that cannot be expressed as utility classes: a
 * deliberately hostile backdrop, and a keyframe animation driven by the motion
 * tokens.
 *
 * Every value that belongs to the system is read from a custom property. The
 * literal numbers here are geometry such as a track width and a dot size, and
 * geometry is not a token. The backdrop's colours are the one deliberate
 * exception on this page: they are an adversarial test surface rather than a
 * system value, and drawing them from the palette would defeat the purpose.
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
