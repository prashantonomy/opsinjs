/**
 * A tooltip carrying a supplementary hint beside a label that already stands on
 * its own. The field is named in plain words on the surface, so a touch reader
 * knows what it is without any hover; the tooltip adds a second, optional
 * sentence for a reader using a pointer or the keyboard who wants it. This is the
 * honest shape for a tooltip in a phone-first system: the essential label is on
 * screen, and the tooltip holds only the note a reader can do without.
 *
 * The trigger is a small focusable button carrying an information glyph and its
 * own accessible name, so a screen-reader user reaches the same hint the pointer
 * reader reaches, and the visible label beside it is never the thing the tooltip
 * has to explain. The copy names a fictional preference rather than measuring
 * anybody (ADR 0012): no number, no unit, no reading.
 */

import { Info } from "lucide-react"

import { Tooltip } from "@/registry/base-lyra/ui/tooltip"

export default function TooltipASupplementaryHint() {
  return (
    <div className="inline-flex items-center gap-opsin-2 text-opsin-body [color:var(--foreground)]">
      <span>Quiet hours</span>
      <Tooltip content="Reminders wait until the morning during the hours you set here.">
        <button
          type="button"
          aria-label="About quiet hours"
          className={
            "inline-flex aspect-square items-center justify-center rounded-full border border-border bg-card " +
            "min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem) " +
            "[color:var(--muted-foreground)] cursor-pointer " +
            "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard hover:bg-state-hover " +
            "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"
          }
        >
          <Info aria-hidden="true" className="size-[1.25em]" />
        </button>
      </Tooltip>
    </div>
  )
}
