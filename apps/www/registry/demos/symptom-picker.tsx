"use client"

import { useState } from "react"
import { SymptomPicker } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It holds its own
 * selection state, because the picker is controlled and a demo has to close
 * that loop somewhere, and it shows a short list with one row ticked so the one
 * thing worth seeing at a glance is clear: the ticked row is carried by the
 * check shape and a quiet fill rather than by a colour on either axis. Read it
 * in greyscale to check.
 *
 * Every option is a fictional placeholder (ADR 0012). opsinjs ships no symptom
 * list, so the labels here name nothing a reader could mistake for a real
 * vocabulary, and the question is generic.
 */
export default function SymptomPickerDemo() {
  const [value, setValue] = useState<string[]>(["example-two"])
  return (
    <SymptomPicker
      label="Which of these apply to you right now?"
      value={value}
      onValueChange={setValue}
      options={[
        { value: "example-one", label: "Example symptom one" },
        { value: "example-two", label: "Example symptom two" },
        { value: "example-three", label: "Example symptom three" },
        { value: "example-four", label: "Example symptom four" },
      ]}
    />
  )
}
