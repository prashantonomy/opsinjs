"use client"

/**
 * A sheet holding something a reader typed, and the three exits it closes.
 *
 * `dismissible={false}` is the whole example. With it, the scrim, the escape
 * key and a downward drag stop closing the sheet. Those three routes are all
 * reached by accident and all discard what somebody typed without asking.
 * The close control in the header is untouched, because that is the deliberate
 * one, and a modal surface with no way out is a trap rather than a safeguard.
 *
 * WHAT THIS EXAMPLE IS NOT SHOWING, and it matters. A form sheet in a real
 * product would not simply refuse the escape key: it would ask, and the sheet's
 * accessibility contract says the escape key and a tap on the background take
 * the same route to that question. This example takes the simpler of the two
 * paths so that the flag itself is legible. The other path leaves
 * `dismissible` alone, reads the `route` that `onOpenChange` supplies as its
 * second argument, and holds the sheet open while a confirmation is shown.
 *
 * The field is deliberately about nothing. It has a label, a hint and no
 * clinical meaning at all: a sheet is a container, and an example that put a
 * reading in it would be teaching the container by way of a measurement nobody
 * has reviewed.
 */

import { useState } from "react"

import { Button } from "@/registry/base-lyra/ui/button"
import { Field } from "@/registry/base-lyra/ui/field"
import { Sheet } from "@/registry/base-lyra/ui/sheet"

export default function SheetAFormThatStaysPut() {
  const [open, setOpen] = useState(false)
  const [lastRoute, setLastRoute] = useState<string | null>(null)

  return (
    <div className="flex w-full flex-col items-center gap-opsin-4 p-opsin-4">
      <p className="m-0 max-w-sm text-center text-opsin-footnote text-muted-foreground">
        Open it, then try the escape key or a tap on the dimmed area. Neither
        closes it. The close control in the header does.
      </p>

      <Button onClick={() => setOpen(true)}>Open the example form</Button>

      {lastRoute ? (
        <p className="m-0 text-opsin-caption1 text-muted-foreground">
          Last route reported to the product: {lastRoute}
        </p>
      ) : null}

      <Sheet
        open={open}
        dismissible={false}
        title="An example form"
        onOpenChange={(nextOpen, route) => {
          setLastRoute(route)
          setOpen(nextOpen)
        }}
        footer={
          <Button variant="primary" fullWidth onClick={() => setOpen(false)}>
            Save the example
          </Button>
        }
      >
        <Sheet.Content>
          <Field
            label="Example note"
            hint="Anything at all. Nothing here is stored."
          >
            <Field.Control name="example-note" autoComplete="off" />
          </Field>

          <p className="mt-opsin-4 mb-0 text-opsin-footnote text-muted-foreground">
            The action stays below this text rather than after it, so a
            software keyboard cannot cover it and scrolling cannot lose it.
          </p>
        </Sheet.Content>
      </Sheet>
    </div>
  )
}
