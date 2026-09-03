/**
 * RangeBar — where one reading sits against the range it is being compared
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
 * numbers the product supplied — a position along a line, and the word
 * "within", "above" or "below" for that position against the product's own
 * bounds. `status` is an INPUT. RangeBar never turns "above the range" into
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
 * than no band — the reader cannot tell the two apart.
 *
 * A BAR NEEDS TWO BOUNDS. A one-sided range ("up to 20") has no width, and a
 * width is what a scale is made of; drawing one would mean inventing the other
 * end. So the track appears only when both bounds are present and there is a
 * reading to put on it. Every other case renders the sentence and no picture,
 * which is the honest output rather than a degraded one.
 *
 * THE TWO AXES SIT ON DIFFERENT ELEMENTS, deliberately. `status` colours the
 * tick and nothing else; `category` tints the label and nothing else. Neither
 * ever reaches the track or the band, and no single element resolves both — a
 * heart-red bar beside an attention-red bar is the collision the two-axis rule
 * exists to prevent, and it is a collision the reader has no way to decode.
 *
 * NOTHING HERE ANIMATES. Not the tick sliding into position on first paint, not
 * the band growing, not the number counting up. A health value that arrives by
 * animation has displayed, for every frame of the journey, a reading that is
 * not true.
 */

import { Check, Eye, OctagonAlert, TriangleAlert } from "lucide-react"

import {
  CLINICAL_STATUS_META,
  EXAMPLE_SOURCE,
  HEALTH_CATEGORIES,
  isClinicalStatus,
  isDevelopment,
  isHealthCategory,
  spokenUnit,
  warnOnce,
  type ClinicalStatus,
  type HealthCategory,
  type ReferenceRange,
} from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
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
 * WHY THIS FILE DRAWS ITS OWN WORD AND GLYPH RATHER THAN EMBEDDING A PILL. The
 * status word here must survive a caller replacing `summary` with their own
 * sentence, so it cannot live inside the summary; and the level belongs beside
 * the label rather than in a chip of its own, because a bar that also carried a
 * pill would show a reader two competing objects for one assertion. The
 * vocabulary is still read from `CLINICAL_STATUS_META` and never restated, so
 * the two components cannot say different words for the same level.
 */
const ICONS: Record<ClinicalStatus, typeof Check> = {
  steady: Check,
  watch: Eye,
  attention: TriangleAlert,
  urgent: OctagonAlert,
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
 * The tick's fill, one class per level, written out rather than built.
 *
 * Tailwind reads class names out of source as literal strings, so
 * `bg-status-${level}` generates no CSS at all and the tick renders invisible
 * against the rail. The bare status name is the LINE role — the boundary
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
 * The status word and glyph beside the label.
 *
 * `-ink` rather than the line role, because this is text on the surface behind
 * the component rather than a stroke: the ink roles are the ones tuned to be
 * read, and they flip with the theme so the word stays legible in both.
 */
const STATUS_INK: Record<ClinicalStatus, string> = {
  steady: "text-status-steady-ink",
  watch: "text-status-watch-ink",
  attention: "text-status-attention-ink",
  urgent: "text-status-urgent-ink",
}

/**
 * The category tint, on the label and on nothing else.
 *
 * Category colour is IDENTITY — what this reading is about — and never a
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

/** One piece of the summary sentence: words, or a reading Value renders. */
type SummaryPiece = string | { reading: number | null; unit: string }

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
   * distinct from `0`, and renders the words rather than a tick at zero — a
   * mark at the bottom of a range is a reading, and a missing one is not.
   */
  value: number | null
  /**
   * Display symbol exactly as `tokens/units.json` spells it — "kg", "mmol/L",
   * "mg/dL". Every number this component renders goes through `Value`, which
   * resolves the spoken form from that table, so a listener hears "milligrams
   * per decilitre" rather than an improvised pronunciation.
   */
  unit: string
  /**
   * The range this reading is being compared with, and whose it is. Omit it
   * entirely when none is available: the component then draws no band, says so
   * in the summary, and substitutes nothing. `source` is required — a range
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
   * DECIMAL PLACES, from the precision of the measurement — the resolution of
   * the device, or the number of places the laboratory reported. Not
   * significant figures: the same metric shown to a different number of decimal
   * places at different magnitudes cannot be compared at a glance, which is
   * what `health/numbers-units-precision` rule 2 forbids.
   *
   * It applies to the reading and to the two boundary labels alike, because a
   * value and the bound it is being compared with are the same metric. Omitted,
   * nothing is rounded and nothing is padded.
   */
  precision?: number
  /**
   * When the measurement was taken, ISO 8601. Rendered as a date in the
   * footnote so that a number on a screen is not read as "now".
   *
   * There is NO staleness treatment here and no `staleAfterHours`: how old is
   * too old is clinical, differs by metric, and opsinjs does not own it. A
   * surface that needs one wraps the reading in `RelativeTime`, which takes the
   * boundary from you.
   */
  measuredAt?: string
  /**
   * Replaces the generated sentence — for a unit whose phrasing does not fit
   * the template, or for a reader whose language is not English. It cannot
   * remove the sentence: there is no value of this prop that renders the
   * component without one, because the sentence is the component.
   */
  summary?: string
  /**
   * BCP 47 locale for number separators, digit shapes and the dates in the
   * footnote. Passed through to every `Value` this component renders, so one
   * bar cannot show two conventions. Omitted, the reader's environment decides.
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
 * which is TRUE TO SCALE and is the information — a picture that clipped the
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
     what a scale is made of. Reported below, and drawn as words instead. */
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
 */
function positionOf(value: number, range: ReferenceRange): Position {
  if (range.low !== undefined && value < range.low) return "below"
  if (range.high !== undefined && value > range.high) return "above"
  return "within"
}

/** The range as a noun phrase, open at either end when only one bound is known. */
function rangePieces(range: ReferenceRange, unit: string): SummaryPiece[] {
  const { low, high } = range
  if (low !== undefined && high !== undefined) {
    return [{ reading: low, unit }, " to ", { reading: high, unit }]
  }
  if (high !== undefined) return ["up to ", { reading: high, unit }]
  if (low !== undefined) return [{ reading: low, unit }, " and upwards"]
  return []
}

/**
 * The sentence, in pieces, so that it can be both rendered and spoken.
 *
 * It is built once and used twice: as JSX, where each reading is a `Value` that
 * carries the unit's spoken form, and as a string for the graphic's accessible
 * name. Two hand-written copies of one sentence would be two sentences the
 * moment somebody edited one of them.
 *
 * It always states the reading, the range and the position, in that order, so
 * that it stands alone when it is read out of context — in a screen reader, in
 * a notification, in a printed summary — and it names whose range it is, which
 * is why `ReferenceRange.source` is required.
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
      ". We do not have a range to compare it with, so nothing here shows where it sits.",
    ]
  }
  return [
    `${label} is `,
    { reading: value, unit },
    `, ${positionOf(value, range)} the range `,
    ...rangePieces(range, unit),
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
    roundingMode: "halfExpand",
  }).format(reading)
}

/**
 * The sentence as one string, for the graphic's accessible name.
 *
 * Units are SPOKEN here rather than written: the accessible name is heard, and
 * "mmol/L" read out character by character is the failure `Value` exists to
 * prevent. A unit the table does not hold falls back to the symbol as written —
 * awkward to listen to, and true.
 */
function summaryText(
  pieces: SummaryPiece[],
  precision: number | undefined,
  locale: string | undefined,
): string {
  return pieces
    .map((piece) => {
      if (typeof piece === "string") return piece
      /* Mirrors `Value`'s own default wording for an absence. It is only ever
         reached in a state that renders no graphic and therefore no accessible
         name, and it is here so that this function is total rather than
         conditional on a caller's state. */
      if (piece.reading === null || !Number.isFinite(piece.reading)) return "no reading yet"
      const digits = digitsOf(piece.reading, precision, locale)
      return `${digits} ${spokenUnit(piece.unit, piece.reading) ?? piece.unit}`
    })
    .join("")
}

/**
 * A date, or the string as supplied when it is not one.
 *
 * `timeZone: "UTC"` rather than the reader's zone, because this renders on a
 * server and again in a browser: a date that resolved differently in the two
 * places would hydrate into a mismatch, and a provenance date that changes
 * under the reader is worse than one that is a few hours out.
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
  summary,
  locale,
  className,
}: RangeBarProps) {
  /* THE FIFTH LEVEL IS REFUSED, NOT APPROXIMATED. This file ships as source
     into JavaScript projects where a type is advice, and a level outside the
     four has no word, no glyph and no meaning — so the bar is drawn without a
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
     has never seen. The repair is to drop the range entirely — not to draw the
     band and omit the credit, which would leave the reader looking at a
     comparison with no author and no way to know that is what they are doing. */
  const attributed =
    range !== undefined && typeof range.source === "string" && range.source.trim() !== ""
  if (range !== undefined && !attributed) {
    warnOnce("OPSIN-0004", { component: "RangeBar" })
  }
  const compared = attributed ? range : undefined

  const extent = drawnExtent(compared, value)

  if (
    isDevelopment() &&
    compared !== undefined &&
    compared.low !== undefined &&
    compared.high !== undefined &&
    !(compared.high > compared.low)
  ) {
    console.warn(
      `[opsinjs] <RangeBar> was given low=${String(compared.low)} and ` +
        `high=${String(compared.high)}, which leaves the range no width to draw a ` +
        "scale from. The sentence still states both bounds; no bar was drawn, " +
        "because a line whose two ends are the same number puts every reading in " +
        "the same place.",
    )
  }

  /* Both boundary labels rounding to the same digits is not a drawing bug and
     is not repaired by quietly adding a decimal place: a number shown to more
     places than the measurement carries is an accuracy claim nobody made. It
     means the precision this metric is reported to cannot separate its own
     bounds, and the caller is the only one who can say what it should be. */
  if (
    isDevelopment() &&
    extent !== null &&
    digitsOf(extent.low, precision, locale) === digitsOf(extent.high, precision, locale)
  ) {
    console.warn(
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
     carried by a position on a line — which is nothing at all in a screen
     reader, on a printout, or to a reader who cannot see it. */
  const blankSummary = summary !== undefined && summary.trim() === ""
  if (blankSummary && isDevelopment()) {
    console.warn(
      '[opsinjs] <RangeBar> received summary="", which would render the bar with ' +
        "no sentence beside it. The generated sentence was used instead. The " +
        "wording is yours to replace; the sentence is not optional, because it is " +
        "the whole component for anybody who is not looking at the picture.",
    )
  }
  const sentence = summary !== undefined && !blankSummary ? summary : undefined
  const spokenSummary = sentence ?? summaryText(pieces, precision, locale)

  const StatusGlyph = level === undefined ? null : ICONS[level]

  const at = (point: number) =>
    extent === null ? 0 : ((point - extent.start) / (extent.end - extent.start)) * 100

  const asOf = compared?.asOf
  const footnote = compared !== undefined || measuredAt !== undefined

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
            property and silently drops the earlier. Verified —
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
            colour is redundant to, and not the other way round. */}
        {level !== undefined && StatusGlyph !== null ? (
          <span
            data-slot="range-bar-status"
            data-status={level}
            className={
              "inline-flex items-center gap-opsin-1 whitespace-normal text-opsin-footnote " +
              STATUS_INK[level]
            }
          >
            {/* Decorative. The word beside it carries the level, so announcing
                the glyph as well would say it twice. */}
            <StatusGlyph aria-hidden="true" className="size-[1em] shrink-0" />
            {CLINICAL_STATUS_META[level].word}
          </span>
        ) : null}
      </div>

      {extent === null ? null : (
        /* Padded in `em` rather than in a fixed measure, because what has to fit
           in it is text: the reading above the track and the two boundary
           labels below it, both of which grow with the reader's own type size.
           A rem here would hold its ground while the labels grew through it. */
        <div className="relative py-[1.75em] text-opsin-footnote">
          <div
            data-slot="range-bar-track"
            /* ONE LABELLED PICTURE, NOT A TREE OF SHAPES, and never a `slider`,
               a `meter` or a `progressbar`: all three announce a value a reader
               can inspect or move, and this is a drawing of a reading somebody
               else assigned. It is not focusable and it is not in the tab order,
               because a stop that does nothing is a stop every keyboard user
               pays for on every row of a list. The name is the summary
               sentence, which the reader also has in full underneath — the
               repetition is the cost of the picture having a name at all. */
            role="img"
            aria-label={spokenSummary}
            className="relative h-[0.9em] rounded-full border border-border bg-muted"
          >
            {/* THE BAND IS NEVER STATUS-COLOURED. It is the range, which is a
                fact about a laboratory rather than about the reader, and a
                coloured band is read as a verdict on everything inside it. The
                border is what carries it in print, where the fill is dropped. */}
            <div
              data-slot="range-bar-band"
              style={{
                insetInlineStart: `${at(extent.low).toFixed(3)}%`,
                inlineSize: `${(at(extent.high) - at(extent.low)).toFixed(3)}%`,
              }}
              className="absolute inset-y-0 rounded-full border border-border bg-background"
            />

            {[extent.low, extent.high].map((bound) => (
              <div
                key={bound}
                data-slot="range-bar-mark"
                style={{ insetInlineStart: `${at(bound).toFixed(3)}%` }}
                className="absolute -top-opsin-1 -bottom-opsin-1 w-px -translate-x-1/2 bg-muted-foreground rtl:translate-x-1/2"
              >
                <span className="absolute top-full mt-opsin-1 start-1/2 -translate-x-1/2 whitespace-nowrap text-opsin-caption1 text-muted-foreground rtl:translate-x-1/2">
                  <Value
                    value={bound}
                    unit={unit}
                    precision={precision}
                    locale={locale}
                  />
                </span>
              </div>
            ))}

            {/* The tick is the only part that may carry status colour, and it is
                thicker and rounder than a boundary mark so the two are told
                apart by shape before colour. `data-status` is the DOM contract
                the print stylesheet and every product-side test key on. */}
            <div
              data-slot="range-bar-tick"
              data-status={level}
              style={{ insetInlineStart: `${at(extent.reading).toFixed(3)}%` }}
              className={
                "absolute -top-opsin-1 -bottom-opsin-1 w-opsin-1 -translate-x-1/2 rounded-full rtl:translate-x-1/2 " +
                (level === undefined ? "bg-foreground" : TICK_TONE[level])
              }
            >
              <span
                data-slot="range-bar-value"
                className="absolute bottom-full mb-opsin-1 start-1/2 -translate-x-1/2 whitespace-nowrap rtl:translate-x-1/2"
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
                precision={precision}
                locale={locale}
              />
            )
          )}
      </p>

      {footnote ? (
        <p
          data-slot="range-bar-footnote"
          className="m-0 text-opsin-caption1 text-muted-foreground"
        >
          {compared === undefined
            ? null
            : asOf === undefined
              ? /* Never today's date, and never silence. A range nobody has
                   dated may have been superseded, and the reader is the person
                   entitled to know that nobody knows. */
                "We do not know when this range was last confirmed."
              : `This range was last confirmed on ${formatDate(asOf, locale)}.`}
          {measuredAt === undefined
            ? null
            : ` This reading was taken on ${formatDate(measuredAt, locale)}.`}
        </p>
      ) : null}
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
 * an opsinjs example may cite. No date is given for the range either, so the
 * demo also shows what the footnote says when nobody knows: this file is one
 * `shadcn add` away from somebody else's project, and a plausible confirmation
 * date is a claim that would travel with it.
 */
export default function RangeBarDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-8">
      <RangeBar
        label="Example measurement"
        value={14}
        unit="mg/dL"
        precision={0}
        range={{ low: 10, high: 20, source: EXAMPLE_SOURCE }}
        status="watch"
        category="labs"
      />
      <RangeBar
        label="Second example measurement"
        value={14}
        unit="mg/dL"
        precision={0}
      />
    </div>
  )
}
