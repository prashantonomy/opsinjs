import { DoseTracker } from "@opsinjs/react"

/**
 * The instant the demo is measured against.
 *
 * A literal rather than a clock read, in the same spirit as every number in an
 * opsinjs example being obviously synthetic (ADR 0012) and for the reason
 * RelativeTime's own demo gives: `now` is required of every caller, and a fixed
 * instant is what makes this deterministic, so the demo says the same thing every
 * time the page is built rather than drifting its rows out of the phrases they
 * exist to show.
 */
const DEMO_NOW = "2026-03-14T11:12:00+00:00"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows three states in
 * one log: a taken dose, a missed one and a skipped one, each with its word and
 * its distinct shape. The one thing worth seeing at a glance is that the missed
 * dose is not painted as urgent. Read the whole list in greyscale and the three
 * states are still three states, told by their words and their shapes, with no
 * colour doing the work and no verdict on any of them.
 *
 * The fourth state, `scheduled`, is not shown here on purpose. A scheduled dose
 * sits at a future instant, RelativeTime renders the exact date rather than a
 * "... ago" phrase for anything that has not happened yet, and its "Recorded"
 * prefix reads oddly over a dose still to come. It is a supported state named in
 * the anatomy and the API prose, demonstrated by no preview opsinjs ships, in the
 * same spirit as RelativeTime documenting a state its own demo does not draw.
 *
 * Every medicine name is a plain placeholder and every time is a fixed synthetic
 * instant in the past (ADR 0012): no real drug, no real dose, nothing a reader
 * could mistake for their own record.
 */
export default function DoseTrackerDemo() {
  return (
    <DoseTracker
      label="Example doses"
      now={DEMO_NOW}
      entries={[
        { name: "Morning tablet", time: "2026-03-14T08:00:00+00:00", state: "taken" },
        {
          name: "Afternoon tablet",
          time: "2026-03-14T09:30:00+00:00",
          state: "missed",
          note: "Marked by you",
        },
        { name: "Evening drops", time: "2026-03-13T21:00:00+00:00", state: "skipped" },
      ]}
    />
  )
}
