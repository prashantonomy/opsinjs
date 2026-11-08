import { TimelineEntry } from "@opsinjs/react"

/**
 * The instant the demo is measured against.
 *
 * A literal rather than a clock read, for the reason RelativeTime's own demo
 * gives: `now` is required of every caller, and a fixed instant makes this
 * deterministic and every number in it obviously synthetic (ADR 0012).
 */
const DEMO_NOW = "2026-03-14T11:12:00+00:00"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code. It shows the one distinction worth seeing: three
 * entries share one rail with the connector stopping at the last, and the
 * middle one carries a status on a nested pill while the entry, its marker and
 * its rail stay neutral.
 *
 * `now` is a fixed instant so the demo says the same thing every render, and
 * every title and body is obviously synthetic (ADR 0012): no reading, no
 * number, no measurement a reader could mistake for their own.
 */
export default function TimelineEntryDemo() {
  return (
    <ol className="m-0 flex w-full max-w-md list-none flex-col p-0">
      <TimelineEntry when="2026-03-14T09:30:00+00:00" now={DEMO_NOW} title="Example note added">
        Written by the example app.
      </TimelineEntry>
      <TimelineEntry
        when="2026-03-12T18:00:00+00:00"
        now={DEMO_NOW}
        title="Example reminder set"
        status="watch"
      >
        Set by the example app.
      </TimelineEntry>
      <TimelineEntry
        when="2026-03-02T09:00:00+00:00"
        now={DEMO_NOW}
        title="Example entry recorded"
        isLast
      >
        Recorded by the example app.
      </TimelineEntry>
    </ol>
  )
}
