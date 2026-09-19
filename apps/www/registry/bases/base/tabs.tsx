"use client"

/**
 * Tabs switches between distinct panels of content that occupy the same space.
 * One panel is shown at a time, the reader picks which through a row of tabs,
 * and choosing a tab swaps the whole panel underneath. Its home is a screen
 * where two or three bodies of content compete for one region and only one is
 * worth showing at once, an "Overview" and a "History" of the same subject
 * being the case it was built for.
 *
 * IT IS NOT A SegmentedControl, AND THE DIFFERENCE IS WHAT THE CHOICE DOES.
 * A segmented control sets a parameter of one view that stays on the surface:
 * the chart stays the chart and the chosen option redraws it for a different
 * window. Tabs SWAP the content: choosing a tab replaces the panel with a
 * different panel that has its own material. The two look alike and are not
 * alike, so a control that only changes a setting of what stays on screen is a
 * SegmentedControl, and a control that replaces what is on screen is this one.
 * The keyboard contract differs to match, which is set out below.
 *
 * WHY BASE UI'S Tabs RATHER THAN A ROW OF Buttons. The WAI-ARIA tabs pattern is
 * a specific thing: a `role="tablist"` holding `role="tab"` buttons, each
 * `aria-controls` its `role="tabpanel"`, the list is one tab stop with a roving
 * focus moved by the Arrow keys, and the panel is the next tab stop after the
 * list. Base UI's Tabs renders exactly that on its Composite primitive, so the
 * roving focus, the Arrow keys, Home and End, and the panel association are the
 * tested primitive rather than a bespoke one nobody has driven with a screen
 * reader. Building it from a row of shipped Buttons would give one tab stop per
 * button, because Base UI's `useButton` stamps a tab index on every control, so
 * the list would read as three stops where the pattern promises one.
 *
 * NEITHER COLOUR AXIS. A tab names a panel; it states no clinical level and
 * names no category, so the row carries neither `data-status` nor
 * `data-category` and draws only neutral chrome. The active tab is marked three
 * ways with no hue doing the work: the ink lifts from the muted role to the
 * foreground role, the label gains weight, and an indicator bar rides under the
 * active tab in the chrome primary ink. The semantic carrier underneath all
 * three is `aria-selected`, which Base UI sets, so the selection survives
 * greyscale and survives a reader stylesheet that strips fills.
 *
 * IT IS A CLIENT COMPONENT, BECAUSE Base UI's Tabs OWNS ROVING FOCUS AND THE
 * ACTIVE PANEL. Those need the browser, so the directive is required rather
 * than chosen. The value is controlled: this file keeps no selection state of
 * its own, it reports the reader's choice through `onValueChange` and reflects
 * the caller's answer through `value`.
 */

import type { ReactNode } from "react"
import { useState } from "react"

import { Tabs as BaseTabs } from "@base-ui/react/tabs"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * One tab and its panel. Kept as a local type rather than a fourth public
 * export, for the reason `segmented-control.tsx` gives about its own option
 * shape: the registry contract fixes this file at three public exports, so a
 * consumer names this shape as `TabsProps["items"][number]` rather than
 * importing a fourth symbol.
 */
interface TabsItem {
  /** The value this tab selects. Unique within the row, and what `value` matches. Also the React key. */
  value: string
  /** The visible words on the tab, and its accessible name. One short noun, "Overview" rather than "Show me the overview". */
  label: string
  /** The panel shown while this tab is active. Any node: a paragraph, a list, a whole composed view. */
  panel: ReactNode
  /**
   * Whether this tab cannot be chosen. A disabled tab drops to the muted ink
   * and is skipped by the Arrow keys rather than removed, so the reader can
   * still see it is a panel that is not available to them right now.
   */
  disabled?: boolean
}

/**
 * The tab row, spelled once. A flex row that is `position: relative` so the
 * indicator can be positioned against it, with a hairline rail along its
 * bottom edge so the row reads as one object with the tabs set into it. The
 * rail is the neutral `border-border`, not either colour axis.
 */
const LIST =
  "relative flex flex-wrap items-stretch gap-opsin-1 border-b border-border"

/**
 * One tab, spelled once.
 *
 * The active state is carried three ways so none of them is load-bearing
 * alone: `aria-selected` for assistive technology, which Base UI sets; the ink
 * lifting from the muted role to the foreground role for a sighted reader; and
 * the label gaining weight. The indicator bar below is the fourth carrier, and
 * it too is neutral chrome rather than a hue. Every treatment keys off Base
 * UI's `data-active` attribute, so the same class string serves an active and
 * an inactive tab and nothing shifts as the reader moves between them.
 *
 * The ink is written as the arbitrary property `[color:var(--foreground)]` and
 * not `text-foreground`, for the reason `segmented-control.tsx` sets out:
 * tailwind-merge files a `text-*` colour in the same conflict group as the
 * `text-opsin-*` type step and would drop one of them. The arbitrary property
 * lands in the `color` group instead, so the ink and the size both survive.
 *
 * The focus ring is carried here rather than left to the product stylesheet,
 * so a project installed without that stylesheet does not lose it. The 44pt
 * target floor is `--opsin-target-minimum` in rem, so it grows with the
 * reader's text size rather than pinning at a device pixel, with a literal
 * fallback so the declaration stays valid where the generated token sheet was
 * not installed.
 */
const TAB =
  "relative inline-flex select-none items-center justify-center whitespace-nowrap " +
  "rounded-opsin-sm px-opsin-3 py-opsin-2 align-middle text-opsin-headline " +
  "min-h-(--opsin-target-minimum,2.75rem) cursor-pointer bg-transparent " +
  "[color:var(--muted-foreground)] " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "hover:bg-state-hover " +
  "data-[active]:[color:var(--foreground)] data-[active]:font-medium " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:[color:var(--muted-foreground)] data-[disabled]:hover:bg-transparent " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

/**
 * The active indicator, spelled once. A bar pinned to the bottom of the list
 * that rides under the active tab, sized and placed from the CSS variables
 * Base UI writes onto it (`--active-tab-width` and `--active-tab-left`), so it
 * follows the active tab without this file measuring anything. Its thickness is
 * the half-space token rather than a pixel literal, and its fill is the chrome
 * `--primary` ink, which is neutral and on neither colour axis. It is
 * decorative: `aria-selected` on the tab is the carrier a screen reader reads,
 * and this bar is the sighted echo of it, so it is not the only thing telling
 * the two states apart.
 *
 * The slide between tabs is a chrome transition on `transform` and `width`, not
 * a value animation, so it does not fall under the rule against animating a
 * reading on first paint. It moves only when the reader changes tab.
 */
const INDICATOR =
  "pointer-events-none absolute bottom-0 left-0 h-opsin-0-5 rounded-full bg-primary " +
  "w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] " +
  "transition-[transform,width] duration-(--opsin-duration-fast) ease-opsin-standard"

/**
 * One panel, spelled once. The body of content the active tab reveals. It is a
 * tab stop after the list, so it carries the same focus ring as the tabs, and
 * it sits at the body type step in the foreground ink. Padding on the block
 * axis sets it off from the tab row without a border repeating the rail above.
 */
const PANEL =
  "py-opsin-4 text-opsin-body [color:var(--foreground)] " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe a mistake a
 * consumer makes with the clinical API, and a tab row asserts nothing
 * clinical. `segmented-control.tsx` and `tab-bar.tsx` keep the same small set
 * for the same reason, and the repair, a real code in `lib/opsinjs.ts`, is not
 * this file's to make.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface TabsProps {
  /**
   * The tabs, in the order they appear. Two or more: a single tab is not a
   * choice, and a set with none has nothing to draw. Each item is a value, a
   * visible label, the panel it reveals, and an optional `disabled` flag. A
   * count below two raises a development warning and still renders, so the
   * mistake is visible rather than silent.
   */
  items: TabsItem[]
  /**
   * The value of the active tab, matching one item's `value`. This is a
   * controlled component with no internal selection state, so a `value` that
   * matches no item renders the row with no tab active, and a development
   * warning names it.
   */
  value: string
  /**
   * Called with the new value when the reader chooses a different tab. The
   * caller stores it and passes it back as `value`; the component keeps no
   * state of its own.
   */
  onValueChange: (value: string) => void
  /**
   * Optional accessible name for the tab list, applied as `aria-label`. A tab
   * list where every tab has a visible label reads without one, so this is not
   * required, but naming what the tabs switch between, "Reading detail" rather
   * than "tabs", helps a screen-reader user who lands on the list before its
   * tabs. There is no default, because a guessed name would describe the wrong
   * thing on most screens.
   */
  label?: string
  /**
   * Merged onto the root. Width, margin and place in a layout belong here. A
   * class you pass wins over the root's own where the two conflict, because it
   * is merged last.
   */
  className?: string
}

export function Tabs({ items, value, onValueChange, label, className }: TabsProps) {
  if (isDevelopment()) {
    if (!Array.isArray(items) || items.length === 0) {
      warnDev(
        "no-items",
        "[opsinjs] <Tabs> was rendered with no items, so it has nothing to " +
          "draw. Tabs switch between two or more panels of content; supply them " +
          "through the `items` prop.",
      )
    } else {
      if (items.length === 1) {
        warnDev(
          "one-item",
          "[opsinjs] <Tabs> was given a single item, which is not a choice. Add " +
            "the other panels, or render the one panel directly without a tab row " +
            "the reader cannot use.",
        )
      }

      const seen = new Set<string>()
      for (const item of items) {
        if (seen.has(item.value)) {
          warnDev(
            `duplicate-value:${item.value}`,
            `[opsinjs] <Tabs> has two items with the value "${item.value}", which ` +
              "breaks both the React list and the value match. Give each tab a " +
              "unique value.",
          )
        }
        seen.add(item.value)
      }

      if (!items.some((item) => item.value === value)) {
        warnDev(
          `value-not-in-items:${String(value)}`,
          `[opsinjs] <Tabs value="${String(value)}"> does not match any item's ` +
            "value, so the row renders with no tab active. This is a controlled " +
            "component: pass a `value` equal to one item's `value`.",
        )
      }
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    return null
  }

  return (
    <BaseTabs.Root
      data-slot="tabs"
      value={value}
      onValueChange={(next) => onValueChange(String(next))}
      className={cn("flex flex-col gap-opsin-1", className)}
    >
      <BaseTabs.List data-slot="tabs-list" aria-label={label} className={LIST}>
        {items.map((item) => (
          <BaseTabs.Tab
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            data-slot="tabs-tab"
            className={TAB}
          >
            {item.label}
          </BaseTabs.Tab>
        ))}
        <BaseTabs.Indicator data-slot="tabs-indicator" className={INDICATOR} />
      </BaseTabs.List>
      {items.map((item) => (
        <BaseTabs.Panel
          key={item.value}
          value={item.value}
          data-slot="tabs-panel"
          className={PANEL}
        >
          {item.panel}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is
 * public, reviewed code rather than a scratch demo. It holds its own selection
 * state, because the component is controlled and a demo has to close that loop
 * somewhere, and it shows a three-tab row where choosing a tab swaps the panel
 * underneath, which is the one thing worth seeing at a glance: that tabs
 * replace content rather than set a parameter of it, and that the active tab is
 * marked without a colour doing the work. Read it in greyscale to check that.
 *
 * The labels and panels are fictional prose (ADR 0012). No number, no unit and
 * no reference range anybody could mistake for their own reading.
 */
export default function TabsDemo() {
  const [panel, setPanel] = useState("overview")
  return (
    <Tabs
      label="Example detail"
      value={panel}
      onValueChange={setPanel}
      items={[
        {
          value: "overview",
          label: "Overview",
          panel:
            "A short summary panel would sit here. Choosing another tab swaps this whole panel for a different one, rather than redrawing this one.",
        },
        {
          value: "history",
          label: "History",
          panel:
            "A history panel would list earlier entries here. It is its own body of content, revealed only while this tab is active.",
        },
        {
          value: "notes",
          label: "Notes",
          panel:
            "A notes panel would hold free text here. Nothing on any of these tabs is a reading, a threshold or a unit.",
        },
      ]}
    />
  )
}
