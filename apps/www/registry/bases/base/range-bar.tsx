/**
 * RangeBar shows where one reading sits against the range it is being compared
 * with. The sentence is the component; the bar is a drawing of the sentence.
 *
 * WRITE THE SENTENCE FIRST, AND THE PICTURE SECOND. `RangeBar.Summary` is not a
 * caption and not an accessibility afterthought: it is the entire payload, in
 * words, and it is what a printout, a screen reader, a plain-text export and a
 * monochrome screenshot are left holding. If the sentence is right the drawing
 * is decoration; if the sentence is wrong, no amount of drawing repairs it.
 * That is why it is never hidden, never removable, and rendered even when there
 * is no bar to draw at all.
 *
 * IT DERIVES NO VERDICT. Everything this component computes is arithmetic on
 * numbers the product supplied. It computes a position along a line, and the
 * word "within", "above" or "below" for that position against the product's
 * own bounds. `status` is an INPUT. RangeBar never turns "above the range" into
 * "needs attention": that conversion needs a clinician or a validated rule, and
 * it belongs to whoever owns the range. Most people sit outside at least one
 * reference range at any moment, and an interface that treats outside as wrong
 * produces anxiety rather than information.
 *
 * IT SHIPS NO RANGE, EVER. No default range, no population fallback, no range
 * inferred from anybody's own history, not even in the demo at the foot of this
 * file. `ReferenceRange.source` is required because a band with no author is an
 * assertion nobody signed; a range that arrives without one is reported as
 * OPSIN-0004 and drawn as nothing at all, because a plausible band is worse
 * than no band. The reader cannot tell the two apart. A range is not an
 * interval when neither bound is supplied, or when the bounds run downwards.
 * Such a range is discarded on the same terms, in the sentence as well as in
 * the picture: the word "within" is what arithmetic falls through to, and
 * "within the range" against bounds nobody gave is a reassurance derived from
 * nothing.
 *
 * A BAR NEEDS TWO BOUNDS. A one-sided range ("up to 20") has no width, and a
 * width is what a scale is made of; drawing one would mean inventing the other
 * end. So the track appears only when both bounds are present and there is a
 * reading to put on it. Every other case renders the sentence and no picture,
 * which is the honest output rather than a degraded one.
 *
 * THE TWO AXES SIT ON DIFFERENT ELEMENTS, deliberately. `status` colours the
 * tick and nothing else; `category` tints the label and nothing else. Neither
 * ever reaches the track or the band, and no single element resolves both. A
 * heart-red bar beside an attention-red bar is the collision the two-axis rule
 * exists to prevent, and it is a collision the reader has no way to decode.
 *
 * NOTHING HERE ANIMATES. Not the tick sliding into position on first paint, not
 * the band growing, not the number counting up. A health value that arrives by
 * animation has displayed, for every frame of the journey, a reading that is
 * not true.
 */

import type { CSSProperties } from "react"

import { Circle, CircleDot, Diamond, Octagon } from "lucide-react"

import {
  CLINICAL_STATUS_META,
  EXAMPLE_SOURCE,
  HEALTH_CATEGORIES,
  isClinicalStatus,
  isDevelopment,
  isHealthCategory,
  warnOnce,
  type ClinicalStatus,
  type HealthCategory,
  type ReferenceRange,
} from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { StatusPill } from "@/registry/base-lyra/ui/status-pill"
import { Value } from "@/registry/base-lyra/ui/value"

/**
 * The glyph for each level, and the second copy of this map in the system.
 *
 * `CLINICAL_STATUS_META[level].icon` is the source of truth for WHICH lucide
 * icon a level uses; a bundler cannot resolve that name at runtime without
 * pulling the whole icon set into the bundle, so the binding from name to
 * component has to be written out. Typing it `Record<ClinicalStatus, …>` makes
 * a missing level a compile error, and the assertion below is what catches this
 * copy drifting away from `lib/status.ts`.
 *
 * THIS MAP NO LONGER FEEDS A GLYPH THIS FILE DRAWS. The level beside the label
 * is now a StatusPill, so one capsule carries the word, the glyph and the
 * colour, and a reader learns to scan for a single shape wherever a level
 * appears in the system. The status word still lives outside the summary, where
 * a caller who replaces the sentence cannot take it away, because the pill sits
 * in the label row rather than inside the sentence. What remains here is the
 * development-only drift guard below, kept in step with the copy StatusPill runs
 * on itself, and the vocabulary is read from `CLINICAL_STATUS_META` so the two
 * can never say different words for one level.
 */
const ICONS: Record<ClinicalStatus, typeof Circle> = {
  steady: Circle,
  watch: CircleDot,
  attention: Diamond,
  urgent: Octagon,
}

/* Development-only. If somebody changes an icon name in lib/status.ts and not
   here, this file keeps rendering a plausible glyph for the wrong level, which
   is precisely the failure the four-distinct-shapes rule exists to prevent. */
if (isDevelopment()) {
  for (const [level, Icon] of Object.entries(ICONS)) {
    const expected = CLINICAL_STATUS_META[level as ClinicalStatus].icon
    const actual = (Icon as { displayName?: string }).displayName
    if (actual && actual !== expected) {
      /* Not an OPSIN code. Those describe a mistake a CONSUMER made with the
         API; this is this file disagreeing with lib/status.ts, which is a defect
         in opsinjs itself and belongs in a different channel. */
      console.warn(
        `[opsinjs] RangeBar renders <${actual}> for status "${level}", but ` +
          `CLINICAL_STATUS_META says the icon is "${expected}". The four levels ` +
          `must be four distinct glyph shapes; fix ICONS in range-bar.tsx.`,
      )
    }
  }
}

/**
 * Development warnings, said once per offending call site.
 *
 * `tokens/errors.json` states the policy, and that policy is development only,
 * once per offending call site, through `console.warn`. `warnOnce` in the
 * substrate keeps to it, but `warnOnce` is keyed to an `OpsinErrorCode` and the
 * four complaints in the component body below have no code allocated: they are
 * drawing and labelling defects rather than mistakes with the clinical API, and
 * a component may not mint a code, because the errors table is generated from
 * that file.
 *
 * Without a keyed set they print on every render, and twice again per render
 * under Strict Mode. A bar inside a list that re-renders on scroll would repeat
 * the same paragraph until the console is unusable, and a channel somebody
 * filters is one that no longer carries the finding they needed. Here that
 * finding is a range with no interval under it, or two bounds that read as one
 * number.
 *
 * The key names the offence and the values that caused it, never the reading:
 * one bar with a bad range says so once, and a second bar with a different bad
 * range still gets its own line.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

/**
 * The tick's fill, one class per level, written out rather than built.
 *
 * Tailwind reads class names out of source as literal strings, so
 * `bg-status-${level}` generates no CSS at all and the tick renders invisible
 * against the rail. The bare status name is the LINE role. That is the boundary
 * colour, which is what a 4px mark on a neutral rail is. `-accent` is
 * deliberately absent: it is the identity fill, chosen for recognition rather
 * than contrast, and a tick is read for its position before its colour.
 */
const TICK_TONE: Record<ClinicalStatus, string> = {
  steady: "bg-status-steady",
  watch: "bg-status-watch",
  attention: "bg-status-attention",
  urgent: "bg-status-urgent",
}

/**
 * The category tint, on the label and on nothing else.
 *
 * Category colour is IDENTITY. It says what this reading is about, and never a
 * verdict, so it says nothing in greyscale except which metric you are looking
 * at, which is why no word accompanies it. The label is also the one place the
 * specification permits it: the track, the band and the tick stay outside the
 * category axis entirely.
 */
const CATEGORY_INK: Record<HealthCategory, string> = {
  sleep: "text-category-sleep-ink",
  heart: "text-category-heart-ink",
  activity: "text-category-activity-ink",
  nutrition: "text-category-nutrition-ink",
  mind: "text-category-mind-ink",
  labs: "text-category-labs-ink",
}

/**
 * How much of the drawn extent is breathing room, as a fraction of it.
 *
 * A DRAWING constant and not a clinical one: it decides where the ends of the
 * line fall, never what a reading means. Without it a value sitting exactly at
 * the extent would be drawn centred on the very edge of the track, half of the
 * mark outside the box and its number hanging off the surface.
 */
const EDGE_ROOM = 0.08

/**
 * The ceiling `Intl.NumberFormat` accepts for fraction digits, mirrored from
 * `Value`. It is how "show the digits you were handed" is said to a formatter
 * whose own default is to round silently at three.
 */
const MAX_FRACTION_DIGITS = 20

/**
 * One piece of the summary sentence: words, or a reading Value renders.
 *
 * `unitDisplay` rides along so a piece can ask Value to keep the unit in the
 * accessibility tree and take it off the screen. A pair of bounds in one unit is
 * one measurement written twice, so the visible sentence prints the unit once,
 * on the second bound, and the first bound carries `unitDisplay: "spoken"`. A
 * listener has no column to carry the unit across from one bound to the next, so
 * the spoken form stays on both and nobody hears a bound read bare.
 */
type SummaryPiece =
  | string
  | { reading: number | null; unit: string; unitDisplay?: "symbol" | "spoken" }

/** Where the reading falls against the product's own bounds. Arithmetic only. */
type Position = "within" | "above" | "below"

export interface RangeBarProps {
  /**
   * What was measured, in the reader's language rather than an internal code.
   * It opens the summary sentence, so it reads as the subject of a sentence:
   * "Morning blood pressure is …".
   */
  label: string
  /**
   * The measurement. `null` is a first-class state meaning there is no reading,
   * distinct from `0`, and renders the words rather than a tick at zero. A
   * mark at the bottom of a range is a reading, and a missing one is not.
   */
  value: number | null
  /**
   * Display symbol exactly as `tokens/units.json` spells it, as in "kg",
   * "mmol/L" or "mg/dL". Every number this component renders goes through
   * `Value`, which resolves the spoken form from that table, so a listener
   * hears "milligrams per decilitre" rather than an improvised pronunciation.
   */
  unit: string
  /**
   * The range this reading is being compared with, and whose it is. Omit it
   * entirely when none is available: the component then draws no band, says so
   * in the summary, and substitutes nothing. `source` is required. A range
   * with an empty one is reported as OPSIN-0004 and not drawn.
   */
  range?: ReferenceRange
  /**
   * The level of attention the PRODUCT has assigned to this reading. RangeBar
   * never derives it from position on its own bar: "outside the range" and
   * "needs attention" are different claims. Omitted, the tick is drawn in a
   * neutral tone and no level is stated, which is the correct rendering of "no
   * verdict has been made" rather than a quiet "nothing to see here".
   */
  status?: ClinicalStatus
  /**
   * What the reading is ABOUT, for findability in a screen full of readings. It
   * tints the label and nothing else: never the track, the band or the tick.
   * Typed to the six rather than to `string`, because a component that accepts
   * an arbitrary category accepts a seventh ramp that does not exist.
   */
  category?: HealthCategory
  /**
   * DECIMAL PLACES, from the precision of the measurement. That is the
   * resolution of the device, or the number of places the laboratory reported.
   * Not significant figures: the same metric shown to a different number of
   * decimal places at different magnitudes cannot be compared at a glance,
   * which is what `health/numbers-units-precision` rule 2 forbids.
   *
   * It applies to the reading and to the two boundary labels alike, because a
   * value and the bound it is being compared with are the same metric. It is
   * required, so a TypeScript caller cannot ship a reading with no stated
   * precision: an unstated precision is default float rendering, which
   * `health/numbers-units-precision` rule 1 forbids anywhere. Required is not the
   * same as defaulted. This component still invents no number of its own, because
   * precision belongs to the metric rather than to the unit and nothing here
   * could supply an honest one. The file ships as source into JavaScript
   * projects, where a required prop is advice rather than a guarantee, so a
   * caller who omits it there still gets the honest fallback, with nothing
   * rounded and nothing padded.
   */
  precision: number
  /**
   * When the measurement was taken, ISO 8601. Rendered as a date in the
   * footnote so that a number on a screen is not read as "now". Omitted, the
   * footnote says that nobody knows when the reading was taken rather than
   * saying nothing, because silence about a time is read as now.
   *
   * That is a recency signal, and it is not a staleness treatment. There is no
   * `staleAfterHours` here and there will not be one: how old is too old is
   * clinical, differs by metric, and opsinjs does not own it. A surface that
   * needs a boundary wraps the reading in `RelativeTime`, which takes the
   * boundary from you.
   *
   * A container that already states the instant itself can suppress this
   * footnote sentence with `readingRecency="delegated"`. See that prop.
   */
  measuredAt?: string
  /**
   * Who states when the reading was taken. Defaults to `"state"`, which is
   * every existing caller's behaviour without exception: the footnote prints
   * the reading's date, or prints that nobody knows when it was taken.
   *
   * `"delegated"` means the surrounding component states that instant itself,
   * in view and in the accessibility tree, and takes responsibility for doing
   * so; the bar then prints neither reading sentence. This exists to stop one
   * card saying the same thing twice, not to make a number quieter about its
   * age. A caller that passes `"delegated"` and then states nothing has removed
   * a fact from the screen, which is the failure `measuredAt` exists to
   * prevent. The one caller entitled to it is `ResultCard`, whose header
   * carries the instant through `RelativeTime` with the absolute date always on
   * screen. `measuredAt` is still passed under delegation, because it can feed
   * an accessible name a container builds; it simply stops printing here.
   */
  readingRecency?: "state" | "delegated"
  /**
   * Replaces the generated sentence. Use it for a unit whose phrasing does not
   * fit the template, or for a reader whose language is not English. It cannot
   * remove the sentence: there is no value of this prop that renders the
   * component without one, because the sentence is the component.
   */
  summary?: string
  /**
   * BCP 47 locale for number separators, digit shapes and the dates in the
   * footnote. Passed through to every `Value` this component renders, so one
   * bar cannot show two conventions.
   *
   * This component renders on a server and again in a browser. With no locale
   * the server formats with the host process's locale and the browser formats
   * with the reader's, so where the two differ the number separators and the
   * footnote date change under the reader on hydration and React reports a
   * mismatch. Pass the locale the surface is rendered in, taken from wherever
   * that surface already knows it. Omitting it does not hand formatting to the
   * reader's own environment on the server; it hands it to the server's.
   */
  locale?: string
  /** Merged onto the root. A class passed here wins where the two conflict. */
  className?: string
}

/**
 * The drawn extent, or `null` when there is nothing honest to draw.
 *
 * WIDER THAN THE RANGE ON BOTH SIDES, by one band-width each way, so that a
 * reading outside the range has somewhere to be. And it always contains the
 * reading: a value far beyond the range compresses the band towards a sliver,
 * which is TRUE TO SCALE and is the information. A picture that clipped the
 * reading to the edge instead would be showing it somewhere it is not.
 *
 * It carries the reading back out with it, narrowed to a real number. Every
 * caller that has an extent has a reading to draw on it, and returning the two
 * together is what makes that true to the type checker as well as to the eye.
 */
function drawnExtent(
  range: ReferenceRange | undefined,
  value: number | null,
): { start: number; end: number; low: number; high: number; reading: number } | null {
  if (range === undefined || value === null || !Number.isFinite(value)) return null
  const { low, high } = range
  if (low === undefined || high === undefined) return null
  /* A range whose bounds are equal or inverted has no width, and a width is
     what a scale is made of. Such a range is refused before it reaches here,
     because it never becomes `compared`. This stays so the function is honest
     read on its own rather than honest by arrangement with its caller. */
  if (!(high > low)) return null
  const reach = high - low
  const start = Math.min(low - reach, value)
  const end = Math.max(high + reach, value)
  const room = (end - start) * EDGE_ROOM
  return { start: start - room, end: end + room, low, high, reading: value }
}

/**
 * Where the reading sits against the bounds the caller supplied.
 *
 * Three words, all of them arithmetic. This is the one comparison the component
 * performs, and it is the same comparison the drawing performs; it says where a
 * number is and never what being there means.
 *
 * IT IS ONLY EVER CALLED WITH A RANGE THAT HAS A BOUND. `within` is the
 * fall-through, so a range carrying neither bound would come back `within`.
 * That is a position, in the reassuring direction, against an interval nobody
 * supplied. That range is discarded in the component body before it reaches
 * here.
 */
function positionOf(value: number, range: ReferenceRange): Position {
  if (range.low !== undefined && value < range.low) return "below"
  if (range.high !== undefined && value > range.high) return "above"
  return "within"
}

/**
 * The range as a noun phrase, open at either end when only one bound is known.
 *
 * A range with neither bound is discarded upstream and never reaches here; the
 * empty return is what keeps this function total, and it is not a state the
 * sentence is ever built from. An empty phrase spliced into "within the range
 * …, from …" is a comparison with nothing in it.
 *
 * The low bound of a two-bound pair carries `unitDisplay: "spoken"`, so the
 * phrase reads "10 to 20 mg/dL" on the screen rather than "10 mg/dL to 20 mg/dL":
 * one unit for one measurement written at both its ends. The unit stays spoken
 * on both, because a listener meets the bounds one after the other and has no
 * column heading to carry the unit across from the first to the second.
 *
 * IT NOW SERVES THE NO-READING BRANCH ALONE. The has-reading sentence takes its
 * comparison clause from `comparisonPieces`, which templates the phrasing per
 * range shape. This function is the range as a bare noun phrase, which is what
 * "The range is 10 to 20 mg/dL, from X." and "The range is up to 20 mg/dL, from
 * X." both need, because there is no position word beside it for an open-ended
 * phrase to collide with. Do not reuse it inside a comparison; that is the
 * collision `comparisonPieces` exists to prevent.
 */
function rangePieces(range: ReferenceRange, unit: string): SummaryPiece[] {
  const { low, high } = range
  if (low !== undefined && high !== undefined) {
    return [{ reading: low, unit, unitDisplay: "spoken" }, " to ", { reading: high, unit }]
  }
  if (high !== undefined) return ["up to ", { reading: high, unit }]
  if (low !== undefined) return [{ reading: low, unit }, " and upwards"]
  return []
}

/**
 * The comparison clause, templated per range shape, comma and space included.
 *
 * The clause carries its own leading ", " so the caller concatenates it rather
 * than interpolating a position word into a fixed frame. A two-bound range keeps
 * the frame it always had, "within/above/below the range X to Y", which is the
 * sentence the has-reading branch produced before this function existed. A
 * one-bound range does not: splicing an open-ended noun phrase into that frame
 * gives "within the range up to 20", two prepositions fighting over one number,
 * so each open shape gets a clause written for it that names the bound and never
 * the reader. The words are the direction-based lay phrasing
 * `content/docs/health/reference-ranges.mdx` prefers, and none of them is on the
 * banned list in `tokens/glossary.json`.
 *
 * `positionOf` decides the direction, and it cannot return every direction for
 * every shape. With only `high` it returns "above" or "within" and never
 * "below"; with only `low` it returns "below" or "within" and never "above". The
 * unreachable direction falls through to the within-side wording rather than
 * throwing, so the function is total whatever a caller's pipeline hands it. The
 * within-side clause says "at or under" and "at or above" rather than the bare
 * preposition because `positionOf` tests the bounds strictly, so a reading equal
 * to its only bound comes back "within" and lands here. A reading on the cutoff
 * is neither under nor above it, and "at or under 20" stays true when the
 * reading is 20 where "under 20" would be false. The
 * boundless range, which carries neither bound, is discarded upstream and never
 * reaches here; its empty return mirrors `rangePieces` and keeps this function
 * honest read on its own.
 */
function comparisonPieces(value: number, range: ReferenceRange, unit: string): SummaryPiece[] {
  const { low, high } = range
  if (low !== undefined && high !== undefined) {
    return [
      `, ${positionOf(value, range)} the range `,
      { reading: low, unit, unitDisplay: "spoken" },
      " to ",
      { reading: high, unit },
    ]
  }
  if (high !== undefined) {
    return positionOf(value, range) === "above"
      ? [", higher than the upper limit of ", { reading: high, unit }]
      : [", at or under the upper limit of ", { reading: high, unit }]
  }
  if (low !== undefined) {
    return positionOf(value, range) === "below"
      ? [", lower than the lower limit of ", { reading: low, unit }]
      : [", at or above the lower limit of ", { reading: low, unit }]
  }
  return []
}

/**
 * The sentence, in pieces, so that each reading renders as a `Value`.
 *
 * It is built once and rendered once, in the visible summary paragraph, where
 * each reading is a `Value` that carries the unit's spoken form. That paragraph
 * is plain text in the accessibility tree, so it is also what a screen reader
 * reads: the sentence is heard from the paragraph itself rather than from a
 * separate accessible name, and the track above it is now decorative and
 * hidden, so no reader hears the sentence twice.
 *
 * It always states the reading, the range and the position, in that order, so
 * that it stands alone when it is read out of context, whether in a screen
 * reader, in a notification or in a printed summary. It also names whose range
 * it is, which is why `ReferenceRange.source` is required.
 */
function summaryPieces(
  label: string,
  value: number | null,
  unit: string,
  range: ReferenceRange | undefined,
): SummaryPiece[] {
  if (value === null || !Number.isFinite(value)) {
    const opening: SummaryPiece[] = [`${label}: `, { reading: value, unit }, "."]
    if (range === undefined) return opening
    return [
      ...opening,
      " The range is ",
      ...rangePieces(range, unit),
      `, from ${range.source}.`,
    ]
  }
  if (range === undefined) {
    return [
      `${label} is `,
      { reading: value, unit },
      ". We do not have a reference range for this test, so we cannot show where this result sits.",
    ]
  }
  return [
    `${label} is `,
    { reading: value, unit },
    ...comparisonPieces(value, range, unit),
    `, from ${range.source}.`,
  ]
}

/**
 * The digits, formatted the way `Value` formats them.
 *
 * A deliberate mirror rather than a second policy: `halfExpand` is
 * round-half-away-from-zero, rounding happens once at display, and with no
 * `precision` the fraction digits are opened all the way rather than left at
 * the formatter's default of three, which would round somebody's measurement
 * because nobody had said how precise it was. It exists because an `aria-label`
 * is a string and a string cannot contain a component; the numbers a reader
 * SEES all come from `Value` itself.
 */
function digitsOf(reading: number, precision: number | undefined, locale: string | undefined): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision ?? MAX_FRACTION_DIGITS,
  }).format(reading)
}

/**
 * A date, or the string as supplied when it is not one.
 *
 * `timeZone: "UTC"` rather than the reader's zone, because this renders on a
 * server and again in a browser: a date that resolved differently in the two
 * places would hydrate into a mismatch, and a provenance date that changes
 * under the reader is worse than one that is a few hours out.
 *
 * The locale is the other half of that same hydration problem, and it is not
 * fixed here. With `locale` undefined the server formats this date with the host
 * process's locale and the browser reformats it with the reader's, so the
 * footnote can flip its date order on load. One component cannot resolve that on
 * its own: the only document-level source of a locale is client-only and would
 * itself differ between the server pass and the first client pass, which is the
 * bug rather than the fix. The caller passes the locale the surface renders in.
 */
function formatDate(iso: string, locale: string | undefined): string {
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) return iso
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(instant)
}

export function RangeBar({
  label,
  value,
  unit,
  range,
  status,
  category,
  precision,
  measuredAt,
  readingRecency = "state",
  summary,
  locale,
  className,
}: RangeBarProps) {
  /* THE FIFTH LEVEL IS REFUSED, NOT APPROXIMATED. This file ships as source
     into JavaScript projects where a type is advice, and a level outside the
     four has no word, no glyph and no meaning. So the bar is drawn without a
     status rather than with an invented one. `unknown` gets its own code
     because it is the likeliest wrong answer and the most dangerous: it is the
     absence of an assertion, and a reader who meets it rendered as a level
     reads it as "probably fine". */
  let level: ClinicalStatus | undefined
  if (status !== undefined) {
    if (isClinicalStatus(status)) {
      level = status
    } else {
      warnOnce(status === "unknown" ? "OPSIN-0011" : "OPSIN-0021", {
        component: "RangeBar",
        status: String(status),
      })
    }
  }

  /* A seventh category is a ramp that does not exist, so it resolves to no
     colour at all rather than to a plausible one. */
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

  /* OPSIN-0004, at its enforcement point. A range is a comparison somebody
     chose, and an unattributed one asks this system to vouch for a threshold it
     has never seen. The repair is to drop the range entirely rather than to
     draw the band and omit the credit, which would leave the reader looking
     at a comparison with no author and no way to know that is what they are
     doing. */
  const attributed =
    range !== undefined && typeof range.source === "string" && range.source.trim() !== ""
  if (range !== undefined && !attributed) {
    warnOnce("OPSIN-0004", { component: "RangeBar" })
  }

  /* AN INTERVAL, OR NOTHING AT ALL. These are the second and third ways a range
     arrives unusable, and they are dangerous in the sentence rather than in the
     picture. Both bounds are optional on `ReferenceRange`, so `{ source }` on
     its own typechecks, and a pair that runs downwards typechecks too. Neither
     is an interval, and neither may be half-used: the drawing already refuses
     both, and the SENTENCE is what would otherwise state a position against
     them. That is "within the range ,", in the reassuring direction, naming an
     interval printed nowhere on the screen, or "below the range 20 to 10". They
     take the exit an unattributed range already takes: the reading, and
     the words for having nothing to compare it with. */
  const boundless = range !== undefined && range.low === undefined && range.high === undefined
  const inverted =
    range !== undefined &&
    range.low !== undefined &&
    range.high !== undefined &&
    !(range.high > range.low)
  const compared = attributed && !boundless && !inverted ? range : undefined

  if (attributed && boundless) {
    warnDev(
      `range-boundless:${label}`,
      "[opsinjs] <RangeBar> was given a `range` with neither `low` nor `high`, " +
        "which is a source with no interval underneath it. It was discarded " +
        "rather than compared against, because a reading is not `within` an " +
        "interval nobody supplied. The sentence states the reading and says " +
        "there is nothing to compare it with.",
    )
  }

  if (inverted) {
    warnDev(
      `range-inverted:${String(range?.low)}:${String(range?.high)}`,
      `[opsinjs] <RangeBar> was given low=${String(range?.low)} and ` +
        `high=${String(range?.high)}, which leaves the range no width to draw a ` +
        "scale from and no order to place a reading against. It was discarded: " +
        "no bar is drawn, and the sentence says there is nothing to compare the " +
        "reading with rather than naming a position between two bounds that run " +
        "downwards.",
    )
  }

  const extent = drawnExtent(compared, value)

  /* Both boundary labels rounding to the same digits is not a drawing bug and
     is not repaired by quietly adding a decimal place: a number shown to more
     places than the measurement carries is an accuracy claim nobody made. It
     means the precision this metric is reported to cannot separate its own
     bounds, and the caller is the only one who can say what it should be. */
  if (
    extent !== null &&
    digitsOf(extent.low, precision, locale) === digitsOf(extent.high, precision, locale)
  ) {
    warnDev(
      `bounds-collapse:${String(precision)}:${String(extent.low)}:${String(extent.high)}`,
      `[opsinjs] <RangeBar> is labelling both ends of the range ` +
        `"${digitsOf(extent.low, precision, locale)}", because ` +
        `precision=${String(precision)} rounds ${String(extent.low)} and ` +
        `${String(extent.high)} to the same digits. The two marks are drawn in the ` +
        "right places and read as one number. Pass the precision this measurement " +
        "is reported to; nothing here invents a decimal place to separate them.",
    )
  }

  const pieces = summaryPieces(label, value, unit, compared)

  /* An empty `summary` is the only way this component can be asked to render
     without a sentence, and the answer is no. The generated one is used
     instead, because a bar with no words is a picture whose entire meaning is
     carried by a position on a line. That is nothing at all in a screen
     reader, on a printout, or to a reader who cannot see it. */
  const blankSummary = summary !== undefined && summary.trim() === ""
  if (blankSummary) {
    warnDev(
      `summary-blank:${label}`,
      '[opsinjs] <RangeBar> received summary="", which would render the bar with ' +
        "no sentence beside it. The generated sentence was used instead. The " +
        "wording is yours to replace; the sentence is not optional, because it is " +
        "the whole component for anybody who is not looking at the picture.",
    )
  }
  const sentence = summary !== undefined && !blankSummary ? summary : undefined

  const at = (point: number) =>
    extent === null ? 0 : ((point - extent.start) / (extent.end - extent.start)) * 100

  /* NEVER SILENT ABOUT WHEN THE READING WAS TAKEN, UNLESS A CONTAINER TAKES IT
     OVER. A number on a screen with no time beside it is read as "now", so a
     standalone bar STATES an absent `measuredAt` rather than saying nothing. It
     is a recency signal and not a staleness treatment: there is no boundary
     here and there will not be one, because how old is too old is clinical,
     differs by metric, and belongs to whoever owns the range.

     The one exception is `readingRecency === "delegated"`, which a surrounding
     component sets when it already states the instant itself, in view and in
     the accessibility tree. Then the bar prints neither reading sentence,
     because the fact is on the screen once already and printing it twice is
     what this exception exists to stop. It never makes the fact disappear: the
     container has promised to carry it. `ResultCard` is the caller that does,
     through the `RelativeTime` in its header.

     The range is different, and neither rule carries across to it. The range's
     author is already named in the summary sentence one line up, on every bar
     without exception, because `ReferenceRange.source` is required and
     OPSIN-0004 is enforced above, so a reader always knows whose comparison
     they are reading. A confirmation date is added when somebody supplies one.
     A line per row saying nobody knows a date the reader could not act on
     anyway reads as the product disowning its own ranges, and none of the
     health rules in content/docs/health/uncertainty-and-staleness.mdx asks an
     undated range to announce itself. So the undated range says nothing. */
  const asOf = compared?.asOf
  const hasReading = value !== null && Number.isFinite(value)
  const provenance: string[] = []
  if (asOf !== undefined) {
    provenance.push(`This range was last confirmed on ${formatDate(asOf, locale)}.`)
  }
  if (readingRecency === "state") {
    if (measuredAt !== undefined) {
      provenance.push(`This reading was taken on ${formatDate(measuredAt, locale)}.`)
    } else if (hasReading) {
      provenance.push("We do not know when this reading was taken.")
    }
  }

  return (
    <div
      data-slot="range-bar"
      className={cn(
        /* No fixed height and no truncation anywhere in this component: at 200%
           text every row here has to grow and wrap, and a height would clip the
           number rather than the decoration. */
        "flex w-full flex-col gap-opsin-2 text-opsin-body",
        className
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-opsin-2">
        {/* PLAIN STRINGS INSIDE THIS COMPONENT, and `cn` only on the root.
            `tailwind-merge` cannot tell `text-opsin-headline` (a size from the
            theme's own type ramp) from `text-category-labs-ink` (a colour): both
            are `text-*` with a key it does not know, so it treats them as one
            property and silently drops the earlier. This is verified.
            twMerge("text-opsin-headline", "text-category-labs-ink") returns the
            colour alone, and the label loses its type size. Concatenation keeps
            both, and the two declarations do not conflict in CSS because they
            set different properties. */}
        <span
          data-slot="range-bar-label"
          data-category={tint}
          className={
            tint === undefined
              ? "text-opsin-headline"
              : "text-opsin-headline " + CATEGORY_INK[tint]
          }
        >
          {label}
        </span>

        {/* The level the PRODUCT assigned, in a word and a distinct glyph as
            well as a colour. It sits outside the summary on purpose: a caller
            who replaces the sentence must not be able to take the word with it,
            because the measured CVD audit in tokens/color.json finds steady and
            attention identical under deuteranopia and in greyscale, and steady
            and urgent identical under tritanopia. The word is the carrier the
            colour is redundant to, and not the other way round. It is now
            delivered as a StatusPill, the one capsule every status-bearing
            component in the system shares, at StatusPill's own md size, so the
            same level reads as the same object here as on a card or a
            sparkline. The pill stamps its own data-status, and the tick inside
            the picture carries the second copy. `describes` gives a listener the
            subject the level applies to, so the pill is not heard as a floating
            word. */}
        {level !== undefined ? (
          <StatusPill status={level} describes={label} />
        ) : null}
      </div>

      {extent === null ? null : (
        /* Padded in `em` rather than in a fixed measure, because what has to fit
           in it is text: the reading above the track and the two boundary
           labels below it, both of which grow with the reader's own type size.
           A rem here would hold its ground while the labels grew through it.

           The padding is asymmetric on purpose. Above the track sits the
           reading, which is a health value and so is drawn at the `body` step
           tokens/type.json rules[1] fixes as the floor, one step larger than the
           wrapper's own footnote em. Below it sit the two boundary numbers,
           which are axis labels and stay at caption1, a step smaller. The top
           therefore needs more room than the bottom, so `pt` is `2.5em` to clear
           a body line plus the `mb-opsin-2` gap while `pb` stays at `1.75em` for
           the caption labels that did not grow. */
        <div
          className="relative pt-[2.5em] pb-[1.75em] text-opsin-footnote"
          style={{ "--rb-label-half": "3.5em" } as CSSProperties}
        >
          <div
            data-slot="range-bar-track"
            /* A DECORATIVE PICTURE, NOT A TREE OF SHAPES, and never a `slider`,
               a `meter` or a `progressbar`: all three announce a value a reader
               can inspect or move, and this is a drawing of a reading somebody
               else assigned. It is not focusable and it is not in the tab order,
               because a stop that does nothing is a stop every keyboard user
               pays for on every row of a list. The picture now has no
               accessible name and is hidden from the tree with `aria-hidden`,
               because the same words sit underneath it in the summary
               paragraph, which is unconditional and never behind a prop, and a
               named picture made every reader hear that sentence twice on every
               row of a list. The level is not lost with the name: the product's
               status word travels on the visible StatusPill above the bar,
               which is in the tree whenever `level` is set. The status word is
               inside the picture as a colour and nowhere inside it as a word. */
            aria-hidden="true"
            /* THE TRACK IS A GROOVE, SO IT READS THE INSET RUNG. `bg-muted` sat
               ABOVE the card fill in dark, which drew the track as a raised
               strip inside the card it belongs to rather than a recess cut into
               it, the opposite of the light layout. The token-only `inset` rung
               in tokens/material.json is authored to sit between the card and
               the page in both themes, so the track reads
               --opsin-material-inset-tint directly, the way Surface reads a
               rung's tint. The rung is opaque by design (tint-alpha 1, no blur),
               so a flat background colour is the whole of the treatment and no
               backdrop layer is needed here. */
            className="relative h-[0.9em] rounded-full border border-border bg-(--opsin-material-inset-tint)"
          >
            {/* THE BAND IS NEVER STATUS-COLOURED. It is the range, which is a
                fact about a laboratory rather than about the reader, and a
                coloured band is read as a verdict on everything inside it.

                OUTLINED RATHER THAN ONLY FILLED, because the fill is a
                near-neutral on a near-neutral and is the first thing a printer
                drops. That is an intent rather than a tested outcome, since
                opsinjs has no print stylesheet yet. The outline takes the same
                ink as the two boundary marks rather than the theme's generic
                hairline: `lib/generated/contrast.json` records a neutral
                hairline on the page at APCA Lc 22.42 and WCAG 1.47:1 against a
                non-text floor of Lc 45 and 3:1, and the band is the primary
                graphic. Neither of this component's own pairings has been
                measured; the page lists them rather than claiming them. */}
            <div
              data-slot="range-bar-band"
              style={{
                insetInlineStart: `${at(extent.low).toFixed(3)}%`,
                inlineSize: `${(at(extent.high) - at(extent.low)).toFixed(3)}%`,
              }}
              className="absolute inset-y-0 rounded-full border border-muted-foreground bg-background"
            />

            {[extent.low, extent.high].map((bound) => (
              <div
                key={bound}
                data-slot="range-bar-mark"
                style={{ insetInlineStart: `${at(bound).toFixed(3)}%` }}
                className="absolute -top-opsin-1 -bottom-opsin-1 w-px -translate-x-1/2 bg-muted-foreground rtl:translate-x-1/2 forced-colors:bg-[CanvasText]"
              />
            ))}

            {/* THE TWO BOUND LABELS GROW OUTWARDS FROM THEIR MARKS, AND THE
                TRACK IS WHAT BOUNDS THEM. Each label is a direct child of the
                track rather than of its 1px mark, so the track is the label's
                containing block and its position is held inside the track's own
                inline box. The low label lives in a box that runs from the
                track's start to the low mark; the high label lives in a box that
                runs from the high mark to the track's end. Each label ends on
                its mark while it fits and, once the reader's type size makes it
                wider than its box, falls back to the near track edge rather than
                hanging past it. Two failures are gone with this. Centred on
                their marks the labels overlapped at 200% text on a phone.
                Anchored to a 1px mark a label could hang off the component and
                scroll the page sideways once a rising reading pushed a mark
                towards the edge, which was the P1 the layout gate now measures.
                What it costs: near an end of the extent a label stops being
                flush with its mark, and the mark keeps the true position.

                THE FALLBACK EDGE IS WHY THE TWO BOXES ARE NOT SPELLED THE SAME.
                `justify-end-safe` aligns the label to the box's inline-end,
                which is the mark, and its `safe` keyword does one thing only:
                when the label no longer fits, it pins the label to the box's
                inline-START edge. For the low box that start edge is the track's
                own inline-start, so a low label that outgrows its box slides
                inward across the track and stays inside. For the high box the
                edge that must not be crossed is the track's inline-END, and
                `safe` never protects that edge; it would pin the high label to
                the box's inline-start, which is the high mark, and let the label
                overflow past the track's end and across the card border. That
                was resultcard-08. So the high label sits in an inner flex whose
                inline flow is reversed relative to the component, which makes the
                track's inline-end the start edge that flow's `safe` protects.
                `justify-end-safe` then hugs the high mark while the label fits
                and, on overflow, falls back to the track's inline-end and grows
                inward across the track, the mirror of the low label. The
                reversal is written relative to the ambient direction, not as a
                fixed `rtl`, so the pair still mirror correctly when a product
                renders the whole bar right to left, and the label span restores
                the ambient direction so the number and its unit keep their
                reading order.

                `whitespace-nowrap` stays, for a different reason than it did on
                the mark. `Value` joins the number and its unit with a no-break
                space, and each box is wide enough that wrapping would only ever
                split that phrase from the rest of the row. The class lists are
                written out and joined rather than run through `cn`, because
                tailwind-merge has never been told that `--text-opsin-*` is a
                font-size namespace and would file `text-opsin-caption1` with
                `text-muted-foreground` and drop one of them. */}
            <div
              className="absolute top-full mt-opsin-2 flex justify-end-safe"
              style={{
                insetInlineStart: 0,
                inlineSize: `${at(extent.low).toFixed(3)}%`,
              }}
            >
              <span className="whitespace-nowrap pe-opsin-1 text-opsin-caption1 text-muted-foreground">
                <Value
                  value={extent.low}
                  unit={unit}
                  precision={precision}
                  locale={locale}
                />
              </span>
            </div>
            <div
              className="absolute top-full mt-opsin-2"
              style={{
                insetInlineEnd: 0,
                inlineSize: `calc(100% - ${at(extent.high).toFixed(3)}%)`,
              }}
            >
              <div className="flex w-full justify-end-safe [direction:rtl] rtl:[direction:ltr]">
                <span className="whitespace-nowrap ps-opsin-1 text-opsin-caption1 text-muted-foreground [direction:ltr] rtl:[direction:rtl]">
                  <Value
                    value={extent.high}
                    unit={unit}
                    precision={precision}
                    locale={locale}
                  />
                </span>
              </div>
            </div>

            {/* The tick is the only part of the RAIL that may carry status
                colour. The band, the track and the boundary marks stay
                neutral, so the one coloured thing on the bar is the reader's
                own reading. The status word above it carries the same level in
                `-ink`, which is the point: the colour is redundant to a word
                that is always there. Neither is the sole carrier, and the tick
                is thicker and rounder than a boundary mark so the two are told
                apart by shape before colour. `data-status` is the DOM contract
                the print stylesheet and every product-side test key on, and it
                is stamped here and on the status word alike.

                UNDER FORCED COLOURS THE FILL IS STRIPPED, so a background alone
                would erase the reading's position on the track, which is the one
                thing the picture exists to show. The tick keeps a fill by asking
                for the system `Highlight` colour, which a forced-colours palette
                honours, and carries an `outline` of `CanvasText` on top of it.
                The outline is a shape carrier and not a second colour, the same
                rule the status axis follows everywhere else, and it survives
                because forced colours keeps `outline` while it drops a fill. All
                four levels collapse to `Highlight` here, which costs nothing: the
                level travels in words on the StatusPill above the bar, and the
                summary sentence states the position in prose. The boundary marks
                take `CanvasText` by the same route, so both bounds and the
                reading stay drawn. */}
            <div
              data-slot="range-bar-tick"
              data-status={level}
              style={{ insetInlineStart: `${at(extent.reading).toFixed(3)}%` }}
              className={
                "absolute -top-opsin-1 -bottom-opsin-1 w-opsin-1 -translate-x-1/2 rounded-full rtl:translate-x-1/2 forced-colors:bg-[Highlight] forced-colors:[outline:1px_solid_CanvasText] " +
                (level === undefined ? "bg-foreground" : TICK_TONE[level])
              }
            />

            {/* THE READING LABEL IS A CHILD OF THE TRACK, NOT OF THE TICK, so
                the track bounds it the way it bounds the two boundary labels. It
                is a health value, so it is drawn at the `body` step
                tokens/type.json rules[1] fixes as the floor, a step larger than
                the boundary numbers below the track, which are axis labels and
                stay at caption1. It is centred on the tick, then clamped so its
                centre stays at least half a label from either track edge.
                `--rb-label-half` is declared on the wrapper as 3.5em, half a
                label plus a margin. Its em is resolved on this span rather than
                on the wrapper, because a custom property's relative unit is
                resolved where the `var()` is used, so the allowance sits at the
                reading's own `body` step and scales with it rather than being
                pinned to the wrapper's footnote em. It is a declared allowance
                and not a live measurement. A label up to 7em wide never leaves
                the track; a unit wider than that overhangs by the excess alone
                rather than by a whole label, and the tick keeps the true
                position underneath it. */}
            <span
              data-slot="range-bar-value"
              className="absolute bottom-full mb-opsin-2 -translate-x-1/2 whitespace-nowrap text-opsin-body rtl:translate-x-1/2"
              style={{
                insetInlineStart: `clamp(var(--rb-label-half), ${at(extent.reading).toFixed(3)}%, calc(100% - var(--rb-label-half)))`,
              }}
            >
              <Value
                value={value}
                unit={unit}
                precision={precision}
                locale={locale}
              />
            </span>
          </div>
        </div>
      )}

      {/* THE COMPONENT, in words. Present at every size, in the accessibility
          tree, in print and in a copy-paste, and never behind a prop. */}
      <p data-slot="range-bar-summary" className="m-0">
        {sentence ??
          pieces.map((piece, index) =>
            typeof piece === "string" ? (
              piece
            ) : (
              <Value
                key={index}
                value={piece.reading}
                unit={piece.unit}
                unitDisplay={piece.unitDisplay}
                precision={precision}
                locale={locale}
              />
            )
          )}
      </p>

      {provenance.length === 0 ? null : (
        /* FOOTNOTE, NOT CAPTION1. The type scale puts provenance lines and
           timestamps on the footnote step and reserves caption1 as the floor
           for axis labels, legends and legal text. This sentence is provenance,
           so it takes footnote and reads a step larger than the tick and
           boundary labels under the track, which are axis text and stay at
           caption1. The reader over sixty meets the least legible size only on
           the axis, never on the "when was this measured" line. */
        <p
          data-slot="range-bar-footnote"
          className="m-0 text-opsin-footnote text-muted-foreground"
        >
          {provenance.join(" ")}
        </p>
      )}
    </div>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the two states a reader of
 * this component most needs to see together: a reading against a range, and the
 * same reading with no range to compare it with. The second is the one that
 * gets built wrong, because the tempting repair is a typical adult band and a
 * small asterisk.
 *
 * The numbers are obviously unreal (ADR 0012) and the range cites the one string
 * an opsinjs example may cite. The demo gives the range no confirmation date, and
 * an undated range now says nothing about one in the footnote, because the sentence
 * above the bar already names who set the range. A plausible confirmation date is a
 * claim that would travel one `shadcn add` into somebody else's project, so the demo
 * invents none. A missing reading time is a different case and is still stated out
 * loud, which is what the second bar shows.
 *
 * The first reading carries the time it was taken and the second deliberately
 * does not, so both halves of the recency rule are on screen: a dated reading,
 * and a component saying outright that nobody knows when the other one was
 * taken rather than letting it be read as "now".
 */
export default function RangeBarDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-8">
      {/* Both bars fix locale="en-GB" so the reference capture reads the date
          day first, "14 March 2026", the order numbers-dates-and-time mandates,
          rather than the deploying server's default. A product passes its own
          locale; the demo pins one so the screenshot cannot teach the wrong
          order. Both carry it, not only the dated bar, so the reading's number
          separators are formatted by the same convention across the pair. */}
      <RangeBar
        label="Example measurement"
        value={14}
        unit="mg/dL"
        precision={0}
        range={{ low: 10, high: 20, source: EXAMPLE_SOURCE }}
        status="watch"
        category="labs"
        measuredAt="2026-03-14T08:12:00+00:00"
        locale="en-GB"
      />
      <RangeBar
        label="Second example measurement"
        value={14}
        unit="mg/dL"
        precision={0}
        locale="en-GB"
      />
    </div>
  )
}
