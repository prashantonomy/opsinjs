/**
 * The primary use: a column of entries where the age of each one is part of
 * reading it.
 *
 * The rule on show is that every row names its event, so "3 days ago" is
 * never left as a fragment the reader completes for themselves. An age is
 * also read far faster down a column than four dates side by side are.
 *
 * NO ROW PASSES A STALENESS THRESHOLD, and the example is poorer for it. The
 * version that showed one row past a boundary was better teaching and shipped a
 * number opsinjs does not own: what counts as old differs completely between one
 * measurement and the next, ADR 0012 forbids a staleness default anywhere
 * including in an example, and a threshold in a worked example is read as a
 * recommendation however the comment beside it is worded. So these rows carry
 * their ages and no verdict about them, which is exactly what the component does
 * when a product has not said what old means here.
 *
 * `now` is fixed so the example says the same thing every time it is rendered.
 * A demo whose text depends on when the page was built cannot be reviewed twice.
 */

import { RelativeTime } from "@/registry/base-lyra/ui/relative-time"

const NOW = "2026-03-14T11:12:00+00:00"

const ENTRIES = [
  { subject: "First example measurement", at: "2026-03-14T09:40:00+00:00", event: "measured" },
  { subject: "Second example measurement", at: "2026-03-13T21:05:00+00:00", event: "recorded" },
  { subject: "Third example measurement", at: "2026-03-13T07:30:00+00:00", event: "measured" },
  { subject: "Fourth example measurement", at: "2026-03-10T18:15:00+00:00", event: "measured" },
] as const

export default function RelativeTimeInALogList() {
  return (
    <ul className="m-0 flex w-full max-w-md list-none flex-col gap-opsin-2 p-0">
      {ENTRIES.map((entry) => (
        <li
          key={entry.subject}
          className="flex flex-wrap items-baseline justify-between gap-opsin-2 border-b border-border py-opsin-2 text-opsin-body"
        >
          <span>{entry.subject}</span>
          <RelativeTime
            at={entry.at}
            event={entry.event}
            now={NOW}
            locale="en-GB"
            className="text-opsin-footnote"
          />
        </li>
      ))}
    </ul>
  )
}
