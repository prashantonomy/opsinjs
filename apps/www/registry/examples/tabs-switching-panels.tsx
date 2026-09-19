"use client"

/**
 * The case Tabs was built for: three panels of content that share one region,
 * with only one shown at a time.
 *
 * The point of the example is what choosing a tab does. Each tab reveals a
 * different body of content, so moving from one tab to the next swaps the whole
 * panel rather than redrawing a single view for a different setting. That is
 * the line between Tabs and SegmentedControl, and it is the thing to watch
 * here: the panel under the row is replaced, not adjusted.
 *
 * Every panel is fictional prose (ADR 0012). There is no reading, no unit and
 * no reference range in any of them, so a screenshot of this example cannot be
 * mistaken for somebody's own data.
 */

import { useState } from "react"

import { Tabs } from "@/registry/base-lyra/ui/tabs"

const ITEMS = [
  {
    value: "summary",
    label: "Summary",
    panel:
      "A summary panel would gather the headline points here in a sentence or two. Choosing another tab hides this panel and shows a different one in the same space.",
  },
  {
    value: "detail",
    label: "Detail",
    panel:
      "A detail panel would carry the longer explanation, the kind a reader opens only when they want it. It is its own body of content, not a rearrangement of the summary above.",
  },
  {
    value: "sources",
    label: "Sources",
    panel:
      "A sources panel would list where the words came from. Nothing on any of these tabs is a measurement, a threshold or a unit, so none of it is a reading.",
  },
]

export default function TabsSwitchingPanels() {
  const [panel, setPanel] = useState("summary")

  return (
    <div className="w-full max-w-md">
      <Tabs label="Example panels" value={panel} onValueChange={setPanel} items={ITEMS} />
    </div>
  )
}
