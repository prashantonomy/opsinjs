"use client"

/**
 * Tooltip is a short supplementary label that appears when a pointer rests on a
 * control or a keyboard moves focus to it, and vanishes when either leaves.
 *
 * IT IS FOR THE LABEL YOU COULD DELETE, AND THAT CAVEAT IS THE WHOLE COMPONENT.
 * opsinjs is a phone-first system for patient-facing screens, and a phone has no
 * hover: a touch reader never rests a pointer on anything, so a touch reader
 * never sees a tooltip at all. That is not a rendering gap this file can close,
 * because there is no touch gesture that means "hover" without also meaning
 * "activate". So the rule is stated rather than worked around. A tooltip may
 * carry only information a reader can do without: the expansion of an icon a
 * label already names, a unit already written beside the number, a hint that
 * repeats what the surface says more briefly. Anything a touch reader actually
 * needs goes on the screen, in the layout, where every reader meets it. A
 * tooltip that carries the one fact the control cannot be used without is a
 * defect on the device most readers hold, and no prop makes it safe.
 *
 * IT ADDS A DESCRIPTION, NEVER A NAME. Base UI wires the popup to the trigger
 * through `aria-describedby`, so the label is announced after the control's own
 * name, as a description, which is the register a supplementary note belongs in.
 * The trigger keeps its own accessible name: an icon-only trigger still needs an
 * `aria-label`, because a tooltip that vanished on blur is not a name a reader
 * can rely on. This file cannot supply that name, because the name belongs to
 * the control the caller passes as `children`, so the component documents the
 * requirement and leaves the name where it lives.
 *
 * THE TRIGGER IS THE CALLER'S OWN ELEMENT, RENDERED IN PLACE. `children` is not
 * wrapped in a button this file adds; it becomes the trigger through Base UI's
 * `render` slot, so the pressable element stays the one the caller wrote, with
 * its own focus ring, its own target floor and its own role. The one thing it
 * must be is focusable, because focus is the only way a keyboard reader reaches
 * a tooltip and the only way a reader without a mouse reaches it at all. A span
 * of plain text is not focusable and gets no tooltip on the keyboard, so the
 * caller passes a button, a link or a control, never a bare word.
 *
 * THE PROVIDER SITS INSIDE, ON PURPOSE AND AT A COST. Base UI's own guidance is
 * to mount one `Tooltip.Provider` high in the tree so a shared timer coordinates
 * every tooltip on a screen, and a product that shows many should still do that.
 * This component mounts its own Provider so a single `<Tooltip>` works with
 * nothing above it, which is what makes the demo render at `/view` and what lets
 * a lone tooltip in a product work with nothing hoisted around it. The cost is
 * that two of these standing side by side do not share the grouped-delay
 * behaviour a single Provider would
 * give them, so a screen with a row of them opens each on its own timer. That is
 * named here rather than hidden, and a product with a row of tooltips hoists a
 * Provider of its own above them.
 *
 * NEITHER COLOUR AXIS. A tooltip states nothing clinical: it names no level and
 * no category, so it carries neither `data-status` nor `data-category` and draws
 * only the neutral material surface, a card fill with a hairline. Colour that
 * arrives through `className` is the caller's to keep off both axes, and the
 * two-colour-axes rule applies to it in full.
 *
 * IT IS A CLIENT COMPONENT, because Base UI's tooltip primitive owns hover
 * state, focus state, a delay timer and a portal, none of which exists on the
 * server. There is no server-rendered half worth keeping: a tooltip that never
 * opens is a description that never appears.
 */

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { type ReactElement, type ReactNode } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * The popup surface, spelled once. A small raised card: `bg-card` lifts it off
 * whatever it floats over, `border-border` draws its edge for greyscale and for
 * a reader stylesheet that strips fills, and the `overlay` material rung casts
 * the one black-alpha shadow the material ladder publishes for a floating
 * surface, so the label reads as a raised note rather than a flat block.
 * Consuming the material token keeps this file inside the colour contract rather
 * than reaching for a raw shadow value.
 *
 * The type step is `footnote`, one of the eleven semantic steps, so a reader who
 * has turned their text size up gets a larger label rather than a pinned pixel
 * size. The width is capped at the tight measure so a long label wraps into a
 * readable block instead of stretching into a single unreadable line, with a
 * literal `45ch` fallback for a project installed without the generated token
 * sheet.
 *
 * The fade is chrome, not a health value, so animating it on open is allowed
 * where animating a reading would not be: there is no number here to count up
 * and no ring to sweep. It is opacity only and it is dropped under
 * `prefers-reduced-motion`, where the label appears in place instead.
 */
const POPUP =
  "z-50 max-w-[var(--opsin-measure-tight,45ch)] rounded-opsin-md border border-border bg-card " +
  "px-opsin-2 py-opsin-1 text-opsin-footnote [color:var(--foreground)] " +
  "shadow-(--opsin-material-overlay-shadow) " +
  "transition-opacity duration-(--opsin-duration-fast) ease-opsin-standard " +
  "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 " +
  "motion-reduce:transition-none"

/**
 * The arrow, a small rotated square that points from the popup back at the
 * trigger. It takes the same `bg-card` fill as the popup so it reads as one
 * material with it, and it carries no hairline of its own: a border on the
 * square would double the popup's own edge where the two meet and leave a seam,
 * so the arrow is a filled notch rather than an outlined diamond. Base UI places
 * and flips it against whichever edge the popup settled on, so this file sets
 * only its shape and its fill. How it reads on each of the four sides and under
 * forced colours has been reasoned from the material rather than measured, which
 * the page lists rather than claims.
 */
const ARROW = "size-[0.5rem] rotate-45 rounded-opsin-xs bg-card"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a
 * consumer makes with the clinical API, and a tooltip asserts nothing clinical.
 * `divider.tsx` and `segmented-control.tsx` keep the same small set for the same
 * reason, and minting a code for an interface defect is not this file's to do.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface TooltipProps {
  /**
   * The label the tooltip shows, and the whole of its content. Keep it to a
   * phrase: a tooltip is a supplementary note, not a paragraph, and a long one
   * is a block of text that belongs on the surface. It must be information a
   * reader can do without, because a touch reader never sees it: a phone has no
   * hover, so anything essential goes in the layout where every reader meets it.
   * Required, because a tooltip with no content is a description that announces
   * nothing.
   */
  content: ReactNode
  /**
   * The trigger, rendered in place rather than wrapped. Whatever element the
   * caller passes becomes the control the tooltip is attached to, keeping its
   * own role, its own focus ring and its own target floor. It must be focusable,
   * because focus is the only way a keyboard reader reaches the tooltip: pass a
   * button, a link or another control, never a bare span of text. An icon-only
   * trigger still needs its own accessible name through `aria-label`, because
   * the tooltip is a description and not a name.
   */
  children: ReactElement
  /**
   * Which edge of the trigger the popup prefers. Base UI flips to the opposite
   * edge when the preferred one would push the popup off screen, so this is a
   * preference rather than a guarantee. Defaults to `top`, which is the edge
   * least likely to sit under a thumb reaching for the control.
   */
  side?: "top" | "bottom" | "left" | "right"
  /**
   * How long the pointer must rest on the trigger before the tooltip opens, in
   * milliseconds. It does not delay the keyboard, where focus opens the tooltip
   * at once, because a reader who has deliberately moved focus to a control is
   * not resting a pointer by accident. Defaults to 600, which is long enough
   * that a pointer passing across the control does not flash the label.
   */
  delay?: number
  /**
   * Merged onto the popup surface. Placement offsets, a wider measure and the
   * space around the label belong here. It is the one route by which colour can
   * reach the popup, and the two-colour-axes rule applies to it in full: a
   * tooltip takes neither a status nor a category tint. A class you pass wins
   * over the surface's own where the two conflict, because it is merged last.
   */
  className?: string
}

export function Tooltip({ content, children, side = "top", delay = 600, className }: TooltipProps) {
  if (isDevelopment()) {
    if (content === null || content === undefined || content === "") {
      warnDev(
        "no-content",
        "[opsinjs] <Tooltip> was rendered with no `content`, so it has nothing to " +
          "show. A tooltip is a supplementary label; supply it through `content`, " +
          "or drop the tooltip and let the control stand on its own.",
      )
    }
  }

  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger data-slot="tooltip-trigger" delay={delay} render={children} />
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Positioner side={side} sideOffset={6}>
            <TooltipPrimitive.Popup data-slot="tooltip-popup" className={cn(POPUP, className)}>
              {content}
              <TooltipPrimitive.Arrow data-slot="tooltip-arrow" className={ARROW} />
            </TooltipPrimitive.Popup>
          </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. The trigger is a labelled control,
 * not an icon alone, so the one thing worth seeing at a glance is the honest use
 * of the component: the button already says what it is, and the tooltip adds a
 * supplementary note a touch reader can do without. Read it with the keyboard as
 * well as the pointer, because Tab is the path a phone reader does not have.
 *
 * The trigger carries its own 44pt target floor and its own focus ring rather
 * than borrowing the shipped Button, because a base component may not import
 * another registry component and the demo has to show a focusable control
 * anyway. There is no number and no reading in it (ADR 0012): the label names a
 * fictional summary rather than measuring anybody.
 */
export default function TooltipDemo() {
  return (
    <Tooltip content="A rolling mean across the nights you have logged.">
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-opsin-2 rounded-opsin-md border border-border bg-card",
          "px-opsin-3 py-opsin-2 min-h-(--opsin-target-minimum,2.75rem)",
          "text-opsin-body [color:var(--foreground)] cursor-pointer",
          "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard",
          "hover:bg-state-hover",
          "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring",
        )}
      >
        Overnight average
      </button>
    </Tooltip>
  )
}
