/**
 * The refusal, which is the state this component exists for.
 *
 * Both sparklines below are given the same rule — four real readings before a
 * line may be drawn — and the same shape of data. The first has enough and draws
 * a line. The second has three, and draws nothing at all: no line, no dots, no
 * axis, no faint placeholder shaped like a trend. A line through three points
 * looks exactly like a line through thirty, and nothing on the screen tells the
 * reader which one they are looking at, so the only honest picture is no
 * picture.
 *
 * THE NUMBER IN THE SENTENCE IS THE PRODUCT'S, NOT OURS. The refusal names the
 * count the caller set and the count they actually have — "there are 3, and this
 * needs 4" — because a reader who is told there is not enough data is entitled
 * to know how much would be enough. opsinjs has no view about what that number
 * should be, which is why `minimumPoints` is required and has no default.
 *
 * NEITHER CAPTION NAMES A DIRECTION, and that is not an omission. A direction
 * word needs a change threshold — the difference below which a series is
 * presented as unchanged — and that belongs to the metric. Neither sparkline
 * here passes one, so both print their endpoints and stop.
 *
 * The second sparkline also passes its own `caption`. That is how a product says
 * what a reader should do next, and it is APPENDED to the refusal rather than
 * replacing it: the sentence explaining why there is no picture is the one
 * sentence a caller cannot take away.
 */

import { type TrendPoint } from "@/lib/opsinjs"
import { TrendSparkline } from "@/registry/base-lyra/ui/trend-sparkline"

/** The product's rule about how many readings make a trend. See the demo. */
const EXAMPLE_READINGS_A_TREND_NEEDS = 4

const ENOUGH: TrendPoint[] = [
  { at: "2026-03-01T08:00:00Z", value: 12 },
  { at: "2026-03-02T08:00:00Z", value: 14 },
  { at: "2026-03-03T08:00:00Z", value: 13 },
  { at: "2026-03-04T08:00:00Z", value: 16 },
]

const TOO_FEW: TrendPoint[] = ENOUGH.slice(0, 3)

export default function TrendSparklineNotEnoughReadings() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-6 text-opsin-body">
      <div className="flex flex-col gap-opsin-1">
        <span className="text-opsin-headline">Example measurement</span>
        <TrendSparkline
          label="Example measurement"
          unit="steps"
          category="activity"
          window="the last four entries"
          series={ENOUGH}
          minimumPoints={EXAMPLE_READINGS_A_TREND_NEEDS}
        />
      </div>
      <div className="flex flex-col gap-opsin-1">
        <span className="text-opsin-headline">Second example measurement</span>
        <TrendSparkline
          label="Second example measurement"
          unit="steps"
          category="activity"
          window="the last four entries"
          series={TOO_FEW}
          minimumPoints={EXAMPLE_READINGS_A_TREND_NEEDS}
          caption="Add one more entry and this example will draw a line."
        />
      </div>
    </div>
  )
}
