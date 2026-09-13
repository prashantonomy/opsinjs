/**
 * Three sparklines in a row is the arrangement the category tint exists for. It
 * is also the arrangement that shows the component's sharpest limitation.
 *
 * WHAT THE TINT IS FOR. Findability, and nothing else. A reader scanning a
 * dashboard is looking for the sleep one among six, and a tinted line is how
 * they find it without reading three labels. It is identity rather than meaning:
 * in greyscale every line here goes the same colour and not one fact is lost,
 * which is the test a category tint has to pass.
 *
 * WHAT IT IS NOT FOR. Any of these lines could be a reading the product has
 * flagged, and none of them changes colour to say so. Category colour answers
 * "what is this about"; status colour answers "how much attention does this
 * need"; and an element that tries to answer both answers neither.
 *
 * THE LIMITATION, DRAWN RATHER THAN DESCRIBED. All three series here cover the
 * same six entries, which is the only condition under which these three pictures
 * may be compared with each other. `window` is a display string, so the
 * component is never told how long the period is and lays each series out across
 * its own extent; hand one of these tiles a series covering half the period and
 * its line would still fill the tile edge to edge. Two tiles side by side are
 * comparable when a product makes them so, and this component cannot check it.
 *
 * NO TILE NAMES A DIRECTION. None of the three passes a `changeThreshold`, so
 * each caption gives its first and last reading and stops. A direction word
 * needs the difference below which a series is presented as unchanged, and that
 * belongs to the metric. Three tiles that all said "Up" because three numbers
 * happened to end higher than they started would be three verdicts nobody
 * signed.
 *
 * Every reading is fictional, in a unit chosen because nobody has a reference
 * range for it, and no number here is one a reader could take for their own.
 */

import { type TrendPoint } from "@/lib/opsinjs"
import { TrendSparkline } from "@/registry/base-lyra/ui/trend-sparkline"

/** The product's rule about how many readings make a trend. See the demo. */
const EXAMPLE_READINGS_A_TREND_NEEDS = 4

const AT = [
  "2026-04-01T08:00:00Z",
  "2026-04-02T08:00:00Z",
  "2026-04-03T08:00:00Z",
  "2026-04-04T08:00:00Z",
  "2026-04-05T08:00:00Z",
  "2026-04-06T08:00:00Z",
] as const

function series(values: (number | null)[]): TrendPoint[] {
  return AT.map((at, index) => ({ at, value: values[index] ?? null }))
}

const TILES = [
  {
    label: "First example measurement",
    category: "sleep",
    values: [12, 14, 13, 16, 15, 18],
  },
  {
    label: "Second example measurement",
    category: "heart",
    values: [20, 18, 19, 16, 14, 12],
  },
  {
    label: "Third example measurement",
    category: "mind",
    values: [10, 12, null, null, 14, 14],
  },
] as const

export default function TrendSparklineARowOfTiles() {
  return (
    <div className="grid w-full gap-opsin-4 sm:grid-cols-3">
      {TILES.map((tile) => (
        <div
          key={tile.label}
          className="flex flex-col gap-opsin-1 rounded-lg border border-border p-opsin-3 text-opsin-body"
        >
          <span className="text-opsin-headline">{tile.label}</span>
          <TrendSparkline
            label={tile.label}
            unit="steps"
            category={tile.category}
            window="the last six entries"
            series={series([...tile.values])}
            minimumPoints={EXAMPLE_READINGS_A_TREND_NEEDS}
          />
        </div>
      ))}
    </div>
  )
}
