"use client"

/**
 * A single optional agreement, which is the case the lone Checkbox was built
 * for. Ticking it opts the reader into one plain thing, and the line of
 * guidance beneath the label says what that thing does. It is an ordinary
 * preference rather than a consent decision, and it carries no reading, no unit
 * and no clinical vocabulary (ADR 0012).
 */

import { useState } from "react"

import { Checkbox } from "@/registry/base-lyra/ui/checkbox"

export default function CheckboxAnOptionalAgreement() {
  const [checked, setChecked] = useState(false)
  return (
    <Checkbox
      label="Email me a copy"
      description="We send a copy to the address on your account after you save."
      checked={checked}
      onCheckedChange={setChecked}
    />
  )
}
