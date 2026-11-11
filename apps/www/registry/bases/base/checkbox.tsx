"use client"

/**
 * Checkbox is a single labelled box for choosing one option on its own: a box
 * that is ticked, not ticked, or in a mixed state that is neither. Its home is
 * a lone agreement or a single setting a reader turns on or off, and it carries
 * its own visible label and, when there is one, a line of supporting guidance
 * beneath that label.
 *
 * IT IS THE SINGLE CHECKBOX, NOT A SET. A box for choosing any number of
 * options from a list, where a parent box reflects and drives its children, is
 * a checkbox group and belongs in a component that owns that relationship
 * (Base UI publishes a CheckboxGroup primitive for exactly that). This file is
 * one box. The three-state parent shown in the examples is a parent a PRODUCT
 * wires up by passing `checked="indeterminate"` and handling the change; the
 * mixed state is offered here so that a group built from these boxes has a head
 * box to render, and nothing in this file assumes a group exists.
 *
 * WHY BASE UI'S Checkbox RATHER THAN A BARE <input type="checkbox">. A native
 * checkbox cannot be styled to the box treatment this system asks for without
 * hiding the real control and painting a stand-in, and a hidden control is the
 * usual way a checkbox loses its keyboard behaviour and its form value. Base
 * UI's Checkbox keeps a real hidden `<input>` for the form and renders a
 * `<span>` as the visible box with `role="checkbox"` and `aria-checked`, so the
 * keyboard contract (Tab to focus, Space to toggle) and the mixed state are the
 * primitive's rather than this file's to get right. The tick is a
 * Checkbox.Indicator that Base UI mounts only while the box is ticked or mixed,
 * so the glyph is present in the DOM exactly when it has something to say.
 *
 * THE MIXED STATE HAS ITS OWN GLYPH, ON PURPOSE. A ticked box shows a lucide
 * Check; a mixed box shows a lucide Minus. Two silhouettes rather than one
 * means the difference between "this is on" and "some of what this stands for
 * is on" survives greyscale and does not rest on the reader noticing that a
 * tick has become a dash of a different shape. Which glyph is drawn is decided
 * from the resolved state this file already holds, not read back out of the
 * DOM, so the indicator never has to guess.
 *
 * NEITHER COLOUR AXIS. A checkbox records a choice; it states no clinical level
 * and names no category, so it carries neither `data-status` nor `data-category`
 * and draws no status or category hue. The ticked and mixed box is filled with
 * the accent, `--brand`, and its paired ink, the selected-state role every
 * selection control shares (ADR 0029), never a status hue. The unticked box is a neutral hairline on the page
 * ground. The semantic carrier underneath the fill is `aria-checked`, which is
 * `mixed` for the indeterminate box, rather than any pixel at all.
 *
 * THE LABEL IS REQUIRED AND VISIBLE. A checkbox with no words beside it asks a
 * reader to guess what they are agreeing to, so `label` has no default and a
 * missing one raises a development warning rather than rendering a bare box.
 * The label wraps the box, so a tap anywhere across the label toggles it and the
 * pointer target is the whole row rather than the twenty-pixel box; the optional
 * `description` sits outside that label as a sibling and is tied to the box with
 * `aria-describedby`, so it is announced as guidance rather than folded into the
 * accessible name.
 */

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check, Minus } from "lucide-react"
import { useId, useState } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * The box itself, spelled once.
 *
 * The ticked and mixed states are carried three ways so none of them is
 * load-bearing alone: `aria-checked` for assistive technology, the accent fill
 * `--brand` lifting the box off the page ground for a sighted reader (ADR 0029),
 * inside its `--brand-edge` rim where a bright accent needs one, and the glyph
 * inside it for greyscale and for a reader stylesheet that strips fills. The
 * unticked box is a neutral hairline on the background, so the two states differ
 * in fill, in border and in glyph at once.
 *
 * The ink is written as the arbitrary property `[color:var(--brand-foreground)]`
 * rather than a `text-*` class, for the reason `button.tsx` sets out at length:
 * tailwind-merge files a `text-*` colour in the same conflict group as a type
 * step and would drop one of them. The disabled box drops to the measured
 * `--muted-foreground` chrome role rather than an opacity wash, so it stays
 * readable while reading as unavailable.
 *
 * The focus ring is carried here rather than left to the product stylesheet, so
 * a project installed without that stylesheet does not lose it. The box grows
 * with the reader's text size because it is sized in rem, and the pointer target
 * floor lives on the label row below, not on the box.
 */
const CONTROL =
  "grid shrink-0 place-items-center size-[1.25rem] mt-[0.125rem] rounded-opsin-sm " +
  "border border-border bg-background [color:var(--foreground)] " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "data-[checked]:border-brand-edge data-[checked]:bg-brand data-[checked]:[color:var(--brand-foreground)] " +
  "data-[indeterminate]:border-brand-edge data-[indeterminate]:bg-brand data-[indeterminate]:[color:var(--brand-foreground)] " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:[color:var(--muted-foreground)] " +
  "focus-visible:outline-ring focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)]"

/**
 * TOGGLE, the second of the five interaction motions (ADR 0031), as a checkbox
 * draws it: the tick writes itself.
 *
 * Base UI mounts the indicator only while the box is ticked or mixed, and
 * marks its first frame `data-starting-style`, so both glyphs start with their
 * stroke pushed out of sight along its own dash and then draw in on
 * `spring-snap`, the spring tokens/motion.json names for a control the reader
 * just flipped. The dash is 24 user units, longer than either path: the tick,
 * `M20 6 9 17l-5-5`, is about 22.6 long, and the dash, `M5 12h14`, is 14. The
 * tick starts from a negative offset, which reveals its path from the end, so
 * the stroke runs the way a hand writes a tick, from the short arm down to the
 * crook and up the long arm. The dash starts from a positive offset and draws
 * from left to right. The box's fill changes on its own colour transition
 * underneath. On untick the glyph fades on `ease-exit` over `duration-fast`
 * rather than unwriting itself, because a reader does not need to watch a
 * dismissal finish.
 *
 * A tick shows a choice and never a reading, so the spring's overshoot is
 * allowed. Under `prefers-reduced-motion: reduce` `spring-snap` collapses to
 * 0ms in the generated sheet and `duration-fast` to 1ms in the product sheet,
 * so the tick is whole the frame after the box is ticked.
 */
const INDICATOR =
  "group/tick grid place-items-center " +
  "transition-opacity duration-(--opsin-duration-spring-snap) ease-opsin-spring-snap " +
  "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 " +
  "data-[ending-style]:duration-(--opsin-duration-fast) data-[ending-style]:ease-opsin-exit"

/** The tick, drawn from its short arm. See `INDICATOR`. */
const TICK =
  "size-[0.875rem] shrink-0 [stroke-dasharray:24] " +
  "transition-[stroke-dashoffset] duration-(--opsin-duration-spring-snap) ease-opsin-spring-snap " +
  "group-data-[starting-style]/tick:[stroke-dashoffset:-24]"

/** The dash, drawn from the left. See `INDICATOR`. */
const DASH =
  "size-[0.875rem] shrink-0 [stroke-dasharray:24] " +
  "transition-[stroke-dashoffset] duration-(--opsin-duration-spring-snap) ease-opsin-spring-snap " +
  "group-data-[starting-style]/tick:[stroke-dashoffset:24]"

/**
 * The label row, spelled once. It wraps the box and the visible words, so a tap
 * anywhere along it toggles the box and the row is the 44pt pointer target,
 * floored at `--opsin-target-minimum` in rem so it grows with the reader's text
 * size rather than pinning at a device pixel. `items-start` keeps the box
 * aligned to the first line when the label wraps to two.
 */
const ROW =
  "flex items-start gap-opsin-3 min-h-(--opsin-target-minimum,2.75rem) " +
  "cursor-pointer select-none py-opsin-1"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a
 * consumer makes with the clinical API, and a checkbox asserts nothing clinical.
 * `divider.tsx` and `segmented-control.tsx` keep the same small set for the same
 * reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface CheckboxProps {
  /**
   * Required. The visible words beside the box, and the box's accessible name.
   * Base UI renders the visible box as a `<span role="checkbox">`, and a wrapping
   * `<label>` names only the hidden native input rather than that span, so the
   * span is pointed at the visible label with `aria-labelledby`. The name is the
   * label text a sighted reader sees, so a screen-reader user hears exactly the
   * choice on screen. There is no default, because a checkbox with no words asks
   * a reader to agree to something they cannot see, and a missing or empty label
   * raises a development warning.
   */
  label: string
  /**
   * Whether the box is ticked. `true` is ticked, `false` is not, and the string
   * `"indeterminate"` is the mixed state, neither ticked nor unticked, which a
   * parent box uses to say that some but not all of what it stands for is on.
   * Omitted, the box is uncontrolled and manages its own ticked state from an
   * unticked start; pass a boolean to control it and store the value yourself.
   */
  checked?: boolean | "indeterminate"
  /**
   * Called when the reader toggles the box, with the box's new ticked state as a
   * boolean. A box that was mixed reports `true` when the reader ticks it. The
   * caller stores the value and passes it back as `checked`; this component
   * keeps no state of its own once `checked` is supplied.
   */
  onCheckedChange?: (checked: boolean) => void
  /**
   * An alternative way to put the box in the mixed state, for a caller that
   * keeps `checked` as a plain boolean and tracks "mixed" separately. It is the
   * same state `checked="indeterminate"` sets, and either route reaches it; when
   * both are given, `indeterminate` wins. Defaults to `false`.
   */
  indeterminate?: boolean
  /**
   * Whether the box ignores interaction. A disabled box drops to the muted ink
   * rather than being faded with opacity, so it stays readable while reading as
   * unavailable, and it takes no focus and answers no key. Defaults to `false`.
   */
  disabled?: boolean
  /**
   * Optional supporting guidance shown beneath the label, such as what ticking
   * the box will do. It sits outside the label and is tied to the box with
   * `aria-describedby`, so a screen reader announces it as a description after
   * the name rather than as part of the name. Keep it to a short line.
   */
  description?: string
  /**
   * Merged onto the root. Placement, margin and the space around the checkbox
   * belong here. It is the one route by which colour can reach the component,
   * and the two-colour-axes rule applies to it in full: a checkbox takes neither
   * a status nor a category tint. A class you pass wins over the root's own where
   * the two conflict, because it is merged last.
   */
  className?: string
}

export function Checkbox({
  label,
  checked,
  onCheckedChange,
  indeterminate,
  disabled = false,
  description,
  className,
}: CheckboxProps) {
  const generatedId = useId()
  const labelId = `${generatedId}-label`
  const descriptionId = description ? `${generatedId}-description` : undefined

  if (isDevelopment()) {
    if (typeof label !== "string" || label.trim() === "") {
      warnDev(
        "no-label",
        "[opsinjs] <Checkbox> was rendered with no `label`. The box needs a visible " +
          "accessible name: without one a reader is asked to agree to something they " +
          "cannot see, and a screen-reader user hears a checkbox with no idea what it " +
          "chooses. Pass `label` with the words that name the choice.",
      )
    }
  }

  // The mixed state is reachable two ways, and `indeterminate` wins when both
  // are given. A mixed box is not ticked, so its resolved checked value is
  // false while the mixed flag carries the rest.
  const isIndeterminate = indeterminate ?? checked === "indeterminate"
  const resolvedChecked = checked === "indeterminate" ? false : checked

  return (
    <div data-slot="checkbox" className={cn("flex flex-col gap-opsin-1", className)}>
      <label className={cn(ROW, disabled ? "cursor-not-allowed" : null)}>
        <CheckboxPrimitive.Root
          data-slot="checkbox-control"
          checked={resolvedChecked}
          indeterminate={isIndeterminate}
          disabled={disabled}
          aria-labelledby={labelId}
          aria-describedby={descriptionId}
          onCheckedChange={(next) => onCheckedChange?.(next)}
          className={CONTROL}
        >
          <CheckboxPrimitive.Indicator
            data-slot="checkbox-indicator"
            className={INDICATOR}
          >
            {isIndeterminate ? (
              <Minus aria-hidden="true" className={DASH} strokeWidth={3} />
            ) : (
              <Check aria-hidden="true" className={TICK} strokeWidth={3} />
            )}
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        <span
          id={labelId}
          data-slot="checkbox-label"
          className={cn(
            "text-opsin-body",
            disabled ? "[color:var(--muted-foreground)]" : "[color:var(--foreground)]",
          )}
        >
          {label}
        </span>
      </label>
      {description ? (
        <span
          id={descriptionId}
          data-slot="checkbox-description"
          className="ps-[calc(1.25rem+var(--opsin-space-3,0.75rem))] text-opsin-footnote [color:var(--muted-foreground)]"
        >
          {description}
        </span>
      ) : null}
    </div>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It holds its own ticked state,
 * because a demo has to close that loop somewhere, and it shows a single box
 * with a label and a line of guidance beneath it, which is the one thing worth
 * seeing at a glance: the ticked box is filled with the neutral action role and
 * carries a Check glyph, so the state survives greyscale rather than resting on
 * a hue. Read it in greyscale to check that.
 *
 * The words name a fictional, non-clinical agreement (ADR 0012). No reading, no
 * unit and no measurement anybody could mistake for their own data.
 */
export default function CheckboxDemo() {
  const [checked, setChecked] = useState(true)
  return (
    <Checkbox
      label="Email me a copy of this summary"
      description="We send it to the address on your account and nowhere else."
      checked={checked}
      onCheckedChange={setChecked}
    />
  )
}
