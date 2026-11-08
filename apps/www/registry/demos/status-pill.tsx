import { StatusPill } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows all four levels
 * because the one thing a reader needs to see about this component is that the
 * four are distinguishable without colour. That is also why the page's preview
 * is worth looking at in greyscale.
 *
 * It shows the four levels and nothing else. Size is demonstrated in the
 * labelled sizes example embedded on the component page, not here: a public
 * demo that the component's page shows first should not carry an unlabelled
 * sample a reader has to decode, and a lone smaller pill beside the four reads
 * as a stray repeat rather than a size sample.
 *
 * The subjects are deliberately unreal (ADR 0012). No number, no unit, no
 * measurement anybody could mistake for their own.
 */
export default function StatusPillDemo() {
  return (
    <div className="flex flex-wrap items-center gap-opsin-3">
      <StatusPill status="steady" describes="example measurement" />
      <StatusPill status="watch" describes="example measurement" />
      <StatusPill status="attention" describes="example measurement" />
      <StatusPill status="urgent" describes="example measurement" />
    </div>
  )
}
