"use client"

/**
 * Sheet — a panel that comes up from the bottom edge, rests at a stated height,
 * and can always be left.
 *
 * WHY THIS FILE IS `"use client"` AND SURFACE IS NOT. Surface answers every
 * question it has with a media query, so it renders once on the server and is
 * correct forever. A Sheet cannot: it holds which detent it is resting at, it
 * mounts a portal, it moves focus, and it listens for a drag. None of that has
 * a CSS answer, so the directive is a requirement rather than a convenience —
 * and it is on this file rather than borrowed from Base UI, because the demo at
 * the bottom holds state of its own and a file whose demo needs `useState` is a
 * client file whatever its imports say.
 *
 * THERE IS NO `sheet` PRIMITIVE IN BASE UI 1.7.0. `@base-ui/react/drawer` is
 * the one this is built on, and the mapping is not one-to-one — every place the
 * two vocabularies disagree is written out beside the code that resolves it,
 * because a wrapper that quietly renames a prop is a wrapper nobody can audit:
 *
 *   spec `dismissible`  ↔ Base UI `disablePointerDismissal`  (INVERTED, and
 *                         Base UI's covers the pointer only, so the escape key
 *                         and the close watcher are cancelled by hand below)
 *   spec `detents`      ↔ Base UI `snapPoints`               (fractions, pixels
 *                         or rems — there is no content-sized snap point)
 *   spec `modal`        ↔ Base UI `modal`                    (Base UI has a
 *                         third state, `'trap-focus'`, that this API does not
 *                         model and deliberately does not expose)
 *   spec `title`        ↔ `Drawer.Title`                     (a part, not a
 *                         root prop; it is what `aria-labelledby` points at)
 *
 * A MODAL SURFACE OWNS ITS OWN `open`/`onOpenChange`, AND THAT IS DECIDED HERE.
 * The specifications for LogSheet and ConsentSheet both say they "extend Sheet"
 * and neither declares `open` or `onOpenChange`, so as written neither of them
 * can be opened. The resolution belongs in the base rather than in each
 * descendant: a surface that takes the screen decides nothing about when it is
 * on it, and a component that extends Sheet inherits both props unchanged.
 *
 * `onOpenChange` TAKES A SECOND ARGUMENT THE SPECIFICATION DOES NOT DECLARE,
 * and it is not decoration. The page requires that a sheet holding unsaved
 * input "asks first — by the same route as a background tap", which a product
 * cannot do unless it is told which route was taken. A one-argument handler is
 * still assignable to the two-argument type, so `onOpenChange={setOpen}` keeps
 * working and a product that needs the route can read it.
 *
 * WHAT IT DOES NOT DO. It mounts no live region, it announces nothing on its
 * own behalf, and it never decides that a reader has finished. It also refuses
 * to be a Dialog: there is no way to make a Sheet undismissable AND unclosable,
 * because the one modal surface with no valid way out is a question, and a
 * question is `Dialog`.
 */

import { Drawer } from "@base-ui/react/drawer"
import { X } from "lucide-react"
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useState,
  type ReactNode,
} from "react"

import { isDevelopment, type Detent } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/base-lyra/ui/button"
import { Surface } from "@/registry/base-lyra/ui/surface"

/**
 * How a close was asked for.
 *
 * Five routes rather than Base UI's nine, because the distinctions this
 * component's accessibility contract turns on are coarser than the ones the
 * primitive reports. What matters to a product is whether the reader made a
 * deliberate exit (`close-control`) or brushed against one of the ambient ones
 * (`scrim`, `escape`, `drag`) — the first needs no confirmation and the other
 * three, over unsaved input, need the same one.
 *
 * Module-local, not exported: a registry file's public surface is its props,
 * its component and its demo, and callers name this as
 * `SheetProps["onOpenChange"]`'s second parameter.
 */
type SheetDismissRoute = "close-control" | "scrim" | "escape" | "drag" | "other"

/**
 * Base UI's reason, translated. `closeWatcher` joins `escapeKey` because it is
 * the same intention arriving through the platform's back gesture instead of
 * through a key, and a product that confirms one and not the other has a hole
 * on exactly the devices where a sheet matters most.
 */
function routeFor(reason: string): SheetDismissRoute {
  switch (reason) {
    case "closePress":
      return "close-control"
    case "outsidePress":
      return "scrim"
    case "escapeKey":
    case "closeWatcher":
      return "escape"
    case "swipe":
      return "drag"
    default:
      return "other"
  }
}

/**
 * The two detents that have a numeric answer, as fractions of the viewport.
 *
 * `content` is deliberately absent and the reason is mechanical rather than
 * aesthetic. Base UI resolves every snap point against the popup's own measured
 * height and clamps it there (`useDrawerSnapPoints`: `offset = popupHeight -
 * clampedHeight`), so a sheet that can reach `full` has to be viewport-tall —
 * and once it is, its natural height IS the viewport and there is no content
 * height left to snap to. The two requirements are not satisfiable at the same
 * time, so `content` is supported as the only detent, where it needs no snap
 * point at all: the popup takes its own height and the browser lays it out.
 */
const VIEWPORT_FRACTION: Record<"half" | "full", number> = {
  half: 0.5,
  full: 1,
}

/**
 * What each detent is called when the grabber has to say what it will do.
 *
 * Plain words rather than the API's own values: the reader of the accessible
 * name is a person using the product, not a person reading this file, and
 * "half" on its own is an adjective with no noun.
 */
const DETENT_WORD: Record<Detent, string> = {
  content: "fit the content",
  half: "half the screen",
  full: "the full screen",
}

/**
 * The default, and the reason it is the smallest of the three.
 *
 * Declared at module scope rather than inline in the parameter list so that the
 * array identity is stable across renders — an inline `= ["content"]` is a new
 * array every time and would defeat any memo that is ever added below it.
 */
const DEFAULT_DETENTS: Detent[] = ["content"]

function isDetent(value: unknown): value is Detent {
  return value === "content" || value === "half" || value === "full"
}

/**
 * How deep in a stack of Sheets this one is.
 *
 * Base UI supports nested drawers on purpose and this system forbids them on
 * purpose, so the primitive cannot report the mistake and this context is how
 * the component sees it. A count rather than a boolean because the warning is
 * more useful when it can say how many deep the reader has got.
 */
const SheetDepth = createContext(0)

/**
 * Whether the caller placed a `Sheet.Content` among the direct children.
 *
 * SAY EXACTLY WHAT THIS CAN SEE, because a check that over-promises is worse
 * than none. It reads direct children only. A `Sheet.Content` wrapped in a
 * `<div>` or a fragment is invisible to it and reports a false absence, which
 * is why the warning names what it looked at rather than asserting a defect.
 * The failure it exists to catch is the common one: content that overflows a
 * sheet with no scroll boundary, where a flick meant to scroll dismisses the
 * sheet instead, because Base UI treats every touch outside `[data-drawer-content]`
 * as a swipe.
 */
function hasContentSlot(children: ReactNode): boolean {
  return Children.toArray(children).some(
    (child) => isValidElement(child) && child.type === SheetContent,
  )
}

/**
 * The detents this sheet will actually rest at, from the ones it was given.
 *
 * Order is preserved because the specification says "rest positions, in order"
 * and the first one is where the sheet opens. Duplicates are dropped silently —
 * two identical stops are not a mistake worth a warning, and Base UI
 * deduplicates resolved heights within a pixel anyway.
 */
function resolveDetents(detents: Detent[]): Detent[] {
  const stops: Detent[] = []

  for (const detent of detents) {
    if (!isDetent(detent)) {
      if (isDevelopment()) {
        console.warn(
          `[opsinjs] <Sheet> was given the detent "${String(detent)}", which is ` +
            "not one of content, half or full. It was ignored.",
        )
      }
      continue
    }
    if (!stops.includes(detent)) stops.push(detent)
  }

  if (stops.length === 0) {
    if (isDevelopment()) {
      console.warn(
        "[opsinjs] <Sheet> was given an empty `detents` array. A sheet with no " +
          'rest position has no height, so it fell back to ["content"].',
      )
    }
    return DEFAULT_DETENTS
  }

  if (stops.length > 1 && stops.includes("content")) {
    const measured = stops.filter((stop) => stop !== "content")
    if (isDevelopment()) {
      console.warn(
        "[opsinjs] <Sheet> was given `content` alongside another detent. A " +
          "content-sized stop and a viewport-sized stop cannot both exist: a " +
          "sheet that can reach half or full is as tall as the viewport, and a " +
          "snap point is resolved against the sheet's own height. `content` was " +
          `dropped; the sheet rests at ${measured.join(" and ")}.`,
      )
    }
    return measured
  }

  return stops
}

/**
 * Base UI's snap points for a set of detents, or `undefined` for the
 * content-sized sheet, which needs none.
 */
function toSnapPoints(stops: Detent[]): number[] | undefined {
  const points: number[] = []
  for (const stop of stops) {
    if (stop === "content") return undefined
    points.push(VIEWPORT_FRACTION[stop])
  }
  return points.length > 0 ? points : undefined
}

/**
 * The popup's resting transform, as a class rather than an inline style, and
 * this is the one line in the file most likely to be "simplified" into a bug.
 *
 * Base UI writes `transform` inline on the popup WHILE a drag is in flight and
 * writes nothing there the rest of the time, publishing the movement as
 * `--drawer-swipe-movement-y` and the active stop as
 * `--drawer-snap-point-offset` instead. An inline style here would win against
 * the one it writes during the drag and freeze the sheet under the reader's
 * finger; a Tailwind `translate-y-*` utility would set the `translate`
 * property, which composes with `transform` rather than being replaced by it,
 * and the sheet would move twice as far. So it is an arbitrary `transform`
 * property, in a class, where the primitive's inline style beats it exactly
 * when it should.
 */
const RESTING_TRANSFORM =
  "[transform:translateY(calc(var(--drawer-snap-point-offset,0px)_+_var(--drawer-swipe-movement-y,0px)))]"

/**
 * Off the bottom edge, on the way in and on the way out.
 *
 * A whole `transform` rather than an added term, so it replaces the resting one
 * outright: a sheet entering is not at a detent yet and must not be offset by
 * one. `100%` is of the popup's own height, so it is off-screen at every detent
 * and at every text size without a measurement.
 */
const OFFSCREEN_TRANSFORM =
  "data-starting-style:[transform:translateY(100%)] data-ending-style:[transform:translateY(100%)]"

/**
 * The slide.
 *
 * `spring-sheet` paired with its own duration, never crossed with another
 * spring's: a `linear()` stop list runs from 0 to 1 whatever the spring, so
 * putting one spring's curve on another's duration produces a different spring
 * rather than a faster one.
 *
 * `motion-reduce:transition-none` is the component's own answer and not a
 * duplicate of the token layer's. Under `prefers-reduced-motion` the token
 * layer collapses `--opsin-duration-spring-sheet` to 120ms, which is the right
 * answer for a cue that says a value changed and the wrong one for a panel
 * travelling the height of the screen — 120ms of full-height translation is
 * still the slide the page says to remove. Removing the transition leaves the
 * sheet appearing at its detent, and the drag still works: reduced motion is
 * not reduced capability.
 */
const SLIDE =
  "transition-transform duration-(--opsin-duration-spring-sheet) ease-opsin-spring-sheet motion-reduce:transition-none"

/**
 * How the Surface inside the popup is told to lay its content out.
 *
 * Surface owns the class list on its own content wrapper and takes no prop for
 * it, so a composing component reaches it by its `data-slot` — which is the
 * whole point of the slot contract, and is the supported way to do this rather
 * than a workaround. Without it the header, the scrolling content and the
 * footer are three blocks in normal flow, the content has no bounded height,
 * and `overflow-y: auto` on it does nothing at all.
 *
 * `flex-auto` and not `flex-1`: `flex-1` sets a zero flex basis, and a sheet
 * whose height is its content's would then compute that height as zero.
 */
const SURFACE_LAYOUT = [
  "flex min-h-0 flex-auto flex-col",
  "[&>[data-slot=surface-content]]:flex",
  "[&>[data-slot=surface-content]]:min-h-0",
  "[&>[data-slot=surface-content]]:flex-auto",
  "[&>[data-slot=surface-content]]:flex-col",
].join(" ")

/**
 * The focus ring, declared here rather than inherited.
 *
 * `app/product.css` gives every `:focus-visible` an outline, and that file does
 * not travel with this one into a consumer's project. A control whose ring
 * depends on a stylesheet it was not installed with is a control that loses it
 * silently, on the surface where a keyboard reader most needs to know where
 * they are.
 */
const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

export interface SheetProps {
  /**
   * Whether the sheet is on screen. Required and controlled: a modal surface
   * that owned its own visibility would be a surface a product could not close
   * when the data underneath it changed.
   */
  open: boolean
  /**
   * Called when the sheet asks to open or close. The second argument says which
   * route was taken — `close-control` for the header's close button,
   * `scrim` for a tap on the background, `escape` for the escape key or the
   * platform's back gesture, `drag` for a swipe down, and `other` for anything
   * else, including a close the product asked for itself.
   *
   * The sheet does not close itself: `open` is the only thing that closes it.
   * That is what makes "ask before discarding unsaved input" possible — leave
   * `open` alone, show the confirmation, and close when the reader answers.
   */
  onOpenChange: (open: boolean, route: SheetDismissRoute) => void
  /**
   * The sheet's accessible name, and a visible heading. Required: an unnamed
   * modal surface is announced as "dialog" and nothing else, which tells a
   * screen-reader user that something has taken the screen and not what.
   */
  title: string
  /**
   * Rest positions, in order; the first is where the sheet opens. A single
   * entry disables drag-between-detents, which is the common case and the
   * default.
   *
   * `"content"` is supported only on its own. It is not a snap point but the
   * absence of one: the sheet takes its own height, up to the full viewport,
   * and the browser lays it out. `"half"` and `"full"` are fractions of the
   * viewport and can be combined; passing `"content"` alongside either drops it
   * with a development warning, because a sheet that can reach the full screen
   * is already as tall as the screen and has no content height to return to.
   *
   * @default ["content"]
   */
  detents?: Detent[]
  /**
   * Traps focus and makes the page behind genuinely inert — not dimmed, but
   * unreachable, by a pointer and by assistive technology alike. Non-modal does
   * neither and is a different component wearing the same clothes; the flag
   * exists so that the difference is declared rather than emergent.
   *
   * @default true
   */
  modal?: boolean
  /**
   * Whether the scrim, the escape key and a downward drag close the sheet. Set
   * it `false` for a form, where each of those three is an accident waiting to
   * throw away what somebody typed. It never removes the close control in the
   * header: a modal surface with no way out is a trap, and the one surface that
   * legitimately has no "went away" outcome is a `Dialog`.
   *
   * @default true
   */
  dismissible?: boolean
  /**
   * The pinned action area. A prop rather than a compound part because a prop
   * can carry it, and because the pinning is the point: the footer sits outside
   * the scrolling region, above the software keyboard and above the safe-area
   * inset, so the primary action cannot be scrolled away from or covered.
   */
  footer?: ReactNode
  /**
   * Merged onto the sheet's container. Width belongs here: a sheet is as wide
   * as the screen by default, and a product that wants it narrower on a large
   * display knows something about its layout that this component does not.
   */
  className?: string
  /**
   * What the sheet holds. Usually a single `Sheet.Content`, which is the
   * scrolling region; anything placed beside it does not scroll.
   */
  children: ReactNode
}

export function Sheet({
  open,
  onOpenChange,
  title,
  detents = DEFAULT_DETENTS,
  modal = true,
  dismissible = true,
  footer,
  className,
  children,
}: SheetProps) {
  const depth = useContext(SheetDepth)
  const stops = resolveDetents(detents)
  const snapPoints = toSnapPoints(stops)
  const [stopIndex, setStopIndex] = useState(0)
  const [openLastRender, setOpenLastRender] = useState(open)

  /* Back to the first detent on every open. A sheet that reopened at whatever
     height the reader last dragged it to would be a sheet whose size depends on
     something they did minutes ago and cannot see; "the first is where it
     opens" is only true if it is true every time.

     Adjusted during the render that notices the change rather than in an
     effect, which is React's own answer for state derived from a prop: an
     effect would commit the sheet at the old detent, paint it, and then correct
     it — one frame of the sheet at the height it was left at last time, on the
     way in. */
  if (openLastRender !== open) {
    setOpenLastRender(open)
    if (open) setStopIndex(0)
  }

  if (isDevelopment()) {
    if (depth > 0) {
      console.warn(
        "[opsinjs] A <Sheet> is nested inside another <Sheet>. Two stacked " +
          "modal surfaces produce a focus order nobody can predict and an " +
          "escape key with two plausible meanings. Put the second task on the " +
          "first sheet, or make it a screen.",
      )
    }
    /* `typeof` first because this file ships as source into JavaScript
       projects, where `title: string` is advice and `title.trim()` on whatever
       arrived is a crash rather than a warning. */
    if (typeof title !== "string" || title.trim() === "") {
      console.warn(
        "[opsinjs] <Sheet> was given an empty `title`. It is the accessible " +
          "name, and without it the sheet is announced as \"dialog\" and " +
          "nothing else. There is no honest default; name the task the reader " +
          "came here to do.",
      )
    }
    if (open && !hasContentSlot(children)) {
      console.warn(
        "[opsinjs] <Sheet> has no <Sheet.Content> among its direct children. " +
          "That element is the scroll boundary: without it nothing inside the " +
          "sheet scrolls, and a flick meant to scroll is read as a drag and " +
          "dismisses the sheet. This check reads direct children only, so a " +
          "Sheet.Content wrapped in another element is invisible to it.",
      )
    }
  }

  const index = Math.min(stopIndex, stops.length - 1)
  const nextStop = stops[(index + 1) % stops.length]
  const canChangeDetent = stops.length > 1

  return (
    <SheetDepth.Provider value={depth + 1}>
      <Drawer.Root
        open={open}
        modal={modal}
        /* INVERTED, AND THE POLARITY IS THE WHOLE PROP. Base UI's flag disables
           dismissal; this API's enables it. Getting it the wrong way round
           ships a form sheet that throws away what somebody typed the first
           time their thumb lands beside it. */
        disablePointerDismissal={!dismissible}
        snapPoints={snapPoints}
        snapPoint={snapPoints ? snapPoints[index] : undefined}
        onSnapPointChange={(snapPoint) => {
          if (!snapPoints || typeof snapPoint !== "number") return
          const next = snapPoints.indexOf(snapPoint)
          if (next >= 0) setStopIndex(next)
        }}
        onOpenChange={(nextOpen, details) => {
          const route = routeFor(details.reason)
          /* `disablePointerDismissal` covers the pointer and nothing else — the
             escape key and the platform's close watcher reach the primitive by
             a different path and would close an undismissable sheet. Cancelling
             here is the other half of the same promise. The close control is
             never cancelled: `dismissible` governs the ambient routes, not the
             deliberate one. */
          if (!nextOpen && !dismissible && route !== "close-control") {
            details.cancel()
            return
          }
          onOpenChange(nextOpen, route)
        }}
      >
        {/* Inside the root, because it reads the drawer's own store. It is what
            publishes `--drawer-keyboard-inset` on the viewport, which is how
            the footer stays above the software keyboard on a phone. */}
        <Drawer.VirtualKeyboardProvider>
          <Drawer.Portal>
            {modal ? (
              <Drawer.Backdrop
                data-slot="sheet-scrim"
                className={cn(
                  "fixed inset-0 z-50",
                  "transition-opacity duration-(--opsin-duration-base) ease-opsin-standard",
                  "data-starting-style:opacity-0 data-ending-style:opacity-0",
                )}
              >
                {/* The scrim rung, painted by the one component that knows how
                    to paint a rung. Doing it here by hand would mean a second
                    copy of the reduced-transparency and no-backdrop-filter
                    fallbacks, and the copy is the one that would rot. It holds
                    no content, so it is handed none — `null` is a legitimate
                    `ReactNode` and this is the one place in the system that
                    passes it. */}
                <Surface rung="scrim" className="size-full">
                  {null}
                </Surface>
              </Drawer.Backdrop>
            ) : null}

            {/* `pointer-events-none` so that a tap beside the sheet reaches the
                scrim rather than this full-screen box, which is what makes
                tap-to-dismiss work at all. Base UI's drag handlers live on this
                element and still fire, because events from the popup bubble to
                it regardless of what its own pointer-events say. */}
            <Drawer.Viewport
              className={cn(
                "pointer-events-none fixed inset-0 z-50 flex items-end justify-center",
                /* Present only while a software keyboard is up, and 0 otherwise.
                   Padding on the viewport rather than a margin on the sheet, so
                   the sheet's own max height shrinks with it and the footer is
                   pushed up instead of being covered. */
                "pb-(--drawer-keyboard-inset,0px)",
              )}
            >
              <Drawer.Popup
                data-slot="sheet-container"
                className={cn(
                  "pointer-events-auto flex w-full max-h-full flex-col overflow-hidden",
                  "rounded-t-opsin-xl [corner-shape:var(--opsin-corner-shape)]",
                  RESTING_TRANSFORM,
                  OFFSCREEN_TRANSFORM,
                  SLIDE,
                  FOCUS_RING,
                  /* A sheet with snap points has to be as tall as its tallest
                     one, because a snap point is an offset from the popup's own
                     height and cannot exceed it. A content-sized sheet must NOT
                     be, or it would stop being content-sized. */
                  snapPoints ? "h-full" : null,
                  className,
                )}
              >
                <Surface
                  rung="sheet"
                  className={cn(
                    SURFACE_LAYOUT,
                    "rounded-[inherit]",
                    /* Safe-area insets as padding INSIDE the surface, never as
                       a margin outside it: the material has to reach the edge
                       of the display, and only the content has to stay clear of
                       the notch and the home indicator. */
                    "pb-(--opsin-safe-bottom) pl-(--opsin-safe-left) pr-(--opsin-safe-right)",
                  )}
                >
                  {canChangeDetent ? (
                    /* THE GESTURE'S CONTROL, not an ornament. Drag-between-
                       detents does not exist for a keyboard user, a switch
                       user, or anybody whose grip makes a precise drag
                       unreliable, and the page's rule is that every gesture
                       has one. The grabber is the control: the same bar, at a
                       44pt target, that says in words which height it moves
                       to. */
                    <button
                      type="button"
                      data-slot="sheet-grabber"
                      onClick={() =>
                        setStopIndex((current) => (current + 1) % stops.length)
                      }
                      className={cn(
                        "flex min-h-(--opsin-target-minimum) w-full shrink-0 items-center justify-center",
                        FOCUS_RING,
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="h-opsin-1 w-opsin-10 rounded-full bg-border"
                      />
                      <span className="sr-only">
                        Change the sheet height to {DETENT_WORD[nextStop]}
                      </span>
                    </button>
                  ) : (
                    /* One detent, so there is nothing to move between and the
                       bar is decorative. It stays because it is what tells a
                       reader the sheet can be pulled down at all — and the
                       control for THAT gesture is the close button below, which
                       is why it is never optional. */
                    <div
                      data-slot="sheet-grabber"
                      aria-hidden="true"
                      className="flex shrink-0 items-center justify-center pt-opsin-2 pb-opsin-1"
                    >
                      <span className="h-opsin-1 w-opsin-10 rounded-full bg-border" />
                    </div>
                  )}

                  <div
                    data-slot="sheet-header"
                    className="flex shrink-0 items-start justify-between gap-opsin-4 px-opsin-5 pt-opsin-2 pb-opsin-2"
                  >
                    {/* Renders an `<h2>`, and Base UI points the popup's
                        `aria-labelledby` at it. The level is fixed because a
                        modal surface starts its own outline; it is not part of
                        the page's. */}
                    <Drawer.Title
                      data-slot="sheet-title"
                      className="m-0 text-opsin-title3"
                    >
                      {title}
                    </Drawer.Title>

                    {/* ALWAYS PRESENT. It is the control for drag-to-dismiss,
                        the only exit a keyboard or switch user has, and the one
                        route `dismissible={false}` does not cancel. The word is
                        visible rather than hidden behind the glyph: an icon
                        with an invisible name is a control a voice-control user
                        cannot say, and this system's readers are laypeople
                        reading about their own health. */}
                    <Drawer.Close
                      data-slot="sheet-close"
                      className={cn(
                        "inline-flex min-h-(--opsin-target-minimum) shrink-0 items-center gap-opsin-1",
                        "rounded-opsin-sm px-opsin-2 text-opsin-footnote text-muted-foreground",
                        "hover:text-foreground",
                        FOCUS_RING,
                      )}
                    >
                      <X aria-hidden="true" className="size-[1em] shrink-0" />
                      Close
                    </Drawer.Close>
                  </div>

                  {children}

                  {footer ? (
                    <div
                      data-slot="sheet-footer"
                      className="flex shrink-0 flex-wrap items-center gap-opsin-2 border-t border-border px-opsin-5 pt-opsin-3 pb-opsin-3"
                    >
                      {footer}
                    </div>
                  ) : null}
                </Surface>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.VirtualKeyboardProvider>
      </Drawer.Root>
    </SheetDepth.Provider>
  )
}

export interface SheetContentProps {
  /** Everything that scrolls. */
  children: ReactNode
  /**
   * Merged onto the scrolling region. The region's own classes win where they
   * conflict, and the two that must not be overridden are the ones that make it
   * a scroll boundary at all.
   */
  className?: string
}

/**
 * The scrolling region, and the one part of a Sheet that is a real export.
 *
 * It is an export because the consumer supplies its content and no prop could
 * carry it: a sheet may hold something above or below the scrolling area, and
 * only the caller knows which of the things they are putting in should move
 * when the rest does.
 *
 * It is also the element Base UI looks for. `Drawer.Content` stamps
 * `data-drawer-content`, and the drawer's own pointer handling treats a touch
 * that begins inside it as a scroll rather than a swipe. That is what stops a
 * flick at the top of a scrolled list from dismissing the sheet, and it is why
 * `overscroll-contain` sits beside it: one stops the sheet from being dragged,
 * the other stops the page behind from being scrolled.
 */
export function SheetContent({ children, className }: SheetContentProps) {
  return (
    <Drawer.Content
      data-slot="sheet-content"
      className={cn(
        "min-h-0 flex-auto overflow-y-auto overscroll-contain px-opsin-5 py-opsin-2",
        className,
      )}
    >
      {children}
    </Drawer.Content>
  )
}

/* Assigned after the declaration, never `Object.assign`: the assignment keeps
   `Sheet.Content` and `SheetContent` the same function, and the declaration
   keeps the name in a stack trace. */
Sheet.Content = SheetContent

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the default sheet — one
 * content-sized detent, dismissible, modal — because that is the shape a
 * product reaches for first, and because the two things worth checking about it
 * are visible in that shape: the close control is in the header before you look
 * for it, and the action is pinned below the content rather than at the end of
 * it.
 *
 * There is not a number anywhere in it. A sheet renders no measurement of its
 * own, and a screenshot of an opsinjs demo must never be mistakable for
 * somebody's result.
 *
 * IT USES THE REAL `Button`, which is why `button` is in this component's
 * `registryDependencies` even though `Sheet` itself never imports it. A demo
 * that hand-rolled two controls would be teaching, in shipped source, that the
 * primary action at the foot of a sheet is a styled `<button>` — and it would
 * be teaching it in the one file a consumer reads first.
 */
export default function SheetDemo() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex w-full flex-col items-center gap-opsin-4 p-opsin-4">
      <p className="m-0 max-w-sm text-center text-opsin-footnote text-muted-foreground">
        The sheet covers this frame while it is open. Close it with the button
        in its header, with the escape key, or by tapping the dimmed area.
      </p>

      <Button onClick={() => setOpen(true)}>Open the example sheet</Button>

      <Sheet
        open={open}
        onOpenChange={(nextOpen) => setOpen(nextOpen)}
        title="An example sheet"
        footer={
          <Button variant="primary" fullWidth onClick={() => setOpen(false)}>
            Save the example
          </Button>
        }
      >
        <Sheet.Content>
          <p className="m-0 text-opsin-body">
            A sheet is a place the reader chose to go and can leave at any
            moment. Everything in this paragraph is here to take up room, so
            that the scrolling region has something to scroll.
          </p>
          <p className="mt-opsin-3 mb-0 text-opsin-body">
            The action below stays where it is while this text moves, which is
            the whole reason it is a footer rather than the last thing in the
            content.
          </p>
        </Sheet.Content>
      </Sheet>
    </div>
  )
}
