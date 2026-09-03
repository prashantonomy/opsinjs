/**
 * A reading beyond the top of the range, with everything the reader needs in
 * order to check the picture against the words.
 *
 * THE STATUS IS AN INPUT AND THIS FILE IS WHERE THAT IS EASIEST TO GET WRONG.
 * `status="attention"` is here because a product decided it, from a rule that
 * product owns and had reviewed. It is NOT because 26 is above 20 — RangeBar
 * never makes that conversion, and a reader who is outside a range is not
 * thereby someone who needs to act. Delete the prop and the bar still draws
 * exactly the same tick in exactly the same place, in a neutral tone, which is
 * the honest rendering of "nobody has made a judgement about this".
 *
 * The provenance dates are the other half. A range nobody has dated may have
 * been superseded, and a reading with no time attached is read as "now".
 *
 * The numbers are deliberately unreal, and the range cites the only string an
 * opsinjs example may cite.
 */

import { EXAMPLE_SOURCE } from "@/lib/opsinjs"
import { RangeBar } from "@/registry/base-lyra/ui/range-bar"

export default function RangeBarOutsideTheRange() {
  return (
    <div className="w-full max-w-md">
      <RangeBar
        label="Example measurement"
        value={26}
        unit="mg/dL"
        precision={0}
        range={{
          low: 10,
          high: 20,
          source: EXAMPLE_SOURCE,
          asOf: "2026-01-12",
        }}
        status="attention"
        measuredAt="2026-03-14T08:12:00+00:00"
        locale="en-GB"
      />
    </div>
  )
}
