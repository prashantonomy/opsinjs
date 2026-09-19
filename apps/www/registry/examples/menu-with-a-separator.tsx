"use client"

/**
 * A grouped list: a run of related actions set apart from one that stands on its
 * own by a separator.
 *
 * The separator is `separatorBefore` on the item below it, which draws a neutral
 * hairline above that item and nothing more. It groups by structure rather than
 * by colour, so the last action reads as apart from the three above it without a
 * tint doing the work. That last action removes the item, and it carries no red:
 * this system has no destructive tint, so the word is what tells the reader what
 * it does, and its onClick is where a real product would open a confirming
 * Dialog rather than removing straight away.
 *
 * A disabled action shows the muted, skipped state without being taken out of
 * the list, so the reader can still see it is a command that is not available to
 * them. The labels are fictional commands on a saved item (ADR 0012): no number,
 * no unit and no reading anybody could mistake for their own data.
 */

import { useState } from "react"

import { Menu } from "@/registry/base-lyra/ui/menu"

const TRIGGER =
  "inline-flex items-center justify-center gap-opsin-2 rounded-opsin-md " +
  "border border-border bg-background px-opsin-4 py-opsin-2 " +
  "min-h-(--opsin-target-minimum,2.75rem) text-opsin-headline [color:var(--foreground)] " +
  "cursor-pointer align-middle " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "hover:bg-state-hover " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

export default function MenuWithASeparator() {
  const [lastRun, setLastRun] = useState<string | null>(null)

  return (
    <div className="flex w-full max-w-xs flex-col items-start gap-opsin-4">
      <Menu
        trigger={
          <button type="button" className={TRIGGER}>
            List options
          </button>
        }
        items={[
          { label: "Pin to top", onClick: () => setLastRun("Pin to top") },
          { label: "Add a note", onClick: () => setLastRun("Add a note") },
          { label: "Export a copy", disabled: true },
          { label: "Remove from list", separatorBefore: true, onClick: () => setLastRun("Remove from list") },
        ]}
      />
      <p className="m-0 text-opsin-footnote [color:var(--muted-foreground)]">
        {lastRun === null
          ? "Open the menu. Export is shown as unavailable, and Remove is set apart by a separator."
          : `You chose "${lastRun}".`}
      </p>
    </div>
  )
}
