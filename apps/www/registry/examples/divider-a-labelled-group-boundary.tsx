/**
 * A labelled horizontal divider marking a named boundary between two lists.
 * The two `<ul>` elements are what actually group the items for a screen
 * reader; the divider only draws the visible line between them. All labels
 * are fictional (ADR 0012), with no number anywhere.
 */

import { Divider } from "@/registry/base-lyra/ui/divider"

const TODAY = ["A note from this morning", "A reminder due later"]
const EARLIER = ["A note you wrote", "A reminder you set", "A page you opened"]

export default function DividerALabelledGroupBoundary() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-opsin-2">
      <h3 className="m-0 text-opsin-footnote [color:var(--muted-foreground)]">Today</h3>
      <ul className="m-0 flex list-none flex-col gap-opsin-2 p-0">
        {TODAY.map((item) => (
          <li key={item} className="text-opsin-body [color:var(--foreground)]">
            {item}
          </li>
        ))}
      </ul>
      <Divider label="Earlier" />
      <ul className="m-0 flex list-none flex-col gap-opsin-2 p-0">
        {EARLIER.map((item) => (
          <li key={item} className="text-opsin-body [color:var(--foreground)]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
