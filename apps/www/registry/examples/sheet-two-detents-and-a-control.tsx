"use client"

/**
 * Two rest positions, and the control that reaches the second one without a
 * drag.
 *
 * THE RULE THIS DEMONSTRATES is the one that costs the most to hold: every
 * gesture has a control. Drag-between-detents does not exist for a keyboard
 * user, a switch user, or anybody whose grip makes a precise drag unreliable,
 * so the grabber is not decoration here — it is a real button with a real
 * accessible name that says which height it moves to next. Tab into the sheet
 * and press it: the sheet travels between half and full without a pointer ever
 * touching it.
 *
 * The rows are there to give the content something to scroll, and the scrolling
 * is the second thing worth watching. A flick that starts inside
 * `Sheet.Content` scrolls the list; the same flick started on the header or the
 * grabber drags the sheet. That distinction is what stops a reader losing their
 * place every time they try to scroll a long list, and it is why the content is
 * wrapped rather than dropped in loose.
 *
 * Nothing in the list is a measurement. Twelve rows of a fictional label,
 * numbered so they can be told apart, and not one of them is a reading.
 */

import { useState } from "react"

import { Button } from "@/registry/base-lyra/ui/button"
import { Sheet } from "@/registry/base-lyra/ui/sheet"

const ROWS = Array.from({ length: 12 }, (unused, index) => ({
  id: `row-${index + 1}`,
  label: `Example item ${index + 1}`,
}))

export default function SheetTwoDetentsAndAControl() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex w-full flex-col items-center gap-opsin-4 p-opsin-4">
      <p className="m-0 max-w-sm text-center text-opsin-footnote text-muted-foreground">
        The sheet opens at half the screen. The bar at the top is a button:
        press it, or tab to it and press Enter, to move to the full screen and
        back.
      </p>

      <Button onClick={() => setOpen(true)}>Open the example list</Button>

      <Sheet
        open={open}
        onOpenChange={(nextOpen) => setOpen(nextOpen)}
        title="An example list"
        detents={["half", "full"]}
        footer={
          <Button variant="quiet" fullWidth onClick={() => setOpen(false)}>
            Leave the example list
          </Button>
        }
      >
        <Sheet.Content>
          <ul className="m-0 flex list-none flex-col p-0">
            {ROWS.map((row) => (
              <li
                key={row.id}
                className="border-b border-border py-opsin-3 text-opsin-body last:border-b-0"
              >
                {row.label}
              </li>
            ))}
          </ul>
        </Sheet.Content>
      </Sheet>
    </div>
  )
}
