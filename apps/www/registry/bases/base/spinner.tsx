/**
 * Spinner is an indeterminate loading indicator: a small ring that turns while a
 * brief, in-place wait resolves, and says nothing about what is arriving or how
 * long it will take.
 *
 * REACH FOR A SKELETON FIRST, AND THAT IS THE WHOLE POSTURE OF THIS COMPONENT. A
 * skeleton says WHAT is arriving, because it is the outline of the thing itself:
 * a reader looking at three grey rows knows a list is coming and roughly how big
 * it will be. A spinner says only THAT something is arriving, which is less
 * information for the same screen space, and a spinner that sits where a shape
 * could have been drawn has thrown that shape away. So the skeleton is the
 * default answer across the system, and a spinner earns its place only where the
 * shape of what is coming is genuinely unknown: a brief wait with no layout to
 * promise, an action whose result has no fixed form, a spot too small for an
 * outline. Everywhere the arriving content has a shape, that shape is a Skeleton.
 *
 * IT IS A SERVER COMPONENT, BECAUSE A TURNING RING HAS NO STATE TO HYDRATE. The
 * rotation is CSS, the ring is SVG, and neither needs JavaScript on the client.
 * Making it a client component would ship a bundle for a graphic that a
 * stylesheet already draws and animates. It holds no timer and starts no work of
 * its own: whether the spinner is on screen at all is the product's decision,
 * driven by the product's own loading state, and this component only draws the
 * ring while it is mounted.
 *
 * IT CARRIES NEITHER COLOUR AXIS. A wait is not a clinical level and not a kind
 * of measurement, so the ring states no status and names no category. It draws in
 * `currentColor`, which means it takes the ink colour of whatever surrounds it: a
 * spinner set in muted footnote text is a quiet grey, and one set in a heading is
 * the heading's ink. A caller who wants the quiet neutral tone on a plain surface
 * sets it through `className` as `[color:var(--muted-foreground)]`; the component
 * forces no colour of its own, and the two-colour-axes rule applies to any class
 * a caller passes in full.
 *
 * THE RING IS DECORATIVE AND THE WAIT IS SPOKEN. The SVG itself is `aria-hidden`,
 * because a turning shape read aloud is noise. The accessible announcement is
 * carried two ways instead: the root is a `role="status"` live region, so a
 * screen reader tells the reader that a wait has begun when the spinner mounts,
 * and it carries the `label` both as its `aria-label` and as a visually hidden
 * copy of the text inside it, so the wait has a name a reader hears rather than a
 * bare "busy". The `label` is required for exactly that reason: a spinner with no
 * name announces a wait for something the reader cannot identify. Name what is
 * being waited for, "Loading your readings" rather than "Loading", where the
 * screen has the room.
 *
 * IT STOPS UNDER REDUCED MOTION. `animate-spin` turns the ring, and
 * `motion-reduce:animate-none` holds it still for a reader who has asked the
 * platform for less movement. The wait is still announced through the live region
 * and the hidden text, so a reader who cannot use the motion loses nothing the
 * ring was carrying: the ring was never the message, only its decoration.
 *
 * IT IS NOT FOCUSABLE AND CAPTURES NO KEY. A spinner is a piece of status, not a
 * control: there is nothing to press, nothing to change, and a tab stop on it
 * would be a stop that does nothing. It takes no target floor and carries no
 * focus ring, because it is never a target and never takes focus.
 */

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * The two sizes, written out as literal class strings because Tailwind reads
 * class names out of source as text and `size-[${n}em]` generates no CSS. Both
 * are in `em`, so the ring grows with the surrounding text rather than pinning
 * at a device pixel: `sm` is a ring beside a line of body text, `md` is a ring
 * that anchors a small in-place wait on its own. Kept local rather than a fourth
 * public export, so a consumer names the shape as `SpinnerProps["size"]`; the
 * registry contract fixes this file at three public exports.
 */
const SIZE: Record<"sm" | "md", string> = {
  sm: "size-[1.25em]",
  md: "size-[1.75em]",
}

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a
 * consumer makes with the clinical API, and a spinner asserts nothing clinical.
 * `divider.tsx` and `segmented-control.tsx` keep the same small set for the same
 * reason, and minting a real code is not this file's to do.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface SpinnerProps {
  /**
   * The accessible name for the wait, required and read aloud. It is applied as
   * the `aria-label` on the `role="status"` region and rendered as a visually
   * hidden copy inside it, so a screen reader announces the wait with a name
   * rather than a bare "busy". Name what is being waited for where the screen has
   * the room, "Loading your readings" rather than the bare "Loading", so a reader
   * hears which part of the page is not ready yet. There is no default, because a
   * guessed name would describe the wrong wait on most screens.
   */
  label: string
  /**
   * Visual weight only, and both weights are neutral. `sm` is a ring beside a
   * line of text; `md` is a ring that anchors a small in-place wait on its own.
   * Both are sized in `em`, so the ring scales with the surrounding text rather
   * than pinning at a fixed size. Defaults to `md`.
   */
  size?: "sm" | "md"
  /**
   * Merged onto the root. Placement, margin and the space around the spinner
   * belong here, and it is the one route by which colour can reach the ring: the
   * ring draws in `currentColor`, so a class such as `[color:var(--muted-foreground)]`
   * sets the quiet neutral tone on a plain surface. The two-colour-axes rule
   * applies to a class you pass in full: a spinner takes neither a status nor a
   * category tint, because a wait is on neither axis. A class you pass wins over
   * the root's own where the two conflict, because it is merged last.
   */
  className?: string
}

export function Spinner({ label, size = "md", className }: SpinnerProps) {
  if (isDevelopment() && (typeof label !== "string" || label.trim() === "")) {
    warnDev(
      "no-label",
      "[opsinjs] <Spinner> was rendered with no `label`. The ring is a " +
        "role=\"status\" live region and needs an accessible name: without one a " +
        "screen-reader user hears that a wait has begun for something they cannot " +
        "identify. Pass `label` with the name of what is being waited for, such " +
        'as "Loading your readings".',
    )
  }

  const resolved: "sm" | "md" = size === "sm" ? "sm" : "md"

  return (
    <span
      data-slot="spinner"
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
    >
      {/* Decorative. The turning shape carries nothing a reader needs to hear, so
          it is aria-hidden and kept out of the accessibility tree; the wait is
          announced by the live region and the hidden text beside it. The ring is
          a single partial arc in currentColor, drawn with a round cap so its
          leading edge reads as motion, and it turns with Tailwind's own
          animate-spin keyframe. motion-reduce:animate-none holds it still for a
          reader who has asked the platform for less movement, and the wait is
          still spoken, so nothing is lost with the ring stopped. */}
      <svg
        data-slot="spinner-ring"
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        fill="none"
        className={cn(SIZE[resolved], "animate-spin motion-reduce:animate-none")}
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="72 28"
        />
      </svg>
      {/* A visually hidden copy of the name, so the live region has text to
          announce when it mounts and a reader who queries the region hears the
          wait named rather than an empty status. */}
      <span data-slot="spinner-label" className="sr-only">
        {label}
      </span>
    </span>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the canonical pattern, a
 * ring beside a visible word, in the muted neutral tone the ring takes from its
 * surroundings, which is the one thing worth seeing at a glance: a spinner is a
 * quiet piece of status, not a status colour. The visible "Loading" is the
 * product's own caption; the ring carries its own hidden copy for a screen
 * reader. No number, no unit and no reading anybody could mistake for their own
 * (ADR 0012): a spinner names a wait, never a measurement.
 */
export default function SpinnerDemo() {
  return (
    <span className="inline-flex items-center gap-opsin-2 text-muted-foreground">
      <Spinner label="Loading" />
      <span className="text-opsin-subheadline">Loading</span>
    </span>
  )
}
