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
 * SHAPE, and shape is free: at every width this dialog floats inset from all
 * four edges of the screen and rounds all four of its corners, which is what
 * `tokens/shape.json` publishes `radius-xl` for. It does that in CSS, with no
 * prop, no measurement and no change of component, so a modal never wears a
 * docked sheet's silhouette on a phone. The role, the focus trap, the treatment
 * of the background and the dismissal rules are identical on a phone and on a
 * desktop. A dialog never becomes something else.
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
 * ESCAPE IS THE ONE PART BASE UI DOES NOT DO FOR US, AND THIS FILE ANSWERS IT.
 * `useDialogRoot` passes `escapeKey: isTopmost` to `useDismiss` in every mode,
 * alert-dialog included, so an untouched alert dialog closes on Escape and the
 * whole contract is lost on the keyboard. This file cancels that close through
 * the change event's own `cancel()`, so the dialog stays in every
 * configuration, and then moves focus to the popup element itself.
 *
 * Moving focus to the popup is what makes the refusal audible. The popup
 * carries `tabindex=-1`, `role="alertdialog"`, `aria-labelledby` the title and
 * `aria-describedby` the description, so landing focus on it re-announces the
 * question and its consequence on every screen reader, with no live region
 * mounted on the caller's behalf. It fires in the default configuration too,
 * where `initialFocus="safest"` has already put focus on the safest action:
 * the popup is never the element that already has focus, so the announcement
 * happens rather than being the specification no-op that focusing the already
 * focused action would be.
 *
 * Two candidate repairs stay rejected. Focusing the FIRST action points the
 * key at the control that changes something, and a live region is banned
 * outright, because a component never mounts one on the caller's behalf.
 * `patterns/alert-escalation.mdx` asks for the reason to be announced, and the
 * popup's own role and labelling are how that is done here. What the component
 * still does not do is write the product's own sentence about why an answer is
 * needed: those are the product's words, they belong in `description`, and a
 * development warning asks for them.
 *
 * IT IS A CLIENT COMPONENT, and three refs are why. `initialFocus` has to
 * resolve to an ELEMENT, because Base UI takes a ref or a function, never a
 * string: `actionsRef` finds the last control in the actions slot, which is
 * what `initialFocus="safest"` means, and `contentRef` finds the first
 * focusable in the body, which is what `initialFocus="content"` means.
 * `popupRef` is the third, and it is what a refused Escape and a refused scrim
 * press move focus to. Nothing else here is stateful: there is no width
 * observation, no media query listener and no measurement, because the
 * responsive behaviour is a stylesheet's job.
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
import { Button } from "@/registry/base-lyra/ui/button"
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
 * The shape, and why it no longer changes with the viewport.
 *
 * `tokens/shape.json` publishes `radius-xl` as "sheets and dialogs", with the
 * qualifier that it is "applied to the leading edge only when the surface meets
 * a screen edge on the other side". A sheet meets that edge and takes the
 * radius on its leading edge alone. A dialog does not. It floats inset from all
 * four screen edges at every width, phone included, so it takes the radius on
 * all four corners everywhere. That inset is the point. The family doctrine
 * holds that a dialog and a sheet differ by obligation rather than by size, and
 * the four-sided margin together with the four-sided radius is what a reader
 * sees that difference in. A dialog that docked to the bottom edge would wear a
 * sheet's silhouette and lose the one cue that tells a question you must answer
 * apart from a place you may leave.
 *
 * `corner-shape` is a property here rather than the product theme's
 * `data-opsin-shape="squircle"` attribute, for the reason Card gives: the
 * attribute would be a fifth member of a data-attribute vocabulary closed at
 * four, and the stylesheet that reads it does not travel with this file into
 * somebody else's project. An engine without `corner-shape` draws an ordinary
 * rounded corner, which every radius on the ladder is chosen to survive.
 */
const SHAPE =
  "rounded-opsin-xl [corner-shape:var(--opsin-corner-shape)]"

/**
 * The entrance and the exit, and what a reader who asked for less motion gets
 * instead of nothing.
 *
 * The entrance is the dialog's own token pair: `spring-sheet` on its own
 * duration, which is the overdamped curve `tokens/motion.json` publishes for
 * "sheets, dialogs, full-screen pushes". A spring's `linear()` stop list runs
 * from 0 to 1 whatever the spring, so its curve is never crossed with another
 * duration, because that makes a different spring rather than a faster one. The
 * exit takes `ease-exit` on `--opsin-duration-base`, because something leaving
 * accelerates and is shorter than its arrival. The `data-[ending-style]:` pair
 * outranks the base pair on specificity, and both halves move together so the
 * easing is never left behind on the 483ms spring duration.
 *
 * Under reduced motion the transition is NOT removed, and that is a correction
 * of an earlier version that removed it and argued the case in a comment.
 * `health/motion-in-health-ui.mdx` lists this surface's family by name, and its
 * rule 5 says the reduced-motion fallback "is not 'no animation' by default. It
 * is an instant, complete, equally informative state", with a Do of "show the
 * sheet in place with a crossfade of opacity only". So the distance goes and
 * the transition stays: `motion-reduce:transition-opacity` switches the
 * transitioned property to opacity alone, and the phone's travel and the wide
 * screen's scale are pinned to their resting values under the query. A modal
 * that appears between frames trades a vestibular problem for a comprehension
 * one, and the reader most likely to have reduced motion on is the one least
 * able to afford a surface arriving from nowhere.
 *
 * The 120ms of the crossfade is the token layer's, not this file's.
 * `app/tokens.generated.css` collapses `--opsin-duration-spring-sheet` to 120ms
 * and `--opsin-ease-spring-sheet` to `linear` under the query, so the duration
 * and the easing are deliberately not restated here. A consumer who installs
 * this file without that stylesheet loses only the 120ms figure, because the
 * duration is a token; the crossfade itself still happens, because the
 * transition is no longer removed. Depth is then carried by the scrim and by
 * the surface's edge, which is why the specification makes neither optional and
 * why no prop removes them.
 *
 * THE TRAVEL IS A FIXED DISTANCE AND THE SCALE IS A BARE NUMBER, ON PURPOSE.
 * The phone entrance moves the panel by `--opsin-space-4`, a fixed 1rem,
 * written as an arbitrary `translate-y-[var(--opsin-space-4,1rem)]` rather than
 * as `translate-y-4`. The utility form resolved through `--spacing`, which the
 * density attribute scales, so a reader on a denser setting got a shorter
 * entrance for no reason a reader could name: how far a surface travels to
 * arrive is not a function of how tightly that reader packs their lists, and
 * the travel is now identical at every density. The literal fallback rides
 * along because a consumer who runs `shadcn add dialog` gets no token sheet.
 *
 * The wide-screen `scale-95` stays a bare number and is NOT promoted to a
 * token, which is a deliberate departure from the audit's proposed
 * entrance-distance token. `sheet.tsx` settled this in argued prose: the token
 * layer cannot know the DISTANCE or the scale a particular surface should
 * enter by, because that is not a token but the component's own answer. And the
 * scale was never the defect the raw-value finding was really about: Tailwind's
 * scale utilities emit a percentage rather than a multiple of `--spacing`, so
 * `scale-95` is already density-independent and needs no repair. Only the
 * travel was density-coupled, and only the travel changed.
 */
const MOTION = cn(
  "transition-[opacity,translate,scale] duration-(--opsin-duration-spring-sheet) ease-opsin-spring-sheet",
  "data-[ending-style]:ease-opsin-exit data-[ending-style]:duration-(--opsin-duration-base)",
  "motion-reduce:transition-opacity",
  "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
  "data-[starting-style]:translate-y-[var(--opsin-space-4,1rem)] data-[ending-style]:translate-y-[var(--opsin-space-4,1rem)]",
  "motion-reduce:data-[starting-style]:translate-y-0 motion-reduce:data-[ending-style]:translate-y-0",
  "sm:data-[starting-style]:translate-y-0 sm:data-[ending-style]:translate-y-0",
  "sm:data-[starting-style]:scale-95 sm:data-[ending-style]:scale-95",
  "motion-reduce:sm:data-[starting-style]:scale-100 motion-reduce:sm:data-[ending-style]:scale-100",
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
  const popupRef = useRef<HTMLDivElement | null>(null)

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
   * key". So focus moves to the popup element itself. The popup carries
   * `tabindex=-1`, `role="alertdialog"`, `aria-labelledby` the title and
   * `aria-describedby` the description, so moving focus onto it makes every
   * screen reader re-announce the title and the description without this
   * component mounting a live region of its own. That is the response the
   * pattern page asks for: the reason the dialog is still here is spoken
   * again, rather than the key silently doing nothing.
   *
   * Focusing the safest action was the old move, and in the default
   * configuration it was silent: `initialFocus="safest"` has already put focus
   * on the last action, so focusing it again focuses the element that already
   * has focus, which the DOM specification defines as doing nothing. The popup
   * is never the element that already has focus, so the announcement fires in
   * every configuration.
   *
   * The cost is named rather than hidden. Focus leaves the safest action and
   * lands on the container, so a reader who then presses Return activates
   * nothing, and one Tab returns them to the first action. The safest action
   * stays the INITIAL focus: `initialFocus={resolveInitialFocus}` is
   * unchanged, so opening the dialog still lands on the answer that changes
   * nothing. Only a refused Escape moves focus to the container.
   *
   * It is not a sentence, and it was never meant to be one. The sentence
   * lives in `description`, in the product's own words, and the popup's
   * `aria-describedby` is what points a screen reader back at it.
   */
  function handleOpenChange(
    next: boolean,
    details: DialogRootChangeEventDetails,
  ): void {
    if (!next && nonDismissing && details.reason === "escape-key") {
      details.cancel()
      popupRef.current?.focus({ preventScroll: true })
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
        /* A REFUSED SCRIM PRESS KEEPS FOCUS INSIDE THE ALERT DIALOG, and this
           is handled here rather than in `handleOpenChange` because there is no
           change event to answer. `useDialogRoot.mjs:34-69` gates `outsidePress`
           on `isTopmost && !disablePointerDismissal`, and the alert-dialog root
           forces `disablePointerDismissal`, so the predicate returns false, Base
           UI raises no `open` change for a scrim press and there is no refusal
           branch to hook. What the press still does is blur the focused control
           to `body`, leaving the reader's focus outside a modal whose siblings
           are `aria-hidden`, so a screen reader's cursor is on an element the
           tree says is gone. `preventDefault` on `pointerdown` is what stops
           that blur in the first place; the click handler then puts focus back
           on the popup for an engine that focuses on click regardless. The
           popup carries `tabindex=-1`, `role=alertdialog` and its labelling, so
           landing focus on it re-announces the reason the dialog is still here,
           the same recovery the escape-key refusal makes. Both handlers are
           `undefined` on an ordinary dialog, whose scrim press is a valid
           dismissal that closes it and returns focus to its trigger. */
        onPointerDown={
          nonDismissing
            ? (event) => {
                event.preventDefault()
              }
            : undefined
        }
        onClick={
          nonDismissing
            ? () => {
                popupRef.current?.focus({ preventScroll: true })
              }
            : undefined
        }
      >
        <Surface rung="scrim" className="absolute inset-0">
          {null}
        </Surface>
      </DialogPrimitive.Backdrop>

      {/* Dialog.Viewport. Not in the specification's part tree and added on
          purpose: it is the fixed, full-screen box the container is placed
          inside, and having a real element to place against is what lets the
          dialog float inset from the bottom of a phone and sit in the middle of
          a laptop with no transform, no measurement and no JavaScript.

          The phone dialog is inset on all four sides, which is the silhouette
          that tells it apart from a sheet docked to the edge. `pt-opsin-16`
          keeps the largest gap at the top, so a reader sees where they will
          return to and the surface covers the page "while leaving it
          recognisable", which is the whole job of the rung it is on. `px-opsin-4`
          holds it clear of the side edges, and it still rises from the bottom
          where the thumb is, because `items-end` is kept. The bottom inset is
          the larger of `space-4` and the device's safe-area bottom, so the
          floating card clears the home indicator that a docked sheet instead
          covers with its own material.

          `pointer-events-none` is on this box and `pointer-events-auto` on the
          popup inside it, so a press on the dimmed area passes through this
          full-screen sibling to the scrim beneath rather than being swallowed
          here. Without the pair this later, painted-on-top box hit-tests every
          press over the dim, the scrim's own handlers never fire, and a refused
          scrim press on an alert dialog blurs focus to `body`. It is the same
          pairing `sheet.tsx` uses to make tap-to-dismiss work at all. */}
      <DialogPrimitive.Viewport
        data-slot="dialog-viewport"
        className={cn(
          "pointer-events-none fixed inset-0 flex items-end justify-center px-opsin-4 pt-opsin-16",
          "pb-[max(var(--opsin-space-4,1rem),var(--opsin-safe-bottom,0px))]",
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
          ref={popupRef}
          initialFocus={resolveInitialFocus}
          className={cn(
            "pointer-events-auto flex max-h-full w-full flex-col overflow-hidden",
            "sm:max-w-(--opsin-measure-tight,45ch)",
            SHAPE,
            MOTION,
            className,
          )}
        >
          <Surface
            rung="sheet"
            className={cn(
              /* THE RUNG IS `sheet`, AND `overlay` IS WHAT A READER OF AN OLDER
                 DESIGN FILE WILL EXPECT HERE. ADR 0014 made
                 the six rung names the token names, and the retired vocabulary
                 the specification was written in put `overlay` on the rung that
                 covers the page while leaving it recognisable. That rung is now
                 called `sheet`. This ladder's `overlay` is chrome that content
                 scrolls beneath, and it is the rung for a pinned toolbar or a
                 tab bar. So mapping the old name by spelling rather than by
                 job would put a modal dialog on the rung built for a tab bar,
                 and it would compile. */
              "flex min-h-0 flex-col rounded-[inherit]",
              /* No safe-area inset on the Surface any more. It was there to make
                 a docked surface's material reach under the home indicator,
                 because Surface's three decorative layers are positioned to
                 `inset-0` so the fill and the edge stopped above the indicator
                 otherwise. This dialog floats inset from every screen edge, so
                 it never meets the bottom edge and never covers the home
                 indicator in the first place. The viewport's bottom inset holds
                 the whole card clear of it instead. */
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
                /* The dialog insets use the fixed px-opsin-5 token here and in
                   the body and footer below, deliberately, so they hold 20px at
                   every [data-density] setting rather than tracking the
                   density-scaled p-5 that Card uses. A modal takes its measure
                   from the viewport, not from the surrounding document, and a
                   reader who asks for a denser list has not asked to shrink the
                   only exit from a destructive confirmation. This is why Dialog
                   is not among the surfaces moved onto the scaled scale. */
                "flex shrink-0 items-start gap-opsin-3 px-opsin-5 pt-opsin-5",
                /* THE HEADER RESERVES ONE HEIGHT FOR BOTH SEVERITIES, so the
                   description starts at the same offset whether or not a close
                   control is rendered. Without this floor an ordinary dialog's
                   header was the close control's target height plus the top
                   inset while an alert dialog's was only its title, so the same
                   component looked looser or tighter by the height of the
                   control the reader could not even see, which is a difference
                   they have no reason to meet. The floor is the top inset
                   (`space-5`) plus one close target (`target-minimum`) less the
                   `space-2` the control overhangs upward, which is exactly the
                   room the lifted control below occupies, so the two numbers
                   move together and must stay in step: change the control's
                   `-mt-opsin-2` and this term follows it. The calc is spelled
                   in tokens rather than in one measured constant so a later
                   change to any of the three tracks the header, and each `var`
                   carries its own literal fallback for the reason the close
                   control's floor argues, because the properties live only in
                   `app/tokens.generated.css`, which a `shadcn add` consumer does
                   not get, and a bare reference to an undeclared one is invalid
                   at computed-value time. */
                "min-h-[calc(var(--opsin-space-5,1.25rem)_+_var(--opsin-target-minimum,2.75rem)_-_var(--opsin-space-2,0.5rem))]",
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
                  /* JOINED, NOT run through cn, and the join is the fix rather
                     than a style, the same one sheet.tsx makes and for the same
                     reason. `cn` is `twMerge(clsx(…))` and tailwind-merge is
                     unconfigured: it has never been told that `--text-opsin-*`
                     is a font-size namespace, so it files `text-opsin-callout`
                     and `text-foreground` in the SAME conflict group and
                     keeps only the later one, which silently costs this control
                     its type step. The two utilities set different CSS
                     properties, so passing both through applies both. There is
                     no caller `className` on this control, so nothing is lost by
                     not merging. */
                  className={
                    /* THE LIFT AND THE PULL align the control's ink to the
                       title rather than to the corner of its own hit box. The
                       control is a 44px target with its content centred, so
                       top-aligned in the header its word and glyph sit below the
                       title's first line by half the difference between the
                       target and the title's line box. `-mt-opsin-2` raises the
                       hit box into the top inset so the centred ink shares the
                       title's first-line band, and the header's own floor above
                       is written to expect exactly this overhang. `-mr-opsin-2`
                       cancels the control's own `px-opsin-2`, so the ink meets
                       the same inset from the panel edge that the title keeps on
                       the other side rather than sitting a control's padding
                       further in. The 44px hit area is unchanged: the negative
                       margins move the box, not its size. */
                    "-mt-opsin-2 -mr-opsin-2 " +
                    "inline-flex shrink-0 items-center justify-center gap-opsin-1 rounded-opsin-sm px-opsin-2 " +
                    /* The word rides beside the glyph at the `callout` step in
                       the full foreground role, which is the recipe Sheet moved
                       to. Footnote in a muted grey made this word the smallest,
                       lowest-contrast thing on the surface, and that role's
                       declared use is provenance rather than a control. It stays
                       quieter than the footer's primary action and is not raised
                       to Button's `headline` step, so a reader who learned Close
                       on a sheet meets the same weight on the one surface that
                       decides whether a reading is deleted. The hover feedback is
                       a muted background rather than an ink change, because the
                       ink is already the foreground. */
                    "text-opsin-callout text-foreground " +
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
                    "min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem) " +
                    "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
                    "hover:bg-muted " +
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  }
                >
                  <X aria-hidden="true" className="size-[1em] shrink-0" />
                  {/* The reader-facing word this component owns, now visible
                      rather than hidden behind the glyph. It takes a prop, for
                      the reason `StatusPill.label` does: a word a product cannot
                      translate is a word some readers cannot read, and this one
                      is the label on their way out. A reader who mis-taps on the
                      one modal that decides whether a reading is deleted has to
                      be able to see, and to say, what the control does. The
                      DEFAULT is still English, which is the gap that remains and
                      is listed on the page rather than settled here. */}
                  {closeLabel}
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
                The gap is `--opsin-space-4`, which is 1rem, and it is
                deliberately twice the published separation floor. That floor is
                0.5rem, and tokens/space.json scopes it to two adjacent targets
                whose visible boxes are smaller than 44px, which these are not.
                This row takes double it anyway, because the component's own
                ordering rule sets the answer that changes something immediately
                before the answer that changes nothing, and a reader aiming for
                the safe one must not land on the irreversible one instead. The
                literal `1rem` fallback rides along because the token sheet does
                not travel with this file: a consumer who runs `shadcn add
                dialog` gets no `--spacing-opsin-*`, so a Tailwind space-step
                gap utility would have resolved to zero on install and set the
                two answers touching.

                Below `sm` the row becomes a column and each answer fills the
                panel's content box, so on the phone most readers hold neither
                action is a narrow pill stranded mid panel and both are a thumb
                width target. Above `sm` it is a right aligned row again, and
                `flex-wrap` moves behind the `sm:` prefix rather than being
                deleted, so two long labels still wrap instead of overflowing a
                45ch panel. button.tsx warns that two full width buttons stacked
                read as two primary actions, and that warning does not apply
                here: the two answers are separated by variant weight, not by
                width, because primary carries an opaque fill while secondary
                and destructive carry a boundary and no fill, and the ordering
                rule above fixes which answer is which. Width is therefore free
                to carry reachability rather than hierarchy. `[&>*]:w-full` does
                not fight a caller who passed `<Button fullWidth>`: fullWidth
                emits the same `w-full` on the element itself.

                THE ROW CARRIES ITS OWN SIZE FLOOR, and it is the first thing in
                the system to render `--opsin-target-comfortable`. The component
                asserted no floor on its answers, so a caller who passed an
                undersized control set the target size on the one surface where a
                mis-tap is irreversible. `[&>*]:min-h-(...)` floors every child at
                48px, which is what tokens/space.json calls the default for a
                primary action, rather than the 44px minimum the product backstop
                applies to any tappable box. Not `generous` at 56px: space.json
                reserves that for a SINGLE primary action, and a dialog has two
                answers, so `comfortable` is the reading the token actually
                licenses. The `3rem` fallback rides along for the reason the
                close control's own floor argues about `--opsin-target-minimum`:
                the property is declared only in app/tokens.generated.css, which a
                `shadcn add` consumer does not get, and a bare reference to an
                undeclared property is invalid at computed-value time, so
                `min-height` would revert to `auto` and the floor would vanish
                with no error. Its specificity is a class plus the universal
                selector, which outranks the element-selector backstop in
                product.css. The row floors every answer at 48px and a caller
                cannot render one shorter, which is the whole point on this
                surface: `min-height` beats a smaller `height` by definition, so
                an undersized control is lifted to the floor rather than left
                below it. A caller who wants a TALLER control still gets it,
                because the row sets a minimum and not a height. */}
            {actions === undefined ? null : (
              <div
                data-slot="dialog-actions"
                ref={actionsRef}
                className={cn(
                  "flex shrink-0 flex-col items-stretch gap-(--opsin-space-4,1rem)",
                  "sm:flex-row sm:flex-wrap sm:items-center sm:justify-end px-opsin-5 pt-opsin-2 pb-opsin-5",
                  "[&>*]:w-full sm:[&>*]:w-auto",
                  "[&>*]:min-h-(--opsin-target-comfortable,3rem)",
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
 * IT USES THE REAL `Button` for the trigger and both actions, which is why
 * `button` sits in this component's `registryDependencies` even though `Dialog`
 * itself never imports it. An earlier version hand-rolled all three controls so
 * the file a consumer installs would depend on Surface and nothing else. That
 * argument lost, and it lost the way it did for `sheet.tsx`: a demo that styles
 * its own `button` teaches, in the one file a consumer reads first, that an
 * action is a styled element rendered a weight lighter than any real Button, and
 * it teaches it on the surface that decides whether a reading is deleted. The
 * extra dependency is cheaper than that lesson.
 *
 * There is not a number anywhere in it. Dialog renders no measurement, so there
 * is no reading here for anybody to mistake for their own.
 */
export default function DialogDemo() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex w-full max-w-sm flex-col items-start gap-opsin-4">
      <p className="m-0 text-opsin-footnote text-muted-foreground">
        The dialog portals to the end of the document, so it covers the whole
        page rather than this frame. Close it with the close control in its
        header, with the escape key, or by tapping the dimmed area.
      </p>

      <Button variant="secondary" onClick={() => setOpen(true)}>
        Delete this reading
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this reading?"
        description="It will be removed from your history and from any trends it appears in. This cannot be undone."
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Delete reading
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Keep it
            </Button>
          </>
        }
      />
    </div>
  )
}
