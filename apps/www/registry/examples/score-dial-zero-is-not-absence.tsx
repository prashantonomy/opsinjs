/**
 * Two dials that look almost the same and mean entirely different things.
 *
 * On the left, a score of zero: a calculation that ran, on data that existed,
 * and came to the bottom of its scale. The indicator is drawn, it sits in the
 * first band, and the band is named.
 *
 * On the right, no score at all: nothing was calculated, so there is no
 * position to draw and no band to name. The arc is still there, because the
 * scale is still true, but nothing is placed on it and the words say why.
 *
 * Collapsing the two is the defect this example exists to prevent. A reader
 * shown a zero for a score that was never calculated has been told something
 * untrue about their own record, and a dial is the worst place for it: the
 * indicator sitting hard against the low end of a ring is a strong, wordless
 * claim that this is how they did.
 */

import { EXAMPLE_SOURCE } from "@/lib/opsinjs"
import { ScoreDial } from "@/registry/base-lyra/ui/score-dial"

const EXAMPLE_BANDS = [
  { from: 0, to: 40, name: "First example band" },
  { from: 40, to: 70, name: "Second example band" },
  { from: 70, to: 100, name: "Third example band" },
]

const DERIVATION = `${EXAMPLE_SOURCE}. The score, the scale and the bands here are invented, and nothing was calculated from anybody.`

export default function ScoreDialZeroIsNotAbsence() {
  return (
    <div className="flex w-full flex-col items-start gap-opsin-8 sm:flex-row">
      <ScoreDial
        label="Example composite score"
        value={0}
        min={0}
        max={100}
        precision={0}
        bands={EXAMPLE_BANDS}
        derivation={DERIVATION}
      />
      <ScoreDial
        label="Example composite score"
        value={null}
        min={0}
        max={100}
        precision={0}
        bands={EXAMPLE_BANDS}
        derivation={DERIVATION}
      />
    </div>
  )
}
