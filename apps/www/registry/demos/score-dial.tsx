import { EXAMPLE_SOURCE, ScoreDial } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. That is why it has no
 * bands. An earlier version of this function, from when opsinjs shipped as a
 * shadcn registry, shipped three of them, with a level mapped to the middle
 * one, on the exact scale and score shape every consumer wellness index uses: a
 * score interpretation with no clinical owner, copied verbatim into every
 * project that ran `shadcn add score-dial`, and served as text at
 * /r/score-dial.json to programs that read it as fact. ADR 0012 forbids exactly
 * that, "not even as an example".
 *
 * So the demo shows the refusal instead, which is the most important thing this
 * component does. The scale is ten to twenty and the score is fourteen, which
 * is ADR 0012's own shape for a number nobody could mistake for their own.
 */
export default function ScoreDialDemo() {
  return (
    <ScoreDial
      label="Example composite score"
      value={14}
      min={10}
      max={20}
      precision={0}
      bands={[]}
      calculatedAt="2026-03-14T08:12:00+00:00"
      derivation={`${EXAMPLE_SOURCE}. The score and the scale here are invented, nothing was calculated from anybody, and no named ranges are supplied because opsinjs has none to supply.`}
    />
  )
}
