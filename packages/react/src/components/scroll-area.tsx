"use client"

/**
 * ScrollArea is a bounded region whose overflow scrolls, drawn with a thin
 * neutral scrollbar in place of the platform's default one. Its whole job is to
 * keep a long stretch of content reachable inside a box that is shorter than the
 * content, and to do that without becoming the reason the content stops being
 * reachable.
 *
 * IT IS FOR A BOUNDED INNER REGION, NEVER FOR THE PAGE. The most common and most
 * damaging misuse of a custom scroll container is to wrap the whole page in one.
 * A styled scrollbar that replaces the browser's own is a frequent cause of
 * content becoming unreachable once a reader turns their text size up to 200%,
 * because the region's height was set for one text size and does not grow with
 * the reader's. So the page itself keeps the browser's native scroll, and this
 * component is reached for only where a single card, panel or list has to hold
 * more than it can show: a scrolling region set inside a page that still scrolls
 * on its own.
 *
 * IT MUST NOT TRAP THE CONTENT, AND IT MUST NOT HIDE IT FROM THE KEYBOARD. Base
 * UI renders the viewport with `overflow: scroll`, but it only makes the
 * viewport a tab stop when its scrollbar is visible, and this component draws a
 * thin scrollbar that stays out of the way until hover, so left to Base UI an
 * overflowing region would be reachable by pointer alone. This wrapper gives the
 * viewport its own `tabIndex={0}`, so a keyboard reader can reach the region and
 * scroll it with the arrow keys (WCAG 2.1.1). The tab stop is unconditional
 * rather than measured against live overflow: a region that currently fits its
 * content becomes an extra stop that scrolls nothing, which is a small cost, and
 * the alternative of leaving an overflowing region unreachable is a real one.
 * This wrapper carries the focus ring on the viewport for the same reason, so a
 * keyboard reader can see which region they have entered. Nothing here captures
 * focus, holds it, or moves it: the viewport is one ordinary tab stop that a
 * reader passes through, not a well they fall into.
 *
 * NEITHER COLOUR AXIS. A scrolling region states no clinical level and names no
 * category. It carries neither `data-status` nor `data-category` and draws only
 * neutral chrome: the scrollbar track is transparent so it does not box the
 * content in, and the thumb is the muted-foreground role so it reads as a
 * grabbable rail without reaching for a hue. Whatever the region scrolls over is
 * the caller's content, and any colour it carries is the caller's to keep off
 * both axes.
 *
 * IT NEEDS A BOUNDED HEIGHT TO DO ANYTHING. A viewport with no height ceiling has
 * nothing to overflow, so it never scrolls and the scrollbar never appears. The
 * height comes from `maxHeight`, a CSS length applied to the viewport, or from a
 * height class the caller merges through `className`. Given neither, the region
 * grows to fit its content and behaves as a plain block, and a development
 * warning names the omission rather than leaving the caller to wonder why
 * nothing scrolls.
 */

import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area"
import type { ReactNode } from "react"

import { isDevelopment } from "../opsinjs.ts"
import { cn } from "../utils.ts"

/**
 * Which axes may scroll. Kept as a local type rather than a fourth public
 * export, for the reason `segmented-control.tsx` gives about its own option
 * shape: the registry contract fixes this file at three public exports, so a
 * consumer names this shape as `ScrollAreaProps["orientation"]` rather than
 * importing a fourth symbol.
 */
type ScrollAreaOrientation = "vertical" | "horizontal" | "both"

/*
 * The three, as the object's own list, so the runtime check reads real keys and
 * cannot be answered "yes" by a prototype member the way `in` would be.
 */
const ORIENTATIONS: ScrollAreaOrientation[] = ["vertical", "horizontal", "both"]

/*
 * The viewport, spelled once. It is the scrollable element: Base UI sets its
 * `overflow: scroll`, the component gives it a tab stop on the element itself,
 * and this class carries the focus ring so a keyboard reader can see which
 * region they have entered. The ring is kept in
 * the component's own classes rather than left to the product stylesheet, for
 * the reason `link.tsx` records: a project installed without that stylesheet
 * would otherwise lose the ring silently. `overscroll-contain` stops a scroll
 * that reaches the end of this region from scrolling the page behind it, which
 * is the behaviour a bounded region owes the page it sits in. The radius is
 * inherited from the root so a caller who rounds the region through `className`
 * gets a viewport that matches.
 */
const VIEWPORT =
  "h-full max-h-[inherit] w-full overscroll-contain rounded-[inherit] " +
  "focus-visible:outline-ring focus-visible:outline-[length:var(--opsin-border-focus,2px)] " +
  // The offset is negated so the ring draws inside the viewport. The viewport
  // fills a container the caller usually rounds and borders, so an outward ring
  // would be clipped at those corners; an inset ring stays whole.
  "focus-visible:outline-offset-[calc(var(--opsin-border-focus-offset,2px)*-1)]"

/*
 * The scrollbar track per axis, written out per axis because Tailwind reads
 * class names as literal strings. The track itself draws no fill, so it does not
 * box the content in a second border; it is a transparent gutter that the thumb
 * rides in. The opacity transition follows Base UI's hovering and scrolling data
 * attributes, so the rail fades in as chrome rather than sitting as a fixed line
 * competing with the content.
 */
const SCROLLBAR_BASE =
  "flex touch-none select-none p-opsin-0-5 opacity-0 " +
  "transition-opacity duration-(--opsin-duration-fast) ease-opsin-standard " +
  "data-[hovering]:opacity-100 data-[scrolling]:opacity-100"
const SCROLLBAR_Y = SCROLLBAR_BASE + " w-opsin-3 justify-center"
const SCROLLBAR_X = SCROLLBAR_BASE + " h-opsin-3 flex-col items-center"

/*
 * The thumb per axis. Base UI sets the thumb's main-axis length inline from the
 * ratio of content to viewport, so this class sets only the cross-axis size and
 * the fill. The fill is the muted-foreground role, a low-emphasis neutral that
 * reads as a grabbable rail without either colour axis, and it is pill-shaped so
 * it reads as a handle rather than a bar.
 */
const THUMB_Y = "w-full rounded-full bg-muted-foreground"
const THUMB_X = "h-full rounded-full bg-muted-foreground"

/*
 * Development warnings for uncoded mistakes, said once per distinct offender.
 * Nothing here has an OpsinErrorCode: a scrolling region asserts nothing
 * clinical, so the codes in `tokens/errors.json` do not apply, and minting one
 * is not this file's to do. `divider.tsx` and `segmented-control.tsx` keep the
 * same small set for the same reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface ScrollAreaProps {
  /**
   * The content the region scrolls over. It is ordinary content, and any colour
   * it carries is the caller's to keep off both colour axes; this component adds
   * none of its own.
   */
  children: ReactNode
  /**
   * A CSS length that caps the viewport's height, such as `"16rem"`. This is
   * what gives the region something to overflow, so a vertical scroll area needs
   * either this or a height class merged through `className`. Given neither, the
   * region grows to fit its content and never scrolls, and a development warning
   * names the omission. Use a length that grows with the reader's text, a rem
   * rather than a pixel count, so the region does not clip its content at 200%
   * text.
   */
  maxHeight?: string
  /**
   * Which axes may scroll. `vertical` is the common case and the default;
   * `horizontal` is for a wide row such as a set of cards; `both` shows both
   * rails and a corner where they meet. A value outside the three is treated as
   * `vertical`, the case that needs nothing from its container, and a
   * development warning names the mistake.
   */
  orientation?: "vertical" | "horizontal" | "both"
  /**
   * Merged onto the root. The region's width, its border and rounding, and the
   * height that bounds it when `maxHeight` is not used all belong here. It is
   * unrestricted, so it is the one route by which colour can reach the region,
   * and the two-colour-axes rule applies to it in full: a scroll area takes
   * neither a status nor a category tint. A class you pass wins over the root's
   * own where the two conflict, because it is merged last.
   */
  className?: string
}

export function ScrollArea({
  children,
  maxHeight,
  orientation = "vertical",
  className,
}: ScrollAreaProps) {
  // A value outside the three is treated as vertical, the case that needs
  // nothing from its container. This file ships as source into JavaScript
  // projects where the union is only advice.
  const resolved: ScrollAreaOrientation = ORIENTATIONS.includes(
    orientation as ScrollAreaOrientation,
  )
    ? (orientation as ScrollAreaOrientation)
    : "vertical"

  if (isDevelopment()) {
    if (resolved !== orientation) {
      warnDev(
        "orientation",
        `[opsinjs] <ScrollArea> received orientation="${String(orientation)}", which is not "vertical", "horizontal" or "both". It was treated as "vertical".`,
      )
    }

    const boundsVertical = resolved === "vertical" || resolved === "both"
    const hasHeightHint =
      (typeof maxHeight === "string" && maxHeight.trim() !== "") ||
      (typeof className === "string" && /(?:^|\s)(?:max-)?h-/.test(className))
    if (boundsVertical && !hasHeightHint) {
      warnDev(
        "no-height",
        "[opsinjs] <ScrollArea> was rendered with no height ceiling, so it has " +
          "nothing to overflow and will not scroll. Give it a `maxHeight` such " +
          'as "16rem", or a height class through `className`.',
      )
    }
  }

  const showVertical = resolved === "vertical" || resolved === "both"
  const showHorizontal = resolved === "horizontal" || resolved === "both"

  return (
    <BaseScrollArea.Root data-slot="scroll-area" className={cn("relative", className)}>
      <BaseScrollArea.Viewport
        data-slot="scroll-area-viewport"
        tabIndex={0}
        style={maxHeight ? { maxHeight } : undefined}
        className={VIEWPORT}
      >
        {children}
      </BaseScrollArea.Viewport>

      {showVertical ? (
        <BaseScrollArea.Scrollbar
          orientation="vertical"
          data-slot="scroll-area-scrollbar"
          className={SCROLLBAR_Y}
        >
          <BaseScrollArea.Thumb data-slot="scroll-area-thumb" className={THUMB_Y} />
        </BaseScrollArea.Scrollbar>
      ) : null}

      {showHorizontal ? (
        <BaseScrollArea.Scrollbar
          orientation="horizontal"
          data-slot="scroll-area-scrollbar"
          className={SCROLLBAR_X}
        >
          <BaseScrollArea.Thumb data-slot="scroll-area-thumb" className={THUMB_X} />
        </BaseScrollArea.Scrollbar>
      ) : null}

      {resolved === "both" ? (
        <BaseScrollArea.Corner data-slot="scroll-area-corner" />
      ) : null}
    </BaseScrollArea.Root>
  )
}
