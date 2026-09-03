"use client"

/**
 * LogSheet — a Sheet with a capture contract: one entry, a time, an optional
 * note, one explicit save, and no way to leave typed input behind by accident.
 *
 * IT EXTENDS SHEET, AND THAT NOW MEANS SOMETHING (ADR 0021). `LogSheetProps`
 * extends `SheetProps`, so `open`, `onOpenChange`, `title`, `detents` and
 * `className` arrive from the base unchanged and are documented on the base's
 * page. They are not redeclared here and not renamed. Three of Sheet's props
 * are omitted rather than inherited — `footer`, because this component owns the
 * action area; `modal` and `dismissible`, because both of this component's
 * promises depend on their defaults and neither is a knob a capture surface
 * should offer. See the omission note above the interface.
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
 *      every control to opt in, which means editing `Field` — a component this
 *      file does not own — and it silently collects nothing from any control a
 *      product wrote itself, which is most of them. A collector that returns an
 *      incomplete record and cannot tell it is incomplete is worse than none.
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
 *      — every controlled input in `children` is reading and writing it — so
 *      asking for it is asking for something that already exists rather than
 *      duplicating it. `children` stays genuinely opaque: this file never walks
 *      it, never inspects it, and never needs to. What it costs is honest and
 *      visible at the call site: the product writes the key beside each control.
 *
 * SO THE DIVISION IS: the product owns every field it rendered, and this
 * component owns exactly the two it renders itself — the time and the note —
 * plus the four facts about the record that only it is in a position to state.
 * It adds nothing to `values`, removes nothing from it, and coerces nothing in
 * it.
 *
 * WHAT IT REFUSES TO DO. It does not evaluate what is entered: no status
 * colour, no verdict, no comparison against anything. It does not block a save
 * for any reason. It does not close itself, on save or ever — `open` belongs to
 * the product, and a sheet that closed itself on save would be deciding the
 * reader is finished. It mounts no live region. And it does not count the
 * fields: see the note on `children`.
 */

import { useState, type ReactNode } from "react"

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
 * what this does — and it means a route added to Sheet arrives here without an
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
 * strings — `bg-category-${category}` generates no CSS and the band renders
 * invisible, which is the failure that looks like nothing happening.
 *
 * The BARE category name is the ACCENT role, and the asymmetry between the axes
 * is worth restating because it catches people: the bare status name is the
 * LINE role. Accent is the identity fill, chosen for recognition rather than
 * for contrast, so it is never text and never the only boundary — and a band
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

/**
 * Whether two value records hold the same answers.
 *
 * `Object.is` per key rather than `===`, so `null` and `0` stay different
 * things and a stray `NaN` compares equal to itself. Shallow, because the shape
 * the interface declares is flat — a nested object under a key would compare by
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
 * component file is its home — the same place `ResultSegment`, `CareAction` and
 * `ScoreBand` live. It is a named export: a product stores this, so it needs
 * the type.
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
   * one — the reader either touched the control or did not.
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
 *   `footer` — the save action is this component's, not the caller's. It is
 *   what makes "there is no autosave and no implicit commit" checkable.
 *
 *   `modal` — the accessibility contract says the sheet IS a modal dialogue.
 *   `modal={false}` would leave the page behind focusable while a half-typed
 *   record sits on top of it, and neither this page nor Sheet's has an
 *   accessibility story for that.
 *
 *   `dismissible` — the confirmation below depends on the ambient close routes
 *   reaching this component. `dismissible={false}` makes Sheet cancel all three
 *   before they arrive, so the sheet would refuse to close and never say why.
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
   * so nothing here is duplicated — the key is simply written down beside the
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
   * never reads a value out of them — `values` is the channel for that.
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
   * band is not rendered — there is no default category, because a capture
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
   * default. The content rule is that the action says what it saves — *Save
   * reading*, *Save this dose* — and a component that shipped *Save* would let
   * every product skip the rule without noticing it had one.
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
   * What it does NOT do is block: a time typed outside the window still saves,
   * and `onSave` still fires. A log that refuses an entry is a log with a hole
   * in it exactly where the interesting record was.
   */
  maxBackdateDays?: number
  /**
   * Called on an explicit save and at no other moment. There is no autosave, no
   * commit on close, and no debounce.
   *
   * It does not close the sheet. `open` belongs to the product, which is the
   * only party that knows whether the save reached anywhere — a queued entry, a
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
     everything derived from it is inside `Drawer.Portal` — floating-ui's portal
     holds its container in state and sets it in an effect, so its children
     render as nothing in the server's HTML and as nothing on the first client
     render. And the capture in the transition branch below runs only when
     `open` changes, which during a server render it never does.

     That matters because a `datetime-local` value is local wall-clock: a server
     in UTC and a reader in Lisbon disagree by an hour, and a value read during
     a render that reaches HTML is a hydration mismatch on every reader outside
     the server's zone. It is also why this is not an effect — an effect that
     sets state is a cascading render the lint rule refuses, and the render-time
     adjustment is React's own answer for state derived from a prop. */
  const [openedAt, setOpenedAt] = useState<Date | null>(() =>
    open ? new Date() : null,
  )
  /* `null` means the reader has not touched the time control — which is a
     different fact from "the control holds the opening time", and it is the
     difference `backdated` is made of. */
  const [typedAt, setTypedAt] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [route, setRoute] = useState<DismissRoute>("other")
  /* WHAT "UNSAVED" IS MEASURED AGAINST. Set when the sheet opens, and set again
     the moment `onSave` fires — because a sheet the product keeps open after a
     save is one where the question "you have not saved this entry" would be a
     false statement, and this component's copy is a claim like any other. */
  const [baseline, setBaseline] = useState<{
    values: Record<string, number | string | null>
    typedAt: string | null
    note: string
  }>(() => ({ values, typedAt: null, note: "" }))
  const [openLastRender, setOpenLastRender] = useState(open)

  /* Reset on the render that notices the sheet has opened, rather than in an
     effect. An effect would commit the sheet holding the previous entry's note
     and time, paint it, and then correct it — one frame of somebody else's
     record on the way in.

     Every reopen is a fresh entry. A log sheet that remembered what was typed
     last time is how a log fills with numbers nobody measured. */
  if (openLastRender !== open) {
    setOpenLastRender(open)
    if (open) {
      setOpenedAt(new Date())
      setTypedAt(null)
      setNote("")
      setConfirming(false)
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
     is no tolerance window here because none is needed — either the reader
     moved the control away from the time it opened at, or they did not. */
  const timeEdited = typedAt !== null && typedAt !== openedValue

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
     seventh colour ramp that does not exist — so an unrecognised one is
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
       the date a reader would name rather than an hour either side of it. */
    date.setDate(date.getDate() - maxBackdateDays)
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
     holding unsaved input can ask first — by the same route as a background
     tap, which is the wording its page uses. Every route asks, including the
     close control in the header: the specification says Cancel "never discards
     without asking", and a reader who taps the scrim by accident and one who
     reaches for Close deliberately both lose the same typing.

     The question is asked IN PLACE, in the footer, rather than in a second
     modal surface. A Dialog opening from a Sheet is a composition error by
     Sheet's own page, and two stacked modal surfaces produce a focus order
     nobody can predict and an escape key with two plausible meanings. */
  function handleOpenChange(nextOpen: boolean, taken: DismissRoute) {
    if (nextOpen) {
      onOpenChange(true, taken)
      return
    }

    /* While the question is on screen it is what a dismissal answers, and the
       answer it gets is the safe one. Escape and a scrim tap take the reader
       back to what they were typing; the way out is the Discard control, which
       is a real button, in the tab order, two stops away. */
    if (confirming) {
      setConfirming(false)
      return
    }

    if (dirty) {
      setRoute(taken)
      setConfirming(true)
      return
    }

    onOpenChange(false, taken)
  }

  /* EVERY CONTROL BELOW SITS IN A WRAPPER THAT CARRIES THE SLOT, and that is
     not decoration. `Button` stamps `data-slot="button"` AFTER spreading the
     props it was given, so a slot passed to it is silently dropped — and the
     parts named in this component's anatomy have to exist in the DOM or the
     anatomy is a description of something else. The alternative was hand-rolled
     controls, which teaches, in shipped source, that the primary action at the
     foot of a sheet is a styled `<button>`. */
  const footer = confirming ? (
    <div
      data-slot="log-sheet-confirm"
      className="flex w-full flex-col gap-opsin-3"
    >
      <p className="m-0 text-opsin-footnote">
        You have not saved this entry. Discard it?
      </p>
      <div className="flex flex-wrap items-center gap-opsin-2">
        {/* The safe answer, and the one focus lands on. `autoFocus` moves focus
            here as the row mounts, which is the whole reason a keyboard reader
            knows anything has happened: the component mounts no live region,
            and a question that appears silently at the foot of a sheet is a
            question nobody answers. It is only ever mounted in reply to the
            reader asking to leave, so this is an answer rather than a component
            taking focus on appearance.

            Not measured in a browser. `autoFocus` inside a portal that is
            itself taking focus is the kind of thing that works until it does
            not, and the claim is argued from React's own behaviour rather than
            observed — the page says so. */}
        <div data-slot="log-sheet-keep">
          <Button variant="primary" autoFocus onClick={() => setConfirming(false)}>
            Keep editing
          </Button>
        </div>
        <div data-slot="log-sheet-discard">
          <Button
            variant="destructive"
            onClick={() => {
              const entry = buildEntry()
              setConfirming(false)
              onDiscard?.(entry)
              onOpenChange(false, route)
            }}
          >
            Discard
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
             the difference; one that keeps it open — to retry, or to log a
             second entry — would otherwise be told, untruthfully, that it holds
             input nobody has saved. */
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
              handed to it never reaches the DOM — and a part named in the
              anatomy that does not exist in the DOM is a description of a
              different component. */}
          <div data-slot="log-sheet-time">
            <Field
              label={timeLabel?.trim() ? timeLabel : "Time of this entry"}
              /* Through `Field`'s own hint rather than beside it. Base UI's
                 field context registers the description's id on the control and
                 removes it again when the field unmounts, which is the wiring
                 this component exists not to hand-roll — an `aria-describedby`
                 written here would be merged with, or replaced by, the one that
                 context maintains. */
              hint={
                earliest
                  ? `Entries can be dated back to ${new Intl.DateTimeFormat(
                      undefined,
                      { dateStyle: "long" },
                    ).format(earliest)}.`
                  : undefined
              }
            >
              <Field.Control
                type="datetime-local"
                value={occurredAt}
                /* The window the product owns, handed to the platform's own
                   picker. It constrains what the picker offers; it does not
                   constrain what can be typed and it never blocks the save. The
                   earliest date is a statement, not a wall. */
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
                    hides everything past the first phrase. */}
                <Field.Control
                  render={<textarea rows={3} />}
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
 * for first — one field, a time, a note, one save — and it shows the two things
 * that are easiest to get wrong: the field's key is written beside the control
 * rather than inferred from it, and an emptied control goes back to `null`
 * instead of to an empty string.
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
        The sheet portals to the end of the document, so it covers the whole
        page rather than this frame. Type something and then try to close it
        with the escape key.
      </p>

      <Button onClick={() => setOpen(true)}>Open the example log sheet</Button>

      {saved ? (
        <p className="m-0 max-w-sm text-center text-opsin-footnote">
          Saved an entry dated {saved.occurredAt}
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
             to do. LogSheet resets the two things it renders — the time and the
             note — on every open, and it has no way to reach into state it does
             not own. */
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
