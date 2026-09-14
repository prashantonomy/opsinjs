/**
 * The primary use: a history the product lays out, with one entry per row on a
 * shared rail. Every row names its event and dates it, the connector runs to
 * the last entry and stops, and one row carries a status the product assigned.
 * An age is read faster down a rail than a column of full dates.
 *
 * `now` is fixed so the example says the same thing every render, and every
 * title and body is obviously synthetic (ADR 0012): no reading, no number.
 */
import { TimelineEntry } from "@/registry/base-lyra/ui/timeline-entry"

const NOW = "2026-03-14T11:12:00+00:00"

const EVENTS: { when: string; title: string; body: string; status?: "watch" }[] = [
  {
    when: "2026-03-14T09:30:00+00:00",
    title: "Example note added",
    body: "Written by the example app.",
  },
  {
    when: "2026-03-12T18:00:00+00:00",
    title: "Example reminder set",
    body: "Set by the example app.",
    status: "watch",
  },
  {
    when: "2026-03-02T09:00:00+00:00",
    title: "Example entry recorded",
    body: "Recorded by the example app.",
  },
]

export default function TimelineEntryInAHistory() {
  return (
    <ol className="m-0 flex w-full max-w-md list-none flex-col p-0">
      {EVENTS.map((event, index) => (
        <TimelineEntry
          key={event.title}
          when={event.when}
          now={NOW}
          title={event.title}
          status={event.status}
          isLast={index === EVENTS.length - 1}
        >
          {event.body}
        </TimelineEntry>
      ))}
    </ol>
  )
}
