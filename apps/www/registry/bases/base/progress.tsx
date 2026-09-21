/**
 * Progress is a bar that shows how far through a task the reader has got: an
 * upload part way done, a multi-step form on step three of five, an export
 * being prepared. It is built on Base UI's Progress primitive, which gives it
 * `role="progressbar"` and the `aria-valuenow`, `aria-valuemin` and
 * `aria-valuemax` a screen reader reads.
 *
 * IT IS NEVER A HEALTH VALUE, AND THAT IS THE ONE RULE THAT SHAPES EVERYTHING
 * ELSE. A bar that fills towards a full track reads as a mark out of a maximum,
 * so it says two things at once: how far along, and how close to a target. A
 * task has a target, because a task is finished or it is not. A reading usually
 * does not: a heart rate of 72 is not "72 percent of the way" to anything, and
 * drawing it in a bar that fills up invents a goal the number never had. So this
 * component is for task or step completion only. For a reading placed against a
 * range use RangeBar, whose track is the range and whose marks are the
 * reference bounds somebody owns. For a composite number drawn as an arc use
 * ScoreDial, which says in words what the number is and refuses to be read as a
 * score out of its top. Neither of those is this component, and this component
 * is neither of those.
 *
 * IT IS A SERVER COMPONENT, BECAUSE A PROGRESS BAR IS A STATUS READOUT RATHER
 * THAN A CONTROL. It takes no focus, answers no key, and has no state of its own
 * to hold: the value arrives as a prop and the bar draws it. Base UI's Progress
 * parts carry their own "use client" boundary, so they hydrate as a small island
 * while this wrapper stays on the server and ships no JavaScript of its own. The
 * one thing that would force a client boundary is a render function passed to a
 * Base UI part, because a function cannot cross the server to client edge, and
 * this file passes none: the value readout uses Base UI's default formatting,
 * and every other prop is a string, a number or a class list.
 *
 * IT CARRIES NEITHER COLOUR AXIS. A task's progress is not a clinical level and
 * not a kind of measurement, so the bar takes no `data-status` and no
 * `data-category`. The track is the neutral muted groove and the fill is the
 * primary action role, the same fill a Button wears, which is a brand colour
 * rather than a point on either axis. A reader looking at the bar is never asked
 * to decode a hue: the fill means "this much is done" and nothing about urgency
 * or subject.
 *
 * THE INDETERMINATE CASE DOES NOT PRETEND TO A FRACTION. When the value is
 * `null` the task is running with no known shape, an export whose size is not
 * yet counted, so there is no honest percentage to draw. The bar does not fill
 * to a guessed amount. It shows a full-width fill that pulses under a
 * motion-safe guard, the readout says the work is in progress rather than
 * printing a number, and Base UI drops `aria-valuenow` so a screen reader
 * announces a busy state rather than a false position. A reader who has asked
 * for reduced motion sees the fill without the pulse and reads the state from
 * the words instead. If the wait has no bar-shaped answer at all, a Skeleton or
 * a spinner is the honest component rather than an indeterminate bar.
 */

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * The track, spelled once. A neutral muted groove that clips its fill to a
 * pill, sized in `em` so the bar grows with the reader's text rather than
 * pinning at a device pixel. It draws only neutral chrome and sits on neither
 * colour axis.
 */
const TRACK =
  "relative block h-[0.5em] w-full overflow-hidden rounded-full bg-muted"

/**
 * The fill, spelled once per case because Tailwind reads class names out of
 * source as literal text and a computed class generates no CSS.
 *
 * The determinate fill is the primary action role, so it reads as the same
 * "done" colour a Button's fill reads as, and its width is set inline by Base
 * UI from the value. The width change eases over the fast duration token so a
 * step forward slides rather than jumps, and it is turned off under
 * `prefers-reduced-motion`. This is chrome motion on a task, not a health value
 * animating on first paint, which the system forbids and which this bar never
 * does: a CSS width transition has no previous value to travel from on the
 * first render.
 */
const FILL_DETERMINATE =
  "h-full rounded-full bg-primary transition-[width] duration-(--opsin-duration-fast) ease-opsin-standard motion-reduce:transition-none"

/**
 * The indeterminate fill fills the whole track and pulses, so it is told apart
 * from a completed bar by movement, by the readout words and by the absent
 * `aria-valuenow` rather than by width. The pulse is dropped under
 * `prefers-reduced-motion`, where the words carry the state on their own.
 */
const FILL_INDETERMINATE =
  "h-full w-full rounded-full bg-primary animate-pulse motion-reduce:animate-none"

/**
 * The screen-reader-only clip, spelled once rather than imported from
 * VisuallyHidden: that component takes only `children` and `className`, and
 * this file needs a bare `<span>` it can also mark `role="status"`. The rules
 * are the same four `visually-hidden.tsx` names as the pattern every opsinjs
 * component that needs an announced-but-unseen string inlines.
 */
const SR_ONLY =
  "absolute m-[-1px] h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)] [clip-path:inset(50%)]"

/**
 * Development warnings for uncoded mistakes, said once per distinct offender.
 * Nothing here has an `OpsinErrorCode`: a progress bar asserts nothing
 * clinical, so the codes in `tokens/errors.json` do not apply, and minting one
 * is not this file's to do. The shape is the one `divider.tsx` keeps.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface ProgressProps {
  /**
   * The accessible name for the bar, and the visible label beside it. Required:
   * a bare bar with no name is a percentage with no subject, so a reader hears
   * "45 percent" with no idea what is 45 percent done. Name the task, "Uploading
   * photos" rather than "Progress". Base UI wires this label to the progressbar,
   * so it is what a screen reader reads before the value.
   */
  label: string
  /**
   * How far through the task, from 0 to `max`. Pass `null` for a task that is
   * running with no known shape, which draws the indeterminate state rather than
   * a guessed fraction. A number outside 0 to `max` is clamped by Base UI to the
   * nearer bound and a development warning names it, because a bar drawn past its
   * own end asserts a position it does not have.
   */
  value: number | null
  /**
   * The value that counts as complete. Defaults to 100, so a `value` is read as
   * a percentage unless you set another ceiling, such as the number of steps in
   * a form. The lower bound is fixed at 0.
   */
  max?: number
  /**
   * Merged onto the root. Width, margin and place in a layout belong here. A
   * class you pass wins over the component's own where the two conflict, because
   * it is merged last. It is the one route by which colour can reach the bar,
   * and the two-colour-axes rule applies to it in full: a progress bar takes
   * neither a status nor a category tint.
   */
  className?: string
}

export function Progress({ label, value, max = 100, className }: ProgressProps) {
  const indeterminate = value === null || !Number.isFinite(value)
  const complete = value !== null && Number.isFinite(value) && value >= max

  if (isDevelopment()) {
    if (typeof label !== "string" || label.trim() === "") {
      warnDev(
        "no-label",
        "[opsinjs] <Progress> was rendered with no `label`. The bar is a " +
          "progressbar and needs an accessible name: without one a screen-reader " +
          "user hears a percentage with no idea what it measures. Pass `label` " +
          'with the name of the task, such as "Uploading photos".',
      )
    }

    if (value !== null && !Number.isFinite(value)) {
      warnDev(
        "broken-value",
        "[opsinjs] <Progress> was given a value that is not a finite number, so " +
          "it was drawn as an indeterminate task. If the task really has no known " +
          "shape pass value={null} on purpose; otherwise pass the number done so " +
          "far, from 0 to max.",
      )
    } else if (value !== null && (value < 0 || value > max)) {
      warnDev(
        `value-out-of-range:${String(value)}`,
        `[opsinjs] <Progress value={${String(value)}}> is outside the 0 to ` +
          `${String(max)} range, so Base UI clamped it to the nearer bound. A bar ` +
          "cannot be drawn past its own end. Pass a value between 0 and max, or " +
          "raise max if the task genuinely counts higher.",
      )
    }
  }

  /*
   * `aria-label` is set on the root below in addition to the `aria-labelledby`
   * Base UI wires up itself. Base UI's own wiring waits on its client island
   * mounting: `Progress.Label` registers its id with the root in an effect,
   * so on a first paint with no JavaScript yet run, or with none at all, the
   * root would otherwise carry a `progressbar` role and no name at all. The
   * `aria-label` set directly here is present from that first paint and costs
   * nothing once the island mounts, because `aria-labelledby` takes
   * precedence in name computation and points at the same `label` text, so
   * the two never disagree.
   */
  return (
    <>
      <ProgressPrimitive.Root
        data-slot="progress"
        value={value}
        max={max}
        aria-label={label}
        className={cn("flex w-full flex-col gap-opsin-2", className)}
      >
        <div className="flex items-baseline justify-between gap-opsin-3">
          <ProgressPrimitive.Label
            data-slot="progress-label"
            className="text-opsin-subheadline [color:var(--foreground)]"
          >
            {label}
          </ProgressPrimitive.Label>
          {indeterminate ? (
            <span
              data-slot="progress-value"
              aria-hidden="true"
              className="text-opsin-subheadline tabular-nums [color:var(--muted-foreground)]"
            >
              In progress
            </span>
          ) : (
            <ProgressPrimitive.Value
              data-slot="progress-value"
              className="text-opsin-subheadline tabular-nums [color:var(--muted-foreground)]"
            />
          )}
        </div>
        <ProgressPrimitive.Track data-slot="progress-track" className={TRACK}>
          <ProgressPrimitive.Indicator
            data-slot="progress-indicator"
            className={indeterminate ? FILL_INDETERMINATE : FILL_DETERMINATE}
          />
        </ProgressPrimitive.Track>
      </ProgressPrimitive.Root>
      {/*
       * The completion announcement, held outside the progressbar rather than
       * inside it. `progressbar` is one of the ARIA roles whose descendants
       * are presentational, so a live region nested inside `ProgressPrimitive
       * .Root` would have its role stripped by the accessibility tree before
       * a screen reader ever saw it. A sibling status region has no such
       * problem. It is silent while a task runs: a reader who is not looking
       * at the bar is not told the percentage on every tick, only the one
       * change that matters. When the caller re-renders this component with
       * a value that reaches `max`, the text changes from empty to a
       * sentence, and that change inside a `role="status"` region is what
       * gets announced without the reader having to have focus anywhere near
       * the bar.
       */}
      <span role="status" className={SR_ONLY}>
        {complete ? `${label} complete.` : ""}
      </span>
    </>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the case the component was
 * built for, a task part way through, so the one thing worth seeing at a glance
 * is clear: the fill means "this much is done" and the readout says how much,
 * with no colour asked to carry a level. The label names a fictional upload and
 * the number is synthetic (ADR 0012), because a progress bar counts a task and
 * nothing here is a reading anybody could mistake for their own.
 */
export default function ProgressDemo() {
  return (
    <div className="w-full max-w-sm">
      <Progress label="Uploading photos" value={72} />
    </div>
  )
}
