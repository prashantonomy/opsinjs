"use client"

/**
 * A setting with a helper line under its label. The description says what
 * turning the switch on will change, and it is read to assistive technology as
 * the control's description rather than as part of its name, so the accessible
 * name stays the label alone. The preference is fictional and non-clinical (ADR
 * 0012): no reading, no unit and no measurement.
 */

import { useState } from "react"

import { Switch } from "@/registry/base-lyra/ui/switch"

export default function SwitchWithADescription() {
  const [on, setOn] = useState(true)
  return (
    <div className="w-full max-w-sm">
      <Switch
        label="Reduce motion"
        description="Turns off the sliding and fading animations across the app."
        checked={on}
        onCheckedChange={setOn}
      />
    </div>
  )
}
