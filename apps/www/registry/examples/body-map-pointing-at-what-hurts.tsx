"use client"

/**
 * The base case: a controlled multi-select over the default front and back
 * schematic. The caption reports how many regions are marked rather than
 * echoing any measurement, because a screenshot of an opsinjs example must
 * never be mistakable for somebody's own data (ADR 0012).
 */

import { useState } from "react"

import { BodyMap } from "@/registry/base-lyra/ui/body-map"

export default function BodyMapPointingAtWhatHurts() {
  const [regions, setRegions] = useState<string[]>(["left-arm"])
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-4">
      <BodyMap
        label="Example: where are you noticing something?"
        value={regions}
        onValueChange={setRegions}
      />
      <p className="text-opsin-footnote [color:var(--muted-foreground)]">
        {regions.length === 0
          ? "No region marked yet."
          : "Marked: " +
            regions.length +
            " region" +
            (regions.length === 1 ? "" : "s") +
            "."}
      </p>
    </div>
  )
}
