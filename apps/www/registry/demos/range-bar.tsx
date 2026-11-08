import { EXAMPLE_SOURCE, RangeBar } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows the two states
 * a reader of this component most needs to see together: a reading against a
 * range, and the same reading with no range to compare it with. The second is
 * the one that gets built wrong, because the tempting repair is a typical adult
 * band and a small asterisk.
 *
 * The numbers are obviously unreal (ADR 0012) and the range cites the one
 * string an opsinjs example may cite. The demo gives the range no confirmation
 * date, and an undated range now says nothing about one in the footnote,
 * because the sentence above the bar already names who set the range. A
 * plausible confirmation date is a claim that would travel into somebody else's
 * product with the first developer who copies this demo, so the demo invents
 * none. A missing reading time is a different case and is still stated out
 * loud, which is what the second bar shows.
 *
 * The first reading carries the time it was taken and the second deliberately
 * does not, so both halves of the recency rule are on screen: a dated reading,
 * and a component saying outright that nobody knows when the other one was
 * taken rather than letting it be read as "now".
 */
export default function RangeBarDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-8">
      {/* Both bars fix locale="en-GB" so the reference capture reads the date
          day first, "14 March 2026", the order numbers-dates-and-time mandates,
          rather than the deploying server's default. A product passes its own
          locale; the demo pins one so the screenshot cannot teach the wrong
          order. Both carry it, not only the dated bar, so the reading's number
          separators are formatted by the same convention across the pair. */}
      <RangeBar
        label="Example measurement"
        value={14}
        unit="mg/dL"
        precision={0}
        range={{ low: 10, high: 20, source: EXAMPLE_SOURCE }}
        status="watch"
        category="labs"
        measuredAt="2026-03-14T08:12:00+00:00"
        locale="en-GB"
      />
      <RangeBar
        label="Second example measurement"
        value={14}
        unit="mg/dL"
        precision={0}
        locale="en-GB"
      />
    </div>
  )
}
