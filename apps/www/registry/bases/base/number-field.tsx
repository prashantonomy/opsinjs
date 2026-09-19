"use client"

/**
 * NumberField is a single number typed directly or stepped up and down with two
 * buttons. Its home is a plain quantity or a count, the number of copies to
 * print or the number of days to repeat a reminder, where a reader wants to nudge
 * a value one at a time as readily as type it.
 *
 * IT IS NOT A CLINICAL CONTROL, AND THAT IS THE FIRST THING TO KNOW. A number a
 * reader steps with a plus and a minus is the wrong shape for a measurement:
 * a blood pressure or a blood glucose is read off a device and typed in whole,
 * not walked up from a default one press at a time, and the health-aware control
 * that carries a unit, an out-of-range warning the product owns and a compound
 * reading is `reading-input`. This component holds no unit, no reference range
 * and no clinical vocabulary of any kind. It counts. When the number means
 * something a clinician would recognise, the control is `ReadingInput` and not
 * this one, and the type system cannot tell the two apart because both accept a
 * bare number, so the choice is the caller's to make on what the number is.
 *
 * WHY BASE UI'S NumberField. The keyboard contract is the whole reason to reach
 * for a primitive rather than an `<input type="number">` with two buttons bolted
 * on. Base UI (`@base-ui/react/number-field`, 1.7.0) gives the input one tab
 * stop, steps it with the Up and Down arrows, jumps by a larger amount with Page
 * Up and Page Down, snaps to the bounds with Home and End, and stamps each button
 * with its own `aria-label` ("Increase", "Decrease") and an `aria-controls`
 * pointing at the input, so a screen-reader user meets a named spinbutton with
 * two named controls rather than three anonymous boxes. Each stepper also
 * disables itself the moment the value reaches its `min` or `max`, so a reader
 * cannot press past a bound the product set, and this file styles that disabled
 * state rather than inventing it.
 *
 * NEITHER COLOUR AXIS. A count states no clinical level and names no category, so
 * the field carries neither `data-status` nor `data-category` and draws only
 * neutral chrome: a hairline group, a muted hover on the buttons, and the
 * foreground ink. There is no colour prop, and colour that arrives through
 * `className` is the caller's to keep off both axes.
 *
 * NO SCRUB AREA. Base UI offers a `ScrubArea` that changes the value by dragging
 * across a label with the pointer. It is left out on purpose: it is a
 * pointer-only affordance with no keyboard or touch equivalent, so a control that
 * relied on it would hide a way to change the number from anyone not using a
 * mouse. The buttons and the arrow keys are the two routes this field ships, and
 * both work for a touch reader and a keyboard reader alike.
 *
 * THE ACCESSIBLE NAME IS APPLIED AS `aria-label`, the way `segmented-control`
 * names its group. `label` is required: a spinbutton with no name is read as a
 * bare number a reader cannot place, so a missing or empty `label` raises a
 * development warning rather than rendering an unnamed control. A product that
 * wants a visible `<label>` on screen wires one to the input's id and passes the
 * same words here.
 */

import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field"
import { Minus, Plus } from "lucide-react"
import { useState } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * The group, spelled once. A hairline frame that holds the decrement button, the
 * input and the increment button as one object, so the three parts read as a
 * single control rather than three loose boxes. `w-fit` keeps it only as wide as
 * its contents; a caller who wants it to fill a column passes `w-full` through
 * `className`, which is merged last and wins.
 */
const GROUP =
  "inline-flex w-fit items-stretch rounded-opsin-sm border border-input bg-background align-middle"

/**
 * One stepper button, spelled once and shared by both so they cannot drift.
 *
 * The target floor is `--opsin-target-minimum` on both axes, in rem, so each
 * button clears a 44px pressable region and grows with the reader's text size
 * rather than pinning at a device pixel. The literal `2.75rem` fallback keeps the
 * declaration valid where the generated token sheet was not installed, the case
 * `shadcn add` produces, and without it the button would silently shrink.
 *
 * The disabled ink is the measured `--muted-foreground` chrome role rather than
 * an `opacity` wash, because an opacity on the whole button would composite the
 * glyph towards the group and drift its contrast; the button disables itself when
 * the value reaches a bound, which is a state a reader should still be able to
 * read. The focus ring is carried here rather than left to the product
 * stylesheet, so a project installed without that stylesheet keeps it.
 */
const STEPPER =
  "inline-flex shrink-0 items-center justify-center " +
  "min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem) " +
  "cursor-pointer bg-transparent [color:var(--foreground)] " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "hover:bg-state-hover " +
  "disabled:cursor-not-allowed disabled:[color:var(--muted-foreground)] disabled:hover:bg-transparent " +
  "focus-visible:outline-ring focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)]"

/**
 * The input, spelled once. A hairline on each side divides it from the two
 * buttons, and the number is centred and set in `tabular-nums` so the digits do
 * not shuffle sideways as the reader steps through them. The type is the `body`
 * step rather than a pixel size, so a reader who has turned their text size up
 * gets a larger field. `disabled:opacity-70` matches the shipped `field` control,
 * which is the closest analog, a plain text entry rather than a status surface.
 */
const INPUT =
  "min-h-(--opsin-target-minimum,2.75rem) w-16 min-w-0 " +
  "border-x border-input bg-background px-opsin-2 py-opsin-2 " +
  "text-center text-opsin-body [color:var(--foreground)] tabular-nums " +
  "placeholder:text-muted-foreground " +
  "focus-visible:outline-ring focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] " +
  "disabled:opacity-70"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a
 * consumer makes with the clinical API, and a count asserts nothing clinical, so
 * a plain development warning is the honest channel and minting a code is not this
 * file's to do. `segmented-control.tsx` and `divider.tsx` keep the same shape.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface NumberFieldProps {
  /**
   * Required. The accessible name for the field, applied as `aria-label` on the
   * input, so a screen-reader user hears what the number counts before its value.
   * Name the thing being counted, "Number of copies" rather than "Number", and
   * keep it the count itself rather than a unit or a measurement. There is no
   * default, because a guessed name would describe the wrong thing on most
   * screens, and a missing or empty value raises a development warning.
   */
  label: string
  /**
   * The current value, or `null` when the field is empty. This is a controlled
   * component with no internal value state: the caller stores the number and
   * passes it back, so clearing the input reports `null` and the caller decides
   * what an empty count means.
   */
  value: number | null
  /**
   * Called with the new value when the reader types, steps with a button, or
   * steps with the arrow keys, and with `null` when the field is cleared. The
   * caller stores it and passes it back as `value`; the field keeps no value of
   * its own.
   */
  onValueChange: (value: number | null) => void
  /**
   * The smallest value the reader can reach. The decrement button disables itself
   * at this bound and the field will not step below it. Omitted, there is no
   * lower bound. This is a count's floor, such as zero copies, and never a
   * clinical range: the field holds no reference range and reaches no verdict
   * about the number it carries.
   */
  min?: number
  /**
   * The largest value the reader can reach. The increment button disables itself
   * at this bound and the field will not step above it. Omitted, there is no
   * upper bound.
   */
  max?: number
  /**
   * How far one press of a button or one arrow key moves the value. Defaults to
   * `1`, which is the right amount for a count. Set it to match the smallest
   * change the count is measured in, such as `1` for whole copies.
   */
  step?: number
  /**
   * Whether the whole field is unavailable. A disabled field drops its buttons to
   * the muted ink and takes no typing, and it stays on screen so the reader can
   * see the count is there but not theirs to change right now. Defaults to
   * `false`.
   */
  disabled?: boolean
  /**
   * Merged onto the root. Width, margin and place in a layout belong here. It is
   * the one route by which colour can reach the field, and a NumberField takes
   * neither a status nor a category tint, so the two-colour-axes rule applies to
   * it in full. A class you pass wins over the root's own where the two conflict,
   * because it is merged last.
   */
  className?: string
}

export function NumberField({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  disabled = false,
  className,
}: NumberFieldProps) {
  if (isDevelopment()) {
    if (typeof label !== "string" || label.trim() === "") {
      warnDev(
        "no-label",
        "[opsinjs] <NumberField> was rendered with no `label`. The input is a " +
          "spinbutton and needs an accessible name: without one a screen-reader " +
          "user hears a bare number with no idea what it counts. Pass `label` " +
          'with the name of the thing being counted, such as "Number of copies".',
      )
    }

    if (
      typeof min === "number" &&
      typeof max === "number" &&
      min > max
    ) {
      warnDev(
        `min-over-max:${String(min)}:${String(max)}`,
        `[opsinjs] <NumberField min={${String(min)}} max={${String(max)}}> has a ` +
          "`min` greater than its `max`, so there is no value the reader can " +
          "reach. Set `min` below `max`, or drop one of the two bounds.",
      )
    }
  }

  return (
    <NumberFieldPrimitive.Root
      data-slot="number-field"
      value={value}
      onValueChange={(next) => onValueChange(next)}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn(className)}
    >
      <NumberFieldPrimitive.Group data-slot="number-field-group" className={GROUP}>
        <NumberFieldPrimitive.Decrement
          data-slot="number-field-decrement"
          className={cn(STEPPER, "rounded-l-opsin-sm")}
        >
          <Minus aria-hidden="true" className="size-5" />
        </NumberFieldPrimitive.Decrement>
        <NumberFieldPrimitive.Input
          data-slot="number-field-input"
          aria-label={label}
          className={INPUT}
        />
        <NumberFieldPrimitive.Increment
          data-slot="number-field-increment"
          className={cn(STEPPER, "rounded-r-opsin-sm")}
        >
          <Plus aria-hidden="true" className="size-5" />
        </NumberFieldPrimitive.Increment>
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It holds its own value, because the
 * field is controlled and a demo has to close that loop somewhere, and it shows a
 * bounded count with the increment and decrement buttons flanking the number, so
 * the one thing worth seeing at a glance is clear: the field reads as a single
 * neutral control, and no colour is doing any work.
 *
 * The label names a fictional count (ADR 0012). No unit, no reference range and
 * no measurement anybody could mistake for their own reading; a NumberField
 * counts, and a count of example copies is the plainest thing it can hold.
 */
export default function NumberFieldDemo() {
  const [copies, setCopies] = useState<number | null>(2)
  return (
    <NumberField
      label="Number of copies"
      value={copies}
      onValueChange={setCopies}
      min={1}
      max={10}
      step={1}
    />
  )
}
