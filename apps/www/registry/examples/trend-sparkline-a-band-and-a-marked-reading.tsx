/**
 * The two optional parts, together, and the rules they are governed by.
 *
 * THE BAND IS NEUTRAL, ATTRIBUTED, AND STATED IN WORDS. It is drawn in the same
 * grey as every other neutral surface and outlined with a dash, never in a
 * status colour, because a tinted band would tell the reader that sitting inside
 * it is welcome and sitting outside it is not — a comparison the component has
 * not been given. Its `source` is required and the caption names it; so are its
 * two numbers, because a reader who is told a shaded interval exists and who
 * owns it, and never what it says, has been shown a picture with no twin.
 *
 * A BAND NEEDS BOTH OF ITS ENDS, which is what the second sparkline is here to
 * show. Its range has an upper bound and no lower one. That is a real range, and
 * it is rendered as words — "up to 20 steps" — and as no rectangle at all,
 * because a rectangle has four edges and the missing one would have to be taken
 * from the readings or from zero and would then be attributed, in the caption,
 * to a source that never gave it.
 *
 * THE MARKED READING IS NOT COLOURED IN THE PLOT. The product flagged the last
 * reading, and the verdict appears as a StatusPill in the caption — word, glyph,
 * colour and `data-status` together — while the plot draws the marker in the
 * line's own tint. A dot the size of a full stop can carry a colour and nothing
 * else, and a status carried by colour alone is one a third of readers cannot
 * read at all.
 *
 * The readings are fictional and the source string says so. Nothing here is a
 * reference range, in any unit, for anybody.
 */

import { EXAMPLE_SOURCE, type TrendPoint } from "@/lib/opsinjs"
import { TrendSparkline } from "@/registry/base-lyra/ui/trend-sparkline"

/**
 * How many readings this imaginary product decided make a trend.
 *
 * It is the product's number, not opsinjs's, which is why it lives in the
 * example rather than in the component and why the component has no default for
 * it. A design system that picked one would be deciding, for every metric and
 * every reader, when three readings become a pattern.
 */
const EXAMPLE_READINGS_A_TREND_NEEDS = 4

const SERIES: TrendPoint[] = [
  { at: "2026-02-01T08:00:00Z", value: 12 },
  { at: "2026-02-02T08:00:00Z", value: 14 },
  { at: "2026-02-03T08:00:00Z", value: 13 },
  { at: "2026-02-04T08:00:00Z", value: 16 },
  { at: "2026-02-05T08:00:00Z", value: 18 },
  { at: "2026-02-06T08:00:00Z", value: 22, status: "attention" },
]

export default function TrendSparklineABandAndAMarkedReading() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-6 text-opsin-body">
      <div className="flex flex-col gap-opsin-1">
        {/* The label is drawn by the surface, not by the sparkline. The component
            takes `label` for its accessible name and never renders it, because the
            card, tile or row a sparkline sits in has already said what it is
            about, and a second copy is a second thing to keep in step. */}
        <span className="text-opsin-headline">Example measurement</span>
        <TrendSparkline
          label="Example measurement"
          unit="steps"
          category="activity"
          window="the last six entries"
          series={SERIES}
          minimumPoints={EXAMPLE_READINGS_A_TREND_NEEDS}
          range={{ low: 10, high: 20, source: EXAMPLE_SOURCE }}
        />
      </div>
      <div className="flex flex-col gap-opsin-1">
        <span className="text-opsin-headline">Second example measurement</span>
        <TrendSparkline
          label="Second example measurement"
          unit="steps"
          category="activity"
          window="the last six entries"
          series={SERIES}
          minimumPoints={EXAMPLE_READINGS_A_TREND_NEEDS}
          range={{ high: 20, source: EXAMPLE_SOURCE }}
        />
      </div>
    </div>
  )
}
