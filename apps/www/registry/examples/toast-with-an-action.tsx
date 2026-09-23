"use client"

/**
 * A confirmation that offers one way to take it back. The toast says a note was
 * removed and carries an Undo action, so the reader who acted by mistake has a
 * moment to reverse it before the toast dismisses itself. The action is a second
 * thought rather than the point, which is why it is a quiet text control beside
 * the message and not a filled button. The words are fictional and name nothing
 * measured (ADR 0012), and Undo here only closes the toast, because an example
 * owns no real note to restore.
 */

import { Toast } from "@/registry/base-lyra/ui/toast"

import { Toast as ToastPrimitive } from "@base-ui/react/toast"

function DeleteButton() {
  const manager = ToastPrimitive.useToastManager()

  return (
    <button
      type="button"
      onClick={() => {
        let id = ""
        id = manager.add({
          title: "Note removed",
          actionProps: {
            children: "Undo",
            onClick: () => manager.close(id),
          },
        })
      }}
      className={
        "inline-flex items-center justify-center rounded-opsin-md border border-border " +
        "bg-card px-opsin-4 min-h-(--opsin-target-minimum,2.75rem) text-opsin-headline " +
        "font-medium [color:var(--foreground)] cursor-pointer " +
        "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard hover:bg-state-hover " +
        "focus-visible:outline-ring focus-visible:outline-[length:var(--opsin-border-focus,2px)] " +
        "focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)]"
      }
    >
      Remove note
    </button>
  )
}

export default function ToastWithAnAction() {
  return (
    <Toast>
      <DeleteButton />
    </Toast>
  )
}
