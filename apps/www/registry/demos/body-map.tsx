"use client"

import { useState } from "react"
import { BodyMap } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code. It closes the controlled loop with its own state,
 * shows both figures, and starts with one region marked so the one thing worth
 * seeing is visible at a glance: a marked region is lifted with a muted fill, a
 * hairline and a tick, and no colour does the work. Read it in greyscale to
 * check that.
 *
 * The label is a question, never a measurement (ADR 0012). Nothing here is
 * data a reader could mistake for their own.
 */
export default function BodyMapDemo() {
  const [value, setValue] = useState<string[]>(["left-arm"])
  return (
    <BodyMap
      label="Example: where are you noticing something?"
      value={value}
      onValueChange={setValue}
    />
  )
}
