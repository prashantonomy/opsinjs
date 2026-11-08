import { CareCard, CareUrgency } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It is a controlled
 * comparison and not a feature tour: the three cards are stacked one under the
 * other and are identical in every part except for `urgency`, so the only thing
 * that differs on screen is one sentence. The parts are the heading, the
 * author, the reason and the action. That is the one claim on this component
 * worth checking rather than believing, and it is checkable here because
 * nothing else is allowed to vary. Open it in greyscale and nothing is lost.
 *
 * NO DEADLINE HERE, DELIBERATELY. `dueBy` and `urgency` are independent inputs
 * and this file derives neither from the other, so a fixed calendar date beside
 * a relative phrase will disagree with it as soon as the date is far enough
 * away. A demo that ships into other repositories is the worst place to
 * teach that pairing. The deadline has its own example, where it is the
 * subject and the disagreement cannot arise.
 *
 * No status pill and no urgent anything. The escalation budget is one urgent
 * surface per screen, and a demo that spent it would be teaching the wrong
 * lesson in the first thing anybody sees. The instructions and the authors are
 * deliberately fictional (ADR 0012): no real measurement, no real clinic, no
 * number anybody could mistake for their own, and no sentence that compares a
 * reading to a range this card cannot show.
 */
export default function CareCardDemo() {
  const timings: CareUrgency[] = ["when-convenient", "this-week", "today"]

  return (
    <div className="gap-opsin-4 flex w-full max-w-md flex-col">
      {timings.map((urgency) => (
        <CareCard
          key={urgency}
          heading="Book a repeat of the example measurement"
          urgency={urgency}
          attribution="Your example clinic asks"
          reason="The clinic asked for a repeat when it last looked at this example measurement."
          actions={[{ label: "Book a repeat", href: "#example" }]}
        />
      ))}
    </div>
  )
}
