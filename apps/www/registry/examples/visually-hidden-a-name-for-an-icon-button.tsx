/**
 * The primary use: an icon-only control that would otherwise reach a
 * screen-reader user with no name at all.
 *
 * The cross is marked aria-hidden, so the accessible name comes from the
 * VisuallyHidden child and is read once rather than twice. The name is the
 * full action rather than the bare verb, because a surface usually holds more
 * than one thing to close. Nothing here is a measurement.
 */

import { X } from "lucide-react"

import { VisuallyHidden } from "@/registry/base-lyra/ui/visually-hidden"

export default function VisuallyHiddenANameForAnIconButton() {
  return (
    <button
      type="button"
      className="inline-flex min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem) items-center justify-center rounded-opsin-md border border-border bg-card text-card-foreground focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"
    >
      <X aria-hidden="true" className="size-opsin-5" />
      <VisuallyHidden>Close the example panel</VisuallyHidden>
    </button>
  )
}
