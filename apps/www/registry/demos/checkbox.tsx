"use client"

import { useState } from "react"
import { Checkbox } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It holds its own ticked
 * state, because a demo has to close that loop somewhere, and it shows a single
 * box with a label and a line of guidance beneath it, which is the one thing
 * worth seeing at a glance: the ticked box is filled with the neutral action
 * role and carries a Check glyph, so the state survives greyscale rather than
 * resting on a hue. Read it in greyscale to check that.
 *
 * The words name a fictional, non-clinical agreement (ADR 0012). No reading, no
 * unit and no measurement anybody could mistake for their own data.
 */
export default function CheckboxDemo() {
  const [checked, setChecked] = useState(true)
  return (
    <Checkbox
      label="Email me a copy of this summary"
      description="We send it to the address on your account and nowhere else."
      checked={checked}
      onCheckedChange={setChecked}
    />
  )
}
