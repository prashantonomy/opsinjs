"use client"

import { useState } from "react"
import { Button, ConsentSheet } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo.
 *
 * EVERY WORD BELOW IS OBVIOUSLY SYNTHETIC AND SAYS SO OF ITSELF. It is not
 * consent wording, it is not a draft of any, and it is not a starting point:
 * each sentence is about this example rather than about any product, so that a
 * reader who copies this file has copied nothing usable and an author who
 * screenshots it has screenshotted nothing quotable (ADR 0012). No purpose, no
 * data category, no recipient, no retention period, no jurisdiction and no
 * regulator appears anywhere in it.
 *
 * The two control labels are deliberately not outcome-naming, which is the one
 * rule this demo breaks and it breaks it knowingly: naming an outcome would
 * mean inventing a purpose, and a purpose invented here is the exact thing the
 * component refuses to ship. What a real pair looks like is on the page, under
 * Content guidelines, written by a product rather than by this file.
 */
export default function ConsentSheetDemo() {
  const [open, setOpen] = useState(false)
  const [lastDecision, setLastDecision] = useState<string | null>(null)

  return (
    <div className="flex w-full flex-col items-center gap-opsin-4 p-opsin-4">
      <p className="m-0 max-w-sm text-center text-opsin-footnote text-muted-foreground">
        The sheet portals to the end of the document, so it covers the whole page
        rather than this frame. Both controls are the same size; closing it
        without pressing either records nothing at all.
      </p>

      <Button onClick={() => setOpen(true)}>Open the example sheet</Button>

      {lastDecision ? (
        <p className="m-0 text-opsin-caption1 text-muted-foreground">
          Last thing handed to the product: {lastDecision}
        </p>
      ) : null}

      <ConsentSheet
        open={open}
        onOpenChange={(nextOpen) => setOpen(nextOpen)}
        consentId="example-consent"
        textVersion="example-wording-0"
        heading="Is this placeholder the example thing?"
        purpose="Placeholder for the purpose. A product writes this sentence itself; opsinjs ships no consent wording of any kind, including this one."
        scope={{
          collected: "Placeholder for what is collected. opsinjs does not supply this sentence.",
          sharedWith: "Placeholder for who can see it. opsinjs does not supply this sentence.",
          retention: "Placeholder for how long it is kept. opsinjs does not supply this sentence.",
        }}
        withdrawalPath="Placeholder for where a reader changes this later. opsinjs does not supply this sentence either."
        details={{
          label: "Read the placeholder wording",
          content:
            "Placeholder for the full text. In a product this is the whole statement, disclosed here rather than behind a link to somewhere else.",
        }}
        acceptLabel="Yes, to the example thing"
        declineLabel="No, not the example thing"
        onDecision={(decision) => {
          setLastDecision(
            `${decision.granted ? "granted" : "declined"} · ${decision.consentId} · ${decision.textVersion}`,
          )
          setOpen(false)
        }}
      />
    </div>
  )
}
