/**
 * The first assembled specimen: a whole results screen, built from parts that
 * already ship, so that the three screen-level checks the docs insist on have
 * something opsinjs itself rendered to run against. Until this file existed the
 * contact sheet held twenty-four isolated widgets and not one composition of
 * more than two, so a product team judging whether the parts form a system had
 * to take it on faith. This is the faith made concrete.
 *
 * WHAT IS ASSEMBLED, AND WHY THESE. Seven components meet here: Surface is the
 * page ground; ResultCard is the answer; Term expands the one unfamiliar word in
 * the meaning; CareCard is the single next step; RelativeTime under the
 * provenance carries the measurement instant as an absolute date on its own,
 * rendered at every age so it never restates the relative phrase the ResultCard
 * already shows; DisclaimerNote
 * closes the surface; and Card is present because CareCard is built on it, which
 * is the honest way it enters a screen rather than lifting a third surface of its
 * own. Every one is at beta today. source-citation has since been built out too,
 * yet provenance stays a plain paragraph here, the way the shipped ResultCard
 * demo already renders it.
 *
 * THE THREE RULES THIS SCREEN EXISTS TO DEMONSTRATE, kept while it was built.
 *
 * One status pill, or none. Exactly one status is stated on the whole screen,
 * the ResultCard's, and it is a StatusPill carrying the word. The CareCard
 * carries no status: an action with a verdict beside it would be a second pill
 * competing with the first. Nothing else on the screen stands in a status colour.
 *
 * Status never colours the card, the band or the marker. The ResultCard tints
 * only its title, and it tints it from the category axis (this is a labs
 * reading), never from the status. The band is one continuous shape with no
 * coloured zones, and the marker is told apart by shape rather than by a fill.
 *
 * The two colour axes never meet on one element. Category answers what the
 * reading is about and lives on the title; status answers how urgent it is and
 * lives in the pill. They are different elements, and no element here wears both.
 *
 * READING ORDER IS THE THIRD CHECK, and it is what a screen reader meets: the
 * result first, then what it means, then what happens next, then where it came
 * from, then the boundary. The heading outline read on its own is a usable
 * summary: the test at H1, then the result, the meaning, the action and the
 * provenance at H2 in that order.
 *
 * EVERY NUMBER, LABEL, UNIT AND DATE IS EXAMPLE DATA, in the voice the other
 * demos use. The reading is fourteen in a made-up context, the range cites
 * EXAMPLE_SOURCE and no laboratory, and the instants are fixed so the screen
 * says the same thing every time it is built. ADR 0012 forbids this file from
 * shipping a threshold, a plausibility bound, a staleness default, an emergency
 * number or default disclaimer wording, so the range and the status arrive as
 * example constants that read as examples, never as a clinical default this file
 * owns.
 */

import { EXAMPLE_SOURCE, type ClinicalStatus, type HealthCategory } from "@/lib/opsinjs"
import { CareCard } from "@/registry/base-lyra/ui/care-card"
import { DisclaimerNote } from "@/registry/base-lyra/ui/disclaimer-note"
import { RelativeTime } from "@/registry/base-lyra/ui/relative-time"
import { ResultCard } from "@/registry/base-lyra/ui/result-card"
import { Surface } from "@/registry/base-lyra/ui/surface"
import { Term, TermGlossaryProvider, type GlossaryEntry } from "@/registry/base-lyra/ui/term"

/** The instant the whole screen is measured against. Read once, passed to each part. */
const NOW = "2026-04-06T09:00:00+00:00"

/** When the example reading was taken. Measurement, never sync or retrieval. */
const MEASURED_AT = "2026-04-05T08:12:00+00:00"

/** The category the reading is about. It tints the title and nothing else. */
const CATEGORY: HealthCategory = "labs"

/**
 * The level of attention a product's own rule assigned to this example result.
 * It is an example constant rather than a value this screen derived, because the
 * status axis is never computed from the number and the range.
 */
const STATUS: ClinicalStatus = "steady"

/**
 * One glossary entry for the one word the meaning leans on. It describes what a
 * reference range is; it states no threshold and names no population, so opsinjs
 * asserts nothing clinical by carrying it.
 */
const GLOSSARY: readonly GlossaryEntry[] = [
  {
    id: "reference-range",
    word: "reference range",
    plain: "the range a measurement of this kind is usually compared against, set by whoever owns the test",
  },
]

export default function ResultsScreen() {
  return (
    <Surface
      rung="canvas"
      className="min-h-full w-full rounded-opsin-lg p-opsin-6"
    >
      <div className="mx-auto flex w-full max-w-xl flex-col gap-opsin-6">
        <header className="flex flex-col gap-opsin-2">
          {/* Hand-rolled anchor with the target floor and wrapping copied from
              disclaimer-note.tsx, so this back control is no smaller than any
              other link in the kit. Once D4's Link lands in wave 3 this becomes
              <Link emphasis="secondary" href="..."> and the class string goes;
              that migration is recorded in crossUnitNotes because nothing in the
              schedule currently picks up this file. */}
          <a
            href="#example-results-list"
            className="inline-flex min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem) max-w-full items-center justify-self-start wrap-anywhere text-opsin-subheadline text-muted-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Back to example results
          </a>
          <h1 className="m-0 text-opsin-title1 text-foreground">Example measurement</h1>
        </header>

        <ResultCard
          title="Your example result"
          titleLevel={2}
          value={14}
          unit="mg/dL"
          precision={0}
          locale="en-GB"
          measuredAt={MEASURED_AT}
          now={NOW}
          range={{
            low: 10,
            high: 20,
            source: EXAMPLE_SOURCE,
            asOf: "2026-01-05T00:00:00+00:00",
          }}
          status={STATUS}
          category={CATEGORY}
          meaning="This example reading sits inside the example range this test is compared against. It is one measurement at one moment, and on its own it is not a trend."
        />

        <section className="flex flex-col gap-opsin-3">
          <h2 className="m-0 text-opsin-headline text-foreground">
            What this example measurement means
          </h2>
          <TermGlossaryProvider glossary={GLOSSARY}>
            <p className="m-0 max-w-(--opsin-measure-comfortable,66ch) text-opsin-body text-foreground">
              A <Term id="reference-range" /> is set by whoever owns the test, not
              by this app. Where a reading sits inside that range describes a
              position rather than a verdict, and it does not say whether anything
              needs to change. Only the product that owns the test can say that,
              and here it has, in the step below.
            </p>
          </TermGlossaryProvider>
        </section>

        <CareCard
          heading="Book a repeat example test"
          headingLevel={2}
          urgency="this-week"
          attribution="An example reminder from this app"
          reason="This example result is due to be measured again."
          actions={[
            { label: "Book a repeat", href: "#example", recommended: true },
          ]}
        />

        <section className="flex flex-col gap-opsin-2">
          <h2 className="m-0 text-opsin-headline text-foreground">
            Where this example reading came from
          </h2>
          <p className="m-0 max-w-(--opsin-measure-comfortable,66ch) text-opsin-body text-foreground">
            Example provenance names who measured it, with what device or assay,
            and whose interval it was compared against. The screen states this so
            that not every number reads as equally authoritative.
          </p>
          <RelativeTime
            event="measured"
            at={MEASURED_AT}
            now={NOW}
            absoluteAfterDays={0}
            locale="en-GB"
          />
        </section>

        <DisclaimerNote placement="footer">
          Placeholder wording, for layout only. This is where the product that
          installs these components writes its own two sentences, and opsinjs
          ships none of them.
        </DisclaimerNote>
      </div>
    </Surface>
  )
}
