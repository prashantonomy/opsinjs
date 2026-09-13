/**
 * RelativeTime shows when something happened, in the words a person would use,
 * with the exact instant never more than one element away.
 *
 * IT SHIPS NO STALENESS DEFAULT. That is not an omission, it is the component.
 * What counts as old is a property of the measurement and of the person it
 * belongs to, and a window that is right for one measurement is wrong for the
 * next. So no number is written here, not even as an illustration: no fallback,
 * no per-event default, and nothing inferred from `event`. If the product has
 * not said what stale means for this measurement, this component does not know,
 * and it renders the time with no verdict attached. A verdict with no author is
 * the one thing a formatter must never manufacture, and "readings older than N
 * hours are stale" is a clinical claim wherever N comes from.
 *
 * The one default this file does hold is `absoluteAfterDays`, and it is not a
 * staleness number: it decides which WORDS are used for an instant the
 * component is equally certain about either way, and it can neither add, remove
 * nor move a verdict. The demo below and both worked examples pass no threshold
 * at all, so the muted stale treatment appears in no preview opsinjs ships.
 * That is the cost of not owning a number, and it is the right price.
 *
 * IT IS A SERVER COMPONENT, IT DOES NOT TICK, AND IT NEVER READS THE CLOCK.
 * All three follow from one decision. A relative phrase recomputed in the
 * browser produces a hydration mismatch by construction. The server's
 * "3 minutes ago" and the client's are two different sentences about one
 * instant, and the usual repairs are worse than the defect:
 * `suppressHydrationWarning` keeps the SERVER's text and discards the client's
 * more correct one, and a `setInterval` per timestamp rewrites a health surface
 * silently, in a component the specification forbids from being a live region.
 * So there is no `"use client"` here, no hook, no timer and no `typeof window`
 * branch. There is no `Date.now()` either, which is why `now` is a required
 * prop.
 *
 * That last part is not fastidiousness. `Date.now()` in a render body is an
 * impure call, this repository's lint says so on every commit, and the impurity
 * has two visible consequences: a list of twenty timestamps reads the clock
 * twenty times and can straddle a minute boundary halfway down, and a component
 * whose output depends on when React happened to call it cannot be compared
 * with itself between two renders. Taking `now` from the caller puts the one
 * impure read where it belongs, which is once per screen, in the page that is
 * already rendering at a known instant. That makes every timestamp on that
 * screen agree with every other.
 *
 * The honest consequence, stated here because it is stated on the page: a
 * surface left open for an hour still shows the phrase it was rendered with.
 * Three things stop that from being a lie rather than a limitation. The `time`
 * element's `datetime` always carries the exact instant, unrounded. The
 * absolute date and time are always in the accessibility tree, and in print,
 * whether or not they are on screen. And the phrase is rounded DOWN at every
 * rung while the staleness verdict is computed from the exact elapsed time, so
 * a stale reading is never made to look fresh by rounding. A product whose
 * surface stays open across its own staleness boundary re-renders with a fresh
 * `now`; this component will not do it behind the product's back.
 *
 * IT DERIVES NOTHING ABOUT THE READING ITSELF. It does not know what was
 * measured, it never colours from either axis, and the stale treatment is a
 * muted typographic change plus explicit words. It is never an amber tint,
 * which would put a clinical status onto a fact about the clock.
 */

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * Which event the time refers to.
 *
 * Required on every render, because "3 days ago" on its own is a fragment the
 * reader completes with whichever assumption is most convenient. The assumption
 * they reach for is the most reassuring one. The distinction between
 * `measured` and `synced` is the most consequential error in health dashboards:
 * *Synced 2 minutes ago* over a reading taken four months ago is two true
 * statements that together mislead completely.
 */
export type TimeEvent = "measured" | "recorded" | "received" | "synced" | "issued"

/**
 * The word each event is written with.
 *
 * `Record<TimeEvent, string>` on purpose: adding a member to the union without
 * writing its word is a compile error rather than a timestamp that renders with
 * no prefix. The five words are English and are not translated by `locale`.
 * `locale` governs numbers and dates, which are the parts Intl owns. That gap
 * is named on the page rather than papered over with a prop that would also let
 * a caller relabel `synced` as *updated*, which is the error above with a
 * friendlier face.
 */
const EVENT_WORDS: Record<TimeEvent, string> = {
  measured: "Measured",
  recorded: "Recorded",
  received: "Received",
  synced: "Synced",
  issued: "Issued",
}

/**
 * The words that appear past the product's own threshold.
 *
 * Deliberately hedged, and deliberately about the data rather than about the
 * person: the component knows that a reading is older than a boundary somebody
 * else set, and nothing more than that. It does not know that the reading is
 * wrong, and it must not say *out of date* as a fact.
 */
const STALENESS_WORDS = "may be out of date"

const MINUTE_MS = 60_000
const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

/**
 * When the date replaces the phrase, if the product has not chosen.
 *
 * THIS IS NOT A STALENESS DEFAULT, and the distinction is the reason the two
 * are separate props. It changes which WORDS are used for an instant the
 * component is equally certain about either way; it says nothing about whether
 * the reading can still be relied on, it never adds or removes the staleness
 * note, and moving it cannot change a verdict. A fortnight is where the
 * specification puts the boundary, because past it "437 days ago" is arithmetic
 * nobody should be asked to do. `absoluteAfterDays` moves it.
 */
const DEFAULT_ABSOLUTE_AFTER_DAYS = 14

/**
 * RFC 3339, with the offset required.
 *
 * "A timestamp with no offset is not a timestamp" is the specification's line
 * and this pattern is where it is enforced. It matters more than it reads:
 * `new Date("2026-03-14T08:12:00")` is parsed in the RUNTIME's zone, so the
 * same string is a different instant on a London laptop and a UTC server, and
 * the component would render two different ages for one reading with no
 * complaint from anything. A space in place of the `T`, a lower-case `z` and a
 * `+0100` offset are all accepted because databases emit all three; a bare date
 * and a floating local time are refused.
 */
const RFC_3339 =
  /^(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(?:([Zz])|([+-])(\d{2}):?(\d{2}))$/

/** An instant, and the offset it was written in. */
interface Instant {
  /** Milliseconds since the epoch. Unambiguous, and what elapsed time is measured on. */
  epochMs: number
  /** Minutes east of UTC, from the timestamp itself rather than from the runtime. */
  offsetMinutes: number
}

/* ------------------------------------------------------------------ *
 * The development warning channel                                     *
 * ------------------------------------------------------------------ */

/**
 * Every complaint already printed this session.
 *
 * `warnOnce()` in @/lib/opsinjs is the channel a component reaches for, and it
 * is keyed to `tokens/errors.json`, which has no code for a malformed
 * timestamp: the twenty-one codes are about colour axes, ranges, thresholds and
 * status levels. The nearest of them, OPSIN-0016, is about a reading rendered
 * with NO staleness treatment, which is the one outcome the branches below are
 * written to avoid. So it is the wrong complaint rather than an approximate
 * one. Adding OPSIN-0022 is a `tokens/errors.json` change and belongs in the
 * same commit as a generator run, which this file may not do. So this is the
 * same discipline in the same shape, bounded and development-only, and it
 * collapses back into `warnOnce()` the day the code exists.
 */
let reported: Set<string> | undefined

/**
 * Where the channel stops rather than grows.
 *
 * `warnOnce()` caps the whole system at 500 distinct keys; this is one
 * component's private channel and a narrower cap is right for it. What is
 * copied from `warnOnce()` is the part that matters: on reaching the cap it says
 * once that it has gone quiet, because a channel that falls silent without
 * saying so is read as a channel with nothing left to report.
 */
const MAX_REPORTS = 50

/** Not a real message. It only records that the cap notice has been printed. */
const CAP_NOTICE = "\u0000cap"

/**
 * Report a caller-side defect in development, once per distinct message, and do
 * nothing else. Nothing here throws: a health product must not be taken down by
 * a complaint about how it formatted a date.
 */
function report(message: string): void {
  if (!isDevelopment()) return
  if (reported === undefined) reported = new Set<string>()
  if (reported.has(message)) return

  let text = message
  if (reported.size >= MAX_REPORTS) {
    if (reported.has(CAP_NOTICE)) return
    reported.add(CAP_NOTICE)
    text =
      `has reported ${MAX_REPORTS} distinct defects in this session and is now ` +
      "quiet. Fix what is already reported, or reload to start counting again."
  } else {
    reported.add(message)
  }

  try {
    console.warn(`[opsinjs] <RelativeTime> ${text}`)
  } catch {
    /* A patched console is not a reason to take a health product down. */
  }
}

/* ------------------------------------------------------------------ *
 * Parsing and formatting                                              *
 * ------------------------------------------------------------------ */

/**
 * The timestamp as an instant plus its offset, or `null` if it is not one.
 *
 * Built from the matched fields with `Date.UTC` rather than handed to the
 * `Date` constructor, so the result cannot depend on the runtime's own zone or
 * on how forgiving its parser is. The round trip at the end is what rejects
 * 31 February: `Date.UTC` rolls an impossible date forward without complaint,
 * and a reading dated to a day that does not exist is a data defect worth
 * refusing rather than silently moving.
 */
function parseInstant(text: string): Instant | null {
  const match = RFC_3339.exec(text)
  if (match === null) return null
  /* Widened on purpose. A `RegExpExecArray` is typed as an array of strings, so
     an optional group reads as `string` and `=== undefined` is a type error on a
     value that is undefined at run time roughly half the time. */
  const fields: (string | undefined)[] = match

  const year = Number(fields[1])
  const month = Number(fields[2])
  const day = Number(fields[3])
  const hour = Number(fields[4])
  const minute = Number(fields[5])
  const second = fields[6] === undefined ? 0 : Number(fields[6])
  /* Sub-second precision is parsed so that it is not a syntax error, and then
     truncated to milliseconds, which is all `Date` can hold. Nothing this
     component renders is finer than a minute. */
  const ms = fields[7] === undefined ? 0 : Number(`${fields[7]}000`.slice(0, 3))

  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  if (hour > 23 || minute > 59 || second > 59) return null

  let offsetMinutes = 0
  if (fields[8] === undefined) {
    const offsetHours = Number(fields[10])
    const offsetRest = Number(fields[11])
    if (offsetHours > 23 || offsetRest > 59) return null
    offsetMinutes = (fields[9] === "-" ? -1 : 1) * (offsetHours * 60 + offsetRest)
  }

  const wallClock = Date.UTC(year, month - 1, day, hour, minute, second, ms)
  if (!Number.isFinite(wallClock)) return null
  const check = new Date(wallClock)
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null
  }

  return { epochMs: wallClock - offsetMinutes * MINUTE_MS, offsetMinutes }
}

/**
 * Whether a value is one of the five events.
 *
 * It exists because this file ships as source into JavaScript projects, where
 * `event` is whatever the caller passed. Without the guard the component would
 * index the word table with a string that is not in it, render a timestamp with
 * no prefix, and produce exactly the bare relative phrase the specification
 * refuses.
 */
function isTimeEvent(value: unknown): value is TimeEvent {
  return typeof value === "string" && value in EVENT_WORDS
}

/**
 * The caller's language tag, or `undefined` where it is not a language tag.
 *
 * `Intl` throws a `RangeError` on a malformed tag, and it throws it during
 * render. A component that takes a screen down because a locale arrived as
 * `"en_GB"` from a settings table has turned a cosmetic defect into an outage,
 * so the tag is checked once and the runtime's own default is used instead.
 */
function usableLocale(locale: string | undefined): string | undefined {
  if (locale === undefined) return undefined
  try {
    Intl.getCanonicalLocales(locale)
    return locale
  } catch {
    report(
      `\`locale="${locale}"\` is not a BCP 47 language tag, so the date and the ` +
        "phrase were formatted with the runtime's default instead. A tag looks " +
        'like "en-GB", with a hyphen.',
    )
    return undefined
  }
}

/**
 * The offset, written the way it is read aloud.
 *
 * Stated unconditionally, which is a deliberate departure from
 * content/numbers-dates-and-time, whose rule is to name the zone only when it
 * can differ from the reader's. Whether it differs is a fact about the reader's
 * browser, and this component does not run there. The two forms available to it
 * are to always say it, or to never say it. Only one is never wrong, and a
 * reading taken abroad rendered as if it were local is exactly the case the
 * specification's own accessibility bullet is about.
 */
function offsetLabel(offsetMinutes: number): string {
  if (offsetMinutes === 0) return "UTC"
  const sign = offsetMinutes > 0 ? "+" : "-"
  const total = Math.abs(offsetMinutes)
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  const remainder = minutes === 0 ? "" : `:${String(minutes).padStart(2, "0")}`
  return `UTC${sign}${hours}${remainder}`
}

/**
 * The exact date and time, in the zone the timestamp was written in.
 *
 * The shift-then-format-as-UTC step is what makes this deterministic. Asking
 * `Intl` for an offset time zone is not portable across every runtime a
 * consumer might ship on, and asking it for the runtime's zone would render the
 * reading in the SERVER's afternoon. Shifting the instant by its own offset and
 * formatting the result as UTC gives the wall clock the reading was taken on,
 * in every runtime, with the locale's own word order and month names intact.
 */
function absoluteForm(instant: Instant, locale: string | undefined): string {
  const shifted = new Date(instant.epochMs + instant.offsetMinutes * MINUTE_MS)
  const written = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
    /* 24-hour with a leading zero, per content/numbers-dates-and-time: it is
       unambiguous, it sorts, and it is how appointment letters and device logs
       are already written. */
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(shifted)
  return `${written} ${offsetLabel(instant.offsetMinutes)}`
}

/**
 * The human phrase, or `null` where there is no honest one to make.
 *
 * PRECISION FOLLOWS RECENCY: minutes for the last hour, hours for the last day,
 * days up to the boundary, and past it the date replaces the phrase. Announcing
 * *2 hours and 14 minutes ago* implies a precision the reader neither needs nor
 * believes.
 *
 * Two decisions worth naming. Every rung rounds DOWN, with one exception: the
 * minute floor rounds UP to 1, so a reading thirty seconds old reads "1 minute
 * ago". Rounding down means the phrase can understate an age by up to one unit,
 * which is why the staleness verdict is computed from the exact elapsed time
 * rather than from the phrase. A reading can read "13 days ago" and still carry
 * the note, and no rung can make a stale reading look fresh. The floor is the
 * one place the phrase overstates, which is the harmless direction, and it
 * exists for the reason it is a floor: the specification forbids *just now* for
 * anything the product cannot vouch for to the minute, and a component whose
 * phrase is fixed at render time can vouch for nothing finer.
 *
 * There is no *yesterday*, *this morning* or *last Tuesday* here. Those are
 * calendar facts in the reader's own time zone, and a component that does not
 * run in the reader's browser does not have one. `numeric: "always"` is what
 * keeps `Intl` from offering *yesterday* for anything between 24 and 48 hours
 * old, which would be a calendar claim made from a stopwatch.
 */
function relativePhrase(
  elapsedMs: number,
  boundaryDays: number,
  locale: string | undefined,
): string | null {
  /* A timestamp in the future is a disagreement between two clocks, not an
     event that has not happened: every one of the five events is something that
     already occurred. "In 3 hours" for a reading somebody has already taken is
     the wrong sentence, so the date is rendered on its own instead. The
     complaint is raised in the component body, where both timestamps are in
     scope and the message can name them. */
  if (elapsedMs < 0) return null
  if (elapsedMs >= boundaryDays * DAY_MS) return null

  const format = new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "long" })
  if (elapsedMs < HOUR_MS) {
    return format.format(-Math.max(1, Math.floor(elapsedMs / MINUTE_MS)), "minute")
  }
  if (elapsedMs < DAY_MS) return format.format(-Math.floor(elapsedMs / HOUR_MS), "hour")
  return format.format(-Math.floor(elapsedMs / DAY_MS), "day")
}

export interface RelativeTimeProps {
  /**
   * ISO 8601 with an offset, as in `2026-03-14T08:12:00+01:00`. A timestamp
   * with no offset is not a timestamp: it is parsed in whichever zone the code
   * happens to be running in, and it is refused rather than guessed at.
   */
  at: string
  /**
   * Which event this instant belongs to. Named, never inferred: this is the
   * difference between a fact and a guess, and it is the difference between
   * when a reading was taken and when an app last spoke to a server.
   */
  event: TimeEvent
  /**
   * The instant the phrase is measured against, in the same form as `at`.
   * Required, because a component that read the clock itself would be impure,
   * would read it once per timestamp rather than once per screen, and would
   * make a page of readings disagree with itself across a minute boundary. Read
   * it once where the screen is rendered. Use `new Date().toISOString()` and
   * pass the same value to every timestamp on it.
   */
  now: string
  /**
   * Hours after which the staleness words and their muted treatment appear.
   * Supplied by the product, because what counts as old is clinical and differs
   * completely by measurement. There is no default: omit it and there is no
   * stale treatment at all, which is the honest output when nobody has said
   * what stale means here. Supply it and the timestamp always says something.
   * Past the boundary it carries the words, and where the age could not be
   * checked at all it carries the same words rather than falling silent.
   */
  staleAfterHours?: number
  /**
   * Days after which the absolute date replaces the relative phrase. Defaults
   * to a fortnight, which is a legibility boundary and not a clinical one: past
   * it, "437 days ago" is arithmetic nobody should be asked to do. It never
   * adds, removes or moves the staleness note. `0` is a first-class value. It
   * means the phrase is never used and the date is rendered on its own at every
   * age, rather than an error to be replaced by the default.
   */
  absoluteAfterDays?: number
  /**
   * Puts the absolute date and time on screen beside the phrase. It is in the
   * accessibility tree and in print either way. This prop decides whether a
   * sighted reader sees it without asking, which on anything durable or
   * consequential they should.
   */
  showAbsolute?: boolean
  /**
   * BCP 47 language tag for the date and the phrase. It does not translate the
   * event word. Those five are English, and the gap is documented rather than
   * hidden behind a prop that would also let a caller relabel `synced`.
   */
  locale?: string
  /**
   * Merged onto the root. The merge puts it last, so a conflicting class passed
   * here wins: a type size or a colour set on the caller's side displaces the
   * component's own. The one thing it cannot displace is the muted stale
   * treatment, which is addressed at the parts rather than at the root for
   * exactly that reason. See the class list on the root below.
   */
  className?: string
}

export function RelativeTime({
  at,
  event,
  now,
  staleAfterHours,
  absoluteAfterDays,
  showAbsolute = false,
  locale,
  className,
}: RelativeTimeProps) {
  /* THE REFUSALS, AND WHY THEY ARE REFUSALS.
     This file ships as source into JavaScript projects, where a type is advice.
     Every branch below is a case where the component has no honest thing to
     draw: an instant it cannot locate, or an event it cannot name. Rendering a
     plausible-looking timestamp from either would attach a time to a reading
     that the product never asserted, which is the whole failure this component
     exists to prevent. So it renders nothing and says why. */
  const instant = parseInstant(at)
  if (instant === null) {
    report(
      `\`at="${at}"\` is not an ISO 8601 timestamp with an offset, so there is no ` +
        "instant to render and nothing was rendered. The form is " +
        '"2026-03-14T08:12:00+01:00" or "2026-03-14T07:12:00Z". A timestamp with ' +
        "no offset is read in whichever zone the code is running in, which makes " +
        "one reading two different ages on a server and on a phone.",
    )
    return null
  }

  if (!isTimeEvent(event)) {
    report(
      `\`event="${String(event)}"\` is not one of measured, recorded, received, ` +
        "synced or issued, so the time has no event to belong to and nothing was " +
        "rendered. A bare relative phrase is a fragment the reader completes with " +
        "whichever assumption suits them.",
    )
    return null
  }
  const word = EVENT_WORDS[event]

  const language = usableLocale(locale)

  /* NO REFERENCE INSTANT, NO PHRASE AND NO VERDICT. `now` is required, so a
     TypeScript caller cannot reach this branch; a JavaScript one can, and the
     degradation is the safest output available rather than an approximation.
     The exact date and time are still rendered, in view rather than only in the
     accessibility tree. A dated timestamp is never wrong, where "3 days ago"
     measured against a clock nobody named would be a guess wearing a fact's
     clothes. */
  const reference = parseInstant(now)
  if (reference === null) {
    report(
      `\`now="${String(now)}"\` is not an ISO 8601 timestamp with an offset, so ` +
        "there was nothing to measure the age against: the exact date was " +
        "rendered with no relative phrase, and a threshold supplied alongside it " +
        "renders its hedge rather than a verdict. Read the clock once where the " +
        "screen is rendered. Use " +
        "`new Date().toISOString()` and pass the same value to every timestamp " +
        "on it.",
    )
  }

  let boundaryDays = DEFAULT_ABSOLUTE_AFTER_DAYS
  if (absoluteAfterDays !== undefined) {
    if (Number.isFinite(absoluteAfterDays) && absoluteAfterDays >= 0) {
      boundaryDays = absoluteAfterDays
    } else {
      report(
        `\`absoluteAfterDays={${String(absoluteAfterDays)}}\` is not a number of ` +
          `days, so the phrase gives way to the date after ${DEFAULT_ABSOLUTE_AFTER_DAYS} ` +
          "days as it would with the prop omitted.",
      )
    }
  }

  const elapsedMs = reference === null ? null : reference.epochMs - instant.epochMs

  /* A TIMESTAMP IN THE FUTURE IS A CLOCK DISAGREEMENT, AND IT IS THE ONE
     REFUSAL HERE THAT USED TO BE SILENT. The phrase is dropped and the date is
     rendered on its own by relativePhrase(), because every one of the five
     events is something that has already happened. Device and server clock skew
     is the commonest real cause of a wrong health timestamp, so it earns the
     same paragraph as a malformed string rather than none at all. */
  if (elapsedMs !== null && elapsedMs < 0) {
    report(
      `\`at="${at}"\` is later than \`now="${String(now)}"\`, so this reading is ` +
        "timestamped in the future. No relative phrase was rendered and the exact " +
        "date was rendered on its own. The usual cause is two clocks " +
        "disagreeing: a device set wrong, or a timestamp written with the wrong " +
        "offset. It is worth finding before the reading is filed under the " +
        "wrong day.",
    )
  }

  /* THE VERDICT IS COMPUTED FROM THE EXACT ELAPSED TIME, NOT FROM THE PHRASE.
     The phrase rounds down, so a reading 13 days and 20 hours old reads
     "13 days ago"; if the product's threshold is 13 days, that reading is stale
     and says so. Rounding is allowed to make a number easier to read and is
     never allowed to move a boundary somebody set.

     AND A SUPPLIED THRESHOLD ALWAYS PRODUCES WORDS. There are three answers,
     not two: the reading is inside the boundary, it is past it, or the question
     could not be answered at all. The third renders the same hedged words
     as the second rather than rendering nothing. *may be out of date* is
     already the sentence for a component that cannot vouch for a reading's age,
     so it is the honest output when the age could not be checked. Silence is
     not: uncertainty-and-staleness forbids showing a stale value as if it were
     fresh, the warning below is compiled out of a production build, and a
     product that asked the question would be told nothing at all. The direction
     is deliberate. A product whose threshold arrives as a string sees the hedge
     on every row and finds the defect in minutes; the same product seeing
     silence never finds it. */
  let stale = false
  if (staleAfterHours !== undefined) {
    if (!(Number.isFinite(staleAfterHours) && staleAfterHours >= 0)) {
      stale = true
      report(
        `\`staleAfterHours={${String(staleAfterHours)}}\` is not a number of hours, ` +
          "so the age could not be checked against it and the timestamp carries " +
          "the same words it would carry past a threshold. Pass a number. A " +
          "threshold arriving as a string from a settings row or a JSON column is " +
          "the usual cause. A threshold that silently does nothing is worse than " +
          "no threshold: the product believes it asked for one.",
      )
    } else if (elapsedMs === null) {
      /* `now` was unusable and has already been complained about above. There is
         nothing to apply the threshold to, so the hedge stands in for the
         verdict rather than a second paragraph on the console. */
      stale = true
    } else {
      stale = elapsedMs > staleAfterHours * HOUR_MS
    }
  }

  const phrase =
    elapsedMs === null ? null : relativePhrase(elapsedMs, boundaryDays, language)
  const absolute = absoluteForm(instant, language)

  return (
    <time
      data-slot="relative-time"
      /* The caller's own string, unmodified. It is the exact instant, it
         survives copy, export and scraping, and it is the only part of this
         element that cannot go out of date on a page left open. */
      dateTime={at}
      className={cn(
        /* No type size and no colour of its own in the ordinary case: a
           timestamp sits inside somebody else's sentence or under somebody
           else's value, and it inherits both. `tabular-nums` is the one
           typographic opinion, so a column of times lines up on its digits.
           `data-opsinjs-value` is deliberately NOT used. That attribute marks
           a measurement a person reads as their own, and an instant is not
           one. */
        "tabular-nums",
        /* The stale treatment: muted, and never tinted from the status axis. An
           amber timestamp would put a clinical verdict onto a fact about the
           clock, and the reader has no way to tell the two reds apart. The
           words below are the carrier; this is the scanning aid.

           IT IS ADDRESSED AT THE PARTS RATHER THAN AT THE ROOT, AND THAT IS NOT
           A PREFERENCE. `cn()` is tailwind-merge, which does not know the
           `--text-opsin-*` bridge and so files `text-opsin-footnote` in the same
           conflict group as `text-muted-foreground`. On one element the later of
           the two deletes the earlier one whichever way round they arrive: with
           `className` last a caller's type size deletes the muting, which
           renders a stale reading in exactly the tone of a fresh one, and
           reversing the order deletes the caller's type size instead. A
           descendant selector belongs to no conflict group, so both survive.
           Measured against tailwind-merge 3.6.0, which is what this repository
           pins. */
        stale && "[&_span]:text-muted-foreground",
        className,
      )}
    >
      <span data-slot="relative-time-prefix">{word}</span>{" "}
      {phrase === null ? null : (
        <>
          <span data-slot="relative-time-relative">{phrase}</span>
          {showAbsolute ? <span aria-hidden="true"> · </span> : null}
        </>
      )}
      {/* ALWAYS PRESENT, IN THREE FORMS. On screen when the caller asks for it
          or when the date has replaced the phrase; in the accessibility tree
          always, because a relative phrase alone is the least useful form for
          anyone who cannot see the surrounding context; and on paper always,
          because a printed page saying "3 days ago" has no date on it at all.
          The connective is a word rather than the separator character, so the
          announcement is one phrase and not a list of fragments. It reads
          "Measured 3 days ago, on 14 March 2026 at 08:12 UTC". */}
      <span
        data-slot="relative-time-absolute"
        className={cn(phrase !== null && !showAbsolute && "sr-only print:not-sr-only")}
      >
        {phrase === null ? (
          "on "
        ) : (
          <span className={cn(showAbsolute && "sr-only")}>, on </span>
        )}
        {absolute}
      </span>
      {stale ? (
        <>
          <span aria-hidden="true"> · </span>
          <span data-slot="relative-time-staleness">
            <span className="sr-only">, </span>
            {STALENESS_WORDS}
          </span>
        </>
      ) : null}
    </time>
  )
}

/**
 * The instant the demo is measured against.
 *
 * A literal rather than a clock read, for two reasons that happen to point the
 * same way. `now` is required of every caller, and a demo that quietly did
 * something the API does not allow would be documenting a different component.
 * And a fixed instant is what makes this deterministic, in the same spirit as
 * every number in an opsinjs example being obviously synthetic (ADR 0012): a
 * clock here would make the demo say something different every time the page
 * was built, drift its rows out of the rungs they exist to show, and make one
 * snapshot incomparable with the last.
 */
const DEMO_NOW = "2026-03-14T11:12:00+00:00"

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It walks the four rungs of the
 * ladder in one column: minutes, hours, days, and the date that replaces the
 * phrase. It does this because the thing worth seeing about this component is
 * that the phrase gets vaguer as the event gets older, on purpose.
 *
 * NO ROW CARRIES A STALENESS THRESHOLD, so no row says anything about
 * staleness. A number here would be a staleness default shipped verbatim into
 * every repository that runs `shadcn add`, which ADR 0012 forbids outright and
 * which no disclaimer in a comment undoes: the number is the part that gets
 * copied, and a reader who never opens the comment has still read the number.
 * The cost is real and is stated rather than hidden. The one visual state this
 * component has is demonstrated by no preview opsinjs ships, and the
 * specification page says so in the same words.
 *
 * It carries no readings at all, and it names no measurement: a screenshot of
 * an opsinjs example must never be mistakable for somebody's own result.
 */
export default function RelativeTimeDemo() {
  return (
    <div className="flex flex-col gap-opsin-2 text-opsin-body">
      <RelativeTime event="synced" at="2026-03-14T11:09:00+00:00" now={DEMO_NOW} locale="en-GB" />
      <RelativeTime
        event="measured"
        at="2026-03-14T08:12:00+00:00"
        now={DEMO_NOW}
        locale="en-GB"
        showAbsolute
      />
      <RelativeTime
        event="recorded"
        at="2026-03-10T20:40:00+00:00"
        now={DEMO_NOW}
        locale="en-GB"
      />
      <RelativeTime event="received" at="2026-03-01T09:00:00+00:00" now={DEMO_NOW} locale="en-GB" />
      <RelativeTime event="issued" at="2025-11-02T09:00:00+00:00" now={DEMO_NOW} locale="en-GB" />
    </div>
  )
}
