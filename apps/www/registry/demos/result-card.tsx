import { EXAMPLE_SOURCE, ResultCard } from "@opsinjs/react"

/**
 * The instant the demo is read against.
 *
 * A literal rather than a clock read. `now` is required of every caller, so a
 * demo that quietly read the clock would be documenting a different component;
 * and a fixed instant is what makes this deterministic, in the same spirit as
 * every number in an opsinjs example being obviously synthetic. A clock here
 * would make the card say something different every time the page was built.
 */
const DEMO_NOW = "2026-03-14T11:12:00+00:00"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows the card whole.
 * The part a reader needs to see about this component is that the number, the
 * comparison, the sentence and the next step are one object, in that order.
 *
 * THE NUMBERS ARE UNREAL AND THE RANGE IS UNOWNED. The reading, the interval
 * and the unit are chosen so that nobody could take them for their own result,
 * and the interval cites `EXAMPLE_SOURCE` rather than a laboratory, a guideline
 * body or a study. `EXAMPLE_SOURCE` is the one string an opsinjs example may
 * name as its source. This file is public, one copy away from somebody else's
 * product and one screenshot away from outliving the page it was written for.
 * The range also carries a confirmation date, `asOf`, which is example data in
 * exactly the sense the numbers are and is not a clinical fact opsinjs owns. It
 * is here so the canonical preview shows a bar that can say when its yardstick
 * was last checked, rather than a bar that says nothing about it. opsinjs
 * confirmed nothing; the date is a stand-in for the one a product supplies.
 *
 * IT CARRIES NO STALENESS BOUNDARY, so it demonstrates no staleness treatment.
 * A number here would be a clinical boundary in a public demo that a developer
 * copies verbatim into their own product, and no disclaimer in a comment undoes
 * it: the number is the part that gets copied. The cost is real and is stated
 * rather than hidden: no preview opsinjs ships shows that state, and none can.
 *
 * THE LEVEL AND THE BAR AGREE, which they have to. `status` is the product's
 * input and this component derives nothing from the reading. But a demo whose
 * pill says one thing while the bar beneath it says another teaches that a card
 * may contradict itself. The bar reads this fictional value as inside the
 * fictional interval, so the level beside it is the one whose shipped meaning
 * is "this reading is where it is expected to be". A product supplies its own,
 * from a range it owns.
 *
 * IT FIXES A LOCALE. The demo passes `locale="en-GB"` so the reference capture
 * teaches the day-first order numbers-dates-and-time mandates. A product passes
 * the tag its own reader uses.
 */
export default function ResultCardDemo() {
  return (
    <div className="w-full max-w-lg">
      <ResultCard
        title="Example measurement"
        value={14}
        unit="mg/dL"
        precision={0}
        locale="en-GB"
        measuredAt="2026-03-14T08:12:00+00:00"
        now={DEMO_NOW}
        range={{
          low: 10,
          high: 20,
          source: EXAMPLE_SOURCE,
          asOf: "2026-01-05T00:00:00+00:00",
        }}
        status="steady"
        category="labs"
        meaning="This example stands in for the plain-English paragraph a product writes: what the measurement looks at, what this reading means in context, and what usually happens next. It is two or three short sentences, in the second person, and it is the part most result screens leave out."
        actions={[
          { label: "Book a repeat example test", href: "#example", recommended: true },
          { label: "Read about this example test", href: "#example" },
        ]}
        provenance="Example provenance names who measured it, with what, and whose interval it is compared against."
      />
    </div>
  )
}
