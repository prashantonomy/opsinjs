/**
 * The refusal, which is the most important thing this component does.
 *
 * A product that has a number but no agreed bands for it is the common case,
 * not the edge one — the arithmetic usually lands long before anybody has
 * decided what the answer means. The dial handed no bands draws the scale,
 * places the number on it, and says in words that it has no band for it. It
 * does not reach for a nearby band set, a population average, or thirds of the
 * scale, because a band this library chose would be a score interpretation with
 * no clinical owner, shipped into every product that installed it.
 *
 * The rule to take from this example: an omitted input renders an explicit
 * "we do not have this", never a substituted default.
 *
 * The scale is ten to twenty and the score is fourteen, which is the shape ADR
 * 0012 asks for: round, obviously invented, and nothing anybody could mistake
 * for their own result.
 */

import { EXAMPLE_SOURCE } from "@/lib/opsinjs"
import { ScoreDial } from "@/registry/base-lyra/ui/score-dial"

export default function ScoreDialNoBandsSupplied() {
  return (
    <ScoreDial
      label="Example composite score"
      value={14}
      min={10}
      max={20}
      precision={0}
      /* Empty, deliberately. In development this prints one warning saying so,
         which is what the state is for: it is honest on screen and loud in the
         console, rather than quietly plausible in both places. */
      bands={[]}
      derivation={`${EXAMPLE_SOURCE}. The score and the scale here are invented, and nothing was calculated from anybody.`}
    />
  )
}
