"use client"

/**
 * Menu is a list of actions opened from a button. Its home is the small set of
 * commands that act on one thing, an item's Share, Rename and Duplicate being
 * the case it was built for, folded behind a trigger so they do not take the
 * space of showing every command at once.
 *
 * IT IS BUILT ON BASE UI's Menu, AND THAT IS WHERE THE KEYBOARD COMES FROM. The
 * trigger is the one tab stop; Enter, Space or Arrow Down opens the list; the
 * Arrow keys move a highlight through the items with the popup holding focus;
 * Enter or Space runs the highlighted item and closes; Escape closes without
 * running anything and returns focus to the trigger. That is the WAI-ARIA menu
 * button pattern rather than a bespoke one nobody has tested, and the primitive
 * renders `aria-haspopup` on the trigger, `role="menu"` on the popup and
 * `role="menuitem"` on each item, so a screen reader reads the control in the
 * register a reader expects.
 *
 * THE TRIGGER IS THE CALLER's OWN BUTTON, AND THE `render` PROP IS WHY. A menu
 * button is a button, and the system already ships one, so this component does
 * not draw a second. The caller passes their button as `trigger`, and Base UI
 * merges the open behaviour, the `aria-haspopup` and the `aria-expanded` state
 * onto it through `render`, so there is one button rather than a button nested
 * inside another button, which is invalid and which a plain wrapper would
 * produce. That also means the trigger's target floor and focus ring are the
 * caller's button's own rather than this file's to add, which is why nothing
 * here floors the trigger.
 *
 * THE LIST FLOATS IN A PORTAL, ON PURPOSE. The items are rendered through
 * `Menu.Portal` into a `Menu.Positioner`, so the popup escapes the overflow
 * clipping and stacking context of whatever card, toolbar or scroll area the
 * trigger sits in. The positioner caps the popup's height at `--available-height`
 * with an internal scroll, so a long list stays inside the viewport rather than
 * growing past it, and the popup floats on the `overlay` material rung so it
 * reads as a raised object rather than a flat block.
 *
 * NEITHER COLOUR AXIS, AND NO DESTRUCTIVE TINT. A menu runs actions; it states
 * no clinical level and names no category, so it carries neither `data-status`
 * nor `data-category` and draws only neutral chrome. There is deliberately no
 * red for a removing or a clearing action either: the only red in this system is
 * the clinical status axis, so a destructive item stays neutral and its WORD is
 * what tells the reader what it does. A menu is also the wrong place to confirm
 * anything irreversible, because a menu item runs on a single press with no
 * second step. An action that cannot be undone runs a confirming Dialog rather
 * than firing straight from the list.
 *
 * A SAFETY-RELEVANT ACTION DOES NOT BELONG IN HERE AT ALL. Hiding a destructive
 * or a safety-relevant command behind an overflow trigger is a defect whatever
 * draws the overflow, because the reader cannot weigh a command they cannot see.
 * Such a command belongs on the screen as a button, with a Dialog to confirm it.
 * The component cannot read the meaning of an action's label, so it cannot
 * enforce this; the page states it and the demo keeps to it.
 *
 * THE ITEMS FLOOR THEIR TARGET AND CARRY THEIR OWN HIGHLIGHT. Each item floors
 * its hit area at `--opsin-target-minimum` in rem so a 44pt pressable row
 * survives and grows with the reader's text size, and the active row under the
 * Arrow keys and the pointer is lifted by the neutral `state-hover` surface read
 * from `data-highlighted` rather than by a hue, so the roving highlight survives
 * greyscale. A disabled item drops to the measured muted ink rather than an
 * opacity wash and is skipped by the keys, so it stays legible while reading as
 * unavailable.
 */

import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { Fragment, useState, type ReactElement } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * One action in the list. Kept as a local type rather than a fourth public
 * export, for the reason `select.tsx` gives about its own option shape: the
 * registry contract fixes this file at three public exports, so a consumer names
 * this shape as `MenuProps["items"][number]` rather than importing a fourth
 * symbol.
 */
interface MenuAction {
  /**
   * The visible words, and what a screen reader reads for the item. Name the
   * action as an imperative the reader is choosing, "Rename" rather than
   * "Renaming", and let a destructive one say what it removes, because the word
   * is the only thing that marks it apart in a system with no destructive tint.
   */
  label: string
  /**
   * Called when the reader runs the item. The menu closes on the same press, so
   * an action that cannot be undone opens a confirming Dialog from here rather
   * than doing the irreversible thing straight away. Omitted, the item renders
   * but does nothing, which is a mistake a development warning names.
   */
  onClick?: () => void
  /**
   * Whether this action cannot be run right now. A disabled item drops to the
   * muted ink and is skipped by the Arrow keys rather than removed, so the
   * reader can still see it is an action that is not available to them.
   */
  disabled?: boolean
  /**
   * Draws a separator above this item, for grouping a related run of actions
   * apart from the one before it. Ignored on the first item, where a separator
   * would have nothing above it. The separator is decorative neutral chrome and
   * carries no meaning of its own beyond the grouping the reader sees.
   */
  separatorBefore?: boolean
}

/**
 * The popup surface, spelled once. A raised card with a hairline: `bg-card`
 * lifts it off whatever it floats over, `border-border` draws its edge for
 * greyscale, and the `overlay` material rung casts the one black-alpha shadow
 * the material ladder publishes for a floating surface. It caps its height at
 * `--available-height` with an internal scroll, so a long list stays inside the
 * viewport rather than growing past it, and it is at least as wide as the
 * trigger through `--anchor-width`. Consuming the material token rather than a
 * raw shadow literal keeps this file inside the colour contract.
 */
const POPUP =
  "z-50 max-h-[var(--available-height)] min-w-[var(--anchor-width)] overflow-y-auto " +
  "rounded-opsin-lg border border-border bg-card p-opsin-1 " +
  "shadow-(--opsin-material-overlay-shadow) [color:var(--foreground)]"

/**
 * One action row, spelled once. A full-width row with the label on the left. The
 * highlight is the neutral `state-hover` surface switched on by `data-highlighted`,
 * which is the active row under the Arrow keys and under the pointer, so the
 * roving highlight is visible without a colour on either axis. Base UI moves
 * real keyboard focus onto the highlighted row, so the row also carries the
 * house focus ring on `focus-visible`, which is the strong keyboard cue that
 * the low-contrast surface lift cannot be on its own. A disabled row
 * drops to the muted ink and is skipped by the keys. Each row floors its target
 * at `--opsin-target-minimum` in rem with a literal fallback, so a touch reader
 * gets a 44pt row and the declaration stays valid where the token sheet was not
 * installed. The ink is the arbitrary property `[color:var(--foreground)]` and
 * not `text-foreground`, for the reason `select.tsx` sets out: tailwind-merge
 * files a `text-*` colour in the same conflict group as the `text-opsin-*` type
 * step and drops one of them, so the arbitrary property keeps both the ink and
 * the size.
 */
const ITEM =
  "relative flex w-full cursor-pointer select-none items-center gap-opsin-2 " +
  "rounded-opsin-sm px-opsin-3 py-opsin-2 min-h-(--opsin-target-minimum,2.75rem) " +
  "text-opsin-body [color:var(--foreground)] outline-none " +
  // The offset is negated so the ring sits inside the item's box. The item runs
  // the full width of POPUP, whose padding equals the ring's outward reach and
  // which is `overflow-y-auto` with rounded corners, so an outward ring would be
  // clipped at the popup's edge and its rounded corners, most visibly on the
  // first item highlighted when the menu opens. This is the same inset-ring
  // treatment `accordion.tsx` uses inside its own clipping shell.
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[calc(var(--opsin-border-focus-offset,2px)*-1)] focus-visible:outline-ring " +
  "data-[highlighted]:bg-state-hover " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:[color:var(--muted-foreground)] data-[disabled]:bg-transparent"

/**
 * The separator between two groups of actions, spelled once. A neutral hairline
 * inset to the popup's padding, drawing only `border-border`, so it reads as a
 * boundary and carries neither colour axis.
 */
const SEPARATOR = "-mx-opsin-1 my-opsin-1 h-px border-0 bg-border"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a
 * consumer makes with the clinical API, and a menu asserts nothing clinical.
 * `select.tsx` keeps the same small set for the same reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface MenuProps {
  /**
   * The button that opens the menu. It is the caller's own element, and Base UI
   * merges the open behaviour and the `aria-haspopup` and `aria-expanded` state
   * onto it, so it must be a single focusable element such as a button, not a
   * string or a fragment. The system's own Button and IconButton are both fit
   * for this. There is no default, because a menu with no trigger cannot be
   * opened.
   */
  trigger: ReactElement
  /**
   * The actions, in the order they appear in the list. Each action is a visible
   * label, an optional `onClick`, an optional `disabled` flag and an optional
   * `separatorBefore`. A menu with no actions has nothing to open and a menu
   * with a single action is a button that has not admitted it, so both raise a
   * development warning. Keep a safety-relevant or destructive command out of
   * here entirely: it belongs on the screen as a button, with a Dialog to
   * confirm it, because a reader cannot weigh a command they cannot see.
   */
  items: MenuAction[]
  /**
   * Merged onto the popup. Width and a wider minimum belong here. A class you
   * pass wins over the popup's own where the two conflict, because it is merged
   * last. It is the one route by which colour can reach the control, and the
   * two-colour-axes rule applies to it in full: a menu takes neither a status
   * nor a category tint, and there is no destructive red to reach for either.
   */
  className?: string
}

export function Menu({ trigger, items, className }: MenuProps) {
  if (isDevelopment()) {
    if (!Array.isArray(items) || items.length === 0) {
      warnDev(
        "no-items",
        "[opsinjs] <Menu> was rendered with no items, so it has nothing to " +
          "open. A menu is a list of actions; supply them through the `items` " +
          "prop.",
      )
    } else if (items.length === 1) {
      warnDev(
        "one-item",
        "[opsinjs] <Menu> was given a single item, which is a button that has " +
          "not admitted it. Render the one action as a Button on the screen " +
          "rather than folding it behind a trigger the reader has to open.",
      )
    }

    if (Array.isArray(items)) {
      for (const item of items) {
        if (typeof item.onClick !== "function" && item.disabled !== true) {
          warnDev(
            `item-no-onclick:${item.label}`,
            `[opsinjs] <Menu> item "${item.label}" has no onClick and is not ` +
              "disabled, so it renders as an action that does nothing when run. " +
              "Give it an onClick, or mark it disabled if it is a placeholder.",
          )
        }
      }
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    return null
  }

  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger data-slot="menu-trigger" render={trigger} />
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner side="bottom" align="start" sideOffset={6}>
          <MenuPrimitive.Popup data-slot="menu-popup" className={cn(POPUP, className)}>
            {items.map((item, index) => (
              <Fragment key={`${item.label}-${index}`}>
                {item.separatorBefore && index > 0 ? (
                  <MenuPrimitive.Separator data-slot="menu-separator" className={SEPARATOR} />
                ) : null}
                <MenuPrimitive.Item
                  data-slot="menu-item"
                  className={ITEM}
                  disabled={item.disabled}
                  onClick={item.onClick}
                >
                  {item.label}
                </MenuPrimitive.Item>
              </Fragment>
            ))}
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows a trigger and a short list
 * of neutral actions with one group set apart by a separator, which is the one
 * thing worth seeing at a glance: that the list is neutral chrome, that the
 * removing action carries no red and is told by its word, and that a separator
 * groups a run of actions rather than tinting them.
 *
 * The trigger is a plain styled button rather than the system's Button, so the
 * one file a consumer reads first stays free of a registry dependency the
 * component itself does not take. It floors its own 44pt target and carries its
 * own focus ring, because a menu trigger is the caller's button and this is the
 * caller standing in.
 *
 * The labels name fictional non-clinical actions on a saved item (ADR 0012). No
 * number, no unit and no measurement anybody could mistake for their own reading,
 * and the removing action's onClick is where a real product would open a
 * confirming Dialog rather than removing straight away.
 */
export default function MenuDemo() {
  const [lastRun, setLastRun] = useState<string | null>(null)

  return (
    <div className="flex w-full max-w-xs flex-col items-start gap-opsin-4">
      <Menu
        trigger={
          <button
            type="button"
            className={
              "inline-flex items-center justify-center gap-opsin-2 rounded-opsin-md " +
              "border border-border bg-background px-opsin-4 py-opsin-2 " +
              "min-h-(--opsin-target-minimum,2.75rem) text-opsin-headline [color:var(--foreground)] " +
              "cursor-pointer align-middle " +
              "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
              "hover:bg-state-hover " +
              "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"
            }
          >
            Actions
          </button>
        }
        items={[
          { label: "Share", onClick: () => setLastRun("Share") },
          { label: "Rename", onClick: () => setLastRun("Rename") },
          { label: "Duplicate", onClick: () => setLastRun("Duplicate") },
          { label: "Remove from list", separatorBefore: true, onClick: () => setLastRun("Remove from list") },
        ]}
      />
      <p className="m-0 text-opsin-footnote [color:var(--muted-foreground)]">
        {lastRun === null
          ? "Open the menu and choose an action."
          : `You chose "${lastRun}". A real product would run it here.`}
      </p>
    </div>
  )
}
