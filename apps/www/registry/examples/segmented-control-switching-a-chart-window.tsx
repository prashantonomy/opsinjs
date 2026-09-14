"use client"

/**
 * The case this control was built for: switching one chart between a day, a
 * week and a month window.
 *
 * It is a radio group rather than a set of tabs on purpose. The three options
 * set a parameter of the same view, they do not swap between three views with
 * their own content, so choosing one keeps the reader looking at the one chart
 * and changes the window it is drawn for. That is a single-select input, which
 * is what a radiogroup is, and it is why the whole row is one tab stop with the
 * Arrow keys moving between the windows inside it.
 *
 * The chart itself is a placeholder box carrying no reading (ADR 0012). A
 * screenshot of an opsinjs example must never be mistakable for somebody's own
 * data, so there is no line, no axis and no number here, only a note that says
 * which window a real chart would be drawn for. The box draws neutral chrome
 * alone and carries neither colour axis, exactly as the control does.
 */

import { useState } from "react"

import { SegmentedControl } from "@/registry/base-lyra/ui/segmented-control"

const WINDOWS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
]

export default function SegmentedControlSwitchingAChartWindow() {
  const [chartWindow, setChartWindow] = useState("week")
  const current = WINDOWS.find((option) => option.value === chartWindow)

  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-4">
      <SegmentedControl
        label="Example chart window"
        value={chartWindow}
        onValueChange={setChartWindow}
        options={WINDOWS}
      />
      <div className="flex items-center justify-center rounded-opsin-lg border border-border bg-card px-opsin-4 py-opsin-8 text-center text-opsin-body [color:var(--muted-foreground)]">
        A placeholder chart would be drawn here for the{" "}
        {current ? current.label.toLowerCase() : "chosen"} window. No reading is
        shown.
      </div>
    </div>
  )
}
