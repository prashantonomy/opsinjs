"use client"

import { Tooltip, cn } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. The trigger is a
 * labelled control, not an icon alone, so the one thing worth seeing at a
 * glance is the honest use of the component: the button already says what it
 * is, and the tooltip adds a supplementary note a touch reader can do without.
 * Read it with the keyboard as well as the pointer, because Tab is the path a
 * phone reader does not have.
 *
 * The trigger carries its own 44pt target floor and its own focus ring rather
 * than borrowing the shipped Button, because a base component may not import
 * another registry component and the demo has to show a focusable control
 * anyway. There is no number and no reading in it (ADR 0012): the label names a
 * fictional summary rather than measuring anybody.
 */
export default function TooltipDemo() {
  return (
    <Tooltip content="A rolling mean across the nights you have logged.">
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-opsin-2 rounded-full border border-border bg-card",
          "px-opsin-3 py-opsin-2 min-h-(--opsin-target-minimum,2.75rem)",
          "text-opsin-body [color:var(--foreground)] cursor-pointer",
          "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard",
          "hover:bg-state-hover",
          "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring",
        )}
      >
        Overnight average
      </button>
    </Tooltip>
  )
}
