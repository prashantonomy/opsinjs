"use client"

import { useState } from "react"
import { Select } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It holds its own
 * selection state, because the control is controlled and a demo has to close
 * that loop somewhere, and it shows a trigger with one option chosen out of a
 * list longer than a row could hold, which is the one thing worth seeing at a
 * glance: that the control is neutral chrome and the chosen option is marked by
 * a tick rather than a colour. Open it and read the list in greyscale to check
 * that.
 *
 * The labels name fictional non-clinical options, a set of timezones (ADR 0012).
 * No number, no unit and no measurement anybody could mistake for their own
 * reading.
 */
export default function SelectDemo() {
  const [zone, setZone] = useState("lisbon")
  return (
    <div className="w-full max-w-xs">
      <Select
        label="Example timezone"
        placeholder="Choose a timezone"
        value={zone}
        onValueChange={setZone}
        options={[
          { value: "lisbon", label: "Lisbon" },
          { value: "berlin", label: "Berlin" },
          { value: "nairobi", label: "Nairobi" },
          { value: "mumbai", label: "Mumbai" },
          { value: "tokyo", label: "Tokyo" },
          { value: "auckland", label: "Auckland" },
        ]}
      />
    </div>
  )
}
