"use client"

/**
 * Dialog is the window that takes a reader's place, their focus and their
 * ability to do anything else, and hands all three back where it found them.
 *
 * THE PAGE ASKED FOR TWO THINGS THAT CANNOT BOTH BE TRUE, AND THIS FILE ANSWERS
 * ONE OF THEM. `dialog.mdx:114` says `severity="alert"` "removes the close
 * control and makes the scrim non-dismissing: an alert dialogue has no valid
 * 'went away' outcome". `dialog.mdx:124` says that below `sheetBelow` pixels
 * "the dialog renders as a Sheet instead". A Sheet is, by its own
 * specification, draggable and dismissible. Put together, an alert dialogue
 * that nobody may dismiss on a laptop becomes dismissible with a thumb on a
 * phone, silently, at whichever width the caller happened to pass. That is not
 * a styling difference; it is the safety contract inverting on the device most
 * readers use. So `sheetBelow` is not implemented and is not a prop.
 *
 * What the sentence under it was complaining about is kept. "A modal window on
 * a 360px screen is a sheet wearing the wrong clothes" is a complaint about
 * SHAPE, and shape is free: below the `sm` breakpoint this dialog meets the
 * bottom edge of the screen, takes the full width and rounds only its top
 * corners, which is what `tokens/shape.json` publishes `radius-xl` for. It does
 * that in CSS, at every width, with no prop, no measurement and no change of
 * component. So the role, the focus trap, the treatment of the background and
 * the dismissal rules are identical on a phone and on a desktop. A dialog never
 * becomes something else.
 *
 * TWO ROOTS, NOT A FLAG. `severity` swaps `AlertDialog.Root` for `Dialog.Root`
 * rather than toggling props on one of them. Base UI's alert-dialog root is the
 * same store in a different mode: it forces `modal`, forces
 * `disablePointerDismissal`, and sets `role="alertdialog"`. Those are three
 * behaviours the specification requires together, arriving together, with no
 * way for a caller or a later refactor to get two of the three. Faking it with
 * `disablePointerDismissal` on the ordinary root would produce a
 * non-dismissing surface still announced as a plain dialog, which is the
 * failure that looks correct in review.
 *
 * ESCAPE IS THE ONE PART BASE UI DOES NOT DO FOR US, AND THE ANSWER IS
 * INCOMPLETE. `useDialogRoot` passes `escapeKey: isTopmost` to `useDismiss` in
 * every mode, alert-dialog included, so an untouched alert dialog closes on
 * Escape and the whole contract is lost on the keyboard. This file cancels that
 * close through the change event's own `cancel()`, which is the half that
 * works: the dialog stays, in every configuration.
 *
 * The response is the half that does not. Focus returns to the safest action.
 * That answers the key for a reader whose focus had moved into the body or
 * onto the other control, and does nothing at all in the default one, because
 * `initialFocus="safest"` has already put focus on that same element and
 * calling `focus()` on `document.activeElement` is a specification no-op: no
 * focus event, no change of ring, nothing for a screen reader to announce. A
 * reader who presses Escape first, before moving anywhere, gets silence.
 *
 * That is a known limitation rather than a subtlety, and it is written down on
 * the page in the gap list rather than described as a feature here. The three
 * candidate repairs were all worse: focusing the FIRST action points the key at
 * the control that changes something; focusing the container relies on an
 * announcement nobody in this repository has verified with a screen reader; and
 * a live region is banned outright, because a component never mounts one on the
 * caller's behalf. `patterns/alert-escalation.mdx` asks for the reason to be
 * announced, and the honest position is that this component does not do that
 * yet. It does not write the sentence either: those are the product's words,
 * they belong in `description`, and a development warning asks for them.
 *
 * IT IS A CLIENT COMPONENT, and the two refs are why. `initialFocus="safest"`
 * has to resolve to an ELEMENT, because Base UI takes a ref or a function,
 * never a string. The element it means is the last control in the actions
 * slot, which only a ref can find. The Escape handler needs the same ref.
 * Nothing else here is stateful: there is no width observation, no media query
 * listener and no measurement, because the responsive behaviour is a
 * stylesheet's job.
 *
 * WHAT IT DOES NOT DO. It does not move focus on appearance beyond the one
 * placement Base UI performs on open, does not mount a live region, does not
 * animate anything a reader has asked not to see, and does not know what any of
 * its actions do. It renders no measurement, carries no clinical level, and
 * stamps neither `data-status` nor `data-category`.
 */

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import {
  Dialog as DialogPrimitive,
  type DialogRootChangeEventDetails,
} from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { Surface } from "@/registry/base-lyra/ui/surface"

/**
 * What counts as somewhere focus can be put.
 *
 * Deliberately does NOT exclude `[aria-disabled="true"]`. That is how this
 * system spells a control which is busy rather than unavailable. A Button
 * saving a change keeps its tab stop and its name on purpose, and skipping it
 * would send initial focus past the control the reader is waiting on.
 *
 * The popup itself carries `tabindex="-1"` from Base UI so that a touch screen
 * reader can land on it, and the final clause is what keeps this selector from
 * treating that as an answer.
 */
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Development warnings, said once per offending call site.
 *
 * `tokens/errors.json` states the policy: development only, once per offending
 * call site, through `console.warn`. Every warning in this file is in a render
 * body or in an effect keyed on a `ReactNode`, which is the shape that repeats.
 * A dialog wrapped around a short form re-renders on every keystroke
 * and the same two paragraphs printed on every pass, twice more again under
 * Strict Mode; the effect below was worse still, because `actions` is a fresh
 * identity on every parent render. A channel somebody filters is a channel that
 * no longer carries the one finding they needed, and this file's warnings are
 * about a reader who cannot leave a modal surface.
 *
 * It is a module-local set rather than the substrate's `warnOnce` for the reason
 * the block at the call sites gives: `warnOnce` is keyed to an `OpsinErrorCode`,
 * and none of these interface defects has a code allocated. The key names the
 * offence first and the dialog second, so an empty `title` still dedupes.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

/**
 * The first or the last place focus can go inside a region.
 *
 * `last` is the one that matters and it is not an arbitrary end of the row. The
 * page's own worked example orders its actions **[Delete reading] [Keep it]**
 * and then puts initial focus on *Keep it*. That is the action that changes
 * nothing, at the end. So the rule this component states, and the page repeats,
 * is that the action which changes something comes first and the safest one
 * comes last, and the last is where focus lands. A reader who presses Return
 * without reading gets the answer that does nothing, which is what "defaults
 * should be safe" means in a component rather than in a sentence.
 */
function focusableIn(
  region: HTMLElement | null,
  which: "first" | "last",
): HTMLElement | null {
  if (region === null) {
    return null
  }
  const found = region.querySelectorAll<HTMLElement>(FOCUSABLE)
  return (which === "first" ? found[0] : found[found.length - 1]) ?? null
}

/**
 * The shape, and the one place it changes with the viewport.
 *
 * `tokens/shape.json` publishes `radius-xl` as "sheets and dialogs", with the
 * qualifier that it is "applied to the leading edge only when the surface meets
 * a screen edge on the other side". That is exactly the phone case below the
 * `sm` breakpoint, where the dialog sits on the bottom edge. Above it the
 * dialog floats and takes the radius on all four corners.
 *
 * `corner-shape` is a property here rather than the product theme's
 * `data-opsin-shape="squircle"` attribute, for the reason Card gives: the
 * attribute would be a fifth member of a data-attribute vocabulary closed at
 * four, and the stylesheet that reads it does not travel with this file into
 * somebody else's project. An engine without `corner-shape` draws an ordinary
 * rounded corner, which every radius on the ladder is chosen to survive.
 */
const SHAPE =
  "rounded-t-opsin-xl sm:rounded-opsin-xl [corner-shape:var(--opsin-corner-shape)]"

/**
 * The entrance and the exit, and the two independent reasons a reader who asked
 * for less motion gets it.
 *
 * `--opsin-duration-base` is one of the five standalone durations that
 * `app/product.css` collapses to 1ms under `prefers-reduced-motion: reduce`, so
 * the transition is over before it is visible without this file branching on
 * anything. `motion-reduce:transition-none` is the second answer and it is not
 * redundant: a consumer who installs this component without that stylesheet
 * gets the same result from the component alone.
 *
 * The dialog rises from the bottom edge on a phone, where that is the direction
 * it comes from, and scales on a wider screen, where it does not. Under reduced
 * motion neither happens and the dialog appears in place. Depth is then carried
 * by the scrim and by the surface's edge, which is why the
 * specification says neither of those is optional and why no prop removes them.
 */
const MOTION = cn(
  "transition-[opacity,transform] duration-(--opsin-duration-base) ease-opsin-standard",
  "motion-reduce:transition-none",
  "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
  "data-[starting-style]:translate-y-4 data-[ending-style]:translate-y-4",
  "sm:data-[starting-style]:translate-y-0 sm:data-[ending-style]:translate-y-0",
  "sm:data-[starting-style]:scale-95 sm:data-[ending-style]:scale-95",
)

export interface DialogProps {
  /**
   * Whether the dialog is on screen. Required and controlled: a surface that
   * blocks everything else is not a thing a component should be able to open by
   * itself, and the product that owns the decision owns the state.
   */
  open: boolean
  /**
   * Called with the state the dialog wants to be in. One argument, deliberately:
   * every reason Base UI would report is either handled inside this component
   * or means the same thing to a caller, and a second parameter that only
   * sometimes matters is a second parameter people copy without reading.
   *
   * It is not called when Escape is pressed on an alert dialog, because that
   * dialog does not close.
   */
  onOpenChange: (open: boolean) => void
  /**
   * The accessible name, and a question wherever the dialog is asking one. It
   * is a heading, it is always visible, and there is no prop that hides it: an
   * unnamed modal surface is announced as "dialog" and nothing else.
   */
  title: string
  /**
   * What happens if the reader says yes, and what happens if they say no, in
   * one or two sentences. Optional on an ordinary dialog and effectively
   * required on an alert one. It is the only place the reader is told why
   * Escape will not let them out, and its absence raises a development warning.
   */
  description?: string
  /**
   * `alert` renders `role="alertdialog"`, removes the close control, stops the
   * scrim dismissing and stops Escape closing. Use it only where going away
   * without answering is not a valid outcome, which is rarer than it feels:
   * almost every dialog a product reaches for has a safe answer, and that
   * answer is a button rather than a missing exit.
   *
   * @default "default"
   */
  severity?: "default" | "alert"
  /**
   * The accessible name of the close control, which is the only reader-facing
   * word this component owns. It exists so that the word can be translated:
   * a component that ships an untranslatable English string into a product
   * whose readers do not read English has removed their way out of the dialog
   * as surely as deleting the control would.
   *
   * The default is English, and that is the residual gap. It is the same one
   * `StatusPill.label` has, and it is listed on the page rather than described
   * as solved. Ignored when `severity` is `alert`, which renders no close
   * control at all.
   *
   * @default "Close"
   */
  closeLabel?: string
  /**
   * Where focus lands when the dialog opens. `safest` puts it on the LAST
   * control in `actions`, which is where the specification's own example puts
   * the answer that changes nothing; `content` puts it on the first control
   * inside `children`, for a dialog whose job is a short task rather than a
   * question. Neither ever lands on the scrim or on the container while a
   * control is available.
   *
   * `content` falls back to the safest action when `children` holds nothing
   * focusable, and only then to the primitive's own behaviour. That order is
   * the point rather than a tidy-up: the primitive's default is the first
   * tabbable element in the popup, an alert dialog has no close control, and so
   * the first tabbable element in an alert dialog is the FIRST action. The
   * ordering rule reserves that for the answer that changes something.
   *
   * The cost of `safest` is that it is the LAST tab stop in the dialog, so the
   * first Tab wraps round to the close control and the other answer is reached
   * with Shift+Tab. That is the trade: a stray Return is harmless, and the
   * other answer is one key further away than it looks.
   *
   * @default "safest"
   */
  initialFocus?: "safest" | "content"
  /**
   * The actions, in order, least destructive LAST. At most two. A dialog with
   * three answers is a menu that has not admitted it, and that limit is a rule
   * this component states rather than enforces, because `ReactNode` does not
   * say how many controls are inside it and `React.Children.count` cannot see
   * through a fragment.
   *
   * They are pinned to the foot of the dialog and never scroll away.
   */
  actions?: ReactNode
  /**
   * Anything the dialog holds beyond its title and its description: a short
   * form, a list of what will be affected. Optional, and most confirmations
   * need none of it.
   *
   * Nothing translucent goes in here. The dialog is itself a translucent rung
   * and a translucent rung may never contain another one. A card inside a
   * dialog is a `card`, which is opaque and is where a health value has to sit.
   */
  children?: ReactNode
  /**
   * Merged onto the container. Width belongs here: the dialog takes the full
   * width of a phone and a readable measure above that, and a product with a
   * genuinely wider dialog overrides it rather than asking for a prop.
   */
  className?: string
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  severity = "default",
  closeLabel = "Close",
  initialFocus = "safest",
  actions,
  children,
  className,
}: DialogProps) {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const actionsRef = useRef<HTMLDivElement | null>(null)

  const nonDismissing = severity === "alert"

  /* A blank string is an absence, not a description. `title` has had this
     treatment since the first version and `description` had only an
     `undefined` check, which meant `description=""` on an alert dialog raised
     no warning and then wired an EMPTY `aria-describedby` onto the popup. That
     is a surface with no close control, a refused Escape key and nothing
     announced about why either of those is true. Absence and emptiness are the
     same thing to a reader, so they are the same thing here. */
  const hasDescription = description !== undefined && description.trim() !== ""

  /* Development-only, and none of these is an OPSIN code. `tokens/errors.json`
     allocates codes for mistakes a consumer makes with the CLINICAL API, and a
     component may not mint one, because that table is generated from that file
     and the codes are a versioned contract. Those mistakes are a status
     without a word, a range without a source. These, and the effect below them,
     are ordinary interface defects, reported in the ordinary channel.

     They all render anyway. A dialog is already on screen and already holding
     the reader's focus by the time any of this is true; taking it away to
     report a mistake would leave a reader stranded mid-decision. */
  if (title.trim() === "") {
    warnDev(
      "title-empty",
      "[opsinjs] <Dialog> was given an empty `title`. The title is the " +
        "dialog's accessible name, so without it the surface is announced as " +
        '"dialog" and nothing else, and a reader arriving by screen reader is ' +
        "told that something has taken over without being told what.",
    )
  }
  if (nonDismissing && actions === undefined) {
    warnDev(
      `alert-no-actions:${title}`,
      '[opsinjs] <Dialog severity="alert"> has no `actions`. An alert dialog ' +
        "has no close control, its scrim does not dismiss and Escape does not " +
        "close it, so its actions are the only way out of it. One with none is " +
        "a surface a reader cannot leave. Either give it the answers it is " +
        'asking for, or use severity="default", where going away is a valid ' +
        "outcome.",
    )
  }
  if (nonDismissing && !hasDescription) {
    warnDev(
      `alert-no-description:${title}`,
      '[opsinjs] <Dialog severity="alert"> has no `description`. On an alert ' +
        "dialog the description is where the reader is told that an answer is " +
        "needed and what each answer does. Escape will not let them out, and " +
        "this component will not write that sentence on your behalf, because " +
        "the words belong to the product that knows what the answers mean.",
    )
  }

  /* THE SECOND HALF OF THE ALERT-DIALOG WARNING, AND IT HAS TO RUN AFTER THE
     DOM EXISTS.

     The check above catches `actions={undefined}` and nothing else, because at
     render time that is all it can see. `actions` is a `ReactNode`: `null`,
     `false`, `""` and `<></>` are every one of them legal, every one of them
     not `undefined`, and every one of them renders an actions row with nothing
     focusable in it. On an alert dialog that is a modal surface with no close
     control, a scrim that does not dismiss, an Escape key that is refused and
     nothing at all to press. That is the outcome the warning above describes
     in words and, until this effect existed, did not report.

     The ref is what makes the check possible: `React.Children.count` cannot see
     through a fragment, and it cannot see a control a caller rendered
     conditionally either. The ref sees the DOM, which is the thing the reader
     is stuck in. It renders anyway, for the reason above: a dialog already
     holding somebody's focus is not made safer by being unmounted.

     AND IT IS DEFERRED A FRAME, WHICH IS THE WHOLE DIFFERENCE BETWEEN A GUARD
     AND A LIAR. Read on the render where `open` flips true, `actionsRef.current`
     is still null: the popup lives in a portal Base UI has not mounted yet, so
     the check reported "nothing focusable" against a row that had not been
     built. The dependency array never changes again after that, so the verdict
     stood for the life of the dialog. It was wrong on this repository's own
     alert-dialog example, where two buttons are present and Tab cycles between
     them. A developer who is told their reader is trapped, opens the dialog and
     finds two working answers learns that this warning lies, which costs more
     than the warning was ever worth. One frame is enough: Base UI has portalled
     the popup and placed initial focus by then, through the same
     `focusableIn(actionsRef.current, "last")` call `resolveInitialFocus` makes.
     The frame is cancelled on cleanup so a dialog closed or unmounted inside it
     never reads a torn-down ref. */
  useEffect(() => {
    if (!isDevelopment() || !open || !nonDismissing || actions === undefined) {
      return
    }
    const frame = requestAnimationFrame(() => {
      if (focusableIn(actionsRef.current, "last") === null) {
        warnDev(
          `alert-actions-empty:${title}`,
          '[opsinjs] <Dialog severity="alert"> was given `actions` with nothing ' +
            "focusable inside it. An alert dialog has no close control, its scrim " +
            "does not dismiss and Escape does not close it, so its actions are the " +
            "only way out. An empty row, a `null`, a `false` or a fragment " +
            "with no controls in it is a surface a reader cannot leave at all. " +
            'Give it the answers it is asking for, or use severity="default", ' +
            "where going away is a valid outcome.",
        )
      }
    })
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [open, nonDismissing, actions, title])

  /**
   * Base UI takes a ref, `true`, `false`, or a function returning an element.
   * There is no string form, so the two values this component publishes are
   * resolved here, at open time, when the popup and its parts are in the DOM.
   *
   * Falling back to `true` rather than to `false` is the safe direction: `true`
   * is Base UI's own behaviour, which puts focus on the first tabbable element
   * inside the popup, and `false` would leave focus outside a surface that has
   * hidden everything outside it from assistive technology and holds the tab
   * ring inside itself.
   *
   * BUT `true` IS NOT SAFE ENOUGH TO REACH DIRECTLY FROM `content`, which is
   * why the chain below has three links rather than two. `children` may be
   * absent, in which case the content div is never rendered and the ref is
   * null; or it may hold nothing focusable. Either way the old fallback landed
   * on `true`, Base UI resolved that to the first tabbable element in the
   * popup, and an alert dialog has no close control. So the first tabbable
   * element in one is the FIRST action, which this component's own ordering
   * rule reserves for the answer that changes something. A stray Return then
   * did the destructive thing, on the path the props documentation said could
   * not happen. Falling through the safest action first makes the sentence
   * true in every branch instead of in the common one.
   */
  function resolveInitialFocus(): HTMLElement | true {
    if (initialFocus === "content") {
      return (
        focusableIn(contentRef.current, "first") ??
        focusableIn(actionsRef.current, "last") ??
        true
      )
    }
    return focusableIn(actionsRef.current, "last") ?? true
  }

  /**
   * THE ESCAPE KEY, WHICH IS THE ONLY PLACE THIS COMPONENT OVERRULES THE
   * PRIMITIVE.
   *
   * `useDialogRoot` passes `escapeKey: isTopmost` to `useDismiss` in every mode,
   * so Base UI's alert dialog closes on Escape exactly like an ordinary one.
   * `DialogStore.setOpen` calls this handler first and returns early when
   * `eventDetails.isCanceled`, which is what makes `cancel()` a refusal rather
   * than a request.
   *
   * Cancelling on its own would make the key do nothing at all, and the
   * specification is explicit that the dialog "does not simply swallow the
   * key". So focus moves to the safest action. That move is only a
   * response when focus was somewhere else. In the default configuration it is
   * not: `initialFocus="safest"` has already put focus on the last action, so
   * this line focuses the element that already has focus, which the DOM
   * specification defines as doing nothing. No focus event, no ring, no
   * announcement.
   *
   * The line stays because it is right for the reader whose focus HAD moved,
   * and because every alternative is worse (the file header sets out which and
   * why). What does not stay is the claim: the page lists Escape-on-an-alert-
   * dialog as answered-in-part, names the case where it is silent, and cites
   * the pattern page whose requirement this does not yet meet.
   *
   * It is not a sentence, and it was never meant to be one. The sentence
   * lives in `description`, in the product's own words.
   */
  function handleOpenChange(
    next: boolean,
    details: DialogRootChangeEventDetails,
  ): void {
    if (!next && nonDismissing && details.reason === "escape-key") {
      details.cancel()
      focusableIn(actionsRef.current, "last")?.focus()
      return
    }
    onOpenChange(next)
  }

  const hasBody = hasDescription || children !== undefined

  /* The whole tree below the root, written once. The root is the only thing
     `severity` changes, and building the body separately is what keeps that
     true: there is no branch inside here that could drift between the two
     modes, so the alert dialog is the ordinary dialog minus its close control
     and nothing else. */
  const body = (
    <DialogPrimitive.Portal data-slot="dialog">
      {/* Dialog.Scrim. A sibling of the surface it serves and never its child,
          which is nesting rule N2 in `choosing-a-layer`: the scrim sits between
          the dialog and everything below it in the stacking order, not inside
          the dialog's box. It takes the `scrim` rung's own material rather than
          a hand-picked tint, so reduced transparency, increased contrast and a
          browser with no `backdrop-filter` all degrade it the way the token
          source says to and not the way this file guesses.

          It is decorative and it is not the mechanism that blocks the page.
          What blocks it is Base UI's focus manager, and it is worth being exact
          about how, because the word "inert" does less work here than it looks:
          `FloatingFocusManager` calls `markOthers` with `ariaHidden` and leaves
          `inert` at its default of false, so everything outside the portal gets
          `aria-hidden="true"` and NOT the HTML `inert` attribute. A screen
          reader cannot reach the background and the tab ring cannot leave the
          popup, which is the whole of the safety contract this component needs.
          What the platform attribute would add on top is not applied. It would
          add unselectable text behind the scrim, and containment held by the
          browser rather than by focus guards. Overriding the primitive to add
          it means owning behaviour Base UI owns, and that decision has not
          been taken. Dimming, meanwhile, is what the reader sees rather than
          what stops them. */}
      <DialogPrimitive.Backdrop
        data-slot="dialog-scrim"
        className={cn(
          "fixed inset-0",
          "transition-opacity duration-(--opsin-duration-base) ease-opsin-standard",
          "motion-reduce:transition-none",
          "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        )}
      >
        <Surface rung="scrim" className="absolute inset-0">
          {null}
        </Surface>
      </DialogPrimitive.Backdrop>

      {/* Dialog.Viewport. Not in the specification's part tree and added on
          purpose: it is the fixed, full-screen box the container is placed
          inside, and having a real element to place against is what lets the
          dialog sit on the bottom edge of a phone and in the middle of a laptop
          with no transform, no measurement and no JavaScript.

          `pt-opsin-16` is the one deliberate gap at phone width. A surface that
          covers the entire screen is not covering the page "while leaving it
          recognisable", which is the whole job of the rung it is on, and a
          reader needs to see where they will return to. */}
      <DialogPrimitive.Viewport
        data-slot="dialog-viewport"
        className={cn(
          "fixed inset-0 flex items-end justify-center pt-opsin-16",
          "sm:items-center sm:p-opsin-6",
        )}
      >
        {/* Dialog.Container. The popup element, carrying the role, the name and
            the description; the material inside it is a Surface, because one
            element cannot carry both `data-slot="dialog-container"` and
            `data-slot="surface"`.

            `max-h-full` resolves here because the viewport is `fixed inset-0`
            and therefore has a definite height. That is what makes the internal
            scroll below work at 200% text: the dialog stops at the height of
            the screen instead of growing past it with its actions somewhere
            below the fold. */}
        <DialogPrimitive.Popup
          data-slot="dialog-container"
          initialFocus={resolveInitialFocus}
          className={cn(
            "flex max-h-full w-full flex-col overflow-hidden",
            "sm:max-w-(--opsin-measure-tight,45ch)",
            SHAPE,
            MOTION,
            className,
          )}
        >
          <Surface
            rung="sheet"
            className={cn(
              /* THE RUNG IS `sheet` AND THE PAGE SAYS `overlay`. ADR 0014 made
                 the six rung names the token names, and the retired vocabulary
                 the specification was written in put `overlay` on the rung that
                 covers the page while leaving it recognisable. That rung is now
                 called `sheet`. This ladder's `overlay` is chrome that content
                 scrolls beneath, and it is the rung for a pinned toolbar or a
                 tab bar. So mapping the old name by spelling rather than by
                 job would put a modal dialog on the rung built for a tab bar,
                 and it would compile. */
              "flex min-h-0 flex-col rounded-[inherit]",
              /* The safe-area inset goes on the Surface rather than on the
                 popup so the material covers it. Surface's three decorative
                 layers are positioned to `inset-0`, whose containing block is
                 the padding box, so the fill and the edge reach the bottom of
                 the screen instead of stopping above the home indicator. */
              "pb-(--opsin-safe-bottom) sm:pb-0",
              /* Surface owns its content wrapper, so the column that holds the
                 three regions has to be declared from out here. Without the
                 `min-h-0` the wrapper refuses to shrink below its content and
                 the scroll region below never gets a height to scroll in. */
              "[&>[data-slot=surface-content]]:flex",
              "[&>[data-slot=surface-content]]:min-h-0",
              "[&>[data-slot=surface-content]]:flex-col",
            )}
          >
            {/* Dialog.Header is pinned, so the question stays on screen while
                the consequence scrolls. DOM order is visual order: the title
                first, the close control after it, which is what makes reverse
                tab order match what a reader sees. */}
            <div
              data-slot="dialog-header"
              className={cn(
                "flex shrink-0 items-start gap-opsin-3 px-opsin-5 pt-opsin-5",
                /* Every region below this one pads its own foot, so the header
                   only pads its own when it is the last thing in the dialog.
                   That is a title with no consequence, no content and no
                   answer, which is a degenerate dialog rather than an
                   impossible one. */
                hasBody || actions !== undefined ? null : "pb-opsin-5",
              )}
            >
              {/* `wrap-break-word` is not decoration. The popup is
                  `overflow-hidden` on both axes, so a token with no break
                  opportunity in it overflows its line box and is then CLIPPED,
                  with no scrollbar to recover it. That token might be a
                  medication name, an account identifier or a URL. At 200% text
                  the header has around a third of a phone's width left after
                  the padding and the close control double with it, so the
                  token does not have to be long. Losing the end of the
                  dialog's accessible name is content loss rather than a layout
                  blemish. */}
              <DialogPrimitive.Title
                data-slot="dialog-title"
                className="m-0 min-w-0 flex-1 wrap-break-word text-opsin-title3"
              >
                {title}
              </DialogPrimitive.Title>

              {/* Dialog.Close, present on a dialog and absent on an alert one.
                  Base UI's own guidance is to render a close control inside
                  every modal popup so a touch screen reader can escape it, and
                  this is a deliberate departure from it rather than an
                  oversight: on an alert dialog the actions ARE the way out, the
                  development warning above refuses to let one ship without
                  them, and a close control on a surface whose whole contract is
                  "there is no valid went-away outcome" would be a control that
                  contradicts the role it sits inside. */}
              {nonDismissing ? null : (
                <DialogPrimitive.Close
                  data-slot="dialog-close"
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center rounded-opsin-md",
                    /* The floor is carried by the control rather than by the
                       product stylesheet's backstop, because that stylesheet
                       does not travel with this file. It is a rem, so at 200%
                       text it doubles with the glyph instead of pinning at 44
                       device pixels.

                       The `2.75rem` inside the `var()` is the same argument one
                       step further in: `--opsin-target-minimum` is declared only
                       in `app/tokens.generated.css`, which does not travel
                       either, and a bare reference to an undeclared property is
                       invalid at computed-value time. `min-height` would revert
                       to `auto` and this control, the only exit from a modal
                       surface, would lose its floor with no error anywhere. */
                    "min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem)",
                    "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard",
                    "hover:bg-muted",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  )}
                >
                  <X aria-hidden="true" className="size-[1.25em]" />
                  {/* The only reader-facing word this component owns. It takes
                      a prop, for the reason `StatusPill.label` does: a word a
                      product cannot translate is a word some readers cannot
                      read, and this one is the label on their way out. The
                      DEFAULT is still English, which is the gap that remains
                      and is listed on the page rather than settled here. */}
                  <span className="sr-only">{closeLabel}</span>
                </DialogPrimitive.Close>
              )}
            </div>

            {/* Dialog.Body is the scroll region, and the reason the actions
                stay reachable at 200% text. `overscroll-contain` stops a flick
                at the end of the description turning into a scroll of the page
                behind, which is hidden from assistive technology and should
                not move under the reader either. */}
            <div
              data-slot="dialog-body"
              className={cn(
                "min-h-0 overflow-y-auto overscroll-contain",
                hasBody ? "px-opsin-5 pt-opsin-2 pb-opsin-5" : null,
              )}
            >
              {!hasDescription ? null : (
                /* Plain foreground, not the muted role. A muted caption on a
                   translucent surface is the thing this system's own material
                   guidance tells products not to do, and the description is
                   where the consequence of each answer is written. That is
                   the last text on the screen that should be quiet.

                   `wrap-break-word` for the same reason the title carries it:
                   an account identifier or a URL in a consequence has no break
                   opportunity in it, and the popup clips rather than scrolls
                   horizontally. */
                <DialogPrimitive.Description
                  data-slot="dialog-description"
                  className="m-0 wrap-break-word text-opsin-body text-foreground"
                >
                  {description}
                </DialogPrimitive.Description>
              )}
              {children === undefined ? null : (
                <div
                  data-slot="dialog-content"
                  ref={contentRef}
                  className={cn(description === undefined ? null : "mt-opsin-4")}
                >
                  {children}
                </div>
              )}
            </div>

            {/* Dialog.Actions is pinned, in DOM order, least destructive last.
                The gap is `opsin-2`, which is 0.5rem, which is exactly
                `--opsin-target-separation`: two adjacent targets need that much
                between them and this is the one row in the component where it
                is this file's job rather than the caller's. */}
            {actions === undefined ? null : (
              <div
                data-slot="dialog-actions"
                ref={actionsRef}
                className={cn(
                  "flex shrink-0 flex-wrap items-center gap-opsin-2",
                  "px-opsin-5 pt-opsin-2 pb-opsin-5 sm:justify-end",
                )}
              >
                {actions}
              </div>
            )}
          </Surface>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPrimitive.Portal>
  )

  if (nonDismissing) {
    return (
      <AlertDialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        {body}
      </AlertDialogPrimitive.Root>
    )
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      {body}
    </DialogPrimitive.Root>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It is an ordinary dialog, because
 * an ordinary dialog is what almost every product actually needs and the demo
 * should not teach the exception first.
 *
 * The trigger is a plain `button` rather than this system's Button, so that the
 * file a consumer installs depends on Surface and nothing else. It carries the
 * target floor and a focus ring of its own for the same reason.
 *
 * There is not a number anywhere in it. Dialog renders no measurement, so there
 * is no reading here for anybody to mistake for their own.
 */
export default function DialogDemo() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex w-full max-w-sm flex-col items-start gap-opsin-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        /* JOINED RATHER THAN MERGED. `cn` is `twMerge(clsx(…))` and
           tailwind-merge is unconfigured, so it files `text-opsin-body` and
           `text-card-foreground` in one conflict group and keeps only the
           later. That cost this button its type step every time it rendered.
           The two utilities set different CSS properties and both should apply.
           Nothing here needs merging: there is no caller `className` on a demo.
           `sheet.tsx` carries the same note at its close control. */
        className={
          "inline-flex min-h-(--opsin-target-minimum,2.75rem) items-center rounded-opsin-md " +
          "border border-border bg-card px-opsin-4 text-opsin-body text-card-foreground " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        }
      >
        Delete this reading
      </button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this reading?"
        description="It will be removed from your history and from any trends it appears in. This cannot be undone."
        actions={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={cn(
                "inline-flex min-h-(--opsin-target-minimum,2.75rem) items-center rounded-opsin-md",
                "border-2 border-border px-opsin-4 text-opsin-body",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              )}
            >
              Delete reading
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              /* Joined rather than merged, for the reason the first button in
                 this demo gives: `text-opsin-body` and `text-primary-foreground`
                 are one conflict group to an unconfigured tailwind-merge, and
                 only the later of the two survived. */
              className={
                "inline-flex min-h-(--opsin-target-minimum,2.75rem) items-center rounded-opsin-md " +
                "bg-primary px-opsin-4 text-opsin-body text-primary-foreground " +
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              }
            >
              Keep it
            </button>
          </>
        }
      />
    </div>
  )
}
