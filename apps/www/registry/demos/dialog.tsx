"use client"

import { useState } from "react"
import { Button, Dialog } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It is an ordinary
 * dialog, because an ordinary dialog is what almost every product actually
 * needs and the demo should not teach the exception first.
 *
 * IT USES THE REAL `Button` for the trigger and both actions, which is why
 * `button` sits in this component's `registryDependencies` even though `Dialog`
 * itself never imports it. An earlier version hand-rolled all three controls so
 * the file a consumer installs would depend on Surface and nothing else. That
 * argument lost, and it lost the way it did for `sheet.tsx`: a demo that styles
 * its own `button` teaches, in the one file a consumer reads first, that an
 * action is a styled element rendered a weight lighter than any real Button, and
 * it teaches it on the surface that decides whether a reading is deleted. The
 * extra dependency is cheaper than that lesson.
 *
 * There is not a number anywhere in it. Dialog renders no measurement, so there
 * is no reading here for anybody to mistake for their own.
 */
export default function DialogDemo() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex w-full max-w-sm flex-col items-start gap-opsin-4">
      <p className="m-0 text-opsin-footnote text-muted-foreground">
        The dialog portals to the end of the document, so it covers the whole
        page rather than this frame. Close it with the close control in its
        header, with the escape key, or by tapping the dimmed area.
      </p>

      <Button variant="secondary" onClick={() => setOpen(true)}>
        Delete this reading
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this reading?"
        description="It will be removed from your history and from any trends it appears in. This cannot be undone."
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Delete reading
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Keep it
            </Button>
          </>
        }
      />
    </div>
  )
}
