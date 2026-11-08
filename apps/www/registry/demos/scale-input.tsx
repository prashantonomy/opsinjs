"use client"

import { useState } from "react"
import { ScaleInput } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It holds its own
 * selection state, because the scale is controlled and a demo has to close that
 * loop somewhere, and it shows a five point scale with two end words and one
 * point chosen, which is the one thing worth seeing at a glance: the chosen
 * point is lifted by the accent fill rather than by a status colour, so read it
 * in greyscale and it is still plainly the answer.
 *
 * The words are a fictional rating with abstract ends (ADR 0012). There is no
 * real instrument here, no clinical vocabulary and nothing a reader could mistake
 * for a scale their own product uses: the label, the point count and the end
 * words are all invented for the demo.
 */
export default function ScaleInputDemo() {
  const [rating, setRating] = useState<number | null>(3)
  return (
    <ScaleInput
      label="Example rating"
      points={5}
      value={rating}
      onValueChange={setRating}
      minLabel="Not at all"
      maxLabel="Completely"
    />
  )
}
