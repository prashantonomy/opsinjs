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
 * NO ROW TAKES ITS LEVEL FROM ITS POSITION, and the first two rows are written
 * so that the data says so rather than only the prose. Both sit inside the same
 * range, two units apart, and one is `steady` while the other is `attention`,
 * because the product that owns the rule reached those two decisions
 * separately. RangeBar never makes the conversion in either direction: "inside
 * the range" and "nothing to attend to" are different claims, and so are
 * "outside it" and "needs attention". A list whose rows lined position up with
 * level would teach the conversion by example whatever the comment beside it
 * said, and this is one of the files `shadcn add` copies into a project.
 * `range-bar-outside-the-range.tsx` shows the same rule from the other side.
 *
 * THE THIRD ROW HAS NO STATUS, and that is not an oversight. A product assigns
 * a level when it has a rule that says so; where it has none, the tick is drawn
 * in a neutral tone and the row says nothing about attention rather than
 * quietly implying there is nothing to see. Every row is still readable in
 * greyscale, because each one carries its position, its numbers and its
 * sentence independently of any colour.
 *
 * EVERY ROW CARRIES THE TIME ITS READING WAS TAKEN, which is the other thing a
 * list gets wrong: three numbers under one another with no dates read as three
 * numbers from this morning. The dates differ per row because in a real list
 * they always do.
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
  measuredAt: string
}[] = [
  {
    label: "First example measurement",
    value: 14,
    category: "labs",
    status: "steady",
    measuredAt: "2026-03-14T08:12:00+00:00",
  },
  {
    label: "Second example measurement",
    value: 24,
    category: "heart",
    status: "attention",
    measuredAt: "2026-03-13T21:05:00+00:00",
  },
  {
    label: "Third example measurement",
    value: 12,
    category: "sleep",
    measuredAt: "2026-03-12T07:45:00+00:00",
  },
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
            measuredAt={row.measuredAt}
            locale="en-GB"
          />
        </li>
      ))}
    </ul>
  )
}
