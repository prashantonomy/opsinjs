"use client"

import { useState } from "react"
import { Menu } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows a trigger and a
 * short list of neutral actions with one group set apart by a separator, which
 * is the one thing worth seeing at a glance: that the list is neutral chrome,
 * that the removing action carries no red and is told by its word, and that a
 * separator groups a run of actions rather than tinting them.
 *
 * The trigger is a plain styled button rather than the system's Button, so the
 * one file a consumer reads first stays free of a registry dependency the
 * component itself does not take. It floors its own 44pt target and carries its
 * own focus ring, because a menu trigger is the caller's button and this is the
 * caller standing in.
 *
 * The labels name fictional non-clinical actions on a saved item (ADR 0012). No
 * number, no unit and no measurement anybody could mistake for their own reading,
 * and the removing action's onClick is where a real product would open a
 * confirming Dialog rather than removing straight away.
 */
export default function MenuDemo() {
  const [lastRun, setLastRun] = useState<string | null>(null)

  return (
    <div className="flex w-full max-w-xs flex-col items-start gap-opsin-4">
      <Menu
        trigger={
          <button
            type="button"
            className={
              "inline-flex items-center justify-center gap-opsin-2 rounded-full " +
              "border border-border bg-background px-opsin-5 py-opsin-2 " +
              "min-h-(--opsin-target-minimum,2.75rem) text-opsin-headline [color:var(--foreground)] " +
              "cursor-pointer align-middle " +
              "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
              "hover:bg-state-hover " +
              "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"
            }
          >
            Actions
          </button>
        }
        items={[
          { label: "Share", onClick: () => setLastRun("Share") },
          { label: "Rename", onClick: () => setLastRun("Rename") },
          { label: "Duplicate", onClick: () => setLastRun("Duplicate") },
          { label: "Remove from list", separatorBefore: true, onClick: () => setLastRun("Remove from list") },
        ]}
      />
      <p className="m-0 text-opsin-footnote [color:var(--muted-foreground)]">
        {lastRun === null
          ? "Open the menu and choose an action."
          : `You chose "${lastRun}". A real product would run it here.`}
      </p>
    </div>
  )
}
