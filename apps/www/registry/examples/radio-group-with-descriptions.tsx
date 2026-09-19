"use client"

/**
 * The same list, with a helper line under each label. A description earns its
 * place when the label alone cannot say what the option does, and the vertical
 * form is what gives it room: each option is a row with the words stacked under
 * the label in the muted ink, read as part of the option rather than beside it.
 *
 * The options set a fictional reminder cadence (ADR 0012), not a clinical
 * schedule. There is no reading, no threshold and no clinical vocabulary here,
 * only a neutral choice of how often a fictional app sends its own nudges, so a
 * screenshot of this example cannot be mistaken for somebody's own data.
 */

import { useState } from "react"

import { RadioGroup } from "@/registry/base-lyra/ui/radio-group"

const CADENCES = [
  {
    value: "daily",
    label: "Every day",
    description: "A single nudge each morning.",
  },
  {
    value: "weekdays",
    label: "Weekdays only",
    description: "Monday to Friday, nothing at the weekend.",
  },
  {
    value: "never",
    label: "Turn reminders off",
    description: "No nudges are sent, and you check in when you choose to.",
  },
]

export default function RadioGroupWithDescriptions() {
  const [cadence, setCadence] = useState("weekdays")
  return (
    <div className="w-full max-w-sm">
      <RadioGroup
        label="Example reminder cadence"
        value={cadence}
        onValueChange={setCadence}
        options={CADENCES}
      />
    </div>
  )
}
