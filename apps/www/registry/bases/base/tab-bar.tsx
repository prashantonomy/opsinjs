"use client"

/**
 * TabBar is the persistent bar of top-level destinations at the foot of a
 * phone screen, with exactly one destination current at a time. It moves the
 * reader between whole sections of an app, and its home is the small mobile
 * surface where a bottom bar is reachable by the thumb.
 *
 * IT IS PRESENTATIONAL, AND APPLICATION NAVIGATION IS THE PRODUCT'S DECISION.
 * It refuses to own routing. It reports which destination the reader chose
 * through `onValueChange` and reflects the product's answer through `value`.
 * An `href` on an item is honoured as a plain anchor so the platform router
 * works, and the component never calls `preventDefault`, because whether a
 * click navigates is the product's to decide, not this file's.
 *
 * IT IS BUILT ON A Surface AT THE overlay RUNG. `overlay` is the ladder rung
 * named for chrome that content scrolls beneath, which is exactly a tab bar,
 * so composing Surface rather than redrawing a material means the bar
 * inherits the tested translucency, scrim and hairline. It refuses to paint
 * its own background or border.
 *
 * NEITHER COLOUR AXIS. A destination is not a measurement, so the bar states
 * no clinical level and names no category. It carries neither `data-status`
 * nor `data-category` and draws only neutral chrome. The current destination
 * is marked three ways with no hue doing the work: a heavier label, a top
 * indicator bar in the foreground ink, and a lift from the muted ink to the
 * foreground ink. `aria-current="page"` is the semantic carrier underneath
 * all three.
 *
 * IT REFUSES FEWER THAN TWO AND MORE THAN FIVE DESTINATIONS. Two is the floor
 * because one destination is not navigation, and five is the ceiling because
 * a persistent bar has to read as one glanceable set. It warns on either in
 * development and refuses to invent an overflow, because a bar that needs a
 * "More" tab is an information architecture problem, and a safety relevant
 * action hidden behind an overflow is a defect this component will not help
 * create.
 *
 * EACH DESTINATION IS ITS OWN TAB STOP. Unlike SegmentedControl, which is a
 * radiogroup and one tab stop, a tab bar is navigation: every destination is
 * independently reachable, so Tab steps through them and each floors its
 * target at the 44pt minimum on both axes.
 *
 * THE SAFE AREA IS PADDED, NOT ASSUMED. The bottom padding adds
 * `env(safe-area-inset-bottom)` so the bar clears the home indicator, and it
 * names the one thing this file cannot do alone: the inset resolves to a real
 * value only once the product sets `viewport-fit=cover` on its viewport meta,
 * so the base padding stands on its own where the inset is zero.
 *
 * IT IS A CLIENT COMPONENT. The reason is the controlled value, the change
 * callback and the click handlers, not a preference query, so unlike Surface
 * it cannot be a server component.
 */

import type { ReactNode } from "react"
import { useState } from "react"

import { Activity, BookOpen, House, Settings } from "lucide-react"

import { isDevelopment } from "@/lib/opsinjs"
import { Surface } from "@/registry/base-lyra/ui/surface"

/**
 * One destination in the bar. A local type rather than a fourth public
 * export, for the reason `segmented-control.tsx` gives about its own option
 * shape: the registry contract fixes a file at three public exports, so a
 * consumer names this shape as `TabBarProps["items"][number]` rather than
 * importing a fourth symbol.
 */
interface TabBarItem {
  /** Stable identity for this destination. Unique within the bar, and what `value` matches. Also the React key. */
  key: string
  /** The visible words, and the destination's accessible name. One short noun, "Home" rather than "Go to the home screen". */
  label: string
  /** The destination's icon. Passed as a node so the product chooses the icon set; the bar wraps it aria-hidden because the label carries the name. */
  icon: ReactNode
  /** Optional link target. When set the destination renders as an anchor so the platform router works; when absent it renders as a button. */
  href?: string
}

/**
 * The nav row. A flex row that spreads the destinations, with the safe-area
 * inset added to a base bottom padding so the bar clears the home indicator
 * on a notched phone and still keeps a base gap where the inset is zero.
 */
const NAV =
  "flex items-stretch justify-around gap-opsin-1 px-opsin-2 pt-opsin-1 " +
  "[padding-bottom:calc(env(safe-area-inset-bottom,0px)+0.25rem)]"

/**
 * One destination. Icon over label, centred, floored at the 44pt target on
 * both axes in rem so it grows with the reader's text size. The ink is the
 * muted role at rest and lifts to the foreground role when the item is
 * current, written as the arbitrary colour property so tailwind-merge does
 * not drop it against a type step further down. The current state is carried
 * by `aria-current="page"`, which every treatment below keys off. The focus
 * ring is carried here rather than left to the product stylesheet.
 */
const ITEM =
  "group relative flex flex-1 basis-0 select-none flex-col items-center justify-center gap-opsin-0-5 " +
  "rounded-opsin-md px-opsin-1 py-opsin-1 text-center no-underline " +
  "min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem) cursor-pointer " +
  "[color:var(--muted-foreground)] aria-[current=page]:[color:var(--foreground)] " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "hover:bg-state-hover " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

/**
 * The current-destination indicator. A 2px bar pinned to the top of the
 * current item, in the foreground ink so it is neutral chrome and not a
 * category or status tint. It fades in only when the item is current, driven
 * by the `aria-current` state on the group, so the same markup serves every
 * item and no layout shifts. It is decorative and `aria-hidden`, and it
 * deliberately has no `data-slot`, because the closed set is `tab-bar`,
 * `tab-bar-item`, `tab-bar-item-icon` and `tab-bar-item-label`, and this bar
 * does not mint a fifth.
 */
const INDICATOR =
  "pointer-events-none absolute inset-x-opsin-3 top-0 h-opsin-0-5 rounded-full bg-foreground " +
  "opacity-0 transition-opacity duration-(--opsin-duration-fast) ease-opsin-standard " +
  "group-aria-[current=page]:opacity-100"

/** The icon wrapper. Fixed box so the row stays even whatever glyph is passed; the svg inside is sized here. */
const ICON = "flex size-opsin-6 items-center justify-center [&_svg]:size-opsin-6"

/** The label. Caption step, and heavier when the item is current so weight is one of the three carriers of the current state. Colour is inherited from the item, so no colour class here. */
const LABEL = "text-opsin-caption1 group-aria-[current=page]:font-medium"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe a mistake a
 * consumer makes with the clinical API, and a tab bar asserts nothing
 * clinical. `segmented-control.tsx` keeps the same small set for the same
 * reason, and the repair, a real code in `lib/opsinjs.ts`, is not this
 * file's to make.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface TabBarProps {
  /**
   * The destinations, in the order they appear. Two to five: one destination
   * is not navigation, and a persistent bar with more than five stops no
   * longer reads as one glanceable set. Each item is a key, a label, an icon
   * and an optional href. A count outside two to five raises a development
   * warning and still renders, so the mistake is visible rather than silent.
   */
  items: TabBarItem[]
  /**
   * The key of the current destination, matching one item's key. This is a
   * controlled component with no internal selection state, so a value that
   * matches no item renders the bar with no destination current, and a
   * development warning names it.
   */
  value: string
  /**
   * Called with the chosen destination's key when the reader picks a
   * different one. Optional, because a bar built from links can leave
   * navigation to the href alone. When present, the caller stores the key and
   * passes it back as value; the bar keeps no state of its own.
   */
  onValueChange?: (key: string) => void
  /**
   * Required. The accessible name for the nav landmark, applied as
   * aria-label, so a screen-reader user hears what the bar navigates before
   * its destinations. Name what the bar moves between, "Main sections" rather
   * than "navigation". There is no default, because a guessed name would
   * describe the wrong thing on most screens.
   */
  label: string
  /**
   * Merged onto the Surface root. Position belongs here: a product pins the
   * bar with something like "fixed inset-x-0 bottom-0" through this prop, and
   * the bar itself sets no position of its own. A class you pass wins over
   * the root's own where the two conflict.
   */
  className?: string
}

export function TabBar({ items, value, onValueChange, label, className }: TabBarProps) {
  if (isDevelopment()) {
    if (typeof label !== "string" || label.trim() === "") {
      warnDev(
        "no-label",
        "[opsinjs] <TabBar> was rendered with no `label`. The bar is a nav " +
          "landmark and needs an accessible name: without one a screen-reader " +
          "user hears an unnamed landmark among several. Pass `label` naming " +
          'what the bar moves between, such as "Main sections".',
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      warnDev(
        "no-items",
        "[opsinjs] <TabBar> was rendered with no `items`, so it has nothing to " +
          "draw. Supply two to five destinations through the `items` prop.",
      )
    } else {
      if (items.length === 1) {
        warnDev(
          "too-few-items",
          "[opsinjs] <TabBar> was given a single item, which is not navigation. " +
            "Add the other destinations, or drop the bar and render the one " +
            "screen directly.",
        )
      } else if (items.length > 5) {
        warnDev(
          "too-many-items",
          "[opsinjs] <TabBar> was given more than five items, so the bar no " +
            "longer reads as one glanceable set. Reduce the destinations rather " +
            "than reaching for an overflow, and never hide a safety relevant " +
            "action behind one.",
        )
      }

      const seen = new Set<string>()
      for (const item of items) {
        if (seen.has(item.key)) {
          warnDev(
            `duplicate-key:${item.key}`,
            `[opsinjs] <TabBar> has two items with the key "${item.key}", which ` +
              "breaks both the React list and the value match. Give each " +
              "destination a unique key.",
          )
        }
        seen.add(item.key)
      }

      if (!items.some((item) => item.key === value)) {
        warnDev(
          `value-not-in-items:${String(value)}`,
          `[opsinjs] <TabBar value="${String(value)}"> does not match any ` +
            "item's key, so the bar renders with nothing current. This is a " +
            "controlled component: pass a `value` equal to one item's `key`.",
        )
      }
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    return null
  }

  return (
    <Surface rung="overlay" className={className}>
      <nav data-slot="tab-bar" aria-label={label} className={NAV}>
        <ul role="list" className="m-0 flex w-full list-none items-stretch gap-opsin-1 p-0">
          {items.map((item) => {
            const current = item.key === value
            const inner = (
              <>
                <span aria-hidden="true" className={INDICATOR} />
                <span data-slot="tab-bar-item-icon" aria-hidden="true" className={ICON}>
                  {item.icon}
                </span>
                <span data-slot="tab-bar-item-label" className={LABEL}>
                  {item.label}
                </span>
              </>
            )
            return (
              <li key={item.key} className="flex flex-1 basis-0">
                {item.href === undefined ? (
                  <button
                    type="button"
                    data-slot="tab-bar-item"
                    aria-current={current ? "page" : undefined}
                    onClick={() => onValueChange?.(item.key)}
                    className={ITEM}
                  >
                    {inner}
                  </button>
                ) : (
                  <a
                    href={item.href}
                    data-slot="tab-bar-item"
                    aria-current={current ? "page" : undefined}
                    onClick={() => onValueChange?.(item.key)}
                    className={ITEM}
                  >
                    {inner}
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </Surface>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is
 * public, reviewed code. It shows a four-destination bar with one current,
 * which is the one thing worth seeing at a glance: the destinations read as
 * siblings and the current one is lifted by weight, a top indicator and an
 * ink change rather than by a colour. Read it in greyscale to check that. It
 * holds its own selection state because the bar is controlled and a demo has
 * to close that loop somewhere.
 *
 * The labels name fictional app sections (ADR 0012). No number, no unit and
 * no measurement anybody could mistake for their own reading, and no two
 * destinations share a name.
 */
export default function TabBarDemo() {
  const [section, setSection] = useState("home")
  return (
    <div className="w-full max-w-sm">
      <TabBar
        label="Example app sections"
        value={section}
        onValueChange={setSection}
        items={[
          { key: "home", label: "Home", icon: <House /> },
          { key: "trends", label: "Trends", icon: <Activity /> },
          { key: "library", label: "Library", icon: <BookOpen /> },
          { key: "settings", label: "Settings", icon: <Settings /> },
        ]}
      />
    </div>
  )
}
