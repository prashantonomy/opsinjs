"use client"

/**
 * SymptomPicker is a multi-select over a list of options the product supplies:
 * a reader ticks the ones that apply to them, and the component records that
 * selection. It is the plainest possible reading of the words "symptom picker",
 * and the plainness is deliberate, because the richer reading is a regulated
 * device this design system has no business shipping.
 *
 * WHY THE ROSTER DECLINED IT, AND WHY THIS BUILD IS SAFE. A symptom picker sits
 * one step from a symptom checker, and a symptom checker is a regulated device
 * in most of the markets this system targets. So the line this component holds
 * is the line between recording and interpreting. It checks nothing, it triages
 * nothing, it scores nothing, and it reaches no finding about the reader. It
 * takes a list of options through `options`, it hands back the values a reader
 * ticked through `onValueChange`, and there it stops. Whatever those options
 * mean, and whatever a product does with the selection, is the product's, along
 * with the regulatory pathway that meaning lives on.
 *
 * IT SHIPS NO VOCABULARY. opsinjs owns no symptom list, so this file contains
 * none: no option is written into the component, into its default export, or
 * into its examples beyond a handful of clearly fictional placeholders. The
 * controlled vocabulary is product specific, the product owns it, and shipping a
 * list of symptoms inside a component library would be shipping a clinical
 * decision to every product that installed it.
 *
 * WHY BASE UI's CheckboxGroup RATHER THAN A RADIO GROUP. The choice here is
 * "which of these apply", and more than one can apply at once, so each option is
 * an independent checkbox rather than one exclusive selection. CheckboxGroup
 * holds the shared array of ticked values and each option is a Checkbox that
 * reports into it, which is the WAI-ARIA pattern for a set of related
 * checkboxes rather than a bespoke one nobody has tested. This is the opposite
 * of SegmentedControl, whose single-select choice is a radio group.
 *
 * NEITHER COLOUR AXIS. A ticked option is a selection, not a clinical level, so
 * the component carries neither `data-status` nor `data-category` and draws only
 * neutral chrome. The ticked state is carried by the check shape inside the box
 * and by Base UI's `data-checked`, never by a hue, so it survives greyscale and
 * a reader stylesheet that strips fills. Colour that arrives through `className`
 * is the caller's to keep off both axes, and the two-colour-axes rule applies to
 * it in full.
 *
 * THE OPTIONAL SEARCH FIELD. When the product's list is long enough that
 * scanning it is work, `searchable` shows a filter input above the options that
 * narrows the visible rows by a case-insensitive match on their label. The
 * filter is a convenience over what is shown and it is kept entirely separate
 * from the selection: filtering the list hides no ticked value and changes no
 * value the caller holds, and clearing the filter brings every option back with
 * its tick intact.
 *
 * IT IS A CLIENT COMPONENT, because Base UI's interactive primitives require it
 * and the filter keeps a small piece of its own state. The selection itself is
 * controlled and lives with the caller; the component keeps no selection state
 * of its own.
 */

import { Checkbox } from "@base-ui/react/checkbox"
import { CheckboxGroup } from "@base-ui/react/checkbox-group"
import { Check, Search } from "lucide-react"
import { useState } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * One option in the list. Kept as a local type rather than a fourth public
 * export, for the reason `segmented-control.tsx` gives about its own option
 * shape: the registry contract fixes this file at three public exports, so a
 * consumer names this shape as `SymptomPickerProps["options"][number]` rather
 * than importing a fourth symbol. The value is what `value` and `onValueChange`
 * carry; the label is the visible words and the option's accessible name.
 */
interface SymptomOption {
  /** The value this option contributes to the selection. Unique within the list. */
  value: string
  /** The visible words, and the accessible name a screen reader reads for the row. */
  label: string
  /**
   * Whether this option cannot be ticked. A disabled row drops to the muted ink
   * and does not answer a pointer or a key, rather than being removed, so the
   * reader can still see it is an option that is not available to them now.
   */
  disabled?: boolean
}

/**
 * The root, spelled once. A vertical stack of neutral chrome with no surface of
 * its own, so it sits on whatever ground the host provides. It carries no colour
 * from either axis.
 */
const ROOT = "flex w-full flex-col gap-opsin-1"

/**
 * The search field wrapper. The border, radius and focus ring live on the
 * wrapper so the icon and the input read as one control, and the input inside it
 * is borderless with its own outline suppressed. The target floor is the 44pt
 * minimum in rem, so the field grows with the reader's text size rather than
 * pinning at a device pixel, with a literal fallback so the declaration stays
 * valid where the generated token sheet was not installed.
 */
const SEARCH_WRAP =
  "mb-opsin-1 flex items-center gap-opsin-2 rounded-opsin-md border border-border bg-background " +
  "px-opsin-3 min-h-(--opsin-target-minimum,2.75rem) " +
  "focus-within:outline-[length:var(--opsin-border-focus,2px)] " +
  "focus-within:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-within:outline-ring"

/** The filter input itself: borderless, transparent, its outline carried by the wrapper. */
const SEARCH_INPUT =
  "w-full border-0 bg-transparent py-opsin-2 text-opsin-body [color:var(--foreground)] " +
  "outline-none placeholder:[color:var(--muted-foreground)]"

/**
 * One option row, spelled once, and the pressable element for the option. It
 * floors its hit area at the 44pt target minimum in rem so the whole row is the
 * target rather than the small box alone. The ticked and disabled states are
 * Base UI's `data-checked` and `data-disabled`, and a disabled row drops to the
 * measured muted ink rather than an opacity wash, so it stays readable while
 * reading as unavailable. The `group` marker lets the box below react to the
 * row's ticked state. The focus ring is carried here rather than left to the
 * product stylesheet, so a project installed without that stylesheet keeps it.
 */
const OPTION =
  "group flex w-full cursor-pointer select-none items-center gap-opsin-3 " +
  "rounded-opsin-md border border-transparent px-opsin-3 py-opsin-2 text-left align-middle " +
  "min-h-(--opsin-target-minimum,2.75rem) [color:var(--foreground)] " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "hover:bg-state-hover " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:[color:var(--muted-foreground)] data-[disabled]:hover:bg-transparent " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] " +
  "focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

/**
 * The tick box. A neutral square with a hairline that gains a muted fill when the
 * row is ticked, and the check shape inside it is the carrier the fill is
 * redundant to, so the ticked state survives greyscale. The box is decorative:
 * the row is the checkbox and carries the state for assistive technology, so the
 * box carries `aria-hidden` and the label carries the name.
 */
const BOX =
  "flex size-opsin-5 shrink-0 items-center justify-center rounded-opsin-xs " +
  "border border-border bg-background [color:var(--foreground)] " +
  "group-data-[checked]:bg-muted"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: a picker that records a selection asserts nothing clinical,
 * so the codes in `tokens/errors.json` do not apply, and minting one is not this
 * file's to do. `segmented-control.tsx` keeps the same small set for the same
 * reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface SymptomPickerProps {
  /**
   * Required. The accessible name for the group, the question the list answers,
   * applied as `aria-label` on the group so a screen-reader user hears what they
   * are choosing from before its options. Name the question in the reader's own
   * words, such as "Which of these apply to you right now?". There is no default,
   * because a guessed name would describe the wrong thing on most screens.
   */
  label: string
  /**
   * The options, in the order they appear, supplied by the product. Each is a
   * value, a visible label and an optional `disabled` flag. opsinjs ships none of
   * these: the list is the product's controlled vocabulary and the product owns
   * it. An empty list renders nothing and warns in development.
   */
  options: SymptomOption[]
  /**
   * The currently ticked values, one entry per chosen option. This is a
   * controlled component with no selection state of its own, so the caller stores
   * the array and passes it back. A value that matches no option is kept in the
   * array untouched and named by a development warning, rather than being dropped
   * silently.
   */
  value: string[]
  /**
   * Called with the new array of ticked values when the reader ticks or unticks a
   * row. The caller stores it and passes it back as `value`.
   */
  onValueChange: (value: string[]) => void
  /**
   * Shows a filter input above the list that narrows the visible rows by a
   * case-insensitive match on their label. It is a convenience over a long list
   * and is kept separate from the selection: filtering hides no ticked value and
   * changes nothing the caller holds. Defaults to `false`, where every option is
   * always visible.
   */
  searchable?: boolean
  /**
   * Merged onto the root. Width, margin and place in a layout belong here. A class
   * you pass wins over the root's own where the two conflict, because it is merged
   * last. It is the one route by which colour can reach the picker, and the
   * two-colour-axes rule applies to it in full: a symptom picker takes neither a
   * status nor a category tint.
   */
  className?: string
}

export function SymptomPicker({
  label,
  options,
  value,
  onValueChange,
  searchable = false,
  className,
}: SymptomPickerProps) {
  const [query, setQuery] = useState("")

  if (isDevelopment()) {
    if (!Array.isArray(options) || options.length === 0) {
      warnDev(
        "no-options",
        "[opsinjs] <SymptomPicker> was rendered with no options, so it has " +
          "nothing to draw. The list is the product's own vocabulary, which " +
          "opsinjs never ships; supply it through the `options` prop.",
      )
    }

    if (typeof label !== "string" || label.trim() === "") {
      warnDev(
        "no-label",
        "[opsinjs] <SymptomPicker> was rendered with no `label`. The list is a " +
          "group and needs an accessible name: without one a screen-reader user " +
          "meets a set of checkboxes with no idea what they are choosing from. " +
          'Pass `label` with the question in the reader\'s words, such as "Which ' +
          'of these apply to you right now?".',
      )
    }

    if (Array.isArray(options) && Array.isArray(value)) {
      const known = new Set(options.map((option) => option.value))
      const stray = value.filter((entry) => !known.has(entry))
      if (stray.length > 0) {
        warnDev(
          `value-not-in-options:${stray.join(",")}`,
          `[opsinjs] <SymptomPicker> received value ${JSON.stringify(stray)} that ` +
            "matches no option. This is a controlled component: every entry in " +
            "`value` should equal one option's `value`.",
        )
      }
    }
  }

  if (!Array.isArray(options) || options.length === 0) {
    return null
  }

  const trimmed = query.trim().toLowerCase()
  const visible =
    searchable && trimmed.length > 0
      ? options.filter((option) => option.label.toLowerCase().includes(trimmed))
      : options

  return (
    <CheckboxGroup
      data-slot="symptom-picker"
      aria-label={label}
      value={value}
      onValueChange={(next) => onValueChange(next)}
      className={cn(ROOT, className)}
    >
      {searchable ? (
        <div data-slot="symptom-picker-search" className={SEARCH_WRAP}>
          <Search aria-hidden="true" className="size-[1em] shrink-0 [color:var(--muted-foreground)]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Filter the list"
            placeholder="Filter"
            className={SEARCH_INPUT}
          />
        </div>
      ) : null}

      {visible.map((option) => (
        <Checkbox.Root
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          data-slot="symptom-picker-option"
          className={OPTION}
        >
          <span aria-hidden="true" className={BOX}>
            <Checkbox.Indicator className="flex">
              <Check aria-hidden="true" className="size-[1em]" />
            </Checkbox.Indicator>
          </span>
          <span data-slot="symptom-picker-option-label" className="text-opsin-body">
            {option.label}
          </span>
        </Checkbox.Root>
      ))}

      {searchable && visible.length === 0 ? (
        <p
          data-slot="symptom-picker-empty"
          className="m-0 px-opsin-3 py-opsin-2 text-opsin-footnote [color:var(--muted-foreground)]"
        >
          No options match your filter.
        </p>
      ) : null}
    </CheckboxGroup>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It holds its own selection state,
 * because the picker is controlled and a demo has to close that loop somewhere,
 * and it shows a short list with one row ticked so the one thing worth seeing at
 * a glance is clear: the ticked row is carried by the check shape and a quiet
 * fill rather than by a colour on either axis. Read it in greyscale to check.
 *
 * Every option is a fictional placeholder (ADR 0012). opsinjs ships no symptom
 * list, so the labels here name nothing a reader could mistake for a real
 * vocabulary, and the question is generic.
 */
export default function SymptomPickerDemo() {
  const [value, setValue] = useState<string[]>(["example-two"])
  return (
    <SymptomPicker
      label="Which of these apply to you right now?"
      value={value}
      onValueChange={setValue}
      options={[
        { value: "example-one", label: "Example symptom one" },
        { value: "example-two", label: "Example symptom two" },
        { value: "example-three", label: "Example symptom three" },
        { value: "example-four", label: "Example symptom four" },
      ]}
    />
  )
}
