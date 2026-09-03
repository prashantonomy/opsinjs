/**
 * The smallest card this component will draw, and the sentence it refuses to
 * leave out.
 *
 * A result with a number, a unit and a time, and nothing else: no interval to
 * compare it against, no level of attention, no explanation and no next step.
 * That is a legitimate result — most products have some — and it is the open
 * question this page carried while it was unbuilt: is that still a ResultCard,
 * or is it a Value in a Card?
 *
 * The answer this component gives is that it is a ResultCard, on one condition.
 * A card with no explanation says so. Silence where the meaning should be reads
 * as a result nobody thought worth explaining, which a reader hears as
 * reassurance — and it is the default nobody chose. The sentence is the
 * smallest honest thing that can go there: it says what is missing, and it says
 * nothing whatever about what the reading means.
 *
 * Notice what is NOT drawn. No bar, because no interval was supplied and this
 * component substitutes none. No pill, because no level was assigned and a
 * card that drew one would be inventing a verdict. No footnote, because nobody
 * said where the reading came from. Every absence is an absence rather than a
 * default.
 */

import { ResultCard } from "@/registry/base-lyra/ui/result-card"

const EXAMPLE_NOW = "2026-03-14T11:12:00+00:00"

export default function ResultCardNoExplanationSupplied() {
  return (
    <div className="w-full max-w-lg">
      <ResultCard
        title="Second example measurement"
        value={14}
        unit="mg/dL"
        precision={0}
        measuredAt="2026-03-14T09:05:00+00:00"
        now={EXAMPLE_NOW}
      />
    </div>
  )
}
