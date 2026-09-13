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
 * The de-emphasis of the synced line sits on a wrapper rather than on the
 * component's own `className`. `cn()` is tailwind-merge, which files
 * `text-opsin-footnote` and `text-muted-foreground` in one conflict group, so
 * passing both to the component deletes the size and leaves the colour.
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
          showAbsolute
          className="text-opsin-footnote"
        />
      </div>
      <span className="text-opsin-footnote text-muted-foreground">
        <RelativeTime
          at="2026-03-14T11:09:00+00:00"
          event="synced"
          now={NOW}
          locale="en-GB"
        />
      </span>
    </div>
  )
}
