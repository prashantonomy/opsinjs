"use client"

/**
 * Tabs set inside a card surface, which is where they most often live: a single
 * card whose header names a subject and whose body carries two or three views
 * of it, one shown at a time.
 *
 * The card here is drawn with plain neutral chrome, a hairline and the card
 * surface, rather than by composing the shipped Card, so the example stands on
 * the tab wrapper alone and pulls in nothing else. The tab row sits at the top
 * of the body and the panel fills the space below it, so choosing a tab swaps
 * the body content without the card around it moving.
 *
 * Every panel is fictional prose (ADR 0012): no reading, no unit and no
 * reference range, so the card cannot be mistaken for a real record.
 */

import { useState } from "react"

import { Tabs } from "@/registry/base-lyra/ui/tabs"

const ITEMS = [
  {
    value: "about",
    label: "About",
    panel:
      "An about panel would describe the subject of this card in a short paragraph. It is the view a reader meets first.",
  },
  {
    value: "activity",
    label: "Activity",
    panel:
      "An activity panel would list what has happened recently. It replaces the about panel entirely rather than adding to it.",
  },
]

export default function TabsInACard() {
  const [panel, setPanel] = useState("about")

  return (
    <div className="w-full max-w-md rounded-opsin-lg border border-border bg-card px-opsin-4 py-opsin-3">
      <p className="m-0 mb-opsin-2 text-opsin-headline font-medium [color:var(--foreground)]">
        Example subject
      </p>
      <Tabs label="Example card views" value={panel} onValueChange={setPanel} items={ITEMS} />
    </div>
  )
}
