"use client"

import { Accordion } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows a short set of
 * questions and answers with the first section open, which is the one thing
 * worth seeing at a glance: the headers read as an index a reader scans before
 * opening any panel, and the open section is lifted by nothing more than its
 * revealed content and the turned chevron. Read it in greyscale to check that
 * no colour is doing the work.
 *
 * The content is a fictional set of app questions (ADR 0012). No reading, no unit
 * and no clinical instruction, and nothing a reader would be harmed by not
 * opening, because a demo of a disclosure must not itself hide something that
 * ought to stay in view.
 */
export default function AccordionDemo() {
  return (
    <Accordion
      className="w-full max-w-md"
      defaultValue={["hours"]}
      items={[
        {
          value: "hours",
          title: "When can I reach the team?",
          content:
            "The example clinic in this demo answers messages on weekday mornings. This is placeholder copy, not a real opening time.",
        },
        {
          value: "records",
          title: "Where are my saved notes kept?",
          content:
            "Notes in this fictional app live on the device until you choose to share them. No real record is shown anywhere in this preview.",
        },
        {
          value: "export",
          title: "Can I export what I have entered?",
          content:
            "An export button would sit on the summary screen of the imagined app. This answer is sample text for the disclosure pattern only.",
        },
      ]}
    />
  )
}
