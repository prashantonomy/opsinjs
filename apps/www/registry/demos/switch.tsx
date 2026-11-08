"use client"

import { useState } from "react"
import { Switch } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows a single switch
 * with a label and a helper line, which is the one thing worth seeing at a
 * glance: the whole row is the target, the thumb sits on the right for on, and
 * the on colour is the active fill rather than a status. It holds its own
 * boolean, because the control is controlled and a demo has to close that loop
 * somewhere.
 *
 * The setting is a fictional non-clinical preference (ADR 0012). No reading, no
 * unit and no measurement anybody could mistake for their own data.
 */
export default function SwitchDemo() {
  const [on, setOn] = useState(true)
  return (
    <div className="w-full max-w-sm">
      <Switch
        label="Larger text"
        description="Increases the text size across the app."
        checked={on}
        onCheckedChange={setOn}
      />
    </div>
  )
}
