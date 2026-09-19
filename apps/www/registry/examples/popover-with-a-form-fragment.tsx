"use client"

/**
 * A small form fragment inside a popover: one labelled input and a button that
 * saves and closes.
 *
 * This example takes the open state over, because it has to close the panel from a
 * control inside it. `open` and `onOpenChange` are passed to the component, the
 * Save button calls back to close, and the trigger and the Escape key still work
 * the way they do when the popover owns its own state. That is the whole reason
 * both paths exist: a panel a reader only opens and reads can stay uncontrolled,
 * and a panel with an action inside it takes control.
 *
 * The field is a plain nickname for a list, which is neutral content a product
 * owns (ADR 0012). There is no reading, no unit and no clinical value anywhere in
 * it: a form fragment in a popover is for a small piece of product state, not for
 * a measurement that needs a range and a verdict.
 */

import { useState } from "react"

import { Popover } from "@/registry/base-lyra/ui/popover"

const INPUT =
  "w-full rounded-opsin-md border border-border bg-background " +
  "px-opsin-3 py-opsin-2 min-h-(--opsin-target-minimum,2.75rem) " +
  "text-opsin-body [color:var(--foreground)] " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

const SAVE =
  "inline-flex items-center justify-center rounded-opsin-md border border-border bg-muted " +
  "px-opsin-3 py-opsin-2 min-h-(--opsin-target-minimum,2.75rem) " +
  "text-opsin-body [color:var(--foreground)] cursor-pointer " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard hover:bg-state-hover " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

export default function PopoverWithAFormFragment() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex w-full max-w-sm justify-start">
      <Popover
        open={open}
        onOpenChange={setOpen}
        title="Rename this list"
        trigger="Rename"
      >
        <form
          className="flex w-64 max-w-full flex-col gap-opsin-3"
          onSubmit={(event) => {
            event.preventDefault()
            setOpen(false)
          }}
        >
          <label className="flex flex-col gap-opsin-1">
            <span className="text-opsin-footnote [color:var(--muted-foreground)]">
              List name
            </span>
            <input
              className={INPUT}
              type="text"
              defaultValue="Morning entries"
              autoComplete="off"
            />
          </label>
          <button type="submit" className={SAVE}>
            Save name
          </button>
        </form>
      </Popover>
    </div>
  )
}
