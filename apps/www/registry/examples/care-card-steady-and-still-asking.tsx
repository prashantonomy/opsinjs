/**
 * The answer to the question this component's page has been asking since it was
 * a stub: is a steady CareCard a contradiction?
 *
 * It is not, and this is why. `status` describes the reading that prompted the
 * card; `urgency` describes when the reader should do the thing the card is
 * asking of them. A reading can be exactly where it was expected to be and
 * still have a routine next step attached to it — a repeat in six months, a
 * check before a prescription runs out, a photograph of a device screen. That
 * is the commonest care instruction there is and the one products most often
 * forget to build, because they reach for a card only when something has gone
 * wrong.
 *
 * The pair below would be illegal under any mapping between the two
 * vocabularies, which is the argument for there not being one. Nothing here
 * derives either axis from the other, and the card would render the same way if
 * the two disagreed harder.
 *
 * The measurement is deliberately fictional and carries no number at all, and
 * the reason sentence names no range. A CareCard shows neither the reading nor
 * the range it was compared against, so a reason that says a measurement was
 * outside one asks the reader to take an invisible rule on trust — the range
 * belongs on the ResultCard or RangeBar beside the card, not in a sentence here.
 */

import { CareCard } from "@/registry/base-lyra/ui/care-card"

export default function CareCardSteadyAndStillAsking() {
  return (
    <div className="w-full max-w-md">
      <CareCard
        heading="Book your next example check"
        urgency="when-convenient"
        attribution="Your example clinic asks"
        reason="Your example clinic reviews this measurement once a year, and the next check is due."
        status="steady"
        statusOf="your last example reading"
        dueBy="2027-03-01"
        actions={[{ label: "Book a check", href: "#example-booking" }]}
      />
    </div>
  )
}
