import type { Metadata } from "next"
import Link from "next/link"

import {
  Container,
  CtaLink,
  ImplementationStatusNotice,
  Mono,
  StatusSpecimen,
} from "@/app/_shared/ui"
import { getConsidered } from "@/lib/catalogue"
import { builtComponentCount } from "@/lib/registry"
import { routes, site } from "@/lib/routes"

export const metadata: Metadata = {
  /* `absolute` because the group layout appends " · opsinjs" to every title
     below it, and this one already opens with the name. */
  title: { absolute: "opsinjs is a design system for consumer health apps" },
  description: site.tagline,
}

/**
 * The landing page.
 *
 * SHORT ON PURPOSE, AND IT MUST STAY SHORT. It says what the system is for,
 * admits what is not built, shows the one idea that distinguishes it, and hands
 * the reader to the documentation. Nothing else belongs here.
 *
 * This page previously carried five fact tables covering the colour axes, the
 * material ladder, the motion springs, the health refusals and the machine
 * surfaces. Each of those has a canonical page under `content/docs/`, and the
 * copies here were a second definition that nothing diffed against the first.
 * The material and motion figures in particular were transcribed by hand from
 * `tokens/material.json` and `tokens/motion.json`, so they could go wrong in
 * silence. If a fact wants a table, it wants a documentation page. The rules
 * that got the page to this length:
 *
 *   - A table whose cells are mostly links is navigation. The footer and the
 *     sidebar already do navigation, and they do it on every route.
 *   - A specimen that demonstrates a foundation belongs on that foundation's
 *     page, where the prose around it is the definition rather than a summary.
 *   - A number typed into JSX is a claim with no source. The two counts that
 *     survive are read from the registry and the catalogue at build time.
 *
 * `<StatusSpecimen />` stays because the two colour axes are the one claim that
 * distinguishes this system from a general-purpose one, and it renders straight
 * out of the live token layer, so the front page cannot quietly disagree with
 * the documentation.
 */
export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-16 sm:py-24">
        <Container>
          <p className="mb-4 font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase">
            Design system · React and Next.js
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            A design system for consumer and patient-facing health products
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
            The components, tokens and writing rules for showing someone their
            own health readings. The people reading them are not doctors. They
            have to work out on their own whether a blood pressure of 148 over
            96, or an HbA1c that has gone from 41 to 46, means they should do
            something.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <CtaLink href={routes.docs()}>Read the documentation</CtaLink>
            <CtaLink href={routes.docs("components")} variant="secondary">
              Browse the components
            </CtaLink>
          </div>

          <div className="mt-10 max-w-2xl">
            <ImplementationStatusNotice
              href={routes.docs("project", "state-of-the-system")}
            >
              opsinjs is not on npm. You install its {builtComponentCount()}{" "}
              components as source from the shadcn registry this site serves.
              All of them are alpha. The API can change in any release with no
              warning, none of them has had an independent accessibility or
              clinical review, and none of them is ready for a real health
              product.
            </ImplementationStatusNotice>
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* The one idea, shown rather than argued                            */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-border py-16">
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight">
            Status is never carried by colour alone
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Every level shows a colour, a shape and a word at the same time. The
            four words are <Mono>steady / watch / attention / urgent</Mono>, not{" "}
            <Mono>ok / info / warning / error</Mono>. A reading outside its
            range is not an error to fix. Status and category are two separate
            things, and they never share an element.
          </p>

          <div className="mt-8">
            <StatusSpecimen />
          </div>

          <p className="mt-6 text-sm">
            <Link
              className="underline underline-offset-4"
              href={routes.docs("health", "two-colour-axes")}
            >
              The two colour axes
            </Link>
          </p>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Counts                                                            */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-border py-12">
        <Container>
          <dl className="flex flex-wrap gap-x-12 gap-y-6">
            <Count label="Components built" value={builtComponentCount()} />
            <Count
              label="Considered, not built"
              value={getConsidered().length}
            />
            <Count label="Token layers" value={6} />
          </dl>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The first two numbers come from the registry and the catalogue at
            build time.{" "}
            <Link
              className="text-foreground underline underline-offset-4"
              href={routes.docs("start", "safety-scope-and-limitations")}
            >
              opsinjs is not a medical device
            </Link>{" "}
            and gives no regulatory status to anything you build with it.
          </p>
        </Container>
      </section>
    </>
  )
}

/**
 * One build-time count. The number is the point, so it is set at display size
 * and the label sits under it rather than beside it.
 */
function Count({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd className="text-3xl font-semibold tabular-nums">{value}</dd>
      <dt className="mt-1 text-sm text-muted-foreground">{label}</dt>
    </div>
  )
}
