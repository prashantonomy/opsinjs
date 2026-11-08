"use client"

import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { Toast } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It is a button that
 * pushes one "Saved" toast, which is the one thing worth seeing at a glance: a
 * confirmation of the reader's own action, drawn as quiet neutral chrome rather
 * than as a status. The inner component is where `useToastManager()` is called,
 * because the hook only resolves inside the provider that `<Toast>` mounts.
 *
 * There is no reading, no unit and no clinical word anywhere in it (ADR 0012):
 * the toast confirms a fictional save and names nothing measured.
 */
function ToastDemoTrigger() {
  const manager = ToastPrimitive.useToastManager()

  return (
    <button
      type="button"
      onClick={() =>
        manager.add({
          title: "Saved",
          description: "Your note has been added to today's entry.",
        })
      }
      className={
        "inline-flex items-center justify-center rounded-opsin-md border border-border " +
        "bg-card px-opsin-4 min-h-(--opsin-target-minimum,2.75rem) text-opsin-headline " +
        "font-medium [color:var(--foreground)] cursor-pointer " +
        "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard hover:bg-state-hover " +
        "focus-visible:outline-ring focus-visible:outline-[length:var(--opsin-border-focus,2px)] " +
        "focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)]"
      }
    >
      Save note
    </button>
  )
}

export default function ToastDemo() {
  return (
    <Toast>
      <ToastDemoTrigger />
    </Toast>
  )
}
