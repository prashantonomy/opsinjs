"use client"

/**
 * A whole single-page app, assembled from parts that already ship: a person's
 * diabetes medicines, the doses they have recorded, and the reminders they set
 * for themselves. It is the second assembled specimen and the first that is an
 * application rather than one screen, so it is where the kit is asked whether a
 * product can be built out of it rather than a card.
 *
 * WHAT THE PRODUCT IN THIS SPECIMEN IS. A free, public, browser-only medicines
 * diary for somebody who takes several medicines for diabetes. It keeps a list
 * the person typed in, it reminds them at times they chose, it records what they
 * say they took, and it can hand that record back for an appointment. There is no
 * account, no server and no network call, which is the honest answer to "where do
 * my medicines go" and is also what keeps the product on the safe side of the
 * line below.
 *
 * WHAT IT REFUSES TO DO, AND WHY THAT IS THE DESIGN RATHER THAN A LIMITATION.
 * It calculates no dose, it changes no dose, and it says nothing about what to do
 * about a dose that was not taken. Those three refusals are what separate a diary
 * from a regulated medical device, and they are not softened by a disclaimer: the
 * UK medicines regulator states plainly that a general disclaimer does not exempt
 * an app that qualifies as a device, so the refusals are in the code and the copy
 * merely reports them. The named worked example in that guidance is an app that
 * works out an insulin dose from the carbohydrate in a meal. Nothing here goes
 * anywhere near it. What the same guidance names as safely outside the definition
 * is a reminder, a diary that replaces a written one, and referral to a human, and
 * those three are the whole of this product.
 *
 * IT CARRIES NEITHER COLOUR AXIS, AND THAT IS THE FINDING. A medicines diary
 * states no clinical level and names no category, so no surface here takes
 * `data-status` or `data-category` and none is tinted from either ramp. A dose
 * that has nothing recorded against it is not painted the red that means "act
 * now", because whether an unrecorded dose matters is a clinical judgement this
 * product does not own. Everything is neutral chrome, every state is told in a
 * word, and the screen reads the same in greyscale. The status axis is not absent
 * because the kit lacks it; it is absent because a product that used it here would
 * be asserting a verdict it has no right to.
 *
 * THE APP NEVER MARKS A DOSE AS MISSED. It cannot know. `missed` appears in the
 * record only where the person themselves answered "I did not take it", and a
 * dose nobody has answered for stays `scheduled` however long ago it was due. This
 * is the sharpest thing the specimen has to say about DoseTracker: the component
 * renders the four states it is handed and reaches no verdict, so the verdict has
 * to be refused one level up, in the product, and this is what refusing it looks
 * like.
 *
 * IT IS A CLIENT COMPONENT because every part of it is a control. The section, the
 * log sheet, the reminder switches and the undo all hold state, and the state is
 * held here rather than in a store so the file stays readable as one artefact.
 * Nothing is written to storage: a demonstration that left a medicines list behind
 * in a shared browser would be the one hazard a mock can genuinely cause.
 *
 * EVERY NAME, DOSE, TIME AND COUNT IS SYNTHETIC (ADR 0012). The medicines are
 * called "Morning tablet" and "Bedtime pen", never a real drug and never a real
 * strength, and the instants are fixed so the app says the same thing every time
 * it is built. A screenshot of this specimen must never be mistakable for
 * somebody's own medicines record, which is why the demonstration marker is on the
 * surface rather than in a footnote.
 *
 * EVERY CLINICAL NUMBER IN IT BELONGS TO THE PERSON, NEVER TO opsinjs AND NEVER TO
 * THE PRODUCT. The doses are strings the person transcribed from their own label,
 * shown back unchanged rather than parsed into a quantity, because a dose is a
 * written instruction and not a measurement. The reorder point is a number the
 * person chose. The emergency numbers are the product's own copy, supplied here
 * precisely because opsinjs refuses to ship one.
 */

import { useRef, useState, type ReactNode } from "react"
import {
  Bell,
  CalendarCheck,
  ClipboardList,
  Copy,
  EllipsisVertical,
  Info,
  Pill,
  Plus,
  Undo2,
} from "lucide-react"

import { Accordion } from "@/registry/base-lyra/ui/accordion"
import { Badge } from "@/registry/base-lyra/ui/badge"
import { Button } from "@/registry/base-lyra/ui/button"
import { Callout } from "@/registry/base-lyra/ui/callout"
import { Card } from "@/registry/base-lyra/ui/card"
import { CareCard } from "@/registry/base-lyra/ui/care-card"
import { Checkbox } from "@/registry/base-lyra/ui/checkbox"
import { Combobox } from "@/registry/base-lyra/ui/combobox"
import { ConsentSheet } from "@/registry/base-lyra/ui/consent-sheet"
import { Dialog } from "@/registry/base-lyra/ui/dialog"
import { DisclaimerNote } from "@/registry/base-lyra/ui/disclaimer-note"
import { Divider } from "@/registry/base-lyra/ui/divider"
import { DoseTracker } from "@/registry/base-lyra/ui/dose-tracker"
import { EmptyState } from "@/registry/base-lyra/ui/empty-state"
import { Field } from "@/registry/base-lyra/ui/field"
import { IconButton } from "@/registry/base-lyra/ui/icon-button"
import { Link } from "@/registry/base-lyra/ui/link"
import { LogSheet, type LogEntry } from "@/registry/base-lyra/ui/log-sheet"
import { Menu } from "@/registry/base-lyra/ui/menu"
import { NumberField } from "@/registry/base-lyra/ui/number-field"
import { RadioGroup } from "@/registry/base-lyra/ui/radio-group"
import { RelativeTime } from "@/registry/base-lyra/ui/relative-time"
import { SegmentedControl } from "@/registry/base-lyra/ui/segmented-control"
import { Select } from "@/registry/base-lyra/ui/select"
import { Sheet } from "@/registry/base-lyra/ui/sheet"
import { SourceCitation } from "@/registry/base-lyra/ui/source-citation"
import { Stepper } from "@/registry/base-lyra/ui/stepper"
import { Surface } from "@/registry/base-lyra/ui/surface"
import { Switch } from "@/registry/base-lyra/ui/switch"
import { TabBar } from "@/registry/base-lyra/ui/tab-bar"
import {
  Term,
  TermGlossaryProvider,
  type GlossaryEntry,
} from "@/registry/base-lyra/ui/term"
import { Textarea } from "@/registry/base-lyra/ui/textarea"
import { TimelineEntry } from "@/registry/base-lyra/ui/timeline-entry"
import { Value } from "@/registry/base-lyra/ui/value"
import { VisuallyHidden } from "@/registry/base-lyra/ui/visually-hidden"

/* ====================================================================== *
 * The fixed instant                                                       *
 * ====================================================================== */

/**
 * The instant the whole app is measured against, read once and passed to every
 * timestamp on it, exactly as RelativeTime and DoseTracker require. A literal
 * rather than a clock read, so the specimen says the same thing every time it is
 * built and its rows never drift out of the phrases they exist to show. It is
 * Saturday 14 March 2026 at 11:12.
 */
const NOW = "2026-03-14T11:12:00+00:00"

/** The date part of that instant, so a recorded time can be put on the same day. */
const DEMONSTRATION_DAY = "2026-03-14"

/** The clock time of that instant, for working out what is still to come today. */
const TIME_NOW = "11:12"

/** The day the record covers, written out the way the content rules require. */
const TODAY_IN_WORDS = "Saturday 14 March"

/**
 * Put a recorded instant on the demonstration's day.
 *
 * LogSheet reads the real clock, and in a product that is exactly right: the
 * instant somebody records a dose is the instant it is. This specimen runs on a
 * fixed instant instead, so that it says the same thing every time it is built and
 * so that a screenshot of it never drifts out of the phrases it exists to show.
 * The two cannot both hold, so the hours and minutes the reader chose are kept and
 * the day is moved onto the demonstration's own. Nothing later than the fixed
 * instant is stored either, because RelativeTime treats a future instant as two
 * clocks disagreeing and says so in the console, which is the right behaviour and
 * the wrong thing to demonstrate here.
 */
function onDemonstrationDay(instant: string): string {
  const chosen = new Date(instant)
  if (Number.isNaN(chosen.getTime())) return NOW
  const hours = String(chosen.getHours()).padStart(2, "0")
  const minutes = String(chosen.getMinutes()).padStart(2, "0")
  const mapped = `${DEMONSTRATION_DAY}T${hours}:${minutes}:00+00:00`
  return mapped > NOW ? NOW : mapped
}

/* ====================================================================== *
 * The synthetic record                                                    *
 * ====================================================================== */

/**
 * One medicine, as the person typed it in.
 *
 * `dose` is a STRING and that is the single most important decision in this file.
 * A prescribed dose is a written instruction the person copied off a label, so it
 * is stored and shown as the characters they typed and never parsed into a number
 * and a unit. Parsing it would let the product do arithmetic with it, and
 * arithmetic on a dose is the thing this product exists not to do. It is also why
 * "10 units" is written out in full: the abbreviation to a single letter after a
 * number is a documented route to a tenfold overdose.
 */
interface ExampleMedicine {
  id: string
  /** A plain placeholder naming the medicine's place in the day, never a real drug. */
  name: string
  /** Tablet, pen and the rest, as a short word for the badge. */
  form: string
  /** The dose exactly as the person transcribed it. Never parsed, never computed. */
  dose: string
  /** One of the four slots people plan their day around. */
  slot: string
  /** The clock time, on the 24-hour clock the content rules fix. */
  time: string
  /** How often, in the person's own words. Never a frequency abbreviation. */
  repeats: string
  /** Who wrote the prescription, in the person's words. */
  prescriber: string
  /** Doses the person says are left in the pack. Their count, not the product's. */
  dosesLeft: number
  /** The count at which the person asked to be reminded to reorder. Their number. */
  remindToReorderAt: number
}

/**
 * The four medicines in the demonstration. Two tablets, one weekly injection and
 * one pen, which is the shape of a common diabetes regimen without naming a single
 * real medicine. The bedtime pen carries a dose written in units so the specimen
 * demonstrates the spelled-out unit; the tablets carry "1 tablet" because that is
 * what a label says.
 */
const MEDICINES: ExampleMedicine[] = [
  {
    id: "morning-tablet",
    name: "Morning tablet",
    form: "Tablet",
    dose: "1 tablet",
    slot: "Morning",
    time: "08:00",
    repeats: "Every day",
    prescriber: "Your GP surgery",
    dosesLeft: 26,
    remindToReorderAt: 7,
  },
  {
    id: "saturday-injection",
    name: "Saturday injection",
    form: "Pre-filled pen",
    dose: "1 injection",
    slot: "Morning",
    time: "09:00",
    repeats: "Every Saturday",
    prescriber: "Your diabetes clinic",
    dosesLeft: 3,
    remindToReorderAt: 2,
  },
  {
    id: "midday-tablet",
    name: "Midday tablet",
    form: "Tablet",
    dose: "1 tablet",
    slot: "Midday",
    time: "13:00",
    repeats: "Every day",
    prescriber: "Your GP surgery",
    dosesLeft: 5,
    remindToReorderAt: 7,
  },
  {
    id: "bedtime-pen",
    name: "Bedtime pen",
    form: "Pre-filled pen",
    dose: "10 units",
    slot: "Bedtime",
    time: "20:00",
    repeats: "Every day",
    prescriber: "Your diabetes clinic",
    dosesLeft: 18,
    remindToReorderAt: 5,
  },
]

/**
 * A medicine the person has stopped taking.
 *
 * Kept with its dates rather than deleted, because the first question a clinician
 * asks about a medicine somebody used to take is when they stopped. The medications
 * pattern states the rule; this is the surface that keeps it.
 */
interface StoppedMedicine {
  id: string
  name: string
  startedOn: string
  stoppedOn: string
  reason: string
}

const STOPPED_MEDICINES: StoppedMedicine[] = [
  {
    id: "old-morning-tablet",
    name: "Old morning tablet",
    startedOn: "12 August 2025",
    stoppedOn: "2 February 2026",
    reason: "Your GP surgery changed it at your review.",
  },
]

/** The four states a logged dose can be in, as DoseTracker names them. */
type LoggedState = "taken" | "missed" | "skipped" | "scheduled"

/** One entry in today's log, in the shape DoseTracker takes. */
interface LoggedDose {
  name: string
  time: string
  state: LoggedState
  note?: string
}

/**
 * Today's log as it stands when the app opens: one entry, because one dose has been
 * recorded.
 *
 * WHAT IS NOT HERE IS THE POINT. The Saturday injection, due at 09:00 with nothing
 * recorded against it, is absent because nothing has been logged about it. It is a
 * question rather than a log entry, and the CareCard above the log is where it is
 * asked. The midday tablet and the bedtime pen are absent because they have not
 * happened: they belong to the day's plan, which is a different thing from the
 * day's log and is drawn separately below.
 *
 * That separation is forced by the kit rather than chosen for tidiness. DoseTracker
 * forwards every entry's instant to RelativeTime, RelativeTime treats any instant
 * later than `now` as two clocks disagreeing and warns about it, and it prefixes
 * every entry with the word "Recorded". Both are correct for a log and both are
 * wrong for a dose that has not happened yet, so a dose that has not happened yet
 * does not go in the log.
 */
const OPENING_LOG: LoggedDose[] = [
  {
    name: "Morning tablet",
    time: "2026-03-14T08:05:00+00:00",
    state: "taken",
    note: "With breakfast",
  },
]

/** One event in the record the person can hand over at an appointment. */
interface RecordedEvent {
  id: string
  when: string
  title: string
  detail: string
}

/** One day of that record, with its heading and the events under it. */
interface RecordedDay {
  day: string
  events: RecordedEvent[]
}

/**
 * The last seven days, most recent first, grouped by the day heading above them.
 *
 * Grouped as data rather than flattened and re-split in the render, because a
 * TimelineEntry renders its own list item and therefore has to be a direct child
 * of a list. A day separator is not a list item, so it sits outside the list and
 * each day gets a list of its own. That is the shape the markup has to have, so it
 * is the shape the data has.
 *
 * Two entries say the person told the app they did not take a dose. Nothing here
 * grades a day, ranks one against another, or draws a line through any of it. It
 * is a list of what was recorded, in the order it was recorded, which is what a
 * paper medicines chart is and what this product replaces.
 */
const RECORDED_DAYS: RecordedDay[] = [
  {
    day: "Friday 13 March",
    events: [
      {
        id: "e1",
        when: "2026-03-13T20:04:00+00:00",
        title: "Bedtime pen, recorded as taken",
        detail: "10 units, as you typed it in.",
      },
      {
        id: "e2",
        when: "2026-03-13T13:10:00+00:00",
        title: "Midday tablet, recorded as not taken",
        detail: "You added a note: away from home.",
      },
      {
        id: "e3",
        when: "2026-03-13T08:02:00+00:00",
        title: "Morning tablet, recorded as taken",
        detail: "1 tablet, as you typed it in.",
      },
    ],
  },
  {
    day: "Thursday 12 March",
    events: [
      {
        id: "e4",
        when: "2026-03-12T20:16:00+00:00",
        title: "Bedtime pen, recorded as taken",
        detail: "10 units, as you typed it in.",
      },
      {
        id: "e5",
        when: "2026-03-12T12:58:00+00:00",
        title: "Midday tablet, recorded as taken",
        detail: "1 tablet, as you typed it in.",
      },
      {
        id: "e6",
        when: "2026-03-12T08:09:00+00:00",
        title: "Morning tablet, recorded as taken",
        detail: "1 tablet, as you typed it in.",
      },
    ],
  },
  {
    day: "Wednesday 11 March",
    events: [
      {
        id: "e7",
        when: "2026-03-11T21:40:00+00:00",
        title: "Bedtime pen, recorded as not taken",
        detail: "You added a note: fell asleep early.",
      },
      {
        id: "e8",
        when: "2026-03-11T08:01:00+00:00",
        title: "Morning tablet, recorded as taken",
        detail: "1 tablet, as you typed it in.",
      },
    ],
  },
]

/**
 * The counts under the record.
 *
 * Raw counts and nothing else. There is no percentage, no run of days, no score
 * and no verdict, and the reason is not squeamishness: the moment a count becomes
 * a grade, the product has interpreted the person's own data, and interpretation
 * is the step from a diary into a regulated device. A count also survives the
 * thing a percentage does not, which is a person who was correctly told to hold a
 * medicine and would otherwise be marked down for doing the right thing.
 */
const RECORDED_COUNTS = {
  sevenDays: { recorded: 18, scheduled: 22 },
  fourWeeks: { recorded: 71, scheduled: 88 },
}

/**
 * The searchable list the "add a medicine" step offers.
 *
 * Name and form only, with the dose typed in by the person at the next step. A
 * picker that offered strengths would be a menu of doses, and a product that
 * prefilled one would be recommending it. In a real product this list is a
 * licensed medicines dictionary; here it is four placeholders, because opsinjs
 * examples ship no drug data.
 */
const EXAMPLE_MEDICINE_LIST = [
  { value: "example-tablet", label: "Example tablet" },
  { value: "example-capsule", label: "Example capsule" },
  { value: "example-pen", label: "Example pre-filled pen" },
  { value: "example-liquid", label: "Example liquid" },
]

/**
 * The clock time each slot starts at, so a medicine added in the flow below has a
 * time to show rather than an empty line.
 *
 * It is a scheduling convenience and not a dosing decision, and the difference is
 * worth stating because the product may make the first and may not make the
 * second. The person picks the part of their day; this turns their pick into a
 * clock time, and the review step says plainly that they can change it. What the
 * product never does is choose a schedule because of what the medicine is, which
 * is the thing that would be a recommendation.
 */
const SLOT_TIMES: Record<string, string> = {
  morning: "08:00",
  midday: "13:00",
  evening: "18:00",
  bedtime: "22:00",
}

/** The four slots people plan a day around, offered as choices and never invented. */
const SLOT_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "midday", label: "Midday" },
  { value: "evening", label: "Evening" },
  { value: "bedtime", label: "Bedtime" },
]

/**
 * How long before a dose the person asked to be reminded. Their choice, not ours.
 *
 * The value and the label are the same words on purpose. Select applies its `label`
 * as the trigger's accessible name and leaves the trigger's visible text to Base
 * UI, which falls back to the raw value until the popup has been opened once, so an
 * id-shaped value reads as an id on first paint. Writing the words as the value is
 * the product's way round that; the finding itself belongs to Select and is
 * recorded on this screen's documentation page rather than patched here.
 */
const LEAD_OPTIONS = [
  { value: "At the time", label: "At the time" },
  { value: "10 minutes before", label: "10 minutes before" },
  { value: "30 minutes before", label: "30 minutes before" },
  { value: "1 hour before", label: "1 hour before" },
]

/**
 * What a reminder is allowed to put on a lock screen.
 *
 * The least revealing choice is first and is the default, because a notification
 * is read by whoever can see the phone and the product may not raise a person's
 * disclosure level on their behalf. The notifications doctrine sets this rule and
 * names a medicine name in a visible body as the thing never permitted, which is
 * why the second option is an opt-in rather than the starting point.
 */
const DISCLOSURE_OPTIONS = [
  {
    value: "time-only",
    label: "Only that a medicine is due",
    description:
      "Anyone who can see your phone learns that you take a medicine, and nothing else.",
  },
  {
    value: "with-name",
    label: "The medicine's name as well",
    description:
      "Easier to act on without unlocking. Anyone who can see your phone reads the name too.",
  },
]

/** The window the record can be read over. Both are the person's to pick. */
const WINDOW_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "28", label: "4 weeks" },
]

/** The two answers the app accepts about a dose. There is no third. */
const OUTCOME_OPTIONS = [
  {
    value: "taken",
    label: "I took it",
    description: "Recorded as taken at the time below.",
  },
  {
    value: "not-taken",
    label: "I did not take it",
    description: "Recorded as not taken. Nothing else happens.",
  },
]

/** The steps in adding a medicine, so the person can see how far it goes. */
const ADD_STEPS = [
  { label: "Find the medicine", description: "Search by the name on the box." },
  { label: "Type in the dose", description: "Copy it from your label." },
  { label: "Choose the times", description: "Pick the slots that suit you." },
  { label: "Read it back", description: "Confirm what will be saved." },
]

/**
 * The two words the app leans on that a reader may not have met.
 *
 * Term expands them in place, which is the only route that works on a touch
 * screen and for a keyboard. Neither gloss states a threshold, names a medicine
 * or says anything clinical, so the product asserts nothing by carrying them.
 */
const GLOSSARY: readonly GlossaryEntry[] = [
  {
    id: "repeat-prescription",
    word: "repeat prescription",
    plain:
      "a prescription your surgery lets you order again without seeing anyone first",
  },
  {
    id: "pre-filled-pen",
    word: "pre-filled pen",
    plain: "an injection device that already holds the medicine inside it",
  },
]

/** The backdating window this product chose. opsinjs ships no default for it. */
const EXAMPLE_BACKDATE_WINDOW = 7

/**
 * The emergency routing, written by the product.
 *
 * opsinjs refuses to ship an emergency number, for the same reason it refuses to
 * ship a reference range: it does not know where the reader is. So the product
 * supplies one, names the country it applies to, and tells a reader outside that
 * country to use their own. There is no threshold attached to it and nothing
 * triggers it, because an emergency affordance that fires when a number crosses a
 * value is the product making a triage judgement.
 */
const EMERGENCY_ROUTING =
  "If you feel very unwell, or you are worried about someone, this app cannot help. " +
  "In the UK call 999 in an emergency, or 111 if you are not sure what to do. " +
  "Outside the UK use your local emergency number."

/* ====================================================================== *
 * Small pieces of layout the product owns                                 *
 * ====================================================================== */

/** A section heading, so the outline of the app reads as a summary of it. */
function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2
      id="opsin-app-section"
      className="text-opsin-title3 m-0 [color:var(--foreground)]"
    >
      {children}
    </h2>
  )
}

/** A quiet line of supporting text, used under headings and beside facts. */
function Quiet({ children }: { children: ReactNode }) {
  return (
    <p className="text-opsin-footnote m-0 [color:var(--muted-foreground)]">
      {children}
    </p>
  )
}

/**
 * A visible name for a control that carries its own accessible name.
 *
 * Select and NumberField both apply their `label` as an `aria-label` and ship no
 * visible text, and neither exposes the id of the element inside it, so a product
 * that wants the words on screen renders them itself and passes the same words to
 * the control. It is a span rather than a `label` element for exactly that reason:
 * a `label` with nothing to point at is markup that looks associated and is not.
 * The words match the accessible name, so what a person says matches what they see.
 */
function ControlLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-opsin-subheadline [color:var(--foreground)]">
      {children}
    </span>
  )
}

/** The vertical rhythm every section shares, so the four read as one product. */
function Stack({ children }: { children: ReactNode }) {
  return <div className="gap-opsin-5 flex w-full flex-col">{children}</div>
}

/* ====================================================================== *
 * The app                                                                 *
 * ====================================================================== */

/**
 * The zero-prop default export (ADR 0009). `/view` renders this with no props and
 * the documentation page frames it, so it is reviewed code rather than a scratch
 * demo.
 */
export default function DiabetesMedicinesApp() {
  /* Which of the four destinations is showing. The bar keeps no state of its own. */
  const [section, setSection] = useState("today")

  /* The list the person is keeping, and the list of what they have stopped. Both
     are state rather than constants because both controls that change them are
     real: a medicine added in the flow appears here, and a medicine stopped moves
     across rather than disappearing. A record that can only be added to is a
     record nobody can correct. */
  const [medicines, setMedicines] = useState<ExampleMedicine[]>(MEDICINES)
  const [stopped, setStopped] = useState<StoppedMedicine[]>(STOPPED_MEDICINES)

  /**
   * Where focus lands when a destination changes.
   *
   * A bottom bar that swaps the whole main region without moving focus leaves a
   * screen-reader user and a keyboard user at the foot of a page that is no longer
   * the page they were on. The region takes focus programmatically, so the next
   * thing read is the heading of the section they asked for, and it carries
   * `tabIndex={-1}` so it is focusable without entering the tab order.
   */
  const mainRef = useRef<HTMLElement | null>(null)

  /**
   * The box the summary sits in, so the control beside it can select the text.
   *
   * The wrapper rather than the control itself, because Textarea takes the props a
   * textarea takes and does not forward a ref, and reaching for the element through
   * the box the product owns is preferable to swapping a component out of the kit
   * for a bare element to get one.
   */
  const summaryRef = useRef<HTMLDivElement | null>(null)

  function goToSection(next: string) {
    setSection(next)
    mainRef.current?.focus()
  }

  /* Today's log. It starts as the three entries above and grows by exactly what
     the person records, never by anything the app worked out for itself. */
  const [log, setLog] = useState<LoggedDose[]>(OPENING_LOG)

  /* The 09:00 injection nobody has answered for. It leaves this state only when
     the person answers, and the clock never moves it. */
  const [injectionAnswered, setInjectionAnswered] = useState(false)

  /* The last thing recorded, held so the confirmation and its undo can stay on the
     surface until the person is finished with them. A confirmation that vanishes on
     a timer is unreadable at the reading speed this product is built for, and it
     takes the undo away with it. */
  const [lastRecorded, setLastRecorded] = useState<string | null>(null)
  const [undoTarget, setUndoTarget] = useState<LoggedDose[] | null>(null)

  /* The overlays. Each is a place the person chose to go and can leave. */
  const [logSheetOpen, setLogSheetOpen] = useState(false)
  const [addingMedicine, setAddingMedicine] = useState(false)
  const [aboutSheetOpen, setAboutSheetOpen] = useState(false)
  const [consentOpen, setConsentOpen] = useState(false)
  const [stopDialogFor, setStopDialogFor] = useState<string | null>(null)

  /* The log sheet's two controls. LogSheet never reads its children, so the keys
     that reach LogEntry.values are written here beside the controls. */
  const [entryValues, setEntryValues] = useState<
    Record<string, number | string | null>
  >({ medicine: null, outcome: null })

  /* The add-a-medicine sheet, which is a four-step flow shown one step at a time. */
  const [addStep, setAddStep] = useState(0)
  const [addChoice, setAddChoice] = useState<string | null>(null)
  const [addDose, setAddDose] = useState("")
  const [addSlot, setAddSlot] = useState("morning")

  /* The reminder settings. Everything here is the person's own choice, including
     every number, and the app supplies no default beyond the least revealing one. */
  const [remindersOn, setRemindersOn] = useState(false)
  const [perMedicine, setPerMedicine] = useState<Record<string, boolean>>({
    "morning-tablet": true,
    "saturday-injection": true,
    "midday-tablet": true,
    "bedtime-pen": true,
  })
  const [lead, setLead] = useState("10 minutes before")
  const [disclosure, setDisclosure] = useState("time-only")
  const [reorderReminders, setReorderReminders] = useState(true)
  const [reorderWhenLeft, setReorderWhenLeft] = useState<number | null>(7)

  /* The record window and the copyable summary. */
  const [recordWindow, setRecordWindow] = useState("7")
  const [summaryDraft, setSummaryDraft] = useState(buildSummary("7", MEDICINES))

  const counts =
    recordWindow === "7" ? RECORDED_COUNTS.sevenDays : RECORDED_COUNTS.fourWeeks

  /** The medicines whose remaining count has reached the person's own reorder point. */
  const needingReorder = medicines.filter(
    (medicine) =>
      medicine.remindToReorderAt > 0 &&
      medicine.dosesLeft <= medicine.remindToReorderAt
  )

  /**
   * The rest of today, which is a plan and not a log.
   *
   * A dose leaves this list the moment something is recorded about it, in either
   * direction, because the question it represents has then been answered. Nothing
   * moves it on its own and no clock removes it, so a dose whose time has passed
   * with no answer stays a question rather than becoming a verdict.
   */
  const recorded = new Set(log.map((entry) => entry.name))
  const stillToCome = medicines.filter(
    (medicine) => medicine.time > TIME_NOW && !recorded.has(medicine.name)
  )

  /**
   * Record an answer about a dose.
   *
   * The state is the person's word, never an inference. `taken` and `missed` both
   * arrive here only because somebody pressed a control that says so in the first
   * person, and the instant recorded is the instant they gave.
   */
  function record(entry: LoggedDose, confirmation: string) {
    setUndoTarget(log)
    setLog((current) => [entry, ...current])
    setLastRecorded(confirmation)
  }

  /** Put the log back exactly as it was. Available until the person dismisses it. */
  function undo() {
    if (undoTarget !== null) setLog(undoTarget)
    setUndoTarget(null)
    setLastRecorded(null)
    setInjectionAnswered(false)
  }

  return (
    <TermGlossaryProvider glossary={GLOSSARY}>
      <Surface rung="canvas" className="flex min-h-full w-full flex-col">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
          {/* The app bar. One H1 for the whole application, the day it is
              showing, and the marker that says what this is, which sits on the
              surface rather than in an about screen nobody opens. */}
          <header className="gap-opsin-3 px-opsin-4 pt-opsin-5 pb-opsin-3 flex flex-wrap items-start justify-between">
            <div className="gap-opsin-1 flex min-w-0 flex-col">
              <h1 className="text-opsin-title2 m-0 [color:var(--foreground)]">
                Your medicines
              </h1>
              <Quiet>{TODAY_IN_WORDS}</Quiet>
            </div>
            {/* No `shrink-0`. At the largest text size the badge and the control
                beside it are wider than what is left of the row, and a cluster
                that refuses to shrink pushes the document sideways instead of
                wrapping under the title. Reflow is the requirement; keeping the
                two on one line is not. */}
            <div className="gap-opsin-2 flex flex-wrap items-center">
              <Badge variant="outline" srLabel="This is a demonstration">
                Demonstration
              </Badge>
              <IconButton
                icon={<Info />}
                label="About this demonstration"
                variant="quiet"
                onClick={() => setAboutSheetOpen(true)}
              />
            </div>
          </header>

          <main
            ref={mainRef}
            tabIndex={-1}
            aria-labelledby="opsin-app-section"
            className="px-opsin-4 pb-opsin-8 flex-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {section === "today" ? (
              <Stack>
                <SectionHeading>Today</SectionHeading>

                {/* The unanswered dose. It is a question, not a log entry, and
                    the two controls are the person's two possible answers. There
                    is no catch-up control and no third option, because a control
                    that tells somebody to take a medicine now is dosing advice
                    drawn as a rectangle. */}
                {injectionAnswered ? null : (
                  <CareCard
                    heading="Record your Saturday injection"
                    urgency="today"
                    attribution="A reminder you set in this app"
                    reason="Nothing is recorded against 09:00 today. This app cannot tell whether you took it, so it is asking you."
                    headingLevel={3}
                    actions={[
                      {
                        label: "I took it",
                        onSelect: () => {
                          setInjectionAnswered(true)
                          record(
                            {
                              name: "Saturday injection",
                              time: "2026-03-14T09:00:00+00:00",
                              state: "taken",
                            },
                            "Recorded as taken at 09:00. This records what you told the app. It does not check that you took it."
                          )
                        },
                      },
                      {
                        label: "I did not take it",
                        onSelect: () => {
                          setInjectionAnswered(true)
                          record(
                            {
                              name: "Saturday injection",
                              time: "2026-03-14T09:00:00+00:00",
                              state: "missed",
                              note: "You told the app you did not take this one",
                            },
                            "Recorded as not taken. Nothing else happens, and nothing is counted against you."
                          )
                        },
                      },
                    ]}
                  />
                )}

                {/* What the product says about a dose that was not taken, which
                    is that it does not know and that a person does. The regulator
                    names referral to a human as one of the things that keeps
                    software outside the device definition, and it is also simply
                    true: the answer differs by medicine and by person. */}
                <Callout variant="caveat" title="A dose you did not take">
                  <p className="m-0">
                    This app does not tell you what to do about a dose you did
                    not take. What to do depends on which medicine it is, and on
                    you. Your pharmacist or the person who prescribes for you
                    can tell you, and the leaflet in the box says what the maker
                    advises.
                  </p>
                </Callout>

                {/* The confirmation, which stays until it is dismissed. Undo lasts
                    as long as the confirmation does rather than for a few seconds,
                    because a control that leaves on a timer is a control somebody
                    reading slowly never reaches. */}
                {lastRecorded === null ? null : (
                  <Card rung="raised">
                    {/* Announced as well as shown. A confirmation that only appears
                        is a confirmation a screen-reader user has to go looking
                        for, and the undo beside it is what they would be looking
                        for it to find. */}
                    <div role="status" className="gap-opsin-3 flex flex-col">
                      <p className="text-opsin-body m-0 [color:var(--foreground)]">
                        {lastRecorded}
                      </p>
                      <div className="gap-opsin-2 flex flex-wrap">
                        <Button
                          variant="secondary"
                          icon={<Undo2 />}
                          onClick={undo}
                        >
                          Undo that
                        </Button>
                        <Button
                          variant="quiet"
                          onClick={() => {
                            setLastRecorded(null)
                            setUndoTarget(null)
                          }}
                        >
                          Hide this message
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* The log itself. DoseTracker draws what it is handed and reaches
                    no verdict about any of it, which is exactly the contract this
                    product needs from it. */}
                <div className="gap-opsin-2 flex flex-col">
                  <h3 className="text-opsin-headline m-0 [color:var(--foreground)]">
                    Your record for today
                  </h3>
                  {log.length === 0 ? (
                    <EmptyState
                      reason="nothing-yet"
                      title="Nothing recorded yet today"
                      titleLevel={4}
                    >
                      Recording a dose puts it here, with the time you give.
                    </EmptyState>
                  ) : (
                    <DoseTracker
                      label="Doses recorded for today"
                      now={NOW}
                      entries={log}
                    />
                  )}
                </div>

                {/* The rest of the day. It is deliberately NOT inside the log
                    above: a dose that has not happened has no recording instant,
                    and the log renders every instant it is handed as a moment
                    something was recorded. So the plan is drawn by the product,
                    out of the same kit, and says its times plainly. */}
                {stillToCome.length === 0 ? null : (
                  <div className="gap-opsin-2 flex flex-col">
                    <h3 className="text-opsin-headline m-0 [color:var(--foreground)]">
                      Still to come today
                    </h3>
                    <ul className="gap-opsin-2 m-0 flex list-none flex-col p-0">
                      {stillToCome.map((medicine) => (
                        <li key={medicine.id}>
                          <Card density="compact">
                            <div className="gap-opsin-2 flex flex-wrap items-baseline justify-between">
                              <div className="gap-opsin-1 flex min-w-0 flex-col">
                                <span className="text-opsin-body [color:var(--foreground)]">
                                  {medicine.name}
                                </span>
                                <span className="text-opsin-footnote [color:var(--muted-foreground)]">
                                  {medicine.dose}
                                </span>
                              </div>
                              <div className="gap-opsin-2 flex shrink-0 items-baseline">
                                <Badge variant="outline">{medicine.slot}</Badge>
                                <span className="text-opsin-footnote [color:var(--muted-foreground)]">
                                  at {medicine.time}
                                </span>
                              </div>
                            </div>
                          </Card>
                        </li>
                      ))}
                    </ul>
                    <Quiet>
                      Nothing here is recorded yet, and nothing will record
                      itself.
                    </Quiet>
                  </div>
                )}

                <Button
                  variant="primary"
                  fullWidth
                  icon={<Plus />}
                  onClick={() => {
                    setEntryValues({ medicine: null, outcome: null })
                    setLogSheetOpen(true)
                  }}
                >
                  Record a dose
                </Button>

                <SourceCitation
                  source="Every medicine, dose and time here was typed in by you. Nothing came from a pharmacy, a surgery or a device."
                  checkedOn="2026-03-14"
                  locale="en-GB"
                />
              </Stack>
            ) : null}

            {section === "medicines" ? (
              <Stack>
                <SectionHeading>Your medicines</SectionHeading>

                {/* The sentence the whole product turns on, placed where the doses
                    are rather than in an about screen. */}
                <Callout variant="caveat" title="This list is your copy">
                  <p className="m-0">
                    The doses here are the ones you typed in. Your prescription
                    is what the person who prescribes for you wrote. If the two
                    disagree, your prescription is right and this app is wrong.
                    Do not start, stop or change a medicine because of anything
                    you see here.
                  </p>
                </Callout>

                {needingReorder.length === 0 ? null : (
                  <CareCard
                    heading="Order more from your surgery"
                    urgency="this-week"
                    attribution="A reminder you set in this app"
                    reason={`You asked this app to remind you when a medicine ran low. The count you chose has been reached for: ${needingReorder
                      .map((medicine) => medicine.name)
                      .join(", ")}.`}
                    headingLevel={3}
                    actions={[
                      {
                        label: "Change when this reminds me",
                        onSelect: () => goToSection("reminders"),
                      },
                    ]}
                  />
                )}

                {medicines.map((medicine) => (
                  <Card key={medicine.id}>
                    <div className="gap-opsin-3 flex flex-col">
                      <div className="gap-opsin-2 flex flex-wrap items-start justify-between">
                        <div className="gap-opsin-1 flex min-w-0 flex-col">
                          <h3 className="text-opsin-headline m-0 [color:var(--foreground)]">
                            {medicine.name}
                          </h3>
                          <Badge variant="soft">{medicine.form}</Badge>
                        </div>
                        <Menu
                          trigger={
                            <button
                              type="button"
                              aria-label={`Actions for ${medicine.name}`}
                              className="hover:bg-state-hover inline-flex min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem) cursor-pointer items-center justify-center rounded-opsin-md border border-border bg-background [color:var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                              <EllipsisVertical
                                aria-hidden="true"
                                className="size-opsin-5"
                              />
                            </button>
                          }
                          items={[
                            {
                              label: "Change the reminder times",
                              onClick: () => goToSection("reminders"),
                            },
                            {
                              label: "I have stopped taking this",
                              separatorBefore: true,
                              onClick: () => setStopDialogFor(medicine.id),
                            },
                          ]}
                        />
                      </div>

                      <dl className="gap-opsin-2 m-0 grid grid-cols-1">
                        <div className="gap-opsin-2 flex flex-wrap items-baseline">
                          <dt className="text-opsin-footnote m-0 [color:var(--muted-foreground)]">
                            How much
                          </dt>
                          <dd className="text-opsin-body m-0 [color:var(--foreground)]">
                            {medicine.dose}
                          </dd>
                        </div>
                        <div className="gap-opsin-2 flex flex-wrap items-baseline">
                          <dt className="text-opsin-footnote m-0 [color:var(--muted-foreground)]">
                            When
                          </dt>
                          <dd className="text-opsin-body m-0 [color:var(--foreground)]">
                            {medicine.slot} at {medicine.time}.{" "}
                            {medicine.repeats}.
                          </dd>
                        </div>
                        <div className="gap-opsin-2 flex flex-wrap items-baseline">
                          <dt className="text-opsin-footnote m-0 [color:var(--muted-foreground)]">
                            Prescribed by
                          </dt>
                          <dd className="text-opsin-body m-0 [color:var(--foreground)]">
                            {medicine.prescriber}
                          </dd>
                        </div>
                        <div className="gap-opsin-2 flex flex-wrap items-baseline">
                          <dt className="text-opsin-footnote m-0 [color:var(--muted-foreground)]">
                            Left in the pack
                          </dt>
                          <dd className="text-opsin-body m-0 [color:var(--foreground)]">
                            {medicine.remindToReorderAt === 0
                              ? "You have not counted this one yet"
                              : `${medicine.dosesLeft}, at the count you last set`}
                          </dd>
                        </div>
                      </dl>

                      <p className="text-opsin-footnote m-0 [color:var(--muted-foreground)]">
                        Copied by you from your label. Your prescription is what
                        your prescriber wrote.
                      </p>
                    </div>
                  </Card>
                ))}

                {/* Adding a medicine is a task rather than a quick action, so it
                    happens here on the page rather than in a sheet over it. Two
                    reasons, and the second is a defect this specimen found. The
                    medications pattern asks for a search the reader can take
                    their time over, and a slow task on a small surface belongs on
                    a page. And a Combobox cannot be used inside a Sheet at all:
                    its popup and the sheet's own surface sit at the same stacking
                    level with the sheet later in the document, so the sheet paints
                    over the results and a press lands on the sheet. On the page it
                    works. */}
                {addingMedicine ? null : (
                  <Button
                    variant="primary"
                    fullWidth
                    icon={<Plus />}
                    onClick={() => {
                      setAddStep(0)
                      setAddChoice(null)
                      setAddDose("")
                      setAddSlot("morning")
                      setAddingMedicine(true)
                    }}
                  >
                    Add a medicine
                  </Button>
                )}

                {addingMedicine ? (
                  <Card rung="raised">
                    <div className="gap-opsin-5 flex flex-col">
                      <div className="gap-opsin-1 flex flex-col">
                        <h3 className="text-opsin-headline m-0 [color:var(--foreground)]">
                          Add a medicine
                        </h3>
                        <Quiet>
                          Four steps, and the last one reads back exactly what
                          will be saved. Nothing is filled in for you, because a
                          dose this app suggested would be a dose nobody
                          prescribed.
                        </Quiet>
                      </div>

                      <Stepper current={addStep} steps={ADD_STEPS} />

                      <div className="gap-opsin-4 flex flex-col">
                        {addStep === 0 ? (
                          <>
                            <Combobox
                              label="Search for the medicine"
                              placeholder="Type the name on the box"
                              emptyMessage="No match. You can still type the name in yourself at the next step."
                              items={EXAMPLE_MEDICINE_LIST}
                              value={addChoice}
                              onValueChange={setAddChoice}
                            />
                            <Quiet>
                              This demonstration searches four placeholder
                              names. A real product searches a licensed
                              medicines list, matches the name on the box and
                              the name on the prescription, and never picks one
                              for you.
                            </Quiet>
                          </>
                        ) : null}

                        {addStep === 1 ? (
                          <>
                            <Field
                              label="How much do you take?"
                              hint="Copy this from your label, in the words it uses. For an injection, write the word units out in full."
                            >
                              <Field.Control
                                name="dose"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                value={addDose}
                                onChange={(event) =>
                                  setAddDose(event.target.value)
                                }
                              />
                            </Field>
                            <Quiet>
                              Nothing is offered here on purpose. A list of
                              strengths to pick from is a list of doses, and
                              this app is not entitled to put one in front of
                              you.
                            </Quiet>
                          </>
                        ) : null}

                        {addStep === 2 ? (
                          <RadioGroup
                            label="Which part of the day?"
                            value={addSlot}
                            options={SLOT_OPTIONS}
                            onValueChange={setAddSlot}
                          />
                        ) : null}

                        {addStep === 3 ? (
                          <div className="gap-opsin-2 flex flex-col">
                            <h4 className="text-opsin-subheadline m-0 [color:var(--foreground)]">
                              Read this back
                            </h4>
                            <p className="text-opsin-body m-0 [color:var(--foreground)]">
                              {addChoice === null
                                ? "No medicine chosen yet."
                                : (EXAMPLE_MEDICINE_LIST.find(
                                    (item) => item.value === addChoice
                                  )?.label ?? "No medicine chosen yet.")}
                            </p>
                            <p className="text-opsin-body m-0 [color:var(--foreground)]">
                              {addDose === ""
                                ? "No dose typed in yet."
                                : addDose}
                            </p>
                            <p className="text-opsin-body m-0 [color:var(--foreground)]">
                              {
                                SLOT_OPTIONS.find(
                                  (slot) => slot.value === addSlot
                                )?.label
                              }{" "}
                              at {SLOT_TIMES[addSlot]}
                            </p>
                            <Quiet>
                              The time is where this app starts that part of the
                              day. You can change it, and changing it changes
                              only your reminder.
                            </Quiet>
                            <Quiet>
                              Saving this stores what you typed. It does not
                              tell anyone, and it does not change your
                              prescription.
                            </Quiet>
                          </div>
                        ) : null}
                      </div>

                      <div className="gap-opsin-2 flex flex-col">
                        <Button
                          variant="primary"
                          fullWidth
                          onClick={() => {
                            if (addStep < ADD_STEPS.length - 1) {
                              setAddStep(addStep + 1)
                              return
                            }
                            /* The last step saves what was read back, and nothing
                               else. Every field on the new record came from the
                               person: the name they chose, the dose they typed,
                               the part of the day they picked. The two counts
                               start at zero because this app has no idea what is
                               in the pack, and the card says so rather than
                               printing a guess. */
                            const chosen = EXAMPLE_MEDICINE_LIST.find(
                              (item) => item.value === addChoice
                            )
                            if (chosen !== undefined && addDose.trim() !== "") {
                              const slot = SLOT_OPTIONS.find(
                                (item) => item.value === addSlot
                              )
                              const added: ExampleMedicine = {
                                id: `${chosen.value}-${medicines.length}`,
                                name: chosen.label,
                                form: "As you entered it",
                                dose: addDose.trim(),
                                slot: slot?.label ?? "Morning",
                                time: SLOT_TIMES[addSlot] ?? "08:00",
                                repeats: "Every day",
                                prescriber:
                                  "You have not recorded who prescribed this",
                                dosesLeft: 0,
                                remindToReorderAt: 0,
                              }
                              setMedicines((current) => [...current, added])
                              setPerMedicine((current) => ({
                                ...current,
                                [added.id]: true,
                              }))
                            }
                            setAddingMedicine(false)
                          }}
                        >
                          {addStep < ADD_STEPS.length - 1
                            ? "Next"
                            : "Save this medicine"}
                        </Button>
                        <Button
                          variant="quiet"
                          fullWidth
                          onClick={() => setAddingMedicine(false)}
                        >
                          {addStep === 0
                            ? "Not now"
                            : "Stop adding this medicine"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : null}

                <Accordion
                  items={[
                    {
                      value: "stopped",
                      title: "Medicines you have stopped",
                      content:
                        stopped.length === 0 ? (
                          <EmptyState
                            reason="nothing-yet"
                            title="Nothing here yet"
                            titleLevel={4}
                          >
                            A medicine you stop is kept here with the dates, so
                            you can say when you stopped it.
                          </EmptyState>
                        ) : (
                          <ul className="gap-opsin-3 m-0 flex list-none flex-col p-0">
                            {stopped.map((medicine) => (
                              <li
                                key={medicine.id}
                                className="gap-opsin-1 flex flex-col"
                              >
                                <span className="text-opsin-body [color:var(--foreground)]">
                                  {medicine.name}
                                </span>
                                <Quiet>
                                  Started {medicine.startedOn}. Stopped{" "}
                                  {medicine.stoppedOn}. {medicine.reason}
                                </Quiet>
                              </li>
                            ))}
                          </ul>
                        ),
                    },
                    {
                      value: "ordering",
                      title: "Ordering more",
                      content: (
                        <p className="text-opsin-body m-0 [color:var(--foreground)]">
                          This app cannot order anything. It can count what you
                          told it was in the pack and remind you. Ordering a{" "}
                          <Term id="repeat-prescription" /> is something you do
                          with your surgery or your pharmacy.
                        </p>
                      ),
                    },
                  ]}
                />
              </Stack>
            ) : null}

            {section === "record" ? (
              <Stack>
                <SectionHeading>Your record</SectionHeading>
                <Quiet>
                  What you recorded, in the order you recorded it. Nothing here
                  is scored and no day is graded.
                </Quiet>

                <SegmentedControl
                  label="How far back to read"
                  fullWidth
                  value={recordWindow}
                  options={WINDOW_OPTIONS}
                  onValueChange={(next) => {
                    setRecordWindow(next)
                    setSummaryDraft(buildSummary(next, medicines))
                  }}
                />

                <Card>
                  <div className="gap-opsin-1 flex flex-col">
                    <span className="text-opsin-footnote [color:var(--muted-foreground)]">
                      Doses you recorded
                    </span>
                    <Value
                      value={counts.recorded}
                      unit={null}
                      precision={0}
                      size="display"
                      locale="en-GB"
                    />
                    <Quiet>
                      out of {counts.scheduled} you had set times for, over the
                      last {recordWindow === "7" ? "7 days" : "4 weeks"}
                    </Quiet>
                  </div>
                </Card>

                {RECORDED_DAYS.length === 0 ? (
                  <EmptyState
                    reason="not-enough"
                    title="Nothing recorded in this window"
                    titleLevel={3}
                  >
                    Recording a dose puts it here. You can add a dose you took
                    earlier, and nothing is marked against you for a gap.
                  </EmptyState>
                ) : (
                  RECORDED_DAYS.map((entry) => (
                    <div key={entry.day} className="flex flex-col">
                      <Divider label={entry.day} className="mb-opsin-3" />
                      <ol className="m-0 flex list-none flex-col p-0">
                        {entry.events.map((event, index) => (
                          <TimelineEntry
                            key={event.id}
                            when={event.when}
                            now={NOW}
                            title={event.title}
                            isLast={index === entry.events.length - 1}
                          >
                            {event.detail}
                          </TimelineEntry>
                        ))}
                      </ol>
                    </div>
                  ))
                )}

                <Quiet>
                  This demonstration carries three days of entries whichever
                  window you choose. A real product would show every day inside
                  it.
                </Quiet>

                <Card>
                  <div className="gap-opsin-3 flex flex-col">
                    <h3 className="text-opsin-headline m-0 [color:var(--foreground)]">
                      Take this to an appointment
                    </h3>
                    <Quiet>
                      Everything below is what you told this app. Read it over,
                      edit anything that is wrong, then copy it.
                    </Quiet>
                    <Field
                      label="Your record, ready to copy"
                      hint="This is your own text. Changing it here changes only the copy you take away."
                    >
                      <div ref={summaryRef}>
                        <Textarea
                          rows={7}
                          aria-label="Your record, ready to copy"
                          value={summaryDraft}
                          onChange={(event) =>
                            setSummaryDraft(event.target.value)
                          }
                        />
                      </div>
                    </Field>
                    {/* It selects rather than writing to the clipboard, because a
                        clipboard write inside a documentation iframe is refused by
                        some browsers and a control that silently does nothing is
                        worse than one that plainly hands the job back. */}
                    <Button
                      variant="secondary"
                      icon={<Copy />}
                      onClick={() =>
                        summaryRef.current?.querySelector("textarea")?.select()
                      }
                    >
                      Select all of it, ready to copy
                    </Button>
                  </div>
                </Card>
              </Stack>
            ) : null}

            {section === "reminders" ? (
              <Stack>
                <SectionHeading>Reminders</SectionHeading>

                {/* The honest statement about what a browser can do, placed where
                    the reminders are set rather than in an about screen. A person
                    who relies on a reminder that cannot arrive is the one real
                    hazard a product like this creates. */}
                <Callout
                  variant="caveat"
                  title="Reminders can arrive late or not at all"
                >
                  <p className="m-0">
                    This app has no account and no server, so it can only show a
                    reminder while this page is open in your browser. Close the
                    tab, turn the device off, silence it, or turn notifications
                    off for this site, and no reminder arrives. Do not rely on
                    this as your only reminder. If a medicine matters to you,
                    set an alarm on your phone as well.
                  </p>
                </Callout>

                <Card>
                  <div className="gap-opsin-3 flex flex-col">
                    <Switch
                      label="Show reminders in this browser"
                      description={
                        remindersOn
                          ? "On. Keep this page open to see them."
                          : "Off. You can still see everything due today on this page."
                      }
                      checked={remindersOn}
                      onCheckedChange={(next) => {
                        if (next) {
                          setConsentOpen(true)
                          return
                        }
                        setRemindersOn(false)
                      }}
                    />
                    <div className="gap-opsin-1 flex flex-col">
                      <Quiet>The last reminder this page showed</Quiet>
                      <span className="text-opsin-footnote [color:var(--muted-foreground)]">
                        <RelativeTime
                          at="2026-03-14T08:00:00+00:00"
                          event="issued"
                          now={NOW}
                          locale="en-GB"
                        />
                      </span>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="gap-opsin-4 flex flex-col">
                    <h3 className="text-opsin-headline m-0 [color:var(--foreground)]">
                      Which medicines
                    </h3>
                    {medicines.map((medicine) => (
                      <Switch
                        key={medicine.id}
                        label={medicine.name}
                        description={`${medicine.slot} at ${medicine.time}`}
                        checked={perMedicine[medicine.id] ?? false}
                        onCheckedChange={(next) =>
                          setPerMedicine((current) => ({
                            ...current,
                            [medicine.id]: next,
                          }))
                        }
                      />
                    ))}
                  </div>
                </Card>

                <Card>
                  <div className="gap-opsin-4 flex flex-col">
                    <h3 className="text-opsin-headline m-0 [color:var(--foreground)]">
                      When and what
                    </h3>
                    <div className="gap-opsin-2 flex flex-col">
                      <ControlLabel>Remind me</ControlLabel>
                      <Select
                        label="Remind me"
                        value={lead}
                        options={LEAD_OPTIONS}
                        onValueChange={setLead}
                      />
                    </div>
                    <RadioGroup
                      label="What a reminder may show on a locked screen"
                      value={disclosure}
                      options={DISCLOSURE_OPTIONS}
                      onValueChange={setDisclosure}
                    />
                  </div>
                </Card>

                <Card>
                  <div className="gap-opsin-4 flex flex-col">
                    <h3 className="text-opsin-headline m-0 [color:var(--foreground)]">
                      Running low
                    </h3>
                    <Checkbox
                      label="Remind me to order more"
                      description="Counted from the number you said was in the pack."
                      checked={reorderReminders}
                      onCheckedChange={(next) =>
                        setReorderReminders(next === true)
                      }
                    />
                    <div className="gap-opsin-2 flex flex-col">
                      <ControlLabel>
                        Remind me when this many doses are left
                      </ControlLabel>
                      <NumberField
                        label="Remind me when this many doses are left"
                        value={reorderWhenLeft}
                        onValueChange={setReorderWhenLeft}
                        min={1}
                        step={1}
                        disabled={!reorderReminders}
                      />
                    </div>
                    <Quiet>
                      This number is yours. This app has no view about when a
                      medicine is running low, because it does not know what you
                      take or how quickly you can order more.
                    </Quiet>
                  </div>
                </Card>
              </Stack>
            ) : null}
          </main>

          {/* The boundary, in the same place on every section so it is findable
              rather than merely present. The emergency routing lives here because
              it has to be reachable from everywhere and must never be triggered. */}
          <div className="px-opsin-4 pb-opsin-4">
            <DisclaimerNote
              placement="footer"
              textVersion="Demonstration wording, version one"
            >
              Nothing in this app is medical advice, and it is a demonstration
              of interface components rather than a real product. It does not
              work out doses, it does not change them, and it decides nothing
              about your treatment. {EMERGENCY_ROUTING}
            </DisclaimerNote>
          </div>
        </div>

        {/* The destinations. Four, which is inside the two to five the bar accepts,
            and each one answers a different question rather than filtering the same
            list four ways. */}
        <div className="sticky bottom-0 z-10">
          <TabBar
            label="Main sections"
            value={section}
            onValueChange={goToSection}
            items={[
              { key: "today", label: "Today", icon: <CalendarCheck /> },
              { key: "medicines", label: "Medicines", icon: <Pill /> },
              { key: "record", label: "Record", icon: <ClipboardList /> },
              { key: "reminders", label: "Reminders", icon: <Bell /> },
            ]}
          />
        </div>
      </Surface>

      {/* ---------------------------------------------------------------- *
          The overlays
          ---------------------------------------------------------------- */}

      <LogSheet
        open={logSheetOpen}
        onOpenChange={(nextOpen) => setLogSheetOpen(nextOpen)}
        title="Record a dose"
        values={entryValues}
        saveLabel="Save this record"
        timeLabel="When did you take it?"
        noteLabel="Anything you want to remember about it"
        maxBackdateDays={EXAMPLE_BACKDATE_WINDOW}
        onSave={(entry: LogEntry) => {
          const chosen = medicines.find(
            (medicine) => medicine.id === entry.values.medicine
          )
          const outcome = entry.values.outcome
          setLogSheetOpen(false)
          if (chosen === undefined || outcome === null) return
          record(
            {
              name: chosen.name,
              time: onDemonstrationDay(entry.occurredAt),
              state: outcome === "taken" ? "taken" : "missed",
              note: entry.note,
            },
            outcome === "taken"
              ? "Recorded as taken. This records what you told the app. It does not check that you took it."
              : "Recorded as not taken. Nothing else happens, and nothing is counted against you."
          )
        }}
      >
        {/* A radio group rather than a select, for two reasons and the second one
            is a defect. Four medicines on a phone are four large targets a thumb
            can reach without opening anything, which is what this audience needs.
            And a select cannot be used here at all: its popup and the sheet's own
            surface both sit at the same stacking level, the sheet comes later in
            the document, so the sheet paints over the open list and a press lands
            on the sheet instead of on an option. The specimen's documentation
            page records that; this is the composition that works around it. */}
        <RadioGroup
          label="Which medicine?"
          value={
            typeof entryValues.medicine === "string" ? entryValues.medicine : ""
          }
          options={medicines.map((medicine) => ({
            value: medicine.id,
            label: medicine.name,
            description: `${medicine.dose}, ${medicine.slot} at ${medicine.time}`,
          }))}
          onValueChange={(next) =>
            setEntryValues((current) => ({ ...current, medicine: next }))
          }
        />

        <RadioGroup
          label="What happened?"
          value={
            typeof entryValues.outcome === "string" ? entryValues.outcome : ""
          }
          options={OUTCOME_OPTIONS}
          onValueChange={(next) =>
            setEntryValues((current) => ({ ...current, outcome: next }))
          }
        />

        {/* The seam between a fixed demonstration and a live control, said out
            loud rather than hidden. LogSheet reads the device clock for the time
            control below, which is right in a product and visibly at odds with a
            specimen pinned to one day, so the specimen says which day it is on and
            what it does with what you pick. */}
        <p className="text-opsin-footnote m-0 [color:var(--muted-foreground)]">
          This demonstration is set on {TODAY_IN_WORDS} 2026. The time control
          below reads the clock on your own device, so the time you choose is
          kept and the day is moved onto the demonstration&apos;s.
        </p>
      </LogSheet>

      <Sheet
        open={aboutSheetOpen}
        onOpenChange={(nextOpen) => setAboutSheetOpen(nextOpen)}
        title="About this demonstration"
      >
        <Sheet.Content>
          <Sheet.Description className="text-opsin-body">
            A reminder and a record. It is not advice.
          </Sheet.Description>

          <div className="mt-opsin-4 gap-opsin-4 flex flex-col">
            <p className="text-opsin-body m-0 [color:var(--foreground)]">
              This is a demonstration of user interface components inside a
              design system&apos;s documentation. It is not a real app, the
              medicines in it are invented, and it must not be used to keep
              track of real medicines.
            </p>
            <p className="text-opsin-body m-0 [color:var(--foreground)]">
              It does not work out doses. It does not change your doses. It
              decides nothing about your treatment, and it says nothing about
              what to do about a dose you did not take.
            </p>
            <p className="text-opsin-body m-0 [color:var(--foreground)]">
              The doses here are the ones you typed in. Your prescription is
              what your prescriber wrote. If the two disagree, your prescription
              is right and this app is wrong. Do not start, stop or change a
              medicine because of anything you see here. Talk to your prescriber
              or your pharmacist.
            </p>
            <p className="text-opsin-body m-0 [color:var(--foreground)]">
              Marking a dose as taken records what you told the app. It does not
              check that you took it.
            </p>
            <p className="text-opsin-body m-0 [color:var(--foreground)]">
              Nothing you type is stored. There is no account, no sign-in and no
              server, and nothing leaves this browser tab. Reloading the page
              puts the demonstration back where it started.
            </p>
            <p className="text-opsin-body m-0 [color:var(--foreground)]">
              {EMERGENCY_ROUTING}
            </p>
            <Quiet>
              Built by the opsinjs team as a documentation specimen. Report
              anything wrong with it on the opsinjs issue tracker. Demonstration
              wording, version one, last changed 20 September 2026.
            </Quiet>
            <Link
              href="https://github.com/prashantonomy/opsinjs"
              emphasis="secondary"
            >
              The opsinjs issue tracker
            </Link>
          </div>
        </Sheet.Content>
      </Sheet>

      {/* Turning reminders on is a decision about what a device may display in
          front of whoever can see it, so it is asked rather than assumed, and
          closing the sheet records nothing at all. */}
      <ConsentSheet
        open={consentOpen}
        onOpenChange={(nextOpen) => setConsentOpen(nextOpen)}
        consentId="browser-reminders"
        textVersion="reminders-wording-1"
        heading="Show reminders in this browser?"
        purpose="So this page can show you a reminder at the times you set, while it is open."
        scope={{
          collected:
            "The times you set and the medicines you chose. Nothing about you.",
          sharedWith:
            "Nobody. There is no account and no server, and nothing leaves this browser.",
          retention:
            "Until you reload or close this page. Nothing is written to your device.",
        }}
        withdrawalPath="Turn the switch off on this screen at any time, or turn notifications off for this site in your browser."
        details={{
          label: "What a reminder can and cannot do",
          content:
            "A browser with no server behind it can only show a reminder while this page is open. If you close the tab, turn the device off, or silence it, no reminder arrives. This is not a safe replacement for an alarm.",
        }}
        acceptLabel="Yes, show reminders here"
        declineLabel="No, not now"
        onDecision={(decision) => {
          setRemindersOn(decision.granted)
          setConsentOpen(false)
        }}
      />

      <Dialog
        open={stopDialogFor !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setStopDialogFor(null)
        }}
        title="Have you stopped taking this?"
        description="It moves out of your daily list and is kept with the date you stopped, so you can say when that was. Your prescription does not change, and nobody is told."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                const going = medicines.find(
                  (medicine) => medicine.id === stopDialogFor
                )
                if (going !== undefined) {
                  setMedicines((current) =>
                    current.filter((medicine) => medicine.id !== going.id)
                  )
                  setStopped((current) => [
                    {
                      id: going.id,
                      name: going.name,
                      startedOn: "a date you have not recorded",
                      stoppedOn: `${TODAY_IN_WORDS} 2026`,
                      reason: "You told this app you had stopped taking it.",
                    },
                    ...current,
                  ])
                }
                setStopDialogFor(null)
              }}
            >
              Yes, I have stopped it
            </Button>
            <Button variant="primary" onClick={() => setStopDialogFor(null)}>
              No, keep it in my list
            </Button>
          </>
        }
      />

      <VisuallyHidden>
        <p>
          This is a demonstration of design system components. The medicines,
          doses, times and counts in it are invented.
        </p>
      </VisuallyHidden>
    </TermGlossaryProvider>
  )
}

/**
 * The text the person takes to an appointment.
 *
 * Built here rather than in the render body so the draft can be edited without
 * being rebuilt underneath the person. Every line says whose statement it is, and
 * the stamp at the foot says when it was made and what it is, because a list of
 * medicines read by a clinician needs to carry its own provenance rather than
 * borrow the authority of the screen it was printed from.
 */
function buildSummary(window: string, list: ExampleMedicine[]): string {
  const counts =
    window === "7" ? RECORDED_COUNTS.sevenDays : RECORDED_COUNTS.fourWeeks
  const span = window === "7" ? "the last 7 days" : "the last 4 weeks"
  const lines = [
    "My medicines, as I typed them in.",
    "",
    ...list.map(
      (medicine) =>
        `${medicine.name}: ${medicine.dose}, ${medicine.slot} at ${medicine.time}. ${medicine.repeats}. Prescribed by ${medicine.prescriber}.`
    ),
    "",
    `Over ${span} I recorded ${counts.recorded} of the ${counts.scheduled} doses I had set times for.`,
    "",
    "This is what I recorded in a reminder app. It is my own record and not a pharmacy record. It shows what I told the app, not what the app observed.",
    `Written on ${TODAY_IN_WORDS} 2026 at 11:12.`,
  ]
  return lines.join("\n")
}
