"use client"

import { ScrollArea } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows the case the
 * component was built for: a fictional list longer than its box, bounded to a
 * height so it scrolls, with the thin neutral rail appearing as the reader
 * scrolls. The one thing worth seeing at a glance is that the rail is quiet
 * neutral chrome rather than a coloured bar, so read it in greyscale.
 *
 * The rows are synthetic labels for a made-up set of saved notes (ADR 0012). No
 * number, no unit and no measurement anybody could mistake for their own reading.
 */
export default function ScrollAreaDemo() {
  const notes = [
    "Morning walk around the park",
    "Called the surgery to move an appointment",
    "Picked up the repeat order",
    "Read the leaflet that came with the box",
    "Wrote down a question for next time",
    "Set a reminder for the evening",
    "Tidied the folder of past notes",
    "Added a note about the weekend",
    "Checked the calendar for next week",
    "Left a message for the family",
    "Saved an article to read later",
    "Made a shortlist of things to ask",
  ]

  return (
    <ScrollArea
      maxHeight="14rem"
      className="w-full max-w-sm rounded-opsin-md border border-edge bg-card shadow-card"
    >
      <ul className="m-0 flex list-none flex-col gap-opsin-1 p-opsin-3">
        {notes.map((note) => (
          <li
            key={note}
            className="rounded-opsin-sm px-opsin-2 py-opsin-2 text-opsin-body [color:var(--foreground)]"
          >
            {note}
          </li>
        ))}
      </ul>
    </ScrollArea>
  )
}
