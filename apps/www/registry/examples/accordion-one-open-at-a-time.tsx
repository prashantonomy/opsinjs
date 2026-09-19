/**
 * Single-open mode, which is the default. With `multiple` left off, opening one
 * section closes whichever was open, so a small screen never grows a wall of open
 * panels. The thing worth checking is that opening the third section here closes
 * the first without the reader doing anything else. The content is fictional app
 * copy (ADR 0012): no reading, no unit, no clinical instruction.
 */

import { Accordion } from "@/registry/base-lyra/ui/accordion"

export default function AccordionOneOpenAtATime() {
  return (
    <Accordion
      className="w-full max-w-md"
      defaultValue={["daily"]}
      items={[
        {
          value: "daily",
          title: "Daily view",
          content:
            "Shows the entries from a single example day. Sample text stands in for what the imagined screen would render.",
        },
        {
          value: "weekly",
          title: "Weekly view",
          content:
            "Groups the same fictional entries by week. This copy is a placeholder for the disclosure pattern, not a described feature.",
        },
        {
          value: "monthly",
          title: "Monthly view",
          content:
            "Rolls the imagined weeks into months. Opening this section closes the one above it, which is the single-open behaviour on show.",
        },
      ]}
    />
  )
}
