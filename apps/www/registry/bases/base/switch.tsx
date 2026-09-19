"use client"

/**
 * Switch is a labelled on-or-off control that takes effect the moment it is
 * flipped. Its home is a single setting a reader turns on or off and sees the
 * result of straight away, a "Larger text" toggle in a settings list being the
 * case it was built for. It is not a form value collected now and submitted
 * later, and the difference decides which component you reach for.
 *
 * WHY IT IS A SWITCH AND NOT A CHECKBOX, STATED PLAINLY. A checkbox proposes a
 * value that a form gathers and submits on the reader's command, so nothing
 * happens until they press submit. A switch commits on the flip: the setting it
 * names is different the instant the thumb slides across. Base UI draws the two
 * from different primitives with different roles for exactly this reason, and a
 * reader who hears "switch, on" expects the thing to already be on. So this
 * component is controlled only, like SegmentedControl: the caller holds the
 * boolean, applies the effect, and passes the new value straight back, and the
 * switch keeps no state of its own to drift out of step with what it toggled.
 *
 * WHY BASE UI'S Switch. It renders a span with role="switch" and a hidden input
 * beside it, moves a roving nothing (a switch is a single tab stop), binds Space
 * and Enter to the flip, and stamps data-checked, data-unchecked and
 * data-disabled so the surface can dress each state without the component
 * tracking them in React. Building the same contract by hand would mean
 * restating a WAI-ARIA pattern nobody had tested; leaning on the primitive means
 * the keyboard and the announced role are the ones assistive technology already
 * knows.
 *
 * NEITHER COLOUR AXIS. A switch sets a preference. It names no clinical level
 * and no kind of measurement, so it carries neither data-status nor
 * data-category, and it must never stand in for a status control. The on state
 * is drawn with the bridged primary fill on the track, which is the system's
 * "this is active" role and not a step on the status ramp, and the off state is
 * the muted chrome surface. The state a reader relies on is carried by
 * aria-checked and by the thumb's position, not by the fill alone, so the switch
 * survives greyscale: the thumb sits left for off and right for on, and a
 * hairline around it keeps it legible when a reader stylesheet strips the fills.
 *
 * WHY IT MUST NOT RECORD CONSENT. A switch is a setting, and a setting is
 * changed back as easily as it is changed. Consent is a decision with a record,
 * a who and a when, and reducing it to a toggle loses the record and invites the
 * reader to flip a thing that should be a considered act. That case is
 * ConsentSheet, and this component is documented as the wrong tool for it rather
 * than left to be misused.
 *
 * THE LABEL IS REQUIRED, AND FOR A REASON THE TYPE CANNOT STATE. A bare toggle
 * is unreadable to a screen reader and ambiguous to everyone else, so `label` is
 * mandatory and becomes the switch's accessible name. A missing or empty label
 * raises a development warning rather than shipping an unnamed control. The whole
 * row is a label element, so a reader can flip the switch by pressing the words
 * as well as the track, which is the larger, calmer target a settings list wants.
 */

import { Switch as BaseSwitch } from "@base-ui/react/switch"
import { useId, useState } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * The whole labelled row, spelled once. It is a label element so a press
 * anywhere on it flips the switch, with the words on the left and the track on
 * the right. The 44pt target floor is `--opsin-target-minimum` in rem, so the
 * pressable region grows with the reader's text size rather than pinning at a
 * device pixel, with a literal fallback so the declaration stays valid where the
 * generated token sheet was not installed.
 */
const ROW =
  "flex w-full items-center justify-between gap-opsin-4 " +
  "min-h-(--opsin-target-minimum,2.75rem) cursor-pointer select-none"

/**
 * The track, spelled once.
 *
 * A muted pill in the off state and the bridged primary fill in the on state,
 * with a hairline on both so the shape survives a reader stylesheet that removes
 * the fill. The on colour is `bg-primary`, the "active" role the product theme
 * bridges, not a status step: a switch is on neither colour axis, and the state
 * a reader depends on is aria-checked and the thumb's position rather than the
 * fill. The focus ring is carried here rather than left to the product
 * stylesheet, so a project installed without that stylesheet does not lose it.
 * The transition is chrome only, the fill fading across the flip; the thumb's
 * travel is on the thumb below.
 */
const TRACK =
  "relative inline-flex shrink-0 items-center rounded-full border border-border " +
  "h-opsin-6 w-opsin-10 p-opsin-0-5 bg-muted " +
  "data-[checked]:bg-primary " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

/**
 * The thumb, spelled once. A card-surfaced disc with a hairline, sitting left
 * for off and sliding to the right for on. The travel is the track's inner width
 * minus the thumb: the track is `w-opsin-10` (2.5rem), the two `p-opsin-0-5`
 * insets take 0.25rem and the thumb's own `size-opsin-5` takes 1.25rem, which
 * leaves 1rem, and the track's two 1px `border-border` hairlines take the last
 * 2px, so the exact travel is `calc(1rem - 2px)`. Spelling it out keeps the
 * resting gap the same on the left when off and on the right when on rather than
 * letting the borders push the thumb 2px off-centre. It is a transform rather
 * than a change of layout, so it does not reflow the row, and a CSS transition
 * never fires on first paint, so a switch that mounts already on shows its thumb
 * on the right with no slide.
 */
const THUMB =
  "block size-opsin-5 rounded-full border border-border bg-card " +
  "transition-transform duration-(--opsin-duration-fast) ease-opsin-standard " +
  "data-[checked]:translate-x-[calc(1rem_-_2px)]"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a
 * consumer makes with the clinical API, and a switch asserts nothing clinical.
 * `segmented-control.tsx` and `divider.tsx` keep the same small shape for the
 * same reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface SwitchProps {
  /**
   * Required. The accessible name and the visible words for the control, applied
   * as the switch's `aria-labelledby` so a screen-reader user hears what the
   * toggle sets before its state. Name the setting the switch turns on, "Larger
   * text" rather than "On". There is no default, because a guessed name would
   * describe the wrong thing on most screens, and a missing or empty label
   * raises a development warning rather than rendering an unnamed control.
   */
  label: string
  /**
   * Whether the switch is on. This is a controlled component with no internal
   * state, so the caller holds the boolean, applies the effect the switch names,
   * and passes the new value straight back through `onCheckedChange`.
   */
  checked: boolean
  /**
   * Called with the new boolean when the reader flips the switch. The caller
   * commits the change straight away, because a switch takes effect on the flip
   * rather than on a later submit, and passes the result back as `checked`.
   */
  onCheckedChange: (checked: boolean) => void
  /**
   * An optional helper line under the label, for a sentence that says what the
   * setting does or what turning it on will change. It is read to assistive
   * technology as the switch's description rather than part of its name, so the
   * name stays the label alone. Keep it to one plain sentence; a paragraph
   * belongs above the control, not inside it.
   */
  description?: string
  /**
   * Whether the switch cannot be changed. A disabled switch keeps its current
   * position and its label so the reader can still see the setting and its
   * state, drops the track to a quieter weight, and takes no focus and no key.
   * Defaults to `false`.
   */
  disabled?: boolean
  /**
   * Merged onto the root row. Width, margin and place in a layout belong here. A
   * class you pass wins over the row's own where the two conflict, because it is
   * merged last. It is the one route by which colour can reach the row, and the
   * two-colour-axes rule applies to it in full: a switch takes neither a status
   * nor a category tint.
   */
  className?: string
}

export function Switch({
  label,
  checked,
  onCheckedChange,
  description,
  disabled = false,
  className,
}: SwitchProps) {
  const labelId = useId()
  const descriptionId = useId()

  const trimmedLabel = typeof label === "string" ? label.trim() : ""
  const hasLabel = trimmedLabel.length > 0
  const trimmedDescription = typeof description === "string" ? description.trim() : ""
  const hasDescription = trimmedDescription.length > 0

  if (isDevelopment() && !hasLabel) {
    warnDev(
      "no-label",
      "[opsinjs] <Switch> was rendered with no `label`. A switch needs an " +
        "accessible name: without one a screen-reader user hears a toggle with no " +
        "idea what it sets. Pass `label` with the name of the setting the switch " +
        'turns on, such as "Larger text".',
    )
  }

  return (
    <label data-slot="switch" className={cn(ROW, className)}>
      <span className="flex min-w-0 flex-col gap-opsin-0-5">
        <span
          id={labelId}
          data-slot="switch-label"
          className="text-opsin-body [color:var(--foreground)]"
        >
          {label}
        </span>
        {hasDescription ? (
          <span
            id={descriptionId}
            data-slot="switch-description"
            className="text-opsin-footnote [color:var(--muted-foreground)]"
          >
            {description}
          </span>
        ) : null}
      </span>
      <BaseSwitch.Root
        data-slot="switch-control"
        checked={checked}
        onCheckedChange={(next) => onCheckedChange(next)}
        disabled={disabled}
        aria-labelledby={hasLabel ? labelId : undefined}
        aria-describedby={hasDescription ? descriptionId : undefined}
        className={TRACK}
      >
        <BaseSwitch.Thumb data-slot="switch-thumb" className={THUMB} />
      </BaseSwitch.Root>
    </label>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows a single switch with a
 * label and a helper line, which is the one thing worth seeing at a glance: the
 * whole row is the target, the thumb sits on the right for on, and the on colour
 * is the active fill rather than a status. It holds its own boolean, because the
 * control is controlled and a demo has to close that loop somewhere.
 *
 * The setting is a fictional non-clinical preference (ADR 0012). No reading, no
 * unit and no measurement anybody could mistake for their own data.
 */
export default function SwitchDemo() {
  const [on, setOn] = useState(true)
  return (
    <div className="w-full max-w-sm">
      <Switch
        label="Larger text"
        description="Increases the text size across the app."
        checked={on}
        onCheckedChange={setOn}
      />
    </div>
  )
}
