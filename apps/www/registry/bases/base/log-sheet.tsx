"use client"

/**
 * LogSheet is a Sheet with a capture contract: one entry, a time, an optional
 * note, one explicit save, and no way to leave typed input behind by accident.
 *
 * IT EXTENDS SHEET, AND THAT NOW MEANS SOMETHING (ADR 0021). `LogSheetProps`
 * extends `SheetProps`, so `open`, `onOpenChange`, `title`, `detents` and
 * `className` arrive from the base unchanged and are documented on the base's
 * page. They are not redeclared here and not renamed. Three of Sheet's props
 * are omitted rather than inherited. They are `footer`, because this component
 * owns the action area; `modal` and `dismissible`, because both of this
 * component's promises depend on their defaults and neither is a knob a capture
 * surface should offer. See the omission note above the interface.
 *
 * THE HOLE THIS FILE HAD TO FILL, and the decision it records.
 *
 * The specification hands the component `children: React.ReactNode` and asks
 * `onSave` to return `values: Record<string, number | string | null>`. Those two
 * sentences cannot both be true without a mechanism, and the page named none.
 * Three mechanisms were available and one had to be chosen:
 *
 *   1. A registration context. Each control inside registers its key and its
 *      current value on a context this component provides. REJECTED: it needs
 *      every control to opt in, which means editing `Field`, and this file
 *      does not own `Field`. It also silently collects nothing from any
 *      control a product wrote itself, which is most of them. A collector that
 *      returns an incomplete record and cannot tell it is incomplete is worse
 *      than none.
 *
 *   2. A `<form>` and `FormData`, keyed off each control's `name`. REJECTED,
 *      and the reason is the one rule in this batch that is not negotiable:
 *      `FormData` returns `""` for a control the reader emptied and `""` for one
 *      they never touched, and it returns strings for everything. `null` is a
 *      first-class absence here, distinct from `0` and distinct from "not typed
 *      yet", and a channel that cannot carry the distinction is a channel that
 *      quietly turns "no answer" into "zero" somewhere downstream in somebody's
 *      record.
 *
 *   3. A controlled `values` prop. CHOSEN. The product already holds this state
 *      because every controlled input in `children` is reading and writing it.
 *      So asking for it is asking for something that already exists rather than
 *      duplicating it. `children` stays genuinely opaque: this file never walks
 *      it, never inspects it, and never needs to. What it costs is honest and
 *      visible at the call site: the product writes the key beside each control.
 *
 * SO THE DIVISION IS: the product owns every field it rendered, and this
 * component owns exactly the two it renders itself. Those two are the time and
 * the note. It also owns the four facts about the record that only it is in a
 * position to state. It adds nothing to `values`, removes nothing from it, and
 * coerces nothing in it.
 *
 * WHAT IT REFUSES TO DO. It does not evaluate what is entered: no status
 * colour, no verdict, no comparison against anything. It does not block a save
 * for any reason. It does not close itself, on save or ever. `open` belongs to
 * the product, and a sheet that closed itself on save would be deciding the
 * reader is finished. It mounts no live region. And it does not count the
 * fields: see the note on `children`.
 */

import { useId, useRef, useState, type ReactNode } from "react"

import {
  HEALTH_CATEGORIES,
  isDevelopment,
  isHealthCategory,
  warnOnce,
  type HealthCategory,
} from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/base-lyra/ui/button"
import { Field } from "@/registry/base-lyra/ui/field"
import { Sheet, type SheetProps } from "@/registry/base-lyra/ui/sheet"

/**
 * How the close was asked for, read off the base rather than restated.
 *
 * `Sheet`'s dismissal-route type is module-local to `sheet.tsx` on purpose: a
 * registry file's public surface is its props, its component and its demo. The
 * documented way to name it is through the signature it appears in, which is
 * what this does. It also means a route added to Sheet arrives here without an
 * edit, instead of drifting out of step with a second copy.
 */
type DismissRoute = Parameters<SheetProps["onOpenChange"]>[1]

/**
 * Once per cause, not once per render.
 *
 * The same channel `Sheet` and `Field` use, and for the same reason:
 * `tokens/errors.json` has no code for either mistake below and a component may
 * not mint one, but the once-per-cause half of that file's policy is not
 * attached to the code. LogSheet wraps a product's own controlled form, so
 * every keystroke re-renders it; an un-deduplicated warning prints once per
 * character and buries whatever is reported next.
 */
const warnedCauses = new Set<string>()

function warnDevelopmentOnce(cause: string, message: string): void {
  if (!isDevelopment() || warnedCauses.has(cause)) return
  warnedCauses.add(cause)
  console.warn(message)
}

/**
 * The category tint, written out because Tailwind reads class names as literal
 * strings. `bg-category-${category}` generates no CSS and the band renders
 * invisible, which is the failure that looks like nothing happening.
 *
 * The BARE category name is the ACCENT role, and the asymmetry between the axes
 * is worth restating because it catches people: the bare status name is the
 * LINE role. Accent is the identity fill, chosen for recognition rather than
 * for contrast, so it is never text and never the only boundary. A band
 * that holds neither is exactly what it is for.
 *
 * No word accompanies it, deliberately. Category colour says what a reading is
 * about, never how urgent it is, and the sheet's own title already names what
 * is being logged in full. In greyscale the band says nothing, and nothing is
 * what it is entitled to say.
 */
const CATEGORY_ACCENT: Record<HealthCategory, string> = {
  sleep: "bg-category-sleep",
  heart: "bg-category-heart",
  activity: "bg-category-activity",
  nutrition: "bg-category-nutrition",
  mind: "bg-category-mind",
  labs: "bg-category-labs",
}

/**
 * A `Date` as the value a `datetime-local` control wants: local wall-clock, to
 * the minute, with no zone and no seconds.
 *
 * Hand-written rather than `toISOString().slice(...)`, which is the tempting
 * one-liner and is wrong: `toISOString` converts to UTC first, so a reader east
 * of Greenwich would open the sheet and find it pre-filled with an hour they
 * were not at.
 */
function toDateTimeLocal(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, "0")
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/* The record stores an instant; a reader reads a time. `occurredAt` is
   `toISOString()` output, so printing it raw shows a reader who just picked
   12:29 the string 2026-09-05T11:29:00.000Z, which is a machine string, in
   UTC, and an hour wrong everywhere outside Greenwich. The formatter is built
   inside the function rather than at module scope so it resolves the reader's
   locale in the browser rather than the server's during a render. */
function readableTime(instant: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    /* 24-hour with a colon, per content/numbers-dates-and-time, which bans
       am/pm outright: LogSheet is the surface whose capture format reaches an
       export, so the demo must not teach the banned clock. */
    hourCycle: "h23",
  }).format(new Date(instant))
}

/**
 * Whether two value records hold the same answers.
 *
 * `Object.is` per key rather than `===`, so `null` and `0` stay different
 * things and a stray `NaN` compares equal to itself. Shallow, because the shape
 * the interface declares is flat. A nested object under a key would compare by
 * identity, and this returns false where it cannot be sure, which is the safe
 * direction: the cost of a wrong `false` is one confirmation the reader did not
 * need, and the cost of a wrong `true` is their typing thrown away.
 */
function sameEntries(
  a: Record<string, number | string | null>,
  b: Record<string, number | string | null>,
): boolean {
  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) return false
  return keys.every((key) => Object.is(a[key], b[key]))
}

/**
 * One record, as this component hands it back.
 *
 * IT LIVES HERE AND NOT IN `lib/opsinjs.ts`, which is where the substrate's
 * shared vocabulary lives. `ReferenceRange` and `TrendPoint` are there because
 * several components speak them; `LogEntry` is produced by exactly one, so the
 * component file is its home. That is the same place `ResultSegment`,
 * `CareAction` and `ScoreBand` live. It is a named export: a product stores
 * this, so it needs the type.
 */
export interface LogEntry {
  /**
   * Whatever the product's own controls held at the moment of the save, keyed
   * however the product keyed them, passed through untouched.
   *
   * Untouched is the contract. Nothing is added, nothing is dropped for being
   * empty, and nothing is coerced: `null` arrives as `null` and means "no
   * answer", which is a different fact from `0` and a different fact again from
   * a key that is not present.
   */
  values: Record<string, number | string | null>
  /**
   * The time the entry is ABOUT, as an ISO 8601 instant. Defaults to the moment
   * the sheet opened and is editable throughout.
   *
   * When the control is empty at the moment of the save this is the save time,
   * equal to `recordedAt`, and `backdated` is false. So a reader of the record
   * tells a chosen time from a substituted one by the pair rather than by
   * guessing, and the field's own guidance says this will happen before the
   * save rather than after.
   */
  occurredAt: string
  /**
   * The time the entry was RECORDED, as an ISO 8601 instant, taken at the save
   * and never editable. It is read at save rather than at open so that it is
   * the truth about when the record was made, and so that nothing about this
   * component depends on a clock reading taken during a render.
   */
  recordedAt: string
  /**
   * True when the reader moved the time control themselves.
   *
   * Tracked as an action rather than derived from `occurredAt !== recordedAt`,
   * which was the obvious implementation and is wrong: those two always differ
   * by however long the reader spent typing, so every entry would come back
   * marked. There is no tolerance window here because there does not need to be
   * one. The reader either touched the control or did not. Clearing the control
   * is not moving it, so an emptied time is false here.
   */
  backdated: boolean
  /**
   * Always `"self-reported"`, and there is no prop that changes it. A reading a
   * person typed and a reading a device sent are not interchangeable
   * downstream, and a capture sheet is only ever the first of the two. A
   * device-assisted flow is a different surface, not this one with a flag.
   */
  provenance: "self-reported"
  /**
   * The free-text line, present only when the reader wrote something. An empty
   * note is an absent note rather than an empty string, so a product storing
   * this never has to tell the two apart.
   */
  note?: string
}

/**
 * `footer`, `modal` and `dismissible` are omitted from the base rather than
 * inherited, and each omission is a promise this component makes.
 *
 *   `footer` is omitted because the save action is this component's, not the
 *   caller's. It is what makes "there is no autosave and no implicit commit"
 *   checkable.
 *
 *   `modal` is omitted because the accessibility contract says the sheet IS a
 *   modal dialogue. `modal={false}` would leave the page behind focusable while
 *   a half-typed record sits on top of it, and neither this page nor Sheet's
 *   has an accessibility story for that.
 *
 *   `dismissible` is omitted because the confirmation below depends on the
 *   ambient close routes reaching this component. `dismissible={false}` makes
 *   Sheet cancel all three before they arrive, so the sheet would refuse to
 *   close and never say why.
 */
export interface LogSheetProps
  extends Omit<SheetProps, "children" | "footer" | "modal" | "dismissible"> {
  /**
   * What the product's own controls currently hold, keyed the way the product
   * wants them back. Handed to `onSave` verbatim.
   *
   * This is the channel that makes `onSave` possible at all: `children` is an
   * opaque element tree and no component can read structured data out of one.
   * The product already holds this state to render its own controlled inputs,
   * so nothing here is duplicated. The key is simply written down beside the
   * control instead of being inferred from it. `{}` is legitimate, for an entry
   * that is a note and a time and nothing else.
   *
   * It is also how the sheet knows there is unsaved input. What is here when
   * the sheet opens is the baseline; what is here when the reader tries to
   * leave is compared against it, and a save resets the baseline so that a
   * sheet the product keeps open afterwards does not claim to hold input
   * nobody has saved.
   */
  values: Record<string, number | string | null>
  /**
   * The entry controls, rendered in order at the top of the sheet.
   *
   * They stay opaque. This component never walks them, never counts them and
   * never reads a value out of them. `values` is the channel for that.
   *
   * There is no enforced ceiling, and the "about five" in the specification is
   * deliberately not implemented as a check. `React.Children` sees only direct
   * children, so a product that wraps its own two fields in one component of
   * its own would be counted as having one, and a count that is wrong in the
   * common case teaches the wrong lesson twice: it clears a sheet that is too
   * long and complains about one that is not. The ceiling is a design rule, and
   * this is the file saying so rather than pretending to enforce it.
   */
  children: ReactNode
  /**
   * What the entry is about, tinting one band and nothing else. Omit it and the
   * band is not rendered. There is no default category, because a capture
   * sheet with the wrong identity colour is worse than one with none.
   *
   * The status axis is not available here at any price. Colouring a field while
   * somebody is typing their own measurement into it is a verdict delivered
   * mid-keystroke, and it is the fastest way to teach a person to stop logging
   * honestly.
   */
  category?: HealthCategory
  /**
   * The primary action's label, and it is required because there is no honest
   * default. The content rule is that the action says what it saves, as in
   * *Save reading* or *Save this dose*. A component that shipped *Save* would
   * let every product skip the rule without noticing it had one.
   */
  saveLabel: string
  /**
   * Overrides the time control's label, for translation or for a product whose
   * readers use different words. The time field is always present, so unlike
   * the note this component has to ship a word for it.
   */
  timeLabel?: string
  /**
   * The note control's label. Supplying it is what adds the note field; omit it
   * and there is no note.
   *
   * Opt-in rather than always-on, and the label carries the opting: a free-text
   * line is a field like any other and counts against the sheet's budget, and
   * this component has no wording of its own that would suit every product's
   * note.
   */
  noteLabel?: string
  /**
   * How far back an entry may be dated, in days. The product owns this number;
   * omit it and no earliest date is offered or stated.
   *
   * What it does: it sets the time control's `min`, which is what the platform
   * date picker reads, and it names the earliest date in the field's guidance.
   * The window opens at the START of the day that many days before the sheet
   * opened, so a seven-day window reaches the beginning of that seventh day
   * rather than the clock time the sheet happened to open at, and the picker
   * offers the whole of the earliest day the guidance names.
   *
   * What it does NOT do is refuse a save. This component never blocks a save
   * for any reason, so a time the reader types outside the window still saves
   * and `onSave` still fires. The platform's own picker is a separate matter:
   * on a touch device the picker is the only way to change a datetime-local
   * and it will not offer a time below `min`, so there the window is enforced
   * by the platform even though the sheet enforces nothing. A product that
   * must accept entries older than its window should not set `maxBackdateDays`
   * at all.
   */
  maxBackdateDays?: number
  /**
   * Called on an explicit save and at no other moment. There is no autosave, no
   * commit on close, and no debounce.
   *
   * It does not close the sheet. `open` belongs to the product, which is the
   * only party that knows whether the save reached anywhere. A queued entry, a
   * rejected one and a stored one all arrive here identically, and a sheet that
   * closed itself would have decided the reader was finished on the strength of
   * a function call returning.
   */
  onSave: (entry: LogEntry) => void
  /**
   * Called when the reader answers the confirmation by discarding.
   *
   * IT TAKES THE ENTRY, which the specification's signature did not. The
   * specification says "the product decides whether to keep a draft" and then
   * hands the product nothing to keep; widening the parameter list is the
   * smallest repair, and it is the same widening Sheet made to `onOpenChange`
   * for the same reason. A zero-argument handler is still assignable, so
   * `onDiscard={clearForm}` typechecks unchanged.
   *
   * The entry is the one that was about to be lost, built exactly as `onSave`
   * would have built it. Keeping it is a draft; ignoring it is a discard.
   */
  onDiscard?: (entry: LogEntry) => void
}

export function LogSheet({
  open,
  onOpenChange,
  title,
  values,
  children,
  category,
  saveLabel,
  timeLabel,
  noteLabel,
  maxBackdateDays,
  onSave,
  onDiscard,
  ...sheet
}: LogSheetProps) {
  /* WHEN "NOW" IS READ, AND WHY THERE IS NO EFFECT DOING IT.
     The clock is read in two places, and both of them are places the server
     never reaches. The lazy initialiser below runs on the server too, but
     everything derived from it is inside `Drawer.Portal`. Floating-ui's portal
     holds its container in state and sets it in an effect, so its children
     render as nothing in the server's HTML and as nothing on the first client
     render. And the capture in the transition branch below runs only when
     `open` changes, which during a server render it never does.

     That matters because a `datetime-local` value is local wall-clock: a server
     in UTC and a reader in Lisbon disagree by an hour, and a value read during
     a render that reaches HTML is a hydration mismatch on every reader outside
     the server's zone. It is also why this is not an effect. An effect that
     sets state is a cascading render the lint rule refuses, and the render-time
     adjustment is React's own answer for state derived from a prop. */
  const [openedAt, setOpenedAt] = useState<Date | null>(() =>
    open ? new Date() : null,
  )
  /* `null` means the reader has not touched the time control. That is a
     different fact from "the control holds the opening time", and it is the
     difference `backdated` is made of. */
  const [typedAt, setTypedAt] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [route, setRoute] = useState<DismissRoute>("other")
  /* Where focus was when the question went up, so it can go back. Null when
     focus was outside the sheet, which is what a scrim tap usually leaves. */
  const focusBeforeConfirm = useRef<HTMLElement | null>(null)
  /* The keep answer's wrapper, so its Button can be focused without a ref on
     Button, whose props type does not carry one. */
  const keepRef = useRef<HTMLDivElement | null>(null)
  /* One id for the discard question, so both answers can point at it with
     aria-describedby. Without it focus lands on a button announced as its label
     alone and the sentence that says what is at stake is voiced by nothing. */
  const questionId = useId()
  /* WHAT "UNSAVED" IS MEASURED AGAINST. Set when the sheet opens, and set again
     the moment `onSave` fires. That matters because a sheet the product keeps
     open after a save is one where the question "you have not saved this entry"
     would be a false statement, and this component's copy is a claim like any
     other. */
  const [baseline, setBaseline] = useState<{
    values: Record<string, number | string | null>
    typedAt: string | null
    note: string
  }>(() => ({ values, typedAt: null, note: "" }))
  const [openLastRender, setOpenLastRender] = useState(open)

  /* Reset on the render that notices the sheet has opened, rather than in an
     effect. An effect would commit the sheet holding the previous entry's note
     and time, paint it, and then correct it. That is one frame of somebody
     else's record on the way in.

     Every reopen is a fresh entry. A log sheet that remembered what was typed
     last time is how a log fills with numbers nobody measured. */
  if (openLastRender !== open) {
    setOpenLastRender(open)
    if (open) {
      setOpenedAt(new Date())
      setTypedAt(null)
      setNote("")
      setConfirming(false)
      /* No question is up on a fresh open, so nothing is owed a focus return. */
      focusBeforeConfirm.current = null
      setRoute("other")
      setBaseline({ values, typedAt: null, note: "" })
    }
  }

  const openedValue = openedAt === null ? "" : toDateTimeLocal(openedAt)
  const occurredAt = typedAt ?? openedValue
  /* `backdated`, as the reader's action rather than as arithmetic. Deriving it
     from `occurredAt !== recordedAt` was the obvious implementation and is
     wrong: those two always differ by however long the entry took to type, so
     every record would come back marked and the flag would mean nothing. There
     is no tolerance window here because none is needed. The reader either
     moved the control away from the time it opened at, or they did not.

     An emptied control is not a re-dating. A reader who clears the field has
     said "I do not know when", which is the same class of fact as a null in
     `values`, and flagging it as a deliberate re-dating puts a claim in
     somebody's record that they never made. So `""` is excluded here, the same
     refusal this file makes for `FormData` above and that the demo makes for
     its own control below. */
  const timeEdited =
    typedAt !== null && typedAt !== "" && typedAt !== openedValue

  if (typeof saveLabel !== "string" || saveLabel.trim() === "") {
    warnDevelopmentOnce(
      "save-label",
      "[opsinjs] <LogSheet> was given no `saveLabel`. The primary action has to " +
        "say what it saves, and there is no default here on purpose: a button " +
        'reading "Save" tells a reader nothing they did not already know, and a ' +
        "component that shipped one would let every product skip the rule.",
    )
  }

  /* The category, checked rather than trusted. This file ships as source into
     JavaScript projects where a type is advice, and a seventh category is a
     seventh colour ramp that does not exist. So an unrecognised one is
     reported and the band is left out rather than tinted from a ramp picked at
     random. */
  let tint: HealthCategory | undefined
  if (category !== undefined) {
    if (isHealthCategory(category)) {
      tint = category
    } else {
      warnOnce("OPSIN-0010", {
        category: String(category),
        known: HEALTH_CATEGORIES.join(", "),
      })
    }
  }

  const earliest = (() => {
    if (openedAt === null || maxBackdateDays === undefined) return undefined
    const date = new Date(openedAt)
    /* Day arithmetic through the Date object rather than a subtraction in
       milliseconds, so a window that spans a daylight-saving change lands on
       the date a reader would name rather than an hour either side of it.

       Then floored to the start of that day, because the hint beside the
       control names a DATE and `min` carries a TIME. Without the floor a
       sheet opened at 12:29 emits min="2026-08-29T12:29" under a sentence
       that says entries can be dated back to 29 August, and a reader
       backdating a morning reading to the day the copy just offered them is
       refused by the control. The window is a number of days, so its edge is
       the start of a day. */
    date.setDate(date.getDate() - maxBackdateDays)
    date.setHours(0, 0, 0, 0)
    return date
  })()

  /* Deliberately more eager than `timeEdited`: a reader who moved the time
     control and then moved it back has still touched something, and the cost of
     asking once too often is a question, while the cost of asking once too
     rarely is their typing. */
  const dirty =
    !sameEntries(values, baseline.values) ||
    typedAt !== baseline.typedAt ||
    note !== baseline.note

  /* The time field's guidance, computed as a list of sentences so a second one
     can appear only when it is about something. The second sentence is shown
     just while the control is empty, which is the only moment it is about
     anything, because `buildEntry` then substitutes the save time and a reader
     who cleared the field on purpose should see that coming rather than find it
     afterwards.

     The punctuation is computed rather than written because
     content/docs/content/grammar-and-mechanics.mdx takes no full stop on a
     single-sentence hint and full stops on full sentences, so one sentence
     ends bare and two are both stopped. The sentences in the array carry no
     stops for exactly that reason. */
  const timeHints = [
    earliest
      ? `Entries can be dated back to ${new Intl.DateTimeFormat(undefined, {
          dateStyle: "long",
        }).format(earliest)}`
      : null,
    occurredAt === ""
      ? "If you leave this empty, the time you save is used"
      : null,
  ].filter((line): line is string => line !== null)
  const timeHint =
    timeHints.length === 0
      ? undefined
      : timeHints.length === 1
        ? timeHints[0]
        : timeHints.map((line) => `${line}.`).join(" ")

  function buildEntry(): LogEntry {
    const recordedAt = new Date()
    const chosen = occurredAt === "" ? null : new Date(occurredAt)
    const trimmed = note.trim()

    return {
      /* Copied rather than passed by reference: the product's state object is
         about to change under it, and a record that mutates after it was handed
         over is a record nobody can trust. Shallow, which matches the shape the
         type declares. */
      values: { ...values },
      occurredAt:
        chosen === null || Number.isNaN(chosen.getTime())
          ? recordedAt.toISOString()
          : chosen.toISOString(),
      recordedAt: recordedAt.toISOString(),
      backdated: timeEdited,
      provenance: "self-reported",
      ...(trimmed === "" ? {} : { note: trimmed }),
    }
  }

  /* DISMISSAL, AND THE ONE THING THIS COMPONENT WILL NOT LET HAPPEN.
     Sheet reports which route a close arrived by precisely so that a surface
     holding unsaved input can ask first. It asks by the same route as a
     background tap, which is the wording its page uses. Every route asks,
     including the close control in the header: the specification says Cancel
     "never discards without asking", and a reader who taps the scrim by
     accident and one who reaches for Close deliberately both lose the same
     typing. Every route asks the same question once. After it is up the ambient
     routes answer it with the safe answer while the close control leaves it
     standing, because one of those is a gesture and the other is an act.

     The question is asked IN PLACE, in the footer, rather than in a second
     modal surface. A Dialog opening from a Sheet is a composition error by
     Sheet's own page, and two stacked modal surfaces produce a focus order
     nobody can predict and an escape key with two plausible meanings. */
  function handleOpenChange(nextOpen: boolean, taken: DismissRoute) {
    if (nextOpen) {
      onOpenChange(true, taken)
      return
    }

    /* While the question is on screen a dismissal answers it, and the answer is
       the safe one for every route except the header close control. Escape, a
       scrim tap and a drag are gestures a reader can make by accident, so they
       take the reader back to what they were typing, with the Discard entry
       control one Shift+Tab away. The close control is different: a reader who
       taps Close, reads "Discard it?" and taps Close again is repeating a
       deliberate act, and withdrawing the question in reply would make the same
       gesture flip the sheet between two states for ever and never close it. So
       for that one route the question stays up and focus goes back to the
       answers, where the reader has to choose one of two words. It does not
       close, does not discard and sets no state: this handler owns the decision,
       and returning without propagating the close to the product's onOpenChange
       leaves `open` true, so the sheet stays open behind the question. */
    if (confirming) {
      if (taken === "close-control") {
        keepRef.current
          ?.querySelector<HTMLElement>('[data-slot="button"]')
          ?.focus()
        return
      }
      keepEditing()
      return
    }

    if (dirty) {
      /* Remember where focus was before the question replaces the footer, so
         Keep editing can put it back. The containment test keeps it honest: a
         scrim tap usually leaves focus on the body or the scrim, and restoring
         focus to the body is worse than leaving it alone, so that case captures
         null. `sheet-container` is the popup's slot. `document` is safe here
         because this runs in an event handler, never in a render. */
      const active = document.activeElement
      focusBeforeConfirm.current =
        active instanceof HTMLElement &&
        active.closest('[data-slot="sheet-container"]') !== null
          ? active
          : null
      setRoute(taken)
      setConfirming(true)
      return
    }

    onOpenChange(false, taken)
  }

  /* Focus moves BEFORE the state change, and that ordering is the whole trick.
     The answers are still mounted at this point, so moving focus out of the row
     and then removing the row leaves focus where it was put. The other order
     removes the focused element first, which drops focus on the document body
     and is the defect this repairs. It is also why there is no effect and no
     flushSync here. The fallback is Sheet's close control, for a question that
     went up over a scrim tap where there was no in-sheet control to return to. */
  function keepEditing(): void {
    const previous = focusBeforeConfirm.current
    focusBeforeConfirm.current = null
    const fallback =
      keepRef.current
        ?.closest('[data-slot="sheet-container"]')
        ?.querySelector<HTMLElement>('[data-slot="sheet-close"]') ?? null
    const target =
      previous !== null && previous.isConnected ? previous : fallback
    target?.focus()
    setConfirming(false)
  }

  /* EVERY CONTROL BELOW SITS IN A WRAPPER THAT CARRIES THE SLOT, and that is
     not decoration. `Button` stamps `data-slot="button"` AFTER spreading the
     props it was given, so a slot passed to it is silently dropped. The
     parts named in this component's anatomy have to exist in the DOM or the
     anatomy is a description of something else. The alternative was hand-rolled
     controls, which teaches, in shipped source, that the primary action at the
     foot of a sheet is a styled `<button>`. */
  const footer = confirming ? (
    <div
      data-slot="log-sheet-confirm"
      className="flex w-full flex-col gap-opsin-3"
    >
      {/* THE QUESTION IS SET AT THE SAME STEP AND WEIGHT AS THE FIELD LABELS
          above it, headline at 1.0625rem and weight 600, and never at the
          footnote step. The footnote step is the caption role in this file: the
          demo caption and the example captions use it, and this is not a
          caption. It is the most consequential sentence on the surface, the one
          deciding whether the reader's typing survives, so a reader who
          triggered it by accident should not have to squint to read it. This is
          the same argument field.tsx makes for its own hints. `text-foreground`
          makes the role explicit rather than inheriting the muted caption
          colour. */}
      <p id={questionId} className="m-0 text-opsin-headline text-foreground">
        You have not saved this entry. Discard it?
      </p>
      {/* THE TWO ANSWERS ARE STACKED, NOT PLACED SIDE BY SIDE, and the safe one
          is at the bottom. A destructive answer eight pixels from a constructive
          one is the defect; stacking removes the adjacency rather than widening
          it. The gap is `--opsin-space-4` (16px), which is deliberately larger
          than `--opsin-target-separation` (0.5rem), with a literal `1rem`
          fallback in the class: the variable is declared in this repository's
          product stylesheet, a consumer who copies this file in with `shadcn
          add` does not get that stylesheet, a bare read would resolve to nothing
          and collapse the gap to zero, and two answers touching is exactly where
          a mis-tap costs the most. */}
      <div
        data-slot="log-sheet-answers"
        className="flex w-full flex-col gap-(--opsin-space-4,1rem)"
      >
        {/* DISCARD IS FIRST IN THE DOM AND SO FIRST IN THE TAB ORDER, which is
            this repository's house order for a pinned action row: least
            destructive last (Dialog states it in one line, and ConsentSheet
            refuses an `order` prop for the same reason). It is natural width,
            never `fullWidth`: two stacked full-width buttons read as two primary
            actions, so a natural-width destructive above a full-width primary is
            what keeps the hierarchy legible and keeps discarding a deliberate
            aim rather than a wide landing strip. Its own minimum target still
            holds it at or above 44px. The label says what it discards, the same
            rule that makes `saveLabel` required. */}
        <div data-slot="log-sheet-discard">
          <Button
            variant="destructive"
            aria-describedby={questionId}
            onClick={() => {
              const entry = buildEntry()
              setConfirming(false)
              /* The sheet is leaving, so a captured element must not be focused
                 after it has gone and Sheet's own return-to-trigger must not be
                 fought. */
              focusBeforeConfirm.current = null
              onDiscard?.(entry)
              onOpenChange(false, route)
            }}
          >
            Discard entry
          </Button>
        </div>
        {/* The safe answer, and the one focus lands on. `autoFocus` moves focus
            here as the row mounts, which is the whole reason a keyboard reader
            knows anything has happened: the component mounts no live region,
            and a question that appears silently at the foot of a sheet is a
            question nobody answers. It is only ever mounted in reply to the
            reader asking to leave, so this is an answer rather than a component
            taking focus on appearance.

            It is the full-width primary at the very foot of the footer, in the
            exact horizontal band the save action occupied a moment before. That
            placement is the safety, not an accident of layout: the pixel under a
            one-handed thumb was Save an instant ago and is now Keep editing, so
            a thumb already travelling to the bottom of the sheet lands on the
            answer that loses nothing. Putting Discard there would hand a
            mid-reach thumb the destructive answer, which is the harm the finding
            names.

            Not measured in a browser. `autoFocus` inside a portal that is
            itself taking focus is the kind of thing that works until it does
            not, and the claim is argued from React's own behaviour rather than
            observed. The page says so. */}
        <div data-slot="log-sheet-keep" ref={keepRef} className="w-full">
          <Button
            variant="primary"
            fullWidth
            autoFocus
            aria-describedby={questionId}
            onClick={keepEditing}
          >
            Keep editing
          </Button>
        </div>
      </div>
    </div>
  ) : (
    <div data-slot="log-sheet-save" className="w-full">
      <Button
        variant="primary"
        fullWidth
        onClick={() => {
          onSave(buildEntry())
          /* The record is now the product's, so nothing on this sheet is
             unsaved any more. A product that closes the sheet here never sees
             the difference. One that keeps it open would otherwise be told,
             untruthfully, that it holds input nobody has saved. It might keep
             the sheet open to retry, or to log a second entry. */
          setBaseline({ values, typedAt, note })
        }}
      >
        {saveLabel}
      </Button>
    </div>
  )

  return (
    <Sheet
      {...sheet}
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      footer={footer}
    >
      <Sheet.Content>
        <div
          data-slot="log-sheet"
          className="flex flex-col gap-opsin-6 py-opsin-2"
        >
          {tint === undefined ? null : (
            /* The category axis, and the only element in this sheet it reaches.
               `data-category` and the class are two spellings of one decision:
               the attribute is the DOM contract a product's stylesheet, its
               print rules and its tests key on, and the class is what paints.
               `aria-hidden`, because it carries identity and no words, and the
               title above it has already said what is being logged. */
            <div
              data-slot="log-sheet-category"
              data-category={tint}
              aria-hidden="true"
              className={cn("h-opsin-1 w-full shrink-0 rounded-full", CATEGORY_ACCENT[tint])}
            />
          )}

          <div
            data-slot="log-sheet-fields"
            className="flex flex-col gap-opsin-6"
          >
            {children}
          </div>

          {/* THE WRAPPER CARRIES THE SLOT, not the Field. `Field` maps props
              to markup and forwards nothing it was not asked for, so a slot
              handed to it never reaches the DOM. A part named in the
              anatomy that does not exist in the DOM is a description of a
              different component. */}
          <div data-slot="log-sheet-time">
            <Field
              label={timeLabel?.trim() ? timeLabel : "Time of this entry"}
              /* Through `Field`'s own hint rather than beside it. Base UI's
                 field context registers the description's id on the control and
                 removes it again when the field unmounts, which is the wiring
                 this component exists not to hand-roll. An `aria-describedby`
                 written here would be merged with, or replaced by, the one that
                 context maintains. */
              hint={timeHint}
            >
              <Field.Control
                type="datetime-local"
                value={occurredAt}
                /* The window the product owns, handed to the platform's own
                   picker. On a platform with a keyboard a reader can still
                   type a time outside it and the save still goes through,
                   because nothing in this component blocks a save. On a touch
                   platform the picker is the only way to change a
                   datetime-local, so there the window is a floor rather than a
                   statement. Both are true and the page says which is which. */
                min={earliest ? toDateTimeLocal(earliest) : undefined}
                onChange={(event) => setTypedAt(event.target.value)}
              />
            </Field>
          </div>

          {noteLabel?.trim() ? (
            <div data-slot="log-sheet-note">
              <Field label={noteLabel} optionality="optional">
                {/* `render` keeps every id and aria attribute Field generated
                    while swapping the element, which is the escape hatch that
                    makes the wiring guarantee survive a control opsinjs does not
                    ship. A note is prose and wraps; a single-line input for it
                    hides everything past the first phrase.

                    `resize-none` turns off the native corner grip. A drag
                    handle in the bottom-right of a control that lives inside a
                    sheet which itself listens for a downward drag and scrolls
                    internally is a third meaning for one gesture, and a thumb
                    that lands on the corner while trying to scroll or dismiss
                    stretches the box instead of moving the sheet. The note
                    still wraps and still scrolls inside its three rows, so
                    nothing is unreachable. `resize-y` is refused because it
                    still draws the grip and still competes with the sheet's
                    drag. `field-sizing: content` is the nicer behaviour in the
                    abstract and is wrong here today: with an empty note it would
                    collapse the box from three rows to one, which shrinks the
                    visible target and drops the floor to Field's own target
                    minimum rather than a note-shaped box. */}
                <Field.Control
                  render={<textarea rows={3} />}
                  className="resize-none"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </Field>
            </div>
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
 * reviewed code rather than a scratch demo. It shows the shape a product reaches
 * for first, which is one field, a time, a note and one save. It also shows the
 * two things that are easiest to get wrong: the field's key is written beside
 * the control rather than inferred from it, and an emptied control goes back to
 * `null` instead of to an empty string.
 *
 * The measurement is deliberately fictional (ADR 0012) and carries no unit and
 * no range. A screenshot of an opsinjs demo must never be mistakable for
 * somebody's result.
 *
 * There is no `maxBackdateDays` here. The window is a number the product owns,
 * and a demo that shipped one would be putting opsinjs's guess into every
 * project that runs `shadcn add`.
 */
export default function LogSheetDemo() {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, number | string | null>>({
    "example-measurement": null,
  })
  const [saved, setSaved] = useState<LogEntry | null>(null)

  const typed = values["example-measurement"]

  return (
    <div className="flex w-full flex-col items-center gap-opsin-4 p-opsin-4">
      <p className="m-0 max-w-sm text-center text-opsin-footnote text-muted-foreground">
        Opens over the whole page. Type something, then try to close it. It
        asks before anything is lost.
      </p>

      <Button onClick={() => setOpen(true)}>Open the example log sheet</Button>

      {saved ? (
        <p className="m-0 max-w-sm text-center text-opsin-footnote">
          Saved an entry dated {readableTime(saved.occurredAt)}
          {saved.backdated ? ", which the reader re-dated." : "."}
        </p>
      ) : null}

      <LogSheet
        open={open}
        onOpenChange={(nextOpen) => setOpen(nextOpen)}
        title="An example entry"
        category="labs"
        values={values}
        saveLabel="Save the example entry"
        noteLabel="Anything worth remembering"
        onSave={(entry) => {
          setSaved(entry)
          /* Closing the sheet and clearing the fields are both the product's
             to do. LogSheet resets the two things it renders on every open.
             Those two are the time and the note, and it has no way to reach
             into state it does not own. */
          setValues({ "example-measurement": null })
          setOpen(false)
        }}
        onDiscard={() => setValues({ "example-measurement": null })}
      >
        <Field
          label="Example measurement"
          hint="Any number. This example stores it and does nothing else with it."
        >
          <Field.Control
            name="example-measurement"
            inputMode="decimal"
            autoComplete="off"
            value={typed === null ? "" : String(typed)}
            onChange={(event) => {
              const next = event.target.value
              /* An emptied control is an absence, not a zero and not an empty
                 string. This is the line the whole `values` channel exists to
                 make possible, and it is one line of the product's own code. */
              setValues({
                "example-measurement": next === "" ? null : next,
              })
            }}
          />
        </Field>
      </LogSheet>
    </div>
  )
}
