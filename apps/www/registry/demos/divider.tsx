import { Divider } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows the three forms
 * worth seeing at a glance, a plain rule, a labelled rule and a vertical rule,
 * triggers no development warning, and carries no number, no unit and no
 * interactive element (ADR 0012): every string is a fictional label, not a
 * reading.
 */
export default function DividerDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-opsin-4">
      <p className="m-0 text-opsin-body [color:var(--foreground)]">
        A plain rule between two groups.
      </p>
      <Divider />
      <p className="m-0 text-opsin-body [color:var(--foreground)]">
        A labelled rule marks a named boundary.
      </p>
      <Divider label="Earlier" />
      <div className="flex items-center gap-opsin-3 text-opsin-footnote [color:var(--muted-foreground)]">
        <span>Left group</span>
        <Divider orientation="vertical" />
        <span>Right group</span>
      </div>
    </div>
  )
}
