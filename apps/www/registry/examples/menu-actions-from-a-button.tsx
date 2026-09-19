"use client"

/**
 * The plain case: a few neutral actions folded behind one trigger.
 *
 * The trigger is an ordinary button the example owns, because a menu button is
 * the caller's own button and Base UI merges the open behaviour onto it. The
 * actions are fictional commands on a saved item (ADR 0012), so there is no
 * number, no unit and no reading anybody could mistake for their own data. None
 * of them is destructive: a command that could not be undone would open a
 * confirming Dialog rather than firing straight from the list, and a
 * safety-relevant command would sit on the screen as a button rather than
 * hiding in here at all.
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

export default function MenuActionsFromAButton() {
  const [lastRun, setLastRun] = useState<string | null>(null)

  return (
    <div className="flex w-full max-w-xs flex-col items-start gap-opsin-4">
      <Menu
        trigger={
          <button type="button" className={TRIGGER}>
            Actions
          </button>
        }
        items={[
          { label: "Share", onClick: () => setLastRun("Share") },
          { label: "Rename", onClick: () => setLastRun("Rename") },
          { label: "Duplicate", onClick: () => setLastRun("Duplicate") },
        ]}
      />
      <p className="m-0 text-opsin-footnote [color:var(--muted-foreground)]">
        {lastRun === null
          ? "Open the menu and choose an action."
          : `You chose "${lastRun}".`}
      </p>
    </div>
  )
}
