/**
 * Three readings down a page, which is where the two colour axes have to be
 * told apart or not at all.
 *
 * WHAT TO LOOK AT. The labels are tinted from the CATEGORY axis — what each
 * reading is about — and the ticks are coloured from the STATUS axis, and no
 * element takes colour from both. That separation is the whole reason a reader
 * can learn that one family of colours answers "which reading is this" and the
 * other answers "how much attention does it want". Put a category colour inside
 * the bar and both meanings are gone at once.
 *
 * THE THIRD ROW HAS NO STATUS, and that is not an oversight. A product assigns
 * a level when it has a rule that says so; where it has none, the tick is drawn
 * in a neutral tone and the row says nothing about attention rather than
 * quietly implying there is nothing to see. Every row is still readable in
 * greyscale, because each one carries its position, its numbers and its
 * sentence independently of any colour.
 *
 * The readings are deliberately unreal and every range cites the same
 * non-source. Three ranges that looked like laboratory ranges, screenshotted,
 * would outlive this page.
 */

import { EXAMPLE_SOURCE, type HealthCategory, type ClinicalStatus } from "@/lib/opsinjs"
import { RangeBar } from "@/registry/base-lyra/ui/range-bar"

const ROWS: {
  label: string
  value: number
  category: HealthCategory
  status?: ClinicalStatus
}[] = [
  { label: "First example measurement", value: 14, category: "labs", status: "steady" },
  { label: "Second example measurement", value: 24, category: "heart", status: "attention" },
  { label: "Third example measurement", value: 12, category: "sleep" },
]

export default function RangeBarInAListOfResults() {
  return (
    <ul className="m-0 flex w-full max-w-md list-none flex-col gap-opsin-8 p-0">
      {ROWS.map((row) => (
        <li key={row.label} className="m-0">
          <RangeBar
            label={row.label}
            value={row.value}
            unit="mg/dL"
            precision={0}
            range={{ low: 10, high: 20, source: EXAMPLE_SOURCE }}
            category={row.category}
            status={row.status}
            locale="en-GB"
          />
        </li>
      ))}
    </ul>
  )
}
