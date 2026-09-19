"use client"

/**
 * Select is a trigger that opens a list to choose one option from. Its home is a
 * single choice out of a list too long to lay out flat, a timezone or a unit
 * system being the case it was built for, where the options are worth having but
 * not worth the vertical space of showing them all at once.
 *
 * WHY A SELECT RATHER THAN A ROW OF OPTIONS. The system already ships two
 * controls that show every option at once, SegmentedControl and a radio group,
 * and both are the better answer while the options are few. A select earns its
 * place only once the list grows past what a row can hold: it trades the glance
 * of a flat set for the compactness of a closed trigger, so the cost is a reader
 * has to open it to see the options, and the gain is a long list does not push
 * the rest of the form down the page. Under roughly seven options the flat form
 * is easier to scan and this control is the wrong reach.
 *
 * IT IS BUILT ON BASE UI's Select, AND THAT IS WHERE THE KEYBOARD COMES FROM.
 * The trigger is the one tab stop; Enter, Space or Arrow Down opens the list;
 * the Arrow keys move a highlight through the options with the popup holding
 * focus; Enter chooses the highlighted option and closes; Escape closes without
 * choosing. That is the WAI-ARIA listbox pattern rather than a bespoke one
 * nobody has tested, and the primitive renders `role="combobox"` on the trigger,
 * `role="listbox"` on the popup and `role="option"` with `aria-selected` on each
 * item, so a screen reader reads the control in the register a reader expects.
 *
 * THE LIST FLOATS IN A PORTAL, ON PURPOSE. The options are rendered through
 * `Select.Portal` into a `Select.Positioner`, so the popup escapes the overflow
 * clipping and stacking context of whatever card or scroll area the trigger sits
 * in. The positioner publishes the trigger's width as `--anchor-width` and the
 * room below as `--available-height`, so the popup matches the trigger and scrolls
 * inside the viewport rather than growing past it.
 *
 * NEITHER COLOUR AXIS. A select sets a value; it states no clinical level and
 * names no category, so it carries neither `data-status` nor `data-category` and
 * draws only neutral chrome. The chosen option is marked in the list by a tick
 * from `Select.ItemIndicator`, a lucide Check, rather than by a hue, so the
 * selection survives greyscale and reads without colour, and the semantic carrier
 * underneath it is `aria-selected` rather than any pixel at all. When the choice
 * is a clinical value with a range and a verdict, the control is a reading input,
 * not a bare select, because a select formats nothing and asserts nothing.
 *
 * THE TRIGGER FLOORS ITS TARGET AND CARRIES ITS OWN RING. The trigger floors its
 * hit area at `--opsin-target-minimum` in rem so a 44pt pressable region survives
 * and grows with the reader's text size, and it carries the focus ring in its own
 * class list so a project installed without the product stylesheet does not lose
 * it. The placeholder ink is the measured `--muted-foreground` chrome role read
 * from the value part's `data-placeholder` state rather than an opacity wash, so
 * an empty trigger stays legible while reading as unfilled.
 */

import { Select as SelectPrimitive } from "@base-ui/react/select"
import { Check, ChevronsUpDown } from "lucide-react"
import { useState } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * One option in the list. Kept as a local type rather than a fourth public
 * export, for the reason `segmented-control.tsx` gives about its own option
 * shape: the registry contract fixes a file at three public exports, so a
 * consumer names this shape as `SelectProps["options"][number]` rather than
 * importing a fourth symbol.
 */
interface SelectOption {
  /** The value this option sets. Unique within the list, and what `value` matches. */
  value: string
  /** The visible words, and what a screen reader reads for the option and in the trigger. */
  label: string
  /**
   * Whether this option cannot be chosen. A disabled option drops to the muted
   * ink and is skipped by the Arrow keys rather than removed, so a reader can
   * still see it is an option that is not available to them right now.
   */
  disabled?: boolean
}

/**
 * The trigger, spelled once. A button that looks like a field: a hairline box on
 * the background surface with the value on the left and the open indicator on the
 * right. The ink is written as the arbitrary property `[color:var(--foreground)]`
 * and not `text-foreground`, for the reason `segmented-control.tsx` sets out at
 * length: tailwind-merge files a `text-*` colour in the same conflict group as the
 * `text-opsin-*` type step and drops one of them, so the arbitrary property lands
 * in the `color` group instead and both the ink and the size survive. The disabled
 * ink is the measured `--muted-foreground` chrome role rather than an opacity wash,
 * because an opacity on the trigger would composite the label and the box together
 * and drift both towards the ground. The target floor is `--opsin-target-minimum`
 * in rem with a literal fallback, so the declaration stays valid where the token
 * sheet was not installed and grows with the reader's text size.
 */
const TRIGGER =
  "inline-flex w-full items-center justify-between gap-opsin-2 " +
  "rounded-opsin-md border border-border bg-background " +
  "px-opsin-3 py-opsin-2 min-h-(--opsin-target-minimum,2.75rem) " +
  "text-opsin-body [color:var(--foreground)] text-left align-middle cursor-pointer " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "hover:bg-state-hover " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:[color:var(--muted-foreground)] data-[disabled]:hover:bg-background " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

/**
 * The selected value text, or the placeholder when nothing is chosen. The
 * placeholder ink is the muted chrome role, switched on by the value part's own
 * `data-placeholder` state, so an unfilled trigger reads as unfilled without a
 * colour on either axis. It truncates rather than wrapping, so a long label keeps
 * the trigger one line high.
 */
const VALUE =
  "truncate [color:var(--foreground)] data-[placeholder]:[color:var(--muted-foreground)]"

/**
 * The open indicator, a lucide ChevronsUpDown at the trigger's trailing edge. It
 * is the muted chrome role and `aria-hidden`, because it is decoration on a
 * control whose role and state assistive technology already reads.
 */
const ICON = "flex shrink-0 items-center [color:var(--muted-foreground)]"

/**
 * The popup surface, spelled once. A raised card with a hairline: `bg-card`
 * lifts it off whatever it floats over, `border-border` draws its edge for
 * greyscale, and the `overlay` material rung casts the one black-alpha shadow the
 * material ladder publishes for a floating surface, so the list reads as a raised
 * object rather than a flat block. It matches the trigger's width through the
 * positioner's `--anchor-width` and caps its height at `--available-height` with
 * an internal scroll, so a long list stays inside the viewport rather than
 * growing past it. Consuming the material token rather than a raw shadow literal
 * keeps this file inside the colour contract.
 */
const POPUP =
  "z-50 max-h-[var(--available-height)] min-w-[var(--anchor-width)] overflow-y-auto " +
  "rounded-opsin-lg border border-border bg-card p-opsin-1 " +
  "shadow-(--opsin-material-overlay-shadow) [color:var(--foreground)]"

/**
 * One option row, spelled once. A full-width row with the label on the left and
 * room for the tick on the right. The highlight is the neutral `state-hover`
 * surface switched on by `data-highlighted`, which is the active option under the
 * Arrow keys and under the pointer, so the roving highlight is visible without a
 * colour on either axis. A disabled option drops to the muted ink and is skipped
 * by the keys. Each row floors its target at `--opsin-target-minimum` so a touch
 * reader gets a 44pt row.
 */
const ITEM =
  "relative flex w-full cursor-pointer select-none items-center gap-opsin-2 " +
  "rounded-opsin-sm px-opsin-3 py-opsin-2 min-h-(--opsin-target-minimum,2.75rem) " +
  "text-opsin-body [color:var(--foreground)] outline-none " +
  "data-[highlighted]:bg-state-hover " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:[color:var(--muted-foreground)] data-[disabled]:bg-transparent"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a consumer
 * makes with the clinical API, and a select asserts nothing clinical.
 * `segmented-control.tsx` keeps the same small set for the same reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface SelectProps {
  /**
   * The options, in the order they appear in the list. Each option is a value, a
   * visible label and an optional `disabled` flag. A select with no options has
   * nothing to open, and a select with a single option is not a choice, so both
   * raise a development warning.
   */
  options: SelectOption[]
  /**
   * The currently chosen value, matching one option's `value`. This is a
   * controlled component with no internal selection state, so the caller stores
   * the value and passes it back. Left empty or set to a value that matches no
   * option, the trigger shows the placeholder, and a non-empty value that matches
   * nothing raises a development warning.
   */
  value?: string
  /**
   * Called with the new value when the reader chooses a different option. The
   * caller stores it and passes it back as `value`; the control keeps no state of
   * its own.
   */
  onValueChange: (value: string) => void
  /**
   * Required. The accessible name for the trigger, applied as its `aria-label`, so
   * a screen-reader user hears what the control chooses before its value. Name the
   * thing the select sets, "Timezone" rather than the current value. There is no
   * default, because a guessed name would describe the wrong thing on most screens.
   */
  label: string
  /**
   * The text shown in the trigger when nothing is chosen. It is a prompt, not an
   * option, so it never appears in the list and cannot be chosen. Keep it a short
   * instruction such as "Choose a timezone". Omitted, the trigger is blank until a
   * value is set.
   */
  placeholder?: string
  /**
   * Whether the whole control is unavailable. A disabled select drops to the muted
   * ink, does not open, and is skipped by the Tab key. Defaults to `false`.
   */
  disabled?: boolean
  /**
   * Merged onto the trigger. Width, margin and place in a layout belong here. A
   * class you pass wins over the trigger's own where the two conflict, because it
   * is merged last. It is the one route by which colour can reach the control, and
   * the two-colour-axes rule applies to it in full: a select takes neither a status
   * nor a category tint.
   */
  className?: string
}

export function Select({
  options,
  value,
  onValueChange,
  label,
  placeholder,
  disabled = false,
  className,
}: SelectProps) {
  if (isDevelopment()) {
    if (!Array.isArray(options) || options.length === 0) {
      warnDev(
        "no-options",
        "[opsinjs] <Select> was rendered with no options, so it has nothing to " +
          "open. A select is a choice between options; supply them through the " +
          "`options` prop.",
      )
    } else if (options.length === 1) {
      warnDev(
        "one-option",
        "[opsinjs] <Select> was given a single option, which is not a choice. " +
          "Either add the other options, or render the one thing as a label rather " +
          "than a control the reader cannot change.",
      )
    }

    if (typeof label !== "string" || label.trim() === "") {
      warnDev(
        "no-label",
        "[opsinjs] <Select> was rendered with no `label`. The trigger is a combobox " +
          "and needs an accessible name: without one a screen-reader user hears a " +
          "control with no idea what it chooses. Pass `label` with the name of the " +
          'thing the select sets, such as "Timezone".',
      )
    }

    if (
      Array.isArray(options) &&
      options.length > 0 &&
      typeof value === "string" &&
      value !== "" &&
      !options.some((option) => option.value === value)
    ) {
      warnDev(
        `value-not-in-options:${value}`,
        `[opsinjs] <Select value="${value}"> does not match any option's value, so ` +
          "the trigger shows the placeholder. This is a controlled component: pass a " +
          "`value` equal to one option's `value`.",
      )
    }
  }

  if (!Array.isArray(options) || options.length === 0) {
    return null
  }

  return (
    <SelectPrimitive.Root
      value={value ? value : null}
      onValueChange={(next) => onValueChange(String(next))}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        data-slot="select"
        aria-label={label}
        className={cn(TRIGGER, className)}
      >
        <SelectPrimitive.Value
          data-slot="select-value"
          className={VALUE}
          placeholder={placeholder}
        />
        <SelectPrimitive.Icon data-slot="select-icon" className={ICON}>
          <ChevronsUpDown aria-hidden="true" className="size-[1em]" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner sideOffset={6} alignItemWithTrigger={false}>
          <SelectPrimitive.Popup data-slot="select-popup" className={POPUP}>
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                data-slot="select-item"
                className={ITEM}
              >
                <SelectPrimitive.ItemText data-slot="select-item-text">
                  {option.label}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator
                  data-slot="select-item-indicator"
                  className="ml-auto flex shrink-0 items-center [color:var(--foreground)]"
                >
                  <Check aria-hidden="true" className="size-[1em]" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It holds its own selection state,
 * because the control is controlled and a demo has to close that loop somewhere,
 * and it shows a trigger with one option chosen out of a list longer than a row
 * could hold, which is the one thing worth seeing at a glance: that the control is
 * neutral chrome and the chosen option is marked by a tick rather than a colour.
 * Open it and read the list in greyscale to check that.
 *
 * The labels name fictional non-clinical options, a set of timezones (ADR 0012).
 * No number, no unit and no measurement anybody could mistake for their own
 * reading.
 */
export default function SelectDemo() {
  const [zone, setZone] = useState("lisbon")
  return (
    <div className="w-full max-w-xs">
      <Select
        label="Example timezone"
        placeholder="Choose a timezone"
        value={zone}
        onValueChange={setZone}
        options={[
          { value: "lisbon", label: "Lisbon" },
          { value: "berlin", label: "Berlin" },
          { value: "nairobi", label: "Nairobi" },
          { value: "mumbai", label: "Mumbai" },
          { value: "tokyo", label: "Tokyo" },
          { value: "auckland", label: "Auckland" },
        ]}
      />
    </div>
  )
}
