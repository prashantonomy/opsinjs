"use client"

import { useState } from "react"
import { Slider } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It holds its own value,
 * because the control is controlled and a demo has to close that loop
 * somewhere, and it shows the one thing worth seeing at a glance: a coarse
 * preference with its value read out beside the label, where the exact number
 * plainly does not matter and the point is roughly how far along the track the
 * thumb sits.
 *
 * The label names a fictional, non-clinical preference (ADR 0012). No reading,
 * no unit and no measurement anybody could mistake for their own data, because a
 * slider is the one control that must never carry one.
 */
export default function SliderDemo() {
  const [brightness, setBrightness] = useState(60)
  return (
    <div className="w-full max-w-sm">
      <Slider
        label="Example display brightness"
        value={brightness}
        onValueChange={setBrightness}
      />
    </div>
  )
}
