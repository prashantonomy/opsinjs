import { RelativeTime } from "@opsinjs/react"

/**
 * The instant the demo is measured against.
 *
 * A literal rather than a clock read, for two reasons that happen to point the
 * same way. `now` is required of every caller, and a demo that quietly did
 * something the API does not allow would be documenting a different component.
 * And a fixed instant is what makes this deterministic, in the same spirit as
 * every number in an opsinjs example being obviously synthetic (ADR 0012): a
 * clock here would make the demo say something different every time the page
 * was built, drift its rows out of the rungs they exist to show, and make one
 * snapshot incomparable with the last.
 */
const DEMO_NOW = "2026-03-14T11:12:00+00:00"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It walks the ladder in
 * one column: a reading from minutes ago and one from hours ago show the phrase
 * on its own, because within a day recency is the point, and the older rows
 * show the exact date beside the phrase, because past a day a phrase alone
 * would ask the reader to count backwards. The thing worth seeing is that the
 * phrase gets vaguer as the event gets older and the exact date steps in to
 * carry it.
 *
 * NO ROW CARRIES A STALENESS THRESHOLD, so no row says anything about
 * staleness. A number here would be a staleness default in a public demo that a
 * developer copies verbatim into their own product, which ADR 0012 forbids
 * outright and which no disclaimer in a comment undoes: the number is the part
 * that gets copied, and a reader who never opens the comment has still read the
 * number. The cost is real and is stated rather than hidden. The one visual
 * state this component has is demonstrated by no preview opsinjs ships, and the
 * specification page says so in the same words.
 *
 * It carries no readings at all, and it names no measurement: a screenshot of
 * an opsinjs example must never be mistakable for somebody's own result.
 */
export default function RelativeTimeDemo() {
  return (
    <div className="flex flex-col gap-opsin-2 text-opsin-body">
      <RelativeTime event="synced" at="2026-03-14T11:09:00+00:00" now={DEMO_NOW} locale="en-GB" />
      {/* The measured row is a reading from the reader's own device, so its zone
          cannot differ from theirs and the offset label is dropped. The issued
          row below keeps its label, because a document issued by a clinic is
          exactly the case where the zone can differ from the reader's. */}
      <RelativeTime
        event="measured"
        at="2026-03-14T08:12:00+00:00"
        now={DEMO_NOW}
        locale="en-GB"
        showOffset={false}
      />
      <RelativeTime
        event="recorded"
        at="2026-03-10T20:40:00+00:00"
        now={DEMO_NOW}
        locale="en-GB"
      />
      <RelativeTime event="received" at="2026-03-01T09:00:00+00:00" now={DEMO_NOW} locale="en-GB" />
      <RelativeTime event="issued" at="2025-11-02T09:00:00+00:00" now={DEMO_NOW} locale="en-GB" />
    </div>
  )
}
