"use client"

import { Popover } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It leaves the popover
 * uncontrolled, because uncontrolled is what almost every product actually
 * needs and the demo should not teach the exception first, and it shows a
 * button opening a short note, which is the one thing worth seeing at a glance:
 * that the panel floats as a raised card with an arrow back to its trigger and
 * carries no colour on either axis. Read it in greyscale to check that.
 *
 * There is not a number anywhere in it (ADR 0012). A popover renders no
 * measurement, so there is no reading here for anybody to mistake for their own.
 */
export default function PopoverDemo() {
  return (
    <Popover title="About this list" trigger="What is this?">
      <p className="m-0 [color:var(--foreground)]">
        This is a short, anchored panel. It floats over the page without blocking
        it, and it closes when you press outside it or press Escape.
      </p>
    </Popover>
  )
}
