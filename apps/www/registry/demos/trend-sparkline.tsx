import { TrendPoint, TrendSparkline } from "@opsinjs/react"

/**
 * How many readings the demo's imaginary product decided make a trend.
 *
 * IT IS THE DEMO'S NUMBER AND IT IS NOT A RULE. In a real product this arrives
 * from the metric's own definition, decided by somebody who knows what is being
 * measured; nothing in opsinjs supplies it, the component has no default for
 * it, and it means nothing outside this file. A developer who copies this demo
 * into a product replaces it with their own metric's number or deletes it.
 *
 * A GAP WORTH KNOWING ABOUT: A11Y014 fails the build on a threshold-shaped NAME
 * given a numeric literal, and it cannot see this one, so no gate is holding
 * this line. What holds it is the API. `minimumPoints` is required with no
 * default, so a caller cannot inherit this number by forgetting to pass one, and
 * the demo cannot be written without passing something. That tension is recorded
 * on the page instead of being hidden here.
 */
const EXAMPLE_READINGS_A_TREND_NEEDS = 4

/**
 * Thirteen entries at one-day spacing with exactly one gap, so the break in the
 * line is visible and the caption has something to disclose. The last reading
 * carries a status, which is what puts the pill in the caption.
 *
 * THE COUNT IS THE POINT. A gap has no position, so no segment is drawn into or
 * out of it, and one null removes the two intervals on either side of it. In a
 * six-entry series that was two of five intervals, about two-fifths of the plot,
 * beside a caption that says "1 gap": the picture overstated the absence. With
 * thirteen entries one null removes two of twelve intervals, roughly a sixth,
 * which is what "1 gap" describes. The gap-edge dots draw a reading on each side
 * of the hole, so it reads "reading, nothing, reading".
 *
 * The values move up and down rather than ramping, so the line has a shape, and
 * they are obviously unreal round numbers of steps (ADR 0012) well clear of
 * anything a reader could take for their own record.
 */
const DEMO_SERIES: TrendPoint[] = [
  { at: "2026-01-01T09:00:00Z", value: 10 },
  { at: "2026-01-02T09:00:00Z", value: 20 },
  { at: "2026-01-03T09:00:00Z", value: 30 },
  { at: "2026-01-04T09:00:00Z", value: 20 },
  { at: "2026-01-05T09:00:00Z", value: 40 },
  { at: "2026-01-06T09:00:00Z", value: 30 },
  { at: "2026-01-07T09:00:00Z", value: null },
  { at: "2026-01-08T09:00:00Z", value: 50 },
  { at: "2026-01-09T09:00:00Z", value: 30 },
  { at: "2026-01-10T09:00:00Z", value: 40 },
  { at: "2026-01-11T09:00:00Z", value: 60 },
  { at: "2026-01-12T09:00:00Z", value: 40 },
  { at: "2026-01-13T09:00:00Z", value: 50, status: "watch" },
]

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows one drawn
 * sparkline, with a gap in it and one reading marked, so the caption has a
 * break and a status to disclose. It draws a line and emits no runtime warning,
 * because a demo is held to the component's own standard (ADR 0009).
 *
 * ONE STATE, BY THE RULE. ADR 0009 says a second state is a file under
 * registry/examples/, not a second instance in the demo. The refusal, which is
 * the state this component exists for, is owned by
 * registry/examples/trend-sparkline-not-enough-readings.tsx, which shows it
 * better than a shrunk demo could, and the drawn variations live in the other
 * two example files. So the demo renders the one best state and stops.
 *
 * It passes no `changeThreshold`, so the caption names no direction. That is the
 * state opsinjs can render honestly without being told anything about the
 * metric, and is what a reader should see here.
 *
 * The readings are obviously unreal (ADR 0012), because they are round numbers
 * of steps nobody would take for their own. There is no reference range
 * anywhere in sight. A screenshot of an opsinjs demo must never be mistakable
 * for somebody's own record.
 */
export default function TrendSparklineDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-6 text-opsin-body">
      <div className="flex flex-col gap-opsin-1">
        <span className="text-opsin-headline">Example measurement</span>
        {/* The caption's "last reading taken on" date is formatted by this
            component from the last point's `at`, so the demo pins `locale` to
            render the day-first order numbers-dates-and-time mandates. A product
            passes the tag its own reader uses. */}
        <TrendSparkline
          label="Example measurement"
          unit="steps"
          precision={0}
          category="activity"
          locale="en-GB"
          window="the last 13 entries"
          series={DEMO_SERIES}
          minimumPoints={EXAMPLE_READINGS_A_TREND_NEEDS}
        />
      </div>
    </div>
  )
}
