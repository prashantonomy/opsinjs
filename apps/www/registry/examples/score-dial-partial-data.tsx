/**
 * A score that is real but rests on less evidence than usual, and says so on
 * its own face.
 *
 * `coverage` is the whole point of this example. A product that computes a
 * score from whatever data happened to arrive, and then draws it identically to
 * one computed from a full set, has taught its reader that every number carries
 * the same weight. It does not. "Based on 4 of 6" is four words that let
 * somebody weigh the number themselves, and this component puts them beside the
 * derivation rather than in a footnote nobody opens.
 *
 * What was counted — nights, readings, days — is the derivation sentence's job
 * to name. This component does not know, and it will not guess a noun.
 *
 * The second thing shown here is the two axes staying apart. The label takes the
 * category tint; the indicator and the one band the score fell in take the
 * status. They never meet on one element, which is why both can be on screen at
 * once without the reader having to work out which question a colour is
 * answering.
 */

import { EXAMPLE_SOURCE } from "@/lib/opsinjs"
import { ScoreDial } from "@/registry/base-lyra/ui/score-dial"

export default function ScoreDialPartialData() {
  return (
    <ScoreDial
      label="Example composite score"
      category="sleep"
      value={62}
      min={0}
      max={100}
      precision={0}
      bands={[
        { from: 0, to: 40, name: "First example band" },
        { from: 40, to: 70, name: "Second example band", status: "watch" },
        { from: 70, to: 100, name: "Third example band" },
      ]}
      coverage={{ available: 4, expected: 6 }}
      measuredAt="2026-03-14T08:12:00+00:00"
      derivation={`${EXAMPLE_SOURCE}. The score, the scale and the bands here are invented, and nothing was calculated from anybody.`}
    />
  )
}
