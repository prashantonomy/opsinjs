"use client"

import { useState } from "react"
import { RadioGroup } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It holds its own
 * selection state, because the group is controlled and a demo has to close that
 * loop somewhere, and it shows a three-option list with one option chosen,
 * which is the one thing worth seeing at a glance: that the options read as a
 * stacked set and the chosen one is marked by the ring and the dot without a
 * colour doing the work. Read it in greyscale to check that.
 *
 * The labels name a fictional reminder setting (ADR 0012). No number, no unit and
 * no measurement anybody could mistake for their own reading.
 */
export default function RadioGroupDemo() {
  const [style, setStyle] = useState("standard")
  return (
    <RadioGroup
      label="Example reminder style"
      value={style}
      onValueChange={setStyle}
      options={[
        { value: "standard", label: "Standard" },
        { value: "quiet", label: "Quiet" },
        { value: "off", label: "None" },
      ]}
    />
  )
}
