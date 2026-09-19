"use client"

/**
 * Slider sets a single coarse value by dragging a thumb along a track. Its home
 * is a rough, non-clinical preference: a brightness level, a fuzzy nought to a
 * hundred sense of "how much", a setting where the exact number does not matter
 * and the gesture of sliding towards more or less is the point.
 *
 * IT IS NEVER FOR A CLINICAL READING OR A MEASUREMENT, AND THAT LIMIT IS THE
 * FIRST THING TO SAY. A slider cannot express precision: the thumb lands on
 * whatever pixel the finger left it on, snapped to a step the control chose, and
 * the reader has no way to say "one hundred and eighteen" rather than "about a
 * hundred and twenty". A measurement is a number the person meant, so a blood
 * pressure, a glucose value or a dose is typed, not dragged. For a measurement
 * with clinical semantics the component is ReadingInput, and for a precise
 * quantity with none it is NumberField. A slider that carried a reading would
 * turn a value the person meant into a value the pixel chose, which is the one
 * thing a health surface must not do, so this component documents the refusal
 * rather than adding a "precise mode" that would invite the mistake.
 *
 * WHY BASE UI'S Slider RATHER THAN A RANGE INPUT DRESSED UP. A native
 * `<input type="range">` is one element, so the filled portion, the thumb and
 * the track cannot be styled and measured apart, and its keyboard and pointer
 * behaviour differs across browsers in ways nobody wants to re-test. Base UI's
 * Slider splits the control into Root, Label, Value, Control, Track, Indicator
 * and Thumb, keeps a real `<input type="range">` inside the thumb for assistive
 * technology and forms, and wires the Label to that input through its field
 * context so the thumb carries an accessible name without a second `aria-label`
 * to keep in sync. The Arrow keys, Home, End, Page Up and Page Down all come
 * from the primitive rather than from a bespoke handler this file would own.
 *
 * NEITHER COLOUR AXIS. A slider sets a preference; it states no clinical level
 * and names no kind of measurement, so it carries neither `data-status` nor
 * `data-category` and draws only neutral chrome. The track is the muted rail,
 * the filled portion is the bridged `primary` role, and the thumb is a card
 * surface with a hairline. A red on this control would mean nothing, and a red
 * that meant nothing beside a status pill that used red for "act now" is exactly
 * the axis mixing the system forbids.
 *
 * THE THUMB FLOORS A 44px TARGET EVEN WHEN THE KNOB IS SMALLER. The visible knob
 * is deliberately small so the track reads as a thin rail, but a small knob is a
 * small thing to hit with a finger. So the thumb's hit area is floored at
 * `--opsin-target-minimum` on both axes, in rem so it grows with the reader's
 * text size, and the knob is drawn centred inside that box. The reader presses a
 * comfortable target and sees a tidy knob, and the two are not the same size on
 * purpose.
 *
 * IT IS A CLIENT COMPONENT, BECAUSE DRAGGING IS BEHAVIOUR. The pointer tracking,
 * the roving value and the keyboard stepping all run in the browser, so the file
 * carries the `"use client"` directive that Base UI's interactive primitives
 * require. There is no server form of a control the whole point of which is to be
 * dragged.
 */

import { Slider as BaseSlider } from "@base-ui/react/slider"
import { useState } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * Development warnings for uncoded mistakes, said once per distinct offender.
 * Nothing here has an OpsinErrorCode: a slider asserts nothing clinical, so the
 * codes in `tokens/errors.json` do not apply, and minting one is not this file's
 * to do. `segmented-control.tsx` and `divider.tsx` keep the same small set for
 * the same reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

/**
 * The root, a flex column holding the header row above the track. The header
 * carries the label and the value readout on one line, and the control sits
 * under them, so the reader reads what the control sets, sees where it is, and
 * then drags.
 */
const ROOT = "flex w-full flex-col gap-opsin-2"

/**
 * The header row: the label to the inline start, the value readout to the inline
 * end, both on the baseline so a taller value figure does not push the label off
 * its line.
 */
const HEADER = "flex items-baseline justify-between gap-opsin-3"

/**
 * The label, wired to the thumb's input by Base UI's field context so it names
 * the control without a second `aria-label`. It is set at the subheadline step
 * and the foreground ink, written as the arbitrary property so tailwind-merge
 * does not file it in the same conflict group as the type step and drop one.
 */
const LABEL = "text-opsin-subheadline font-medium [color:var(--foreground)]"

/**
 * The value readout, a Base UI `<output>` that mirrors the thumb's value as
 * text. It is quieter than the label, at the muted ink, and its figures are
 * tabular so the number does not jitter sideways as it changes while dragging.
 */
const VALUE =
  "text-opsin-subheadline tabular-nums [color:var(--muted-foreground)]"

/**
 * The control, the region the pointer acts on. It floors its own height at the
 * target minimum so the thumb, which overflows the thin track, is never clipped,
 * and it turns off touch scrolling and text selection so a drag along the track
 * is a drag rather than a page scroll or a text highlight. `cursor-pointer`
 * becomes `not-allowed` when the slider is disabled.
 */
const CONTROL =
  "relative flex w-full items-center min-h-(--opsin-target-minimum,2.75rem) " +
  "cursor-pointer touch-none select-none data-[disabled]:cursor-not-allowed"

/**
 * The track, a thin muted rail with a hairline so it reads as a groove the fill
 * runs along rather than as a floating bar. `rounded-full` rounds both ends.
 */
const TRACK =
  "relative h-opsin-1 w-full rounded-full border border-border bg-muted"

/**
 * The filled portion, from the start of the track to the thumb. It draws the
 * bridged `primary` role, which resolves to a colour both under the docs chrome
 * and at `/view`, and it inherits the track's height. It is neutral chrome, not
 * a status: the fill says "this much", never "this urgent".
 */
const INDICATOR = "rounded-full bg-primary"

/**
 * The thumb: the 44px hit area, transparent and centred on the value by Base UI.
 * It is a flex box that centres the visible knob, and it is a `group` so the
 * knob can pick up the focus ring when the input inside the thumb takes
 * `:focus-visible`. The primitive positions it absolutely, so this class sets no
 * position of its own.
 */
const THUMB =
  "group flex items-center justify-center outline-none " +
  "min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem)"

/**
 * The visible knob, drawn smaller than the hit area on purpose: a card surface
 * with a hairline so it lifts off the fill in both themes and survives greyscale
 * by its boundary rather than by a hue.
 *
 * The focus ring is carried here rather than on the transparent hit box, so the
 * ring hugs the knob a reader can see instead of floating around a 44px void,
 * and it is keyed off the thumb group's `:focus-visible` because the element
 * that actually takes focus is the `<input>` Base UI nests inside the thumb. The
 * ring lives in the component's own classes so a project installed without the
 * product stylesheet still gets it. A disabled knob flattens into the muted
 * surface and drops its hairline, so it reads as unavailable without an opacity
 * wash that would drift its contrast.
 */
const KNOB =
  "size-opsin-5 rounded-full border border-border bg-card " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "group-has-[:focus-visible]:outline-[length:var(--opsin-border-focus,2px)] " +
  "group-has-[:focus-visible]:outline-offset-[var(--opsin-border-focus-offset,2px)] " +
  "group-has-[:focus-visible]:outline-ring " +
  "group-data-[disabled]:border-transparent group-data-[disabled]:bg-muted"

export interface SliderProps {
  /**
   * Required. The accessible name for the control, shown as the visible label
   * above the track and wired to the thumb's input by Base UI, so a
   * screen-reader user hears what the slider sets before its value. Name the
   * preference the slider adjusts, "Screen brightness" rather than a bare
   * number. There is no default, because a guessed name would describe the wrong
   * thing on most screens, and a slider with no name is a control a reader cannot
   * place.
   */
  label: string
  /**
   * The current value, matching a point between `min` and `max`. This is the
   * controlled value: the caller stores it and passes it back, and the control
   * keeps no value of its own. It is a single number, because this is a
   * single-thumb slider for one coarse preference, not a range.
   */
  value?: number
  /**
   * Called with the new number as the reader drags, steps or presses the track.
   * The caller stores it and passes it back as `value`.
   */
  onValueChange?: (value: number) => void
  /**
   * The lowest value the thumb can reach, and the origin the steps count from.
   * Defaults to 0.
   */
  min?: number
  /**
   * The highest value the thumb can reach. Should differ from `min`. Defaults to
   * 100, the fuzzy nought to a hundred range a coarse preference usually wants.
   */
  max?: number
  /**
   * The granularity the thumb snaps to. A larger step makes a coarser control,
   * which is honest for a preference nobody needs to the unit. Defaults to 1.
   */
  step?: number
  /**
   * Whether the control ignores input. A disabled slider still shows its value
   * and stays readable; the knob flattens into the muted surface and the cursor
   * reads as not allowed. Defaults to false.
   */
  disabled?: boolean
  /**
   * Merged onto the root. Width, margin and place in a layout belong here. It is
   * the one route by which colour can reach a slider, and the two-colour-axes
   * rule applies to it in full: a slider takes neither a status nor a category
   * tint. A class you pass wins over the root's own where the two conflict,
   * because it is merged last.
   */
  className?: string
}

export function Slider({
  label,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className,
}: SliderProps) {
  if (isDevelopment()) {
    if (typeof label !== "string" || label.trim() === "") {
      warnDev(
        "no-label",
        "[opsinjs] <Slider> was rendered with no `label`. The control needs an " +
          "accessible name: without one a screen-reader user hears a range input " +
          "with no idea what it sets. Pass `label` with the name of the " +
          'preference the slider adjusts, such as "Screen brightness".',
      )
    }

    if (typeof min === "number" && typeof max === "number" && min >= max) {
      warnDev(
        `min-not-below-max:${String(min)}:${String(max)}`,
        `[opsinjs] <Slider min={${String(min)}} max={${String(max)}}> has a min ` +
          "that is not below its max, so the thumb has nowhere to travel. Pass a " +
          "`min` lower than `max`.",
      )
    }
  }

  return (
    <BaseSlider.Root
      data-slot="slider"
      value={value}
      onValueChange={(next) =>
        onValueChange?.(Array.isArray(next) ? Number(next[0]) : Number(next))
      }
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn(ROOT, className)}
    >
      <div className={HEADER}>
        <BaseSlider.Label data-slot="slider-label" className={LABEL}>
          {label}
        </BaseSlider.Label>
        <BaseSlider.Value data-slot="slider-value" className={VALUE} />
      </div>
      <BaseSlider.Control data-slot="slider-control" className={CONTROL}>
        <BaseSlider.Track data-slot="slider-track" className={TRACK}>
          <BaseSlider.Indicator
            data-slot="slider-indicator"
            className={INDICATOR}
          />
          <BaseSlider.Thumb data-slot="slider-thumb" className={THUMB}>
            <span aria-hidden="true" className={KNOB} />
          </BaseSlider.Thumb>
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It holds its own value, because the
 * control is controlled and a demo has to close that loop somewhere, and it
 * shows the one thing worth seeing at a glance: a coarse preference with its
 * value read out beside the label, where the exact number plainly does not
 * matter and the point is roughly how far along the track the thumb sits.
 *
 * The label names a fictional, non-clinical preference (ADR 0012). No reading,
 * no unit and no measurement anybody could mistake for their own data, because a
 * slider is the one control that must never carry one.
 */
export default function SliderDemo() {
  const [brightness, setBrightness] = useState(60)
  return (
    <div className="w-full max-w-sm">
      <Slider
        label="Example display brightness"
        value={brightness}
        onValueChange={setBrightness}
      />
    </div>
  )
}
