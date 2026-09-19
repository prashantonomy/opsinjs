"use client"

/**
 * A setting that takes effect on the flip, which is the case Switch was built
 * for. The reader turns "Larger text" on and the change is committed straight
 * away rather than gathered for a later submit, which is the whole difference
 * between a switch and a checkbox. The setting is a fictional non-clinical
 * preference (ADR 0012): no reading, no unit and no measurement.
 */

import { useState } from "react"

import { Switch } from "@/registry/base-lyra/ui/switch"

export default function SwitchASettingThatAppliesNow() {
  const [on, setOn] = useState(false)
  return (
    <div className="w-full max-w-sm">
      <Switch label="Larger text" checked={on} onCheckedChange={setOn} />
    </div>
  )
}
