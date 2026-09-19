/**
 * A tooltip labelling an icon-only control, which is the case people reach for a
 * tooltip first. The trigger is a small neutral icon button, and the point of
 * the example is that the name lives in two places at once: the control carries
 * its own `aria-label`, so a screen-reader and a voice-control user get the name
 * whether or not a tooltip ever opens, and the tooltip repeats that name visibly
 * for a reader using a pointer or the keyboard. A touch reader with no assistive
 * technology sees only the glyph, which is why an icon a reader must recognise to
 * use the control belongs beside a word on the surface rather than behind a
 * hover.
 *
 * The triggers are plain focusable buttons rather than the shipped IconButton,
 * because the tooltip renders its child in place and the control has to be the
 * focusable element itself: IconButton wraps its button in a span, and the
 * tooltip would attach its description to the wrapper instead of the control. The
 * labels name fictional actions (ADR 0012): no number, no unit, nothing a
 * screenshot could be mistaken for a reading.
 */

import { CalendarPlus, Share2 } from "lucide-react"

import { Tooltip } from "@/registry/base-lyra/ui/tooltip"

const ICON_BUTTON =
  "inline-flex aspect-square items-center justify-center rounded-opsin-md border border-border bg-card " +
  "min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem) " +
  "[color:var(--foreground)] cursor-pointer " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard hover:bg-state-hover " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

export default function TooltipOnAnIconButton() {
  return (
    <div className="flex items-center gap-opsin-2">
      <Tooltip content="Add to your calendar">
        <button type="button" aria-label="Add to your calendar" className={ICON_BUTTON}>
          <CalendarPlus aria-hidden="true" className="size-[1.25em]" />
        </button>
      </Tooltip>
      <Tooltip content="Share with your team">
        <button type="button" aria-label="Share with your team" className={ICON_BUTTON}>
          <Share2 aria-hidden="true" className="size-[1.25em]" />
        </button>
      </Tooltip>
    </div>
  )
}
