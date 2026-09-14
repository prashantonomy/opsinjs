/**
 * A reading at twice the top of its range, where the band is squeezed to a
 * sliver and the geometry is at its most demanding.
 *
 * TRUE TO SCALE, NOT A DRAWING BUG. The track has to hold the reading as well
 * as the range, so it grows to contain whichever is further out. When the
 * reading sits far above the high bound, the same interval that fills a
 * comfortable bar in the everyday case is compressed towards the left as the
 * track stretches to reach the reading on the right. The band shrinking to a
 * narrow strip is the honest picture of a number that really is a long way
 * outside its range; widening the band to look normal would draw a scale nobody
 * chose.
 *
 * THE STATUS IS OMITTED ON PURPOSE. This example is about layout, not
 * judgement, and a level chosen to match the position would be exactly the
 * conversion RangeBar refuses to make: being above a range is a position, not a
 * verdict, and whether it needs attention belongs to whoever owns the range. So
 * the tick draws in a neutral tone and the sentence states the position in
 * words alone.
 *
 * WHY IT EXISTS. The layout check at 200 percent text needs the worst geometry
 * to measure rather than the comfortable one. A reading of 40 against a range
 * of 10 to 20 pushes the low boundary label towards the left edge and the
 * reading label towards the right, which is the case that used to hang a label
 * off the component and scroll the page sideways. This file gives the gate a
 * fixed route to that case so the fix stays fixed.
 *
 * The numbers are deliberately unreal, and the range cites the only string an
 * opsinjs example may cite.
 */

import { EXAMPLE_SOURCE } from "@/lib/opsinjs"
import { RangeBar } from "@/registry/base-lyra/ui/range-bar"

export default function RangeBarFarAboveTheRange() {
  return (
    <div className="w-full max-w-md">
      <RangeBar
        label="Example measurement"
        value={40}
        unit="mg/dL"
        precision={0}
        range={{
          low: 10,
          high: 20,
          source: EXAMPLE_SOURCE,
        }}
        measuredAt="2026-03-14T08:12:00+00:00"
        locale="en-GB"
      />
    </div>
  )
}
