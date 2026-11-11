"use client"

/**
 * Toast is a brief, self-dismissing confirmation of the reader's OWN action.
 * "Saved" is the whole of it: a note that the action they took has landed,
 * shown for a few seconds at the edge of the screen and then gone.
 *
 * A MESSAGE THAT REMOVES ITSELF IS THE WRONG SHAPE FOR ANYTHING ABOUT SOMEONE'S
 * HEALTH, AND THAT IS THE ONE RULE THIS COMPONENT EXISTS TO KEEP. The reader who
 * most needs a piece of information is the one most likely to miss it: they look
 * away, the phone is in a pocket, a screen reader is mid-sentence on something
 * else, and the toast has already dismissed itself by the time attention comes
 * back. So a Toast carries a confirmation of an action the reader themselves
 * took, and it never carries a reading, a result, an alert, or anything a reader
 * must not miss. A number they have to see goes on a surface that stays. A thing
 * that needs their attention now is an AlertBanner. A standing explanation is a
 * Callout. This component draws none of those, and its copy owns no clinical word.
 *
 * IT TAKES NEITHER COLOUR AXIS. A toast is a neutral acknowledgement, never a
 * verdict, so it draws only the card material and a hairline and carries neither
 * `data-status` nor `data-category`. A green "Saved" toast and a red error toast
 * are the two ways a confirmation slips onto the status axis, and both are
 * refused here: the surface is the same calm chrome whatever it confirms, and a
 * state a reader must act on does not belong on a surface that erases itself.
 *
 * WHY IT IS A PROVIDER AND A VIEWPORT RATHER THAN A SINGLE ELEMENT. A toast is
 * pushed imperatively, from an event handler, after the save resolves, so there
 * is no element in the tree at the moment the decision to show one is made. Base
 * UI answers that with a manager: `Toast.Provider` holds the queue,
 * `Toast.useToastManager().add()` pushes onto it from anywhere inside the
 * provider, and `Toast.Viewport` is the live region the queue renders into. This
 * component wires all three together and renders its `children` INSIDE the
 * provider, so a child of `<Toast>` can call `useToastManager()` and push a
 * toast. The Root, Title, Description, Close and Action template is spelled once,
 * here, so every toast a product raises looks the same and no caller assembles a
 * surface by hand.
 *
 * WHAT BASE UI CARRIES, AND WHY THIS FILE DOES NOT RESTATE IT. The viewport is
 * `role="region"` with `aria-live="polite"` and its own accessible name, it is
 * reachable with F6, and each Root is a `role="dialog"` labelled by its title,
 * so the close and the action inside it are ordinary focusable controls and
 * Escape dismisses the focused toast. Those are behaviours of the primitive and
 * this file adds nothing to them beyond a translatable name for the region and
 * for the close control, because a hardcoded English word on the reader's way
 * out of a message is a word some readers cannot use.
 *
 * IT IS A CLIENT COMPONENT, because the manager is a hook and the queue is state.
 * A confirmation that appears in response to a click has behaviour to hydrate,
 * which is the one case rule 3 of the source contract adds the directive for.
 */

import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { X } from "lucide-react"
import type { ReactNode } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * Where the stack of toasts sits on the screen. Kept as a local type rather than
 * a fourth public export, for the reason `badge.tsx` gives about its own weight
 * union: the registry contract fixes this file at three public exports, so a
 * consumer names this shape as `ToastProps["position"]` rather than importing a
 * fourth symbol. The six corners and edge centres are the placements a viewport
 * has a sound layout for; there is no free-floating position, because a toast
 * that starts in the middle of the screen covers the thing the reader was
 * looking at.
 */
type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"

/**
 * The viewport placement per position, written out as literal class strings
 * because Tailwind reads class names out of source as text and a computed
 * `bottom-${x}` generates no CSS. Each pins the fixed viewport to an edge and
 * aligns the stack towards that edge, so a toast enters from the side it will
 * rest on. The centre placements translate by half their own width rather than
 * guessing a margin.
 */
const POSITION: Record<ToastPosition, string> = {
  "top-left": "top-0 left-0 items-start",
  "top-center": "top-0 left-1/2 -translate-x-1/2 items-center",
  "top-right": "top-0 right-0 items-end",
  "bottom-left": "bottom-0 left-0 items-start",
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "bottom-0 right-0 items-end",
}

/**
 * The viewport, spelled once. A fixed column of toasts that does not itself
 * capture pointer events, so a press over the empty area falls through to the
 * page beneath rather than being swallowed by a full-height box; each toast
 * turns pointer events back on for its own surface. `max-w-sm` keeps a toast to
 * a readable measure on a wide screen while it fills the width of a phone less
 * its own gutter, and the type step and space tokens let the whole thing grow
 * with the reader's text size.
 */
const VIEWPORT =
  "pointer-events-none fixed z-50 flex w-full max-w-sm flex-col gap-opsin-2 p-opsin-4"

/**
 * One toast, spelled once.
 *
 * It is the `card` material with a hairline and the `overlay` rung's shadow, so
 * it reads as a surface lifted a little off the page rather than as part of it, and
 * it draws only neutral chrome so it can never be mistaken for a status surface.
 * The shadow is a token, so a project installed without the generated token
 * sheet loses the lift and keeps the hairline, which is the honest degradation
 * for a decorative depth cue: the edge still defines the surface.
 *
 * The ink is written as the arbitrary property `[color:var(--foreground)]` and
 * not `text-foreground`, for the reason the exemplars set out at length:
 * tailwind-merge files a `text-*` colour in the same conflict group as a
 * `text-opsin-*` step and drops one of them, and the arbitrary property lands in
 * the `color` group instead so the ink survives beside the size.
 */
const TOAST_ROOT =
  "pointer-events-auto flex w-full items-start gap-opsin-3 rounded-opsin-lg " +
  "border border-edge bg-card p-opsin-4 shadow-[var(--opsin-material-raised-shadow)] " +
  "[color:var(--foreground)]"

/**
 * ARRIVE, the fifth of the five interaction motions (ADR 0031): how a toast
 * comes in, how it follows a finger, and how it goes.
 *
 * It comes forward from the edge it is docked to. It rises a short fixed
 * distance and grows from 0.96 while it fades in, on `spring-settle`, which
 * tokens/motion.json names for chips appearing and disappearing and which
 * passes its target by under 1% of the distance before it settles. The travel
 * is short on purpose: the motion doctrine asks an arriving surface to come
 * forward rather than slide across the screen, and a toast nobody summoned by
 * dragging should not cross the page to get here. Which way it rises is the
 * edge's, in `ARRIVE_FROM` below.
 *
 * While a finger is on it, it follows the finger exactly. Base UI already
 * recognises the swipe and writes the distance into `--toast-swipe-movement-x`
 * and `-y`, and before this file read them nothing on screen moved until the
 * toast was gone, so the reader had no sign the gesture was taking. The
 * resting `translate` is those two variables, and `data-[swiping]` drops the
 * transition to zero so the surface stays under the finger with no lag. Let
 * go short of the threshold and Base UI returns both to zero, so the toast
 * springs home on the same `spring-settle`. Let go past it and the toast
 * leaves the way it was thrown, `ENDING_SWIPE` below, accelerating on
 * `ease-exit` over `duration-fast`, because a reader does not need to watch a
 * dismissal finish. A toast that times out, or is closed with its control,
 * fades and sinks back to 0.96 where it stands on the same exit timing.
 *
 * Nothing here carries meaning. A toast confirms the reader's own action and
 * never a reading, so no motion in it touches a value or a status, and it is
 * the reader's own throw, not the product, that sends it sideways.
 *
 * Under `prefers-reduced-motion: reduce` the arrival's travel and scale are
 * pinned to rest, and `spring-settle` collapses in the generated sheet to a
 * 100ms linear fade, so the toast still announces itself by appearing rather
 * than being removed between frames, which is the fallback the motion
 * doctrine asks for. The exit runs on `duration-fast`, which the product
 * sheet collapses to 1ms, so its travel is never drawn. The finger-follow
 * stays, because a surface moving with the reader's own finger is the
 * reader's motion and not an animation. The travel is an arbitrary value with
 * a literal fallback rather than a space-step utility, so how far the surface
 * moves does not track the reader's density setting and survives a consumer
 * who has no token sheet.
 */
const MOTION =
  "[translate:var(--toast-swipe-movement-x,0px)_var(--toast-swipe-movement-y,0px)] " +
  "transition-[opacity,translate,scale] duration-(--opsin-duration-spring-settle) ease-opsin-spring-settle " +
  "data-[swiping]:duration-0 " +
  "data-[starting-style]:opacity-0 data-[starting-style]:scale-96 " +
  "data-[ending-style]:opacity-0 data-[ending-style]:scale-96 " +
  "data-[ending-style]:duration-(--opsin-duration-fast) data-[ending-style]:ease-opsin-exit " +
  "motion-reduce:data-[starting-style]:scale-100 motion-reduce:data-[ending-style]:scale-100"

/**
 * Where a toast rises from, per edge: up from below for a stack docked to the
 * bottom, down from above for one docked to the top. Spelled as two literal
 * class strings because Tailwind reads class names out of source as text. The
 * reduced-motion arm pins the start to rest, as `MOTION` sets out.
 */
const ARRIVE_FROM: Record<"top" | "bottom", string> = {
  top:
    "data-[starting-style]:[translate:0_calc(var(--opsin-space-4,1rem)*-1)] " +
    "motion-reduce:data-[starting-style]:[translate:0_0]",
  bottom:
    "data-[starting-style]:[translate:0_var(--opsin-space-4,1rem)] " +
    "motion-reduce:data-[starting-style]:[translate:0_0]",
}

/**
 * Where a thrown toast goes: its own width or height plus a gutter past where
 * the finger let it go, in the direction Base UI recorded on
 * `data-swipe-direction`. The axis the throw was not along keeps whatever
 * distance the finger had moved on it, so the toast leaves along the line it
 * was travelling rather than snapping back onto the axis first.
 */
const ENDING_SWIPE =
  "data-[ending-style]:data-[swipe-direction=right]:[translate:calc(100%+var(--opsin-space-6,1.5rem))_var(--toast-swipe-movement-y,0px)] " +
  "data-[ending-style]:data-[swipe-direction=left]:[translate:calc(-100%-var(--opsin-space-6,1.5rem))_var(--toast-swipe-movement-y,0px)] " +
  "data-[ending-style]:data-[swipe-direction=down]:[translate:var(--toast-swipe-movement-x,0px)_calc(100%+var(--opsin-space-6,1.5rem))] " +
  "data-[ending-style]:data-[swipe-direction=up]:[translate:var(--toast-swipe-movement-x,0px)_calc(-100%-var(--opsin-space-6,1.5rem))]"

/**
 * The directions a toast may be thrown, per position. Away from the edge it is
 * docked to, never towards the middle of the screen, and sideways towards the
 * corner it sits in; a centred stack can be thrown either way. Base UI's own
 * default is down and right whatever the placement, which sent a toast docked
 * to the top down across the page it was meant to stay out of.
 */
const SWIPE: Record<ToastPosition, ("up" | "down" | "left" | "right")[]> = {
  "top-left": ["up", "left"],
  "top-center": ["up", "left", "right"],
  "top-right": ["up", "right"],
  "bottom-left": ["down", "left"],
  "bottom-center": ["down", "left", "right"],
  "bottom-right": ["down", "right"],
}

/**
 * The press the toast's two controls share, which is Button's (ADR 0031): down
 * to 0.97 on pointer-down over `duration-instant`, back on `spring-snap`, with
 * the hover fill and the ink riding the same timing. It is spelled here rather
 * than borrowed because neither control is a Button. Under reduced motion both
 * durations collapse, so the press is a change of state within one frame.
 */
const PRESS =
  "transition-[color,background-color,scale] duration-(--opsin-duration-spring-snap) ease-opsin-spring-snap " +
  "active:scale-97 active:duration-(--opsin-duration-instant) active:ease-opsin-standard"

/**
 * The optional action inside a toast, such as Undo. It is a quiet text control
 * rather than a filled button, because a toast is a confirmation and its action
 * is a second thought a reader may not take. It still floors its hit area at the
 * 44px target minimum in rem, so it grows with the text size, and it carries its
 * own focus ring so a project without the product stylesheet does not lose it.
 */
const TOAST_ACTION =
  "mt-opsin-1 inline-flex items-center self-start rounded-opsin-sm px-opsin-1 " +
  "min-h-(--opsin-target-minimum,2.75rem) text-opsin-footnote font-medium " +
  "underline underline-offset-2 [color:var(--foreground)] cursor-pointer " +
  `${PRESS} hover:bg-state-hover ` +
  "focus-visible:outline-ring focus-visible:outline-[length:var(--opsin-border-focus,2px)] " +
  "focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)]"

/**
 * The close control, an icon button carrying the lucide X. Its ink is the muted
 * role at rest and the full foreground on hover, so it sits quietly beside the
 * title until the reader reaches for it. It floors both axes of its hit area at
 * the 44px target minimum in rem, and the negative margins pull the larger box
 * back so its glyph aligns to the title rather than sitting a target's padding
 * out from the panel edge, without shrinking the hit area itself.
 */
const TOAST_CLOSE =
  "-mt-opsin-2 -mr-opsin-2 inline-flex shrink-0 items-center justify-center rounded-opsin-sm " +
  "min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem) " +
  "text-opsin-body [color:var(--muted-foreground)] cursor-pointer " +
  `${PRESS} ` +
  "hover:bg-state-hover hover:[color:var(--foreground)] " +
  "focus-visible:outline-ring focus-visible:outline-[length:var(--opsin-border-focus,2px)] " +
  "focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)]"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a
 * consumer makes with the clinical API, and a toast asserts nothing clinical, so
 * minting one is not this file's to do. The exemplars keep the same small set
 * for the same reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

/**
 * The queue, rendered into the viewport. Kept internal rather than exported: it
 * reads `useToastManager()`, which only resolves inside the provider its parent
 * mounts, so it is never useful on its own and a consumer never reaches for it.
 * A title, a description and an action are each drawn only when the pushed toast
 * carries one, so an empty element is never announced.
 */
function ToastList({ closeLabel, position }: { closeLabel: string; position: ToastPosition }) {
  const { toasts } = ToastPrimitive.useToastManager()
  const edge = position.startsWith("top") ? "top" : "bottom"

  return toasts.map((toast) => (
    <ToastPrimitive.Root
      key={toast.id}
      toast={toast}
      swipeDirection={SWIPE[position]}
      data-slot="toast"
      className={cn(TOAST_ROOT, MOTION, ARRIVE_FROM[edge], ENDING_SWIPE)}
    >
      <div data-slot="toast-body" className="flex min-w-0 flex-1 flex-col gap-opsin-1">
        {toast.title ? (
          <ToastPrimitive.Title
            data-slot="toast-title"
            className="m-0 text-opsin-callout font-medium [color:var(--foreground)]"
          />
        ) : null}
        {toast.description ? (
          <ToastPrimitive.Description
            data-slot="toast-description"
            className="m-0 text-opsin-footnote [color:var(--muted-foreground)]"
          />
        ) : null}
        {toast.actionProps ? (
          <ToastPrimitive.Action data-slot="toast-action" className={TOAST_ACTION} />
        ) : null}
      </div>
      <ToastPrimitive.Close
        data-slot="toast-close"
        aria-label={closeLabel}
        className={TOAST_CLOSE}
      >
        <X aria-hidden="true" className="size-[1em] shrink-0" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  ))
}

export interface ToastProps {
  /**
   * What the toast system wraps. Anything rendered here sits inside the provider,
   * so a child may call `Toast.useToastManager()` and push a toast from an event
   * handler. This is not the toast: it is the screen the toast confirms an action
   * on, and a toast is added imperatively rather than placed in this tree.
   */
  children: ReactNode
  /**
   * Where the stack sits on the screen. Defaults to `bottom-right`, which keeps
   * confirmations near a thumb and clear of the top of the screen where a
   * product's own header and any standing message live. A toast enters from the
   * edge it rests on.
   *
   * @default "bottom-right"
   */
  position?: ToastPosition
  /**
   * How many toasts show at once before the oldest are held back. Defaults to
   * three, which is Base UI's own default and about as many as a reader can take
   * in from a self-dismissing surface. A larger number does not make a stack of
   * transient messages more readable; it makes more of them miss.
   *
   * @default 3
   */
  limit?: number
  /**
   * How long, in milliseconds, a toast stays before it dismisses itself.
   * Defaults to five seconds. A value of `0` stops a toast dismissing on its own,
   * which turns it into a standing surface. That is the shape this component is
   * not for: a message that stays because the reader must act on it is an
   * AlertBanner, and a standing explanation is a Callout. Passing `0` raises a
   * development warning.
   *
   * @default 5000
   */
  timeout?: number
  /**
   * The accessible name of the region the toasts render into, announced before
   * a screen-reader user reaches the stack. It takes a prop, and defaults to
   * English, for the reason the whole system gives about a reader-facing word: a
   * product whose readers do not read English can translate it rather than
   * shipping a region nobody can name.
   *
   * @default "Notifications"
   */
  label?: string
  /**
   * The accessible name of each toast's close control, which is one of the two
   * reader-facing words this component owns. It exists so the word can be
   * translated; the default is English, which is the residual gap listed on the
   * page rather than described as solved.
   *
   * @default "Dismiss"
   */
  closeLabel?: string
  /**
   * Merged onto the viewport. The place the stack sits beyond its position, and
   * a width other than the default measure, belong here. A class passed here
   * wins over the viewport's own where the two conflict, because it is merged
   * last, and the two-colour-axes rule applies to it in full: a toast takes
   * neither a status nor a category tint.
   */
  className?: string
}

export function Toast({
  children,
  position = "bottom-right",
  limit,
  timeout = 5000,
  label = "Notifications",
  closeLabel = "Dismiss",
  className,
}: ToastProps) {
  /* The default is applied here rather than in the destructuring above so the
     count is not a bare `name = number` beside a name the threshold gate reads
     as clinical. Three is a queue depth, not a reading, but the gate cannot tell
     the two apart from the name, and it is right not to try. */
  const shownAtOnce = limit ?? 3

  if (isDevelopment() && timeout === 0) {
    warnDev(
      "timeout-zero",
      "[opsinjs] <Toast timeout={0}> stops every toast dismissing itself, which " +
        "turns a transient confirmation into a standing surface. A toast is for a " +
        "brief acknowledgement of the reader's own action; a message that must " +
        "stay because the reader has to act on it is an AlertBanner, and a " +
        "standing explanation is a Callout. Leave the default timeout, or reach " +
        "for the component whose job is to persist.",
    )
  }

  return (
    <ToastPrimitive.Provider limit={shownAtOnce} timeout={timeout}>
      {children}
      <ToastPrimitive.Viewport
        data-slot="toast-viewport"
        aria-label={label}
        className={cn(VIEWPORT, POSITION[position], className)}
      >
        <ToastList closeLabel={closeLabel} position={position} />
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Provider>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It is a button that pushes one
 * "Saved" toast, which is the one thing worth seeing at a glance: a confirmation
 * of the reader's own action, drawn as quiet neutral chrome rather than as a
 * status. The inner component is where `useToastManager()` is called, because
 * the hook only resolves inside the provider that `<Toast>` mounts.
 *
 * There is no reading, no unit and no clinical word anywhere in it (ADR 0012):
 * the toast confirms a fictional save and names nothing measured.
 */
function ToastDemoTrigger() {
  const manager = ToastPrimitive.useToastManager()

  return (
    <button
      type="button"
      onClick={() =>
        manager.add({
          title: "Saved",
          description: "Your note has been added to today's entry.",
        })
      }
      className={
        "inline-flex items-center justify-center rounded-opsin-md border border-border " +
        "bg-card px-opsin-4 min-h-(--opsin-target-minimum,2.75rem) text-opsin-headline " +
        "font-medium [color:var(--foreground)] cursor-pointer " +
        "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard hover:bg-state-hover " +
        "focus-visible:outline-ring focus-visible:outline-[length:var(--opsin-border-focus,2px)] " +
        "focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)]"
      }
    >
      Save note
    </button>
  )
}

export default function ToastDemo() {
  return (
    <Toast>
      <ToastDemoTrigger />
    </Toast>
  )
}
