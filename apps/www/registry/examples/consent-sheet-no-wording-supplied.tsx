"use client"

/**
 * The state a product is most likely to ship by accident.
 *
 * The sheet below is given a heading and a purpose and nothing else: no scope,
 * no withdrawal sentence, and no words for the two controls. That is not a
 * contrived shape. It is what `{copy.consent.retention}` resolves to when a
 * content service has a field nobody filled in, what a translation table
 * returns for a locale that was added last week, and what `{isReviewed && "…"}`
 * evaluates to on the day a review lapses — and in every one of those cases the
 * TypeScript is still correct.
 *
 * So the component does not ask. It draws no decision controls, says on screen
 * that nothing was asked, and calls nothing. Every other absence in this system
 * renders a gap and carries on; this one refuses, because the alternative is a
 * stored record saying somebody agreed to something the interface never told
 * them, and that is the one outcome nobody can undo afterwards.
 *
 * It fails towards no consent, which is a state every product using this
 * component already has to support: refusal is a real option, and a product
 * that breaks without a yes was never offering a choice.
 *
 * Open the browser console. The component names exactly which pieces were
 * missing, which is the half of this that an author acts on.
 */

import { useState } from "react"

import { Button } from "@/registry/base-lyra/ui/button"
import { ConsentSheet } from "@/registry/base-lyra/ui/consent-sheet"

/* Empty strings rather than omitted keys, because that is how the wording
   actually goes missing — a field that exists and has nothing in it. The
   component treats a whitespace-only string as missing for the same reason. */
const NOTHING_SUPPLIED = {
  collected: "",
  sharedWith: "",
  retention: "",
}

export default function ConsentSheetNoWordingSupplied() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex w-full flex-col items-center gap-opsin-4 p-opsin-4">
      <p className="m-0 max-w-sm text-center text-opsin-footnote text-muted-foreground">
        This sheet was given a question and no answer to it: no scope, no
        withdrawal sentence, no words on the controls. It refuses to ask rather
        than asking half a question.
      </p>

      <Button onClick={() => setOpen(true)}>Open the incomplete sheet</Button>

      <ConsentSheet
        open={open}
        onOpenChange={(nextOpen) => setOpen(nextOpen)}
        consentId="example-consent-incomplete"
        textVersion="example-wording-0"
        heading="Placeholder question — is this the example thing?"
        purpose="Placeholder for the purpose. Everything after this line was left empty on purpose."
        scope={NOTHING_SUPPLIED}
        withdrawalPath=""
        acceptLabel=""
        declineLabel=""
        onDecision={() => {
          /* Unreachable while the wording is missing: there are no controls to
             press, and nothing else in the component calls this. It is written
             out rather than left as a bare arrow so that the claim is legible
             from the example itself. */
        }}
      />
    </div>
  )
}
