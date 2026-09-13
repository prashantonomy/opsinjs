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
 * What was counted is the derivation sentence's job to name, whether that is
 * nights, readings or days. This component does not know, and it will not
 * guess a noun.
 *
 * The second thing shown here is the two axes staying apart. The label takes the
 * category tint; the indicator and the one band the score fell in take the
 * status. They never meet on one element, which is why both can be on screen at
 * once without the reader having to work out which question a colour is
 * answering.
 *
 * The third is where the status comes from. `status` is a prop on the dial, not
 * a field on a band: the product looked at this reading and said what it means.
 * Nothing in the component compares fourteen with anything and decides.
 *
 * There is no `calculatedAt` here, and its absence is the point rather than an
 * oversight. This example used to pass an instant six months before the day it
 * was reviewed, and the dial rendered a full-size score beside an undecorated
 * date at footnote size. That was a stale number drawn exactly like a fresh
 * one. The component gives a date no staleness treatment by design, because a
 * staleness window is a number opsinjs does not own; the caller who needs an
 * old score to look old renders a RelativeTime beside the dial.
 *
 * EVERY NUMBER HERE IS INVENTED. The bands carry `EXAMPLE_SOURCE` for the same
 * reason a `ReferenceRange` does. Two numbers that define an interval somebody
 * is compared against are a comparison a person chose, and an example has to
 * say out loud that the person was nobody. This file is not distributed:
 * examples have no catalogue row and appear in no `/r` payload, which is why
 * they may show band geometry at all while the shipped demo may not.
 */

import { EXAMPLE_SOURCE } from "@/lib/opsinjs"
import { ScoreDial } from "@/registry/base-lyra/ui/score-dial"

export default function ScoreDialPartialData() {
  return (
    <ScoreDial
      label="Example composite score"
      category="sleep"
      value={14}
      min={10}
      max={20}
      precision={0}
      bands={[
        { from: 10, to: 13, name: "First example band", source: EXAMPLE_SOURCE },
        { from: 13, to: 17, name: "Second example band", source: EXAMPLE_SOURCE },
        { from: 17, to: 20, name: "Third example band", source: EXAMPLE_SOURCE },
      ]}
      status="watch"
      coverage={{ available: 4, expected: 6 }}
      derivation={`${EXAMPLE_SOURCE}. The score, the scale and the bands here are invented, and nothing was calculated from anybody.`}
    />
  )
}
