"use client"

/**
 * A select before anything is chosen, so the trigger shows its placeholder in the
 * muted ink rather than a value. The point worth checking is that the placeholder
 * reads as a prompt and not as a chosen option: it never appears in the list and
 * cannot be selected. The options are a fictional set of reminder frequencies
 * (ADR 0012), not a clinical schedule or a dose.
 */

import { useState } from "react"

import { Select } from "@/registry/base-lyra/ui/select"

export default function SelectWithAPlaceholder() {
  const [frequency, setFrequency] = useState("")
  return (
    <div className="w-full max-w-xs">
      <Select
        label="Reminder frequency"
        placeholder="Choose how often"
        value={frequency}
        onValueChange={setFrequency}
        options={[
          { value: "daily", label: "Every day" },
          { value: "weekdays", label: "Weekdays only" },
          { value: "weekly", label: "Once a week" },
          { value: "fortnightly", label: "Every two weeks" },
          { value: "monthly", label: "Once a month" },
        ]}
      />
    </div>
  )
}
