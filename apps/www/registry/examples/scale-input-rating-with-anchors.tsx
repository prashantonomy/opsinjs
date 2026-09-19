"use client"

/**
 * A ten point scale with a word at each end, the shape a product reaches for
 * when it asks the reader to place themselves between two poles.
 *
 * Everything here is product-supplied and invented for the example (ADR 0012):
 * the thing being rated, the ten points and the two end words all arrive as
 * props, because opsinjs ships no anchors, no point count and no scale of its
 * own. Read the row in greyscale and the chosen point is still the answer,
 * because it is lifted by the neutral primary fill rather than by a status
 * colour: a rating is what the reader said about themselves, not a verdict the
 * component reached.
 */

import { useState } from "react"

import { ScaleInput } from "@/registry/base-lyra/ui/scale-input"

export default function ScaleInputRatingWithAnchors() {
  const [rating, setRating] = useState<number | null>(7)
  return (
    <div className="w-full max-w-md">
      <ScaleInput
        label="Example rating"
        points={10}
        value={rating}
        onValueChange={setRating}
        minLabel="Not at all"
        maxLabel="Completely"
      />
    </div>
  )
}
