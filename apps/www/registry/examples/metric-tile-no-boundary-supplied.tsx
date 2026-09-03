/**
 * The same measurement twice, three hours old and five weeks old, with no
 * staleness boundary supplied — which is what a tile looks like when nobody has
 * said what old means for the thing being measured.
 *
 * WHY THIS EXAMPLE REPLACED THE ONE THAT SHOWED THE MUTED STATE. The earlier
 * version passed `staleAfterHours` from a constant of its own, and taught the
 * idea better for it. It also shipped a boundary. opsinjs owns no such number
 * for any measurement in any population, the choice is clinical and belongs to
 * whoever knows what was measured, and in a worked example a number is read as
 * a recommendation whatever the caption beside it says — the more so in a file
 * that installs into somebody's repository. Naming the constant for its author
 * did not change what the number decided, so the number is gone rather than
 * renamed, and the state it demonstrated is described on the component's page
 * and shown by no preview opsinjs ships.
 *
 * WHAT IS LEFT IS WORTH SEEING ON ITS OWN, because it is the state most
 * dashboards are actually in. Both tiles are set identically: the same weight,
 * the same tint, the same size of number. Nothing about the older one says it
 * is older except the date RelativeTime prints, and past a fortnight that date
 * stops being a phrase and becomes the day itself, which is the only reason the
 * two rows read differently at a glance. A reader scanning six of these will
 * compare the numbers and not the dates. That is the argument for supplying the
 * boundary the product owns: with one, the older tile mutes from its label to
 * its timestamp and says *may be out of date* in words, and the difference is
 * visible before either number is read.
 *
 * Both readings are fictional, the unit is one nobody holds a reference range
 * for, and both timestamps are fixed, so the pair says the same thing every
 * time it is built.
 */

import { MetricTile } from "@/registry/base-lyra/ui/metric-tile"

/** The instant both tiles are measured against. Read once, passed to both. */
const NOW = "2026-04-06T09:00:00+00:00"

export default function MetricTileNoBoundarySupplied() {
  return (
    <div className="grid w-full max-w-lg gap-opsin-2 sm:grid-cols-2">
      <MetricTile
        label="Example measurement"
        value={14}
        unit="steps"
        precision={0}
        category="activity"
        status="watch"
        measuredAt="2026-04-06T06:00:00+00:00"
        now={NOW}
        href="#example"
      />
      <MetricTile
        label="Example measurement"
        value={12}
        unit="steps"
        precision={0}
        category="activity"
        status="watch"
        measuredAt="2026-03-01T06:00:00+00:00"
        now={NOW}
        href="#example"
      />
    </div>
  )
}
