"use client"

/**
 * The case Toast was built for: a button that confirms the reader's own action
 * and then gets out of the way. The toast says "Saved", stays a few seconds, and
 * dismisses itself, which is the right shape for an acknowledgement and the wrong
 * shape for anything the reader must not miss. The words are a fictional
 * confirmation and name nothing measured (ADR 0012), and the toast draws only
 * neutral chrome so it reads as a confirmation rather than as a status.
 */

import { Toast } from "@/registry/base-lyra/ui/toast"

import { Toast as ToastPrimitive } from "@base-ui/react/toast"

function SaveButton() {
  const manager = ToastPrimitive.useToastManager()

  return (
    <button
      type="button"
      onClick={() => manager.add({ title: "Saved" })}
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

export default function ToastASaveConfirmation() {
  return (
    <Toast>
      <SaveButton />
    </Toast>
  )
}
