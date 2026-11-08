import { VisuallyHidden } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * A VisuallyHidden on its own renders nothing a reviewer can see, so a demo
 * that showed only the component would be a blank frame. The one distinction
 * worth seeing is exactly the gap between what the eye gets and what a screen
 * reader gets, so the demo makes that gap legible: a line of visible text with
 * a hidden clause spliced into it, and a caption naming the words a screen
 * reader adds that the eye never receives. Nothing here is a measurement, a
 * unit or a range (ADR 0012).
 */
export default function VisuallyHiddenDemo() {
  return (
    <div className="flex max-w-sm flex-col gap-opsin-2">
      <p className="m-0 text-opsin-body [color:var(--foreground)]">
        Sort<VisuallyHidden> the example table</VisuallyHidden> ascending
      </p>
      <p className="m-0 text-opsin-caption1 text-muted-foreground">
        A screen reader reads &quot;Sort the example table ascending&quot;. The
        eye sees &quot;Sort ascending&quot;. The words between them are here,
        clipped out of sight and left in the accessibility tree.
      </p>
    </div>
  )
}
