"use client"

/**
 * A plain count, which is the case NumberField was built for. The reader sets how
 * many copies to print, stepping one at a time with the buttons or typing the
 * number in. It is a fictional quantity rather than anything measured (ADR 0012):
 * a count of copies carries no unit, no reference range and no clinical meaning,
 * so nothing here can be mistaken for a reading.
 */

import { useState } from "react"

import { NumberField } from "@/registry/base-lyra/ui/number-field"

export default function NumberFieldAQuantity() {
  const [copies, setCopies] = useState<number | null>(3)
  return (
    <NumberField
      label="Number of copies"
      value={copies}
      onValueChange={setCopies}
      min={1}
      step={1}
    />
  )
}
