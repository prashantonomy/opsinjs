/**
 * A deadline the reader is already behind, and the two controls that go with it.
 *
 * THE DATE IS WRITTEN OUT AND THE VERDICT IS AN INPUT. `dueBy` renders as a
 * calendar date rather than as "3 weeks ago", because a written date means the
 * same thing at one minute to midnight and one minute after it, and a relative
 * phrase does not. `overdue` is a boolean the product supplies for the same
 * reason: working out whether a date is behind somebody needs that person's own
 * time zone, and a card rendered on a server does not have one. So the card
 * says what it was told and nothing more.
 *
 * WHAT THE CARD DOES NOT DO. It does not turn red, grow a warning glyph, or
 * escalate its own urgency because a date went by. A passed deadline is stated
 * in words and left there; deciding what to do about it is the product's, and
 * the product says it by changing the heading. A component that escalated on a
 * timer would be raising the temperature of somebody's health screen on a
 * schedule nobody agreed to.
 *
 * The two actions show the recommended one leading. It is distinguished by
 * position and by fill, not by colour alone.
 */

import { CareCard } from "@/registry/base-lyra/ui/care-card"

export default function CareCardADeadlineThatHasPassed() {
  return (
    <div className="w-full max-w-md">
      <CareCard
        heading="Book the repeat example measurement your clinic asked for"
        urgency="this-week"
        attribution="Your example clinic asks"
        reason="The clinic asked for a repeat by the date below, and this app has not seen one."
        dueBy="2026-01-05"
        overdue
        actions={[
          {
            label: "Book a repeat",
            href: "#example-booking",
            recommended: true,
          },
          { label: "Ask the clinic why", href: "#example-message" },
        ]}
      />
    </div>
  )
}
