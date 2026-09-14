"use client"

/**
 * Two permissions, two sheets, and a reader who can say yes to one of them.
 *
 * There is no `purposes` array on this component and no per-item switch, so
 * this is what asking for two things looks like: two `ConsentSheet`s, two ids,
 * two versions, two records. The reader below can grant the first and refuse
 * the second, which is the whole of what "granular" means. A single sheet with
 * two paragraphs and one control makes it impossible, because the person who
 * would have said yes to one of them has been given no way to say so.
 *
 * The second sheet opens after the first is answered, not on top of it and not
 * when the first is dismissed. Leaving question one, by escape, by the scrim or
 * by its close control, returns the reader to the page rather than to another
 * request. That is the shape the component exists to hold: a reader who taps
 * the dim area to get away from a permission request must get away from it, and
 * an example that raised the next question on a dismissal would teach the "you
 * cannot get out" pattern the component was built to refuse. A Sheet inside a
 * Sheet is a composition error with its own development warning, so the two are
 * never stacked. In a real product they would be further apart than this, each
 * asked at the moment it becomes relevant, which is what makes the question
 * answerable at all. This example puts them on one surface only because a
 * documentation page has one surface.
 *
 * The second question also shows `consequenceOfDeclining`, which is stated
 * before the reader chooses rather than raised as a confirmation after they
 * refuse. A product that cannot function after a refusal says so here; a
 * product that can says nothing, which is why the prop is optional and why
 * nothing is invented in its place.
 *
 * Every word in both sheets is placeholder text that says so of itself.
 */

import { useEffect, useRef, useState } from "react"

import { Button } from "@/registry/base-lyra/ui/button"
import { ConsentSheet } from "@/registry/base-lyra/ui/consent-sheet"

const FIRST_SCOPE = {
  collected: "Placeholder for what the first question collects.",
  sharedWith: "Placeholder for who can see it.",
  retention: "Placeholder for how long it is kept.",
}

const SECOND_SCOPE = {
  collected: "Placeholder for what the second question collects. This is a different thing.",
  sharedWith: "Placeholder for who can see it. This is a different recipient.",
  retention: "Placeholder for how long it is kept. This is a different period.",
}

export default function ConsentSheetTwoQuestionsTwoSheets() {
  const [asking, setAsking] = useState<"none" | "first" | "second">("none")
  const [answers, setAnswers] = useState<Record<string, string>>({})
  /* A sheet opened by a control returns focus to that control on its own. This
     one cannot, because by the time the last sheet closes the reader may have
     been through two of them and nothing they focused opened the second. So the
     return is written out. A counter rather than a boolean, because the reader
     can go through this more than once and a flag already `true` would not
     re-run the effect. */
  const triggerRef = useRef<HTMLDivElement>(null)
  const [returns, setReturns] = useState(0)
  /* Whether the first sheet closed because it was answered rather than because
     the reader left. It is a ref and not state, because the only reader of it is
     the first sheet's `onOpenChange`, which must not trigger a render of its own,
     and because it has to be set inside an event handler and read in the same
     handler without a re-render between the two. */
  const answeredRef = useRef(false)

  useEffect(() => {
    if (returns === 0) return
    triggerRef.current?.querySelector("button")?.focus()
  }, [returns])

  return (
    <div className="flex w-full flex-col items-center gap-opsin-4 p-opsin-4">
      <p className="m-0 max-w-sm text-center text-opsin-footnote text-muted-foreground">
        Two separate questions, asked one after the other. Answer them
        differently. The point of asking twice is that the two answers do not
        have to match.
      </p>

      {/* The trigger is read out of a wrapper rather than through a `ref` on
          Button, because `ButtonProps` omits `ref`: it extends the element's
          HTML attributes, and `ref` lives on `RefAttributes`. ConsentSheet
          reads its decision controls out of a wrapper for the same reason. */}
      <div ref={triggerRef}>
        <Button onClick={() => setAsking("first")}>Ask both example questions</Button>
      </div>

      <ul className="m-0 flex w-full max-w-md list-none flex-col gap-opsin-1 p-0 text-opsin-caption1 text-muted-foreground">
        {Object.keys(answers).length === 0 ? (
          <li>No answers yet.</li>
        ) : (
          Object.entries(answers).map(([id, verdict]) => (
            <li key={id} className="wrap-break-word">
              {id}: {verdict}
            </li>
          ))
        )}
      </ul>

      <ConsentSheet
        open={asking === "first"}
        onOpenChange={(nextOpen) => {
          if (nextOpen) return
          /* A close without an answer is not an answer, and it is not
             permission to ask the next thing either, so the reader is returned
             to the page. Telling "closed because it was answered" from "closed
             because the reader left" must not go through a state updater:
             React runs an updater twice in development StrictMode, so a
             `setReturns` called from inside one would count every dismissal
             twice. The answered case is recorded in a ref instead. Pressing a
             control runs `onDecision` first, which sets `answeredRef` and then
             `asking` to "second", thereby closing this sheet and firing
             `onOpenChange(false)` with the ref already true, so this handler
             consumes the flag and skips the return. A close the reader drove
             leaves the ref false and returns them to the page. A reader who
             wants question two can press the trigger again; in a real product
             it would be asked at the moment it became relevant. */
          if (answeredRef.current) {
            answeredRef.current = false
            return
          }
          setAsking("none")
          setReturns((count) => count + 1)
        }}
        consentId="example-consent-first"
        textVersion="example-wording-0"
        heading="Placeholder question one. Is this the first example thing?"
        purpose="Placeholder for the first purpose. In a product this sentence says what the reader gets."
        scope={FIRST_SCOPE}
        withdrawalPath="Placeholder for where a reader changes this first decision later."
        acceptLabel="Yes, to the first example thing"
        declineLabel="No, not the first example thing"
        onDecision={(decision) => {
          setAnswers((current) => ({
            ...current,
            [decision.consentId]: decision.granted ? "granted" : "declined",
          }))
          /* Record that this close is an answer before opening the next sheet,
             so the `onOpenChange` this triggers does not treat it as the reader
             leaving and does not return focus while the second sheet is opening. */
          answeredRef.current = true
          setAsking("second")
        }}
      />

      <ConsentSheet
        open={asking === "second"}
        onOpenChange={(nextOpen) => {
          if (nextOpen) return
          setAsking("none")
          setReturns((count) => count + 1)
        }}
        consentId="example-consent-second"
        textVersion="example-wording-0"
        heading="Placeholder question two. Is this the second example thing?"
        purpose="Placeholder for the second purpose, which is a different purpose and therefore a different question."
        scope={SECOND_SCOPE}
        withdrawalPath="Placeholder for where a reader changes this second decision later."
        consequenceOfDeclining="Placeholder for what a reader loses by saying no to this one. It is stated here, before they choose, and never raised as a confirmation afterwards."
        acceptLabel="Yes, to the second example thing"
        declineLabel="No, not the second example thing"
        onDecision={(decision) => {
          setAnswers((current) => ({
            ...current,
            [decision.consentId]: decision.granted ? "granted" : "declined",
          }))
          setAsking("none")
          setReturns((count) => count + 1)
        }}
      />
    </div>
  )
}
