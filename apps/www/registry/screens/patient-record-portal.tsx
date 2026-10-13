"use client"

/**
 * A patient's own view of the record their hospitals write, assembled from
 * parts that already ship. It is the third whole screen, and the first with
 * five destinations, a page written to be read by somebody other than its
 * owner, and a layout of its own for every width from a phone to a desktop
 * window.
 *
 * WHERE IT COMES FROM. The screens, their order, their rules and most of their
 * words follow the patient portal of Pensieve's hospital record system. This
 * is that product rebuilt from opsinjs components, to find out whether the kit
 * can carry it. Everything in it is invented, and nothing in it is anybody's
 * record.
 *
 * WHAT THE PRODUCT IS. One record that follows a person between hospitals. The
 * hospitals write it. The patient reads it, decides who else may read it, sees
 * every time anybody opened it, hands a slice of it to a doctor for a few
 * minutes, and carries a card a paramedic can read off their phone.
 *
 * WHAT IT REFUSES. It shows what a doctor wrote, in the doctor's words, and the
 * only change it makes on the way is turning a code word into an everyday one.
 * It explains nothing, scores nothing, ranks nothing and triages nothing, and
 * no list is ordered by anything but date. Nothing medical can be changed from
 * it, and it says so where somebody would look for an edit control.
 *
 * IT CARRIES NEITHER COLOUR AXIS. Nothing on these screens is a clinical level
 * and nothing is a measurement category, so no surface takes `data-status` or
 * `data-category`. "Refused", "Still open", "Ran out" and "Used" are states of
 * an access or a share, not verdicts about a body, so they are neutral words.
 * A word or two sits in a badge, and anything longer is a line of text with a
 * glyph. Painting a refused access the red that means "act now" would borrow
 * an urgency this product has no right to.
 *
 * DISABLED, NEVER HIDDEN. A control the patient cannot use right now stays on
 * the screen, greyed, with the reason beside it. A control that disappears
 * teaches somebody they never had the right. A greyed one that says "you can
 * change this after you are discharged" teaches them how the system works.
 * `GatedAction` makes that the shape of its props rather than a habit, because
 * supplying a reason is what disables it.
 *
 * ONE LAYOUT PER WIDTH, MEASURED IN rem. The app is a size container, and its
 * shell switches on the container's width in rem rather than on the window in
 * pixels. A container query in rem follows the root font size, so a reader who
 * asks for 200% text gets the narrower layout their text needs, exactly as a
 * reader who zooms the browser does. There are three shells.
 *
 * - From 56rem, a sidebar holds the five destinations and the two actions, and
 *   a screen with two halves lays them side by side.
 * - From 19rem, the phone and tablet shell pins TabBar to the foot.
 * - Below 19rem, five TabBar destinations no longer fit side by side, so they
 *   move into a menu sheet. TabBar refuses an overflow, and the page must not
 *   scroll sideways (issue #16), so the product changes the shape of its
 *   navigation rather than squeezing the bar.
 *
 * Inside a screen, the content column is a second container, so a grid asks
 * how wide the column is rather than how wide the window is.
 *
 * IT IS A CLIENT COMPONENT because every screen holds state. The state lives
 * here rather than in a store so the file reads as one artefact. Nothing is
 * written to storage and nothing is sent anywhere, so reloading puts the
 * demonstration back where it started.
 *
 * EVERY NAME, ID, HOSPITAL, CONDITION, MEDICINE AND DATE IS SYNTHETIC (ADR
 * 0012). The patient is Alex Example, the hospitals are Example City Hospital
 * and its neighbours, and every condition reads as an example, so a screenshot
 * of this specimen can never pass for somebody's record.
 */

import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react"
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Copy,
  Eye,
  FileText,
  House,
  IdCard,
  Info,
  Lock,
  Menu as MenuGlyph,
  QrCode,
  Share2,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react"

import { Accordion } from "@/registry/base-lyra/ui/accordion"
import { Avatar } from "@/registry/base-lyra/ui/avatar"
import { Badge } from "@/registry/base-lyra/ui/badge"
import { Button } from "@/registry/base-lyra/ui/button"
import { Callout } from "@/registry/base-lyra/ui/callout"
import { Card } from "@/registry/base-lyra/ui/card"
import { Checkbox } from "@/registry/base-lyra/ui/checkbox"
import { Dialog } from "@/registry/base-lyra/ui/dialog"
import { DisclaimerNote } from "@/registry/base-lyra/ui/disclaimer-note"
import { Divider } from "@/registry/base-lyra/ui/divider"
import { EmptyState } from "@/registry/base-lyra/ui/empty-state"
import { Field } from "@/registry/base-lyra/ui/field"
import { IconButton } from "@/registry/base-lyra/ui/icon-button"
import { Link } from "@/registry/base-lyra/ui/link"
import { RadioGroup } from "@/registry/base-lyra/ui/radio-group"
import { SegmentedControl } from "@/registry/base-lyra/ui/segmented-control"
import { Select } from "@/registry/base-lyra/ui/select"
import { Sheet } from "@/registry/base-lyra/ui/sheet"
import { SourceCitation } from "@/registry/base-lyra/ui/source-citation"
import { Surface } from "@/registry/base-lyra/ui/surface"
import { Switch } from "@/registry/base-lyra/ui/switch"
import { TabBar } from "@/registry/base-lyra/ui/tab-bar"
import {
  Term,
  TermGlossaryProvider,
  type GlossaryEntry,
} from "@/registry/base-lyra/ui/term"
import { VisuallyHidden } from "@/registry/base-lyra/ui/visually-hidden"

/* ====================================================================== *
 * The fixed instant, and dates written by hand                            *
 * ====================================================================== */

/**
 * The moment the demonstration stands at: Tuesday 13 October 2026 at 09:40.
 *
 * Every instant in this file is a wall-clock string such as
 * `2026-10-09T14:20` rather than a Date. A record is a list of things a
 * hospital wrote down at a time, and formatting those through Intl would let
 * the server's time zone and its ICU version choose the words, so the first
 * paint could say one date and the hydrated page another. Writing them out by
 * hand from a fixed month table says the same words everywhere, every time the
 * specimen is built.
 */
const NOW = "2026-10-13T09:40"

/** The day part of that instant. */
const TODAY = NOW.slice(0, 10)

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

/** A day, written out in full the way the content rules ask: "9 October 2026". */
function onDay(wall: string): string {
  const [year, month, day] = wall.slice(0, 10).split("-").map(Number)
  return `${day} ${MONTHS[month - 1]} ${year}`
}

/** A day and a time on the 24-hour clock: "9 October 2026 at 14:20". */
function atTime(wall: string): string {
  return `${onDay(wall)} at ${wall.slice(11, 16)}`
}

/** A wall-clock instant moved on by some minutes, worked in UTC so no zone moves it. */
function laterBy(wall: string, minutes: number): string {
  return new Date(Date.parse(`${wall}:00Z`) + minutes * 60_000)
    .toISOString()
    .slice(0, 16)
}

/** A day moved on by some whole days. */
function daysAfter(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10)
}

/** Whole days from one day to another. */
function daysFrom(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000
  )
}

/* ====================================================================== *
 * The synthetic person and the hospitals                                  *
 * ====================================================================== */

/** The person whose record this is. Every field is an obvious example. */
const PATIENT = {
  name: "Alex Example",
  recordId: "EXAMPLE-1042",
  age: "40 to 49",
  sex: "Female",
}

type HospitalId = "city" | "riverside" | "hill"

/**
 * The three hospitals the record has travelled between. Each is named with
 * the word "Example" so none can be mistaken for a real place.
 */
const HOSPITAL_NAME: Record<HospitalId, string> = {
  city: "Example City Hospital",
  riverside: "Example Riverside Hospital",
  hill: "Example Hill Clinic",
}

/* ====================================================================== *
 * The synthetic record                                                    *
 * ====================================================================== */

/**
 * One visit to one hospital. Everything clinical in the record was written
 * during a visit, so the visit is the unit the whole record hangs from. The
 * words on it are the hospital's own labels for its own fields.
 */
interface Visit {
  id: string
  hospital: HospitalId
  /** The kind of visit, in everyday words: "Hospital stay". */
  kind: string
  startedAt: string
  endedAt?: string
  /** The hospital's own record of whether the visit has finished. */
  inProgress: boolean
  /** How it ended, when the hospital recorded that. */
  ending?: string
}

/** Every visit, newest first, which is the only order the record is ever shown in. */
const VISITS: Visit[] = [
  {
    id: "stay-2026",
    hospital: "city",
    kind: "Hospital stay",
    startedAt: "2026-10-09T14:20",
    inProgress: true,
  },
  {
    id: "clinic-september",
    hospital: "riverside",
    kind: "Outpatient visit",
    startedAt: "2026-09-22T10:05",
    endedAt: "2026-09-22T11:20",
    inProgress: false,
  },
  {
    id: "emergency-august",
    hospital: "hill",
    kind: "Emergency",
    startedAt: "2026-08-03T22:47",
    endedAt: "2026-08-04T03:10",
    inProgress: false,
    ending: "Discharged",
  },
  {
    id: "clinic-may",
    hospital: "city",
    kind: "Outpatient visit",
    startedAt: "2026-05-14T11:30",
    endedAt: "2026-05-14T12:05",
    inProgress: false,
  },
  {
    id: "day-care-february",
    hospital: "riverside",
    kind: "Day care",
    startedAt: "2026-02-02T08:15",
    endedAt: "2026-02-02T16:40",
    inProgress: false,
    ending: "Discharged",
  },
  {
    id: "stay-2025",
    hospital: "city",
    kind: "Hospital stay",
    startedAt: "2025-11-24T19:00",
    endedAt: "2025-12-02T12:00",
    inProgress: false,
    ending: "Discharged",
  },
]

/** One label and its value, in the order a list of facts is read. */
type FactRow = readonly [string, ReactNode]

/**
 * A condition a doctor recorded, in the doctor's own words.
 *
 * `details` holds only the attributes the doctor set, already turned from code
 * words into everyday ones, which is the one transformation this product makes.
 * An attribute the doctor left unset is absent rather than filled in.
 */
interface Condition {
  id: string
  visit: string
  hospital: HospitalId
  recordedOn: string
  /** The treating doctor's own words, never reworded. */
  words: string
  /** The hospital marked it as the main condition of the visit. */
  main: boolean
  /** The doctor recorded it as long-term, which pins it above every visit. */
  longTerm: boolean
  details: FactRow[]
  notes: string[]
}

const CONDITIONS: Condition[] = [
  {
    id: "condition-now",
    visit: "stay-2026",
    hospital: "city",
    recordedOn: "2026-10-09",
    words: "Example condition being looked into",
    main: true,
    longTerm: false,
    details: [
      ["Kind of condition", "Main condition"],
      ["Status", "Provisional"],
      ["How certain the doctor was", "Still being told apart from others"],
      ["How severe", "Moderate"],
    ],
    notes: ["Example note from the treating doctor."],
  },
  {
    id: "condition-september",
    visit: "clinic-september",
    hospital: "riverside",
    recordedOn: "2026-09-22",
    words: "Example condition two",
    main: true,
    longTerm: false,
    details: [
      ["Kind of condition", "Main condition"],
      ["Status", "Active"],
      ["How certain the doctor was", "Confirmed"],
      ["How severe", "Mild"],
      ["Response to treatment", "Responding to treatment"],
    ],
    notes: [],
  },
  {
    id: "condition-september-long-term",
    visit: "clinic-september",
    hospital: "riverside",
    recordedOn: "2026-09-22",
    words: "Example long-term condition two",
    main: false,
    longTerm: true,
    details: [
      ["Kind of condition", "Condition alongside"],
      ["Status", "Long-term"],
      ["How certain the doctor was", "Confirmed"],
      ["How severe", "Mild"],
    ],
    notes: [],
  },
  {
    id: "condition-august",
    visit: "emergency-august",
    hospital: "hill",
    recordedOn: "2026-08-03",
    words: "Example injury",
    main: true,
    longTerm: false,
    details: [
      ["Kind of condition", "Main condition"],
      ["Status", "Resolved"],
      ["How certain the doctor was", "Confirmed"],
      ["How severe", "Mild"],
      ["Response to treatment", "Treatment finished"],
    ],
    notes: [],
  },
  {
    id: "condition-may",
    visit: "clinic-may",
    hospital: "city",
    recordedOn: "2026-05-14",
    words: "Example long-term condition",
    main: true,
    longTerm: true,
    details: [
      ["Kind of condition", "Main condition"],
      ["Status", "Long-term"],
      ["How certain the doctor was", "Confirmed"],
      ["How severe", "Moderate"],
      ["Response to treatment", "Responding to treatment"],
    ],
    notes: ["Example note about this visit."],
  },
  {
    id: "condition-february",
    visit: "day-care-february",
    hospital: "riverside",
    recordedOn: "2026-02-02",
    words: "Example condition three",
    main: true,
    longTerm: false,
    details: [
      ["Kind of condition", "Main condition"],
      ["Status", "Resolved"],
      ["How certain the doctor was", "Confirmed"],
      ["Response to treatment", "Treatment worked"],
    ],
    notes: [],
  },
  {
    id: "condition-2025",
    visit: "stay-2025",
    hospital: "city",
    recordedOn: "2025-11-24",
    words: "Example condition four",
    main: true,
    longTerm: false,
    details: [
      ["Kind of condition", "Main condition"],
      ["Status", "Resolved"],
      ["How certain the doctor was", "Confirmed"],
      ["How severe", "Severe"],
      ["Outlook", "Fair"],
      ["Response to treatment", "Treatment finished"],
    ],
    notes: [],
  },
  {
    id: "condition-2025-ruled-out",
    visit: "stay-2025",
    hospital: "city",
    recordedOn: "2025-11-25",
    words: "Example condition that was ruled out",
    main: false,
    longTerm: false,
    details: [
      ["Kind of condition", "Other condition"],
      ["Status", "Ruled out"],
    ],
    notes: [],
  },
]

/**
 * A test or a treatment a hospital ordered. The description is the one the
 * hospital froze when it placed the order, shown as it was written.
 */
interface Order {
  id: string
  visit: string
  hospital: HospitalId
  placedOn: string
  words: string
  /** Medicines are listed apart from tests when the record is read by type. */
  medicine: boolean
  /** The hospital's own status for the order. */
  status: string
  /** The hospital's own status for the result, when the order has one. */
  result?: string
  /** The result has not come back. A restatement of the stored status, never a forecast. */
  awaited: boolean
}

const ORDERS: Order[] = [
  {
    id: "order-blood-now",
    visit: "stay-2026",
    hospital: "city",
    placedOn: "2026-10-10",
    words: "Example blood test",
    medicine: false,
    status: "In progress",
    result: "Not back yet",
    awaited: true,
  },
  {
    id: "order-scan-now",
    visit: "stay-2026",
    hospital: "city",
    placedOn: "2026-10-11",
    words: "Example scan",
    medicine: false,
    status: "Ordered",
    result: "Not back yet",
    awaited: true,
  },
  {
    id: "order-evening-tablet",
    visit: "stay-2026",
    hospital: "city",
    placedOn: "2026-10-09",
    words: "Evening tablet",
    medicine: true,
    status: "In progress",
    awaited: false,
  },
  {
    id: "order-blood-september",
    visit: "clinic-september",
    hospital: "riverside",
    placedOn: "2026-09-22",
    words: "Example blood test",
    medicine: false,
    status: "Done",
    result: "Available",
    awaited: false,
  },
  {
    id: "order-morning-tablet",
    visit: "clinic-september",
    hospital: "riverside",
    placedOn: "2026-09-22",
    words: "Morning tablet",
    medicine: true,
    status: "In progress",
    awaited: false,
  },
  {
    id: "order-imaging-august",
    visit: "emergency-august",
    hospital: "hill",
    placedOn: "2026-08-03",
    words: "Example imaging",
    medicine: false,
    status: "Done",
    result: "Verified",
    awaited: false,
  },
  {
    id: "order-pain-relief-august",
    visit: "emergency-august",
    hospital: "hill",
    placedOn: "2026-08-03",
    words: "Example pain relief",
    medicine: true,
    status: "Done",
    awaited: false,
  },
  {
    id: "order-inhaler-may",
    visit: "clinic-may",
    hospital: "city",
    placedOn: "2026-05-14",
    words: "Example inhaler",
    medicine: true,
    status: "In progress",
    awaited: false,
  },
  {
    id: "order-blood-2025",
    visit: "stay-2025",
    hospital: "city",
    placedOn: "2025-11-25",
    words: "Example blood test",
    medicine: false,
    status: "Done",
    result: "Verified",
    awaited: false,
  },
]

/** Something a hospital filed against a visit: a result report or a document. */
interface Filed {
  id: string
  visit: string
  hospital: HospitalId
  filedOn: string
  words: string
  /** What kind of thing it is, in the hospital's word for it. */
  kind: string
}

const RESULTS: Filed[] = [
  {
    id: "result-september",
    visit: "clinic-september",
    hospital: "riverside",
    filedOn: "2026-09-23",
    words: "Example blood test report",
    kind: "Laboratory",
  },
  {
    id: "result-august",
    visit: "emergency-august",
    hospital: "hill",
    filedOn: "2026-08-04",
    words: "Example imaging report",
    kind: "Imaging",
  },
  {
    id: "result-2025",
    visit: "stay-2025",
    hospital: "city",
    filedOn: "2025-11-26",
    words: "Example blood test report",
    kind: "Laboratory",
  },
]

const DOCUMENTS: Filed[] = [
  {
    id: "document-september",
    visit: "clinic-september",
    hospital: "riverside",
    filedOn: "2026-09-23",
    words: "Example clinic letter",
    kind: "Letter",
  },
  {
    id: "document-august",
    visit: "emergency-august",
    hospital: "hill",
    filedOn: "2026-08-04",
    words: "Example emergency department summary",
    kind: "Summary",
  },
  {
    id: "document-2025",
    visit: "stay-2025",
    hospital: "city",
    filedOn: "2025-12-02",
    words: "Example discharge letter",
    kind: "Letter",
  },
]

/**
 * A form a hospital completed. The portal can list one and cannot open it, and
 * a form marked as entered in error stays listed and says so, because a form
 * that vanishes reads as a form somebody hid.
 */
interface CompletedForm {
  id: string
  visit: string
  hospital: HospitalId
  filledOn: string
  enteredInError: boolean
}

const FORMS: CompletedForm[] = [
  {
    id: "form-now",
    visit: "stay-2026",
    hospital: "city",
    filledOn: "2026-10-09",
    enteredInError: false,
  },
  {
    id: "form-2025-second",
    visit: "stay-2025",
    hospital: "city",
    filledOn: "2025-11-25",
    enteredInError: false,
  },
  {
    id: "form-2025-first",
    visit: "stay-2025",
    hospital: "city",
    filledOn: "2025-11-24",
    enteredInError: true,
  },
]

/** A discharge summary, in the hospital's own words for how the stay ended. */
interface Discharge {
  visit: string
  hospital: HospitalId
  on: string
  outcome: string
  ending: string
}

const DISCHARGES: Discharge[] = [
  {
    visit: "emergency-august",
    hospital: "hill",
    on: "2026-08-04",
    outcome: "Improved",
    ending: "Discharged",
  },
  {
    visit: "day-care-february",
    hospital: "riverside",
    on: "2026-02-02",
    outcome: "Improved",
    ending: "Discharged",
  },
  {
    visit: "stay-2025",
    hospital: "city",
    on: "2025-12-02",
    outcome: "Improved",
    ending: "Discharged",
  },
]

/**
 * Appointments the hospitals have booked. The cancelled one is here so the
 * filter on the home screen has something to leave out. A booking that was
 * cancelled is not open, and the filter reads the hospital's stored status
 * rather than forming a view of its own.
 */
interface Appointment {
  id: string
  hospital: HospitalId
  at: string
  kind: string
  status: "Booked" | "Confirmed" | "Cancelled"
}

const APPOINTMENTS: Appointment[] = [
  {
    id: "appointment-october",
    hospital: "riverside",
    at: "2026-10-28T10:30",
    kind: "Outpatient visit",
    status: "Confirmed",
  },
  {
    id: "appointment-cancelled",
    hospital: "city",
    at: "2026-10-20T09:00",
    kind: "Outpatient visit",
    status: "Cancelled",
  },
]

/** The condition the hospital marked as the main one for a visit, when it did. */
function mainConditionOf(visitId: string): Condition | undefined {
  return CONDITIONS.find(
    (condition) => condition.visit === visitId && condition.main
  )
}

/**
 * Whether anything from a visit is still open: the visit itself, or a result
 * that has not come back. Both are restatements of stored fields. It says
 * that something is unfinished and never what that means.
 */
function stillOpen(visit: Visit): boolean {
  return (
    visit.inProgress ||
    ORDERS.some((order) => order.visit === visit.id && order.awaited)
  )
}

/** One thing that is open right now, in the shape the home screen lists it. */
interface OpenItem {
  key: string
  title: string
  hospital: HospitalId
  when: string
  detail: string
}

/**
 * What is open right now, in the order the product's manual gives: a stay you
 * are in, then a result that has not come back, then an appointment coming up.
 * The three kinds are appended rather than sorted together, because
 * interleaving them by date would be the portal deciding whether a live
 * admission or a booking next month matters more.
 */
function openItems(): OpenItem[] {
  const admitted = VISITS.filter((visit) => visit.inProgress).map((visit) => ({
    key: `visit-${visit.id}`,
    title: "You are admitted here now",
    hospital: visit.hospital,
    when: `Since ${onDay(visit.startedAt)}`,
    detail: visit.kind,
  }))
  const awaited = ORDERS.filter((order) => order.awaited)
    .sort((a, b) => b.placedOn.localeCompare(a.placedOn))
    .map((order) => ({
      key: `order-${order.id}`,
      title: "A result has not come back yet",
      hospital: order.hospital,
      when: `Ordered on ${onDay(order.placedOn)}`,
      detail: order.words,
    }))
  /* Soonest first. Newest first is the order for history, and a list of
     things that have not happened yet reads forward. */
  const upcoming = APPOINTMENTS.filter(
    (appointment) =>
      appointment.at >= NOW &&
      (appointment.status === "Booked" || appointment.status === "Confirmed")
  )
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((appointment) => ({
      key: `appointment-${appointment.id}`,
      title: "Upcoming appointment",
      hospital: appointment.hospital,
      when: atTime(appointment.at),
      detail: `${appointment.kind}, ${appointment.status.toLowerCase()}`,
    }))
  return [...admitted, ...awaited, ...upcoming]
}

/* ====================================================================== *
 * Who can see the record                                                  *
 * ====================================================================== */

/**
 * A hospital's standing access, as one value. There is no state in which an
 * allow and a shut-out are both on, because the record keeps one word per
 * hospital and the screen renders that word.
 */
type Stance = "default" | "allowed" | "denied"

type Subject = "substance" | "mental" | "hiv" | "reproductive"

/** The reasons a restricted subject may still be read for. */
type Purpose = "treat" | "operations" | "emergency"

interface SubjectSetting {
  restricted: boolean
  purposes: Purpose[]
}

/** Everything the access screen knows about one hospital. */
interface SiteAccess {
  hospital: HospitalId
  stance: Stance
  /** The hospital has the patient admitted, which blocks a new shut-out or hiding. */
  admittedNow: boolean
  /** This hospital's records are hidden from the other hospitals. */
  hidden: boolean
  subjects: Record<Subject, SubjectSetting>
}

const SUBJECTS: Subject[] = ["substance", "mental", "hiv", "reproductive"]

const SUBJECT_NAME: Record<Subject, string> = {
  substance: "Drug and alcohol treatment",
  mental: "Mental health",
  hiv: "HIV",
  reproductive: "Reproductive health",
}

const PURPOSES: Purpose[] = ["treat", "operations", "emergency"]

const PURPOSE_NAME: Record<Purpose, string> = {
  treat: "Treating you",
  operations: "Running the hospital's care",
  emergency: "An emergency when you cannot be asked",
}

/** A subject shared like the rest of the record. */
function sharedSubject(): SubjectSetting {
  return { restricted: false, purposes: [] }
}

/**
 * Drug and alcohol treatment, which is kept private on its own from the first
 * time a hospital admits the patient. It arrives restricted and the screen
 * renders it restricted. Nothing here special-cases it into that state.
 */
function privateFromTheStart(): SubjectSetting {
  return { restricted: true, purposes: [] }
}

const OPENING_ACCESS: SiteAccess[] = [
  {
    hospital: "city",
    stance: "default",
    admittedNow: true,
    hidden: false,
    subjects: {
      substance: privateFromTheStart(),
      mental: sharedSubject(),
      hiv: sharedSubject(),
      reproductive: sharedSubject(),
    },
  },
  {
    hospital: "riverside",
    stance: "allowed",
    admittedNow: false,
    hidden: false,
    subjects: {
      substance: privateFromTheStart(),
      mental: { restricted: true, purposes: ["treat"] },
      hiv: sharedSubject(),
      reproductive: sharedSubject(),
    },
  },
  {
    hospital: "hill",
    stance: "denied",
    admittedNow: false,
    hidden: true,
    subjects: {
      substance: privateFromTheStart(),
      mental: sharedSubject(),
      hiv: sharedSubject(),
      reproductive: sharedSubject(),
    },
  },
]

/**
 * The honest sentences about who can see the record right now.
 *
 * It never says "your record is private", which is not true, and never says
 * "everyone can see everything", which is not true either and frightens people
 * away. It starts from the default and adds only what the settings hold. Home,
 * Welcome and Access all read it, so the three can never disagree about the
 * one fact a patient opens the portal to check.
 */
function postureSentences(sites: SiteAccess[], findable: boolean): string[] {
  const shutOut = sites.filter((site) => site.stance === "denied").length
  const sentences = [
    "Hospitals can see your record while they are treating you.",
  ]
  if (shutOut === 1) sentences.push("You have shut one hospital out.")
  if (shutOut > 1) sentences.push(`You have shut ${shutOut} hospitals out.`)
  if (!findable)
    sentences.push("Hospitals that have never treated you cannot find you.")
  return sentences
}

/** The sentence that tells somebody they cannot act on a hospital while it has them admitted. */
const ADMITTED_SHUT_OUT =
  "You cannot shut out a hospital while it has you admitted. You can change this after you are discharged."

/* ====================================================================== *
 * Who has looked                                                          *
 * ====================================================================== */

/**
 * One line in the list of everybody who opened the record. A line names what
 * was opened, where and when. It names an individual only when the hospital
 * that employs them lets the name travel, which none of these do.
 */
interface LogLine {
  id: string
  at: string
  hospital?: HospitalId
  /** The patient's own visit, which the list records like any other. */
  self: boolean
  opened: string
  why?: string
  refused: boolean
  override: boolean
}

const LOG: LogLine[] = [
  {
    id: "log-1",
    at: "2026-10-13T09:38",
    self: true,
    opened: "This list of who has looked",
    refused: false,
    override: false,
  },
  {
    id: "log-2",
    at: "2026-10-12T16:05",
    hospital: "city",
    self: false,
    opened: "Your health record",
    why: "Treating you",
    refused: false,
    override: false,
  },
  {
    id: "log-3",
    at: "2026-10-11T02:14",
    hospital: "hill",
    self: false,
    opened: "Your health record",
    why: "Treating you",
    refused: true,
    override: false,
  },
  {
    id: "log-4",
    at: "2026-10-09T14:31",
    hospital: "city",
    self: false,
    opened: "Your health record, opened in an emergency",
    why: "An emergency when you cannot be asked",
    refused: false,
    override: true,
  },
  {
    id: "log-5",
    at: "2026-09-22T10:12",
    hospital: "riverside",
    self: false,
    opened: "Your health record",
    why: "Treating you",
    refused: false,
    override: false,
  },
  {
    id: "log-6",
    at: "2026-09-21T18:40",
    self: true,
    opened: "Your own settings",
    refused: false,
    override: false,
  },
  {
    id: "log-7",
    at: "2026-08-03T22:55",
    hospital: "hill",
    self: false,
    opened: "Your basic card",
    why: "Treating you",
    refused: false,
    override: false,
  },
]

/* ====================================================================== *
 * Family and people you trust                                             *
 * ====================================================================== */

type CircleState = "invited" | "active" | "lapsed" | "removed"

/**
 * One person this record has let in. Every entry is a grant over the patient's
 * own record, and every one has an end date, because no access is permanent.
 */
interface CircleEntry {
  id: string
  /** The word the patient chose for them. It changes nothing anybody can see. */
  called: string
  recordId: string
  state: CircleState
  invitedOn: string
  endsOn: string
  /** Ran out at its end date, which can be renewed, as opposed to the age rules. */
  renewable: boolean
}

const CIRCLE_WORD: Record<CircleState, string> = {
  invited: "Invited",
  active: "Active",
  lapsed: "Ran out",
  removed: "Removed",
}

const OPENING_CIRCLE: CircleEntry[] = [
  {
    id: "circle-parent",
    called: "Parent",
    recordId: "EXAMPLE-3301",
    state: "invited",
    invitedOn: "2026-10-12",
    endsOn: "2027-04-30",
    renewable: false,
  },
  {
    id: "circle-sibling",
    called: "Sibling",
    recordId: "EXAMPLE-4410",
    state: "lapsed",
    invitedOn: "2026-07-01",
    endsOn: "2026-10-01",
    renewable: true,
  },
  {
    id: "circle-spouse",
    called: "Spouse",
    recordId: "EXAMPLE-2210",
    state: "active",
    invitedOn: "2026-06-01",
    endsOn: "2026-12-31",
    renewable: false,
  },
  {
    id: "circle-other",
    called: "Other",
    recordId: "EXAMPLE-5520",
    state: "removed",
    invitedOn: "2026-03-03",
    endsOn: "2026-05-01",
    renewable: false,
  },
]

/**
 * The words a patient can choose for somebody. Each value is the same words as
 * its label, because Select shows the value in its trigger until the list has
 * mounted (issue #19), and a value that reads as words reads correctly either
 * way.
 */
const RELATIONSHIPS = ["Child", "Parent", "Spouse", "Sibling", "Other"].map(
  (word) => ({ value: word, label: word })
)

/** An invitation somebody else sent this patient, into their own circle. */
interface Invitation {
  id: string
  fromRecordId: string
  called: string
  /** Accepting lets this patient see the inviter's record, rather than the reverse. */
  youSeeTheirs: boolean
  endsOn: string
}

const OPENING_INVITATIONS: Invitation[] = [
  {
    id: "invitation-sibling",
    fromRecordId: "EXAMPLE-4410",
    called: "Sibling",
    youSeeTheirs: true,
    endsOn: "2027-03-31",
  },
]

/* ====================================================================== *
 * Shares                                                                  *
 * ====================================================================== */

type Scope = "card" | "visit" | "full" | "document"
type Channel = "qr" | "link"
type ShareState = "issued" | "presented" | "consumed" | "expired" | "revoked"

/**
 * A bounded, single-use, time-limited hand-over the patient started. The code
 * is held only by a share made in this session, and only until the panel that
 * shows it is closed, because a real code is shown once and never stored.
 */
interface Share {
  id: string
  scope: Scope
  /** The visit or the document a share names, for the two scopes that name one. */
  target?: string
  channel: Channel
  madeAt: string
  notAfter: string
  state: ShareState
  code?: string
}

const SCOPE_NAME: Record<Scope, string> = {
  card: "Your emergency card",
  visit: "One visit's summary",
  full: "Your full record",
  document: "A single document",
}

/** All five states are named, including "someone has scanned it", the one people ask about. */
const SHARE_WORD: Record<ShareState, string> = {
  issued: "Waiting to be used",
  presented: "Someone has scanned it",
  consumed: "Used",
  expired: "Expired",
  revoked: "Cancelled",
}

const OPENING_SHARES: Share[] = [
  {
    id: "share-visit",
    scope: "visit",
    target: "clinic-september",
    channel: "qr",
    madeAt: "2026-10-12T18:00",
    notAfter: "2026-10-13T18:00",
    state: "presented",
  },
  {
    id: "share-card",
    scope: "card",
    channel: "qr",
    madeAt: "2026-08-03T23:00",
    notAfter: "2026-08-03T23:10",
    state: "consumed",
  },
  {
    id: "share-full",
    scope: "full",
    channel: "link",
    madeAt: "2026-09-21T09:00",
    notAfter: "2026-09-22T09:00",
    state: "expired",
  },
  {
    id: "share-document",
    scope: "document",
    target: "document-2025",
    channel: "link",
    madeAt: "2026-02-02T17:00",
    notAfter: "2026-02-03T17:00",
    state: "revoked",
  },
]

/**
 * A share still works only while it is unused and before its cut-off. The
 * stored state may still say "waiting" after the cut-off has passed, so the
 * cut-off is read too, and a share past it is reported as expired.
 */
function shareIsLive(share: Share): boolean {
  return (
    (share.state === "issued" || share.state === "presented") &&
    share.notAfter > NOW
  )
}

function shareWord(share: Share): string {
  if (
    (share.state === "issued" || share.state === "presented") &&
    !shareIsLive(share)
  )
    return SHARE_WORD.expired
  return SHARE_WORD[share.state]
}

const SCOPE_OPTIONS = [
  {
    value: "card",
    label: SCOPE_NAME.card,
    description: "Only what you chose to put on your card.",
  },
  {
    value: "visit",
    label: SCOPE_NAME.visit,
    description: "One visit, with its conditions, medicines and results.",
  },
  {
    value: "full",
    label: SCOPE_NAME.full,
    description: "Every visit, from every hospital.",
  },
  {
    value: "document",
    label: SCOPE_NAME.document,
    description: "One letter or report.",
  },
]

/** How long a share lasts. Ten minutes covers the consultation happening now. */
const WINDOW_OPTIONS = [
  { value: "10", label: "10 minutes", minutes: 10 },
  { value: "60", label: "1 hour", minutes: 60 },
  { value: "1440", label: "24 hours", minutes: 1440 },
]

const CHANNEL_OPTIONS = [
  {
    value: "qr",
    label: "Show a scan code",
    description: "For a doctor whose hospital uses the same record system.",
  },
  {
    value: "link",
    label: "Send a link",
    description: "For any other doctor.",
  },
]

/** A visit, as somebody would point at it in a list. */
function visitChoice(visit: Visit): string {
  return `${onDay(visit.startedAt)}, ${visit.kind.toLowerCase()} at ${HOSPITAL_NAME[visit.hospital]}`
}

/** A document, as somebody would point at it in a list. */
function documentChoice(document: Filed): string {
  return `${onDay(document.filedOn)}, ${document.words.toLowerCase()}`
}

/**
 * The codes a share made here carries. Each starts with DEMO so nobody could
 * read one aloud to a doctor and expect it to work.
 */
const DEMO_CODE_PARTS = ["4K7Q", "8T3W", "2H9N", "6B5J", "9R4M", "3X8C"]

function demoCode(made: number): string {
  return `DEMO-${DEMO_CODE_PARTS[made % DEMO_CODE_PARTS.length]}-${1000 + made}`
}

/* ====================================================================== *
 * The emergency card                                                      *
 * ====================================================================== */

type CardField =
  "blood" | "allergies" | "longTerm" | "medicines" | "discharge" | "contact"

/** The six items a card can carry, in the order the card prints them. */
const CARD_FIELDS: CardField[] = [
  "blood",
  "allergies",
  "longTerm",
  "medicines",
  "discharge",
  "contact",
]

const CARD_LABEL: Record<CardField, string> = {
  blood: "Blood group",
  allergies: "Allergies",
  longTerm: "Long-term conditions",
  medicines: "Current medicines",
  discharge: "Last discharge",
  contact: "Emergency contact",
}

/**
 * What each item says, one entry per line. A stranger reading a list at arm's
 * length needs one item per line, because a comma-run of names is where an
 * eye in a hurry slips. The values agree with the record above: the long-term
 * conditions are the two pinned ones, the medicines are the ones still in
 * progress, and the last discharge is the most recent one.
 */
const CARD_VALUE: Record<CardField, string[]> = {
  blood: ["Example blood group"],
  allergies: ["Example allergy to a medicine", "Example allergy to a food"],
  longTerm: ["Example long-term condition", "Example long-term condition two"],
  medicines: ["Evening tablet", "Morning tablet", "Example inhaler"],
  discharge: ["Example Hill Clinic", "4 August 2026"],
  contact: ["Example contact", "Spouse", "0000 000 000"],
}

/** Nothing is on a card unless the patient put it there. This patient left one item off. */
const OPENING_CARD: CardField[] = [
  "blood",
  "allergies",
  "longTerm",
  "medicines",
  "contact",
]

/* ====================================================================== *
 * Words that need their meaning beside them                               *
 * ====================================================================== */

/**
 * Term expands these in place, which is the only route that works on a touch
 * screen and for a keyboard. Neither gloss states anything clinical.
 */
const GLOSSARY: readonly GlossaryEntry[] = [
  {
    id: "emergency-override",
    word: "emergency override",
    plain:
      "a doctor opening your record in an emergency without the usual permission, which is always written down",
  },
  {
    id: "record-id",
    word: "record ID",
    plain:
      "the code that names your record, which you give to somebody you trust so they can invite you or be invited",
  },
]

/* ====================================================================== *
 * Where somebody can be                                                   *
 * ====================================================================== */

type Destination = "home" | "record" | "access" | "log" | "family"

type ScreenKey =
  Destination | "invites" | "share" | "card" | "welcome" | "claim" | "shared"

/**
 * The five destinations. Share and the emergency card are not among them. They
 * are things somebody does in a moment rather than places they go, so they are
 * the two large actions on Home and, on a wide window, two buttons under the
 * destinations.
 *
 * The bar's label for "Who looked" joins its two words with a no-break space.
 * Wrapped onto two lines in a 390px bar, it lifted that one icon above the
 * others. Kept on one line, the five still fit side by side from 19rem, which
 * is the width the shell switches at.
 */
/**
 * U+00A0, the no-break space, made from its code so it stays visible in the
 * source and no formatter or tidy edit can turn it back into a plain space.
 */
const NO_BREAK = String.fromCharCode(0xa0)

const DESTINATIONS: {
  key: Destination
  label: string
  barLabel: string
  icon: ReactNode
}[] = [
  { key: "home", label: "Home", barLabel: "Home", icon: <House /> },
  { key: "record", label: "Record", barLabel: "Record", icon: <FileText /> },
  { key: "access", label: "Access", barLabel: "Access", icon: <ShieldCheck /> },
  {
    key: "log",
    label: "Who looked",
    barLabel: `Who${NO_BREAK}looked`,
    icon: <Eye />,
  },
  { key: "family", label: "Family", barLabel: "Family", icon: <Users /> },
]

/** Which destination a screen belongs to, so the navigation can say where somebody is. */
const BELONGS_TO: Record<ScreenKey, Destination> = {
  home: "home",
  record: "record",
  access: "access",
  log: "log",
  family: "family",
  invites: "family",
  share: "home",
  card: "home",
  welcome: "home",
  claim: "home",
  shared: "home",
}

const TITLE: Record<ScreenKey, string> = {
  home: "Your health record",
  record: "Your full record",
  access: "Who can see your record",
  log: "Who has looked at your record",
  family: "Family and people you trust",
  invites: "Invitations for you",
  share: "Share your record with a doctor",
  card: "Emergency card",
  welcome: "Welcome",
  claim: "Is this you?",
  shared: "Shared health record",
}

/**
 * The screens with no navigation at all. The emergency card is handed to a
 * stranger, and a menu there is an invitation to browse the rest of the
 * record. The invite and the doctor's page are reached from outside the
 * portal, by somebody who is not signed in to it.
 */
const BARE: ScreenKey[] = ["card", "claim", "shared"]

/** How wide each screen's column may grow. */
const COLUMN: Record<ScreenKey, string> = {
  home: "max-w-3xl @4xl/app:max-w-5xl",
  record: "max-w-3xl @4xl/app:max-w-5xl",
  access: "max-w-3xl @4xl/app:max-w-5xl",
  log: "max-w-3xl @4xl/app:max-w-5xl",
  family: "max-w-3xl @4xl/app:max-w-5xl",
  invites: "max-w-2xl",
  share: "max-w-3xl @4xl/app:max-w-5xl",
  card: "max-w-5xl",
  welcome: "max-w-2xl",
  claim: "max-w-lg",
  shared: "max-w-3xl",
}

/* ====================================================================== *
 * Small pieces of layout the product owns                                 *
 * ====================================================================== */

/** A quiet line of supporting text. */
function Quiet({ children }: { children: ReactNode }) {
  return (
    <p className="text-opsin-footnote m-0 [color:var(--muted-foreground)]">
      {children}
    </p>
  )
}

/** A paragraph of body text. */
function Body({ children }: { children: ReactNode }) {
  return (
    <p className="text-opsin-body m-0 [color:var(--foreground)]">{children}</p>
  )
}

/** A titled section, labelled by its own heading so it reads as a region. */
function Section({
  title,
  id,
  children,
}: {
  title: string
  id?: string
  children: ReactNode
}) {
  const generated = useId()
  const headingId = id === undefined ? generated : `${id}-heading`
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-opsin-6 gap-opsin-4 flex flex-col"
    >
      <h2
        id={headingId}
        className="text-opsin-title3 m-0 [color:var(--foreground)]"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

/**
 * Where a part of the record came from. It leads every entry, because one
 * record that follows a person is only useful if they can tell which hospital
 * wrote each part of it, and a label that whispers defeats the point.
 */
function HospitalName({ id }: { id: HospitalId }) {
  return (
    <span className="gap-opsin-1 text-opsin-subheadline-emphasis inline-flex items-center [color:var(--foreground)]">
      <Building2 aria-hidden="true" className="size-[1em] shrink-0" />
      {HOSPITAL_NAME[id]}
    </span>
  )
}

/**
 * A list of facts, two columns once there is room and one column before that.
 * It is its own size container so it can tell a narrow card in a wide window
 * from a wide one.
 */
function Facts({ rows }: { rows: readonly FactRow[] }) {
  return (
    <div className="@container/facts">
      <dl className="gap-x-opsin-4 @sm/facts:gap-y-opsin-2 m-0 grid grid-cols-1 @sm/facts:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {rows.map(([term, value]) => (
          <Fragment key={term}>
            <dt className="text-opsin-footnote m-0 [color:var(--muted-foreground)]">
              {term}
            </dt>
            <dd className="mb-opsin-2 text-opsin-body m-0 [color:var(--foreground)] @sm/facts:mb-0">
              {value}
            </dd>
          </Fragment>
        ))}
      </dl>
    </div>
  )
}

/** Several short values as separate lines, or the honest word for none. */
function Lines({ values }: { values: string[] }) {
  if (values.length === 0) return <>None recorded</>
  return (
    <>
      {values.map((value) => (
        <span key={value} className="block">
          {value}
        </span>
      ))}
    </>
  )
}

/**
 * A confirmation that a change was made, beside the control that made it. It
 * appears only once the change is in place, never before, so it can never
 * report a change that did not happen.
 */
function Saved({ message }: { message: string | undefined }) {
  if (message === undefined) return null
  return (
    <p className="gap-opsin-2 text-opsin-footnote m-0 flex items-start [color:var(--foreground)]">
      <Check aria-hidden="true" className="mt-[0.2em] size-[1em] shrink-0" />
      <span>{message}</span>
    </p>
  )
}

/**
 * A state stated in words, such as "You are admitted here now" or "Someone
 * has scanned it". Badge is for a word or two and never wraps, so a state any
 * longer is a line of text with a glyph instead, and it reflows at 200% text
 * rather than running out of its card.
 */
function Marker({ children }: { children: ReactNode }) {
  return (
    <p className="gap-opsin-2 text-opsin-footnote m-0 flex items-start font-semibold [color:var(--foreground)]">
      <CircleDot
        aria-hidden="true"
        className="mt-[0.2em] size-[1em] shrink-0"
      />
      <span>{children}</span>
    </p>
  )
}

/**
 * A control that may be unavailable, and says why when it is.
 *
 * There is no `disabled` prop. A control is disabled exactly when `reason` is
 * supplied, so there is no way to grey a control without saying why and no way
 * to say why without greying it. The native attribute does the disabling, so a
 * press on a greyed control sends nothing and there is no handler to guard.
 */
function GatedAction({
  label,
  reason,
  onAct,
  variant = "secondary",
  icon,
}: {
  label: string
  reason?: string
  onAct?: () => void
  variant?: "primary" | "secondary" | "quiet" | "destructive"
  icon?: ReactNode
}) {
  const reasonId = useId()
  const unavailable = reason !== undefined
  return (
    <div className="gap-opsin-2 flex flex-col items-start">
      <Button
        variant={variant}
        icon={icon}
        disabled={unavailable}
        aria-describedby={unavailable ? reasonId : undefined}
        onClick={unavailable ? undefined : onAct}
      >
        {label}
      </Button>
      {unavailable ? (
        <p
          id={reasonId}
          className="gap-opsin-2 text-opsin-footnote m-0 flex items-start [color:var(--muted-foreground)]"
        >
          <Lock aria-hidden="true" className="mt-[0.2em] size-[1em] shrink-0" />
          <span>{reason}</span>
        </p>
      ) : null}
    </div>
  )
}

/** The marker that says what this is, on the surface rather than in an about screen. */
function DemonstrationBadge() {
  return (
    <Badge variant="outline" srLabel="This is a demonstration">
      Demonstration
    </Badge>
  )
}

/**
 * One navigation entry in the sidebar and in the menu sheet. The current one
 * is marked four ways and none of them is a hue: `aria-current`, a heavier
 * label, a filled row and a bar at its leading edge in the foreground ink.
 */
const NAV_ITEM =
  "justify-start text-start [color:var(--foreground)] aria-[current=page]:bg-state-press aria-[current=page]:font-semibold aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-opsin-2 aria-[current=page]:before:left-0 aria-[current=page]:before:w-opsin-1 aria-[current=page]:before:rounded-full aria-[current=page]:before:bg-foreground"

/** The five destinations as a vertical list, for the sidebar and the menu sheet. */
function DestinationList({
  current,
  onGo,
}: {
  current: Destination
  onGo: (next: ScreenKey) => void
}) {
  return (
    <nav aria-label="Main sections">
      <ul className="gap-opsin-1 m-0 flex list-none flex-col p-0">
        {DESTINATIONS.map((destination) => (
          <li key={destination.key}>
            <Button
              variant="quiet"
              fullWidth
              icon={destination.icon}
              aria-current={current === destination.key ? "page" : undefined}
              onClick={() => onGo(destination.key)}
              className={NAV_ITEM}
            >
              {destination.label}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** The two things somebody does in a moment rather than places they go. */
function HandOverActions({ onGo }: { onGo: (next: ScreenKey) => void }) {
  return (
    <div className="gap-opsin-2 flex flex-col">
      <Button
        variant="secondary"
        fullWidth
        icon={<Share2 />}
        onClick={() => onGo("share")}
        className="justify-start"
      >
        Share my record
      </Button>
      <Button
        variant="secondary"
        fullWidth
        icon={<IdCard />}
        onClick={() => onGo("card")}
        className="justify-start"
      >
        Emergency card
      </Button>
    </div>
  )
}

/* ====================================================================== *
 * Home                                                                    *
 * ====================================================================== */

/** How many visits "What happened recently" carries. The whole history is on Record. */
const RECENT_VISITS = 5

/**
 * The screen a patient lands on. It answers three questions in this order and
 * nothing else: what happened recently, what is open right now, and who can
 * see this. Everything on it is a read. The two large actions go somewhere
 * rather than act, so the act happens on its own screen, where somebody can
 * see what they are agreeing to before they agree to it.
 */
function HomeScreen({
  onGo,
  sites,
  findable,
}: {
  onGo: (next: ScreenKey) => void
  sites: SiteAccess[]
  findable: boolean
}) {
  const open = openItems()
  return (
    <>
      {/* Above the fold on purpose, because somebody reaching for the
          emergency card is not in a position to scroll for it. */}
      <div className="gap-opsin-3 grid grid-cols-1 @lg/main:grid-cols-2">
        <Button
          variant="primary"
          fullWidth
          icon={<Share2 />}
          onClick={() => onGo("share")}
          className="min-h-opsin-16"
        >
          Share my record
        </Button>
        <Button
          variant="secondary"
          fullWidth
          icon={<IdCard />}
          onClick={() => onGo("card")}
          className="min-h-opsin-16"
        >
          Emergency card
        </Button>
      </div>

      <div className="gap-opsin-8 grid grid-cols-1 @3xl/main:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @3xl/main:items-start">
        <Section title="What happened recently">
          <ul className="gap-opsin-3 m-0 flex list-none flex-col p-0">
            {VISITS.slice(0, RECENT_VISITS).map((visit) => (
              <li key={visit.id}>
                <Card density="compact">
                  <div className="gap-opsin-1 flex flex-col">
                    <div className="gap-x-opsin-3 gap-y-opsin-1 flex flex-wrap items-baseline justify-between">
                      <HospitalName id={visit.hospital} />
                      <Quiet>{onDay(visit.startedAt)}</Quiet>
                    </div>
                    <h3 className="text-opsin-headline m-0 [color:var(--foreground)]">
                      {mainConditionOf(visit.id)?.words ?? "Not recorded"}
                    </h3>
                    <div className="gap-opsin-2 flex flex-wrap items-center">
                      <Quiet>{visit.kind}</Quiet>
                      {stillOpen(visit) ? (
                        <Badge variant="outline">Still open</Badge>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          <Button variant="secondary" fullWidth onClick={() => onGo("record")}>
            See my whole record
          </Button>
        </Section>

        <div className="gap-opsin-8 flex flex-col">
          <Section title="What is open right now">
            {open.length === 0 ? (
              <EmptyState
                reason="nothing-yet"
                title="Nothing is open right now"
                titleLevel={3}
              />
            ) : (
              /* Two columns on a tablet, where this list has the column to
                 itself, and one on a desktop, where it shares the row with
                 the recent visits. */
              <ul className="gap-opsin-3 m-0 grid list-none grid-cols-1 p-0 @2xl/main:grid-cols-2 @3xl/main:grid-cols-1">
                {open.map((item) => (
                  <li key={item.key} className="flex">
                    <Card density="compact" className="w-full">
                      <div className="gap-opsin-1 flex flex-col">
                        <h3 className="text-opsin-headline m-0 [color:var(--foreground)]">
                          {item.title}
                        </h3>
                        <HospitalName id={item.hospital} />
                        <Quiet>{item.when}</Quiet>
                        <Quiet>{item.detail}</Quiet>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
            {/* Read-only, and said out loud. Nothing here can be chased,
                cancelled or rebooked from the portal. */}
            <Quiet>
              You can read these. To change an appointment, contact the
              hospital.
            </Quiet>
          </Section>

          <Section title="Who can see this">
            <Card>
              <div className="gap-opsin-3 flex flex-col">
                {postureSentences(sites, findable).map((sentence) => (
                  <Body key={sentence}>{sentence}</Body>
                ))}
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => onGo("access")}
                >
                  Change who can see it
                </Button>
              </div>
            </Card>
          </Section>
        </div>
      </div>
    </>
  )
}

/* ====================================================================== *
 * Record                                                                  *
 * ====================================================================== */

/** One condition, with every attribute the doctor set and nothing the portal thought of. */
function ConditionEntry({ condition }: { condition: Condition }) {
  return (
    <div className="gap-opsin-2 flex flex-col">
      <div className="gap-x-opsin-3 gap-y-opsin-1 flex flex-wrap items-baseline">
        <HospitalName id={condition.hospital} />
        <Quiet>{onDay(condition.recordedOn)}</Quiet>
      </div>
      <p className="text-opsin-headline m-0 [color:var(--foreground)]">
        {condition.words}
      </p>
      {condition.details.length > 0 ? <Facts rows={condition.details} /> : null}
      {condition.notes.length > 0 ? (
        <div className="gap-opsin-1 flex flex-col">
          <Quiet>Notes</Quiet>
          <ul className="gap-opsin-1 m-0 flex list-none flex-col p-0">
            {condition.notes.map((note) => (
              <li
                key={note}
                className="text-opsin-body [color:var(--foreground)]"
              >
                {note}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

/**
 * One filed item, in the one shape every filed item has: where it came from,
 * when, what the hospital called it and what the hospital recorded about it.
 */
function FiledEntry({
  hospital,
  on,
  title,
  lines,
  tag,
}: {
  hospital: HospitalId
  on: string
  title: string
  lines: string[]
  tag?: string
}) {
  return (
    <li className="gap-opsin-1 py-opsin-3 flex flex-col border-t border-border first:border-t-0 first:pt-0 last:pb-0">
      <div className="gap-x-opsin-3 gap-y-opsin-1 flex flex-wrap items-baseline">
        <HospitalName id={hospital} />
        <Quiet>{onDay(on)}</Quiet>
      </div>
      <p className="text-opsin-body m-0 [color:var(--foreground)]">{title}</p>
      {lines.map((line) => (
        <Quiet key={line}>{line}</Quiet>
      ))}
      {tag === undefined ? null : <Marker>{tag}</Marker>}
    </li>
  )
}

function OrderEntry({ order }: { order: Order }) {
  return (
    <FiledEntry
      hospital={order.hospital}
      on={order.placedOn}
      title={order.words}
      lines={[
        order.status,
        ...(order.result === undefined ? [] : [order.result]),
      ]}
      tag={order.awaited ? "A result has not come back yet" : undefined}
    />
  )
}

function ResultEntry({ result }: { result: Filed }) {
  return (
    <FiledEntry
      hospital={result.hospital}
      on={result.filedOn}
      title={result.words}
      lines={[result.kind]}
    />
  )
}

function DocumentEntry({ document }: { document: Filed }) {
  return (
    <FiledEntry
      hospital={document.hospital}
      on={document.filedOn}
      title={document.words}
      lines={[document.kind]}
    />
  )
}

function FormEntry({ form }: { form: CompletedForm }) {
  return (
    <FiledEntry
      hospital={form.hospital}
      on={form.filledOn}
      title="Completed form"
      lines={[]}
      tag={form.enteredInError ? "Marked as entered in error" : undefined}
    />
  )
}

function DischargeEntry({ discharge }: { discharge: Discharge }) {
  return (
    <FiledEntry
      hospital={discharge.hospital}
      on={discharge.on}
      title="Discharge summary"
      lines={[discharge.outcome, discharge.ending]}
    />
  )
}

const FORMS_LIST_ONLY =
  "These forms are listed here. To read what is on one, ask the hospital that filled it in."

const FILED_LIST_ONLY =
  "These are listed here. To get a copy, ask the hospital that holds it."

const CANNOT_CHANGE =
  "You cannot change anything medical here. If something looks wrong, tell the hospital that wrote it."

/**
 * A group of filed items under a visit. It is dropped when it is empty,
 * because a visit with no imaging had none withheld.
 */
function FiledGroup({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: ReactNode[]
}) {
  if (children.length === 0) return null
  return (
    <div className="gap-opsin-3 flex flex-col">
      <h4 className="text-opsin-subheadline-emphasis m-0 [color:var(--foreground)]">
        {title}
      </h4>
      <ul className="m-0 flex list-none flex-col p-0">{children}</ul>
      {note === undefined ? null : <Quiet>{note}</Quiet>}
    </div>
  )
}

/** One visit, with everything filed under it, in the order the record is written. */
function VisitDetail({
  visit,
  headingRef,
  onBack,
}: {
  visit: Visit
  headingRef: RefObject<HTMLHeadingElement | null>
  onBack: () => void
}) {
  const conditions = CONDITIONS.filter(
    (condition) => condition.visit === visit.id
  )
  const orders = ORDERS.filter((order) => order.visit === visit.id)
  const ended =
    visit.endedAt === undefined
      ? `Since ${onDay(visit.startedAt)}`
      : onDay(visit.startedAt) === onDay(visit.endedAt)
        ? onDay(visit.startedAt)
        : `${onDay(visit.startedAt)} to ${onDay(visit.endedAt)}`
  const facts: FactRow[] = [
    ["Hospital", HOSPITAL_NAME[visit.hospital]],
    ["Dates", ended],
    ["Type of visit", visit.kind],
    ["Status", visit.inProgress ? "In progress" : "Finished"],
    ...(visit.ending === undefined
      ? []
      : ([["How it ended", visit.ending]] as FactRow[])),
  ]
  return (
    <Card rung="raised">
      <article
        aria-labelledby={`${visit.id}-detail`}
        className="gap-opsin-5 flex flex-col"
      >
        {/* Back to the list, on the narrow layout only. On the wide one the
            list is beside this panel and there is nowhere to go back to. */}
        <div className="@3xl/main:hidden">
          <Button
            variant="quiet"
            size="sm"
            icon={<ChevronLeft />}
            onClick={onBack}
            className="-ml-opsin-3"
          >
            All visits
          </Button>
        </div>
        <div className="gap-opsin-2 flex flex-col">
          <HospitalName id={visit.hospital} />
          <h3
            id={`${visit.id}-detail`}
            ref={headingRef}
            tabIndex={-1}
            className="text-opsin-title3 m-0 [color:var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {visit.kind}
          </h3>
          {stillOpen(visit) ? (
            <div>
              <Badge variant="outline">Still open</Badge>
            </div>
          ) : null}
        </div>
        <Facts rows={facts} />

        <div className="gap-opsin-3 flex flex-col">
          <h4 className="text-opsin-subheadline-emphasis m-0 [color:var(--foreground)]">
            Conditions recorded
          </h4>
          {conditions.length === 0 ? (
            <Quiet>Nothing has been recorded here.</Quiet>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {conditions.map((condition) => (
                <li
                  key={condition.id}
                  className="py-opsin-3 border-t border-border first:border-t-0 first:pt-0 last:pb-0"
                >
                  <ConditionEntry condition={condition} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <FiledGroup title="Tests and treatments">
          {orders.map((order) => (
            <OrderEntry key={order.id} order={order} />
          ))}
        </FiledGroup>
        <FiledGroup title="Results" note={FILED_LIST_ONLY}>
          {RESULTS.filter((result) => result.visit === visit.id).map(
            (result) => (
              <ResultEntry key={result.id} result={result} />
            )
          )}
        </FiledGroup>
        <FiledGroup title="Completed forms" note={FORMS_LIST_ONLY}>
          {FORMS.filter((form) => form.visit === visit.id).map((form) => (
            <FormEntry key={form.id} form={form} />
          ))}
        </FiledGroup>
        <FiledGroup title="Documents" note={FILED_LIST_ONLY}>
          {DOCUMENTS.filter((document) => document.visit === visit.id).map(
            (document) => (
              <DocumentEntry key={document.id} document={document} />
            )
          )}
        </FiledGroup>
        <FiledGroup title="Discharge summary">
          {DISCHARGES.filter((discharge) => discharge.visit === visit.id).map(
            (discharge) => (
              <DischargeEntry key={discharge.visit} discharge={discharge} />
            )
          )}
        </FiledGroup>

        <Quiet>{CANNOT_CHANGE}</Quiet>
      </article>
    </Card>
  )
}

/** An accordion header naming a kind of entry and how many there are. */
function CountedTitle({ name, count }: { name: string; count: number }) {
  return (
    <span className="gap-x-opsin-2 flex flex-wrap items-baseline">
      <span>{name}</span>
      <span className="text-opsin-footnote [color:var(--muted-foreground)]">
        {count === 1 ? "1 entry" : `${count} entries`}
      </span>
    </span>
  )
}

/**
 * The whole history. Arranged by visit, because that is how it was written,
 * or cut across by type for the times somebody wants every result rather than
 * one visit. Nothing is added or removed between the two, because it is one
 * record sorted twice. On a wide column the visits sit in a list beside the
 * open one. On a narrow column the list gives way to the visit it opened,
 * with a way back, the way a phone's own lists do.
 */
function RecordScreen() {
  const [arrangement, setArrangement] = useState("visit")
  const [openVisit, setOpenVisit] = useState<string | null>(null)
  const detailHeading = useRef<HTMLHeadingElement | null>(null)
  const pendingFocus = useRef<string | null>(null)
  const shown = VISITS.find((visit) => visit.id === openVisit) ?? VISITS[0]
  const pinned = CONDITIONS.filter((condition) => condition.longTerm)

  /* Focus follows the change: to the visit that opened, or back to the button
     that opened it. Done after the render that shows it, because the panel is
     not on the page until then on the narrow layout. */
  useEffect(() => {
    const target = pendingFocus.current
    if (target === null) return
    pendingFocus.current = null
    if (target === "detail") {
      detailHeading.current?.focus()
      return
    }
    document.getElementById(target)?.focus()
  }, [openVisit])

  const medicines = ORDERS.filter((order) => order.medicine)
  const tests = ORDERS.filter((order) => !order.medicine)

  return (
    <>
      <div className="gap-opsin-3 flex flex-col">
        <SegmentedControl
          label="How to arrange your record"
          value={arrangement}
          onValueChange={setArrangement}
          options={[
            { value: "visit", label: "By visit" },
            { value: "type", label: "By type" },
          ]}
          className="self-start"
        />
        <Callout variant="note">
          This is what your treating doctors wrote, in their own words. The
          portal does not explain, score or rank anything.
        </Callout>
      </div>

      {/* Pinned at the top in both arrangements, because they apply to every
          visit and not only the one they were written in. */}
      <Section title="Long-term conditions and allergies">
        <Quiet>
          These are conditions your doctors recorded. They apply to every visit.
        </Quiet>
        <ul className="gap-opsin-3 m-0 grid list-none grid-cols-1 p-0 @2xl/main:grid-cols-2">
          {pinned.map((condition) => (
            <li key={condition.id} className="flex">
              <Card density="compact" className="w-full">
                <ConditionEntry condition={condition} />
              </Card>
            </li>
          ))}
        </ul>
        <Quiet>{CANNOT_CHANGE}</Quiet>
      </Section>

      {arrangement === "visit" ? (
        <Section title="Every visit, newest first">
          <div className="gap-opsin-5 grid grid-cols-1 @3xl/main:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @3xl/main:items-start">
            <ul
              className={`gap-opsin-3 m-0 list-none flex-col p-0 @3xl/main:flex ${openVisit === null ? "flex" : "hidden"}`}
            >
              {VISITS.map((visit) => {
                const isShown = visit.id === shown.id
                return (
                  <li key={visit.id}>
                    <Card density="compact" rung={isShown ? "raised" : "card"}>
                      <div className="gap-opsin-2 flex flex-col">
                        <div className="gap-x-opsin-3 gap-y-opsin-1 flex flex-wrap items-baseline justify-between">
                          <HospitalName id={visit.hospital} />
                          <Quiet>{onDay(visit.startedAt)}</Quiet>
                        </div>
                        <h3 className="text-opsin-headline m-0 [color:var(--foreground)]">
                          {visit.kind}
                        </h3>
                        <Quiet>
                          {mainConditionOf(visit.id)?.words ?? "Not recorded"}
                        </Quiet>
                        <div className="gap-opsin-2 flex flex-wrap items-center">
                          {stillOpen(visit) ? (
                            <Badge variant="outline">Still open</Badge>
                          ) : null}
                          {/* Which visit the panel beside the list is showing.
                              Drawn on the wide layout only, where there is a
                              panel beside the list to be showing it in. */}
                          {isShown ? (
                            <span className="hidden @3xl/main:inline-flex">
                              <Badge variant="soft">Showing</Badge>
                            </span>
                          ) : null}
                        </div>
                        <div>
                          <Button
                            id={`open-${visit.id}`}
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              pendingFocus.current = "detail"
                              setOpenVisit(visit.id)
                            }}
                          >
                            Open this visit
                            <VisuallyHidden>{`, ${visitChoice(visit)}`}</VisuallyHidden>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </li>
                )
              })}
            </ul>
            <div
              className={`@3xl/main:block ${openVisit === null ? "hidden" : "block"}`}
            >
              <VisitDetail
                visit={shown}
                headingRef={detailHeading}
                onBack={() => {
                  pendingFocus.current = `open-${shown.id}`
                  setOpenVisit(null)
                }}
              />
            </div>
          </div>
        </Section>
      ) : (
        <Section title="Everything, by type">
          <Accordion
            multiple
            defaultValue={["conditions"]}
            items={[
              {
                value: "conditions",
                title: (
                  <CountedTitle
                    name="Conditions recorded"
                    count={CONDITIONS.length}
                  />
                ),
                content: (
                  <div className="gap-opsin-3 flex flex-col">
                    <ul className="m-0 flex list-none flex-col p-0">
                      {CONDITIONS.map((condition) => (
                        <li
                          key={condition.id}
                          className="py-opsin-3 border-t border-border first:border-t-0 first:pt-0"
                        >
                          <ConditionEntry condition={condition} />
                        </li>
                      ))}
                    </ul>
                    <Quiet>{CANNOT_CHANGE}</Quiet>
                  </div>
                ),
              },
              {
                value: "medicines",
                title: (
                  <CountedTitle name="Medicines" count={medicines.length} />
                ),
                content: (
                  <ul className="m-0 flex list-none flex-col p-0">
                    {medicines.map((order) => (
                      <OrderEntry key={order.id} order={order} />
                    ))}
                  </ul>
                ),
              },
              {
                value: "results",
                title: (
                  <CountedTitle
                    name="Results"
                    count={tests.length + RESULTS.length}
                  />
                ),
                content: (
                  <div className="gap-opsin-3 flex flex-col">
                    {/* What was ordered and what came back, together,
                        because a result still being waited for is part of
                        the honest answer to "every result I have had". */}
                    <ul className="m-0 flex list-none flex-col p-0">
                      {tests.map((order) => (
                        <OrderEntry key={order.id} order={order} />
                      ))}
                      {RESULTS.map((result) => (
                        <ResultEntry key={result.id} result={result} />
                      ))}
                    </ul>
                    <Quiet>{FILED_LIST_ONLY}</Quiet>
                  </div>
                ),
              },
              {
                value: "documents",
                title: (
                  <CountedTitle name="Documents" count={DOCUMENTS.length} />
                ),
                content: (
                  <div className="gap-opsin-3 flex flex-col">
                    <ul className="m-0 flex list-none flex-col p-0">
                      {DOCUMENTS.map((document) => (
                        <DocumentEntry key={document.id} document={document} />
                      ))}
                    </ul>
                    <Quiet>{FILED_LIST_ONLY}</Quiet>
                  </div>
                ),
              },
              {
                value: "discharge",
                title: (
                  <CountedTitle
                    name="Discharge summaries"
                    count={DISCHARGES.length}
                  />
                ),
                content: (
                  <ul className="m-0 flex list-none flex-col p-0">
                    {DISCHARGES.map((discharge) => (
                      <DischargeEntry
                        key={discharge.visit}
                        discharge={discharge}
                      />
                    ))}
                  </ul>
                ),
              },
            ]}
          />
        </Section>
      )}

      <div className="gap-opsin-3 flex flex-col">
        <Quiet>
          Bills, beds, wards, price lists and hospital staff names are never
          part of your record.
        </Quiet>
        <SourceCitation
          source="Written by the doctors at the hospitals named on each entry. Nothing here was typed in by you or worked out by this portal."
          checkedOn={TODAY}
          locale="en-GB"
        />
      </div>
    </>
  )
}

/* ====================================================================== *
 * Access                                                                  *
 * ====================================================================== */

/** The sections of the access screen, for the list that jumps to each one. */
const ACCESS_SECTIONS = [
  { id: "access-start", label: "Where you are starting from" },
  { id: "access-hospitals", label: "Hospitals" },
  { id: "access-hiding", label: "Hiding one hospital's records" },
  { id: "access-subjects", label: "Sensitive subjects" },
  { id: "access-blocked", label: "People you have blocked" },
  { id: "access-findable", label: "Being found" },
  { id: "access-not-here", label: "What this screen does not do" },
]

/**
 * Said where somebody decides, because the reasonable fear is that restricting
 * what a hospital sees also hides it from the patient, and a person who
 * believes that will never use the control.
 */
const OWN_VIEW_NEVER =
  "Nothing here ever hides anything from you. You always see your own record in full, including what no hospital can see."

const ADMITTED_HIDE =
  "You cannot hide a hospital's records while it has you admitted. You can change this after you are discharged."

function isStance(value: string): value is Stance {
  return value === "default" || value === "allowed" || value === "denied"
}

/**
 * The three stances as one choice, with the reason beside any that cannot be
 * chosen now. A shut-out cannot be started while the hospital has the patient
 * admitted, and an allow cannot be set while a shut-out stands, so the way out
 * is named in the reason. Lifting a shut-out is always possible, so nothing
 * about being admitted traps somebody in a restriction they want to lift.
 */
function stanceOptions(site: SiteAccess) {
  const shutOutBlocked = site.admittedNow && site.stance !== "denied"
  const allowBlocked = site.stance === "denied"
  return [
    {
      value: "default",
      label: "While treating you",
      description:
        "It can see your record while it is treating you, and not otherwise.",
    },
    {
      value: "allowed",
      label: "Allowed at any time",
      description: allowBlocked
        ? "You have shut this hospital out. Turn the shut-out off first, then you can allow it."
        : "It can reach your record even when it is not treating you.",
      disabled: allowBlocked,
    },
    {
      value: "denied",
      label: "Shut out",
      description: shutOutBlocked
        ? ADMITTED_SHUT_OUT
        : "It sees only your basic card: name, photo, age, sex and record ID. No health information.",
      disabled: shutOutBlocked,
    },
  ]
}

const STANCE_SAVED: Record<Stance, (name: string) => string> = {
  default: (name) =>
    `Saved. ${name} can see your record while it is treating you.`,
  allowed: (name) =>
    `Saved. ${name} can reach your record even when it is not treating you.`,
  denied: (name) => `Saved. ${name} is shut out and sees only your basic card.`,
}

/** How private a subject is across the hospitals, for its accordion header. */
function subjectSummary(sites: SiteAccess[], subject: Subject): string {
  const kept = sites.filter((site) => site.subjects[subject].restricted).length
  if (kept === 0) return "Shared at every hospital"
  if (kept === sites.length) return "Private at every hospital"
  return `Private at ${kept} of ${sites.length} hospitals`
}

/** "a", "a and b", "a, b and c". */
function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join("")
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`
}

type SitesUpdate = (change: (current: SiteAccess[]) => SiteAccess[]) => void

/**
 * Who can see the record, and the one place to change it. The sections are
 * in the order a person thinks in rather than the order a schema declares:
 * where you are starting from, then hospitals, then whether one hospital's
 * notes travel, then the four sensitive subjects, then the people you have
 * blocked, then whether you can be found at all, then an honest list of what
 * the screen does not do.
 */
function AccessScreen({
  sites,
  setSites,
  findable,
  setFindable,
  onGo,
  announce,
}: {
  sites: SiteAccess[]
  setSites: SitesUpdate
  findable: boolean
  setFindable: (next: boolean) => void
  onGo: (next: ScreenKey) => void
  announce: (text: string) => void
}) {
  const [notices, setNotices] = useState<Record<string, string>>({})
  const [drafts, setDrafts] = useState<Record<string, Purpose[]>>({})
  const [askingFindableOff, setAskingFindableOff] = useState(false)
  const tocId = useId()

  function note(key: string, text: string) {
    setNotices((current) => ({ ...current, [key]: text }))
    announce(text)
  }

  function change(
    hospital: HospitalId,
    edit: (site: SiteAccess) => SiteAccess
  ) {
    setSites((current) =>
      current.map((site) => (site.hospital === hospital ? edit(site) : site))
    )
  }

  function clearDraft(key: string) {
    setDrafts((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function setSubject(
    hospital: HospitalId,
    subject: Subject,
    setting: SubjectSetting
  ) {
    change(hospital, (site) => ({
      ...site,
      subjects: { ...site.subjects, [subject]: setting },
    }))
  }

  return (
    <>
      <div className="gap-opsin-8 flex flex-col @4xl/main:flex-row-reverse @4xl/main:items-start">
        {/* A list that jumps to each section. On a wide column it stays beside
            the sections, clear of the showcase bar at the top of the window. */}
        <nav
          aria-labelledby={tocId}
          className="gap-opsin-2 @4xl/main:top-opsin-20 flex flex-col @4xl/main:sticky @4xl/main:w-56 @4xl/main:shrink-0"
        >
          <p
            id={tocId}
            className="text-opsin-subheadline-emphasis m-0 [color:var(--foreground)]"
          >
            On this screen
          </p>
          <ul className="gap-x-opsin-4 gap-y-opsin-1 m-0 flex list-none flex-wrap p-0 @4xl/main:flex-col">
            {ACCESS_SECTIONS.map((section) => (
              <li key={section.id}>
                <Link href={`#${section.id}`} emphasis="inline">
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="gap-opsin-10 flex min-w-0 flex-1 flex-col">
          <Section id="access-start" title="Where you are starting from">
            {postureSentences(sites, findable).map((sentence) => (
              <Body key={sentence}>{sentence}</Body>
            ))}
            <Callout variant="note">{OWN_VIEW_NEVER}</Callout>
          </Section>

          <Section id="access-hospitals" title="Hospitals">
            <Quiet>
              One entry for every hospital your record has been reachable from.
            </Quiet>
            <ul className="gap-opsin-4 m-0 grid list-none grid-cols-1 p-0 @2xl/main:grid-cols-2">
              {sites.map((site) => {
                const name = HOSPITAL_NAME[site.hospital]
                return (
                  <li key={site.hospital} className="flex">
                    <Card className="w-full">
                      <div className="gap-opsin-3 flex flex-col">
                        <RadioGroup
                          label={`When ${name} can see your record`}
                          value={site.stance}
                          options={stanceOptions(site)}
                          onValueChange={(next) => {
                            if (!isStance(next)) return
                            change(site.hospital, (current) => ({
                              ...current,
                              stance: next,
                            }))
                            note(
                              `stance-${site.hospital}`,
                              STANCE_SAVED[next](name)
                            )
                          }}
                        />
                        {site.admittedNow ? (
                          <Marker>You are admitted here now</Marker>
                        ) : null}
                        <Saved message={notices[`stance-${site.hospital}`]} />
                      </div>
                    </Card>
                  </li>
                )
              })}
            </ul>
          </Section>

          <Section
            id="access-hiding"
            title="Hide one hospital's records from the others"
          >
            <Quiet>
              Doctors at other hospitals will not see what a hidden hospital
              wrote. You still see all of it, and so does the hospital that
              wrote it.
            </Quiet>
            {/* Prominent rather than a footnote, because a control that
                quietly stops working in an emergency is worse than no
                control. The exception is stated where the patient decides. */}
            <Callout variant="caveat">
              A doctor opening records in an emergency can still see through
              this. We tell you rather than let you believe otherwise.
            </Callout>
            <Card>
              <ul className="m-0 flex list-none flex-col p-0">
                {sites.map((site) => {
                  const name = HOSPITAL_NAME[site.hospital]
                  const blocked = site.admittedNow && !site.hidden
                  return (
                    <li
                      key={site.hospital}
                      className="gap-opsin-2 py-opsin-4 flex flex-col border-t border-border first:border-t-0 first:pt-0 last:pb-0"
                    >
                      <Switch
                        label={`Hide what ${name} wrote`}
                        description={
                          blocked
                            ? ADMITTED_HIDE
                            : site.hidden
                              ? "Hidden from other hospitals."
                              : "Other hospitals can see what this hospital wrote."
                        }
                        checked={site.hidden}
                        disabled={blocked}
                        onCheckedChange={(next) => {
                          change(site.hospital, (current) => ({
                            ...current,
                            hidden: next,
                          }))
                          note(
                            `hide-${site.hospital}`,
                            next
                              ? `Saved. Doctors at other hospitals will not see what ${name} wrote.`
                              : `Saved. Other hospitals can see what ${name} wrote.`
                          )
                        }}
                      />
                      <Saved message={notices[`hide-${site.hospital}`]} />
                    </li>
                  )
                })}
              </ul>
            </Card>
          </Section>

          <Section id="access-subjects" title="Sensitive subjects">
            <Quiet>
              Drug and alcohol treatment records are kept private on their own,
              hospital by hospital, from the first time a hospital admits you.
              You turn sharing on yourself if you want to.
            </Quiet>
            <Accordion
              multiple
              items={SUBJECTS.map((subject) => ({
                value: subject,
                title: (
                  <span className="flex flex-col">
                    <span>{SUBJECT_NAME[subject]}</span>
                    <span className="text-opsin-footnote [color:var(--muted-foreground)]">
                      {subjectSummary(sites, subject)}
                    </span>
                  </span>
                ),
                content: (
                  <ul className="m-0 flex list-none flex-col p-0">
                    {sites.map((site) => {
                      const name = HOSPITAL_NAME[site.hospital]
                      const setting = site.subjects[subject]
                      const key = `${subject}-${site.hospital}`
                      const chosen = drafts[key] ?? setting.purposes
                      return (
                        <li
                          key={key}
                          className="gap-opsin-3 py-opsin-4 flex flex-col border-t border-border first:border-t-0 first:pt-0 last:pb-0"
                        >
                          <Switch
                            label={`Keep private at ${name}`}
                            description={
                              setting.restricted
                                ? subject === "substance"
                                  ? "Kept private automatically."
                                  : "Restricted."
                                : "Shared like the rest of your record."
                            }
                            checked={setting.restricted}
                            onCheckedChange={(next) => {
                              setSubject(site.hospital, subject, {
                                restricted: next,
                                purposes: [],
                              })
                              clearDraft(key)
                              note(
                                key,
                                next
                                  ? `Saved. ${SUBJECT_NAME[subject]} is private at ${name}.`
                                  : `Saved. ${SUBJECT_NAME[subject]} is shared at ${name} like the rest of your record.`
                              )
                            }}
                          />
                          {/* The ticks compose a decision and the button
                              commits it, so one choice is one change rather
                              than three, and what shows after a save is what
                              was saved. */}
                          {setting.restricted ? (
                            <fieldset className="gap-opsin-2 m-0 flex min-w-0 flex-col border-0 p-0">
                              <legend className="mb-opsin-2 text-opsin-subheadline-emphasis p-0 [color:var(--foreground)]">
                                {`Reasons ${name} may still read it for`}
                              </legend>
                              {PURPOSES.map((purpose) => (
                                <Checkbox
                                  key={purpose}
                                  label={PURPOSE_NAME[purpose]}
                                  checked={chosen.includes(purpose)}
                                  onCheckedChange={(on) =>
                                    setDrafts((current) => ({
                                      ...current,
                                      [key]: PURPOSES.filter((candidate) =>
                                        candidate === purpose
                                          ? on
                                          : chosen.includes(candidate)
                                      ),
                                    }))
                                  }
                                />
                              ))}
                              {chosen.length === 0 ? (
                                <Quiet>
                                  You have allowed no reasons, so nothing at
                                  this hospital reaches this subject.
                                </Quiet>
                              ) : null}
                              <div>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setSubject(site.hospital, subject, {
                                      restricted: true,
                                      purposes: chosen,
                                    })
                                    clearDraft(key)
                                    note(
                                      key,
                                      chosen.length === 0
                                        ? `Saved. Nothing at ${name} reaches this subject.`
                                        : `Saved. ${name} may read it only for ${joinWords(
                                            chosen.map((purpose) =>
                                              PURPOSE_NAME[
                                                purpose
                                              ].toLowerCase()
                                            )
                                          )}.`
                                    )
                                  }}
                                >
                                  Save these reasons
                                </Button>
                              </div>
                            </fieldset>
                          ) : null}
                          <Saved message={notices[key]} />
                        </li>
                      )
                    })}
                  </ul>
                ),
              }))}
            />
            <Quiet>{OWN_VIEW_NEVER}</Quiet>
          </Section>

          {/* A block is read and lifted here. It is made from a line in Who
              looked, the only place a member of staff could ever be named. */}
          <Section id="access-blocked" title="People you have blocked">
            <EmptyState
              reason="nothing-yet"
              title="You have not blocked anyone"
              titleLevel={3}
              action={{
                label: "Go to Who looked",
                onSelect: () => onGo("log"),
              }}
            >
              A block holds even if that person tries an emergency override.
              Every block has an end date, and it can never reduce your own
              access. You block somebody from a line in Who looked that names
              them.
            </EmptyState>
          </Section>

          <Section id="access-findable" title="Can hospitals find you?">
            <Card>
              <div className="gap-opsin-3 flex flex-col">
                <Switch
                  label="Let hospitals find me"
                  description={
                    findable
                      ? "On. Hospitals that have never treated you can find you when they search."
                      : "Off. Only you, people you approved, hospitals you allowed, and a hospital treating you can find anything."
                  }
                  checked={findable}
                  onCheckedChange={(next) => {
                    if (next) {
                      setFindable(true)
                      note(
                        "findable",
                        "Saved. Hospitals that have never treated you can find you again."
                      )
                      return
                    }
                    /* The direction that costs something asks first, every
                       time, so the consequence is read again rather than
                       once ever. */
                    setAskingFindableOff(true)
                  }}
                />
                <Saved message={notices.findable} />
              </div>
            </Card>
          </Section>

          <Section id="access-not-here" title="What this screen does not do">
            <Body>
              No bills. No hospital-internal labels. No searching for staff. No
              rules in your own words, because there are seven kinds of setting
              and no eighth.
            </Body>
          </Section>
        </div>
      </div>

      <Dialog
        open={askingFindableOff}
        onOpenChange={setAskingFindableOff}
        title="Stop hospitals finding you?"
        description="If hospitals cannot find you, a hospital cannot look you up in order to admit you. That includes an emergency where you cannot speak for yourself. This is your choice to make."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setAskingFindableOff(false)
                setFindable(false)
                note(
                  "findable",
                  "Saved. Hospitals that have never treated you can no longer find you."
                )
              }}
            >
              Turn this off
            </Button>
            <Button
              variant="primary"
              onClick={() => setAskingFindableOff(false)}
            >
              Keep it on
            </Button>
          </>
        }
      />
    </>
  )
}

/* ====================================================================== *
 * Who looked                                                              *
 * ====================================================================== */

const BLOCK_UNAVAILABLE =
  "Blocking needs the line to name a person. This one does not, so there is nobody to block."

const NO_HOSPITAL_ON_LINE =
  "This line does not name a hospital, so nothing can be shut out from here. Use the hospitals list on the Access screen."

/**
 * Every opening of the record, at every hospital, in one list no single
 * hospital can see. Two follow-ups are offered on every line: block the person,
 * and shut the hospital out. Neither is ever removed. The block is greyed with
 * its reason on every line, because no line names an individual, and a
 * patient who could not find the control would conclude they were never
 * allowed it. There is no ranking by suspiciousness and no "unusual access"
 * flag. The list is a list.
 */
function LogScreen({
  sites,
  setSites,
  announce,
}: {
  sites: SiteAccess[]
  setSites: SitesUpdate
  announce: (text: string) => void
}) {
  const [asking, setAsking] = useState<{
    line: string
    hospital: HospitalId
  } | null>(null)
  const [notices, setNotices] = useState<Record<string, string>>({})

  /** Why this line cannot shut its hospital out right now, if it cannot. */
  function shutOutReason(line: LogLine): string | undefined {
    const site = sites.find((candidate) => candidate.hospital === line.hospital)
    if (line.hospital === undefined || site === undefined)
      return NO_HOSPITAL_ON_LINE
    if (site.stance === "denied") return "This hospital is already shut out."
    if (site.admittedNow) return ADMITTED_SHUT_OUT
    return undefined
  }

  return (
    <>
      <div className="gap-opsin-2 flex flex-col">
        <Body>
          Every time anyone opens your record, it appears in this one list, from
          every hospital. No single hospital can see this list.
        </Body>
        <Quiet>
          An <Term id="emergency-override" /> is always listed, and so is an
          attempt that was refused. Opening this screen is itself recorded, so
          your own visits appear here too.
        </Quiet>
      </div>

      <ul className="gap-opsin-4 m-0 flex list-none flex-col p-0">
        {LOG.map((line) => {
          const facts: FactRow[] = [
            [
              "Who looked",
              line.self ? "You" : "This line does not name an individual.",
            ],
            [
              "Hospital",
              line.hospital === undefined
                ? "Not available"
                : HOSPITAL_NAME[line.hospital],
            ],
            ["What they opened", line.opened],
            ...(line.why === undefined
              ? []
              : ([["Why they said they were looking", line.why]] as FactRow[])),
          ]
          return (
            <li key={line.id}>
              <Card>
                <div className="gap-opsin-4 @3xl/main:gap-opsin-8 flex flex-col @3xl/main:flex-row @3xl/main:items-start">
                  <div className="gap-opsin-3 flex min-w-0 flex-1 flex-col">
                    <div className="gap-opsin-2 flex flex-wrap items-center">
                      <h2 className="text-opsin-headline m-0 [color:var(--foreground)]">
                        {atTime(line.at)}
                      </h2>
                      {line.refused ? (
                        <Badge variant="outline">Refused</Badge>
                      ) : null}
                    </div>
                    <Facts rows={facts} />
                    {line.refused ? (
                      <Quiet>
                        Someone tried to open your record and was stopped.
                      </Quiet>
                    ) : null}
                    {/* Never left out and never buried. The reason the doctor
                        gave stays with the hospital that took it, and the line
                        says so rather than inventing one. */}
                    {line.override ? (
                      <Callout variant="caveat" title="Emergency override">
                        The doctor had to give a reason. It stays with the
                        hospital that took it, so it is not shown here.
                      </Callout>
                    ) : null}
                  </div>
                  <div className="gap-opsin-3 flex flex-col @3xl/main:w-72 @3xl/main:shrink-0">
                    <GatedAction
                      label="Block this person"
                      reason={BLOCK_UNAVAILABLE}
                    />
                    <GatedAction
                      label="Shut this hospital out"
                      variant="destructive"
                      reason={shutOutReason(line)}
                      onAct={() => {
                        if (line.hospital !== undefined)
                          setAsking({ line: line.id, hospital: line.hospital })
                      }}
                    />
                    <Saved message={notices[line.id]} />
                  </div>
                </div>
              </Card>
            </li>
          )
        })}
      </ul>

      <Dialog
        open={asking !== null}
        onOpenChange={(open) => {
          if (!open) setAsking(null)
        }}
        title={
          asking === null
            ? "Shut this hospital out?"
            : `Shut ${HOSPITAL_NAME[asking.hospital]} out?`
        }
        description="It will see only your basic card: name, photo, age, sex and record ID. No health information. You can let it back in from the Access screen."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                if (asking === null) return
                const name = HOSPITAL_NAME[asking.hospital]
                setSites((current) =>
                  current.map((site) =>
                    site.hospital === asking.hospital
                      ? { ...site, stance: "denied" }
                      : site
                  )
                )
                const text = STANCE_SAVED.denied(name)
                setNotices((current) => ({ ...current, [asking.line]: text }))
                announce(text)
                setAsking(null)
              }}
            >
              Shut it out
            </Button>
            <Button variant="primary" onClick={() => setAsking(null)}>
              Keep things as they are
            </Button>
          </>
        }
      />
    </>
  )
}

/* ====================================================================== *
 * Family and people you trust                                             *
 * ====================================================================== */

/**
 * A visible name for a control that carries its own accessible name. Select
 * applies its `label` as an `aria-label` and draws no visible text, so the
 * product draws the same words itself. It is a span rather than a `label`,
 * because a label with nothing to point at only looks associated.
 */
function ControlLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-opsin-subheadline-emphasis [color:var(--foreground)]">
      {children}
    </span>
  )
}

/**
 * A renewal is filled in with the same span the patient chose the first
 * time, counted from today. The honest default is their own earlier decision,
 * not a window this screen invented.
 */
function renewalDay(entry: CircleEntry): string {
  return daysAfter(TODAY, Math.max(daysFrom(entry.invitedOn, entry.endsOn), 1))
}

/**
 * Family and people you trust. Every entry is a grant over the patient's own
 * record and every one ends. An invitation shares nothing. Access begins when
 * the other person accepts from their own account, which makes adding
 * somebody a claim rather than a share.
 */
function FamilyScreen({
  circle,
  setCircle,
  waiting,
  onGo,
  announce,
}: {
  circle: CircleEntry[]
  setCircle: (change: (current: CircleEntry[]) => CircleEntry[]) => void
  waiting: number
  onGo: (next: ScreenKey) => void
  announce: (text: string) => void
}) {
  const [notices, setNotices] = useState<Record<string, string>>({})
  const [renewOn, setRenewOn] = useState<Record<string, string>>({})
  const [renewProblems, setRenewProblems] = useState<Record<string, string>>({})
  const [removing, setRemoving] = useState<string | null>(null)
  const [recordId, setRecordId] = useState("")
  const [called, setCalled] = useState("Other")
  const [endsOn, setEndsOn] = useState("")
  const [problems, setProblems] = useState<{
    recordId?: string
    endsOn?: string
  }>({})
  const [sent, setSent] = useState<string | undefined>(undefined)
  const tomorrow = daysAfter(TODAY, 1)
  const leaving = circle.find((entry) => entry.id === removing)

  function note(key: string, text: string) {
    setNotices((current) => ({ ...current, [key]: text }))
    announce(text)
  }

  function invite() {
    const id = recordId.trim().toUpperCase()
    const found = {
      recordId: id === "" ? "Enter their record ID." : undefined,
      endsOn:
        endsOn === ""
          ? "Choose the day their access ends."
          : endsOn <= TODAY
            ? "Choose a day after today."
            : undefined,
    }
    setProblems(found)
    if (found.recordId !== undefined || found.endsOn !== undefined) return
    setCircle((current) => [
      {
        id: `circle-new-${current.length}`,
        called,
        recordId: id,
        state: "invited",
        invitedOn: TODAY,
        endsOn,
        renewable: false,
      },
      ...current,
    ])
    setRecordId("")
    setEndsOn("")
    setCalled("Other")
    const text = `Invitation sent to ${id}. Nothing is shared until they accept.`
    setSent(text)
    announce(text)
  }

  return (
    <>
      <div className="gap-opsin-2 flex flex-col">
        <Body>
          Every access you give has an end date. No access is permanent.
        </Body>
        <Quiet>
          Everyone always sees their own record in full. That includes the
          person you look after.
        </Quiet>
      </div>

      {/* The other side of the circle lives on its own screen, because an
          invitation somebody sent this patient sits on that person's record,
          which this list can never show. */}
      <Card density="compact">
        <div className="gap-opsin-3 flex flex-col @lg/main:flex-row @lg/main:items-center @lg/main:justify-between">
          <div className="gap-opsin-1 flex flex-col">
            <h2 className="text-opsin-headline m-0 [color:var(--foreground)]">
              Invitations for you
            </h2>
            <Quiet>
              {waiting === 0
                ? "Nothing is waiting for an answer."
                : waiting === 1
                  ? "One invitation is waiting for your answer."
                  : `${waiting} invitations are waiting for your answer.`}
            </Quiet>
          </div>
          <Button
            variant="secondary"
            icon={<ChevronRight />}
            iconPosition="trailing"
            onClick={() => onGo("invites")}
          >
            Open invitations
          </Button>
        </div>
      </Card>

      <div className="gap-opsin-8 grid grid-cols-1 @3xl/main:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @3xl/main:items-start">
        <div className="gap-opsin-8 flex flex-col">
          <Section title="People who can see your record">
            <ul className="gap-opsin-4 m-0 flex list-none flex-col p-0">
              {circle.map((entry) => {
                const ended =
                  entry.state === "lapsed" || entry.state === "removed"
                return (
                  <li key={entry.id}>
                    <Card>
                      <div className="gap-opsin-3 flex flex-col">
                        <div className="gap-opsin-2 flex flex-wrap items-center justify-between">
                          <h3 className="text-opsin-headline m-0 [color:var(--foreground)]">
                            {entry.called}
                          </h3>
                          <Badge variant="outline">
                            {CIRCLE_WORD[entry.state]}
                          </Badge>
                        </div>
                        <Facts
                          rows={[
                            ["Record ID", entry.recordId],
                            ["Invited on", onDay(entry.invitedOn)],
                            [
                              ended ? "Access ended" : "Access ends",
                              onDay(entry.endsOn),
                            ],
                          ]}
                        />
                        {entry.state === "invited" ? (
                          <Quiet>Nothing is shared until they accept.</Quiet>
                        ) : null}

                        {/* A lapse has two causes and they are drawn
                            differently, because one can be undone and the
                            other never can. */}
                        {entry.state === "lapsed" && entry.renewable ? (
                          <div className="gap-opsin-3 flex flex-col">
                            <Field
                              label="New end date"
                              hint="The same length of time you chose before, counted from today. Change it if you like."
                              error={renewProblems[entry.id]}
                            >
                              <Field.Control
                                name={`renew-${entry.id}`}
                                type="date"
                                min={tomorrow}
                                value={renewOn[entry.id] ?? renewalDay(entry)}
                                onChange={(event) =>
                                  setRenewOn((current) => ({
                                    ...current,
                                    [entry.id]: event.target.value,
                                  }))
                                }
                              />
                            </Field>
                            <div>
                              <Button
                                variant="secondary"
                                onClick={() => {
                                  const day =
                                    renewOn[entry.id] ?? renewalDay(entry)
                                  if (day <= TODAY) {
                                    setRenewProblems((current) => ({
                                      ...current,
                                      [entry.id]: "Choose a day after today.",
                                    }))
                                    return
                                  }
                                  setRenewProblems((current) => ({
                                    ...current,
                                    [entry.id]: "",
                                  }))
                                  setCircle((current) =>
                                    current.map((candidate) =>
                                      candidate.id === entry.id
                                        ? {
                                            ...candidate,
                                            state: "active",
                                            endsOn: day,
                                          }
                                        : candidate
                                    )
                                  )
                                  note(
                                    entry.id,
                                    `Renewed. Their access now ends on ${onDay(day)}.`
                                  )
                                }}
                              >
                                Renew
                              </Button>
                            </div>
                          </div>
                        ) : null}
                        {entry.state === "lapsed" && !entry.renewable ? (
                          <GatedAction
                            label="Renew"
                            reason="This ended because of the age rules and cannot be renewed."
                          />
                        ) : null}

                        <GatedAction
                          label="Remove access"
                          variant="destructive"
                          reason={
                            entry.state === "removed"
                              ? "This access has ended permanently. Send a fresh invitation if you want to give it again."
                              : undefined
                          }
                          onAct={() => setRemoving(entry.id)}
                        />
                        <Saved message={notices[entry.id]} />
                      </div>
                    </Card>
                  </li>
                )
              })}
            </ul>
          </Section>

          {/* Not reachable from this record, because access over somebody
              else's record is held on that record. It is said in plain words
              beside a greyed control, rather than drawn as an empty list that reads as
              "nobody". */}
          <Section title="People you look after">
            <Quiet>
              As a child grows up, parts of their record become private to them:
              a first step at 12, mental health at 14, reproductive health and
              drug and alcohol treatment at 16, and at 18 the record leaves your
              circle.
            </Quiet>
            <Card>
              <GatedAction
                label="Invite someone you look after"
                reason="Coming soon. The portal cannot yet show a record that belongs to somebody else, so this list stays empty and you cannot invite anyone to it."
              />
            </Card>
          </Section>
        </div>

        <div className="@3xl/main:top-opsin-6 @3xl/main:sticky">
          <Section title="Invite someone">
            <Card>
              <div className="gap-opsin-4 flex flex-col">
                <Quiet>
                  An invitation shares nothing. Their access begins when they
                  accept from their own account.
                </Quiet>
                <Field
                  label="Their record ID"
                  hint="Ask them for it. It names their record, not them."
                  error={problems.recordId}
                >
                  <Field.Control
                    name="record-id"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    value={recordId}
                    onChange={(event) => setRecordId(event.target.value)}
                  />
                </Field>
                <div className="gap-opsin-2 flex flex-col">
                  <ControlLabel>What to call them</ControlLabel>
                  <Select
                    label="What to call them"
                    value={called}
                    options={RELATIONSHIPS}
                    onValueChange={setCalled}
                  />
                  <Quiet>
                    This word is for your list only. It never changes what
                    anyone can see, and it never affects the age rules.
                  </Quiet>
                </div>
                <Field
                  label="When their access ends"
                  hint="Every access has an end date."
                  error={problems.endsOn}
                >
                  <Field.Control
                    name="ends-on"
                    type="date"
                    min={tomorrow}
                    value={endsOn}
                    onChange={(event) => setEndsOn(event.target.value)}
                  />
                </Field>
                <Button
                  variant="primary"
                  fullWidth
                  icon={<UserPlus />}
                  onClick={invite}
                >
                  Invite someone
                </Button>
                <Saved message={sent} />
              </div>
            </Card>
          </Section>
        </div>
      </div>

      <Dialog
        open={leaving !== undefined}
        onOpenChange={(open) => {
          if (!open) setRemoving(null)
        }}
        title="Remove this person's access?"
        description={
          leaving === undefined
            ? undefined
            : `${leaving.called}, record ID ${leaving.recordId}. ${
                leaving.state === "invited"
                  ? "The invitation is withdrawn, and nothing was ever shared."
                  : "They will no longer see your record."
              } This cannot be undone. To give access again, you send a fresh invitation.`
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                if (leaving === undefined) return
                setCircle((current) =>
                  current.map((candidate) =>
                    candidate.id === leaving.id
                      ? { ...candidate, state: "removed" }
                      : candidate
                  )
                )
                note(leaving.id, "Removed. This access has ended permanently.")
                setRemoving(null)
              }}
            >
              Remove access
            </Button>
            <Button variant="primary" onClick={() => setRemoving(null)}>
              Keep their access
            </Button>
          </>
        }
      />
    </>
  )
}

/** Invitations other people sent this patient, into their own circles. */
function InvitesScreen({
  invitations,
  setInvitations,
  announce,
}: {
  invitations: Invitation[]
  setInvitations: (change: (current: Invitation[]) => Invitation[]) => void
  announce: (text: string) => void
}) {
  const [answered, setAnswered] = useState<string | undefined>(undefined)

  function answer(invitation: Invitation, accept: boolean) {
    setInvitations((current) =>
      current.filter((candidate) => candidate.id !== invitation.id)
    )
    const text = accept
      ? `Accepted. You can now see the record of ${invitation.fromRecordId}.`
      : "Declined. Nothing was shared."
    setAnswered(text)
    announce(text)
  }

  return (
    <>
      <Body>
        People who have invited you into their circle. Accepting shares access,
        and declining shares nothing.
      </Body>
      <Saved message={answered} />
      {invitations.length === 0 ? (
        <EmptyState
          reason={answered === undefined ? "nothing-yet" : "nothing-left"}
          title="You have no invitations right now"
          titleLevel={2}
        />
      ) : (
        <ul className="gap-opsin-4 m-0 flex list-none flex-col p-0">
          {invitations.map((invitation) => (
            <li key={invitation.id}>
              <Card>
                <div className="gap-opsin-3 flex flex-col">
                  <h2 className="text-opsin-headline m-0 [color:var(--foreground)]">
                    {invitation.called}
                  </h2>
                  <Facts
                    rows={[
                      ["From", `Record ID ${invitation.fromRecordId}`],
                      ["Access ends", onDay(invitation.endsOn)],
                    ]}
                  />
                  <Body>
                    {invitation.youSeeTheirs
                      ? "If you accept, you will be able to see their record."
                      : "If you accept, they will be able to see your record."}
                  </Body>
                  <div className="gap-opsin-3 flex flex-col @md/main:flex-row">
                    <Button
                      variant="primary"
                      onClick={() => answer(invitation, true)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => answer(invitation, false)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

/* ====================================================================== *
 * Share                                                                   *
 * ====================================================================== */

function isScope(value: string): value is Scope {
  return (
    value === "card" ||
    value === "visit" ||
    value === "full" ||
    value === "document"
  )
}

function isChannel(value: string): value is Channel {
  return value === "qr" || value === "link"
}

/** Where a link share points. `example.invalid` is reserved, so it can never resolve. */
function linkFor(code: string): string {
  return `https://example.invalid/s?c=${code}`
}

/**
 * Where the scan code goes. A real share draws its code on the device, because
 * handing a live code to an image service would hand that service the record.
 * A code that opened nothing would be a promise this specimen cannot keep, so
 * it draws a picture of one and says so beside it.
 */
function ScanCodeStandIn() {
  return (
    <figure className="gap-opsin-2 m-0 flex flex-col items-center">
      <div className="flex aspect-square w-full max-w-56 items-center justify-center rounded-opsin-lg border border-border bg-card">
        <QrCode
          aria-hidden="true"
          strokeWidth={1.25}
          className="size-3/4 [color:var(--foreground)]"
        />
      </div>
      <figcaption className="text-opsin-footnote max-w-sm text-center [color:var(--muted-foreground)]">
        A real share draws its scan code here, on your phone. This demonstration
        draws a picture of one, which does not scan.
      </figcaption>
    </figure>
  )
}

/**
 * Handing a doctor a slice of the record. Three things are chosen before a
 * share exists, what it carries, for how long and how it is handed over,
 * because each is a decision about how much of a record a stranger sees and
 * none can be changed afterwards. The code appears once, on the panel that
 * follows, and is gone when that panel is closed.
 */
function ShareScreen({
  shares,
  setShares,
  onOpenAsDoctor,
  announce,
}: {
  shares: Share[]
  setShares: (change: (current: Share[]) => Share[]) => void
  onOpenAsDoctor: (id: string) => void
  announce: (text: string) => void
}) {
  const [scope, setScope] = useState<Scope>("card")
  const [visitPick, setVisitPick] = useState(visitChoice(VISITS[0]))
  const [documentPick, setDocumentPick] = useState(documentChoice(DOCUMENTS[0]))
  const [windowPick, setWindowPick] = useState("10")
  const [channel, setChannel] = useState<Channel>("qr")
  const [issuedId, setIssuedId] = useState<string | null>(null)
  const [copyNote, setCopyNote] = useState<string | undefined>(undefined)
  const [notices, setNotices] = useState<Record<string, string>>({})
  const panelHeading = useRef<HTMLHeadingElement | null>(null)
  const formHeading = useRef<HTMLHeadingElement | null>(null)
  const focusNext = useRef<"panel" | "form" | null>(null)
  const codeId = useId()
  const issued = shares.find((share) => share.id === issuedId)

  useEffect(() => {
    const target = focusNext.current
    focusNext.current = null
    if (target === "panel") panelHeading.current?.focus()
    if (target === "form") formHeading.current?.focus()
  }, [issuedId])

  function create() {
    const made = shares.filter((share) => share.code !== undefined).length
    const minutes =
      WINDOW_OPTIONS.find((option) => option.value === windowPick)?.minutes ??
      10
    const share: Share = {
      id: `share-new-${made}`,
      scope,
      target:
        scope === "visit"
          ? VISITS.find((visit) => visitChoice(visit) === visitPick)?.id
          : scope === "document"
            ? DOCUMENTS.find(
                (document) => documentChoice(document) === documentPick
              )?.id
            : undefined,
      channel,
      madeAt: NOW,
      notAfter: laterBy(NOW, minutes),
      state: "issued",
      code: demoCode(made),
    }
    setShares((current) => [share, ...current])
    focusNext.current = "panel"
    setIssuedId(share.id)
    setCopyNote(undefined)
    announce("Your share is ready.")
  }

  async function copyLink(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopyNote("Copied.")
    } catch {
      /* A refused clipboard is not a failure worth an alarm, because the
         link is on the screen and selectable, which every browser allows. */
      const node = document.getElementById(codeId)
      const selection = window.getSelection()
      if (node !== null && selection !== null) selection.selectAllChildren(node)
      setCopyNote(
        "This browser did not allow copying here, so the link is selected instead. Copy it with your device's copy command."
      )
    }
  }

  return (
    <>
      <Body>
        Put your history in front of the doctor in the room with you, for a
        short time.
      </Body>

      <div className="gap-opsin-8 grid grid-cols-1 @3xl/main:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @3xl/main:items-start">
        {issued === undefined || issued.code === undefined ? (
          <Card>
            <div className="gap-opsin-5 flex flex-col">
              <h2
                ref={formHeading}
                tabIndex={-1}
                className="text-opsin-title3 m-0 [color:var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                Make a share
              </h2>
              <div className="gap-opsin-2 flex flex-col">
                <RadioGroup
                  label="What this share carries"
                  value={scope}
                  options={SCOPE_OPTIONS}
                  onValueChange={(next) => {
                    if (isScope(next)) setScope(next)
                  }}
                />
                <Quiet>
                  Pick the smallest one that answers the doctor&apos;s question.
                </Quiet>
              </div>
              {scope === "visit" ? (
                <div className="gap-opsin-2 flex flex-col">
                  <ControlLabel>Which visit to share</ControlLabel>
                  <Select
                    label="Which visit to share"
                    value={visitPick}
                    options={VISITS.map((visit) => ({
                      value: visitChoice(visit),
                      label: visitChoice(visit),
                    }))}
                    onValueChange={setVisitPick}
                  />
                </div>
              ) : null}
              {scope === "document" ? (
                <div className="gap-opsin-2 flex flex-col">
                  <ControlLabel>Which document to share</ControlLabel>
                  <Select
                    label="Which document to share"
                    value={documentPick}
                    options={DOCUMENTS.map((document) => ({
                      value: documentChoice(document),
                      label: documentChoice(document),
                    }))}
                    onValueChange={setDocumentPick}
                  />
                </div>
              ) : null}
              <RadioGroup
                label="How long it lasts"
                value={windowPick}
                options={WINDOW_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                onValueChange={setWindowPick}
              />
              <RadioGroup
                label="How to hand it over"
                value={channel}
                options={CHANNEL_OPTIONS}
                onValueChange={(next) => {
                  if (isChannel(next)) setChannel(next)
                }}
              />
              <Button
                variant="primary"
                fullWidth
                icon={<Share2 />}
                onClick={create}
              >
                Create the share
              </Button>
            </div>
          </Card>
        ) : (
          <Card rung="raised">
            <div className="gap-opsin-4 flex flex-col">
              <h2
                ref={panelHeading}
                tabIndex={-1}
                className="text-opsin-title3 m-0 [color:var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                {issued.channel === "qr"
                  ? "Show this to the doctor in front of you"
                  : "Send this link to the doctor"}
              </h2>
              {issued.channel === "qr" ? <ScanCodeStandIn /> : null}
              {/* The code is printed as text as well as drawn, because a scan
                  fails for ordinary reasons and somebody should be able to read
                  it out rather than be told the feature does not work. */}
              <p
                id={codeId}
                className={`px-opsin-4 py-opsin-3 font-opsin-mono m-0 rounded-opsin-md border-2 border-foreground text-center break-all [color:var(--foreground)] ${
                  issued.channel === "qr"
                    ? "text-opsin-title3 tracking-wider"
                    : "text-opsin-body"
                }`}
              >
                {issued.channel === "qr" ? issued.code : linkFor(issued.code)}
              </p>
              {issued.channel === "link" ? (
                <div className="gap-opsin-2 flex flex-col items-start">
                  <Button
                    variant="secondary"
                    icon={<Copy />}
                    onClick={() => {
                      if (issued.code !== undefined)
                        void copyLink(linkFor(issued.code))
                    }}
                  >
                    Copy the link
                  </Button>
                  <Saved message={copyNote} />
                </div>
              ) : null}
              <Body>{`Stops working at ${atTime(issued.notAfter)}.`}</Body>
              {/* Beside the code rather than in the small print, because this
                  is the moment it matters. */}
              <Callout variant="caveat">
                Whoever opens it first is the person who gets it. Do not
                photograph it, and do not send it on.
              </Callout>
              <div className="gap-opsin-3 flex flex-col @lg/main:flex-row">
                <Button
                  variant="primary"
                  onClick={() => {
                    focusNext.current = "form"
                    setIssuedId(null)
                  }}
                >
                  Done
                </Button>
                <Button
                  variant="secondary"
                  icon={<Eye />}
                  onClick={() => onOpenAsDoctor(issued.id)}
                >
                  See what the doctor sees
                </Button>
              </div>
              <Quiet>
                Seeing what the doctor sees is part of this demonstration. It
                opens the share once, the way the doctor would, so it uses the
                share up.
              </Quiet>
            </div>
          </Card>
        )}

        <div className="gap-opsin-6 flex flex-col">
          <Section title="Shares you have made">
            {shares.length === 0 ? (
              <EmptyState
                reason="nothing-yet"
                title="You have not shared anything"
                titleLevel={3}
              />
            ) : (
              <ul className="gap-opsin-3 m-0 flex list-none flex-col p-0">
                {shares.map((share) => {
                  const live = shareIsLive(share)
                  const target =
                    share.scope === "visit"
                      ? VISITS.find((visit) => visit.id === share.target)
                      : undefined
                  const document =
                    share.scope === "document"
                      ? DOCUMENTS.find(
                          (candidate) => candidate.id === share.target
                        )
                      : undefined
                  return (
                    <li key={share.id}>
                      <Card density="compact">
                        <div className="gap-opsin-2 flex flex-col">
                          <h3 className="text-opsin-headline m-0 [color:var(--foreground)]">
                            {SCOPE_NAME[share.scope]}
                          </h3>
                          <Marker>{shareWord(share)}</Marker>
                          {target === undefined ? null : (
                            <Quiet>{visitChoice(target)}</Quiet>
                          )}
                          {document === undefined ? null : (
                            <Quiet>{documentChoice(document)}</Quiet>
                          )}
                          <Quiet>
                            {live
                              ? `Stops working at ${atTime(share.notAfter)}`
                              : `Made on ${onDay(share.madeAt)}`}
                          </Quiet>
                          <GatedAction
                            label="Cancel this share"
                            variant="destructive"
                            reason={
                              live
                                ? undefined
                                : "This share is finished. It can never work again, so there is nothing left to cancel."
                            }
                            onAct={() => {
                              setShares((current) =>
                                current.map((candidate) =>
                                  candidate.id === share.id
                                    ? { ...candidate, state: "revoked" }
                                    : candidate
                                )
                              )
                              const text =
                                "Cancelled. The doctor can no longer look."
                              setNotices((current) => ({
                                ...current,
                                [share.id]: text,
                              }))
                              announce(text)
                            }}
                          />
                          <Saved message={notices[share.id]} />
                        </div>
                      </Card>
                    </li>
                  )
                })}
              </ul>
            )}
          </Section>
          <Quiet>
            A share works once, stops at the time you set whether or not anyone
            used it, and you can cancel it before then. A share is never a way
            to sign in as you.
          </Quiet>
          {/* The honest counterpart to a feature people will use anyway. */}
          <Callout variant="caveat" title="A screenshot is not a share">
            A screenshot is a picture. Once it exists you cannot cancel it, it
            never expires, and it does not appear in your list of who looked.
            Use Share instead.
          </Callout>
        </div>
      </div>
    </>
  )
}

/* ====================================================================== *
 * The emergency card                                                      *
 * ====================================================================== */

/** The items a card carries, large enough to read at arm's length, one per line. */
function CardItems({ fields }: { fields: CardField[] }) {
  return (
    <dl className="m-0 flex flex-col">
      {CARD_FIELDS.filter((field) => fields.includes(field)).map((field) => (
        <div
          key={field}
          className="gap-opsin-1 py-opsin-3 flex flex-col border-t-2 border-foreground"
        >
          <dt className="text-opsin-footnote m-0 font-semibold tracking-wide [color:var(--muted-foreground)] uppercase">
            {CARD_LABEL[field]}
          </dt>
          <dd
            className={`m-0 [color:var(--foreground)] ${field === "blood" ? "text-opsin-large-title" : "text-opsin-title2"}`}
          >
            <Lines values={CARD_VALUE[field]} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * The one screen designed to be read by somebody who is not the patient: a
 * paramedic, a nurse at a hospital that has never treated them, a stranger at a
 * roadside. It has no navigation, because the phone is handed over on this
 * screen and every way to somewhere else is an invitation to browse the rest of
 * the record. In the product, the phone's own back gesture is the way out. A
 * demonstration in a frame has no back gesture, so it ends with one quiet
 * control instead.
 */
function CardScreen({
  fields,
  setFields,
  onClose,
  announce,
}: {
  fields: CardField[]
  setFields: (change: (current: CardField[]) => CardField[]) => void
  onClose: () => void
  announce: (text: string) => void
}) {
  const [notice, setNotice] = useState<string | undefined>(undefined)
  return (
    <>
      <div className="gap-opsin-8 grid grid-cols-1 @3xl/main:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @3xl/main:items-start">
        <section
          aria-label="Your emergency card"
          className="gap-opsin-4 flex flex-col"
        >
          <Card rung="raised">
            <div className="gap-opsin-4 flex flex-col">
              <p className="text-opsin-large-title m-0 [color:var(--foreground)]">
                {PATIENT.name}
              </p>
              {fields.length === 0 ? (
                <EmptyState
                  reason="nothing-yet"
                  title="Nothing is on your card"
                  titleLevel={2}
                >
                  Choose what you want it to show.
                </EmptyState>
              ) : (
                <CardItems fields={fields} />
              )}
            </div>
          </Card>
          <Callout variant="note">
            Hold the phone so they can read it. Stay with your phone.
          </Callout>
        </section>

        <Section title="Choose what appears">
          <Quiet>
            Nothing appears on your card unless you put it there. Anyone holding
            your unlocked phone can read it, so put on what would help you and
            nothing more.
          </Quiet>
          <Card>
            <div className="gap-opsin-4 flex flex-col">
              {CARD_FIELDS.map((field) => (
                <Switch
                  key={field}
                  label={CARD_LABEL[field]}
                  checked={fields.includes(field)}
                  onCheckedChange={(on) => {
                    setFields((current) =>
                      CARD_FIELDS.filter((candidate) =>
                        candidate === field ? on : current.includes(candidate)
                      )
                    )
                    const text = `Saved. Your card ${on ? "now shows" : "no longer shows"} ${CARD_LABEL[field].toLowerCase()}.`
                    setNotice(text)
                    announce(text)
                  }}
                />
              ))}
            </div>
          </Card>
          <Saved message={notice} />
          <Quiet>
            In the app, a copy is kept on your phone so the card still shows
            with no internet, and signing out erases it. This demonstration
            keeps nothing.
          </Quiet>
        </Section>
      </div>

      <div className="gap-opsin-3 flex flex-col items-start">
        <Quiet>
          There is no menu on this screen, so whoever holds your phone cannot
          browse the rest of your record.
        </Quiet>
        <Button variant="secondary" icon={<ArrowLeft />} onClick={onClose}>
          Close the card
        </Button>
      </div>
    </>
  )
}

/* ====================================================================== *
 * First run                                                               *
 * ====================================================================== */

/**
 * The first-run orientation, after a claim. It asks for nothing and sets
 * nothing up, because the record is already full. A doctor filled it in
 * before the patient ever signed in, and a wizard that demands input before showing
 * it is how patient records lose their readers. Skipping leaves nothing
 * unfinished, because there is nothing to finish, so both buttons go to the
 * same place.
 */
function WelcomeScreen({
  onGo,
  sites,
  findable,
}: {
  onGo: (next: ScreenKey) => void
  sites: SiteAccess[]
  findable: boolean
}) {
  return (
    <>
      <Body>
        This is your side of the same record your doctors write in. There is
        nothing for you to fill in, because it is already there.
      </Body>
      <Section title="Who can see it today">
        {postureSentences(sites, findable).map((sentence) => (
          <Body key={sentence}>{sentence}</Body>
        ))}
      </Section>
      <Callout variant="note">
        You can change this at any time from the Access screen.
      </Callout>
      <div className="gap-opsin-3 flex flex-col @md/main:flex-row">
        <Button variant="primary" onClick={() => onGo("home")}>
          Go to my record
        </Button>
        <Button variant="secondary" onClick={() => onGo("home")}>
          Skip
        </Button>
      </div>
    </>
  )
}

/**
 * "Is this you?", the screen a hospital's invite opens. Accepting ties one
 * account to one lifetime of medical history, so nothing medical is shown
 * before the claim completes: a name, an age band, a sex and a record ID, and
 * nothing else. Declining is final, so it asks once more before it happens.
 */
function ClaimScreen({
  declined,
  onAccept,
  onDecline,
  onLeave,
}: {
  declined: boolean
  onAccept: () => void
  onDecline: () => void
  onLeave: () => void
}) {
  const [confirming, setConfirming] = useState(false)

  if (declined) {
    return (
      <>
        <Body>
          It cannot be used again. If that was a mistake, ask the hospital that
          sent it for a new invite.
        </Body>
        <div>
          <Button variant="primary" onClick={onLeave}>
            Back to the demonstration
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="gap-opsin-2 flex flex-col">
        <Body>
          A hospital has a health record for this person and wants to give it to
          you.
        </Body>
        <Quiet>{`The invite came from ${HOSPITAL_NAME.city}.`}</Quiet>
      </div>
      <Card>
        <div className="gap-opsin-4 flex flex-col">
          <Avatar name={PATIENT.name} size="lg" />
          <Facts
            rows={[
              ["Name", PATIENT.name],
              ["Age", PATIENT.age],
              ["Sex", PATIENT.sex],
              ["Record ID", PATIENT.recordId],
            ]}
          />
        </div>
      </Card>
      <Callout variant="note">
        No health information is shown until you confirm this is you.
      </Callout>
      <div className="gap-opsin-3 flex flex-col">
        <Button variant="primary" fullWidth onClick={onAccept}>
          Yes, this is me
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => setConfirming(true)}
        >
          No, this is not me
        </Button>
      </div>
      <Quiet>
        Not sure? Do not answer. Ask the hospital that gave you this invite.
        Declining cannot be undone.
      </Quiet>
      <Quiet>
        Keep this invite private. Anyone who opens it sees your name, age, sex
        and record ID.
      </Quiet>

      <Dialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Decline this invite?"
        description="Declining cannot be undone, and the invite can never be used again. If you are not sure, go back and ask the hospital that gave you the invite."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirming(false)
                onDecline()
              }}
            >
              Decline the invite
            </Button>
            <Button variant="primary" onClick={() => setConfirming(false)}>
              Go back
            </Button>
          </>
        }
      />
    </>
  )
}

/* ====================================================================== *
 * The page a doctor reads                                                 *
 * ====================================================================== */

/** One visit as the doctor reads it: what was found, given and done, in the hospital's words. */
function SharedVisit({ visit }: { visit: Visit }) {
  const discharge = DISCHARGES.find((candidate) => candidate.visit === visit.id)
  const rows: FactRow[] = [
    [
      "Conditions recorded",
      <Lines
        key="conditions"
        values={CONDITIONS.filter((c) => c.visit === visit.id).map(
          (c) => c.words
        )}
      />,
    ],
    [
      "Medicines",
      <Lines
        key="medicines"
        values={ORDERS.filter(
          (order) => order.visit === visit.id && order.medicine
        ).map((order) => order.words)}
      />,
    ],
    [
      "Results",
      <Lines
        key="results"
        values={ORDERS.filter(
          (order) => order.visit === visit.id && !order.medicine
        ).map((order) =>
          order.result === undefined
            ? order.words
            : `${order.words}: ${order.result}`
        )}
      />,
    ],
    ...(discharge === undefined
      ? []
      : ([
          ["Discharge summary", `${discharge.outcome}. ${discharge.ending}.`],
        ] as FactRow[])),
  ]
  return (
    <Card>
      <div className="gap-opsin-3 flex flex-col">
        <div className="gap-x-opsin-3 gap-y-opsin-1 flex flex-wrap items-baseline justify-between">
          <HospitalName id={visit.hospital} />
          <Quiet>
            {visit.endedAt === undefined ||
            onDay(visit.endedAt) === onDay(visit.startedAt)
              ? onDay(visit.startedAt)
              : `${onDay(visit.startedAt)} to ${onDay(visit.endedAt)}`}
          </Quiet>
        </div>
        <h3 className="text-opsin-headline m-0 [color:var(--foreground)]">
          {visit.kind}
        </h3>
        <Facts rows={rows} />
      </div>
    </Card>
  )
}

/** Whichever slice the share carried, and nothing else. */
function SharedBody({
  share,
  cardFields,
}: {
  share: Share
  cardFields: CardField[]
}) {
  if (share.scope === "card") {
    return (
      <Section title="Emergency card">
        <Card>
          {cardFields.length === 0 ? (
            <Body>Nothing is on this card.</Body>
          ) : (
            <CardItems fields={cardFields} />
          )}
        </Card>
      </Section>
    )
  }
  if (share.scope === "visit") {
    const visit =
      VISITS.find((candidate) => candidate.id === share.target) ?? VISITS[0]
    return (
      <Section title="Visit summary">
        <SharedVisit visit={visit} />
      </Section>
    )
  }
  if (share.scope === "full") {
    return (
      <Section title="Full record">
        <Card>
          <Facts
            rows={[
              [
                "Long-term conditions",
                <Lines key="long-term" values={CARD_VALUE.longTerm} />,
              ],
              [
                "Allergies",
                <Lines key="allergies" values={CARD_VALUE.allergies} />,
              ],
            ]}
          />
        </Card>
        <ul className="gap-opsin-3 m-0 flex list-none flex-col p-0">
          {VISITS.map((visit) => (
            <li key={visit.id}>
              <SharedVisit visit={visit} />
            </li>
          ))}
        </ul>
      </Section>
    )
  }
  const document =
    DOCUMENTS.find((candidate) => candidate.id === share.target) ?? DOCUMENTS[0]
  return (
    <Section title="Document">
      <Card>
        <div className="gap-opsin-3 flex flex-col">
          <div className="gap-x-opsin-3 gap-y-opsin-1 flex flex-wrap items-baseline">
            <HospitalName id={document.hospital} />
            <Quiet>{onDay(document.filedOn)}</Quiet>
          </div>
          <p className="text-opsin-headline m-0 [color:var(--foreground)]">
            {document.words}
          </p>
          <GatedAction
            label="Open the document"
            reason="This demonstration holds no documents, so there is nothing to open."
          />
        </div>
      </Card>
    </Section>
  )
}

/**
 * The page a doctor at a hospital that does not use the system reads when a
 * patient hands them a share. It asks for nothing and offers no way into the
 * system. It displays what was handed over and grants no access. Opening it
 * uses the share up, so a second opening, a spent share and an expired one all
 * get the same answer, which gives away nothing about what exists.
 */
function SharedScreen({
  share,
  gone,
  cardFields,
  onBack,
  onOpenAgain,
}: {
  share: Share | undefined
  gone: boolean
  cardFields: CardField[]
  onBack: () => void
  onOpenAgain: () => void
}) {
  const readable = share !== undefined && !gone
  return (
    <>
      {/* Part of the demonstration, not of the page. The patient never sees
          what the doctor sees, so this says where the page came from. */}
      <Callout variant="note" title="What the doctor sees">
        This is the page a doctor reads when they open your share. In the app,
        you never see it. Here it opens once, the way it would for them.
      </Callout>
      <div className="gap-opsin-3 flex flex-col @md/main:flex-row">
        <Button variant="secondary" icon={<ArrowLeft />} onClick={onBack}>
          Back to your portal
        </Button>
        {readable ? (
          <Button variant="quiet" onClick={onOpenAgain}>
            Open the same link again
          </Button>
        ) : null}
      </div>

      {readable ? (
        <>
          <Body>
            A patient has shared part of their health record with you. It opens
            once, then stops working.
          </Body>
          <Card>
            <div className="gap-opsin-4 flex flex-col">
              <div className="gap-opsin-3 flex flex-wrap items-center">
                <Avatar name={PATIENT.name} size="lg" />
                <p className="text-opsin-title3 m-0 min-w-0 [color:var(--foreground)]">
                  {PATIENT.name}
                </p>
              </div>
              <Facts
                rows={[
                  ["Record ID", PATIENT.recordId],
                  ["Age", PATIENT.age],
                  ["Sex", PATIENT.sex],
                ]}
              />
            </div>
          </Card>
          <SharedBody share={share} cardFields={cardFields} />
          <Quiet>{`Stops working at ${atTime(share.notAfter)}.`}</Quiet>
        </>
      ) : (
        <EmptyState
          reason="nothing-left"
          title="This link is no longer active"
          titleLevel={2}
        >
          A shared link opens once and then expires. Ask the patient to share a
          new one.
        </EmptyState>
      )}
    </>
  )
}

/* ====================================================================== *
 * The app                                                                 *
 * ====================================================================== */

/**
 * The zero-prop default export (ADR 0009). `/view` renders it with no props
 * and `/showcase/patient-record-portal` frames it, so it is reviewed code rather
 * than a scratch demo.
 */
export default function PatientRecordPortal() {
  const [screen, setScreen] = useState<ScreenKey>("home")
  /* Counts every move, so a move to the screen already showing still returns
     somebody to its top. */
  const [moves, setMoves] = useState(0)
  const [sites, setSites] = useState<SiteAccess[]>(OPENING_ACCESS)
  const [findable, setFindable] = useState(true)
  const [circle, setCircle] = useState<CircleEntry[]>(OPENING_CIRCLE)
  const [invitations, setInvitations] =
    useState<Invitation[]>(OPENING_INVITATIONS)
  const [shares, setShares] = useState<Share[]>(OPENING_SHARES)
  const [cardFields, setCardFields] = useState<CardField[]>(OPENING_CARD)
  const [claimDeclined, setClaimDeclined] = useState(false)
  const [opened, setOpened] = useState<{ id: string; gone: boolean } | null>(
    null
  )
  const [aboutOpen, setAboutOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [spoken, setSpoken] = useState({ text: "", count: 0 })
  const titleId = useId()

  function go(next: ScreenKey) {
    setMenuOpen(false)
    setAboutOpen(false)
    setScreen(next)
    setMoves((count) => count + 1)
  }

  /** Say a change out loud, once, for somebody who cannot see where it was confirmed. */
  function announce(text: string) {
    setSpoken((current) => ({ text, count: current.count + 1 }))
  }

  /* After a move, back to the top and onto the new screen's heading, so a
     keyboard or screen-reader user starts on the screen they asked for rather
     than at the foot of the one they left. */
  useEffect(() => {
    if (moves === 0) return
    window.scrollTo({ top: 0 })
    document.getElementById(titleId)?.focus({ preventScroll: true })
  }, [moves, titleId])

  /** Open a share the way the doctor would, which uses it up. */
  function openAsDoctor(id: string) {
    const share = shares.find((candidate) => candidate.id === id)
    const usable = share !== undefined && shareIsLive(share)
    setOpened({ id, gone: !usable })
    if (usable)
      setShares((current) =>
        current.map((candidate) =>
          candidate.id === id ? { ...candidate, state: "consumed" } : candidate
        )
      )
    go("shared")
  }

  const bare = BARE.includes(screen)
  const current = BELONGS_TO[screen]
  const title =
    screen === "claim" && claimDeclined
      ? "This invite has been declined"
      : TITLE[screen]
  const back =
    screen === "invites"
      ? { label: "Back to Family", to: "family" as const }
      : screen === "share"
        ? { label: "Back to Home", to: "home" as const }
        : undefined
  const waiting = invitations.length

  let body: ReactNode = null
  switch (screen) {
    case "home":
      body = <HomeScreen onGo={go} sites={sites} findable={findable} />
      break
    case "record":
      body = <RecordScreen />
      break
    case "access":
      body = (
        <AccessScreen
          sites={sites}
          setSites={setSites}
          findable={findable}
          setFindable={setFindable}
          onGo={go}
          announce={announce}
        />
      )
      break
    case "log":
      body = <LogScreen sites={sites} setSites={setSites} announce={announce} />
      break
    case "family":
      body = (
        <FamilyScreen
          circle={circle}
          setCircle={setCircle}
          waiting={waiting}
          onGo={go}
          announce={announce}
        />
      )
      break
    case "invites":
      body = (
        <InvitesScreen
          invitations={invitations}
          setInvitations={setInvitations}
          announce={announce}
        />
      )
      break
    case "share":
      body = (
        <ShareScreen
          shares={shares}
          setShares={setShares}
          onOpenAsDoctor={openAsDoctor}
          announce={announce}
        />
      )
      break
    case "card":
      body = (
        <CardScreen
          fields={cardFields}
          setFields={setCardFields}
          onClose={() => go("home")}
          announce={announce}
        />
      )
      break
    case "welcome":
      body = <WelcomeScreen onGo={go} sites={sites} findable={findable} />
      break
    case "claim":
      body = (
        <ClaimScreen
          declined={claimDeclined}
          onAccept={() => go("welcome")}
          onDecline={() => {
            setClaimDeclined(true)
            announce("This invite has been declined.")
          }}
          onLeave={() => {
            setClaimDeclined(false)
            go("home")
          }}
        />
      )
      break
    case "shared":
      body = (
        <SharedScreen
          share={shares.find((share) => share.id === opened?.id)}
          gone={opened?.gone ?? true}
          cardFields={cardFields}
          onBack={() => go("share")}
          onOpenAgain={() => {
            if (opened !== null) openAsDoctor(opened.id)
          }}
        />
      )
      break
  }

  return (
    <TermGlossaryProvider glossary={GLOSSARY}>
      <Surface rung="canvas" className="min-h-dvh w-full">
        <div className="@container/app flex min-h-dvh w-full">
          {/* The wide shell's sidebar: the record's owner, the marker that
              says this is a demonstration, the five destinations and the two
              actions. It is drawn from 56rem, and nowhere on a bare screen. */}
          {bare ? null : (
            <div className="gap-opsin-6 px-opsin-3 py-opsin-6 sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-card @4xl/app:flex">
              <div className="gap-opsin-1 px-opsin-3 flex flex-col">
                <p className="text-opsin-headline m-0 [color:var(--foreground)]">
                  Your health record
                </p>
                <Quiet>{PATIENT.name}</Quiet>
                <Quiet>{`Record ID ${PATIENT.recordId}`}</Quiet>
                <div className="mt-opsin-2">
                  <DemonstrationBadge />
                </div>
              </div>
              <DestinationList current={current} onGo={go} />
              <HandOverActions onGo={go} />
              <div className="mt-auto">
                <Button
                  variant="quiet"
                  fullWidth
                  icon={<Info />}
                  onClick={() => setAboutOpen(true)}
                  className={NAV_ITEM}
                >
                  About this demonstration
                </Button>
              </div>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            {/* The header sits outside the content column's container on
                purpose. Every query in it is about the shell, so it asks the
                app container directly. Chromium did not re-evaluate a query on
                the app container from inside the nested content container when
                the window narrowed and widened again, which left the menu
                button showing beside a tab bar that had come back. */}
            <header
              className={`gap-opsin-2 px-opsin-4 pt-opsin-5 @4xl/app:px-opsin-8 @4xl/app:pt-opsin-8 mx-auto flex w-full flex-col items-start ${COLUMN[screen]}`}
            >
              {back === undefined ? null : (
                <Button
                  variant="quiet"
                  size="sm"
                  icon={<ChevronLeft />}
                  onClick={() => go(back.to)}
                  className="-ml-opsin-3"
                >
                  {back.label}
                </Button>
              )}
              {/* On a bare screen the marker sits on the left, under no
                  sidebar and clear of the showcase bar in the top right. */}
              {bare ? <DemonstrationBadge /> : null}
              <div className="gap-x-opsin-3 gap-y-opsin-2 flex w-full flex-wrap items-center justify-between">
                <div className="gap-opsin-1 flex min-w-0 flex-col">
                  <h1
                    id={titleId}
                    tabIndex={-1}
                    className="text-opsin-title2 @4xl/app:text-opsin-title1 m-0 [color:var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  >
                    {title}
                  </h1>
                  {screen === "home" ? (
                    <Quiet>{`${PATIENT.name}, record ID ${PATIENT.recordId}`}</Quiet>
                  ) : null}
                </div>
                {/* The phone and tablet shells carry the marker and the about
                    control here. Below 19rem the menu joins them, holding the
                    destinations the bar can no longer fit. It wraps under the
                    title rather than refusing to shrink, because a cluster
                    that will not shrink pushes the page sideways at 200% text. */}
                {bare ? null : (
                  <div className="gap-opsin-2 flex flex-wrap items-center @4xl/app:hidden">
                    <DemonstrationBadge />
                    <IconButton
                      icon={<Info />}
                      label="About this demonstration"
                      variant="quiet"
                      onClick={() => setAboutOpen(true)}
                    />
                    <IconButton
                      icon={<MenuGlyph />}
                      label="Open the menu"
                      variant="secondary"
                      onClick={() => setMenuOpen(true)}
                      className="@min-[19rem]/app:hidden"
                    />
                  </div>
                )}
              </div>
            </header>

            <div
              className={`gap-opsin-6 px-opsin-4 pt-opsin-6 pb-opsin-8 @4xl/app:gap-opsin-8 @4xl/app:px-opsin-8 @4xl/app:pt-opsin-8 @container/main mx-auto flex w-full flex-1 flex-col ${COLUMN[screen]}`}
            >
              {body}
            </div>

            <div
              className={`px-opsin-4 pb-opsin-6 @4xl/app:px-opsin-8 mx-auto w-full ${COLUMN[screen]}`}
            >
              <DisclaimerNote
                placement="footer"
                textVersion="Demonstration wording, version one"
              >
                This is a demonstration of interface components, not a real
                patient portal, and the person, the hospitals and the record in
                it are invented. A portal like this shows what doctors wrote and
                explains none of it. Nothing in it is medical advice.
              </DisclaimerNote>
            </div>

            {/* One polite region for every confirmation on every screen, kept
                on the page so a change is announced as it lands. */}
            <div role="status" aria-live="polite">
              {spoken.text === "" ? null : (
                <VisuallyHidden key={spoken.count}>
                  {spoken.text}
                </VisuallyHidden>
              )}
            </div>

            {/* The phone and tablet shells' navigation, from 19rem to 56rem. */}
            {bare ? null : (
              <div className="sticky bottom-0 z-10 hidden @min-[19rem]/app:block @4xl/app:hidden">
                <TabBar
                  label="Main sections"
                  value={current}
                  onValueChange={(key) => {
                    const destination = DESTINATIONS.find(
                      (candidate) => candidate.key === key
                    )
                    if (destination !== undefined) go(destination.key)
                  }}
                  items={DESTINATIONS.map((destination) => ({
                    key: destination.key,
                    label: destination.barLabel,
                    icon: destination.icon,
                  }))}
                />
              </div>
            )}
          </div>
        </div>
      </Surface>

      {/* The narrowest shell's navigation: the five destinations, the two
          actions and the about control, in a sheet the menu button opens. */}
      <Sheet
        open={menuOpen}
        onOpenChange={(next) => setMenuOpen(next)}
        title="Menu"
      >
        <Sheet.Content>
          <div className="gap-opsin-5 flex flex-col">
            <DestinationList current={current} onGo={go} />
            <Divider />
            <HandOverActions onGo={go} />
            <Divider />
            <Button
              variant="quiet"
              fullWidth
              icon={<Info />}
              onClick={() => {
                setMenuOpen(false)
                setAboutOpen(true)
              }}
              className={NAV_ITEM}
            >
              About this demonstration
            </Button>
          </div>
        </Sheet.Content>
      </Sheet>

      <Sheet
        open={aboutOpen}
        onOpenChange={(next) => setAboutOpen(next)}
        title="About this demonstration"
      >
        <Sheet.Content>
          <Sheet.Description className="text-opsin-body">
            A patient&apos;s view of their own record. It is not advice.
          </Sheet.Description>
          <div className="mt-opsin-4 gap-opsin-4 flex flex-col">
            <Body>
              This is a demonstration of user interface components inside a
              design system&apos;s documentation. It is not a real portal. The
              person, the record ID, the hospitals and everything in the record
              are invented.
            </Body>
            <Body>
              A portal like this shows what doctors wrote, in their own words.
              It explains nothing, scores nothing and ranks nothing, and nothing
              medical can be changed from it.
            </Body>
            <Body>
              Nothing you do here is stored. Every change stays in this browser
              tab and is gone when you reload the page.
            </Body>
            <Divider />
            <h3 className="text-opsin-headline m-0 [color:var(--foreground)]">
              Screens a patient reaches from outside
            </h3>
            <Body>
              A hospital&apos;s invite opens a screen that asks whether the
              record is yours, and claiming it opens a short welcome. A doctor
              reads a share on a page of its own, which opens from a share you
              make on the Share screen.
            </Body>
            <div>
              <Button variant="secondary" onClick={() => go("claim")}>
                Open the hospital&apos;s invite
              </Button>
            </div>
            <Divider />
            <Quiet>
              Built by the opsinjs team as a documentation specimen. Report
              anything wrong with it on the opsinjs issue tracker. Demonstration
              wording, version one, last changed 13 October 2026.
            </Quiet>
            <Link
              href="https://github.com/prashantonomy/opsinjs/issues"
              emphasis="secondary"
            >
              The opsinjs issue tracker
            </Link>
          </div>
        </Sheet.Content>
      </Sheet>
    </TermGlossaryProvider>
  )
}
