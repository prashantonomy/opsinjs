"use client"

/**
 * Popover is a small panel anchored to the control that opened it, floated in a
 * portal so it escapes whatever card or scroll area the trigger sits in. Its home
 * is a short aside a reader can open, read or fill, and then dismiss without
 * leaving the page: a note beside a value, a rename field on a list, a couple of
 * options that are not worth a whole screen.
 *
 * IT IS A THIN THEMED WRAPPER, AND THAT IS THE WHOLE POINT. Base UI's Popover is
 * already complete and unopinionated: it owns the anchoring, the portal, the
 * dismissal, the focus return and the keyboard. opsinjs adds tokens and nothing
 * else. So this file is deliberately small. It sets the material of the panel,
 * the neutral chrome of the trigger, a 44pt target floor and a focus ring, and it
 * hands every behaviour back to the primitive rather than reimplementing one. When
 * a page reaches for a behaviour this wrapper does not expose, the answer is the
 * Base UI part underneath rather than a new prop here.
 *
 * IT OWNS ITS OPEN STATE UNLESS YOU TAKE IT. Left alone the popover is
 * uncontrolled: it opens on a press of its trigger, closes on Escape, on a press
 * outside, or on a press of a control inside that calls back, and the product
 * stores nothing. A product that needs to open it from elsewhere, or to know when
 * it closes, passes `open` and `onOpenChange` and takes the state over. Both paths
 * are Base UI's own, so the uncontrolled default is not a second code path this
 * file maintains.
 *
 * IT IS NOT A DIALOG AND IT IS NOT A SHEET, WHICH IS THE LINE THAT DECIDES WHEN TO
 * REACH FOR IT. A popover is non-modal: the page behind it stays live, and a
 * reader can ignore it and carry on. That makes it wrong for anything that must be
 * answered before the reader continues, which is a Dialog, and wrong for a large
 * form or a surface that has to work with a thumb on a phone, which is a Sheet. A
 * popover is the smallest of the three, and it earns its place only where dismissal
 * is always a valid outcome and the content is small enough to float.
 *
 * NEITHER COLOUR AXIS. A popover holds content a product supplies; it states no
 * clinical level and names no category, so it carries neither `data-status` nor
 * `data-category` and draws only neutral chrome. The panel is a raised card lifted
 * off the page by the `overlay` material's own shadow and a hairline, so it reads
 * as a floating surface without a hue doing the work, and it survives greyscale.
 * Colour that arrives through `className` is the caller's to keep off both axes,
 * and a health value that needs a range and a verdict belongs in the component
 * built for it rather than loose inside a popover.
 *
 * WHAT IT DOES NOT DO. It does not trap focus or lock the page, because a popover
 * is non-modal by design and a surface that blocks everything is a Dialog. It does
 * not animate a value on first paint, mount a live region, or write the product's
 * own words. It renders no measurement and reaches no verdict.
 */

import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { useId, type ReactNode } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * Which edge of the trigger the panel is anchored to. Kept as a local type rather
 * than a fourth public export, for the reason `segmented-control.tsx` gives about
 * its own option shape: the registry contract fixes this file at three public
 * exports, so a consumer names this shape as `PopoverProps["side"]` rather than
 * importing a fourth symbol. It is the physical subset of Base UI's own side
 * union; the logical `inline-start` and `inline-end` values are not surfaced,
 * because a product that needs writing-direction-relative sides reaches for the
 * primitive underneath.
 */
type PopoverSide = "top" | "right" | "bottom" | "left"

/**
 * The trigger, spelled once. A neutral bordered button on the background surface,
 * so it reads as a control the reader can press without competing with the content
 * around it. The ink is written as the arbitrary property `[color:var(--foreground)]`
 * and not `text-foreground`, for the reason `segmented-control.tsx` sets out at
 * length: tailwind-merge files a `text-*` colour in the same conflict group as the
 * `text-opsin-*` type step and drops one of them, so the arbitrary property lands
 * in the `color` group instead and both the ink and the size survive. The target
 * floor is `--opsin-target-minimum` in rem with a literal fallback, so it stays
 * valid where the token sheet was not installed and grows with the reader's text
 * size rather than pinning at a device pixel. It is set on both height and width, so
 * an icon-only or single-glyph trigger keeps a full hit area on both axes rather than
 * shrinking to its content, while a wider label expands past the floor as usual. The open state is echoed with the
 * neutral `state-hover` surface read from the trigger's own `data-popup-open`, so
 * a reader can see which trigger the floating panel belongs to.
 */
const TRIGGER =
  "inline-flex items-center justify-center gap-opsin-2 " +
  "rounded-opsin-md border border-border bg-background " +
  "px-opsin-3 py-opsin-2 min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem) " +
  "text-opsin-body [color:var(--foreground)] text-center align-middle cursor-pointer " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "hover:bg-state-hover data-[popup-open]:bg-state-hover " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

/**
 * The panel, spelled once. A raised card: `bg-card` lifts it off whatever it floats
 * over, `border-border` draws its edge for greyscale, and the `overlay` material
 * rung casts the one black-alpha shadow the material ladder publishes for a floating
 * surface, so the panel reads as a raised object rather than a flat block.
 * Consuming the material token rather than a raw shadow literal keeps this file
 * inside the colour contract. The measure is capped so a long note wraps to a
 * readable width rather than stretching across the viewport, and the type is the
 * `body` step so it grows with the reader's text size.
 *
 * The entrance is a short fade and a slight scale on the primitive's own
 * `data-starting-style` and `data-ending-style` states, at the fast chrome
 * duration. Under `prefers-reduced-motion` the scale is pinned and only the opacity
 * crossfades, which is the reduced-motion fallback the system asks for: not nothing,
 * but an instant, equally informative state. Nothing here is a health value, so
 * there is no reading being animated on first paint.
 */
const POPUP =
  "z-50 max-w-[min(var(--opsin-measure-tight,45ch),calc(100vw-var(--opsin-space-8,2rem)))] " +
  "rounded-opsin-lg border border-border bg-card p-opsin-4 " +
  "shadow-(--opsin-material-overlay-shadow) [color:var(--foreground)] " +
  "text-opsin-body " +
  "transition-[opacity,scale] duration-(--opsin-duration-fast) ease-opsin-standard " +
  "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 " +
  "data-[starting-style]:scale-95 data-[ending-style]:scale-95 " +
  "motion-reduce:transition-opacity motion-reduce:data-[starting-style]:scale-100 motion-reduce:data-[ending-style]:scale-100"

/**
 * The arrow, a small card-coloured diamond that points from the panel back to the
 * trigger it belongs to. It is a rotated square rather than a drawn glyph, filled
 * with `bg-card` so it continues the panel's surface, and it carries the hairline
 * only on the two edges that face away from the panel, chosen per side from the
 * primitive's `data-side`, so a stray line never crosses the panel's interior. The
 * half-target offset per side tucks the diamond's inner half under the panel edge.
 * It is decorative and Base UI marks it `aria-hidden`, because the panel's role and
 * name already tell assistive technology what the surface is.
 */
const ARROW =
  "size-[0.625rem] rotate-45 rounded-opsin-xs bg-card " +
  "data-[side=bottom]:-top-[0.3125rem] data-[side=bottom]:border-t data-[side=bottom]:border-l data-[side=bottom]:border-border " +
  "data-[side=top]:-bottom-[0.3125rem] data-[side=top]:border-b data-[side=top]:border-r data-[side=top]:border-border " +
  "data-[side=left]:-right-[0.3125rem] data-[side=left]:border-t data-[side=left]:border-r data-[side=left]:border-border " +
  "data-[side=right]:-left-[0.3125rem] data-[side=right]:border-b data-[side=right]:border-l data-[side=right]:border-border"

/**
 * The title, spelled once. When a caller names the panel it is rendered as a
 * heading at the `headline` step and Base UI wires the panel's `aria-labelledby` to
 * it, so a screen-reader user hears what the surface is before its content. It is
 * the accessible name of a `role="dialog"`, so a panel with real content owes one.
 */
const TITLE = "m-0 mb-opsin-2 text-opsin-headline [color:var(--foreground)]"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a consumer
 * makes with the clinical API, and a popover asserts nothing clinical.
 * `segmented-control.tsx` and `select.tsx` keep the same small set for the same
 * reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface PopoverProps {
  /**
   * The visible content of the button that opens the panel: a word, an icon, or a
   * short icon-and-word pair. This component supplies the accessible button itself,
   * with its target floor, its focus ring and the `aria-expanded` state the
   * primitive manages, so pass the label rather than a control of your own. A whole
   * button passed here would nest one button inside another, which is invalid.
   */
  trigger: ReactNode
  /**
   * What the panel holds: a short note, a couple of options, or a small form
   * fragment. Keep it small. A popover floats and is dismissed by leaving it, so
   * anything large enough to need its own scroll or a thumb-friendly layout is a
   * Sheet, and anything that must be answered before the reader carries on is a
   * Dialog.
   */
  children: ReactNode
  /**
   * The accessible name of the panel, rendered as a visible heading and wired to
   * the panel's `aria-labelledby`. The panel is a `role="dialog"`, so a panel with
   * real content owes a name: without one a screen-reader user is told a dialog has
   * opened and nothing about what it is. Omit it only for a panel whose content is
   * itself its heading, and a missing title raises a development warning.
   */
  title?: string
  /**
   * Whether the panel is open. Optional: omitted, the popover is uncontrolled and
   * owns its own open state, opening on a press of the trigger and closing on
   * Escape or a press outside. Passed, the product owns the state and must update
   * it through `onOpenChange`.
   */
  open?: boolean
  /**
   * Called with the state the popover wants to be in, on every open and close. Pair
   * it with `open` to take the state over; on its own, alongside the uncontrolled
   * default, it is a notification the product can listen to without storing
   * anything.
   */
  onOpenChange?: (open: boolean) => void
  /**
   * Which edge of the trigger the panel is anchored to before collision handling.
   * The primitive flips it to the opposite edge when there is not room, so this is
   * the preference rather than a guarantee. Defaults to `bottom`, which is where a
   * panel opened by a thumb is least likely to be hidden under it.
   */
  side?: PopoverSide
  /**
   * Merged onto the panel. Width and the space around the content belong here. A
   * class you pass wins over the panel's own where the two conflict, because it is
   * merged last. It is the one route by which colour can reach the panel, and the
   * two-colour-axes rule applies to it in full: a popover takes neither a status
   * nor a category tint.
   */
  className?: string
}

export function Popover({
  trigger,
  children,
  title,
  open,
  onOpenChange,
  side = "bottom",
  className,
}: PopoverProps) {
  const titleId = useId()
  const hasTitle = typeof title === "string" && title.trim() !== ""

  if (isDevelopment() && !hasTitle) {
    warnDev(
      "no-title",
      "[opsinjs] <Popover> was rendered with no `title`. The panel is a " +
        'role="dialog", so without a title a screen-reader user is told a dialog ' +
        "has opened and nothing about what it is. Pass `title` with the name of " +
        "the panel, or reach for an inline element if the content needs no panel " +
        "at all.",
    )
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger data-slot="popover-trigger" className={TRIGGER}>
        {trigger}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner side={side} sideOffset={8}>
          <PopoverPrimitive.Popup
            data-slot="popover-popup"
            aria-labelledby={hasTitle ? titleId : undefined}
            className={cn(POPUP, className)}
          >
            <PopoverPrimitive.Arrow data-slot="popover-arrow" className={ARROW} />
            {hasTitle ? (
              <PopoverPrimitive.Title
                id={titleId}
                data-slot="popover-title"
                className={TITLE}
              >
                {title}
              </PopoverPrimitive.Title>
            ) : null}
            {children}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It leaves the popover uncontrolled,
 * because uncontrolled is what almost every product actually needs and the demo
 * should not teach the exception first, and it shows a button opening a short note,
 * which is the one thing worth seeing at a glance: that the panel floats as a
 * raised card with an arrow back to its trigger and carries no colour on either
 * axis. Read it in greyscale to check that.
 *
 * There is not a number anywhere in it (ADR 0012). A popover renders no
 * measurement, so there is no reading here for anybody to mistake for their own.
 */
export default function PopoverDemo() {
  return (
    <Popover title="About this list" trigger="What is this?">
      <p className="m-0 [color:var(--foreground)]">
        This is a short, anchored panel. It floats over the page without blocking
        it, and it closes when you press outside it or press Escape.
      </p>
    </Popover>
  )
}
