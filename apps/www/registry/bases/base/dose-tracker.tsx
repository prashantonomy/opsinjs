/**
 * DoseTracker is a record of medicine doses, taken and missed, that the product
 * has already logged. It draws that log and nothing else.
 *
 * IT IS A LOG, NOT AN INSTRUMENT, AND THAT DISTINCTION IS THE WHOLE COMPONENT.
 * The roster declined a dose tracker for a long time, and the reason is written
 * into every line below: dose data drives dosing decisions, so a component that
 * displays a missed dose is one product decision away from implying what to do
 * about it, and telling a person what to do about a missed medicine is
 * prescribing. So this component never says what to do about a missed dose, it
 * never computes an adherence figure, it never advises, and it ships no schedule
 * and no drug data of its own. It renders the entries the product hands it, in
 * the order it is handed them, and it reaches no verdict about any of them. What
 * a reader does next is the product's to decide and the product's to state, in a
 * component built for that, never here.
 *
 * THE STATE MARKER IS A FACTUAL LOG STATE, NOT THE CLINICAL STATUS AXIS. This is
 * the subtle mistake the component is built to refuse. Taken, missed, skipped and
 * scheduled are facts about a log entry: this dose was taken, that one was not.
 * They are not levels of urgency, and a missed dose is not therefore an urgent
 * one, because whether a missed medicine matters is a clinical judgement the
 * product owns and this presentation layer cannot make. So no marker carries
 * `data-status`, no marker is tinted from the status axis, and a missed dose is
 * never painted the red that means "act now". A red that means "you missed a
 * dose" and a red that means "this reading needs attention" cannot share a
 * screen without one being read as the other. Every marker draws only neutral
 * chrome, and it tells its state twice, in a word and in a distinct lucide shape,
 * so the four states stay four states in greyscale and for a reader who cannot
 * use colour. That is the same discipline the status axis keeps, applied to an
 * axis that is not the status one and must never be mistaken for it.
 *
 * IT CARRIES NEITHER COLOUR AXIS. It states no clinical level and names no
 * category, so it takes neither `data-status` nor `data-category` and draws only
 * the neutral chrome roles. Colour that arrives through `className` is the
 * caller's to keep off both axes, and the two-colour-axes rule applies to it in
 * full.
 *
 * IT IS A SERVER COMPONENT, BECAUSE A LOG HAS NO BEHAVIOUR TO HYDRATE. It renders
 * a static list. It takes no focus, captures no key, and animates nothing, so
 * making it a client component would ship JavaScript for a piece of read-only
 * content. The one composed part, RelativeTime, is itself a server component, so
 * the whole tree renders on the server and hydrates nothing.
 *
 * THE INSTANT GOES STRAIGHT THROUGH TO RelativeTime, WHICH OWNS EVERY TIME IN
 * THIS SYSTEM. Each entry's `time` is forwarded to RelativeTime unmodified, and
 * so is `now`. That is why `now` is a required prop rather than a clock this
 * component reads: reading the clock in a render body is impure, it would read
 * the clock once per entry rather than once per screen, and a list of doses could
 * then straddle a minute boundary halfway down. The caller reads the clock once
 * where the screen is rendered and passes the same instant to every timestamp on
 * it. RelativeTime owns what a future instant, a malformed one or a stale one
 * renders as; this component only hands it the string.
 *
 * SYNTHETIC DATA ONLY IN THE DEMO AND EXAMPLES (ADR 0012). The medicine names are
 * plain placeholders such as "Morning tablet", never a real drug or a real dose,
 * and the times are fixed synthetic instants. A screenshot of an opsinjs example
 * must never be mistakable for somebody's own medication record.
 */

import { Check, Clock, Minus, X } from "lucide-react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { RelativeTime } from "@/registry/base-lyra/ui/relative-time"

/**
 * The four states a logged dose can be in. Kept as a local type rather than a
 * fourth public export, for the reason `badge.tsx` gives about its own weight
 * union: the registry contract fixes this file at three public exports, so a
 * consumer names this shape as `DoseTrackerProps["entries"][number]["state"]`
 * rather than importing a fourth symbol.
 *
 * These are facts about a log entry, never levels of urgency. `taken` and
 * `missed` record what happened; `skipped` records a dose deliberately not taken,
 * which is a different fact from one that was simply not taken; `scheduled`
 * records a dose the product has planned but not yet marked either way. None of
 * the four is on the clinical status axis, and none of them says what to do next.
 */
type DoseState = "taken" | "missed" | "skipped" | "scheduled"

/** One logged dose. Kept local for the same reason as `DoseState` above. */
interface DoseEntry {
  /**
   * The medicine's name, in the product's own words. A generic placeholder in
   * every opsinjs example, never a real drug name and never a dose, because this
   * layer ships no drug data.
   */
  name: string
  /**
   * When this dose event sits, as an ISO 8601 string with an offset, exactly the
   * form RelativeTime accepts. It is forwarded to RelativeTime unmodified, so
   * whatever the instant means for a given entry, a taken time or a scheduled
   * one, is the product's to decide.
   */
  time: string
  /**
   * Which of the four states this dose is in. A value outside the four renders no
   * marker and warns in development rather than being approximated into one.
   */
  state: DoseState
  /**
   * An optional short line the product may attach to an entry, such as "with
   * food". It is content the product owns, and it is drawn as a plain muted line
   * beneath the name. It is never advice this component generates.
   */
  note?: string
}

/**
 * The marker per state: the word a reader reads and the lucide shape that word is
 * redundant to, so the state survives greyscale. Written out as a table rather
 * than computed, because Tailwind reads class names as literal strings and a
 * `Record<DoseState, ...>` also makes adding a state without its marker a compile
 * error rather than a blank chip. Every word is a plain log fact and none is on
 * the clinical status vocabulary: this table is neutral chrome, not a status one.
 */
const MARKERS: Record<DoseState, { word: string; icon: typeof Check }> = {
  taken: { word: "Taken", icon: Check },
  missed: { word: "Missed", icon: X },
  skipped: { word: "Skipped", icon: Minus },
  scheduled: { word: "Scheduled", icon: Clock },
}

/**
 * The list of the four, as the object's own keys, so the runtime guard reads real
 * members and cannot be answered "yes" by a prototype member the way `in` would
 * be. This file ships as source into JavaScript projects, where `state` is
 * whatever the caller passed.
 */
const DOSE_STATES = Object.keys(MARKERS) as DoseState[]

function isDoseState(value: unknown): value is DoseState {
  return typeof value === "string" && (DOSE_STATES as string[]).includes(value)
}

/**
 * The root list, spelled once. A plain unstyled list so the entries carry the
 * structure and a screen reader announces a list of the right length. No colour
 * of its own from either axis.
 */
const ROOT = "m-0 flex w-full list-none flex-col gap-opsin-1 p-0"

/**
 * One entry row, spelled once. A hairline rule separates the entries, dropped on
 * the last one so the list does not close with a floating line. The name and its
 * marker sit together on the leading edge and the time sits on the trailing edge,
 * wrapping beneath at a narrow width rather than overflowing.
 */
const ENTRY =
  "flex flex-wrap items-baseline justify-between gap-opsin-2 " +
  "border-b border-border py-opsin-2 last:border-b-0"

/**
 * The state marker, spelled once. Neutral chrome only: a muted hairline chip with
 * the muted ink, the word and the shape. It carries no status colour and no
 * `data-status`, because a log state is not a level of urgency. The icon is sized
 * to the text with `size-[1em]` so it grows with the reader's type size, and it
 * is `shrink-0` so it never collapses beside a wrapping word.
 */
const MARKER =
  "inline-flex shrink-0 items-center gap-opsin-1 rounded-full " +
  "border border-border px-opsin-2 py-opsin-0-5 " +
  "text-opsin-caption1 font-medium whitespace-nowrap leading-none " +
  "[color:var(--muted-foreground)]"

/**
 * Development warnings for uncoded mistakes, said once per distinct offender.
 * Nothing here has an `OpsinErrorCode`: the codes in `tokens/errors.json`
 * describe mistakes a consumer makes with the clinical API, and a dose log
 * asserts nothing clinical of its own. `divider.tsx` and `badge.tsx` keep the
 * same small set for the same reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface DoseTrackerProps {
  /**
   * The doses to draw, in the order they appear. Each is a medicine name, an ISO
   * instant, one of the four states and an optional note. An empty array renders
   * nothing and warns in development, because a tracker with no entries is a log
   * of a day nobody recorded.
   */
  entries: DoseEntry[]
  /**
   * The instant every entry's time is measured against, as an ISO 8601 string
   * with an offset, in the same form as an entry's `time`. Required, and
   * forwarded straight to RelativeTime: a component that read the clock itself
   * would be impure and would make one list of doses disagree with itself across
   * a minute boundary. Read the clock once where the screen is rendered, with
   * `new Date().toISOString()`, and pass the same value here and to every other
   * timestamp on the screen.
   */
  now: string
  /**
   * An optional accessible name for the list, applied as `aria-label`, so a
   * screen-reader user hears what the list is before its entries. Name the log,
   * such as "Today's doses", rather than describing a single row. Omitted, the
   * list has no name of its own and relies on the heading or region around it to
   * say what it is.
   */
  label?: string
  /**
   * Merged onto the root list. Width, margin and place in a layout belong here.
   * It is the one route by which colour can reach the component, and the
   * two-colour-axes rule applies to it in full: a dose log takes neither a status
   * nor a category tint. A class you pass wins over the list's own where the two
   * conflict, because it is merged last.
   */
  className?: string
}

export function DoseTracker({ entries, now, label, className }: DoseTrackerProps) {
  if (isDevelopment()) {
    if (!Array.isArray(entries) || entries.length === 0) {
      warnDev(
        "no-entries",
        "[opsinjs] <DoseTracker> was rendered with no entries, so it has nothing " +
          "to draw. A dose tracker is a record of doses the product has logged; " +
          "supply them through the `entries` prop.",
      )
    } else {
      for (const entry of entries) {
        if (!isDoseState(entry?.state)) {
          warnDev(
            `unknown-state:${String(entry?.state)}`,
            `[opsinjs] <DoseTracker> received an entry with state="${String(entry?.state)}", ` +
              "which is not one of taken, missed, skipped or scheduled. That entry " +
              "was drawn with no marker. A dose log records only these four facts, " +
              "and it never invents a fifth from a value it does not recognise.",
          )
        }
      }
    }
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    return null
  }

  return (
    <ul data-slot="dose-tracker" aria-label={label} className={cn(ROOT, className)}>
      {entries.map((entry, index) => {
        const marker = isDoseState(entry.state) ? MARKERS[entry.state] : null
        const Icon = marker?.icon

        return (
          <li
            // The name and the instant are not unique on their own: a day may log
            // the same medicine at two times, and two entries may share a time.
            // The index keeps the key stable for a list the product owns the
            // order of.
            key={`${entry.name}-${entry.time}-${index}`}
            data-slot="dose-tracker-entry"
            className={ENTRY}
          >
            <div className="flex min-w-0 flex-col gap-opsin-0-5">
              <div className="flex flex-wrap items-baseline gap-opsin-2">
                <span
                  data-slot="dose-tracker-name"
                  className="text-opsin-body [color:var(--foreground)]"
                >
                  {entry.name}
                </span>
                {marker !== null && Icon !== undefined ? (
                  <span data-slot="dose-tracker-marker" className={MARKER}>
                    {/* Decorative. The word beside it carries the state, so the
                        shape is hidden from assistive technology and left to a
                        sighted reader as the greyscale-safe second carrier. */}
                    <Icon aria-hidden="true" className="size-[1em] shrink-0" />
                    <span>{marker.word}</span>
                  </span>
                ) : null}
              </div>
              {typeof entry.note === "string" && entry.note.trim() !== "" ? (
                <span className="text-opsin-footnote [color:var(--muted-foreground)]">
                  {entry.note}
                </span>
              ) : null}
            </div>
            <span
              data-slot="dose-tracker-time"
              className="text-opsin-footnote [color:var(--muted-foreground)]"
            >
              <RelativeTime at={entry.time} event="recorded" now={now} locale="en-GB" />
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * The instant the demo is measured against.
 *
 * A literal rather than a clock read, in the same spirit as every number in an
 * opsinjs example being obviously synthetic (ADR 0012) and for the reason
 * RelativeTime's own demo gives: `now` is required of every caller, and a fixed
 * instant is what makes this deterministic, so the demo says the same thing every
 * time the page is built rather than drifting its rows out of the phrases they
 * exist to show.
 */
const DEMO_NOW = "2026-03-14T11:12:00+00:00"

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows three states in one log: a
 * taken dose, a missed one and a skipped one, each with its word and its distinct
 * shape. The one thing worth seeing at a glance is that the missed dose is not
 * painted as urgent. Read the whole list in greyscale and the three states are
 * still three states, told by their words and their shapes, with no colour doing
 * the work and no verdict on any of them.
 *
 * The fourth state, `scheduled`, is not shown here on purpose. A scheduled dose
 * sits at a future instant, RelativeTime renders the exact date rather than a
 * "... ago" phrase for anything that has not happened yet, and its "Recorded"
 * prefix reads oddly over a dose still to come. It is a supported state named in
 * the anatomy and the API prose, demonstrated by no preview opsinjs ships, in the
 * same spirit as RelativeTime documenting a state its own demo does not draw.
 *
 * Every medicine name is a plain placeholder and every time is a fixed synthetic
 * instant in the past (ADR 0012): no real drug, no real dose, nothing a reader
 * could mistake for their own record.
 */
export default function DoseTrackerDemo() {
  return (
    <DoseTracker
      label="Example doses"
      now={DEMO_NOW}
      entries={[
        { name: "Morning tablet", time: "2026-03-14T08:00:00+00:00", state: "taken" },
        {
          name: "Afternoon tablet",
          time: "2026-03-14T09:30:00+00:00",
          state: "missed",
          note: "Marked by you",
        },
        { name: "Evening drops", time: "2026-03-13T21:00:00+00:00", state: "skipped" },
      ]}
    />
  )
}
