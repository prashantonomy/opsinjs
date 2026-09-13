"use client"

/**
 * `severity="alert"`, which is the form of this component that takes something
 * away and does not give it back until it is answered.
 *
 * FOUR EXITS CLOSE AT ONCE, and they close together or not at all. The role
 * becomes `alertdialog`, the close control is absent, a press on the scrim does
 * nothing, and Escape does not close it. The component swaps Base UI's
 * alert-dialog root in. That is one decision rather than four props a later
 * edit could get three-quarters right.
 *
 * ESCAPE IS REFUSED, AND THE ANSWER TO IT IS INCOMPLETE. The key never closes
 * this dialog. That half holds in every configuration. What it then does is
 * return focus to the last action, which is a response for a reader whose focus
 * had moved into the description or onto the other button, and is nothing at
 * all here: `initialFocus` defaults to `safest`, focus is already on *Use this
 * device*, and focusing the element that already has focus produces no event,
 * no ring and no announcement. Press Escape first, before moving anywhere, and
 * the key is silent.
 *
 * That gap is on the component's page under the things nobody has answered, and
 * it is worth seeing in the example rather than reading about: an alert dialog
 * is the one surface where a reader who cannot see the screen has the least to
 * go on. What the key does NOT do, in any configuration, is produce a sentence
 * about needing an answer, because that sentence is about this product's own
 * two answers and opsinjs does not know what they mean. It belongs in the
 * description, which is why the component warns in development when an alert
 * dialog ships without one.
 *
 * WHY THIS QUESTION QUALIFIES AND ALMOST NONE DO. There is no state of the
 * world in which going away is a valid answer here: recording has to happen on
 * one device or the other, and dismissing the question would leave the product
 * guessing on the reader's behalf. Nearly every dialog a product reaches for
 * fails that test, because the reader could carry on, or there is a safe
 * default. For those the answer is `severity="default"`, or an AlertBanner,
 * which announces without blocking anything.
 *
 * Neither action is destructive, so `initialFocus="safest"` lands on the last
 * one only because something has to be first: here the order carries no risk,
 * and the labels do all the work.
 */

import { useState } from "react"

import { Button } from "@/registry/base-lyra/ui/button"
import { Dialog } from "@/registry/base-lyra/ui/dialog"

export default function DialogAnAnswerIsNeeded() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex w-full max-w-sm flex-col items-start gap-opsin-4">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open the alert dialog
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        severity="alert"
        title="Which device should record your readings?"
        description="Readings can be recorded on one device at a time, and this account is set up on two. Choose one before you carry on. The other will stop recording, and nothing already saved is affected."
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Use the other device
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Use this device
            </Button>
          </>
        }
      />
    </div>
  )
}
