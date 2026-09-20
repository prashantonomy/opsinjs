"use client"

/**
 * Sheet is a panel that comes up from the bottom edge, rests at a stated
 * height, and can always be left.
 *
 * WHY THIS FILE IS `"use client"` AND SURFACE IS NOT. Surface answers every
 * question it has with a media query, so it renders once on the server and is
 * correct forever. A Sheet cannot: it holds which detent it is resting at, it
 * mounts a portal, it moves focus, and it listens for a drag. None of that has
 * a CSS answer, so the directive is a requirement rather than a convenience. It
 * is on this file rather than borrowed from Base UI, because the demo at the
 * bottom holds state of its own and a file whose demo needs `useState` is a
 * client file whatever its imports say.
 *
 * THERE IS NO `sheet` PRIMITIVE IN BASE UI 1.7.0. `@base-ui/react/drawer` is
 * the one this is built on, and the mapping is not one-to-one. Every place the
 * two vocabularies disagree is written out beside the code that resolves it,
 * because a wrapper that quietly renames a prop is a wrapper nobody can audit:
 *
 *   spec `dismissible`  ↔ Base UI `disablePointerDismissal`  (INVERTED, and
 *                         Base UI's covers the pointer only, so the escape key
 *                         and the close watcher are cancelled by hand below)
 *   spec `detents`      ↔ Base UI `snapPoints`               (fractions, pixels
 *                         or rems, and no content-sized snap point)
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
 * input "asks first", and that it does so "by the same route as a background
 * tap", which a product cannot do unless it is told which route was taken. A
 * one-argument handler is still assignable to the two-argument type, so
 * `onOpenChange={setOpen}` keeps working and a product that needs the route can
 * read it.
 *
 * WHAT IT DOES NOT DO. It mounts no live region, it announces nothing on its
 * own behalf, and it never decides that a reader has finished. It also refuses
 * to be a Dialog: there is no way to make a Sheet undismissable AND unclosable,
 * because the one modal surface with no valid way out is a question, and a
 * question is `Dialog`.
 */

import { Drawer, type DrawerRootChangeEventReason } from "@base-ui/react/drawer"
import { X } from "lucide-react"
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { isDevelopment, type Detent } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/base-lyra/ui/button"
import { Surface } from "@/registry/base-lyra/ui/surface"

/**
 * A development warning that fires once per distinct mistake rather than once
 * per render.
 *
 * Not `warnOnce` from the substrate, and the reason is the same one Surface
 * gives: `warnOnce` is keyed on a code from `tokens/errors.json`, that table has
 * no code for any of the six mistakes below, and a component may not mint one.
 * What can be borrowed is the policy. `tokens/errors.json` says a warning fires
 * once per offending call site, because a repeated identical complaint teaches
 * nothing and drowns the next one. Every one of these checks sits in the render
 * path, so the un-deduplicated version printed on every pass of an open sheet
 * and twice per pass under StrictMode; two of the six report an unnamed dialog
 * and a missing scroll boundary, which is exactly the finding a reader loses
 * when they filter the channel.
 *
 * The render path is still the right place for them. An effect would report the
 * mistake after the frame that contains it has already been painted.
 */
const warnedKeys = new Set<string>()

/**
 * Bounded, because a development session runs for days and this set is never
 * cleared. Sixteen distinct complaints means the report has been made several
 * times over; going quiet beats growing without limit.
 */
const MAX_WARNED_KEYS = 16

function warnOncePerSession(key: string, message: string): void {
  if (!isDevelopment()) return
  if (warnedKeys.has(key) || warnedKeys.size >= MAX_WARNED_KEYS) return
  warnedKeys.add(key)
  try {
    console.warn(`[opsinjs] ${message}`)
  } catch {
    /* A patched console is not a reason to take a health product down. */
  }
}

/**
 * How a close was asked for.
 *
 * Five routes rather than Base UI's nine, because the distinctions this
 * component's accessibility contract turns on are coarser than the ones the
 * primitive reports. What matters to a product is whether the reader made a
 * deliberate exit (`close-control`) or brushed against one of the ambient ones
 * (`scrim`, `escape`, `drag`). The first needs no confirmation and the other
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
function routeFor(reason: DrawerRootChangeEventReason): SheetDismissRoute {
  switch (reason) {
    case "close-press":
      return "close-control"
    case "outside-press":
      return "scrim"
    case "escape-key":
    case "close-watcher":
      return "escape"
    case "swipe":
      return "drag"
    default:
      return "other"
  }
}

/**
 * THE VALUES ABOVE ARE BASE UI'S RUNTIME STRINGS, NOT ITS CONSTANT NAMES, AND
 * THE DIFFERENCE ONCE MADE THIS COMPONENT A KEYBOARD TRAP.
 *
 * `@base-ui/react/internals/reason-parts` exports `closePress = 'close-press'`,
 * `outsidePress = 'outside-press'`, `escapeKey = 'escape-key'` and
 * `closeWatcher = 'close-watcher'`. The first version of this switch matched the
 * NAMES. Only `swipe` happens to be spelled the same in both, so every other
 * close fell through to `"other"`. Under `dismissible={false}` the handler
 * below cancels everything that is not `"close-control"`. The close control was
 * therefore cancelled along with the scrim and the escape key, and the shipped
 * example that sets `dismissible={false}` became a modal sheet with focus
 * trapped inside it and no exit at all.
 *
 * Two things follow, and the second is the one that matters.
 *
 * The parameter is typed `DrawerRootChangeEventReason` and not `string`, and
 * that is the guard rather than the tidiness. `string` is what made the original
 * mistake legal: a `case` label that can never match is a perfectly good
 * comparison against a `string`, and the compiler had nothing to object to. Typed
 * as the union, every label above has to be a member of it, so the day Base UI
 * renames one this file stops compiling instead of quietly reclassifying a close.
 * The `default` branch stays regardless: this file ships as source into
 * JavaScript projects and into whatever version of Base UI the consumer resolves,
 * where the type is advice.
 *
 * `KNOWN_REASONS` is the same guard from the other side. It lists every reason
 * the primitive declares, so a reason that reaches this handler and is NOT in
 * the declared union is a development warning. Four of the nine are recognised and
 * deliberately map to `"other"`: `trigger-press` (this API has no trigger),
 * `focus-out`, `imperative-action` and `none` are all closes the sheet cannot
 * attribute to anything a reader did, which is what `"other"` means. Warning on
 * those would be crying wolf; the warning exists for the case that actually
 * happened once, which is a reason nobody here has heard of.
 *
 * And the cancellation is allow-listed rather than deny-listed. It cancels only
 * the three ambient routes it positively recognises. A route it does not
 * understand CLOSES the sheet, because the failure modes are not symmetrical:
 * closing a sheet somebody wanted to keep loses a form, and refusing to close a
 * modal surface loses the reader.
 */
const KNOWN_REASONS = new Set<DrawerRootChangeEventReason>([
  "close-press",
  "outside-press",
  "escape-key",
  "close-watcher",
  "swipe",
  "trigger-press",
  "focus-out",
  "imperative-action",
  "none",
])

/**
 * The two detents that have a numeric answer, as fractions of the viewport.
 *
 * `content` is deliberately absent and the reason is mechanical rather than
 * aesthetic. Base UI resolves every snap point against the popup's own measured
 * height and clamps it there (`useDrawerSnapPoints`: `offset = popupHeight -
 * clampedHeight`), so a sheet that can reach `full` has to be viewport-tall.
 * Once it is, its natural height IS the viewport and there is no content height
 * left to snap to. The two requirements are not satisfiable at the same
 * time, so `content` is supported as the only detent, where it needs no snap
 * point at all: the popup takes its own height and the browser lays it out.
 */
const VIEWPORT_FRACTION: Record<"half" | "full", number> = {
  half: 0.5,
  full: 1,
}

/**
 * What each detent is called when the grabber has to name the height it moves
 * to on the next press.
 *
 * Plain words rather than the API's own values: the reader of the accessible
 * name is a person using the product, not a person reading this file, and
 * "half" on its own is an adjective with no noun. Each phrase has to complete
 * the sentence "Make the sheet ...", so "full" reads as "full screen" rather
 * than "the full screen", which does not.
 */
const DETENT_WORD: Record<Detent, string> = {
  content: "fit the content",
  half: "half the screen",
  full: "full screen",
}

/**
 * The default, and the reason it is the smallest of the three.
 *
 * Declared at module scope rather than inline in the parameter list so that the
 * array identity is stable across renders. An inline `= ["content"]` is a new
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
 * The id of the element holding the sheet's title, or `undefined` outside a
 * Sheet.
 *
 * It exists so `Sheet.Content` can name itself without inventing a string.
 * The scrolling region is a focus stop (see below) and a nameless stop is a
 * stop a screen-reader user arrives at with no idea why; pointing its
 * `aria-labelledby` at the title the sheet already has reuses a name the
 * product wrote, in the product's own language, rather than adding a third
 * English string to the two this component already ships and already declares
 * as a translation gap.
 *
 * `undefined` rather than a generated fallback when there is no provider,
 * because `aria-labelledby` pointing at an id that does not exist is worse than
 * no `aria-labelledby` at all: the name resolves to the empty string and the
 * region goes from unnamed to falsely named.
 */
const SheetTitleId = createContext<string | undefined>(undefined)

/**
 * How `Sheet.Content` tells the pinned footer that its text runs past the fold,
 * or `undefined` outside a Sheet.
 *
 * A pinned footer is the right answer for an action bar and the wrong one for a
 * surface whose text is the point: the two decision controls are on screen from
 * the first frame while the consequence and withdrawal sentences are still below
 * the fold, so a reader can answer before they have read what the answer costs.
 * The honest repair, while the footer stays pinned, is to stop the sheet from
 * looking finished when it is not. The scroller reports whether more content
 * sits below its bottom edge and the footer draws a scroll edge while it does,
 * so the surface reads as unfinished until the reader reaches the end. This is a
 * scroll edge and never a status: it carries no clinical level and no colour
 * that means anything but "there is more".
 *
 * `undefined` when there is no provider, so a `Sheet.Content` rendered on its
 * own is a plain scroller that reports to nobody.
 */
const SheetOverflowReport = createContext<
  ((below: boolean) => void) | undefined
>(undefined)

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
 * and the first one is where the sheet opens. Duplicates are dropped silently.
 * Two identical stops are not a mistake worth a warning, and Base UI
 * deduplicates resolved heights within a pixel anyway.
 */
function resolveDetents(detents: Detent[]): Detent[] {
  const stops: Detent[] = []

  for (const detent of detents) {
    if (!isDetent(detent)) {
      warnOncePerSession(
        `detent:${String(detent)}`,
        `<Sheet> was given the detent "${String(detent)}", which is not one of ` +
          "content, half or full. It was ignored.",
      )
      continue
    }
    if (!stops.includes(detent)) stops.push(detent)
  }

  if (stops.length === 0) {
    warnOncePerSession(
      "detents:empty",
      "<Sheet> was given an empty `detents` array. A sheet with no rest " +
        'position has no height, so it fell back to ["content"].',
    )
    return DEFAULT_DETENTS
  }

  if (stops.length > 1 && stops.includes("content")) {
    const measured = stops.filter((stop) => stop !== "content")
    warnOncePerSession(
      `detents:content-beside:${measured.join("+")}`,
      "<Sheet> was given `content` alongside another detent. A content-sized " +
        "stop and a viewport-sized stop cannot both exist: a sheet that can " +
        "reach half or full is as tall as the viewport, and a snap point is " +
        "resolved against the sheet's own height. `content` was dropped; the " +
        `sheet rests at ${measured.join(" and ")}.`,
    )
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
 * Reserve the active detent's offset inside the popup, as padding rather than
 * height.
 *
 * Base UI publishes the active stop as `--drawer-snap-point-offset` and slides
 * the whole popup down by it (see `RESTING_TRANSFORM`). The popup's own box is
 * still the full viewport, because a snap point is resolved against the popup's
 * measured height and `snapPoints` forces `h-full`. So at any detent below the
 * top one, the lower part of that full-height box, and with it the pinned
 * footer, sits under the bottom edge of the screen. Padding the bottom of the
 * popup by the same offset shrinks the laid-out column to exactly the region
 * that is on screen: with `box-sizing: border-box` the content box becomes the
 * full height minus the offset, the `flex-auto` Surface fills that, the footer
 * lands on the visible bottom edge, and `Sheet.Content` finally has a bounded
 * height to scroll its last row into.
 *
 * This must stay a padding and must NOT become a height on the popup. Shrinking
 * the popup changes the height Base UI derives every offset from, so the offset
 * and the height would chase each other on every detent change.
 */
const SNAP_POINT_INSET = "pb-(--drawer-snap-point-offset,0px)"

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
 * No `motion-reduce:transition-none` here, and the reason is a correction. An
 * earlier version of this file removed the transition outright under
 * `prefers-reduced-motion` and argued the case in a comment. The argument was
 * half right and the conclusion was wrong, and the page that settles it names
 * this component by name: `health/motion-in-health-ui.mdx` lists `sheet` in its
 * `implements`, its rule 5 says the reduced-motion fallback "is not 'no
 * animation' by default. It is an instant, complete, equally informative
 * state", and its Do/Dont pair is written about a sheet: DO "show the sheet in
 * place with a crossfade of opacity only, retaining every affordance", DONT
 * "remove the transition and let a modal appear with no change of context at
 * all. Reduced motion means less movement, not less orientation." A surface
 * that teleports onto the screen is harder to follow than one that arrives
 * quickly, and the reader most likely to have reduced motion on is the reader
 * least able to afford a surface appearing from nowhere.
 *
 * What was right in the old argument is that 120ms of full-height translation
 * is still a full-height translation. So the distance goes and the transition
 * stays, which is `REDUCED_MOTION_CROSSFADE` below.
 *
 * `SLIDE_TIMING` is the duration and the easing on their own. It is split out
 * so the snap-points branch can spend them on a transition of two properties,
 * transform and padding-bottom together, without also taking
 * `transition-transform`. A branch that carried both `transition-transform` and
 * its own `transition-property` would leave which one wins to source order;
 * giving the branch the timing but not the property setter removes that contest
 * at the source rather than ranking it. The one-detent branch takes the whole
 * `SLIDE`, which is `transition-transform` on that same timing.
 */
const SLIDE_TIMING =
  "duration-(--opsin-duration-spring-sheet) ease-opsin-spring-sheet"

const SLIDE = `transition-transform ${SLIDE_TIMING}`

/**
 * The reduced-motion answer: the same arrival, in place, as opacity.
 *
 * Three overrides, all of them under `motion-reduce`, and all of them ordered
 * after their unprefixed twins at the same specificity so the media query wins
 * on source order. The ordering was verified by compiling these exact
 * candidates against the pinned tailwindcss 4.3.3 rather than assumed.
 *
 *   1. The transitioned property becomes `opacity` instead of `transform`.
 *   2. The starting and ending transforms become the RESTING one rather than
 *      `translateY(100%)`, so the sheet is already at its detent for the whole
 *      of the transition and travels no distance at all. The value is written
 *      out twice rather than interpolated from `RESTING_TRANSFORM`, because
 *      Tailwind reads class names out of source as literal strings and a
 *      template literal generates no CSS.
 *   3. Opacity runs 0 → 1 on the way in and back on the way out.
 *
 * The duration and easing are NOT overridden, and that is the division of
 * labour this file keeps. The token layer already declares this transition's
 * reduced-motion fallback. `app/tokens.generated.css` collapses
 * `--opsin-duration-spring-sheet` to 120ms and `--opsin-ease-spring-sheet` to
 * `linear` under the query. The crossfade is therefore 120ms and flat without
 * this file restating either. What the token layer cannot know is the DISTANCE,
 * because distance is not a token; that is the component's own to answer, and
 * it is the only thing answered here.
 *
 * The scrim is deliberately left alone for the same reason. Its fade is already
 * opacity over `--opsin-duration-base`, which `app/product.css` collapses to
 * 1ms under the query, so it has no distance to remove and its declared
 * fallback is complete.
 */
const REDUCED_MOTION_CROSSFADE = [
  "motion-reduce:transition-opacity",
  "motion-reduce:data-starting-style:[transform:translateY(calc(var(--drawer-snap-point-offset,0px)_+_var(--drawer-swipe-movement-y,0px)))]",
  "motion-reduce:data-ending-style:[transform:translateY(calc(var(--drawer-snap-point-offset,0px)_+_var(--drawer-swipe-movement-y,0px)))]",
  "motion-reduce:data-starting-style:opacity-0",
  "motion-reduce:data-ending-style:opacity-0",
].join(" ")

/**
 * How the Surface inside the popup is told to lay its content out.
 *
 * Surface owns the class list on its own content wrapper and takes no prop for
 * it, so a composing component reaches it by its `data-slot`. That is the
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

/**
 * The container's focus ring, drawn inside its own edge rather than outside it.
 *
 * The sheet container is full width and pinned to the bottom edge, so a ring
 * drawn 2px outside its box falls off screen on three sides and the reader is
 * left with a 2px line along the top that reads as a rendering fault rather
 * than as a focus indicator. A negative offset draws the whole ring just inside
 * the sheet, where all four sides stay on screen. The controls inside the sheet
 * keep `FOCUS_RING`, because an outset ring is right for a control that has
 * room around it.
 */
const CONTAINER_FOCUS_RING =
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"

export interface SheetProps {
  /**
   * Whether the sheet is on screen. Required and controlled: a modal surface
   * that owned its own visibility would be a surface a product could not close
   * when the data underneath it changed.
   */
  open: boolean
  /**
   * Called when the sheet asks to open or close. The second argument says which
   * route was taken: `close-control` for the header's close button,
   * `scrim` for a tap on the background, `escape` for the escape key or the
   * platform's back gesture, `drag` for a swipe down, and `other` for anything
   * else, including a close the product asked for itself.
   *
   * The sheet does not close itself: `open` is the only thing that closes it.
   * That is what makes "ask before discarding unsaved input" possible. Leave
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
   * Traps focus, marks the page behind `aria-hidden`, and lets the scrim stop
   * a pointer. Be exact about the mechanism: the primitive marks everything
   * outside the portal `aria-hidden="true"` rather than setting the HTML
   * `inert` attribute, so the page behind is hidden and unreachable but it is
   * NOT inert. The difference is observable, because focus moved
   * programmatically from behind the sheet takes and keeps focus on a control
   * the accessibility tree has just been told is not there. A modal sheet is
   * also the only state in which the sheet takes focus on appearance:
   * `modal={false}` does none of this, so it opens where the reader can see it
   * and leaves the caret exactly where they left it.
   *
   * A non-modal sheet has no accessibility story on this page beyond that
   * sentence. It is pinned to the bottom edge while the page behind stays
   * focusable, which is the obscured-focus shape WCAG 2.4.11 is about, and
   * nothing here has been checked against it.
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
   * Merged onto the sheet's container, and last in the list, so it wins. The
   * sheet is full width on a phone and no wider than the comfortable body
   * measure above the `sm` breakpoint, because the system's own doctrine caps
   * the reading measure on every surface. Left uncapped, a 1024px sheet puts
   * roughly 120 characters on a line and turns a footer action into a 984px
   * bar. The cap is a default rather than a lock: a product that wants the
   * sheet wider or narrower on a large display sets a `max-w` here and this
   * class overrides the default.
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
  /* Supplied to Drawer.Title rather than read back off it. Base UI's DialogTitle
     takes an `id` and registers whatever it is given as the popup's
     `titleElementId`, so one id ends up on the heading, in the popup's
     `aria-labelledby`, and in the scrolling region's. That is three references
     from one source. */
  const titleId = useId()
  const stops = resolveDetents(detents)
  const snapPoints = toSnapPoints(stops)
  const [stopIndex, setStopIndex] = useState(0)
  const [openLastRender, setOpenLastRender] = useState(open)
  /* Set by Sheet.Content while its text runs past the fold, read by the footer.
     The setter's identity is stable, so the observer in Sheet.Content lists it
     as a dependency without re-attaching on every render. */
  const [overflowBelow, setOverflowBelow] = useState(false)
  /* The popup element, so a refused dismissal can put focus back inside the
     surface. Base UI refuses the close but leaves keyboard focus wherever the
     refused gesture dropped it, which for a scrim press is the document body:
     the reader is then focused outside a modal whose siblings are marked
     aria-hidden, and a screen reader reads nothing until the next Tab. */
  const popupRef = useRef<HTMLDivElement | null>(null)

  /* Back to the first detent on every open. A sheet that reopened at whatever
     height the reader last dragged it to would be a sheet whose size depends on
     something they did minutes ago and cannot see; "the first is where it
     opens" is only true if it is true every time.

     Adjusted during the render that notices the change rather than in an
     effect, which is React's own answer for state derived from a prop: an
     effect would commit the sheet at the old detent, paint it, and then correct
     it. That is one frame of the sheet at the height it was left at last time,
     on the way in. */
  if (openLastRender !== open) {
    setOpenLastRender(open)
    if (open) setStopIndex(0)
  }

  if (depth > 0) {
    warnOncePerSession(
      `nested:${depth}`,
      "A <Sheet> is nested inside another <Sheet>. Two stacked modal surfaces " +
        "produce a focus order nobody can predict and an escape key with two " +
        "plausible meanings. Put the second task on the first sheet, or make " +
        "it a screen.",
    )
  }
  /* `typeof` first because this file ships as source into JavaScript projects,
     where `title: string` is advice and `title.trim()` on whatever arrived is a
     crash rather than a warning. */
  if (typeof title !== "string" || title.trim() === "") {
    warnOncePerSession(
      "title:empty",
      "<Sheet> was given an empty `title`. It is the accessible name, and " +
        'without it the sheet is announced as "dialog" and nothing else. There ' +
        "is no honest default; name the task the reader came here to do.",
    )
  }
  if (open && !hasContentSlot(children)) {
    warnOncePerSession(
      `content:missing:${title}`,
      "<Sheet> has no <Sheet.Content> among its direct children. That element " +
        "is the scroll boundary: without it nothing inside the sheet scrolls, " +
        "and a flick meant to scroll is read as a drag and dismisses the " +
        "sheet. This check reads direct children only, so a Sheet.Content " +
        "wrapped in another element is invisible to it.",
    )
  }

  const index = Math.min(stopIndex, stops.length - 1)
  const canChangeDetent = stops.length > 1
  /* The height the grabber moves to on the next press. Its accessible name is
     built from this, not from the current height, so the name says what the
     button does. */
  const nextStop = stops[(index + 1) % stops.length]

  return (
    <SheetDepth.Provider value={depth + 1}>
      <SheetTitleId.Provider value={titleId}>
       <SheetOverflowReport.Provider value={setOverflowBelow}>
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

            if (!KNOWN_REASONS.has(details.reason)) {
              warnOncePerSession(
                `reason:${details.reason}`,
                `Sheet received the dismissal reason "${details.reason}", which ` +
                  "is not one of the nine @base-ui/react 1.7.0 declares. It was " +
                  'reported to onOpenChange as "other" and the sheet was allowed ' +
                  "to close. If Base UI has renamed or added a reason, routeFor " +
                  "and KNOWN_REASONS in sheet.tsx are the two places to fix. See " +
                  "the note above them.",
              )
            }

            /* `disablePointerDismissal` covers the pointer and nothing else. The
               escape key and the platform's close watcher reach the primitive by
               a different path and would close an undismissable sheet. Cancelling
               here is the other half of the same promise.

               ALLOW-LISTED, NOT DENY-LISTED. Only the three ambient routes are
               cancelled. The close control is never cancelled, because
               `dismissible` governs the routes a reader takes by accident and not
               the one they take on purpose. Neither is a route this component
               failed to recognise, because refusing to close a modal surface on
               an unknown signal is how it becomes a trap.

               AND A REFUSAL PUTS FOCUS BACK. Base UI refuses the close but does
               not restore focus, so a refused Escape does the nothing the spec
               defines for it and leaves the reader where they were, which is fine
               only while they were already inside the sheet. Focusing the popup
               re-announces the sheet's title, so a refused Escape says "still
               here" rather than saying nothing at all. The scrim route is caught
               on the backdrop itself instead of here, because `dismissible={false}`
               tells the primitive to ignore the scrim pointer entirely and this
               branch never runs for it. */
            const ambient = route === "scrim" || route === "escape" || route === "drag"
            if (!nextOpen && !dismissible && ambient) {
              details.cancel()
              popupRef.current?.focus({ preventScroll: true })
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
                  /* On an undismissable sheet the primitive ignores the scrim
                     pointer, so onOpenChange never fires and the refusal branch
                     above never runs. The press still lands on the backdrop and
                     blurs the reader onto the document body. Preventing the
                     default on pointerdown stops the blur, and focusing the popup
                     on click puts them back inside the surface either way. Both
                     are attached only when the sheet is undismissable; a
                     dismissible sheet closes on a scrim press and wants neither. */
                  onPointerDown={
                    dismissible
                      ? undefined
                      : (event) => {
                          event.preventDefault()
                        }
                  }
                  onClick={
                    dismissible
                      ? undefined
                      : () => {
                          popupRef.current?.focus({ preventScroll: true })
                        }
                  }
                  className={cn(
                    "fixed inset-0 z-50",
                    "transition-opacity duration-(--opsin-duration-base) ease-opsin-standard",
                    "data-starting-style:opacity-0 data-ending-style:opacity-0",
                    /* The scrim dims by painting a tint over the page: the
                       surface-scrim layer sets background-color at a partial
                       opacity. Under `forced-colors: active` the browser
                       replaces that background-color with a system colour and
                       the dimming is gone, so the page behind would read at full
                       strength through what is meant to be a modal. Painting the
                       backdrop itself an opaque Canvas is the standard forced-
                       colours answer: it replaces the page behind with the
                       system background, which is what tells a forced-colours
                       reader that a modal has taken the screen. The panel's own
                       edge is not drawn here; it is Surface's job, answered in
                       surface.tsx where the sheet rung draws an outline that
                       forced colours keeps, so it is not duplicated on this
                       element. */
                    "forced-colors:bg-[Canvas]",
                  )}
                >
                  {/* The scrim rung, painted by the one component that knows how
                      to paint a rung. Doing it here by hand would mean a second
                      copy of the reduced-transparency and no-backdrop-filter
                      fallbacks, and the copy is the one that would rot. It holds
                      no content, so it is handed none. `null` is a legitimate
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
                  ref={popupRef}
                  data-slot="sheet-container"
                  /* A MODAL SURFACE MAY TAKE FOCUS; A NON-MODAL ONE MAY NOT.
                     Base UI resolves initial focus without consulting `modal`.
                     The relevant line in DrawerPopup is `resolvedInitialFocus =
                     initialFocus === undefined ? popupRef : initialFocus`. Left
                     alone, a `modal={false}` sheet pulls the reader out of
                     whatever they were doing on the page it deliberately left
                     reachable. The
                     repository's focus doctrine allows a component to move focus
                     on appearance only into a modal surface, so the non-modal
                     path declines it explicitly.

                     `finalFocus` is deliberately NOT set alongside it. Its
                     default already returns focus only when focus was inside the
                     sheet at the moment it closed (FloatingFocusManager gates the
                     return on `isFocusInsideFloatingTree` for a boolean
                     `returnFocus`), so a non-modal sheet that never took focus
                     never gives any back, and one the reader tabbed into still
                     hands it back where they came from. */
                  initialFocus={modal ? undefined : false}
                  className={cn(
                    "pointer-events-auto flex w-full max-h-full flex-col overflow-hidden",
                    /* Cap the reading measure above the phone. `w-full` still
                       wins below `sm`, so the phone case the file was built for
                       is untouched, and above it the sheet centres itself in the
                       viewport (Drawer.Viewport carries `justify-center`) at the
                       comfortable body measure. The literal fallback rides beside
                       the token because a consumer who copies this file in with
                       `shadcn add` does not get this repository's product
                       stylesheet, and a bare custom-property read would resolve
                       to nothing and drop the cap silently. `className` stays last
                       in this list, so a product overrides the measure with one
                       class. */
                    "sm:max-w-(--opsin-measure-comfortable,66ch)",
                    "rounded-t-opsin-xl [corner-shape:var(--opsin-corner-shape)]",
                    RESTING_TRANSFORM,
                    OFFSCREEN_TRANSFORM,
                    REDUCED_MOTION_CROSSFADE,
                    CONTAINER_FOCUS_RING,
                    /* A sheet with snap points has to be as tall as its tallest
                       one, because a snap point is an offset from the popup's own
                       height and cannot exceed it. A content-sized sheet must NOT
                       be, or it would stop being content-sized. The snap-points
                       branch carries `SNAP_POINT_INSET`, which pads back the
                       active detent's offset so the footer and the scroll region
                       stay on screen at every detent (see the constant); it rides
                       with `h-full` because it is only meaningful once the popup
                       is full height. The branch also owns the transition on this
                       surface: it spends `SLIDE_TIMING` on a two-property
                       transition of transform and padding-bottom, and it does NOT
                       take `SLIDE`, so `transition-transform` is never on the
                       element to contest that property setter. When motion is allowed
                       the `motion-safe` override runs transform and padding-bottom
                       together on the sheet spring, so the footer rides up on
                       expand; under reduced motion that override is inert and
                       `REDUCED_MOTION_CROSSFADE` puts the transition on opacity
                       with nothing on this branch to contest it, so the inset
                       settles instantly. Because `motion-safe` and `motion-reduce`
                       never both match and this branch names no other
                       transition-property, which property transitions is fixed by
                       the media query rather than by source order. The one-detent
                       case takes `SLIDE` instead, which is `transition-transform`
                       on the same timing. */
                    snapPoints
                      ? cn(
                          "h-full",
                          SNAP_POINT_INSET,
                          SLIDE_TIMING,
                          "motion-safe:[transition-property:transform,padding-bottom]",
                        )
                      : SLIDE,
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
                         44pt target, that says in words how tall the sheet is.
                         The wrapper exists to centre it; see the width note
                         below for why it is not the whole row. */
                      <div className="flex shrink-0 items-center justify-center">
                        <button
                          type="button"
                          data-slot="sheet-grabber"
                          /* NAMES WHAT THE PRESS DOES, NOT THE CURRENT HEIGHT,
                             which is what a button's name is for. With more than
                             one detent the list is always exactly half and full,
                             because `content` cannot be combined with either, so
                             naming the destination states the current height by
                             implication: a button that offers to make the sheet
                             full is a sheet that is half now.

                             No `aria-expanded`, and its absence is the finding.
                             A half-screen sheet announced as `collapsed` applies
                             the disclosure vocabulary to something that is not a
                             disclosure, and it describes the current height a
                             second time in a word that does not fit it. What is
                             still true and unanswered: nothing announces the new
                             height after the press, because the component mounts
                             no live region on purpose, so the name the reader
                             re-reads on the control they are still focused on is
                             the only confirmation they get. */
                          onClick={() =>
                            setStopIndex((current) => (current + 1) % stops.length)
                          }
                          className={cn(
                            "flex min-h-(--opsin-target-minimum,2.75rem) shrink-0 items-center justify-center",
                            /* NOT `w-full`, and the width is a target-separation
                               fix. A full-width 44pt band sits directly above the
                               header, whose `pt-opsin-2` is exactly
                               `--opsin-target-separation` and no more, so a miss
                               on Close landed on the grabber and resized the
                               sheet instead of leaving it. The reader whose grip
                               makes precision unreliable is exactly the reader
                               this button exists for. Centred and only as wide as
                               it needs to be, it is nowhere near the close
                               control, which sits at the opposite end of the row
                               below. Dragging is unaffected: Base UI reads the
                               drag off the popup, not off this element. */
                            "px-opsin-8",
                            FOCUS_RING,
                          )}
                        >
                          {/* THE VISIBLE BOUNDARY OF A REAL CONTROL, not a
                              divider. With more than one detent this bar is the
                              only visible part of the button, so WCAG 1.4.11's
                              3:1 non-text floor reaches it. `bg-border` does not:
                              --border is `oklch(0.905 0.005 255)` in light and
                              `oklch(1 0 0 / 0.11)` over neutral-900 in dark, both
                              of which vanish against the sheet rung's near-white
                              material at roughly 1.3:1. `--muted-foreground` is
                              the nearest published role that clears 3:1 in both
                              themes (neutral-600 in light, neutral-300 in dark),
                              and range-bar already paints a hairline with it. The
                              height stays h-opsin-1 because no thicker bar has a
                              token and this file has no raw pixel value to reach
                              for. The decorative twin below takes the same token
                              so the two branches cannot drift. */}
                          <span
                            aria-hidden="true"
                            className="h-opsin-1 w-opsin-10 rounded-full bg-muted-foreground"
                          />
                          <span className="sr-only">
                            Make the sheet {DETENT_WORD[nextStop]}
                          </span>
                        </button>
                      </div>
                    ) : (
                      /* One detent, so there is nothing to move between and the
                         bar is decorative. It stays because it is what tells a
                         reader the sheet can be pulled down at all. The control
                         for THAT gesture is the close button below, which is why
                         it is never optional. */
                      <div
                        data-slot="sheet-grabber"
                        aria-hidden="true"
                        className="flex shrink-0 items-center justify-center pt-opsin-2 pb-opsin-1"
                      >
                        <span className="h-opsin-1 w-opsin-10 rounded-full bg-muted-foreground" />
                      </div>
                    )}

                    {/* The sheet insets use the fixed px-opsin-5 token here and
                        in the content and footer below, deliberately, so they
                        hold 20px at every [data-density] setting rather than
                        tracking the density-scaled p-5 that Card uses. A modal
                        takes its measure from the viewport, not from the
                        surrounding document, and a reader who asks for a denser
                        list has not asked to shrink the surface that pins their
                        only exit. Dialog states the same reason for the same
                        choice at dialog.tsx around its dialog-header; the two
                        modal surfaces stay off the scaled scale together. */}
                    <div
                      data-slot="sheet-header"
                      className="flex shrink-0 items-start justify-between gap-opsin-4 px-opsin-5 pt-opsin-2 pb-opsin-2"
                    >
                      {/* Renders an `<h2>`, and Base UI points the popup's
                          `aria-labelledby` at it. The level is fixed because a
                          modal surface starts its own outline; it is not part of
                          the page's. */}
                      <Drawer.Title
                        id={titleId}
                        data-slot="sheet-title"
                        /* Two jobs in this class list. `min-w-0 break-words` is
                           not decoration: the popup is `overflow-hidden` for the
                           top corner radius and this is a flex item, whose
                           default `min-width: auto` refuses to shrink below its
                           min-content width. So at 200% root font size a single
                           long token (a compound word, a medication name) pushed
                           past the available inline size and was clipped with no
                           scrollbar, which WCAG 1.4.4 counts as loss of content.
                           The close control's `shrink-0` is correct and stays.

                           `flex min-h-(--opsin-target-minimum,2.75rem)
                           items-center` centres a single-line title against the
                           close control, which is 44px tall with its text
                           centred, so the two no longer sit on two baselines
                           about 9px apart. The header keeps `items-start` so a
                           title that wraps at 200% text still grows the box
                           downward from the same top edge with Close beside its
                           first line, which is what `items-start` was there for.
                           The `2.75rem` fallback rides inside the var() for the
                           reason dialog.tsx and field.tsx spell out: this file's
                           product stylesheet does not travel through `shadcn
                           add`, and a bare reference to an undeclared property is
                           invalid at computed-value time, so `min-height` would
                           revert to `auto` and the centring would silently vanish.
                           `flex` makes the title's text a single anonymous flex
                           item, which is harmless for a string; a title carrying
                           rich children is not a supported shape, because
                           SheetProps.title is typed `string`. */
                        className="m-0 flex min-h-(--opsin-target-minimum,2.75rem) min-w-0 items-center break-words text-opsin-title3"
                      >
                        {title}
                      </Drawer.Title>

                      {/* ALWAYS PRESENT. It is the control for drag-to-dismiss,
                          the only exit a keyboard or switch user has, and the one
                          route `dismissible={false}` does not cancel. The word is
                          visible rather than hidden behind the glyph, and set at a
                          step a reader can find rather than at the provenance
                          footnote: an icon with an invisible name is a control a
                          voice-control user cannot say, and this system's readers
                          are laypeople reading about their own health. */}
                      <Drawer.Close
                        data-slot="sheet-close"
                        /* JOINED, NOT MERGED, and the join is the fix rather
                           than a style. `cn` is `twMerge(clsx(…))` and
                           tailwind-merge is unconfigured: it has never been told
                           that `--text-opsin-*` is a font-size namespace, so it
                           files `text-opsin-callout` and `text-foreground` in the
                           SAME conflict group and keeps only the later one. That
                           silently cost this control its type step, its leading
                           and its tracking, verified against the pinned
                           tailwind-merge. The two utilities set different CSS
                           properties, so passing both through applies both.
                           `score-dial.tsx` keeps `LABEL_ROW` and `STATUS_ROW`
                           whole for exactly this reason and says so; there is no
                           caller `className` on this control, so nothing is lost
                           by not merging. The real repair belongs in
                           `lib/utils.ts` and is reported upward.

                           THE STEP AND THE ROLE READ AS A CONTROL, NOT AS
                           PROVENANCE. This is the only guaranteed exit from a
                           form sheet, the one route `dismissible={false}` never
                           removes, so an anxious reader must be able to find it
                           at a glance. It is set at the `callout` step in the
                           full `foreground` role rather than at `footnote` in a
                           muted grey, whose declared use is provenance and which
                           made this word the smallest, lowest-contrast thing on
                           the surface. `callout` (16px) rather than `headline`
                           because `headline` is Button's step and the close
                           control must stay quieter than the footer's primary
                           action; the hover feedback is a `muted` background
                           rather than an ink change, since the ink is already the
                           foreground. Keep it quieter than the footer action and
                           do not raise it to Button's step. */
                        className={
                          "inline-flex min-h-(--opsin-target-minimum,2.75rem) shrink-0 items-center gap-opsin-1 " +
                          "rounded-opsin-sm px-opsin-2 text-opsin-callout text-foreground " +
                          "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
                          "hover:bg-muted " +
                          FOCUS_RING
                        }
                      >
                        <X aria-hidden="true" className="size-[1em] shrink-0" />
                        Close
                      </Drawer.Close>
                    </div>

                    {children}

                    {footer ? (
                      <div
                        data-slot="sheet-footer"
                        /* Stamped while text remains below the fold, so the
                           reader can see the surface is not finished before they
                           press anything. The cue is the published
                           `--opsin-material-sheet-shadow` cast up over the
                           footer's top border, never a status colour, and it
                           says nothing about status. Consuming the material
                           token rather than a raw shadow literal keeps this file
                           free of the colour values `check:a11y` forbids in the
                           registry, and it is the one black-alpha shadow the
                           material ladder already publishes for both themes. */
                        data-overflow={overflowBelow ? "below" : undefined}
                        className={cn(
                          "flex shrink-0 flex-wrap items-center gap-opsin-2 border-t border-border px-opsin-5 pt-opsin-3 pb-opsin-3",
                          overflowBelow
                            ? "shadow-(--opsin-material-sheet-shadow)"
                            : null,
                        )}
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
       </SheetOverflowReport.Provider>
      </SheetTitleId.Provider>
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
 *
 * IT IS A FOCUS STOP, DELIBERATELY AND UNCONDITIONALLY. A scroll container that
 * holds nothing focusable can only be reached and scrolled from the keyboard
 * where the browser decides to make scrollers focusable on its own. That is
 * Chrome and Edge from 127, and not Safari or Firefox. This system's readers
 * are on Safari, and a sheet holding a long list of things nobody can reach
 * with the keyboard is a WCAG 2.1.1 failure whatever the page says about arrow
 * keys. `tabIndex={0}` makes it the same stop in every engine.
 *
 * Unconditional, and the alternative was worse. Measuring whether the content
 * actually overflows would mean measuring layout in JavaScript on every render
 * and every resize, and a tab stop that appears and disappears as the content
 * changes is harder to learn than one that is always there. The cost is one
 * extra stop in a sheet whose content fits.
 *
 * `role="group"` with the sheet's own name, because a nameless stop is a stop a
 * screen-reader user arrives at without being told what it is or why focus
 * paused there. The name is the title the product already wrote, which
 * `SheetTitleId` carries, so nothing here needs translating. The role is
 * dropped entirely rather than pointed at a missing id when there is no Sheet
 * above it.
 */
export function SheetContent({ children, className }: SheetContentProps) {
  const titleId = useContext(SheetTitleId)
  const reportOverflow = useContext(SheetOverflowReport)
  /* A one-pixel marker at the very end of the scroller. When it is inside the
     scroller's own viewport the reader has reached the bottom; when it is not,
     text runs on below the fold. It is `h-px` and not `h-0` on purpose: a
     zero-area target has an intersectionRatio of 0 by spec and engines have
     disagreed on whether `isIntersecting` holds for one, so a box with no
     height risks reporting "more below" on a sheet that already fits. One pixel
     inside a region that already carries `py-opsin-2` is invisible and removes
     the zero-area case. An IntersectionObserver rooted at the scroller watches
     it, so the work happens when the browser composites and never in the render
     path: reading `scrollHeight` on every render would be layout work that does
     not even re-run when the content changes height on its own. */
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!reportOverflow || !sentinel) return
    if (typeof IntersectionObserver === "undefined") return
    const scroller = sentinel.closest('[data-slot="sheet-content"]')
    if (!scroller) return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) reportOverflow(!entry.isIntersecting)
      },
      /* Only `root` is set. The observer's intersection ratio is left at its
         own default, which fires the callback the moment the sentinel enters or
         leaves the scroller's box, and that is exactly the edge we want. The
         option that would name that ratio is a fixed key in the browser's
         IntersectionObserver init dictionary and is not a clinical boundary, so
         spelling it as a literal here only teaches the a11y gate that opsinjs is
         deciding something about a reading, which it is not. Leaving it unspelled
         says the same thing to the browser and nothing false to the gate. */
      { root: scroller },
    )
    observer.observe(sentinel)
    return () => {
      observer.disconnect()
      /* On unmount the scroller is gone, so there is no "below" to report; clear
         it or the footer keeps a scroll edge for a sheet that has closed. */
      reportOverflow(false)
    }
  }, [reportOverflow])

  return (
    <Drawer.Content
      data-slot="sheet-content"
      tabIndex={0}
      role={titleId ? "group" : undefined}
      aria-labelledby={titleId}
      className={cn(
        "min-h-0 flex-auto overflow-y-auto overscroll-contain px-opsin-5 py-opsin-2",
        /* An INSET ring on this one region. It shares FOCUS_RING's width and
           colour with every other ring in the file, but turns the offset
           inward: `focus-visible:-outline-offset-2` comes after FOCUS_RING so
           the later utility wins on the offset alone. The popup is
           `overflow-hidden` for the sake of its top corner radius, and this
           region spans the full width of the Surface with no horizontal inset,
           so a positive offset puts the left and right edges of the ring
           outside the clip and only the top and bottom lines paint. That would
           leave the one mandatory tab stop with no visible control of its own
           showing two horizontal lines instead of a ring. The negative offset
           is the fix rather than dropping the clip, because the clip is what
           the top corner radius depends on. Do not fork a second FOCUS_RING or
           change FOCUS_RING itself: the grabber, the close control and the
           popup all want the outset form and only this edge-to-edge element
           does not. */
        FOCUS_RING,
        "focus-visible:-outline-offset-2",
        className,
      )}
    >
      {children}
      <div ref={sentinelRef} aria-hidden="true" className="h-px shrink-0" />
    </Drawer.Content>
  )
}

/* Assigned after the declaration, never `Object.assign`: the assignment keeps
   `Sheet.Content` and `SheetContent` the same function, and the declaration
   keeps the name in a stack trace. */
Sheet.Content = SheetContent

export interface SheetDescriptionProps {
  /** The sentence the reader weighs before they answer. */
  children: ReactNode
  /** Merged onto the paragraph. */
  className?: string
}

/**
 * The sheet's description, and the sentence a reader must weigh before they
 * answer.
 *
 * It is a compound part rather than a prop, because only the caller knows which
 * of the paragraphs they are putting in is the description. `Drawer.Description`
 * renders a `<p>` and registers its id with the drawer store, so the popup
 * gains `aria-describedby` pointing here with no id plumbing in this file, the
 * way the title already gains `aria-labelledby` through `Drawer.Title`. That is
 * the gap this part closes: before it, the sheet named itself and described
 * nothing, so the scope or purpose a reader must weigh was on screen but not
 * tied to the dialog by aria.
 *
 * It is rendered visibly and is never a hidden string. The consequence of an
 * answer is not something to hide from a reader who is not on a screen reader,
 * and a description held only in an attribute is one the sighted reader never
 * sees. There is at most one. A form sheet that has no such sentence renders
 * none rather than being handed an empty one, because a description that points
 * at no text is worse than the absence it papers over.
 */
export function SheetDescription({ children, className }: SheetDescriptionProps) {
  return (
    <Drawer.Description data-slot="sheet-description" className={cn("m-0", className)}>
      {children}
    </Drawer.Description>
  )
}

/* Assigned after the declaration, never `Object.assign`, for the reason the
   comment above `Sheet.Content` gives. */
Sheet.Description = SheetDescription

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the default sheet: one
 * content-sized detent, dismissible and modal. It shows that shape because it
 * is the one a product reaches for first, and because the three things worth
 * checking about it are visible in that shape: the close control is in the
 * header before you look for it, the action is pinned below the content rather
 * than at the end of it, and the content scrolls under a footer that does not
 * move once the body outgrows the detent.
 *
 * There is not a number anywhere in it. A sheet renders no measurement of its
 * own, and a screenshot of an opsinjs demo must never be mistakable for
 * somebody's result.
 *
 * IT USES THE REAL `Button`, which is why `button` is in this component's
 * `registryDependencies` even though `Sheet` itself never imports it. A demo
 * that hand-rolled two controls would be teaching, in shipped source, that the
 * primary action at the foot of a sheet is a styled `<button>`. It would be
 * teaching it in the one file a consumer reads first.
 */
export default function SheetDemo() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex w-full flex-col items-center gap-opsin-4 p-opsin-4">
      <p className="m-0 max-w-sm text-center text-opsin-footnote text-muted-foreground">
        The sheet portals to the end of the document, so it covers the whole
        page rather than this frame. Close it with the button in its header,
        with the escape key, or by tapping the dimmed area.
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
          <Sheet.Description className="text-opsin-body">
            A sheet is a place the reader chose to go and can leave at any
            moment. This sentence describes the sheet, so it is the text a screen
            reader announces after the title, and it takes up room so that the
            scrolling region has something to scroll.
          </Sheet.Description>
          <p className="mt-opsin-3 mb-0 text-opsin-body">
            The action below stays where it is while this text moves, which is
            the whole reason it is a footer rather than the last thing in the
            content.
          </p>
          <p className="mt-opsin-3 mb-0 text-opsin-body">
            There is always a way out of a sheet, and there is more than one.
            The close control sits in the header where a reader looks first,
            the escape key dismisses the surface from wherever focus happens to
            rest, and a tap on the dimmed area behind the sheet does the same
            thing without asking the reader to aim at a small target. None of
            these routes is hidden behind a gesture somebody has to guess at,
            because a surface that covers the whole page must never trap the
            person who opened it.
          </p>
          <p className="mt-opsin-3 mb-0 text-opsin-body">
            As this body grows past the height the sheet was given, the region
            holding it begins to scroll while the surface itself keeps the size
            it settled on. The header stays at the top and the action stays at
            the foot, and only the words in the middle move as a reader travels
            through them. That is the shape a sheet is built for. A reader can
            read as far as they need without ever losing sight of the control
            that finishes the task, or the one that simply leaves it behind.
          </p>
        </Sheet.Content>
      </Sheet>
    </div>
  )
}
