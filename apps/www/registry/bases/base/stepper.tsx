/**
 * Stepper shows where a reader is in a fixed, ordered sequence of steps. It
 * marks each step as complete, current or upcoming, and it does nothing else.
 *
 * IT IS AN INDICATOR, NOT A FLOW ENGINE, AND THAT IS THE WHOLE POINT. There is
 * no onStepClick, no navigation, no next or back, and no way for the reader to
 * change the step from inside it. `current` is a value the product passes in
 * from a flow it already owns, and this component reflects it. The catalogue
 * deferred a stepper for a real reason, which is that a bar of steps across the
 * top of a screen invites a product to cram several questions onto one page,
 * and the pattern a health form wants is one question per page. So this file
 * refuses the part of a stepper that does the harm and keeps only the part that
 * reassures: a read-only picture of how far along the reader is.
 *
 * THREE STATES, CARRIED WITHOUT COLOUR. A completed step draws a solid marker
 * with a Check glyph and an sr-only "Completed"; the current step draws a
 * heavier ring around its number and carries aria-current="step" and an sr-only
 * "Current step"; an upcoming step draws a faint ring around its number in
 * muted ink. The three differ by fill weight, by glyph, by the words a screen
 * reader reads, and by their position in the list, so the state survives
 * greyscale, a colour vision deficiency and a black-and-white printout. No step
 * state is carried by hue.
 *
 * NEITHER COLOUR AXIS. A stepper states no clinical level and names no category,
 * so it carries neither data-status nor data-category and draws only neutral
 * chrome. The complete, current and upcoming markers are separated on a neutral
 * ink-to-muted ramp and by the boundary weight of a hairline, never by a status
 * tint or a category identity. The connector between two markers changes weight
 * rather than colour to show the part of the sequence already passed.
 *
 * IT REFUSES A BAD `current` RATHER THAN THROWING. `current` is a 0-based index
 * into `steps`. A value outside the range, or a non-integer, is truncated and
 * clamped to the nearest real step and a development warning names it, because
 * a progress indicator that renders nothing is useless and a step the product
 * did not choose is a lie. The product owns which step the reader is on; this
 * file owns only how it is drawn.
 *
 * SERVER COMPONENT. It has no state, no effect and no event handler, so it
 * ships without "use client" and renders on the server.
 */

import { Check } from "lucide-react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * One step in the sequence. Kept as a local type rather than a fourth public
 * export, for the reason segmented-control.tsx gives about its own option
 * shape: the registry contract fixes a file at three public exports, so a
 * consumer names this as `StepperProps["steps"][number]` rather than importing
 * a fourth symbol.
 */
interface StepperStep {
  /**
   * The visible words for this step, and what a screen reader reads for it.
   * Keep it short and parallel with the others.
   */
  label: string
  /**
   * An optional supporting line beneath the label, at the footnote step in
   * muted ink. Use it for a short clarification of what the step covers, not
   * for an instruction the reader must act on, because this control cannot be
   * operated.
   */
  description?: string
}

/**
 * The three states a step can be in, derived from its index against `current`.
 * Never exported.
 */
type StepState = "complete" | "current" | "upcoming"

/**
 * The marker circle per state, written out as literal strings because Tailwind
 * reads class names as text and a `bg-${state}` template generates no CSS. All
 * three share a border-2 so the ring weight never shifts the marker's box, and
 * the ink is the arbitrary property `[color:var(--foreground)]` rather than
 * `text-foreground` for the tailwind-merge reason segmented-control.tsx sets
 * out at length. The three states differ by fill and boundary weight on a
 * neutral ramp, never by hue.
 */
const MARKER_STATE: Record<StepState, string> = {
  complete: "border-foreground bg-foreground [color:var(--background)]",
  current: "border-foreground bg-card [color:var(--foreground)]",
  upcoming: "border-border bg-background [color:var(--muted-foreground)]",
}

/**
 * The marker circle, spelled once. Not pressable, so no 44pt target floor: it
 * is a read-only mark, not a button.
 */
const MARKER =
  "flex size-opsin-8 shrink-0 items-center justify-center rounded-full " +
  "border-2 text-opsin-footnote font-medium tabular-nums"

/**
 * The label per state. The current step's label gains weight so the current
 * position reads without leaning on the marker alone, and an upcoming label
 * drops to the muted ink. Written as `[color:var(--foreground)]` for the same
 * tailwind-merge reason as the marker.
 */
const LABEL_STATE: Record<StepState, string> = {
  complete: "[color:var(--foreground)]",
  current: "font-medium [color:var(--foreground)]",
  upcoming: "[color:var(--muted-foreground)]",
}

/**
 * The vertical line between two markers. It runs stronger where the step above
 * it is complete and faint where it is not, so the part of the sequence
 * already passed reads by weight and not by colour. Decorative, so it is
 * aria-hidden.
 */
const CONNECTOR_STATE: Record<"done" | "todo", string> = {
  done: "bg-foreground",
  todo: "bg-border",
}

const CONNECTOR = "mt-opsin-1 w-0.5 flex-1 rounded-full"

/**
 * The word a screen reader reads for each state, so the state is never colour
 * alone.
 */
const STATE_SR: Record<StepState, string> = {
  complete: "Completed",
  current: "Current step",
  upcoming: "Upcoming",
}

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * OpsinErrorCode: the codes in tokens/errors.json describe a mistake a
 * consumer makes with the clinical API, and a stepper asserts nothing
 * clinical. segmented-control.tsx keeps the same small uncoded set for the
 * same reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface StepperProps {
  /**
   * The steps, in the order the reader moves through them. Two or more: one
   * step is not a sequence and nothing is a sequence with none. Each step is a
   * short `label` and an optional `description`. The order here is the order
   * drawn, so order the steps the way the reader progresses, not the way a
   * table stores them.
   */
  steps: StepperStep[]
  /**
   * The 0-based index of the step the reader is on now. Every step before it
   * is drawn complete, the step at this index is drawn current and carries
   * aria-current="step", and every step after it is drawn upcoming. This is a
   * value the product passes from a flow it owns; the component keeps no
   * state. A value outside the range, or a non-integer, is truncated and
   * clamped to the nearest real step and a development warning names it,
   * because a progress indicator that renders nothing is useless.
   */
  current: number
  /**
   * Merged onto the root list. Width, margin and place in a layout belong
   * here. A class you pass wins over the list's own where the two conflict,
   * because it is merged last.
   */
  className?: string
}

export function Stepper({ steps, current, className }: StepperProps) {
  if (isDevelopment()) {
    if (!Array.isArray(steps) || steps.length === 0) {
      warnDev(
        "no-steps",
        "[opsinjs] Stepper was rendered with no steps, so it has nothing to " +
          "draw. Pass a `steps` array of at least two labelled steps.",
      )
    } else {
      if (steps.length === 1) {
        warnDev(
          "one-step",
          "[opsinjs] Stepper was given a single step, which is not a sequence. " +
            "A step indicator earns its place only once there are two or more " +
            "steps to show progress across; render one thing as a heading " +
            "instead.",
        )
      }
      if (!Number.isInteger(current) || current < 0 || current >= steps.length) {
        warnDev(
          `current-out-of-range:${String(current)}`,
          `[opsinjs] Stepper current={${String(current)}} is outside the range ` +
            `of the ${steps.length} steps supplied, so it has been clamped to ` +
            "the nearest step. `current` is a 0-based index into `steps`, and " +
            "the product owns which step the reader is on.",
        )
      }
      steps.forEach((step, index) => {
        if (typeof step?.label !== "string" || step.label.trim() === "") {
          warnDev(
            `step-missing-label:${index}`,
            `[opsinjs] Stepper step ${index} has no \`label\`. Every step needs ` +
              "a short label naming what happens at it, otherwise the reader " +
              "meets a numbered marker with nothing to read.",
          )
        }
      })
    }
  }

  if (!Array.isArray(steps) || steps.length === 0) {
    return null
  }

  const activeIndex = Math.max(
    0,
    Math.min(Math.trunc(Number(current) || 0), steps.length - 1),
  )

  return (
    <ol data-slot="stepper" className={cn("flex flex-col", className)}>
      {steps.map((step, index) => {
        const state: StepState =
          index < activeIndex
            ? "complete"
            : index === activeIndex
              ? "current"
              : "upcoming"
        const isLast = index === steps.length - 1
        return (
          <li
            key={index}
            data-slot="stepper-step"
            aria-current={state === "current" ? "step" : undefined}
            className="flex gap-opsin-3"
          >
            <div className="flex flex-col items-center">
              <span
                data-slot="stepper-marker"
                className={cn(MARKER, MARKER_STATE[state])}
              >
                {state === "complete" ? (
                  <Check aria-hidden="true" className="size-[1em]" />
                ) : (
                  index + 1
                )}
              </span>
              {!isLast ? (
                <span
                  data-slot="stepper-connector"
                  aria-hidden="true"
                  className={cn(
                    CONNECTOR,
                    index < activeIndex ? CONNECTOR_STATE.done : CONNECTOR_STATE.todo,
                  )}
                />
              ) : null}
            </div>
            <div className={cn("flex flex-col gap-opsin-0-5", !isLast && "pb-opsin-6")}>
              <span
                data-slot="stepper-label"
                className={cn("text-opsin-subheadline", LABEL_STATE[state])}
              >
                {step.label}
              </span>
              {step.description ? (
                <span className="text-opsin-footnote [color:var(--muted-foreground)]">
                  {step.description}
                </span>
              ) : null}
              <span className="sr-only">{STATE_SR[state]}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is
 * public, reviewed code rather than a scratch demo. It shows a four-step flow
 * with one step complete, one current and two upcoming, which is the one
 * thing worth seeing at a glance: that the three states are told apart by the
 * solid marker and its Check glyph, the heavier ring on the current step, and
 * the faint ring on the ones still to come, without a colour doing the work.
 * Read it in greyscale to check that.
 *
 * The labels name a fictional walkthrough (ADR 0012). No number, no unit and
 * no measurement anybody could mistake for their own reading.
 */
export default function StepperDemo() {
  return (
    <Stepper
      current={1}
      steps={[
        { label: "Create your example account" },
        { label: "Confirm the sample email" },
        { label: "Choose demo preferences" },
        { label: "Finish the sample tour" },
      ]}
    />
  )
}
