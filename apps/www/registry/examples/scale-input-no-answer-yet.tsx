"use client"

/**
 * The honest empty state, before the reader has answered. `value` is `null`, so
 * the scale draws with no point chosen rather than defaulting to a middle point
 * the reader never picked.
 *
 * This is the reason the value is `number | null` and not a plain number. A
 * rating library that guessed a starting answer would put words in the reader's
 * mouth and hand the product a reading nobody gave, so an unanswered scale stays
 * empty until it is answered and the product can tell "no answer yet" from any
 * real point. The label, the point count and the end words are invented for the
 * example (ADR 0012); opsinjs supplies none of them.
 */

import { useState } from "react"

import { ScaleInput } from "@/registry/base-lyra/ui/scale-input"

export default function ScaleInputNoAnswerYet() {
  const [rating, setRating] = useState<number | null>(null)
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
