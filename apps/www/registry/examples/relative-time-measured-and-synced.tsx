/**
 * The error this component exists to make hard: reading a sync time as a
 * measurement time.
 *
 * Both lines below are true. On their own, the second one is the most
 * reassuring sentence on the surface, and it says the app spoke to a server
 * three minutes ago. A reader who meets it without the first will carry that
 * reassurance onto a reading taken eleven days earlier. The prefix is what
 * keeps them apart, which is why `event` is required and has no default:
 * there is no spelling of this surface in which the two timestamps are
 * interchangeable, and a component that inferred the event would have to pick
 * one.
 *
 * NEITHER LINE PASSES A STALENESS THRESHOLD. The measured line used to, and it
 * was a number opsinjs does not own: a staleness default is forbidden in an
 * example as much as in a default export, because a worked example is where a
 * number is most likely to be copied. The point this file makes needs no
 * threshold. The two event words carry it on their own, and the eleven-day gap
 * between the lines is visible in the phrases themselves.
 *
 * The synced line carries no colour de-emphasis at all, and that is the point.
 * `text-muted-foreground` is the one tone this component reserves for a reading
 * it has been told may be out of date, so spending it on the freshest line on
 * the surface would teach the opposite of the contract this example exists to
 * teach. The line is already subordinate by position and by footnote size, so
 * both timestamps carry the same `text-opsin-footnote` and nothing more.
 */

import { RelativeTime } from "@/registry/base-lyra/ui/relative-time"

const NOW = "2026-03-14T11:12:00+00:00"

export default function RelativeTimeMeasuredAndSynced() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-3 rounded-lg border border-border p-opsin-4">
      <div className="flex flex-col gap-opsin-1">
        <span className="text-opsin-headline">Example measurement</span>
        <RelativeTime
          at="2026-03-03T07:45:00+00:00"
          event="measured"
          now={NOW}
          locale="en-GB"
          className="text-opsin-footnote"
        />
      </div>
      <RelativeTime
        at="2026-03-14T11:09:00+00:00"
        event="synced"
        now={NOW}
        locale="en-GB"
        className="text-opsin-footnote"
      />
    </div>
  )
}
