"use client"

/**
 * The case the component was built for: a button opens a small panel of text
 * anchored back to it.
 *
 * The popover is left uncontrolled, because the product stores nothing here. The
 * button opens the panel, a press outside or the Escape key closes it, and focus
 * returns to the button either way. The panel floats over the page in a portal
 * rather than pushing the layout around, and it never blocks the page behind it,
 * which is the line that keeps a popover apart from a dialog.
 *
 * There is no reading in the panel (ADR 0012). A screenshot of an opsinjs example
 * must never be mistakable for somebody's own data, so the panel holds an
 * explanation and nothing that looks like a measurement.
 */

import { Popover } from "@/registry/base-lyra/ui/popover"

export default function PopoverAnchoredToAButton() {
  return (
    <div className="flex w-full max-w-sm justify-start">
      <Popover title="How readings are grouped" trigger="Why two lists?">
        <p className="m-0 [color:var(--foreground)]">
          Entries you add yourself sit in one list, and entries brought in from a
          connected device sit in another, so you can always tell which is which.
          You can move an entry between them at any time.
        </p>
      </Popover>
    </div>
  )
}
