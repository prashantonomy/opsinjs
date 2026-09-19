/**
 * A short list of questions and answers, which is the case Accordion was built
 * for. The reader scans the headers first as an index, then opens the one they
 * want. Every question and answer is fictional app copy (ADR 0012): no reading,
 * no unit, no clinical instruction, and nothing a reader would be harmed by
 * leaving closed, because a disclosure must not hide something that has to stay
 * in view.
 */

import { Accordion } from "@/registry/base-lyra/ui/accordion"

export default function AccordionFrequentlyAsked() {
  return (
    <Accordion
      className="w-full max-w-md"
      items={[
        {
          value: "sync",
          title: "Does the example app work offline?",
          content:
            "This imagined app keeps your entries on the device and syncs them when a connection returns. This is placeholder copy for the pattern, not a real feature.",
        },
        {
          value: "share",
          title: "Who can see what I add?",
          content:
            "Only you, until you choose to share a summary. No real data is shown in this preview; the answer is sample text.",
        },
        {
          value: "delete",
          title: "How do I remove an entry?",
          content:
            "A delete action would sit beside each row on the list screen of the fictional app. This answer exists to fill the panel, nothing more.",
        },
      ]}
    />
  )
}
