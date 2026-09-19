"use client"

/**
 * Choosing one option from a list too long for a flat row, which is the case
 * Select was built for. The options are a fictional set of timezones (ADR 0012),
 * not a reading, a range or a unit anybody could mistake for their own data. The
 * example holds its own state because the control is controlled, and it starts
 * with one option chosen so the trigger shows a value and the list marks it with
 * a tick.
 */

import { useState } from "react"

import { Select } from "@/registry/base-lyra/ui/select"

export default function SelectChoosingFromAList() {
  const [zone, setZone] = useState("berlin")
  return (
    <div className="w-full max-w-xs">
      <Select
        label="Timezone"
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
