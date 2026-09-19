"use client"

/**
 * The case SymptomPicker was built for: a reader ticks the options that apply
 * to them from a list the product supplies, and nothing is checked, triaged or
 * interpreted. The selection is recorded and handed back, and there it stops.
 *
 * The options here are fictional placeholders (ADR 0012). opsinjs ships no
 * symptom list, so these name nothing a reader could mistake for a real
 * vocabulary; a product replaces them with its own controlled list, which it
 * owns along with whatever the selection means.
 */

import { useState } from "react"

import { SymptomPicker } from "@/registry/base-lyra/ui/symptom-picker"

const OPTIONS = [
  { value: "example-one", label: "Example symptom one" },
  { value: "example-two", label: "Example symptom two" },
  { value: "example-three", label: "Example symptom three" },
  { value: "example-four", label: "Example symptom four" },
]

export default function SymptomPickerChoosingFromAList() {
  const [value, setValue] = useState<string[]>(["example-two"])
  return (
    <div className="w-full max-w-md">
      <SymptomPicker
        label="Which of these apply to you right now?"
        value={value}
        onValueChange={setValue}
        options={OPTIONS}
      />
    </div>
  )
}
