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
 * the product says it by changing the heading. This example is that change: the
 * heading names the passed date in the product's own words rather than reading
 * as though the date were still ahead. A component that escalated on a timer
 * would be raising the temperature of somebody's health screen on a schedule
 * nobody agreed to.
 *
 * IT SETS NO `urgency`. The date is the timing here, and a relative phrase
 * beside a date long gone is two timings on one card that can disagree. So the
 * card carries the deadline alone and lets it be the one timing.
 *
 * The two actions show the recommended one leading. It is distinguished by
 * position and by fill, not by colour alone.
 *
 * THE `locale` IS EXPLICIT. Without it the date is written in the runtime's
 * default locale, and on a server-rendered card that default is the server's
 * locale rather than the reader's. A date such as 05/01 is genuinely ambiguous
 * between the day-first and month-first orders, so this example names en-GB and
 * leaves nothing about a deadline to the machine that happens to render it.
 */

import { CareCard } from "@/registry/base-lyra/ui/care-card"

export default function CareCardADeadlineThatHasPassed() {
  return (
    <div className="w-full max-w-md">
      <CareCard
        heading="Book the repeat example measurement your clinic asked for, now that the date has gone by"
        attribution="Your example clinic asks"
        reason="The clinic asked for a repeat by the date below, and this app has not seen one."
        dueBy="2026-01-05"
        locale="en-GB"
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
