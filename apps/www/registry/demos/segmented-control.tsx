"use client"

import { useState } from "react"
import { SegmentedControl } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It holds its own
 * selection state, because the control is controlled and a demo has to close
 * that loop somewhere, and it shows a three-option row with one segment chosen,
 * which is the one thing worth seeing at a glance: that the options read as
 * siblings and the chosen one is lifted without a colour doing the work. Read
 * it in greyscale to check that.
 *
 * The labels name a fictional range switch (ADR 0012). No number, no unit and no
 * measurement anybody could mistake for their own reading.
 */
export default function SegmentedControlDemo() {
  const [range, setRange] = useState("recent")
  return (
    <SegmentedControl
      label="Example reading range"
      value={range}
      onValueChange={setRange}
      options={[
        { value: "recent", label: "Recent" },
        { value: "earlier", label: "Earlier" },
        { value: "all", label: "All time" },
      ]}
    />
  )
}
