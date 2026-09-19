/**
 * A long list inside a bounded height, which is the case ScrollArea was built
 * for. The list is longer than its box, so the box scrolls and the thin neutral
 * rail appears; the page around it would keep its own native scroll. Every row
 * is a fictional saved item (ADR 0012), not a reading, so nothing here can be
 * mistaken for somebody's own data.
 */

import { ScrollArea } from "@/registry/base-lyra/ui/scroll-area"

const ITEMS = [
  "Blood pressure cuff",
  "Pill organiser",
  "Reading glasses",
  "Water bottle",
  "Appointment card",
  "Notebook and pen",
  "Phone charger",
  "House keys",
  "Bus pass",
  "Umbrella",
  "Shopping list",
  "Library book",
  "Spare batteries",
  "First aid kit",
  "Torch",
]

export default function ScrollAreaALongList() {
  return (
    <ScrollArea
      maxHeight="12rem"
      className="w-full max-w-xs rounded-opsin-lg border border-border bg-card"
    >
      <ul className="m-0 flex list-none flex-col p-opsin-2">
        {ITEMS.map((item) => (
          <li
            key={item}
            className="rounded-opsin-sm px-opsin-3 py-opsin-2 text-opsin-body [color:var(--foreground)]"
          >
            {item}
          </li>
        ))}
      </ul>
    </ScrollArea>
  )
}
