import { MetricTile } from "@opsinjs/react"

/**
 * The instant the demo is measured against.
 *
 * A literal rather than a clock read. `now` is required of every caller, so a
 * demo that quietly read the clock would be documenting a different component.
 * A fixed instant is what makes this deterministic, so one screenshot is
 * comparable with the last.
 */
const DEMO_NOW = "2026-04-06T09:00:00+00:00"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows two tiles
 * because the pair is the thing worth seeing: one with a reading and one with
 * none at all. The second is the state most often got wrong. An absent reading
 * is not a reading of zero, so it says so in words rather than printing a 0 a
 * reader would take for a measurement somebody took.
 *
 * NEITHER TILE CARRIES A STALENESS NUMBER OF ITS OWN. `staleAfterHours` is
 * absent here on purpose: a number in this public demo is a staleness default a
 * developer copies verbatim into their own product, and no comment beside it
 * undoes that. The number is the part that gets copied. The cost is stated
 * rather than hidden: the tile's one visual state is demonstrated by the
 * example beside this component's page and not by the demo, and the page says
 * so in the same words.
 *
 * The measurements are fictional and the unit is one nobody holds a range for
 * (ADR 0012). No number here is one a reader could take for their own.
 */
export default function MetricTileDemo() {
  return (
    // Both tiles fix `locale="en-GB"` so this reference capture spells the date
    // day-first, the order the content page mandates. The prop is optional and a
    // product passes its own BCP 47 tag; it is set here only so the screenshot
    // does not teach a month-first order the docs reject.
    <div className="grid w-full max-w-md gap-opsin-3 sm:grid-cols-2">
      <MetricTile
        label="First example measurement"
        value={14}
        unit="steps"
        precision={0}
        category="activity"
        status="steady"
        measuredAt="2026-04-06T07:30:00+00:00"
        now={DEMO_NOW}
        locale="en-GB"
        href="#example"
      />
      <MetricTile
        label="Second example measurement"
        value={null}
        unit="steps"
        precision={0}
        category="activity"
        measuredAt={null}
        now={DEMO_NOW}
        locale="en-GB"
        href="#example"
      />
    </div>
  )
}
