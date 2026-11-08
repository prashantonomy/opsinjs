import { Spinner } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows the canonical
 * pattern, a ring beside a visible word, in the muted neutral tone the ring
 * takes from its surroundings, which is the one thing worth seeing at a glance:
 * a spinner is a quiet piece of status, not a status colour. The visible
 * "Loading" is the product's own caption; the ring carries its own hidden copy
 * for a screen reader. No number, no unit and no reading anybody could mistake
 * for their own (ADR 0012): a spinner names a wait, never a measurement.
 */
export default function SpinnerDemo() {
  return (
    <span className="inline-flex items-center gap-opsin-2 text-muted-foreground">
      <Spinner label="Loading" />
      <span className="text-opsin-subheadline">Loading</span>
    </span>
  )
}
