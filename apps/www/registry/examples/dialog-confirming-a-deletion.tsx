"use client"

/**
 * The ordinary dialog, doing the only job it is entitled to: asking a question
 * whose answer cannot be guessed and cannot be undone.
 *
 * Three rules are visible here at once.
 *
 * THE TITLE IS THE QUESTION and the description is the consequence of each
 * answer. Neither is "Are you sure?", because a reader answering quickly has a
 * fifty per cent chance of being wrong when the buttons say OK and Cancel and
 * the question says nothing.
 *
 * THE ACTION THAT CHANGES SOMETHING COMES FIRST and the one that changes
 * nothing comes last, because `initialFocus="safest"` lands on the last control
 * in the row. A stray Return key therefore keeps the reading. Reverse the order
 * and the same key destroys it — which is why the order is a rule and not a
 * preference.
 *
 * THE DESTRUCTIVE ACTION IS NOT CARRIED BY COLOUR. opsinjs has no destructive
 * role and does not borrow one from the clinical status axis, so what separates
 * *Delete reading* from *Keep it* is the boundary weight and, mostly, the
 * words. That is the reason its label names what will be deleted.
 *
 * There is no number anywhere in this example. Nothing on the screen could be
 * mistaken for somebody's own result.
 */

import { useState } from "react"

import { Button } from "@/registry/base-lyra/ui/button"
import { Dialog } from "@/registry/base-lyra/ui/dialog"

export default function DialogConfirmingADeletion() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex w-full max-w-sm flex-col items-start gap-opsin-4">
      <p className="m-0 text-opsin-body text-muted-foreground">
        An example measurement, recorded by hand.
      </p>

      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete this reading
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this reading?"
        description="It will be removed from your history and from any trends it appears in. There is no way to bring it back."
        actions={
          <>
            <Button variant="destructive" onClick={() => setOpen(false)}>
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
