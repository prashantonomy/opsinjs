"use client"

import { useState } from "react"
import { NumberField } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It holds its own value,
 * because the field is controlled and a demo has to close that loop somewhere,
 * and it shows a bounded count with the increment and decrement buttons
 * flanking the number, so the one thing worth seeing at a glance is clear: the
 * field reads as a single neutral control, and no colour is doing any work.
 *
 * The label names a fictional count (ADR 0012). No unit, no reference range and
 * no measurement anybody could mistake for their own reading; a NumberField
 * counts, and a count of example copies is the plainest thing it can hold.
 */
export default function NumberFieldDemo() {
  const [copies, setCopies] = useState<number | null>(2)
  return (
    <NumberField
      label="Number of copies"
      value={copies}
      onValueChange={setCopies}
      min={1}
      max={10}
      step={1}
    />
  )
}
