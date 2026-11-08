"use client"

import { useState } from "react"
import { Tabs } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It holds its own
 * selection state, because the component is controlled and a demo has to close
 * that loop somewhere, and it shows a three-tab row where choosing a tab swaps
 * the panel underneath, which is the one thing worth seeing at a glance: that
 * tabs replace content rather than set a parameter of it, and that the active
 * tab is marked without a colour doing the work. Read it in greyscale to check
 * that.
 *
 * The labels and panels are fictional prose (ADR 0012). No number, no unit and
 * no reference range anybody could mistake for their own reading.
 */
export default function TabsDemo() {
  const [panel, setPanel] = useState("overview")
  return (
    <Tabs
      label="Example detail"
      value={panel}
      onValueChange={setPanel}
      items={[
        {
          value: "overview",
          label: "Overview",
          panel:
            "A short summary panel would sit here. Choosing another tab swaps this whole panel for a different one, rather than redrawing this one.",
        },
        {
          value: "history",
          label: "History",
          panel:
            "A history panel would list earlier entries here. It is its own body of content, revealed only while this tab is active.",
        },
        {
          value: "notes",
          label: "Notes",
          panel:
            "A notes panel would hold free text here. Nothing on any of these tabs is a reading, a threshold or a unit.",
        },
      ]}
    />
  )
}
