/**
 * The legend in its only correct home: beside the bars it names.
 *
 * WHAT TO LOOK AT. The two swatches in the key are the same colours as the
 * ticks on the bars above them, because the legend takes the tones the bars
 * draw rather than inventing its own. Read the key and then read it straight
 * onto the bars. Move the legend out of this container and it names tones
 * the reader can no longer see, which is the whole reason the component owns
 * no data.
 *
 * The readings are unreal and the range cites the one non-source an opsinjs
 * example may cite. The status levels were assigned by a product from a rule
 * it owns; the legend states none of that and only names the tones.
 */

import { EXAMPLE_SOURCE, type ClinicalStatus } from "@/lib/opsinjs"
import { RangeBar } from "@/registry/base-lyra/ui/range-bar"
import { RangeLegend } from "@/registry/base-lyra/ui/range-legend"

const ROWS: { label: string; value: number; status: ClinicalStatus; measuredAt: string }[] = [
  {
    label: "First example measurement",
    value: 22,
    status: "watch",
    measuredAt: "2026-03-14T08:12:00+00:00",
  },
  {
    label: "Second example measurement",
    value: 27,
    status: "attention",
    measuredAt: "2026-03-13T21:05:00+00:00",
  },
]

export default function RangeLegendBesideItsBar() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-6">
      <ul className="m-0 flex list-none flex-col gap-opsin-8 p-0">
        {ROWS.map((row) => (
          <li key={row.label} className="m-0">
            <RangeBar
              label={row.label}
              value={row.value}
              unit="mg/dL"
              precision={0}
              range={{ low: 10, high: 20, source: EXAMPLE_SOURCE }}
              status={row.status}
              measuredAt={row.measuredAt}
              locale="en-GB"
            />
          </li>
        ))}
      </ul>
      <RangeLegend
        bands={[
          { label: "The usual range", description: "The band on each bar above." },
          { label: "Worth watching", tone: "watch" },
          { label: "Contact your care team", tone: "attention" },
        ]}
      />
    </div>
  )
}
