"use client"

/**
 * Combobox is a text input that filters a list as the reader types, then lets
 * them choose one item from what is left. Its home is a single choice out of a
 * list too long to scroll comfortably, a country, a city or a medication name
 * being the shape it was built for, where typing a few letters is faster than
 * paging through everything.
 *
 * opsinjs SHIPS NO VOCABULARY, AND THAT IS THE WHOLE POINT OF THIS COMPONENT.
 * The hard part of a searchable list in a health product is never the widget. It
 * is the list: which medicines, which conditions, which units, spelled which way,
 * and kept current against which source. Getting that list wrong is a clinical
 * mistake, so opsinjs refuses to own it. The component takes the items through
 * the `items` prop and filters and renders exactly what the product hands it. It
 * ships no default list, no built-in vocabulary, and no suggestion of its own,
 * because a presentation layer that guessed a drug name would be asserting
 * something it has no right to assert.
 *
 * IT IS BUILT ON BASE UI's Combobox, AND THAT IS WHERE THE KEYBOARD AND THE
 * FILTERING COME FROM. The input is the one tab stop; typing filters the list
 * with Base UI's default contains match; Arrow Down moves focus into the popup;
 * the Arrow keys move a highlight through the matches; Enter chooses the
 * highlighted item and closes; Escape closes without choosing. That is the
 * WAI-ARIA combobox pattern rather than a bespoke one nobody has tested, and the
 * primitive renders `role="combobox"` on the input, `role="listbox"` on the
 * popup and `role="option"` with `aria-selected` on each item, so a screen reader
 * reads the control in the register a reader expects.
 *
 * THE LIST FLOATS IN A PORTAL, ON PURPOSE. The matches are rendered through
 * `Combobox.Portal` into a `Combobox.Positioner`, so the popup escapes the
 * overflow clipping and stacking context of whatever card or scroll area the
 * input sits in. The positioner publishes the input's width as `--anchor-width`
 * and the room below as `--available-height`, so the popup matches the field and
 * scrolls inside the viewport rather than growing past it. When nothing matches,
 * `Combobox.Empty` announces the empty message politely instead of leaving a
 * reader typing into a list that silently went blank.
 *
 * NEITHER COLOUR AXIS. A combobox picks a value; it states no clinical level and
 * names no category, so it carries neither `data-status` nor `data-category` and
 * draws only neutral chrome. The chosen item is marked in the list by a tick from
 * `Combobox.ItemIndicator`, a lucide Check, rather than by a hue, so the
 * selection survives greyscale and reads without colour, and the semantic carrier
 * underneath it is `aria-selected` rather than any pixel at all.
 *
 * THE INPUT AND THE TRIGGER FLOOR THEIR TARGETS AND CARRY THEIR OWN RINGS. Both
 * floor their hit area at `--opsin-target-minimum` in rem so a 44pt pressable
 * region survives and grows with the reader's text size, and each carries the
 * focus ring in its own class list so a project installed without the product
 * stylesheet does not lose it. The placeholder ink is the measured
 * `--muted-foreground` chrome role rather than an opacity wash, so an empty field
 * stays legible while reading as unfilled.
 */

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Check, ChevronsUpDown } from "lucide-react"
import { useState } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * One item in the list. Kept as a local type rather than a fourth public export,
 * for the reason `select.tsx` gives about its own option shape: the registry
 * contract fixes a file at three public exports, so a consumer names this shape
 * as `ComboboxProps["items"][number]` rather than importing a fourth symbol. The
 * `{ value, label }` shape is the one Base UI reads directly, using the label for
 * the input text and the value for the selected value, so no converter is needed.
 */
interface ComboboxItem {
  /** The value this item sets. Unique within the list, and what `value` matches. */
  value: string
  /** The visible words, what is searched, and what fills the input once chosen. */
  label: string
}

/**
 * The field box, spelled once. A hairline box on the background surface that
 * holds the input and the trigger side by side, so the two read as one control
 * rather than a text box with a stray button after it. It draws only the neutral
 * chrome roles, so it can be mistaken for neither a status nor a category.
 */
const FIELD =
  "flex w-full items-stretch gap-opsin-1 rounded-opsin-md border border-border " +
  "bg-background [color:var(--foreground)]"

/**
 * The input, spelled once. It grows to fill the field, draws no border of its own
 * because the field box already has one, and floors its target at
 * `--opsin-target-minimum` in rem with a literal fallback so the declaration
 * stays valid where the token sheet was not installed. The ink is written as the
 * arbitrary property `[color:var(--foreground)]` and not `text-foreground`, for
 * the reason `select.tsx` sets out at length: tailwind-merge files a `text-*`
 * colour in the same conflict group as the `text-opsin-*` type step and drops one
 * of them, so the arbitrary property lands in the `color` group instead and both
 * the ink and the size survive. The placeholder ink is the measured muted chrome
 * role rather than an opacity wash. The focus ring is carried here rather than
 * left to the product stylesheet, so a project installed without it keeps the
 * ring.
 */
const INPUT =
  "min-w-0 flex-1 bg-transparent px-opsin-3 py-opsin-2 " +
  "min-h-(--opsin-target-minimum,2.75rem) rounded-opsin-md " +
  "text-opsin-body [color:var(--foreground)] " +
  "placeholder:[color:var(--muted-foreground)] " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

/**
 * The trigger, spelled once. A button at the trailing edge that opens the popup
 * without the reader having to type, carrying a lucide ChevronsUpDown in the
 * muted chrome role. It floors the same target as the input and carries its own
 * focus ring, so a reader who tabs to it rather than the input still meets a
 * visible focus and a 44pt region.
 */
const TRIGGER =
  "flex shrink-0 items-center justify-center px-opsin-2 " +
  "min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem) " +
  "rounded-opsin-md [color:var(--muted-foreground)] cursor-pointer " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "hover:bg-state-hover " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

/**
 * The popup surface, spelled once. A raised card with a hairline: `bg-card` lifts
 * it off whatever it floats over, `border-border` draws its edge for greyscale,
 * and the `overlay` material rung casts the one black-alpha shadow the material
 * ladder publishes for a floating surface, so the list reads as a raised object
 * rather than a flat block. It matches the input's width through the positioner's
 * `--anchor-width` and caps its height at `--available-height` with an internal
 * scroll, so a long list stays inside the viewport. Consuming the material token
 * rather than a raw shadow literal keeps this file inside the colour contract.
 */
const POPUP =
  "z-50 max-h-[var(--available-height)] w-[var(--anchor-width)] overflow-y-auto " +
  "rounded-opsin-lg border border-border bg-card p-opsin-1 " +
  "shadow-(--opsin-material-overlay-shadow) [color:var(--foreground)]"

/**
 * One match row, spelled once. A full-width row with the label on the left and
 * room for the tick on the right. The highlight is the neutral `state-hover`
 * surface switched on by `data-highlighted`, which is the active match under the
 * Arrow keys and under the pointer, so the roving highlight is visible without a
 * colour on either axis. Each row floors its target at `--opsin-target-minimum`
 * so a touch reader gets a 44pt row.
 */
const ITEM =
  "relative flex w-full cursor-pointer select-none items-center gap-opsin-2 " +
  "rounded-opsin-sm px-opsin-3 py-opsin-2 min-h-(--opsin-target-minimum,2.75rem) " +
  "text-opsin-body [color:var(--foreground)] outline-none " +
  "data-[highlighted]:bg-state-hover"

/**
 * The empty message, spelled once. Muted chrome ink at the footnote step, so a
 * reader who has filtered everything away meets a quiet line of guidance rather
 * than a blank popup. Base UI keeps this element mounted and announces its
 * children politely, so the message is read when the matches run out.
 */
const EMPTY = "px-opsin-3 py-opsin-2 text-opsin-footnote [color:var(--muted-foreground)]"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a
 * consumer makes with the clinical API, and a combobox asserts nothing clinical.
 * `select.tsx` keeps the same small set for the same reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface ComboboxProps {
  /**
   * The items to search, in the order they appear before any typing narrows
   * them. Each item is a `{ value, label }` pair: the label is what is searched,
   * shown in the list and written into the input once chosen, and the value is
   * what `value` matches and what `onValueChange` reports. opsinjs ships none of
   * these, because the list a health product searches is the product's to own and
   * keep current, not the presentation layer's to guess.
   */
  items: ComboboxItem[]
  /**
   * The currently chosen value, matching one item's `value`, or `null` when
   * nothing is chosen. This is a controlled component with no internal selection
   * state, so the caller stores the value and passes it back. A non-null value
   * that matches no item is treated as nothing chosen, and a development warning
   * names it.
   */
  value: string | null
  /**
   * Called with the new value when the reader chooses an item, or with `null`
   * when the selection is cleared. The caller stores it and passes it back as
   * `value`; the control keeps no state of its own.
   */
  onValueChange: (value: string | null) => void
  /**
   * Required. The accessible name for the input, applied as its `aria-label`, so
   * a screen-reader user hears what the field searches before they type. Name the
   * thing being chosen, "Medication" rather than the current text. There is no
   * default, because a guessed name would describe the wrong thing on most
   * screens.
   */
  label: string
  /**
   * The text shown in the empty input before the reader types. Keep it a short
   * instruction such as "Search medications". It is a prompt, not a value, so it
   * is never chosen and never reported. Omitted, the input is blank until typed
   * into.
   */
  placeholder?: string
  /**
   * The line shown inside the popup when the typed text matches no item. Keep it
   * short and useful, such as "No matches. Check the spelling." Omitted, a plain
   * fallback line is shown so a reader is never left staring at a blank popup.
   */
  emptyMessage?: string
  /**
   * Merged onto the field box. Width, margin and place in a layout belong here. A
   * class you pass wins over the box's own where the two conflict, because it is
   * merged last. It is the one route by which colour can reach the control, and
   * the two-colour-axes rule applies to it in full: a combobox takes neither a
   * status nor a category tint.
   */
  className?: string
}

export function Combobox({
  items,
  value,
  onValueChange,
  label,
  placeholder,
  emptyMessage,
  className,
}: ComboboxProps) {
  if (isDevelopment()) {
    if (!Array.isArray(items) || items.length === 0) {
      warnDev(
        "no-items",
        "[opsinjs] <Combobox> was rendered with no items, so it has nothing to " +
          "search. A combobox filters a list the product supplies; pass it " +
          "through the `items` prop. opsinjs ships no vocabulary of its own.",
      )
    }

    if (typeof label !== "string" || label.trim() === "") {
      warnDev(
        "no-label",
        "[opsinjs] <Combobox> was rendered with no `label`. The input is a " +
          "combobox and needs an accessible name: without one a screen-reader " +
          "user hears a text field with no idea what it searches. Pass `label` " +
          'with the name of the thing being chosen, such as "Medication".',
      )
    }

    if (
      Array.isArray(items) &&
      items.length > 0 &&
      typeof value === "string" &&
      value !== "" &&
      !items.some((item) => item.value === value)
    ) {
      warnDev(
        `value-not-in-items:${value}`,
        `[opsinjs] <Combobox value="${value}"> does not match any item's value, ` +
          "so the control renders with nothing chosen. This is a controlled " +
          "component: pass a `value` equal to one item's `value`, or `null`.",
      )
    }
  }

  const selected =
    typeof value === "string" ? (items.find((item) => item.value === value) ?? null) : null

  return (
    <ComboboxPrimitive.Root<ComboboxItem>
      items={items}
      value={selected}
      onValueChange={(next) => onValueChange(next ? next.value : null)}
    >
      <div data-slot="combobox" className={cn(FIELD, className)}>
        <ComboboxPrimitive.Input
          data-slot="combobox-input"
          aria-label={label}
          placeholder={placeholder}
          className={INPUT}
        />
        <ComboboxPrimitive.Trigger
          data-slot="combobox-trigger"
          aria-label={`Show ${label} options`}
          className={TRIGGER}
        >
          <ChevronsUpDown aria-hidden="true" className="size-[1em]" />
        </ComboboxPrimitive.Trigger>
      </div>
      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner sideOffset={6}>
          <ComboboxPrimitive.Popup data-slot="combobox-popup" className={POPUP}>
            <ComboboxPrimitive.Empty data-slot="combobox-empty" className={EMPTY}>
              {emptyMessage ? emptyMessage : "No matches."}
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List>
              {(item: ComboboxItem) => (
                <ComboboxPrimitive.Item
                  key={item.value}
                  value={item}
                  data-slot="combobox-item"
                  className={ITEM}
                >
                  <span data-slot="combobox-item-label" className="truncate">
                    {item.label}
                  </span>
                  <ComboboxPrimitive.ItemIndicator
                    data-slot="combobox-item-indicator"
                    className="ml-auto flex shrink-0 items-center [color:var(--foreground)]"
                  >
                    <Check aria-hidden="true" className="size-[1em]" />
                  </ComboboxPrimitive.ItemIndicator>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It holds its own selection state,
 * because the control is controlled and a demo has to close that loop somewhere,
 * and it shows a field over a list long enough that typing beats scrolling, which
 * is the one thing worth seeing at a glance: that the control is neutral chrome,
 * the list filters as you type, and the chosen item is marked by a tick rather
 * than a colour. Open it, type a letter, and read the matches in greyscale to
 * check that.
 *
 * The items name a fictional set of cities (ADR 0012), the kind of list a product
 * owns rather than a clinical vocabulary opsinjs would have to ship. No number,
 * no unit and no measurement anybody could mistake for their own reading.
 */
export default function ComboboxDemo() {
  const [city, setCity] = useState<string | null>("lisbon")
  return (
    <div className="w-full max-w-xs">
      <Combobox
        label="Example city"
        placeholder="Search cities"
        emptyMessage="No city matches that."
        value={city}
        onValueChange={setCity}
        items={[
          { value: "amsterdam", label: "Amsterdam" },
          { value: "berlin", label: "Berlin" },
          { value: "cairo", label: "Cairo" },
          { value: "dakar", label: "Dakar" },
          { value: "lisbon", label: "Lisbon" },
          { value: "mumbai", label: "Mumbai" },
          { value: "nairobi", label: "Nairobi" },
          { value: "osaka", label: "Osaka" },
          { value: "quito", label: "Quito" },
          { value: "reykjavik", label: "Reykjavik" },
          { value: "santiago", label: "Santiago" },
          { value: "tokyo", label: "Tokyo" },
        ]}
      />
    </div>
  )
}
