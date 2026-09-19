"use client"

/**
 * A plain single choice: three options, one chosen, no helper lines. This is the
 * case RadioGroup was built for, the vertical list the reader runs their eye down
 * before picking one.
 *
 * The options set a fictional display preference (ADR 0012), not a reading. A
 * screenshot of an opsinjs example must never be mistakable for somebody's own
 * data, so there is no number, no unit and no clinical vocabulary here, only a
 * neutral choice of how a fictional app renders its own theme.
 */

import { useState } from "react"

import { RadioGroup } from "@/registry/base-lyra/ui/radio-group"

const THEMES = [
  { value: "system", label: "Match the system" },
  { value: "light", label: "Always light" },
  { value: "dark", label: "Always dark" },
]

export default function RadioGroupASingleChoice() {
  const [theme, setTheme] = useState("system")
  return (
    <div className="w-full max-w-sm">
      <RadioGroup
        label="Example appearance"
        value={theme}
        onValueChange={setTheme}
        options={THEMES}
      />
    </div>
  )
}
