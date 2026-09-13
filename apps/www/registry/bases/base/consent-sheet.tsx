"use client"

/**
 * ConsentSheet is one permission, asked once, with refusing exactly as easy as
 * agreeing.
 *
 * THERE IS NO CONSENT WORDING IN THIS FILE AND THERE NEVER WILL BE. Not a
 * default heading, not a purpose sentence, not a data category, not a retention
 * period, not a jurisdiction, not a regulator, not a lawful basis, and not the
 * words on the two controls. Every string a reader sees here arrives as a prop.
 * A consent sentence is a legal statement with somebody's name behind it, and a
 * design system has neither a legal owner nor a reader; a sentence shipped from
 * here would arrive in a product whose author never read it, describing a use
 * that product may not have and omitting one it does. It would arrive
 * looking reviewed, because it came from a library. `disclaimer-note.tsx` makes
 * the same refusal about the same class of text and for the same reason.
 *
 * SO THE MISSING CASE REFUSES TO ASK. Every other component in this system
 * renders an absence and carries on. This one withholds the decision controls
 * entirely when any of the wording a consent record needs is missing, and says
 * on screen that nothing was asked. That is a harder failure than the rest of
 * the system's and it is deliberate: the alternative is a stored record saying
 * somebody agreed to something the interface never told them, which is the one
 * outcome that cannot be undone afterwards. It fails towards no consent, and no
 * consent is a state every product using this component has to support anyway,
 * because refusal is a real option.
 *
 * REFUSING IS EXACTLY AS EASY AS AGREEING, BY CONSTRUCTION RATHER THAN BY
 * CONVENTION. The two controls are the same component, the same variant, the
 * same size, the same width and the same height, adjacent in the tab order,
 * separated by `--opsin-target-separation`, and neither is focused on open.
 * There is no `variant` prop on either, no `acceptClassName`, no `emphasis`, no
 * `primaryAction`, and no way to reach one of them from outside. Every one of
 * those, offered anywhere, has been used to shrink the refusal. The one
 * remaining route is a descendant selector smuggled through `className`, and a
 * development-only measurement below reports it rather than pretending the hole
 * is closed.
 *
 * IT ASKS ONE QUESTION. There is no `purposes` array and no per-item switch,
 * because a sheet that can carry three purposes will carry three purposes under
 * one control the first time a deadline is close. Three permissions are three
 * sheets, each shown when it becomes relevant. That is what
 * `health/consent-and-disclosure` rule 1 asks for and what makes a partial yes
 * expressible at all.
 *
 * IT EXTENDS Sheet AND INHERITS `open`/`onOpenChange` UNCHANGED (ADR 0021).
 * The specification says "extends Sheet" and declares neither prop, so as
 * written this component could not be opened. It is not repaired by declaring a
 * second copy here: `ConsentSheetProps` extends `SheetProps` with the three
 * members this component supplies itself removed, and everything else passes
 * through with the meaning Sheet's own page gives it. That is the open pair,
 * `detents`, `modal`, `dismissible` and `className`.
 *
 * CLOSING IS NOT DECIDING, AND IT IS NOT REFUSING EITHER. `onDecision` fires
 * only when a reader presses one of the two controls. A close by the escape
 * key, the scrim, a drag or the header's close control calls nothing at all,
 * and the product learns about it through `onOpenChange`, which is Sheet's and
 * carries the route. The absence of a call is the absence of a decision; there
 * is no third value on `granted` because a boolean that could also mean "did
 * not answer" is a boolean somebody will store as `false`, and a refusal
 * nobody made is a record about a person that is not true.
 *
 * IT IS A CLIENT COMPONENT, and every one of these is independently sufficient:
 * it holds the disclosure state for the full text, it attaches two click
 * handlers, it reads layout in development to check the two controls match, and
 * it renders Sheet, which is `"use client"` because it portals, traps focus and
 * listens for a drag.
 */

import { ChevronDown } from "lucide-react"
import { useEffect, useId, useRef, useState, type ReactNode } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/base-lyra/ui/button"
import { Sheet, type SheetProps } from "@/registry/base-lyra/ui/sheet"

/**
 * Development warnings, said once per distinct offender.
 *
 * Nothing this file complains about has an `OpsinErrorCode`. The codes in
 * `tokens/errors.json` are a versioned contract describing mistakes a consumer
 * makes with the CLINICAL API, and the errors page is generated from that file,
 * so a component may not mint one. What is borrowed is the policy rather than
 * the registry: `tokens/errors.json` fires a warning once per offending call
 * site, because a complaint repeated on every render teaches nothing and buries
 * the next one. Four other files in this directory carry the same twelve lines
 * for the same reason; the repair belongs in `lib/opsinjs.ts`, which is not
 * this component's file to edit, and it is reported here rather than fixed
 * quietly.
 */
const warned = new Set<string>()

/**
 * Bounded, because several of the keys below carry a consent id or a label and
 * a development session runs for days. Sixteen distinct complaints means the
 * report has been made several times over; going quiet beats growing without
 * limit.
 */
const MAX_WARNED_KEYS = 16

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key) || warned.size >= MAX_WARNED_KEYS) return
  warned.add(key)
  try {
    console.warn(message)
  } catch {
    /* A patched console is not a reason to take a health product down. */
  }
}

/**
 * The focus ring, declared here rather than inherited.
 *
 * `app/product.css` gives every `:focus-visible` an outline and that file does
 * not travel with this one into a consumer's project. The disclosure control
 * below is the only element in this file that is not a `Button`, so it is the
 * only one that would lose its ring silently. It sits on a surface where a
 * keyboard reader most needs to know where they are.
 */
const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

/**
 * How far apart the two decision controls may measure before this file says so.
 *
 * One CSS pixel of slack, because `getBoundingClientRect` returns fractions and
 * two boxes laid out by the same grid track can differ in the last decimal
 * place on a fractional device pixel ratio. It is a rounding allowance and not
 * a tolerance for a real difference: anything a reader could see is far larger
 * than this.
 */
const SAME_SIZE_SLACK = 1

/**
 * Decline labels that name no outcome.
 *
 * The page is explicit: "never label the decline control *not now* when it
 * means *no*, or *maybe later* when there is no later". The reason is that a
 * screen reader can list every control on a surface with no sentence around
 * them. In that list a postponement and a refusal are not the same choice, and
 * only one of them is an answer to the question that was asked. This is a
 * warning and never a refusal: only the product knows whether there genuinely
 * is a later, and a component that blocked the word would be writing consent
 * copy by veto.
 */
const POSTPONING_DECLINE_LABELS = [
  "not now",
  "maybe later",
  "later",
  "ask me later",
  "remind me later",
  "skip",
  "skip for now",
  "cancel",
  "close",
  "no thanks",
]

/**
 * Accept labels that name no outcome.
 *
 * *Continue* is the one that matters: an accept control that is also the way
 * forward is the *agree that is also continue* the specification names as a way
 * of collecting a decision nobody made. The others are the family it travels
 * in. They are words that describe pressing the button rather than what
 * pressing it does.
 */
const UNNAMED_ACCEPT_LABELS = [
  "ok",
  "okay",
  "continue",
  "next",
  "done",
  "got it",
  "accept",
  "agree",
  "i agree",
  "allow",
  "enable",
  "confirm",
  "yes",
]

/**
 * Whether a string actually arrived with words in it.
 *
 * `typeof` first because this file ships as source into JavaScript projects,
 * where a required `string` is advice and `.trim()` on whatever turned up is a
 * crash rather than a warning. A whitespace-only string is how consent copy
 * actually goes missing, and it must count as missing rather than as supplied.
 * That happens with a translation table with a row nobody filled in, or a
 * content service returning an empty field for a locale.
 */
function isSupplied(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== ""
}

/** Case- and punctuation-insensitive, for comparing a label against a list. */
function plainLabel(value: string): string {
  return value.toLowerCase().replace(/[.…!?:;,\s]+$/u, "").trim()
}

/**
 * What is collected, who sees it, and how long it is kept.
 *
 * Three sentences the product writes, not three values this component labels.
 * There is no `collectedLabel`, no heading above the list and no visually
 * hidden term in front of each row, because every one of those would be an
 * English word opsinjs had chosen for a sheet whose entire content is somebody
 * else's legal statement. Each field is a whole statement in the
 * reader's own language, and the field name says what belongs in it.
 */
export interface ConsentScope {
  /**
   * What is collected, in the reader's words, as a complete sentence. Name the
   * data rather than the mechanism: what a reader wants to know is which of
   * their readings this is about, not that it will be "processed".
   */
  collected: string
  /**
   * Who can see it, as a complete sentence. Name them. "our partners" is not
   * an answer, and a reader cannot decide about a recipient they cannot name.
   */
  sharedWith: string
  /**
   * How long it is kept and what happens at the end, as a complete sentence.
   * Name a period or a condition the reader could check for themselves; a
   * pointer to a retention policy is a pointer to a document nobody will open.
   */
  retention: string
}

/**
 * What the product must store. The component produces it; it never stores it.
 *
 * There is no `withdrawn`, no `expired` and no `notAsked` here, and their
 * absence is deliberate rather than an omission: those are states of a consent
 * over its life, held by whatever the product stores this in, and a record
 * handed back at the moment of a decision cannot describe what happened to it
 * afterwards.
 */
export interface ConsentDecision {
  /** True when the reader pressed the accept control, false when they pressed decline. */
  granted: boolean
  /** ISO timestamp, taken at the moment the control was pressed. */
  at: string
  /** Stable id of the consent being asked for, exactly as it was passed in. */
  consentId: string
  /**
   * Version of the text that was actually shown. Without it the product cannot
   * later say what the person agreed to, and a consent record that cannot
   * answer that question is not evidence of anything.
   */
  textVersion: string
  /**
   * The scope as it was shown, carried through unchanged. It is here because
   * the specification says the record is "a decision, a timestamp, the
   * identifier and version of the text that was shown, and the scope consented
   * to", and the interface it declares had four of those five. A version id
   * resolves to the scope only for a product that kept every version it ever
   * published; this makes the answer part of the record itself.
   */
  scope: ConsentScope
}

/**
 * The optional full text, and the label of the control that reveals it.
 *
 * BOTH HALVES TOGETHER, which is the shape `DisclaimerNote.more` uses and for
 * the same reason. A panel with no label needs one invented here, and the label
 * a design system would invent is *terms*, *details* or *learn more*. That is
 * the exact class of name the specification refuses, in the one list a screen
 * reader can read with no sentence around it.
 */
export interface ConsentDetails {
  /**
   * What the control that reveals the text is called, in the reader's language.
   * Name what is behind it rather than the act of opening it: a control called
   * only *terms* or *details* names nothing, and a screen reader's list of
   * controls is where that costs somebody the thing they were looking for.
   */
  label: string
  /** The full text itself. Rendered in place, never behind a link to elsewhere. */
  content: ReactNode
}

export interface ConsentSheetProps
  extends Omit<SheetProps, "title" | "children" | "footer"> {
  /**
   * Stable id of the consent being asked for. It is not shown to the reader; it
   * is what a product's own record is keyed on, and it is required because a
   * decision with nothing to attach it to is not a record.
   */
  consentId: string
  /**
   * The version of the wording on this sheet. Change it whenever any of the
   * text changes, and never reuse one: a consent record with no version cannot
   * answer the only question anybody will ever ask of it, which is what the
   * person actually read.
   */
  textVersion: string
  /**
   * What is being asked, phrased as a question the reader can answer yes or no
   * to. It is the sheet's accessible name and its visible heading. The two are
   * the same element, which is why there is no separate `title`.
   */
  heading: string
  /**
   * What the data is for, in one or two sentences, in terms of what the reader
   * gets rather than what the product does internally. One decision per sheet:
   * bundling is a design error rather than a prop, so there is no array here
   * and no way to make this the introduction to a list of switches.
   */
  purpose: string
  /** What is collected, who can see it and how long it is kept. Rendered as a list. */
  scope: ConsentScope
  /**
   * Where the reader can change this decision later, as a sentence in their own
   * language. Required, and the sheet will not ask without it: a consent with no
   * exit is not revocable whatever the copy says.
   *
   * It renders as text and is deliberately not turned into a link. A string is
   * not a destination, and the doctrine's answer is that revocation lives where
   * the data lives rather than inside the sheet that asked for it. So what
   * belongs here is the sentence that tells the reader where to go, and the
   * control belongs on the screen showing the data.
   */
  withdrawalPath: string
  /**
   * The full wording, disclosed in place behind a named control, for the reader
   * who wants all of it. Omitted, no control is drawn: an empty disclosure is a
   * promise of more that there is no more of.
   */
  details?: ConsentDetails
  /**
   * What the reader loses by declining, stated before they choose. Optional,
   * because opsinjs cannot know whether a product still works after a refusal.
   * It is required by the doctrine whenever it does not. If refusing breaks
   * something the reader came for, this is where they are told, and they are
   * told before the controls rather than in a confirmation afterwards.
   */
  consequenceOfDeclining?: string
  /**
   * The word on the accept control. Required, with no default anywhere in this
   * file, and there is no fallback if it is blank.
   *
   * Name the outcome rather than the press: a label that begins with the
   * reader's own word for yes and then says what will happen is an answer, and
   * one that only describes pressing the button is not. A generic label raises
   * a development warning and is rendered exactly as written. Only the product
   * knows what it is agreeing to, and a component that rewrote the word would be
   * writing consent copy.
   */
  acceptLabel: string
  /**
   * The word on the decline control. Required, and it carries the same weight as
   * `acceptLabel` in every dimension this component controls: there is no
   * `hideDecline`, no `declineVariant`, and no way to make this one quieter.
   *
   * Name the outcome it refuses, in the same shape and at about the same length
   * as the accept label. A word that postpones rather than answers raises a
   * development warning, because in a screen reader's list of controls a
   * postponement and a refusal are not the same choice.
   */
  declineLabel: string
  /**
   * Called when the reader presses one of the two controls, and at no other
   * time. Closing the sheet without pressing either calls nothing: it is not a
   * refusal, and it is certainly not consent.
   *
   * The component does not close itself afterwards. `open` is the caller's, as
   * it is on every Sheet, so a product can show what happens next before the
   * surface goes away.
   */
  onDecision: (decision: ConsentDecision) => void
}

export function ConsentSheet({
  consentId,
  textVersion,
  heading,
  purpose,
  scope,
  withdrawalPath,
  details,
  consequenceOfDeclining,
  acceptLabel,
  declineLabel,
  onDecision,
  ...sheet
}: ConsentSheetProps) {
  const detailsId = useId()
  const detailsTriggerId = useId()
  const decisionsRef = useRef<HTMLDivElement | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [openLastRender, setOpenLastRender] = useState(sheet.open)

  /* THE DISCLOSURE RESETS ON EVERY OPEN, and it is the same argument Sheet
     makes for returning to its first detent. A consent asked twice must be the
     same consent both times: a sheet that reopened with the full wording
     already expanded because the reader opened it last week is a sheet whose
     shape depends on something they cannot see, and one that reopened collapsed
     after they expanded it would lose their place mid-read. Reset is the
     version that is the same for everybody, every time.

     Adjusted during the render that notices the change rather than in an
     effect, which is React's own answer for state derived from a prop: an
     effect would commit the sheet with the panel still open, paint it, and then
     correct it. */
  if (openLastRender !== sheet.open) {
    setOpenLastRender(sheet.open)
    if (sheet.open) setDetailsOpen(false)
  }

  /* EVERYTHING A CONSENT RECORD NEEDS, CHECKED AS WORDS RATHER THAN AS TYPES.
     Each of these is `string` in the interface and every one of them arrives at
     runtime from a content service, a translation table or a `&&` branch, where
     `string` is advice. The list is not a style rule: without the heading there
     is no question, without the purpose it is not informed, without a scope
     fact the reader has not been told who sees it, without the withdrawal path
     it is not revocable, without both labels the pair cannot be equal, and
     without the id and the version the record cannot say what was agreed. Miss
     one and this sheet does not ask. */
  const missing: string[] = []
  if (!isSupplied(consentId)) missing.push("consentId")
  if (!isSupplied(textVersion)) missing.push("textVersion")
  if (!isSupplied(heading)) missing.push("heading")
  if (!isSupplied(purpose)) missing.push("purpose")
  if (!isSupplied(scope?.collected)) missing.push("scope.collected")
  if (!isSupplied(scope?.sharedWith)) missing.push("scope.sharedWith")
  if (!isSupplied(scope?.retention)) missing.push("scope.retention")
  if (!isSupplied(withdrawalPath)) missing.push("withdrawalPath")
  if (!isSupplied(acceptLabel)) missing.push("acceptLabel")
  if (!isSupplied(declineLabel)) missing.push("declineLabel")

  const askable = missing.length === 0

  if (!askable) {
    warnDev(
      `unaskable:${String(consentId)}:${missing.join(",")}`,
      `[opsinjs] <ConsentSheet> was rendered without ${missing.join(", ")}, so it ` +
        "did not ask and drew no decision controls. opsinjs ships no consent " +
        "wording. It ships no heading, no purpose, no scope, no retention " +
        "period and no words for the two controls, because every one of them " +
        "is a legal statement with an owner, and a design system is not it. " +
        "Every item on " +
        "that list is something a stored consent record has to be able to name; " +
        "a whitespace-only string counts as missing, which is how a locale " +
        "nobody filled in reaches this check.",
    )
  }

  if (isSupplied(declineLabel) && POSTPONING_DECLINE_LABELS.includes(plainLabel(declineLabel))) {
    warnDev(
      `decline-postpones:${plainLabel(declineLabel)}`,
      `[opsinjs] <ConsentSheet> has a decline control labelled "${declineLabel}", ` +
        "which postpones rather than answers. A screen reader can list every " +
        "control on a surface with no sentence around them, and in that list a " +
        "postponement is not a refusal. Name the outcome. Say something like " +
        "\"no, do not share them\", unless there genuinely is a later, in which " +
        "case this word is the right one and this warning is noise. It was " +
        "rendered as written.",
    )
  }

  if (isSupplied(acceptLabel) && UNNAMED_ACCEPT_LABELS.includes(plainLabel(acceptLabel))) {
    warnDev(
      `accept-unnamed:${plainLabel(acceptLabel)}`,
      `[opsinjs] <ConsentSheet> has an accept control labelled "${acceptLabel}", ` +
        "which names the press rather than what it agrees to. \"continue\" " +
        "in particular makes agreement the way forward, which is the shape this " +
        "component exists to refuse. Name the outcome, in the reader's own " +
        "language. It was rendered as written.",
    )
  }

  if (
    isSupplied(acceptLabel) &&
    isSupplied(declineLabel) &&
    plainLabel(acceptLabel) === plainLabel(declineLabel)
  ) {
    warnDev(
      `labels-identical:${plainLabel(acceptLabel)}`,
      "[opsinjs] <ConsentSheet> was given the same word for accept and decline. " +
        "The two controls are identical in every dimension this component " +
        "controls, so the words are the only thing telling them apart, and two " +
        "of the same word is a coin toss with a record attached.",
    )
  }

  /* THE EQUAL-WEIGHT PROMISE, MEASURED RATHER THAN ASSERTED.
     The pair is equal by construction: one grid, two tracks, one component, one
     variant, one size. The single route left open is a descendant selector
     passed through `className`.
     `[&_[data-slot=consent-sheet-decline]_button]:…` reaches the refusal and
     nothing in the type system can see it. Rather than
     claim a hole is closed, this reads the two boxes back after layout and says
     so when they differ.

     Development only, once per open, and after paint: `useEffect` runs when the
     browser has laid the sheet out, which is the only moment either box has a
     size. It reads the controls out of the row by `data-slot` rather than
     holding a ref to each, because `Button` pins its own `data-slot` after the
     spread and cannot carry one of ours. The slot lives on the cell around it,
     which is what the anatomy on the page says. */
  useEffect(() => {
    if (!isDevelopment() || !sheet.open || !askable) return
    const row = decisionsRef.current
    if (!row) return

    const controls = row.querySelectorAll<HTMLElement>('[data-slot="button"]')
    if (controls.length !== 2) return

    const first = controls[0]?.getBoundingClientRect()
    const second = controls[1]?.getBoundingClientRect()
    if (!first || !second) return

    const widthGap = Math.abs(first.width - second.width)
    const heightGap = Math.abs(first.height - second.height)
    if (widthGap <= SAME_SIZE_SLACK && heightGap <= SAME_SIZE_SLACK) return

    warnDev(
      `unequal:${String(consentId)}`,
      "[opsinjs] <ConsentSheet> measured its two decision controls at different " +
        `sizes: ${Math.round(widthGap)}px apart in width and ` +
        `${Math.round(heightGap)}px in height. This component renders them as one ` +
        "component in one grid with one variant, so a difference means something " +
        "reached them from outside. That is almost always a descendant selector in " +
        "`className`. The visual hierarchy of the two controls is the real " +
        "question being asked, and it is not a neutral one.",
    )
  }, [sheet.open, askable, consentId, acceptLabel, declineLabel])

  function decide(granted: boolean): void {
    /* Read at the moment the control is pressed, inside an event handler, so
       there is no clock in the render path and nothing for the server and the
       client to disagree about. */
    onDecision({
      granted,
      at: new Date().toISOString(),
      consentId,
      textVersion,
      scope,
    })
  }

  return (
    <Sheet
      {...sheet}
      /* THE HEADING IS THE SHEET'S TITLE, WHICH IS WHY THERE IS NO `title`.
         The specification renames Sheet's `title` to `heading` and keeps both
         in the same tree, which as a TypeScript `extends` would produce a modal
         surface with two names. One would be announced and one read. Sheet's
         title is an `<h2>` that Base UI points the popup's `aria-labelledby`
         at, so handing it the heading makes the visible question and the
         accessible name the same string, once. That is also what satisfies
         "focus moved to the heading on open" without any focus handling here:
         Sheet moves focus to the popup, the popup is named by this element,
         and the heading is what a screen reader reads on arrival. */
      title={heading}
      footer={
        askable ? (
          <div
            ref={decisionsRef}
            data-slot="consent-sheet-decisions"
            /* A TWO-TRACK GRID, AND IT NEVER COLLAPSES TO ONE.
               Grid tracks are equal by default and grid rows stretch, so the
               two cells are the same width and the same height whatever length
               the two labels are. That is the whole contract, held by the
               layout rather than by a rule somebody has to remember. A wrapping
               flex row would have given them different heights on the line they
               wrapped, and stacking them would have made one of them the one
               under the thumb: at 200% text the labels wrap and both controls
               grow taller together, which is the trade this takes and the page
               states.

               The gap is the target-separation token rather than a space step.
               They are the same 0.5rem today; the token is the one that means
               "two adjacent 44pt targets", so it is the one that will follow if
               the separation rule ever changes. The literal fallback is in the
               class because the variable is declared in this repository's
               product stylesheet and a consumer who copies this file in with
               `shadcn add` does not get that stylesheet: a bare read resolves
               to nothing, `gap` falls back to 0, and decline and accept end up
               touching on the surface where a mis-tap costs the most. */
            className="grid w-full grid-cols-2 gap-(--opsin-target-separation,0.5rem)"
          >
            {/* DECLINE IS FIRST IN THE DOM AND SO IS FIRST IN THE TAB ORDER,
                which is the order the specification's own worked example writes:
                the refusal as a full-size control, and the agreement beside it
                rather than above it. Some order has to exist and there is no
                neutral one; this is the one the page chose, and there is no
                `order` prop, because an order prop is a way of putting accept
                under the thumb that a review would never catch. */}
            <div data-slot="consent-sheet-decline" className="min-w-0">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                className="h-full"
                onClick={() => decide(false)}
              >
                {declineLabel}
              </Button>
            </div>
            <div data-slot="consent-sheet-accept" className="min-w-0">
              {/* THE SAME VARIANT AS DECLINE, AND `primary` IS REFUSED. A
                  filled accept beside an outlined decline is the whole dark
                  pattern in one prop, and it is also the one thing the page's
                  accessibility contract rules out by name: the difference
                  between the two is their words, not their fills, and the sheet
                  has to be usable in greyscale. */}
              <Button
                variant="secondary"
                size="md"
                fullWidth
                className="h-full"
                onClick={() => decide(true)}
              >
                {acceptLabel}
              </Button>
            </div>
          </div>
        ) : (
          /* Unlovely on purpose, and in the place the controls would have been.
             An author who sees this line supplies the wording; a reader who
             sees it has been told that nothing was asked, rather than being
             asked a question with pieces of it missing. */
          <p
            data-slot="consent-sheet-decisions-missing"
            className="m-0 text-opsin-body"
          >
            Nothing has been asked here. Some of the wording this sheet needs was
            not supplied, so there is nothing to decide and nothing has been
            recorded.
          </p>
        )
      }
    >
      <Sheet.Content>
        <div
          data-slot="consent-sheet"
          /* ONE TYPE STEP FOR EVERYTHING BELOW THE HEADING, AND NO MUTED INK
             ANYWHERE ON THE SHEET. Nothing on a consent sheet is small print:
             the retention period set one step down in pale grey satisfies the
             letter of a requirement and none of its purpose, and it is the most
             common way this surface is got wrong. The colour is inherited
             rather than set, which also sidesteps the tailwind-merge collision
             `disclaimer-note.tsx` documents. `text-opsin-body` and
             `text-foreground` land in one conflict group and one of them is
             silently dropped. */
          className="flex flex-col gap-opsin-4 py-opsin-2 text-opsin-body"
        >
          {/* The explanation precedes the controls in the DOM, which is what a
              screen reader reads first and what the consent pattern asks for.
              It is NOT wired as the sheet's accessible description: Sheet
              exposes no description slot, adding one is a change to Sheet
              rather than to this component, and the page says so rather than
              claiming a relationship that is not in the markup. */}
          <p data-slot="consent-sheet-purpose" className="m-0">
            {purpose}
          </p>

          {/* A REAL LIST, WITH REAL MARKERS. The scope facts are three separate
              answers and a screen reader announces them as "list, three items"
              with a position in each. That is the difference between being
              able to go back to the retention line and having to re-read a
              paragraph to find it. `list-disc` keeps the browser's own markers
              rather than removing them and restoring the role by hand: Safari
              drops the list role from a `list-style: none` list, and a repair
              that depends on remembering `role="list"` is a repair that goes
              missing on the day somebody tidies the class.

              THE SPACING IS A SIBLING MARGIN AND NOT A FLEX COLUMN, and that is
              the whole reason this element is laid out differently from every
              other block on the sheet. A flex container blockifies its children:
              an `<li>` inside one computes to `display: block` rather than
              `display: list-item`, and the markers this list depends on stop
              being drawn at all. `gap` would have been tidier and would have
              silently produced three unmarked lines. */}
          <ul
            data-slot="consent-sheet-scope"
            className="m-0 list-disc pl-opsin-5 [&>li+li]:mt-opsin-2"
          >
            <li data-slot="consent-sheet-scope-collected">{scope?.collected}</li>
            <li data-slot="consent-sheet-scope-shared-with">{scope?.sharedWith}</li>
            <li data-slot="consent-sheet-scope-retention">{scope?.retention}</li>
          </ul>

          {details && isSupplied(details.label) ? (
            <div data-slot="consent-sheet-details" className="flex flex-col">
              {/* A PLAIN BUTTON RATHER THAN THIS SYSTEM'S `Button`, for two
                  reasons that point the same way. It has to carry its own
                  `data-slot`, and `Button` pins `data-slot="button"` after the
                  spread. And a third opsinjs Button on a surface whose entire
                  contract is that there are exactly two equally weighted
                  controls would read as a third choice. That is why Sheet's
                  own close control and grabber are hand-rolled too. The target
                  floor and the focus ring are therefore declared here rather
                  than inherited. */}
              <button
                type="button"
                id={detailsTriggerId}
                data-slot="consent-sheet-details-trigger"
                aria-expanded={detailsOpen}
                aria-controls={detailsId}
                onClick={() => setDetailsOpen((current) => !current)}
                className={cn(
                  "flex min-h-(--opsin-target-minimum,2.75rem) w-full items-center gap-opsin-2",
                  "rounded-opsin-sm text-left underline underline-offset-2",
                  FOCUS_RING,
                )}
              >
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "size-[1em] shrink-0",
                    /* `--opsin-duration-fast` collapses to 1ms inside the
                       product stylesheet's own reduced-motion block, so this
                       needs no branch of its own: the glyph turns instantly for
                       a reader who asked for that, and the state it carries is
                       already on `aria-expanded` for everyone. */
                    "transition-transform duration-(--opsin-duration-fast) ease-opsin-standard",
                    detailsOpen ? "rotate-180" : null,
                  )}
                />
                <span className="min-w-0">{details.label}</span>
              </button>

              {/* IN THE DOM WHETHER IT IS OPEN OR NOT, AND THAT IS FOR PAPER.
                  The page promises that a printout carries the full consent
                  text, and a panel that only mounted when a reader expanded it
                  would print whatever the reader happened to leave on screen.

                  `not-print:hidden` rather than `hidden print:block`, and the
                  difference is one of confidence rather than of behaviour. Both
                  were compiled against the pinned tailwindcss 4.3.3: `.hidden`
                  is emitted before `@media print { .print\:block }`, so the pair
                  does work. But it works because of source order between two
                  rules, and `@media not print` is one rule that cannot be
                  reordered by anything. It is also NOT the `hidden` attribute,
                  which Tailwind's own preflight declares `display: none
                  !important`. An attribute here would print nothing at all.

                  While it is collapsed the panel is out of layout and out of the
                  accessibility tree, which is what `aria-expanded` on the
                  trigger is announcing. Whether a browser reveals it in every
                  print path has not been put on paper, and the page says so. */}
              <div
                id={detailsId}
                role="group"
                aria-labelledby={detailsTriggerId}
                data-slot="consent-sheet-details-panel"
                className={cn(
                  "flex flex-col gap-opsin-2 pt-opsin-2",
                  detailsOpen ? null : "not-print:hidden",
                )}
              >
                {details.content}
              </div>
            </div>
          ) : null}

          {/* MANDATORY, AND AT THE SAME SIZE AS EVERYTHING ELSE. "A consent
              with no exit is not revocable, whatever the copy says". So the
              sentence saying where the exit is does not get to be the quiet
              one. It is text and not a link: a string is not a destination, and
              the doctrine's answer is that the control to withdraw belongs on
              the screen showing the data rather than inside the sheet that
              asked for it. */}
          <p data-slot="consent-sheet-withdrawal" className="m-0">
            {withdrawalPath}
          </p>

          {/* LAST BEFORE THE CONTROLS, WHICH IS "BEFORE THEY CHOOSE, NOT
              AFTER". A product that cannot function after a refusal says so
              here; opsinjs cannot know whether that is true, which is why the
              prop is optional and why nothing is invented when it is absent. A
              confirmation raised after a refusal is the pattern this placement
              exists to make unnecessary. It asks "are you sure? your care may
              be affected". */}
          {isSupplied(consequenceOfDeclining) ? (
            <p data-slot="consent-sheet-consequence" className="m-0">
              {consequenceOfDeclining}
            </p>
          ) : null}
        </div>
      </Sheet.Content>
    </Sheet>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo.
 *
 * EVERY WORD BELOW IS OBVIOUSLY SYNTHETIC AND SAYS SO OF ITSELF. It is not
 * consent wording, it is not a draft of any, and it is not a starting point:
 * each sentence is about this example rather than about any product, so that a
 * reader who copies this file has copied nothing usable and an author who
 * screenshots it has screenshotted nothing quotable (ADR 0012). No purpose, no
 * data category, no recipient, no retention period, no jurisdiction and no
 * regulator appears anywhere in it.
 *
 * The two control labels are deliberately not outcome-naming, which is the one
 * rule this demo breaks and it breaks it knowingly: naming an outcome would
 * mean inventing a purpose, and a purpose invented here is the exact thing the
 * component refuses to ship. What a real pair looks like is on the page, under
 * Content guidelines, written by a product rather than by this file.
 */
export default function ConsentSheetDemo() {
  const [open, setOpen] = useState(false)
  const [lastDecision, setLastDecision] = useState<string | null>(null)

  return (
    <div className="flex w-full flex-col items-center gap-opsin-4 p-opsin-4">
      <p className="m-0 max-w-sm text-center text-opsin-footnote text-muted-foreground">
        The sheet portals to the end of the document, so it covers the whole page
        rather than this frame. Both controls are the same size; closing it
        without pressing either records nothing at all.
      </p>

      <Button onClick={() => setOpen(true)}>Open the example sheet</Button>

      {lastDecision ? (
        <p className="m-0 text-opsin-caption1 text-muted-foreground">
          Last thing handed to the product: {lastDecision}
        </p>
      ) : null}

      <ConsentSheet
        open={open}
        onOpenChange={(nextOpen) => setOpen(nextOpen)}
        consentId="example-consent"
        textVersion="example-wording-0"
        heading="Is this placeholder the example thing?"
        purpose="Placeholder for the purpose. A product writes this sentence itself; opsinjs ships no consent wording of any kind, including this one."
        scope={{
          collected: "Placeholder for what is collected. opsinjs does not supply this sentence.",
          sharedWith: "Placeholder for who can see it. opsinjs does not supply this sentence.",
          retention: "Placeholder for how long it is kept. opsinjs does not supply this sentence.",
        }}
        withdrawalPath="Placeholder for where a reader changes this later. opsinjs does not supply this sentence either."
        details={{
          label: "Read the placeholder wording",
          content:
            "Placeholder for the full text. In a product this is the whole statement, disclosed here rather than behind a link to somewhere else.",
        }}
        acceptLabel="Yes, to the example thing"
        declineLabel="No, not the example thing"
        onDecision={(decision) => {
          setLastDecision(
            `${decision.granted ? "granted" : "declined"} · ${decision.consentId} · ${decision.textVersion}`,
          )
          setOpen(false)
        }}
      />
    </div>
  )
}
