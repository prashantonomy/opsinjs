"use client"

/**
 * A count held between a floor and a ceiling. `min` and `max` fix the range, and
 * `step` sets how far one press moves the value, so the decrement button disables
 * itself at the floor and the increment button disables itself at the ceiling and
 * the reader cannot step past either bound. The thing worth checking is that the
 * bounds are the count's own, how many people can share one entry, rather than a
 * clinical range: a NumberField holds no reference range and reaches no verdict
 * (ADR 0012).
 */

import { useState } from "react"

import { NumberField } from "@/registry/base-lyra/ui/number-field"

export default function NumberFieldWithBounds() {
  const [seats, setSeats] = useState<number | null>(4)
  return (
    <NumberField
      label="People sharing this entry"
      value={seats}
      onValueChange={setSeats}
      min={1}
      max={8}
      step={1}
    />
  )
}
