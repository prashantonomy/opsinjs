/**
 * The same result at two ages.
 *
 * WHAT AGE CHANGES IS WHAT A READING IS WORTH, NOT HOW LOUD IT IS. The two
 * cards below are identical in every clinical respect: the same fictional
 * number, the same fictional interval, the same category. They differ only in
 * when they were measured. They therefore carry the same level, and that is
 * the point of the example rather than an oversight: a value the app is less
 * able to vouch for cannot be used to raise the alarm, and escalating on age
 * alone inverts the rule. If a product's second card needs a different level,
 * it needs a second reason for it and a sentence saying what changed.
 *
 * WHY NEITHER CARD SHOWS THE STALENESS TREATMENT, which is the state this
 * example was originally written to demonstrate. `staleAfterHours` is a
 * clinical boundary: how old is too old differs completely by measurement, and
 * opsinjs does not know what was measured. §7 of the substrate contract forbids
 * shipping a staleness default "for any metric, in any population, ever… This
 * applies to example data too", and naming the constant does not change what
 * the number decides. There is therefore no number here to pass, and no
 * example in this repository can honestly supply one. Pass your own to
 * `staleAfterHours` and the timestamp past it carries the words "may be out of
 * date"; omit it, as here, and there is no staleness treatment at all.
 *
 * WHAT IS LEFT IS STILL THE THING WORTH SEEING, and the two cards say when they
 * were measured in two different forms on purpose. The first reading is three
 * hours old, so `RelativeTime` states the age in words and keeps the absolute
 * date beside it: the header reads "Measured 3 hours ago" and the date. The
 * second reading is four months old, which is past the fortnight at
 * `DEFAULT_ABSOLUTE_AFTER_DAYS` where the phrase gives way to the date, so its
 * header reads "Measured on" and the date alone, with no phrase about age. That
 * is the right output rather than a shortfall: past a fortnight "437 days ago"
 * is arithmetic nobody should be asked to do, and a date is the form a reader
 * can act on, which is the argument `RelativeTime` makes for the boundary in its
 * own comment. So age reaches the reader either way, in words near a recent
 * reading and as a date on an older one, and the card needs no clinical boundary
 * to say when a reading was taken. It needs one only to say that the reading is
 * old, and that is somebody else's judgement. The example shows the component's
 * default and does not pass `absoluteAfterDays`, because moving that boundary in
 * an example would teach a product to move it.
 */

import { EXAMPLE_SOURCE } from "@/lib/opsinjs"
import { ResultCard } from "@/registry/base-lyra/ui/result-card"

const EXAMPLE_NOW = "2026-03-14T11:12:00+00:00"

export default function ResultCardAnOldReading() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-opsin-6">
      <ResultCard
        title="Example measurement"
        value={14}
        unit="mg/dL"
        precision={0}
        locale="en-GB"
        measuredAt="2026-03-14T08:12:00+00:00"
        now={EXAMPLE_NOW}
        range={{
          low: 10,
          high: 20,
          source: EXAMPLE_SOURCE,
          asOf: "2026-01-05T00:00:00+00:00",
        }}
        status="steady"
        category="labs"
        meaning="This reading was taken a few hours ago. The timestamp says when, and says nothing else. No product has told this card what counts as old for this measurement, so it makes no claim about that."
      />
      <ResultCard
        title="Example measurement"
        value={14}
        unit="mg/dL"
        precision={0}
        locale="en-GB"
        measuredAt="2025-11-14T08:12:00+00:00"
        now={EXAMPLE_NOW}
        range={{
          low: 10,
          high: 20,
          source: EXAMPLE_SOURCE,
          asOf: "2026-01-05T00:00:00+00:00",
        }}
        status="steady"
        category="labs"
        meaning="The same reading, four months older. The number has not changed, the interval has not changed and the level has not changed. What has changed is how much any of them is worth, and the date is what says so. Age is a reason to measure again, not a reason to raise the alarm."
        actions={[
          { label: "Book a repeat example test", href: "#example", recommended: true },
        ]}
        provenance="Example provenance recording who measured it, with what, and whose interval it is compared against."
      />
    </div>
  )
}
