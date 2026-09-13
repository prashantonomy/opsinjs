"use client"

/**
 * What the product is handed, and what it is not.
 *
 * This is the example the whole component exists for. Press one of the two
 * controls and a record arrives: a decision, a timestamp, the id, the version
 * of the wording that was on screen, and the scope as it was shown. Leave by
 * the escape key, by a tap on the dimmed area, by a drag, or by the close
 * control in the header, and NOTHING arrives. The product is handed no
 * record, no `false`, and no call at all.
 *
 * That asymmetry is the point rather than an implementation detail. `granted`
 * is a boolean with two values and a consent has three states: agreed, refused,
 * and not answered. The third one is spelled as the absence of a call, because
 * a boolean that could also mean "did not answer" is a boolean somebody will
 * store as `false`. A refusal nobody made is a record about a person that is
 * not true.
 *
 * The close route arrives on `onOpenChange`, which is Sheet's rather than this
 * component's, and its second argument says how the reader left. The log below
 * prints both channels side by side so the difference is visible rather than
 * described.
 *
 * Every word in the sheet is placeholder text that says so of itself. opsinjs
 * ships no consent wording, and an example is not the place it starts.
 */

import { useState } from "react"

import { Button } from "@/registry/base-lyra/ui/button"
import { ConsentSheet } from "@/registry/base-lyra/ui/consent-sheet"

const EXAMPLE_SCOPE = {
  collected: "Placeholder for what is collected. The product writes this line.",
  sharedWith: "Placeholder for who can see it. The product writes this line.",
  retention: "Placeholder for how long it is kept. The product writes this line.",
}

export default function ConsentSheetClosingIsNotConsent() {
  const [open, setOpen] = useState(false)
  const [log, setLog] = useState<string[]>([])

  function record(line: string) {
    /* Newest first, and the list is bounded so a demo left open in a docs tab
       does not grow without end. */
    setLog((current) => [line, ...current].slice(0, 5))
  }

  return (
    <div className="flex w-full flex-col items-center gap-opsin-4 p-opsin-4">
      <p className="m-0 max-w-sm text-center text-opsin-footnote text-muted-foreground">
        Open it and leave without answering. Try the escape key, the dimmed
        area, or the close control in the header. Then open it again and press
        one of the two controls. Only the second produces a record.
      </p>

      <Button onClick={() => setOpen(true)}>Open the example question</Button>

      <ul className="m-0 flex w-full max-w-md list-none flex-col gap-opsin-1 p-0 text-opsin-caption1 text-muted-foreground">
        {log.length === 0 ? (
          <li>Nothing has reached the product yet.</li>
        ) : (
          log.map((line, index) => (
            <li key={`${line}-${String(index)}`} className="wrap-break-word">
              {line}
            </li>
          ))
        )}
      </ul>

      <ConsentSheet
        open={open}
        onOpenChange={(nextOpen, route) => {
          if (!nextOpen) {
            record(`closed by ${route} without onDecision being called`)
          }
          setOpen(nextOpen)
        }}
        consentId="example-consent"
        textVersion="example-wording-0"
        heading="Placeholder question. Is this the example thing?"
        purpose="Placeholder for the purpose. In a product this sentence says what the reader gets, in their own words."
        scope={EXAMPLE_SCOPE}
        withdrawalPath="Placeholder for where a reader changes this later. In a product it names the screen."
        acceptLabel="Yes, to the example thing"
        declineLabel="No, not the example thing"
        onDecision={(decision) => {
          record(
            `onDecision · ${decision.granted ? "granted" : "declined"} · ${decision.consentId} · ${decision.textVersion} · ${decision.at}`,
          )
          /* The component does not close itself, for the same reason Sheet does
             not: `open` is the caller's, so a product can show what happens next
             before the surface goes away. Here there is nothing next, so it
             closes immediately. */
          setOpen(false)
        }}
      />
    </div>
  )
}
