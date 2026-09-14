/**
 * TrendSparkline is a line through readings somebody else took, and a sentence
 * that says what the line shows without saying whether it is welcome news.
 *
 * A sparkline is a claim that a pattern exists, and four points with a slope
 * look exactly like forty points with a slope. Most of this file is about
 * refusing to draw a line the data does not support, and about making sure the
 * words beside the line carry everything the line carries.
 *
 * THE CAPTION IS THE COMPONENT. There is no prop that turns it off, no
 * `sr-only` variant of it and no `showCaption={false}`, because a graphic has no
 * word in it at all. That is worse off than a status pill, whose measured
 * problem is only that four hues cannot be told apart. A reader who cannot see
 * the plot must lose the picture and keep the information. What that promise
 * does NOT survive is `className`: it is merged onto the root with
 * `tailwind-merge`, so a caller who passes `hidden`, `sr-only` or a
 * `[&_[data-slot=…]]:hidden` variant removes the sentence, and nothing here can
 * stop them. That is stated on the page rather than claimed away.
 *
 * NOTHING HERE IS DERIVED FROM A NUMBER THIS FILE CHOSE. There is no reference
 * range, no smoothing, no minimum point count and no rule about how much
 * movement counts as movement. `minimumPoints` and `changeThreshold` both come
 * from the caller: the first is required, and without the second this component
 * prints both endpoints and names no direction at all. Naming a direction from
 * any difference whatever would mean this file had picked a change threshold of
 * zero and applied it to somebody else's metric, which doctrine gives to the
 * metric and not to us.
 *
 * A BAND NEEDS BOTH OF ITS ENDS. A one-sided range is a real range and it is
 * drawn as words, never as a rectangle with an edge this file supplied: taking
 * the missing bound from the data extent or from zero and then telling the
 * reader in the caption that the whole band came from their laboratory credits
 * that laboratory with a number it never gave.
 *
 * THE VISIBLE STATUS AXIS IS NOT DRAWN. `TrendPoint.status` decides which
 * reading is emphasised and what the caption says about it. It puts no status
 * colour on the marker, no status glyph on the plot and no status word there.
 * The rule that forces this is the four-carrier rule. A visible status is
 * colour AND a glyph AND the word, and a six-pixel dot can hold none of the
 * three legibly, so the whole visible verdict is rendered where all three fit,
 * as a StatusPill inside the caption, and the plot stays a picture of numbers.
 * The fourth carrier, `data-status`, is different in kind because it draws
 * nothing: it is the DOM contract the print stylesheet, the greyscale audit and
 * every product test read the level from. That one is stamped on the flagged
 * dot, since a status surface has to be findable where the flagged reading is,
 * and to keep the two colour axes off one element the dot gives up the category
 * tint the line already carries and is drawn in the neutral foreground instead.
 * See the comment on `flagged` below, which is where that decision lives.
 *
 * NOTHING ANIMATES. Not the path, not the marker, not on first paint and not on
 * a change. A path that draws its own length reads as time passing and implies
 * progress; there is no reduced-motion fallback here because there is nothing to
 * fall back from.
 */

import {
  CLINICAL_STATUS_META,
  HEALTH_CATEGORIES,
  isClinicalStatus,
  isDevelopment,
  isHealthCategory,
  spokenUnit,
  warnOnce,
  type HealthCategory,
  type ReferenceRange,
  type TrendPoint,
} from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { StatusPill } from "@/registry/base-lyra/ui/status-pill"
import { Value } from "@/registry/base-lyra/ui/value"

/**
 * Direction is a fact about the series measured against the caller's own change
 * threshold. Valence is a judgement, and not ours.
 *
 * All four members are the vocabulary a product may use in a caption of its own.
 * This component produces `up`, `down` and `level`, and only when the caller has
 * said how much movement counts as movement. See `directionOf`. `unsettled` is
 * unreachable from here, because deciding a series is unsettled needs a noise
 * measure that no prop carries.
 */
export type TrendDirection = "up" | "down" | "level" | "unsettled"

/**
 * The drawing surface, in the SVG's own user units.
 *
 * Unitless on purpose: the plot is stretched to whatever width it is given, so
 * these are proportions rather than sizes. The inset keeps the stroke off the
 * edge. Strokes here are drawn in screen pixels rather than user units (see
 * `vectorEffect` below), so without it the topmost reading's line would be
 * sliced in half by the viewBox boundary at every rendered size.
 */
const PLOT_WIDTH = 100
const PLOT_HEIGHT = 32
const PLOT_INSET = 3

/**
 * The category tint for the line, written out because Tailwind reads class
 * names out of source as literal strings: `stroke-category-${category}-line`
 * generates no CSS at all and the line renders in the inherited colour.
 *
 * The `-line` role rather than the bare category name. The bare name resolves to
 * `-accent`, which is an identity fill chosen for recognition rather than for
 * contrast, and a chart line is held to the non-text contrast floor against the
 * surface behind it. `-line` is the role that was measured for exactly that.
 *
 * There is no status entry in this table and there never will be one. The whole
 * table is one axis.
 */
const LINE_TINT: Record<HealthCategory, string> = {
  sleep: "stroke-category-sleep-line",
  heart: "stroke-category-heart-line",
  activity: "stroke-category-activity-line",
  nutrition: "stroke-category-nutrition-line",
  mind: "stroke-category-mind-line",
  labs: "stroke-category-labs-line",
}

/**
 * The direction word, in the reader's language rather than the API's.
 *
 * `unsettled` is in the table because it is in the type and a caller may write a
 * caption using it. This component never selects it.
 */
const DIRECTION_WORD: Record<TrendDirection, string> = {
  up: "Up",
  down: "Down",
  level: "Unchanged",
  unsettled: "Unsettled",
}

/**
 * Which development warnings this session has already printed.
 *
 * `tokens/errors.json` states the policy: development only, once per offending
 * call site. The six complaints below all live in a render body. Without a
 * keyed set they print on every render and twice again under Strict Mode, and a
 * row of sparkline tiles fed from one bad series is the largest concentration
 * of them in the registry: an author would have the console full before they
 * reached the first message, and a channel somebody filters is a channel that
 * no longer carries its one real finding.
 *
 * It is a module-local set rather than the substrate's `warnOnce` because
 * `warnOnce` is keyed to an `OpsinErrorCode` and none of the six has one.
 * OPSIN-0004, OPSIN-0010, OPSIN-0012 and the OPSIN-0011/0021 pair are the four
 * that do have one, and they go through `warnOnce` and not through here.
 * Allocating codes in `tokens/errors.json` for the rest and deleting this is a
 * strict improvement.
 *
 * EVERY KEY NAMES THE MISTAKE, NEVER THE SERIES. Keying on a reading or a
 * timestamp would turn "warn once" into "warn every render", because the next
 * tile along carries different data and the same defect. So the keys are the
 * rejected prop value where there is one, and a constant where the message
 * interpolates nothing. The rejected prop value ranges over the handful of
 * values a caller gets wrong.
 *
 * Declared rather than created, the way `warnOnce` does it in the substrate: in
 * a production bundle `isDevelopment()` is statically false, every body that
 * touches this is dead code, and the set is never allocated.
 */
let warnedDev: Set<string> | undefined

function warnDevOnce(key: string, message: string): void {
  if (warnedDev?.has(key) === true) return
  warnedDev ??= new Set<string>()
  warnedDev.add(key)
  console.warn(message)
}

/**
 * The formatter's ceiling, and the same one `Value` uses. It applies only when
 * a JavaScript caller passed a `precision` that is not a usable count of decimal
 * places; a TypeScript caller cannot, because the prop is required and typed as
 * a number. In every ordinary render this component takes the stated precision
 * and formats both the caption and this accessible name to it, so a rounding
 * decision the component was once not entitled to make is now the caller's,
 * carried by the prop and forwarded rather than guessed.
 */
const MAX_FRACTION_DIGITS = 20

/**
 * A number for the accessible name, written the way `Value` writes the same
 * number in the caption below it, and to the same stated precision.
 *
 * The spoken name and the printed sentence have to say one number one way, so
 * this takes the component's `precision` and formats to that many decimal
 * places, exactly as the caption's `Value` does. A reader who cannot see the
 * caption is owed the reading it shows, not the seventeen digits an arithmetic
 * result carries. A bare `String()` would also print a full stop where a de-DE
 * reader's locale writes a comma. Separators and grouping are never hand-rolled.
 *
 * Rounding is `halfExpand`, the round-half-away-from-zero that
 * `numbers-units-precision` rule 3 specifies, and it is INHERITED rather than
 * named. `roundingMode` is an ES2023
 * addition to `Intl.NumberFormatOptions`, so spelling it out here makes this
 * file fail to typecheck in a consumer whose `lib` stops at ES2022, and this
 * file ships as source into those projects. `halfExpand` is the formatter's own
 * default, so the behaviour is identical either way; see the longer note in
 * `value.tsx`, which records where the regression was found. Do not put it back.
 */
function formatNumber(value: number, locale: string | undefined, precision: number): string {
  /* Fixed decimal places, both bounds set to the stated precision, so the spoken
     name pads and rounds exactly as the caption's `Value` does. `places` falls
     back to `undefined` only for a precision a JavaScript caller passed that is
     not a whole count from 0 to the ceiling, in which case the formatter is
     opened all the way rather than throwing, and `Value` raises the warning in
     the caption below. This mirrors `value.tsx` so the two cannot drift. */
  const places =
    Number.isInteger(precision) && precision >= 0 && precision <= MAX_FRACTION_DIGITS
      ? precision
      : undefined
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: places,
    maximumFractionDigits: places ?? MAX_FRACTION_DIGITS,
  }).format(value)
}

/**
 * A date, or `undefined` when the timestamp is not one.
 *
 * `timeZone: "UTC"` rather than the reader's zone, because this renders on a
 * server and again in a browser: a date that resolved differently in the two
 * places would hydrate into a mismatch, and a date on somebody's reading that
 * moves under them is worse than one that is a few hours out. Same treatment as
 * the sibling components' provenance dates, for the same reason.
 */
function formatDate(iso: string, locale: string | undefined): string | undefined {
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) return undefined
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(instant)
}

/** A reading that survived to be drawn: a finite value with a position. */
interface PlottedReading {
  /** Index into the caller's `series`, so a marker can be traced back. */
  index: number
  value: number
  x: number
  y: number
}

/** A reading that was taken and is a number. */
function isReading(point: TrendPoint): boolean {
  return point.value !== null && Number.isFinite(point.value)
}

/** An entry the caller says nobody recorded. `null` is the shape the API asks for. */
function isGap(point: TrendPoint): boolean {
  return point.value === null
}

/**
 * An entry that says a reading was taken and did not survive the trip.
 *
 * A FAILURE IS NOT AN ABSENCE. A parse that produced nothing, or a division with
 * no divisor, arrives here as a non-finite number, and folding it into the gap
 * count would tell a reader they recorded nothing on a day they did record
 * something. `uncertainty-and-staleness` rule 6 keeps the two sentences apart:
 * "we could not load this" is not "you have not recorded any readings yet".
 * `Value` keeps the same three states apart for a single number, so the series
 * has to keep them apart too. Counted separately and said separately.
 */
function isBrokenReading(point: TrendPoint): boolean {
  return point.value !== null && !Number.isFinite(point.value)
}

/**
 * One run of consecutive readings as SVG path data.
 *
 * A run of one becomes `M x y L x y`, a zero-length segment, which a round line
 * cap renders as a dot of the stroke's own width.
 */
function pathFor(run: PlottedReading[]): string {
  const head = run.at(0)
  if (head === undefined) return ""
  const move = `M ${String(head.x)} ${String(head.y)}`
  const rest = run
    .slice(1)
    .map((reading) => `L ${String(reading.x)} ${String(reading.y)}`)
    .join(" ")
  return rest === "" ? `${move} L ${String(head.x)} ${String(head.y)}` : `${move} ${rest}`
}

/**
 * Direction, from the first real reading to the last, against the change the
 * caller says counts as a change.
 *
 * FIRST AND LAST, NOT A FITTED SLOPE. A regression line is a better summary of a
 * noisy series and a worse thing to print beside one, because a reader cannot
 * check it against the picture. The content guidance for this component asks for
 * a caption whose every word can be checked against the plot, and first-to-last
 * is the only summary that qualifies.
 *
 * `smallestChange` IS THE CALLER'S, ALWAYS. This function is called only when
 * the caller supplied one. Doctrine gives the metric the job of declaring the
 * difference below which a series is presented as unchanged. Below that noise
 * floor, "about the same as last week" is the true statement. A component that
 * answered it would be applying a change threshold of zero to a weight
 * series where a hundred grams is the scale's own resolution. With none
 * supplied there is no direction word at all: the caption prints both endpoints
 * and the accessible name says "with no clear direction", which is the wording
 * `content/alt-text-and-descriptions` gives for this case.
 */
function directionOf(first: number, last: number, smallestChange: number): TrendDirection {
  if (Math.abs(last - first) < smallestChange) return "level"
  if (last > first) return "up"
  if (last < first) return "down"
  return "level"
}

export interface TrendSparklineProps {
  /**
   * What was measured, in the reader's language. It names the subject in the
   * plot's accessible name, which is otherwise a description of a line with no
   * subject. It is deliberately not drawn: the anatomy has no label part, and
   * the surface a sparkline sits in has already said what it is about.
   */
  label: string
  /**
   * Unit symbol as `tokens/units.json` spells it, such as "bpm", "mmol/L" or
   * "steps". Every reading in the caption is rendered through `Value`, which
   * resolves the spoken form from that table so a screen reader says
   * "millimoles per litre" rather than improvising.
   */
  unit: string
  /**
   * Decimal places, from the precision of the measurement. That is the
   * resolution of the device, or the number of places the laboratory reported,
   * and never a number chosen at render time. Required, so a TypeScript caller
   * cannot omit it: a reading that arrived from arithmetic can carry seventeen
   * digits, and a caption is exactly where those show. Forwarded untouched to
   * every `Value` this component renders. A JavaScript caller who omits it gets
   * the digits it was handed plus a development warning from `Value`.
   *
   * The caption also prints the band bounds the caller supplied on `range`,
   * and this same precision is applied to them as well as to the readings. A
   * bound stated to more places than the measurement carries is therefore shown
   * rounded to this precision rather than to its own, so a product whose source
   * range is finer than its reading precision should state that range in the
   * precision it was given.
   */
  precision: number
  /**
   * The readings, in chronological order. A gap is an explicit entry with
   * `value: null`, never an omitted one: an entry missing from the array is one
   * this component cannot know about, and a line drawn straight through it
   * asserts a measurement nobody took.
   *
   * An entry whose value is a number but not a finite one is a failure rather
   * than a gap, is counted and described as one, and is not drawn.
   */
  series: TrendPoint[]
  /**
   * How many real readings there must be before a line may be drawn at all.
   *
   * Required, with no default, and the omission is the point. How many readings
   * make a trend depends on what was measured, how often it is measured and who
   * is reading it. That is a number opsinjs cannot know and must never guess.
   * Below it this component draws nothing and says so, naming your number and
   * the count it actually has.
   */
  minimumPoints: number
  /**
   * The period the series covers, as the reader should see it, such as "the
   * last 14 days". A display string rather than a duration, which has a
   * consequence worth knowing: the x-axis is the extent of the series you
   * passed, not the extent of this period, so two sparklines are only
   * comparable side by side when their series cover the same span.
   */
  window: string
  /**
   * The smallest difference this metric counts as a change, in the reading's own
   * unit. There is no default, and without it the caption names no direction.
   *
   * A metric declares the difference below which a series is presented as
   * unchanged; below that noise floor "about the same" is the true sentence.
   * Supplied, the caption reads "Up, from … to …"; omitted, it prints both
   * endpoints and stops, and the accessible name says "with no clear direction".
   * Zero is a legitimate value and means your metric counts any difference at
   * all. It still has to be your product saying so, not this file.
   */
  changeThreshold?: number
  /**
   * An interval to shade behind the line, in neutral tones. Never
   * status-coloured, and never invented: omit it and no band is drawn. Its
   * `source` is required and is named in the caption, because a shaded band with
   * no owner is an assertion with no author.
   *
   * A band is drawn only when BOTH bounds are present and the lower is below the
   * upper. A one-sided range is stated in the caption as words such as "10
   * steps and above", and it is drawn as nothing, because the missing edge
   * would have to come from the data or from zero and would then be attributed
   * to your source.
   */
  range?: ReferenceRange
  /**
   * Tints the line so it is findable in a grid of six. It is identity, not
   * meaning: in greyscale the tint is lost and nothing else is.
   */
  category?: HealthCategory
  /**
   * Your own sentence, in place of the composed one. Use it when you have a
   * cadence, a phrasing or a comparison this component cannot know about.
   *
   * It replaces the direction-and-magnitude sentence. It does not replace the
   * coverage clause (how many readings there are and what is missing), the
   * clause naming a marked reading, or the clause naming a range's source.
   * Those are appended either way, because a count of absent measurements, a
   * status and an attribution are not decoration. Where there are too few
   * readings to draw, your sentence is appended to the refusal rather than
   * replacing it: the refusal is the one sentence that explains why there is no
   * picture.
   */
  caption?: string
  /**
   * BCP 47 locale for number separators, digit shapes and the date in the
   * caption. Passed through to every `Value` this component renders and used for
   * the plot's accessible name, so the spoken name and the printed sentence
   * cannot show two conventions. Omitted, the reader's environment decides.
   */
  locale?: string
  /**
   * Merged onto the root with `tailwind-merge`, and a class you pass wins where
   * the two conflict. That includes `hidden` and `sr-only`, and it includes a
   * variant that targets the caption's `data-slot`: this prop reaches the whole
   * subtree, and a caller who hides the caption hides the text twin. Nothing in
   * this component prevents it and no gate checks for it.
   */
  className?: string
}

export function TrendSparkline({
  label,
  unit,
  precision,
  series,
  minimumPoints,
  window: windowLabel,
  changeThreshold,
  range,
  category,
  caption,
  locale,
  className,
}: TrendSparklineProps) {
  /* `window` is bound to a differently named local on purpose. The prop is
     called `window` because that is the right word in the API, and a parameter
     of that name shadows the global for the whole function body. So a future
     SSR guard written here as `typeof window === "undefined"` would read the
     prop, get "string", and take the client branch on the server without ever
     reporting. This file is copied into consumer projects and edited there. */
  const points = Array.isArray(series) ? series : []
  const readings = points.filter(isReading)
  const gaps = points.filter(isGap).length
  const brokenReadings = points.filter(isBrokenReading).length

  if (isDevelopment()) {
    for (const point of points) {
      if (!isBrokenReading(point)) continue
      warnDevOnce(
        `broken-reading:${String(point.value)}`,
        `[opsinjs] <TrendSparkline> received ${String(point.value)} as a reading ` +
          `at ${String(point.at)}, which is not a finite number. It has not been ` +
          "drawn, and it is counted and described to the reader as a reading that " +
          "could not be read rather than as a gap. A gap means nobody took a " +
          "reading, and this one says a reading was taken and did not survive the " +
          "trip. Pass `value: null` for a gap and fix the pipeline for the rest.",
      )
    }
  }

  /* An unknown category is refused rather than approximated. This file ships as
     source into JavaScript projects where the union is advice, and a category
     nobody has a ramp for renders an untinted line. That is honest, and is
     better than a `stroke-category-cycle-line` class that generates no CSS and
     leaves the reader wondering why one tile in the grid came out grey. */
  const tinted: HealthCategory | undefined = isHealthCategory(category) ? category : undefined
  if (category !== undefined && tinted === undefined) {
    warnOnce("OPSIN-0010", {
      category: String(category),
      known: HEALTH_CATEGORIES.join(", "),
    })
  }
  const tint = tinted === undefined ? undefined : LINE_TINT[tinted]

  /* OPSIN-0004, at its enforcement point. The type makes `source` required, and
     the type is advice in a JavaScript project. So the check is for the caller
     who has none, and the repair is to draw NO BAND rather than an unowned one.
     A shaded interval with no attribution is the consuming product asking this
     system to vouch for a comparison it has never seen. */
  const rangeOwner = range?.source?.trim()
  const rangeIsOwned = range !== undefined && rangeOwner !== undefined && rangeOwner !== ""
  if (range !== undefined && !rangeIsOwned) {
    warnOnce("OPSIN-0004", { component: "TrendSparkline" })
  }

  /* A BAND NEEDS BOTH ENDS, AND THEY HAVE TO BE IN ORDER.
     `ReferenceRange` says an omitted bound renders as an open end, never as zero
     and never as an assumed limit. A rectangle has four edges, so a one-sided
     range drawn as one would take its missing edge from the data extent or from
     zero and the caption would then credit the caller's source with a bound it
     never gave. The honest rendering of an open end here is the words in the
     caption; the picture declines. Equal or inverted bounds have no width and go
     the same way. */
  const bandLow = rangeIsOwned ? range.low : undefined
  const bandHigh = rangeIsOwned ? range.high : undefined
  const bandBounds: number[] =
    bandLow !== undefined && bandHigh !== undefined && bandHigh > bandLow
      ? [bandLow, bandHigh]
      : []
  const bandIsClosed = bandBounds.length > 0
  if (rangeIsOwned && !bandIsClosed && isDevelopment()) {
    warnDevOnce(
      "range-not-shadeable",
      "[opsinjs] <TrendSparkline> was given a `range` it cannot shade: a band " +
        "needs a lower bound and an upper bound, with the lower below the upper. " +
        "The interval has been stated in the caption in words instead, open end " +
        "and all. It has NOT been drawn with an edge this component supplied, " +
        "because that edge would then be attributed in the caption to your " +
        "source, which never gave it.",
    )
  }

  /* THE RULE ABOUT DRAWING, AND IT FAILS TOWARDS NOT DRAWING.
     A `minimumPoints` that is not a whole number above zero is a caller who has
     not decided, and a component that treats "not decided" as "no rule" draws a
     two-point line. So an unusable value refuses the line, the same as too few
     readings, and the caption says which of the two happened. */
  const ruleIsUsable = Number.isInteger(minimumPoints) && minimumPoints > 0
  if (!ruleIsUsable && isDevelopment()) {
    warnDevOnce(
      `minimum-points:${String(minimumPoints)}`,
      `[opsinjs] <TrendSparkline> received minimumPoints=${String(minimumPoints)}. ` +
        "It is the number of real readings your product requires before a line may " +
        "be drawn, so it has to be a whole number above zero. No line was drawn, " +
        "because a component with no rule about when a trend exists has no basis " +
        "for drawing one. There is deliberately no default to fall back on: how " +
        "many readings make a trend depends on what was measured.",
    )
  }
  const enoughReadings = ruleIsUsable && readings.length >= minimumPoints

  /* OPSIN-0012 fires here even though nothing was drawn, and the code's own
     title says "a trend was drawn from too few points". The wording is aimed at
     the defect this component makes structurally impossible; the situation the
     code describes is a caller with fewer readings than their own rule allows,
     which is exactly this one. OPSIN-0012 is the only code in the table
     allocated to this component. A developer whose sparkline has silently
     become a sentence is entitled to know why. */
  if (ruleIsUsable && !enoughReadings) {
    warnOnce("OPSIN-0012", { count: readings.length, minimum: minimumPoints })
  }

  /* THE CHANGE THRESHOLD IS THE CALLER'S OR THERE IS NO DIRECTION WORD.
     Same failure direction as `minimumPoints`, and for the same reason: a value
     that is not a finite number at or above zero is a caller who has not
     decided, and the repair is to say less rather than to guess. */
  const smallestChange =
    changeThreshold !== undefined &&
    Number.isFinite(changeThreshold) &&
    !(changeThreshold < 0)
      ? changeThreshold
      : undefined
  if (changeThreshold !== undefined && smallestChange === undefined && isDevelopment()) {
    warnDevOnce(
      `change-threshold:${String(changeThreshold)}`,
      `[opsinjs] <TrendSparkline> received changeThreshold=${String(changeThreshold)}. ` +
        "It is the smallest difference your metric counts as a change, in the " +
        "reading's own unit, so it has to be a finite number that is not below " +
        "zero. No direction word was printed: the caption gives both endpoints " +
        "and stops. There is deliberately no default, because a difference small " +
        "enough to be the instrument's own noise is a property of what was " +
        "measured.",
    )
  }

  /* THE X-AXIS IS THE SERIES' OWN EXTENT, and it cannot be anything else.
     `window` is a display string, so this component is never told how long the
     period actually is and cannot lay the readings out against it. Timestamps
     are used where they parse AND run forwards across the WHOLE array, not
     merely at its two ends: a middle reading dated before the first one produces
     a fraction below zero, and with `overflow-visible` on the plot that segment is
     drawn outside this component, over whatever sits beside it. Where the check
     fails, position falls back to the index, which is at least stable. The
     consequence is that two sparklines side by side are only comparable when
     their series cover the same span, and it is stated on the page, because the
     repair is a duration prop that the specification does not have. */
  const times = points.map((point) => Date.parse(String(point.at)))
  const firstTime = times.at(0)
  const lastTime = times.at(-1)
  const timesRunForwards = times.every(
    (time, index) => index === 0 || time >= times[index - 1],
  )
  const timesUsable =
    firstTime !== undefined &&
    lastTime !== undefined &&
    times.every((time) => Number.isFinite(time)) &&
    timesRunForwards &&
    lastTime > firstTime
  if (!timesUsable && points.length > 1 && isDevelopment()) {
    warnDevOnce(
      "timestamps-not-chronological",
      "[opsinjs] <TrendSparkline> could not read its timestamps as a run of ISO " +
        "dates that never goes backwards, so the readings have been spaced evenly " +
        "by their position in the array instead. A gap will therefore sit at the " +
        "wrong place along the line. `TrendPoint.at` is an ISO 8601 timestamp and " +
        "the series is chronological.",
    )
  }

  const xAt = (index: number): number => {
    if (points.length <= 1) return PLOT_WIDTH / 2
    const usable = PLOT_WIDTH - PLOT_INSET * 2
    const at = times.at(index)
    const fraction =
      timesUsable && at !== undefined
        ? (at - firstTime) / (lastTime - firstTime)
        : index / (points.length - 1)
    return PLOT_INSET + fraction * usable
  }

  /* THE Y-AXIS INCLUDES ZERO, ALWAYS, and that is the whole of the honesty here.
     Scaling to the data's own smallest and largest reading is what every
     sparkline library does and it is what this component's safety callout
     forbids: it converts ordinary variation into a full-height event, and a
     reader has no way to tell a two-per-cent wobble from something that
     happened. Anchoring at zero means many real series draw as a nearly flat
     line. That is the honest picture, and why the caption carries the
     magnitude in words. There is no `yAxisMin` prop for a caller to reach for
     either; OPSIN-0013 is the code for the mistake this API cannot express.

     A band that IS drawn widens the scale so that it fits. A band that is not
     drawn does not touch the scale at all, because a bound nobody is shown must
     not move the picture either. */
  const magnitudes = readings.flatMap((point) =>
    point.value === null ? [] : [point.value],
  )
  const low = Math.min(0, ...magnitudes, ...bandBounds)
  const high = Math.max(0, ...magnitudes, ...bandBounds)
  const spanY = high - low
  const yAt = (value: number): number => {
    if (spanY <= 0) return PLOT_HEIGHT / 2
    const usable = PLOT_HEIGHT - PLOT_INSET * 2
    return PLOT_HEIGHT - PLOT_INSET - ((value - low) / spanY) * usable
  }

  const plotted: PlottedReading[] = []
  points.forEach((point, index) => {
    const value = point.value
    if (value === null || !Number.isFinite(value)) return
    plotted.push({ index, value, x: xAt(index), y: yAt(value) })
  })

  /* THE LINE BREAKS AT EVERY GAP, and the break is a real one in the path data
     rather than a lighter stroke or a dotted segment. A subpath is opened at
     each run of consecutive readings and closed by the first gap after it, so a
     fortnight of absent data leaves a fortnight of absent line. A reading that
     arrived broken breaks the line the same way, because it cannot be given a
     position. The difference between the two is carried by the words.

     A run of exactly one reading becomes a zero-length subpath, which with a
     round line cap renders as a dot. That is deliberate: an isolated reading
     between two gaps did happen, and drawing nothing for it would lose a
     measurement rather than decline to invent one. */
  const subpaths: string[] = []
  const gapEdges: PlottedReading[] = []
  let run: PlottedReading[] = []
  let cursor = 0
  let sawGap = false
  for (const point of points) {
    if (isReading(point)) {
      const reading = plotted.at(cursor)
      cursor += 1
      if (reading !== undefined) {
        /* A run opened straight after a non-reading entry: its first reading is
           the near side of a hole, so it earns a gap-edge dot. */
        if (run.length === 0 && sawGap) gapEdges.push(reading)
        run.push(reading)
      }
      continue
    }
    if (run.length > 0) {
      subpaths.push(pathFor(run))
      /* A run closed by a non-reading entry: its last reading is the far side of
         a hole, so it earns a gap-edge dot too. */
      const tail = run.at(-1)
      if (tail !== undefined) gapEdges.push(tail)
    }
    run = []
    sawGap = true
  }
  if (run.length > 0) subpaths.push(pathFor(run))

  /* GAP-EDGE DOTS, so a hole reads 'reading, nothing, reading' rather than
     'line, hole, line'. A gap has no position, so no segment is drawn into or
     out of it: one null in six entries removes two of five intervals, and the
     absence draws larger than it is. A small dot on the reading each side of a
     hole restores the count the caption states, without asserting a value the
     line cannot span. The series' own first and last readings are the ends of
     the picture rather than the edges of a hole, so they are dropped; a single
     reading marooned between two holes is pushed from both sides, so it is
     deduped to one dot. These dots carry the line's category tint and never a
     status: they say a reading was taken here, which is a fact about coverage
     and not a verdict (the rule by the marked reading above). */
  const firstPlottedIndex = plotted.at(0)?.index
  const lastPlottedIndex = plotted.at(-1)?.index
  const seenGapEdge = new Set<number>()
  const gapEdgeMarks = gapEdges.filter((reading) => {
    if (reading.index === firstPlottedIndex || reading.index === lastPlottedIndex) {
      return false
    }
    if (seenGapEdge.has(reading.index)) return false
    seenGapEdge.add(reading.index)
    return true
  })

  /* THE MARKED READING, AND WHAT THE PLOT DOES AND DOES NOT PUT ON IT.
     A visible status is carried by colour AND a glyph AND the word, three
     carriers and never fewer, because the measured colour-vision audit in
     tokens/color.json finds two of the four levels indistinguishable under
     deuteranopia and in greyscale. A marker on a sparkline can hold the colour
     and nothing else, so it holds none of the three: the visible verdict is
     rendered as a StatusPill inside the caption, where all three fit, and the
     plot draws no status colour, no status glyph and no status word. The
     specification permits a status colour on the point and does not require it,
     and taking that permission would be shipping a red dot that a substantial
     minority of readers cannot tell from an amber one.

     THE FOURTH CARRIER IS STAMPED, NOT DRAWN. `data-status` is the DOM contract
     the print stylesheet, the greyscale audit and every product-side test read
     the level from, and it draws nothing, so it does belong on the plot. It is
     stamped on the flagged value dot below, which is the one element that
     genuinely is the flagged reading. Because the two colour axes may never
     share an element and `data-status` is the status axis, the flagged dot gives
     up the category tint it used to borrow from the line and is drawn in the
     neutral foreground, heavier and ringed so it still reads as the emphasised
     point. The category axis stays on the line, where it always was.

     A LEVEL OUTSIDE THE FOUR MARKS NOTHING. `unknown` is the likeliest wrong
     answer and it is the absence of an assertion rather than a fifth level, so a
     reading carrying it would otherwise keep the emphasis, which is the halo
     and the heavier marker, while StatusPill declined to render the word.
     Emphasis with no word beside it is this file's own argument turned inside
     out, so the selection is gated on the same predicate the pill uses.

     AT MOST ONE, and the last one wins. The specification is explicit that the
     status axis appears on a single emphasised point, and the reason is the same
     rule: the caption names one verdict in words, so the plot emphasises one
     reading. A caller who marked several is told which was drawn rather than
     left to discover it. */
  const marked = plotted.filter((reading) =>
    isClinicalStatus(points.at(reading.index)?.status),
  )
  const flagged = marked.at(-1)
  const flaggedPoint = flagged === undefined ? undefined : points.at(flagged.index)
  const flaggedStatus = flaggedPoint?.status
  for (const point of points) {
    const status: unknown = point.status
    if (status === undefined || isClinicalStatus(status)) continue
    warnOnce(status === "unknown" ? "OPSIN-0011" : "OPSIN-0021", {
      component: "TrendSparkline",
      status: String(status),
    })
  }
  if (marked.length > 1 && isDevelopment()) {
    warnDevOnce(
      `many-marked:${String(marked.length)}`,
      `[opsinjs] <TrendSparkline> was given ${String(marked.length)} readings ` +
        "carrying a status and has emphasised the last of them. One reading is " +
        "emphasised because the caption names one verdict in words, and a marker " +
        "with no word beside it would be a status carried by colour alone. If more " +
        "than one reading needs a verdict on screen, that is a table rather than a " +
        "sparkline.",
    )
  }

  const first = plotted.at(0)
  const last = plotted.at(-1)
  const drawn = enoughReadings && first !== undefined && last !== undefined

  /* WHICH READING WAS MARKED, so the words carry what the marker carries. The
     caption and the plot's accessible name both say it, built from the same
     three facts here so the two cannot drift. The date is read straight from the
     marked reading's own `at` and never invented: when it will not parse,
     `markedOn` is undefined and the sentence names no date rather than a wrong
     one. `markedIsLast` lets "the most recent reading" stand in for a date the
     reader would otherwise have to place by counting back through the series. */
  const markedIsLast =
    flagged !== undefined && last !== undefined && flagged.index === last.index
  const markedOn =
    flagged === undefined
      ? undefined
      : formatDate(String(points.at(flagged.index)?.at), locale)

  const direction =
    first === undefined || last === undefined || smallestChange === undefined
      ? undefined
      : directionOf(first.value, last.value, smallestChange)

  const bandDrawn = bandIsClosed && drawn

  const spoken = spokenUnit(unit, high) ?? unit
  const lowest = magnitudes.length > 0 ? Math.min(...magnitudes) : undefined
  const highest = magnitudes.length > 0 ? Math.max(...magnitudes) : undefined

  /* WHEN, NOT ONLY HOW LONG. `window` is a display string this component can
     never check, so on its own it reads as current at any age: a series whose
     last reading was taken three months ago renders identically to one taken
     this morning. Every point already carries its own `at`, so the last real
     reading's date is printed rather than inferred. No staleness boundary is
     invented here and none is available to be. How old is too old belongs to
     the metric, and a product that wants a verdict about age puts a
     RelativeTime beside the plot. */
  const lastReadingAt = last === undefined ? undefined : points.at(last.index)?.at
  const measuredOn =
    lastReadingAt === undefined ? undefined : formatDate(String(lastReadingAt), locale)
  const whenSentence =
    last === undefined
      ? ""
      : measuredOn === undefined
        ? " We do not know when the last reading was taken."
        : ` The last reading was taken on ${measuredOn}.`

  /* The plot's accessible name, which is the picture described as a picture:
     what was measured, over what period, how many readings there are, what they
     range between, which way they went, which reading was marked, and what is
     missing. The pattern is the one in content/alt-text-and-descriptions:
     measure, period, coverage, extent, direction. It includes its own wording
     for a series whose direction nobody has told us how to judge. Its final
     element, a pointer to the table twin, is absent because there is no table
     twin to point at; that gap is recorded on the page rather than papered over
     here. It never says "chart of", "the red zone", or "trending up". The
     marked-reading clause names the reading the plot emphasises, by recency when
     it is the last reading and by its own date otherwise, so a reader who cannot
     see the marker still knows which reading carries the verdict. */
  const extent =
    lowest === undefined || highest === undefined
      ? ""
      : lowest === highest
        ? `every one of them ${formatNumber(lowest, locale, precision)} ${spoken}`
        : `between ${formatNumber(lowest, locale, precision)} and ${formatNumber(highest, locale, precision)} ${spoken}`

  const directionPhrase =
    direction === undefined
      ? "with no clear direction"
      : `${DIRECTION_WORD[direction].toLowerCase()} from the first reading to the last`

  /* Said as whole entries rather than as a bare count, because "1 with no
     reading" leaves a listener asking one what. Said as two separate sentences,
     because an entry nobody recorded and a reading that arrived broken are two
     different things to be told about your own record. */
  const missingSentence =
    (gaps === 0
      ? ""
      : gaps === 1
        ? " 1 entry has no reading."
        : ` ${String(gaps)} entries have no reading.`) +
    (brokenReadings === 0
      ? ""
      : brokenReadings === 1
        ? " 1 reading could not be read."
        : ` ${String(brokenReadings)} readings could not be read.`)

  const bandSentence =
    bandDrawn && bandLow !== undefined && bandHigh !== undefined
      ? ` A shaded band, ${formatNumber(bandLow, locale, precision)} to ${formatNumber(bandHigh, locale, precision)} ${spoken}, from ${String(rangeOwner)}.`
      : ""

  /* The marked reading, named by recency or by its own date, in the same words
     the caption uses below so the picture and its name cannot disagree. Empty
     when nothing carries a status. The number is `formatNumber` and `spoken`,
     exactly as `extent` above, and the verdict word comes from
     CLINICAL_STATUS_META rather than being spelled a second time here. */
  const markedSentence =
    flaggedStatus === undefined || flagged === undefined
      ? ""
      : markedIsLast
        ? ` The most recent reading, ${formatNumber(flagged.value, locale, precision)} ${spoken}, is marked ${CLINICAL_STATUS_META[flaggedStatus].word}.`
        : markedOn !== undefined
          ? ` The reading taken on ${markedOn}, ${formatNumber(flagged.value, locale, precision)} ${spoken}, is marked ${CLINICAL_STATUS_META[flaggedStatus].word}.`
          : ` One reading, ${formatNumber(flagged.value, locale, precision)} ${spoken}, is marked ${CLINICAL_STATUS_META[flaggedStatus].word}.`

  const plotName =
    extent === ""
      ? `${label} over ${windowLabel}. No readings to draw.`
      : `${label} over ${windowLabel}: ${String(readings.length)} readings, ${extent}, ` +
        `${directionPhrase}.${bandSentence}${markedSentence}${missingSentence}${whenSentence}`

  /* The same two facts as the accessible name's missing sentence, in the
     caption's own grammar, and the one clause a caller's own sentence does not
     displace: how much of the window has no measurement in it. */
  const missingParts: string[] = []
  if (gaps > 0) {
    missingParts.push(
      gaps === 1
        ? "1 gap where nothing was recorded"
        : `${String(gaps)} gaps where nothing was recorded`,
    )
  }
  if (brokenReadings > 0) {
    missingParts.push(
      brokenReadings === 1
        ? "1 reading that could not be read"
        : `${String(brokenReadings)} readings that could not be read`,
    )
  }
  const missingClause =
    missingParts.length === 0 ? "with none missing." : `and ${missingParts.join(" and ")}.`

  const ownCaption = caption !== undefined && caption.trim() !== "" ? caption.trim() : undefined

  /* The words for the caller's interval, open end and all, so that a band the
     picture declines to draw is still a thing the reader has been told. */
  const rangeInterval =
    bandLow !== undefined && bandHigh !== undefined ? (
      <>
        <Value value={bandLow} unit={unit} precision={precision} locale={locale} /> to{" "}
        <Value value={bandHigh} unit={unit} precision={precision} locale={locale} />
      </>
    ) : bandLow !== undefined ? (
      <>
        <Value value={bandLow} unit={unit} precision={precision} locale={locale} /> and upwards
      </>
    ) : bandHigh !== undefined ? (
      <>
        up to <Value value={bandHigh} unit={unit} precision={precision} locale={locale} />
      </>
    ) : undefined

  const bandRefusal = !bandIsClosed
    ? bandLow !== undefined && bandHigh !== undefined
      ? "because its lower bound is not below its upper one"
      : "because a band needs both of its ends"
    : "because no line was drawn"

  return (
    <div
      data-slot="trend-sparkline"
      /* The caption sits at `body`, not at `footnote`. The caption is the
         component (see the file header), and body is the scale's anchor for
         prose, so the one sentence that says what changed, how much is missing
         and which reading needs watching is set at the step a reader reads prose
         at. Footnote is reserved for provenance, which here is the window label
         and the freshness clause, not the caption. The size lives on the root so
         a caller who passes a smaller step in `className`, `text-opsin-callout`
         for a dense tile, can still shrink the whole sentence: tailwind-merge
         only lets them win when the size is on the element they are merging
         into. Do not optimise this back down. */
      className={cn("flex w-full flex-col gap-opsin-2 text-opsin-body", className)}
    >
      {/* The period, as a standalone label above the plot, but only when the
          caller composed their own caption AND a plot was drawn. When this
          component composed the caption it already names the period in words
          ("over the last 14 days"), so a standalone label above it repeats the
          phrase within a line or two, reads as a lowercase fragment under the
          title-case headline, and adds no information. When no plot is drawn the
          refusal sentence below names the period itself ("to draw a trend over
          the last 4 entries"), so a label above it repeats that phrase too. In
          both of those cases there is no separate label at all. The label
          renders only when the caller supplied the caption and the plot drew,
          because then it is the one place the period is named, so it stays in the
          accessibility tree rather than being hidden from it. The prop's own
          value is printed as given: `window` is documented as a display string
          written for a sentence, and upper-casing somebody else's string is a
          transformation this component cannot do safely across locales. */}
      {ownCaption !== undefined && drawn ? (
        <p
          data-slot="trend-sparkline-window"
          /* The window is a provenance line, the period the plot covers, so it
             sits at `footnote`, the step D10 assigns to provenance, timestamps
             and the freshness line, naming TrendSparkline among the components
             that come up to it from caption1. It carries its own step rather
             than inheriting the caption's, because a class on the element beats
             the one inherited from the root, so raising the caption to body
             leaves this label at footnote. */
          className="m-0 text-opsin-footnote text-muted-foreground"
        >
          {windowLabel}
        </p>
      ) : null}

      {drawn ? (
        <svg
          data-slot="trend-sparkline-plot"
          /* role="img" with a name, and never `meter`, `slider` or
             `progressbar`. All three announce a value the reader can inspect or
             change; this is a picture of readings somebody else took. It is not
             focusable and not in the tab order. `focusable="false"` is
             belt-and-braces for the engines that made SVG focusable by default.
             It is not announced point by point, because a fourteen-point
             series read aloud one point at a time is worse than silence. */
          role="img"
          aria-label={plotName}
          focusable="false"
          viewBox={`0 0 ${String(PLOT_WIDTH)} ${String(PLOT_HEIGHT)}`}
          /* Stretched rather than fitted, so the plot fills whatever column it
             is given. That has a cost the page states: the apparent slope is a
             function of the column's width and of the reader's text size rather
             than of the data, so two of these are comparable only at the same
             width and the same text size. Every stroke below carries
             `vectorEffect` so that the uneven scale does not thin the line at
             one width and thicken it at another, and every marker is a
             zero-length round-capped segment rather than a circle, because a
             circle in a stretched viewBox is an ellipse.

             That is now only half the story. With `vectorEffect` the used
             stroke width is a CSS length rather than a user-unit length, so each
             width below is stated in `rem` through an arbitrary-property class
             rather than as a unitless `strokeWidth` attribute. A rem resolves
             against the root font size, so when the reader doubles their text
             size and `h-opsin-12` doubles the plot's height the strokes double
             with it, and the graphic no longer thins relative to the type at the
             very setting a reader chose because thin things are hard to see. A
             width takes the space token that equals it exactly, and a literal
             rem only where no token holds that value: 6px and 9px have no token,
             1px is `--opsin-space-px`, 2px `--opsin-space-0-5`, 4px
             `--opsin-space-1`. */
          preserveAspectRatio="none"
          className="h-opsin-12 w-full overflow-visible"
        >
          {/* The zero baseline, drawn first so the band, the line, the halo and
              the marker all paint over it. The y-axis includes zero always (see
              the note by `low` and `high` above), but until this line was drawn
              the reader had no way to see that the picture was anchored at zero
              rather than cropped, so the space below a nearly flat line looked
              like a layout mistake rather than the honest distance from zero. It
              spans the same inset width the band uses, so the two agree. It
              carries neither category nor status: it is the axis, not a reading,
              and a tinted or status-coloured baseline would put a second meaning
              on the one element the two-axis rule forbids. `--muted-foreground`
              is the neutral scripts/check-contrast.mts measures past the
              non-text floor in both themes. When the series holds negative
              readings `low` sits below zero and this line falls inside the plot
              rather than near its floor, which is correct and is the case that
              makes it most useful. */}
          <path
            data-slot="trend-sparkline-baseline"
            d={`M ${String(PLOT_INSET)} ${String(yAt(0))} L ${String(PLOT_WIDTH - PLOT_INSET)} ${String(yAt(0))}`}
            vectorEffect="non-scaling-stroke"
            className="[stroke-width:var(--opsin-space-px)] stroke-muted-foreground forced-colors:stroke-[CanvasText]"
          />

          {bandDrawn && bandLow !== undefined && bandHigh !== undefined ? (
            <rect
              data-slot="trend-sparkline-band"
              /* Neutral, and neutral is the whole specification for this part. A
                 shaded interval in a status colour would be the two-axis
                 collision with extra steps: the reader would take the tint for a
                 verdict about the readings sitting inside it, which is a
                 comparison this component was never given. The dashed edge is
                 what distinguishes the band from the line without colour, in
                 greyscale and in print. The edge is drawn in the role that
                 scripts/check-contrast.mts measures against both the page and
                 the band fill, and it clears the non-text contrast floor in
                 both themes. The fill does not clear that floor and is not asked
                 to, because the band is identified by its edge and by the
                 caption's sentence rather than by the tint. */
              x={PLOT_INSET}
              width={PLOT_WIDTH - PLOT_INSET * 2}
              y={yAt(bandHigh)}
              height={Math.max(0, yAt(bandLow) - yAt(bandHigh))}
              vectorEffect="non-scaling-stroke"
              /* Under forced colours an SVG stroke keeps its author colour while
                 the boxes and text around it switch to system colours, so a
                 neutral hairline that already sits near the contrast floor
                 disappears for the reader who turned the mode on to see it. Every
                 stroke in this graphic takes a system colour so the whole picture
                 switches together rather than half of it. The band edge is ink.

                 The dash is a screen-space length, not a user-unit one: with
                 `vectorEffect` the stroke and its dash are measured in the space
                 in effect at render time rather than in viewBox units, so the
                 pattern is isotropic and no longer stretches with the column the
                 way a unitless `strokeDasharray` did. 0.25rem on and 0.25rem off
                 is 4px each at a 16px root, which still reads as a dash on a
                 hairline where a 2px pattern flattened toward solid. */
              className="[stroke-width:var(--opsin-space-px)] [stroke-dasharray:0.25rem_0.25rem] fill-muted stroke-muted-foreground forced-colors:stroke-[CanvasText]"
            />
          ) : null}

          <path
            data-slot="trend-sparkline-line"
            /* The one element the category axis touches, and `data-category` is
               the DOM contract for it. See the note above the marked reading for
               why the status axis is stamped only on the flagged dot and never
               here, which is what keeps the two from meeting on one element.

               Written without naming the other attribute here, because
               scripts/check-a11y.mts reads a JSX element as raw text and a
               comment inside the tag that mentions it counts as the tag carrying
               it. That would be a false OPSIN-0001 raised by the sentence
               explaining why there is no OPSIN-0001.

               Under forced colours the line drops its category tint for the ink
               the theme itself supplies. Category identity is a colour, and
               forced colours has no colour to spare for it, so the honest move is
               to draw the line in ink and let the label beside the sparkline say
               which measurement it is. No dash pattern is invented to carry
               category, because that would be a second encoding nobody asked to
               read, and forced-color-adjust is left alone so the mode keeps its
               override.

               This comment carries no apostrophe and names the other axis
               attribute nowhere, both on purpose. scripts/check-a11y.mts reads a
               tag as raw text and stops the tag at its first close bracket that
               is not inside a string, and it counts a single quote as opening a
               string. A possessive apostrophe here would leave that string open,
               run the tag past its own close bracket into the neighbouring
               comment, and raise a false OPSIN-0001 from the words that comment
               spends explaining why this element is on one axis alone. */
            data-category={tinted}
            d={subpaths.join(" ")}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={cn(
              "[stroke-width:var(--opsin-space-0-5)] stroke-foreground",
              tint,
              "forced-colors:stroke-[CanvasText]",
            )}
          />

          {/* The readings on the near and far side of every hole, drawn as
              zero-length round-capped dots so a gap reads 'reading, nothing,
              reading'. 0.25rem, heavier than the line's 0.125rem and lighter
              than the flagged marker's 0.375rem, so a gap edge is plainly a
              point without competing with the one reading the product flagged. The
              line's own tint and nothing else: no status, no `data-status`, and
              no `data-opsinjs-value`, which is the flagged reading's contract and
              must stay unique in the DOM. */}
          {gapEdgeMarks.map((reading) => (
            <path
              key={reading.index}
              data-slot="trend-sparkline-gap-edge"
              d={`M ${String(reading.x)} ${String(reading.y)} L ${String(reading.x)} ${String(reading.y)}`}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className={cn(
                "[stroke-width:var(--opsin-space-1)] stroke-foreground",
                tint,
                "forced-colors:stroke-[CanvasText]",
              )}
            />
          ))}

          {flagged === undefined ? null : (
            <>
              {/* A halo in the surface colour, so the marker reads as a marker
                  rather than as a thicker piece of line when it sits on top of
                  the band. Under forced colours it takes Canvas rather than
                  CanvasText: this ring is the gap around the mark, not the mark,
                  so it is drawn in the page colour every other stroke is drawn
                  against, and the CanvasText dot still reads as a break in the
                  line. */}
              <path
                d={`M ${String(flagged.x)} ${String(flagged.y)} L ${String(flagged.x)} ${String(flagged.y)}`}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                /* 0.5625rem is 9px at a 16px root. A literal rem because no
                   space token holds this value, unlike the widths that name
                   `--opsin-space-*` above. */
                className="[stroke-width:0.5625rem] stroke-background forced-colors:stroke-[Canvas]"
              />
              <path
                data-slot="trend-sparkline-point"
                /* The status DOM contract, and the only place on the plot it
                   lives. It draws nothing: the print stylesheet, the greyscale
                   audit and every product-side test read the level from here,
                   while the visible verdict stays in the caption StatusPill.
                   This dot is drawn in the neutral foreground and not in the
                   category tint precisely because it carries this contract: the
                   status axis and the category axis may never meet on one
                   element, and the category axis is already on the line. */
                data-status={flaggedStatus}
                /* The reading itself, machine-readable and unrounded, because
                   rounding is a display decision and whatever reads this wants
                   the datum. */
                data-opsinjs-value={String(flagged.value)}
                d={`M ${String(flagged.x)} ${String(flagged.y)} L ${String(flagged.x)} ${String(flagged.y)}`}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                /* 0.375rem is 6px at a 16px root, a literal rem because no space
                   token holds this value. Heavier than the line at 0.125rem and
                   lighter than the halo at 0.5625rem, and the three keep that
                   ordering at every text size because all three now scale. Drawn
                   in the neutral foreground, so its weight and its halo, not a
                   colour, are what set it apart from the line: this dot carries
                   the status contract and must stay off the category axis. */
                className={cn(
                  "[stroke-width:0.375rem] stroke-foreground",
                  "forced-colors:stroke-[CanvasText]",
                )}
              />
            </>
          )}
        </svg>
      ) : null}

      {/* THE TEXT TWIN. Visible, in the DOM, and read by everybody. It is not
          `sr-only`, not a `title`, and not an `aria-label` hung on something
          else.
          The clauses render in the order a scanning reader needs them: the lead
          sentence, then the marked reading with its pill, then the coverage
          count, then the date, then the range. The one fact the product chose to
          flag is the second sentence rather than the fourth, so a reader looking
          for "is anything wrong" meets the verdict before the housekeeping. The
          plot's accessible name above keeps the picture-describing order
          (coverage, extent, direction) on purpose; this is the reading order for
          the eye, that is the order for a description.
          The caller's own sentence stands in for the direction-and-magnitude
          clause and for nothing else: which reading was marked, what is missing,
          when the last one was taken and whose the range is are all still added
          either way, because a status, a count of absent measurements, a date
          and an attribution are each somebody's own record rather than
          decoration. */}
      <p data-slot="trend-sparkline-caption" className="m-0 text-pretty">
        {/* LEAD */}
        {drawn && first !== undefined && last !== undefined ? (
          ownCaption ?? (
            <>
              {direction === undefined ? "From" : `${DIRECTION_WORD[direction]}, from`}{" "}
              <Value value={first.value} unit={unit} precision={precision} locale={locale} /> to{" "}
              <Value value={last.value} unit={unit} precision={precision} locale={locale} />, over {windowLabel}.
            </>
          )
        ) : (
          <>
            Not enough readings to draw a trend over {windowLabel}: there{" "}
            {readings.length === 1 ? "is only 1" : `are ${String(readings.length)}`}
            {ruleIsUsable
              ? `, and a trend needs ${String(minimumPoints)}.`
              : ", and the number this needs is not a whole number above zero."}
            {ownCaption === undefined ? null : ` ${ownCaption}`}
          </>
        )}

        {/* MARKED */}
        {flaggedStatus === undefined || flagged === undefined ? null : (
          /* Names the marked reading, not just its value and verdict: by recency
             when it is the last reading, by its own date otherwise, and by
             neither when that date will not parse. Built from the same
             `markedIsLast` and `markedOn` as the plot's name above, so the two
             read alike. `<Value>` carries the number and `<StatusPill>` the
             word, so the value, the unit, the status word and its icon are all
             still separate carriers. The clause closes with a full stop after
             the pill, so the range attribution that follows begins its own
             sentence rather than running on: StatusPill is inline-flex and
             baseline-aligned, so the stop sits on the text baseline. It renders
             in both branches, because a verdict the product assigned is not
             withdrawn just because too few readings arrived to draw a line. */
          <>
            {" "}
            {markedIsLast
              ? "The most recent reading, "
              : markedOn !== undefined
                ? `The reading taken on ${markedOn}, `
                : "One reading, "}
            <Value value={flagged.value} unit={unit} precision={precision} locale={locale} />, is marked{" "}
            <StatusPill status={flaggedStatus} describes={label} />.
          </>
        )}

        {/* COVERAGE */}
        {drawn && first !== undefined && last !== undefined ? (
          <>
            {" "}
            {String(readings.length)} readings, {missingClause}
          </>
        ) : (
          missingSentence
        )}

        {/* WHEN */}
        {whenSentence}

        {/* RANGE */}
        {!rangeIsOwned || rangeInterval === undefined ? null : bandDrawn ? (
          <> The shaded band, {rangeInterval}, comes from {rangeOwner}.</>
        ) : (
          <>
            {" "}
            The range from {rangeOwner} is {rangeInterval}. It is not shaded, {bandRefusal}.
          </>
        )}
      </p>
    </div>
  )
}

/**
 * How many readings the demo's imaginary product decided make a trend.
 *
 * IT IS THE DEMO'S NUMBER AND IT IS NOT A RULE. In a real product this arrives
 * from the metric's own definition, decided by somebody who knows what is being
 * measured; nothing in opsinjs supplies it, the component has no default for it,
 * and it means nothing outside this file. A consumer who receives this file from
 * `shadcn add` replaces it with their own metric's number or deletes the demo.
 *
 * A GAP WORTH KNOWING ABOUT: A11Y014 fails the build on a threshold-shaped NAME
 * given a numeric literal, and it cannot see this one, so no gate is holding
 * this line. What holds it is the API. `minimumPoints` is required with no
 * default, so a caller cannot inherit this number by forgetting to pass one, and
 * the demo cannot be written without passing something. That tension is recorded
 * on the page instead of being hidden here.
 */
const EXAMPLE_READINGS_A_TREND_NEEDS = 4

/**
 * Thirteen entries at one-day spacing with exactly one gap, so the break in the
 * line is visible and the caption has something to disclose. The last reading
 * carries a status, which is what puts the pill in the caption.
 *
 * THE COUNT IS THE POINT. A gap has no position, so no segment is drawn into or
 * out of it, and one null removes the two intervals on either side of it. In a
 * six-entry series that was two of five intervals, about two-fifths of the plot,
 * beside a caption that says "1 gap": the picture overstated the absence. With
 * thirteen entries one null removes two of twelve intervals, roughly a sixth,
 * which is what "1 gap" describes. The gap-edge dots draw a reading on each side
 * of the hole, so it reads "reading, nothing, reading".
 *
 * The values move up and down rather than ramping, so the line has a shape, and
 * they are obviously unreal round numbers of steps (ADR 0012) well clear of
 * anything a reader could take for their own record.
 */
const DEMO_SERIES: TrendPoint[] = [
  { at: "2026-01-01T09:00:00Z", value: 10 },
  { at: "2026-01-02T09:00:00Z", value: 20 },
  { at: "2026-01-03T09:00:00Z", value: 30 },
  { at: "2026-01-04T09:00:00Z", value: 20 },
  { at: "2026-01-05T09:00:00Z", value: 40 },
  { at: "2026-01-06T09:00:00Z", value: 30 },
  { at: "2026-01-07T09:00:00Z", value: null },
  { at: "2026-01-08T09:00:00Z", value: 50 },
  { at: "2026-01-09T09:00:00Z", value: 30 },
  { at: "2026-01-10T09:00:00Z", value: 40 },
  { at: "2026-01-11T09:00:00Z", value: 60 },
  { at: "2026-01-12T09:00:00Z", value: 40 },
  { at: "2026-01-13T09:00:00Z", value: 50, status: "watch" },
]

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows one drawn sparkline, with a
 * gap in it and one reading marked, so the caption has a break and a status to
 * disclose. It draws a line and emits no runtime warning, because a demo is held
 * to the component's own standard (ADR 0009).
 *
 * ONE STATE, BY THE RULE. ADR 0009 says a second state is a file under
 * registry/examples/, not a second instance in the demo. The refusal, which is
 * the state this component exists for, is owned by
 * registry/examples/trend-sparkline-not-enough-readings.tsx, which shows it
 * better than a shrunk demo could, and the drawn variations live in the other
 * two example files. So the demo renders the one best state and stops.
 *
 * It passes no `changeThreshold`, so the caption names no direction. That is the
 * state opsinjs can render honestly without being told anything about the
 * metric, and is what a reader should see here.
 *
 * The readings are obviously unreal (ADR 0012), because they are round numbers
 * of steps nobody would take for their own. There is no reference range
 * anywhere in sight. A screenshot of an opsinjs demo must never be mistakable
 * for somebody's own record.
 */
export default function TrendSparklineDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-6 text-opsin-body">
      <div className="flex flex-col gap-opsin-1">
        <span className="text-opsin-headline">Example measurement</span>
        {/* The caption's "last reading taken on" date is formatted by this
            component from the last point's `at`, so the demo pins `locale` to
            render the day-first order numbers-dates-and-time mandates. A product
            passes the tag its own reader uses. */}
        <TrendSparkline
          label="Example measurement"
          unit="steps"
          precision={0}
          category="activity"
          locale="en-GB"
          window="the last 13 entries"
          series={DEMO_SERIES}
          minimumPoints={EXAMPLE_READINGS_A_TREND_NEEDS}
        />
      </div>
    </div>
  )
}
