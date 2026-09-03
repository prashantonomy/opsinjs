"use client"

/**
 * Two permissions, two sheets, and a reader who can say yes to one of them.
 *
 * There is no `purposes` array on this component and no per-item switch, so
 * this is what asking for two things looks like: two `ConsentSheet`s, two ids,
 * two versions, two records. The reader below can grant the first and refuse
 * the second, which is the whole of what "granular" means — and it is the thing
 * a single sheet with two paragraphs and one control makes impossible, because
 * the person who would have said yes to one of them has been given no way to
 * say so.
 *
 * The second sheet opens after the first closes rather than on top of it. A
 * Sheet inside a Sheet is a composition error with its own development warning:
 * two stacked modal surfaces produce a focus order nobody can predict and an
 * escape key with two plausible meanings. In a real product the two would be
 * further apart than this — each asked at the moment it becomes relevant, which
 * is what makes the question answerable at all — and this example puts them on
 * one surface only because a documentation page has one surface.
 *
 * The second question also shows `consequenceOfDeclining`, which is stated
 * before the reader chooses rather than raised as a confirmation after they
 * refuse. A product that cannot function after a refusal says so here; a
 * product that can says nothing, which is why the prop is optional and why
 * nothing is invented in its place.
 *
 * Every word in both sheets is placeholder text that says so of itself.
 */

import { useState } from "react"

import { Button } from "@/registry/base-lyra/ui/button"
import { ConsentSheet } from "@/registry/base-lyra/ui/consent-sheet"

const FIRST_SCOPE = {
  collected: "Placeholder for what the first question collects.",
  sharedWith: "Placeholder for who can see it.",
  retention: "Placeholder for how long it is kept.",
}

const SECOND_SCOPE = {
  collected: "Placeholder for what the second question collects — a different thing.",
  sharedWith: "Placeholder for who can see it — a different recipient.",
  retention: "Placeholder for how long it is kept — a different period.",
}

export default function ConsentSheetTwoQuestionsTwoSheets() {
  const [asking, setAsking] = useState<"none" | "first" | "second">("none")
  const [answers, setAnswers] = useState<Record<string, string>>({})

  return (
    <div className="flex w-full flex-col items-center gap-opsin-4 p-opsin-4">
      <p className="m-0 max-w-sm text-center text-opsin-footnote text-muted-foreground">
        Two separate questions, asked one after the other. Answer them
        differently — the point of asking twice is that the two answers do not
        have to match.
      </p>

      <Button onClick={() => setAsking("first")}>Ask both example questions</Button>

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
          /* A close without an answer is not an answer, so nothing is recorded
             for it — and the second question is still asked, because refusing
             or ignoring the first has no bearing on whether the reader wants to
             be asked the second. */
          if (!nextOpen) setAsking("second")
        }}
        consentId="example-consent-first"
        textVersion="example-wording-0"
        heading="Placeholder question one — is this the first example thing?"
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
          setAsking("second")
        }}
      />

      <ConsentSheet
        open={asking === "second"}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setAsking("none")
        }}
        consentId="example-consent-second"
        textVersion="example-wording-0"
        heading="Placeholder question two — is this the second example thing?"
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
        }}
      />
    </div>
  )
}
