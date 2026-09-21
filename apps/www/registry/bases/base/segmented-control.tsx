"use client"

/**
 * SegmentedControl is a row of mutually exclusive options with exactly one
 * chosen at a time. Its home is switching a single view between a small set of
 * windows, a chart's day, week or month range being the case it was built for.
 *
 * IT IS ONE TAB STOP, AND THAT IS THE WHOLE POINT. A reader arrowing along a
 * row of options expects Tab to pass the row rather than to stop on every
 * option in it, and a keyboard user who meets four tab stops where the design
 * promised one has been given a control that reads as four. So the control is a
 * radio group: the group takes the single tab stop, and Arrow keys move a
 * roving focus between the options inside it.
 *
 * WHY BASE UI'S RadioGroup RATHER THAN THE SHIPPED Button. A segmented control
 * looks like a row of buttons, so the first instinct is to build it from four
 * `<Button>`s. That instinct is wrong here for a reason written into `button.tsx`:
 * Base UI's `useButton` stamps `tabIndex={0}` on every control it renders, so a
 * row of four Buttons is four tab stops, which is exactly the contract this
 * control exists to refuse. RadioGroup is built on Base UI's Composite
 * primitive instead, which keeps one roving tab stop across the whole group and
 * moves it with the Arrow keys. It renders `role="radiogroup"`, each Radio
 * renders `role="radio"` with `aria-checked`, and selection follows focus, which
 * is the WAI-ARIA radio group pattern rather than a bespoke one nobody has
 * tested. Home and End are not bound: the RadioGroup primitive disables them,
 * and this file does not reach past it to add them, so the page says so rather
 * than claiming a key that does nothing.
 *
 * WHAT IT COSTS, STATED RATHER THAN SOFTENED. Enter does nothing on a segment:
 * the primitive cancels Enter on a radio so a segmented control at the foot of a
 * form does not submit it by accident, and a segment is chosen with the Arrow
 * keys or Space instead. Each Radio also renders a visually hidden
 * `<input type="radio">` beside its span, for a form value it never carries here
 * because no `name` is passed; it is `aria-hidden` and out of the tab order, so
 * it changes nothing a reader meets, and it is named in the anatomy prose rather
 * than hidden from it.
 *
 * NEITHER COLOUR AXIS. A segmented control sets a parameter of a view; it states
 * no clinical level and names no category, so it carries neither `data-status`
 * nor `data-category` and draws only neutral chrome. The selected segment is
 * lifted with the card surface and a hairline rather than by a hue, so the
 * selection survives greyscale and reads without colour, and the semantic
 * carrier underneath it is `aria-checked` rather than any pixel at all.
 */

import { Radio } from "@base-ui/react/radio"
import { RadioGroup } from "@base-ui/react/radio-group"
import { useState } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * One option in the row. Kept as a local type rather than a fourth public
 * export, for the reason `button.tsx` gives about its own `ButtonVariant`: the
 * registry contract fixes a file at three public exports, so a consumer names
 * this shape as `SegmentedControlProps["options"][number]` rather than importing
 * a fourth symbol.
 */
interface SegmentedControlOption {
  /** The value this option sets. Unique within the row, and what `value` matches. */
  value: string
  /** The visible words, and part of what a screen reader reads for the option. */
  label: string
  /**
   * Whether this option cannot be chosen. A disabled segment drops to the muted
   * ink and is skipped by the Arrow keys rather than removed, so the reader can
   * still see it is an option that is not available to them right now.
   */
  disabled?: boolean
}

/**
 * Padding and type step per size, written out as literal class strings because
 * Tailwind reads class names out of source as text and `px-opsin-${n}` generates
 * no CSS. `md` sets the label at the headline step; `sm` is narrower and a step
 * quieter. Neither sets a height: the target floor below is the same for both,
 * so `sm` is narrower and never shorter, which is what density-and-touch asks
 * of a compact control.
 */
const SIZE: Record<"sm" | "md", string> = {
  sm: "px-opsin-3 py-opsin-1 text-opsin-subheadline",
  md: "px-opsin-4 py-opsin-2 text-opsin-headline",
}

/**
 * The track, spelled once. A muted rail with a hairline, so the row reads as one
 * object with the options set into it. `inline-flex` becomes `flex w-full` when
 * `fullWidth` is set, and tailwind-merge keeps the later `flex`.
 */
const TRACK =
  "inline-flex items-stretch gap-opsin-0-5 rounded-opsin-lg border border-border bg-muted p-opsin-0-5 align-middle"

/**
 * One segment, spelled once.
 *
 * The selected state is carried three ways so none of them is load-bearing
 * alone: `aria-checked` for assistive technology, the `--card` surface lifting
 * the segment off the muted track for a sighted reader, and a `--border`
 * hairline around it for greyscale and for a reader stylesheet that strips
 * fills. Every segment carries a transparent border in its rest state so the
 * selected one gaining a visible border shifts nothing.
 *
 * The ink is written as the arbitrary property `[color:var(--foreground)]` and
 * not `text-foreground`, for the reason `button.tsx` sets out at length:
 * tailwind-merge files a `text-*` colour in the same conflict group as the
 * `text-opsin-*` type step and drops one of them. The arbitrary property lands
 * in the `color` group instead, so the ink and the size both survive. The
 * disabled ink is the measured `--muted-foreground` chrome role rather than an
 * opacity wash, because an `opacity` on the segment would composite the label
 * and the fill together and drift both towards the track, which is the contrast
 * trap the same file records.
 *
 * The focus ring is carried here rather than left to the product stylesheet, so
 * a project installed without that stylesheet does not lose it. The 44pt target
 * floor is `--opsin-target-minimum` in rem, so it grows with the reader's text
 * size rather than pinning at a device pixel, with a literal fallback so the
 * declaration stays valid where the generated token sheet was not installed. The
 * floor sits on both axes, so a one-character label or the `sm` size cannot
 * shrink a segment below the minimum hit area.
 */
const SEGMENT =
  "relative inline-flex select-none items-center justify-center whitespace-normal " +
  "rounded-opsin-md border border-transparent align-middle text-center " +
  "min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem) cursor-pointer [color:var(--foreground)] " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "data-[unchecked]:hover:bg-state-hover " +
  "data-[checked]:border-border data-[checked]:bg-card " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:[color:var(--muted-foreground)] data-[disabled]:hover:bg-transparent " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a
 * consumer makes with the clinical API, and a segmented control asserts nothing
 * clinical. `button.tsx` and `disclaimer-note.tsx` keep the same small set for
 * the same reason, and the repair, real codes in `lib/opsinjs.ts`, is not this
 * file's to make.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface SegmentedControlProps {
  /**
   * The options, in the order they appear. Two or more: a control offering one
   * option is not a choice, and a control offering none has nothing to render.
   * Each option is a value, a visible label and an optional `disabled` flag.
   */
  options: SegmentedControlOption[]
  /**
   * The currently chosen value, matching one option's `value`. This is a
   * controlled component with no internal selection state, so a `value` that
   * matches no option renders the row with nothing chosen, and a development
   * warning names it.
   */
  value: string
  /**
   * Called with the new value when the reader chooses a different segment. The
   * caller stores it and passes it back as `value`; the control keeps no state
   * of its own.
   */
  onValueChange: (value: string) => void
  /**
   * Required. The accessible name for the group, applied as `aria-label` on the
   * radiogroup, so a screen-reader user hears what the row selects before its
   * options. Name the parameter the row sets, "Chart window" rather than "day,
   * week, month". There is no default, because a guessed name would describe the
   * wrong thing on most screens.
   */
  label: string
  /**
   * Visual weight only. `md` sets the label at the headline step; `sm` is
   * narrower and a step quieter. Both clear the target floor, so `sm` is never
   * shorter. Defaults to `md`.
   */
  size?: "sm" | "md"
  /**
   * Fills the width of its container, with the segments sharing it equally. For
   * a control that spans a card or a toolbar. Defaults to `false`, where the row
   * is only as wide as its options.
   */
  fullWidth?: boolean
  /**
   * Merged onto the root track. Width, margin and place in a layout belong here.
   * A class you pass wins over the track's own where the two conflict, because
   * it is merged last.
   */
  className?: string
}

export function SegmentedControl({
  options,
  value,
  onValueChange,
  label,
  size = "md",
  fullWidth = false,
  className,
}: SegmentedControlProps) {
  if (isDevelopment()) {
    if (!Array.isArray(options) || options.length === 0) {
      warnDev(
        "no-options",
        "[opsinjs] <SegmentedControl> was rendered with no options, so it has " +
          "nothing to draw. A segmented control is a choice between two or more " +
          "mutually exclusive options; supply them through the `options` prop.",
      )
    } else if (options.length === 1) {
      warnDev(
        "one-option",
        "[opsinjs] <SegmentedControl> was given a single option, which is not a " +
          "choice. Either add the other options, or render the one thing as a " +
          "label rather than a control the reader cannot change.",
      )
    }

    if (typeof label !== "string" || label.trim() === "") {
      warnDev(
        "no-label",
        "[opsinjs] <SegmentedControl> was rendered with no `label`. The group is " +
          "a radiogroup and needs an accessible name: without one a screen-reader " +
          "user hears a set of radios with no idea what they select. Pass `label` " +
          'with the name of the parameter the row sets, such as "Chart window".',
      )
    }

    if (
      Array.isArray(options) &&
      options.length > 0 &&
      !options.some((option) => option.value === value)
    ) {
      warnDev(
        `value-not-in-options:${String(value)}`,
        `[opsinjs] <SegmentedControl value="${String(value)}"> does not match any ` +
          "option's value, so the row renders with nothing chosen. This is a " +
          "controlled component: pass a `value` equal to one option's `value`.",
      )
    }
  }

  if (!Array.isArray(options) || options.length === 0) {
    return null
  }

  return (
    <RadioGroup
      data-slot="segmented-control"
      aria-label={label}
      value={value}
      onValueChange={(next) => onValueChange(String(next))}
      className={cn(TRACK, fullWidth ? "flex w-full" : null, className)}
    >
      {options.map((option) => (
        <Radio.Root
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          data-slot="segmented-control-segment"
          className={cn(SEGMENT, SIZE[size], fullWidth ? "flex-1 basis-0" : null)}
        >
          <span data-slot="segmented-control-label">{option.label}</span>
        </Radio.Root>
      ))}
    </RadioGroup>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It holds its own selection state,
 * because the control is controlled and a demo has to close that loop somewhere,
 * and it shows a three-option row with one segment chosen, which is the one
 * thing worth seeing at a glance: that the options read as siblings and the
 * chosen one is lifted without a colour doing the work. Read it in greyscale to
 * check that.
 *
 * The labels name a fictional range switch (ADR 0012). No number, no unit and no
 * measurement anybody could mistake for their own reading.
 */
export default function SegmentedControlDemo() {
  const [range, setRange] = useState("recent")
  return (
    <SegmentedControl
      label="Example reading range"
      value={range}
      onValueChange={setRange}
      options={[
        { value: "recent", label: "Recent" },
        { value: "earlier", label: "Earlier" },
        { value: "all", label: "All time" },
      ]}
    />
  )
}
