"use client"

/**
 * RadioGroup is a vertical list of labelled options where exactly one is chosen.
 * It is the tall, readable form of a single choice: each option sits on its own
 * row with a circle, a label and an optional line of helper text, and the reader
 * runs their eye down the list rather than across it.
 *
 * IT IS ONE TAB STOP, AND THAT IS THE POINT IT SHARES WITH SegmentedControl.
 * A reader arrowing down a list of options expects Tab to pass the whole list
 * rather than to stop on every option in it, and a keyboard user who meets six
 * tab stops where the design promised one has been handed a control that reads
 * as six. So this is a radio group in the WAI-ARIA sense: the group takes the
 * single tab stop, and the Arrow keys move a roving focus between the options
 * inside it. Base UI's RadioGroup is built on its Composite primitive, which
 * keeps that one roving stop and moves it with the Arrow keys, renders
 * `role="radiogroup"` on the container, renders `role="radio"` with
 * `aria-checked` on each option, and makes selection follow focus. That is the
 * tested radio group pattern rather than a bespoke one nobody has listened to.
 *
 * WHY THIS AND NOT SegmentedControl, WHICH IS THE SAME PRIMITIVE. Both wrap Base
 * UI's RadioGroup, and both are one single choice. They differ in shape and in
 * what that shape is for. SegmentedControl is a compact single row that switches
 * one parameter of a view, a chart's day, week or month window being the case it
 * was built for, where every option is a word or two and all of them are worth
 * showing at once. RadioGroup is the vertical list for a settled choice of two
 * to about seven options, where an option may carry a description and the reader
 * is choosing rather than toggling. Reach for this when the options need room to
 * be read; reach for SegmentedControl when they are a tight set of siblings that
 * belong on one line. Past about seven options a list is a scroll rather than a
 * glance, and the honest control is a select inside a field.
 *
 * NEITHER COLOUR AXIS. A radio group asks the reader to pick one of a set of
 * choices; it states no clinical level and names no category, so it carries
 * neither `data-status` nor `data-category` and draws only neutral chrome. The
 * chosen option is marked three ways so none of them is load-bearing alone:
 * `aria-checked` for assistive technology, a filled dot inside the circle for a
 * sighted reader, and the circle's own border lifting to the primary ink for
 * greyscale and for a reader stylesheet that strips fills. The dot and the ring
 * are neutral primary ink, not a hue, so the selection survives greyscale and
 * reads without colour doing the work.
 *
 * THE LABEL IS A VISIBLE LEGEND, NOT ONLY AN ACCESSIBLE NAME. `label` is
 * required, and it is rendered as a heading above the list and wired to the
 * radiogroup with `aria-labelledby`, so a sighted reader and a screen-reader
 * user meet the same name for the choice. Name the thing being chosen, "Reminder
 * style" rather than "Standard, Quiet, None", because a guessed name would
 * describe the wrong thing on most screens, and a radiogroup with no accessible
 * name is a defect a screen-reader user meets as a set of radios with no idea
 * what they set.
 *
 * EACH OPTION IS A ROW THAT FLOORS ITS TARGET. Every option is a pressable Radio
 * whose hit area floors at `--opsin-target-minimum` in rem, so a 44pt target
 * survives and grows with the reader's text size rather than pinning at a device
 * pixel. The circle and the dot are sized in `em`, so they grow with the option
 * they belong to. A disabled option drops to the muted ink and is skipped by the
 * Arrow keys rather than removed, so the reader can still see it is an option
 * that is not available to them right now.
 */

import { Radio } from "@base-ui/react/radio"
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group"
import { useId, useState } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * One option in the list. Kept as a local type rather than a fourth public
 * export, for the reason `segmented-control.tsx` gives about its own option
 * shape: the registry contract fixes this file at three public exports, so a
 * consumer names this as `RadioGroupProps["options"][number]` rather than
 * importing a fourth symbol.
 */
interface RadioGroupOption {
  /** The value this option sets. Unique within the list, and what `value` matches. */
  value: string
  /** The visible words, and the primary part of what a screen reader reads for the option. */
  label: string
  /**
   * An optional helper line under the label, for a short clarification of what
   * the option means. It sits in the muted ink and is read as part of the
   * option, so keep it to a phrase rather than a paragraph.
   */
  description?: string
  /**
   * Whether this option cannot be chosen. A disabled option drops to the muted
   * ink and is skipped by the Arrow keys rather than removed, so the reader can
   * still see it is an option that is not available to them right now.
   */
  disabled?: boolean
}

/**
 * The list container, spelled once. A plain vertical stack, because the options
 * carry their own boundaries through the row hover and the selected ring rather
 * than through a track around the whole group.
 */
const GROUP = "flex w-full flex-col gap-opsin-0-5"

/**
 * The visible legend above the list. It is a heading in weight rather than in
 * element, wired to the radiogroup by `aria-labelledby`, so the name a
 * screen-reader user hears is the name a sighted reader sees.
 */
const LABEL =
  "px-opsin-3 pb-opsin-1 text-opsin-subheadline font-medium [color:var(--foreground)]"

/**
 * One option row, spelled once.
 *
 * It is the pressable Radio, so it carries the target floor, the focus ring and
 * the hover. `items-start` aligns the circle with the first line of the label so
 * a two-line option keeps the circle beside its label rather than centred on the
 * block. The row draws a transparent border in its rest state so the hover and
 * the layout do not shift, and the ink is written as the arbitrary property
 * `[color:var(--foreground)]` rather than `text-foreground` so tailwind-merge
 * files it in the `color` group and does not drop it against the `text-opsin-*`
 * step, which is the trap `button.tsx` records at length. A disabled row drops to
 * the measured muted ink rather than an opacity wash, so its label stays legible
 * while it reads as unavailable, and the Arrow keys skip it. The `group` class is
 * here so the circle and the dot can read this row's `data-checked` and
 * `data-disabled` state.
 */
const ITEM =
  "group flex w-full cursor-pointer select-none items-start gap-opsin-3 " +
  "rounded-opsin-md border border-transparent px-opsin-3 py-opsin-2 text-left align-top " +
  "min-h-(--opsin-target-minimum,2.75rem) text-opsin-body [color:var(--foreground)] " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "data-[unchecked]:hover:bg-state-hover " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:[color:var(--muted-foreground)] data-[disabled]:hover:bg-transparent " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

/**
 * The circle, spelled once. A neutral ring on the background so the dot has
 * something to sit against. When the row is checked the ring lifts to the primary
 * ink, which is a neutral dark rather than a hue, so the selected circle reads in
 * greyscale as well as in colour. Sized in `em` so it grows with the option's
 * text. It is `aria-hidden` because the selected state is carried by the row's
 * `aria-checked` and the label text, so the circle is decoration for the eye.
 */
const CONTROL =
  "relative mt-[0.15em] flex size-[1.15em] shrink-0 items-center justify-center " +
  "rounded-full border border-border bg-background " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "group-data-[checked]:border-primary"

/**
 * The dot, spelled once. Base UI's Radio.Indicator renders this span only when
 * the option is checked, so an unchecked circle is genuinely empty rather than
 * holding a hidden dot. It is the primary ink, the same neutral dark the ring
 * lifts to, sized in `em` so it grows with the option.
 */
const INDICATOR = "size-[0.5em] rounded-full bg-primary"

/** The label and description column, kept narrow so a long label wraps rather than pushes the circle. */
const ITEM_TEXT = "flex min-w-0 flex-col gap-opsin-0-5"

/** The option's words. */
const ITEM_LABEL = "text-opsin-body leading-snug"

/** The optional helper line, in the muted ink and a step quieter than the label. */
const ITEM_DESCRIPTION = "text-opsin-footnote leading-snug [color:var(--muted-foreground)]"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a
 * consumer makes with the clinical API, and a radio group asserts nothing
 * clinical. `segmented-control.tsx` and `divider.tsx` keep the same small set
 * for the same reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface RadioGroupProps {
  /**
   * The options, in the order they appear. Two or more: a group offering one
   * option is not a choice, and a group offering none has nothing to render.
   * Each option is a value, a visible label, an optional `description` line and
   * an optional `disabled` flag.
   */
  options: RadioGroupOption[]
  /**
   * The currently chosen value, matching one option's `value`. This is a
   * controlled component with no internal selection state, so a `value` that
   * matches no option renders the list with nothing chosen, and a development
   * warning names it.
   */
  value: string
  /**
   * Called with the new value when the reader chooses a different option. The
   * caller stores it and passes it back as `value`; the group keeps no state of
   * its own.
   */
  onValueChange: (value: string) => void
  /**
   * Required. The name of the choice, rendered as a visible legend above the
   * list and wired to the radiogroup with `aria-labelledby`, so a sighted reader
   * and a screen-reader user meet the same name. Name the thing being chosen,
   * "Reminder style" rather than "Standard, Quiet, None". There is no default,
   * because a guessed name would describe the wrong thing on most screens.
   */
  label: string
  /**
   * Merged onto the root group. Width, margin and place in a layout belong here.
   * A class you pass wins over the group's own where the two conflict, because it
   * is merged last. It is the one route by which colour can reach the group, and
   * the two-colour-axes rule applies to it in full: a radio group takes neither a
   * status nor a category tint.
   */
  className?: string
}

export function RadioGroup({
  options,
  value,
  onValueChange,
  label,
  className,
}: RadioGroupProps) {
  const labelId = useId()

  if (isDevelopment()) {
    if (!Array.isArray(options) || options.length === 0) {
      warnDev(
        "no-options",
        "[opsinjs] <RadioGroup> was rendered with no options, so it has nothing to " +
          "draw. A radio group is a choice between two or more options; supply them " +
          "through the `options` prop.",
      )
    } else if (options.length === 1) {
      warnDev(
        "one-option",
        "[opsinjs] <RadioGroup> was given a single option, which is not a choice. " +
          "Either add the other options, or render the one thing as a label rather " +
          "than a control the reader cannot change.",
      )
    }

    if (typeof label !== "string" || label.trim() === "") {
      warnDev(
        "no-label",
        "[opsinjs] <RadioGroup> was rendered with no `label`. The group is a " +
          "radiogroup and needs an accessible name: without one a screen-reader user " +
          "hears a set of radios with no idea what they choose between. Pass `label` " +
          'with the name of the choice, such as "Reminder style".',
      )
    }

    if (
      Array.isArray(options) &&
      options.length > 0 &&
      !options.some((option) => option.value === value)
    ) {
      warnDev(
        `value-not-in-options:${String(value)}`,
        `[opsinjs] <RadioGroup value="${String(value)}"> does not match any option's ` +
          "value, so the list renders with nothing chosen. This is a controlled " +
          "component: pass a `value` equal to one option's `value`.",
      )
    }
  }

  if (!Array.isArray(options) || options.length === 0) {
    return null
  }

  return (
    <BaseRadioGroup
      data-slot="radio-group"
      aria-labelledby={labelId}
      value={value}
      onValueChange={(next) => onValueChange(String(next))}
      className={cn(GROUP, className)}
    >
      <div id={labelId} data-slot="radio-group-label" className={LABEL}>
        {label}
      </div>
      {options.map((option) => (
        <Radio.Root
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          data-slot="radio-group-item"
          className={ITEM}
        >
          <span aria-hidden="true" data-slot="radio-group-control" className={CONTROL}>
            <Radio.Indicator data-slot="radio-group-indicator" className={INDICATOR} />
          </span>
          <span data-slot="radio-group-item-text" className={ITEM_TEXT}>
            <span data-slot="radio-group-item-label" className={ITEM_LABEL}>
              {option.label}
            </span>
            {option.description ? (
              <span
                data-slot="radio-group-item-description"
                className={ITEM_DESCRIPTION}
              >
                {option.description}
              </span>
            ) : null}
          </span>
        </Radio.Root>
      ))}
    </BaseRadioGroup>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It holds its own selection state,
 * because the group is controlled and a demo has to close that loop somewhere,
 * and it shows a three-option list with one option chosen, which is the one thing
 * worth seeing at a glance: that the options read as a stacked set and the chosen
 * one is marked by the ring and the dot without a colour doing the work. Read it
 * in greyscale to check that.
 *
 * The labels name a fictional reminder setting (ADR 0012). No number, no unit and
 * no measurement anybody could mistake for their own reading.
 */
export default function RadioGroupDemo() {
  const [style, setStyle] = useState("standard")
  return (
    <RadioGroup
      label="Example reminder style"
      value={style}
      onValueChange={setStyle}
      options={[
        { value: "standard", label: "Standard" },
        { value: "quiet", label: "Quiet" },
        { value: "off", label: "None" },
      ]}
    />
  )
}
