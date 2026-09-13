/**
 * A range with one bound, and therefore no bar.
 *
 * A line needs two ends to be a scale. Given only "up to 20" there is no honest
 * place to put the other end of the track, so the component draws nothing and
 * says the same thing in the sentence instead: the reading, the bound, which
 * side of it the reading falls, and whose bound it is. Nothing is lost except
 * the picture, and the picture is the part that would have been invented.
 *
 * The tempting alternative is to pick a plausible other end and draw a bar
 * that looks like every other bar. Such an end might be twice the bound,
 * zero, or the reader's own history. That bar would be a scale nobody
 * chose, and the reader would have no way to tell it apart from one that
 * came from a laboratory.
 *
 * The reading carries the time it was taken, as every reading on a real screen
 * should: a number with no time beside it is read as "now", and losing the
 * picture is no reason to lose the date as well.
 */

import { EXAMPLE_SOURCE } from "@/lib/opsinjs"
import { RangeBar } from "@/registry/base-lyra/ui/range-bar"

export default function RangeBarAnOpenEndedRange() {
  return (
    <div className="w-full max-w-md">
      <RangeBar
        label="Example measurement"
        value={14}
        unit="mg/dL"
        precision={0}
        range={{ high: 20, source: EXAMPLE_SOURCE }}
        measuredAt="2026-03-14T08:12:00+00:00"
        locale="en-GB"
      />
    </div>
  )
}
