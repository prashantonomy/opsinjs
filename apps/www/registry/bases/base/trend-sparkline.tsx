/**
 * TrendSparkline — a line through readings somebody else took, and a sentence
 * that says what the line shows without saying whether it is welcome news.
 *
 * A sparkline is a claim that a pattern exists, and four points with a slope
 * look exactly like forty points with a slope. Most of this file is about
 * refusing to draw a line the data does not support, and about making sure the
 * words beside the line carry everything the line carries.
 *
 * THE CAPTION IS THE COMPONENT. There is no prop that turns it off, no
 * `sr-only` variant of it and no `showCaption={false}`, because a graphic has no
 * word in it at all — worse off than a status pill, whose measured problem is
 * only that four hues cannot be told apart. A reader who cannot see the plot
 * must lose the picture and keep the information. What that promise does NOT
 * survive is `className`: it is merged onto the root with `tailwind-merge`, so a
 * caller who passes `hidden`, `sr-only` or a `[&_[data-slot=…]]:hidden` variant
 * removes the sentence, and nothing here can stop them. That is stated on the
 * page rather than claimed away.
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
 * the missing bound from the data extent — or from zero — and then telling the
 * reader in the caption that the whole band came from their laboratory credits
 * that laboratory with a number it never gave.
 *
 * THE STATUS AXIS IS NOT DRAWN. `TrendPoint.status` decides which reading is
 * emphasised and what the caption says about it; it never tints the marker. The
 * rule that forces this is the four-carrier rule — a status is colour AND a
 * glyph AND the word AND `data-status`, never fewer — and a six-pixel dot can
 * hold exactly one of the four. So the verdict is rendered where all four fit,
 * as a StatusPill inside the caption, and the plot stays a picture of numbers.
 * See the comment on `flagged` below, which is where that decision lives.
 *
 * NOTHING ANIMATES. Not the path, not the marker, not on first paint and not on
 * a change. A path that draws its own length reads as time passing and implies
 * progress; there is no reduced-motion fallback here because there is nothing to
 * fall back from.
 */

import {
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
 * said how much movement counts as movement — see `directionOf`. `unsettled` is
 * unreachable from here, because deciding a series is unsettled needs a noise
 * measure that no prop carries.
 */
export type TrendDirection = "up" | "down" | "level" | "unsettled"

/**
 * The drawing surface, in the SVG's own user units.
 *
 * Unitless on purpose: the plot is stretched to whatever width it is given, so
 * these are proportions rather than sizes. The inset keeps the stroke off the
 * edge — strokes here are drawn in screen pixels rather than user units (see
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
 * `tokens/errors.json` states the policy — development only, once per offending
 * call site — and the six complaints below all live in a render body. Without a
 * keyed set they print on every render and twice again under Strict Mode, and a
 * row of sparkline tiles fed from one bad series is the largest concentration
 * of them in the registry: an author would have the console full before they
 * reached the first message, and a channel somebody filters is a channel that
 * no longer carries its one real finding.
 *
 * It is a module-local set rather than the substrate's `warnOnce` because
 * `warnOnce` is keyed to an `OpsinErrorCode` and none of the six has one. The
 * four complaints that do — OPSIN-0004, OPSIN-0010, OPSIN-0012 and the
 * OPSIN-0011/0021 pair — go through `warnOnce` and not through here. Allocating
 * codes in `tokens/errors.json` for the rest and deleting this is a strict
 * improvement.
 *
 * EVERY KEY NAMES THE MISTAKE, NEVER THE SERIES. Keying on a reading or a
 * timestamp would turn "warn once" into "warn every render", because the next
 * tile along carries different data and the same defect. So the keys are the
 * rejected prop value where there is one — which ranges over the handful of
 * values a caller gets wrong — and a constant where the message interpolates
 * nothing.
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
 * The formatter's ceiling, and the same one `Value` uses.
 *
 * Opened all the way rather than left at `Intl`'s default of three, because
 * rounding a reader's measurement to a precision nobody stated is a display
 * decision this component is not entitled to make.
 */
const MAX_FRACTION_DIGITS = 20

/**
 * A number for the accessible name, written the way `Value` writes the same
 * number in the caption below it.
 *
 * The spoken name and the printed sentence have to say one number one way. A
 * bare `String(…)` prints a full stop where a de-DE reader's locale writes a
 * comma, and prints an arithmetic result as seventeen digits, which asserts an
 * accuracy no instrument has. Separators and grouping are never hand-rolled.
 *
 * Rounding is `halfExpand` — round-half-away-from-zero, `numbers-units-precision`
 * rule 3 — and it is INHERITED rather than named. `roundingMode` is an ES2023
 * addition to `Intl.NumberFormatOptions`, so spelling it out here makes this
 * file fail to typecheck in a consumer whose `lib` stops at ES2022, and this
 * file ships as source into those projects. `halfExpand` is the formatter's own
 * default, so the behaviour is identical either way; see the longer note in
 * `value.tsx`, which records where the regression was found. Do not put it back.
 */
function formatNumber(value: number, locale: string | undefined): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: MAX_FRACTION_DIGITS,
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
 * something. `uncertainty-and-staleness` rule 6 keeps the two sentences apart —
 * "we could not load this" is not "you have not recorded any readings yet" — and
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
 * difference below which a series is presented as unchanged — below the noise
 * floor, "about the same as last week" is the true statement — and a component
 * that answered it would be applying a change threshold of zero to a weight
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
   * Unit symbol as `tokens/units.json` spells it — "bpm", "mmol/L", "steps".
   * Every reading in the caption is rendered through `Value`, which resolves the
   * spoken form from that table so a screen reader says "millimoles per litre"
   * rather than improvising.
   */
  unit: string
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
   * is reading it — a number opsinjs cannot know and must never guess. Below it
   * this component draws nothing and says so, naming your number and the count
   * it actually has.
   */
  minimumPoints: number
  /**
   * The period the series covers, as the reader should see it — "the last 14
   * days". A display string rather than a duration, which has a consequence
   * worth knowing: the x-axis is the extent of the series you passed, not the
   * extent of this period, so two sparklines are only comparable side by side
   * when their series cover the same span.
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
   * all — but it has to be your product saying so, not this file.
   */
  changeThreshold?: number
  /**
   * An interval to shade behind the line, in neutral tones. Never
   * status-coloured, and never invented: omit it and no band is drawn. Its
   * `source` is required and is named in the caption, because a shaded band with
   * no owner is an assertion with no author.
   *
   * A band is drawn only when BOTH bounds are present and the lower is below the
   * upper. A one-sided range is stated in the caption as words — "10 steps and
   * above" — and drawn as nothing, because the missing edge would have to come
   * from the data or from zero and would then be attributed to your source.
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
   * clause naming a marked reading, or the clause naming a range's source —
   * those are appended either way, because a count of absent measurements, a
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
     of that name shadows the global for the whole function body — so a future
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
          "could not be read rather than as a gap — a gap means nobody took a " +
          "reading, and this one says a reading was taken and did not survive the " +
          "trip. Pass `value: null` for a gap and fix the pipeline for the rest.",
      )
    }
  }

  /* An unknown category is refused rather than approximated. This file ships as
     source into JavaScript projects where the union is advice, and a category
     nobody has a ramp for renders an untinted line — which is honest, and is
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
     the type is advice in a JavaScript project — so the check is for the caller
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
     code describes — a caller with fewer readings than their own rule allows —
     is exactly this one, and it is the only code in the table allocated to this
     component. A developer whose sparkline has silently become a sentence is
     entitled to know why. The message also names `minimumWindow`, which is not a
     prop on anything; that is a defect in tokens/errors.json and is reported
     upward rather than worked around here. */
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
    console.warn(
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
     consequence — two sparklines side by side are only comparable when their
     series cover the same span — is stated on the page, because the repair is a
     duration prop that the specification does not have. */
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
    console.warn(
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
     line — which is the honest picture, and why the caption carries the
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
     position — the difference between the two is carried by the words.

     A run of exactly one reading becomes a zero-length subpath, which with a
     round line cap renders as a dot. That is deliberate: an isolated reading
     between two gaps did happen, and drawing nothing for it would lose a
     measurement rather than decline to invent one. */
  const subpaths: string[] = []
  let run: PlottedReading[] = []
  let cursor = 0
  for (const point of points) {
    if (isReading(point)) {
      const reading = plotted.at(cursor)
      cursor += 1
      if (reading !== undefined) run.push(reading)
      continue
    }
    if (run.length > 0) subpaths.push(pathFor(run))
    run = []
  }
  if (run.length > 0) subpaths.push(pathFor(run))

  /* THE MARKED READING, AND WHY THE PLOT DOES NOT COLOUR IT.
     A status is carried by colour AND a glyph AND the word AND `data-status`,
     four carriers and never fewer, because the measured colour-vision audit in
     tokens/color.json finds two of the four levels indistinguishable under
     deuteranopia and in greyscale. A marker on a sparkline can hold the colour
     and nothing else. So the marker is drawn in the line's own tint, heavier and
     ringed, and the verdict is rendered as a StatusPill inside the caption where
     all four carriers fit. The specification permits status on the point; it
     does not require it, and taking the permission would be shipping a red dot
     that a substantial minority of readers cannot tell from an amber one.

     A LEVEL OUTSIDE THE FOUR MARKS NOTHING. `unknown` is the likeliest wrong
     answer and it is the absence of an assertion rather than a fifth level, so a
     reading carrying it would otherwise keep the emphasis — the halo and the
     heavier marker — while StatusPill declined to render the word. Emphasis with
     no word beside it is this file's own argument turned inside out, so the
     selection is gated on the same predicate the pill uses.

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
    console.warn(
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
     invented here and none is available to be — how old is too old belongs to
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
     range between, which way they went, and what is missing. The pattern is the
     one in content/alt-text-and-descriptions — measure, period, coverage,
     extent, direction — including its own wording for a series whose direction
     nobody has told us how to judge. Its final element, a pointer to the table
     twin, is absent because there is no table twin to point at; that gap is
     recorded on the page rather than papered over here. It never says "chart
     of", "the red zone", or "trending up". */
  const extent =
    lowest === undefined || highest === undefined
      ? ""
      : lowest === highest
        ? `every one of them ${formatNumber(lowest, locale)} ${spoken}`
        : `between ${formatNumber(lowest, locale)} and ${formatNumber(highest, locale)} ${spoken}`

  const directionPhrase =
    direction === undefined
      ? "with no clear direction"
      : `${DIRECTION_WORD[direction].toLowerCase()} from the first reading to the last`

  /* Said as whole entries rather than as a bare count, because "1 with no
     reading" leaves a listener asking one what — and said as two separate
     sentences, because an entry nobody recorded and a reading that arrived
     broken are two different things to be told about your own record. */
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
      ? ` A shaded band, ${formatNumber(bandLow, locale)} to ${formatNumber(bandHigh, locale)} ${spoken}, from ${String(rangeOwner)}.`
      : ""

  const plotName =
    extent === ""
      ? `${label} over ${windowLabel}. No readings to draw.`
      : `${label} over ${windowLabel}: ${String(readings.length)} readings, ${extent}, ` +
        `${directionPhrase}.${bandSentence}${missingSentence}${whenSentence}`

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
        <Value value={bandLow} unit={unit} locale={locale} /> to{" "}
        <Value value={bandHigh} unit={unit} locale={locale} />
      </>
    ) : bandLow !== undefined ? (
      <>
        <Value value={bandLow} unit={unit} locale={locale} /> and upwards
      </>
    ) : bandHigh !== undefined ? (
      <>
        up to <Value value={bandHigh} unit={unit} locale={locale} />
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
      className={cn("flex w-full flex-col gap-opsin-2 text-opsin-footnote", className)}
    >
      {/* The period, as a visible label above the plot, because a line with no
          period is unreadable. Hidden from assistive technology only when this
          component composed the caption, because the composed sentence names the
          period in words and hearing "the last 14 days" twice in a row is noise.
          When the caller supplied the caption, their sentence may not name the
          period at all, so this stays in the accessibility tree. */}
      <p
        data-slot="trend-sparkline-window"
        aria-hidden={ownCaption === undefined ? "true" : undefined}
        className="m-0 text-opsin-caption1 text-muted-foreground"
      >
        {windowLabel}
      </p>

      {drawn ? (
        <svg
          data-slot="trend-sparkline-plot"
          /* role="img" with a name, and never `meter`, `slider` or
             `progressbar`. All three announce a value the reader can inspect or
             change; this is a picture of readings somebody else took. It is not
             focusable and not in the tab order — `focusable="false"` is
             belt-and-braces for the engines that made SVG focusable by default —
             and it is not announced point by point, because a fourteen-point
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
             circle in a stretched viewBox is an ellipse. */
          preserveAspectRatio="none"
          className="h-opsin-12 w-full overflow-visible"
        >
          {bandDrawn && bandLow !== undefined && bandHigh !== undefined ? (
            <rect
              data-slot="trend-sparkline-band"
              /* Neutral, and neutral is the whole specification for this part. A
                 shaded interval in a status colour would be the two-axis
                 collision with extra steps: the reader would take the tint for a
                 verdict about the readings sitting inside it, which is a
                 comparison this component was never given. The dashed edge is
                 what distinguishes the band from the line without colour, in
                 greyscale and in print — and whether either neutral clears the
                 non-text contrast floor has not been measured for this
                 component, which the page says rather than assumes. */
              x={PLOT_INSET}
              width={PLOT_WIDTH - PLOT_INSET * 2}
              y={yAt(bandHigh)}
              height={Math.max(0, yAt(bandLow) - yAt(bandHigh))}
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
              className="fill-muted stroke-border"
            />
          ) : null}

          <path
            data-slot="trend-sparkline-line"
            /* The one element the category axis touches, and `data-category` is
               the DOM contract for it. See the note above the marked reading for
               why the other axis is not stamped anywhere in this file, which is
               what makes it impossible for the two to meet on one element.

               Written without naming the other attribute here, because
               scripts/check-a11y.mts reads a JSX element as raw text and a
               comment inside the tag that mentions it counts as the tag carrying
               it — a false OPSIN-0001 raised by the sentence explaining why
               there is no OPSIN-0001. */
            data-category={tinted}
            d={subpaths.join(" ")}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={cn("stroke-foreground", tint)}
          />

          {flagged === undefined ? null : (
            <>
              {/* A halo in the surface colour, so the marker reads as a marker
                  rather than as a thicker piece of line when it sits on top of
                  the band. */}
              <path
                d={`M ${String(flagged.x)} ${String(flagged.y)} L ${String(flagged.x)} ${String(flagged.y)}`}
                strokeWidth={9}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className="stroke-background"
              />
              <path
                data-slot="trend-sparkline-point"
                /* The reading itself, machine-readable and unrounded, because
                   rounding is a display decision and whatever reads this wants
                   the datum. */
                data-opsinjs-value={String(flagged.value)}
                d={`M ${String(flagged.x)} ${String(flagged.y)} L ${String(flagged.x)} ${String(flagged.y)}`}
                strokeWidth={6}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className={cn("stroke-foreground", tint)}
              />
            </>
          )}
        </svg>
      ) : null}

      {/* THE TEXT TWIN. Visible, in the DOM, and read by everybody — not
          `sr-only`, not a `title`, not an `aria-label` hung on something else.
          The caller's own sentence stands in for the direction-and-magnitude
          clause and for nothing else: what is missing, which reading was marked,
          when the last one was taken and whose the range is are appended either
          way, because a count of absent measurements, a status, a date and an
          attribution are each somebody's own record rather than decoration. */}
      <p data-slot="trend-sparkline-caption" className="m-0 text-pretty">
        {drawn && first !== undefined && last !== undefined ? (
          <>
            {ownCaption ?? (
              <>
                {direction === undefined ? "From" : `${DIRECTION_WORD[direction]}, from`}{" "}
                <Value value={first.value} unit={unit} locale={locale} /> to{" "}
                <Value value={last.value} unit={unit} locale={locale} />, over {windowLabel}.
              </>
            )}{" "}
            {String(readings.length)} readings, {missingClause}
          </>
        ) : (
          <>
            Not enough readings to draw a trend over {windowLabel}: there{" "}
            {readings.length === 1 ? "is only 1" : `are ${String(readings.length)}`}
            {ruleIsUsable
              ? `, and this needs ${String(minimumPoints)}.`
              : ", and the number this needs is not a whole number above zero."}
            {missingSentence}
            {ownCaption === undefined ? null : ` ${ownCaption}`}
          </>
        )}

        {whenSentence}

        {flaggedStatus === undefined || flagged === undefined ? null : (
          <>
            {" "}
            One reading is marked: <Value
              value={flagged.value}
              unit={unit}
              locale={locale}
            />{" "}
            <StatusPill status={flaggedStatus} describes={label} size="sm" />
          </>
        )}

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
 * this line. What holds it is the API — `minimumPoints` is required with no
 * default, so a caller cannot inherit this number by forgetting to pass one, and
 * the demo cannot be written without passing something. That tension is recorded
 * on the page instead of being hidden here.
 */
const EXAMPLE_READINGS_A_TREND_NEEDS = 4

/**
 * Six entries with one gap in the middle, so the break in the line is visible
 * and the caption has something to disclose. The last reading carries a status,
 * which is what puts the pill in the caption.
 */
const DEMO_SERIES: TrendPoint[] = [
  { at: "2026-01-01T09:00:00Z", value: 12 },
  { at: "2026-01-02T09:00:00Z", value: 14 },
  { at: "2026-01-03T09:00:00Z", value: null },
  { at: "2026-01-04T09:00:00Z", value: 16 },
  { at: "2026-01-05T09:00:00Z", value: 15 },
  { at: "2026-01-06T09:00:00Z", value: 20, status: "watch" },
]

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the two states that decide
 * whether this component is doing its job: a series long enough to draw, with a
 * gap in it and one reading marked; and a series that is not long enough, which
 * draws nothing at all and says why.
 *
 * Neither passes a `changeThreshold`, so neither caption names a direction —
 * which is the state opsinjs can render honestly without being told anything
 * about the metric, and is what a reader should see here.
 *
 * The readings are obviously unreal (ADR 0012) — round numbers of steps nobody
 * would take for their own — and there is no reference range anywhere in sight.
 * A screenshot of an opsinjs demo must never be mistakable for somebody's own
 * record.
 */
export default function TrendSparklineDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-6 text-opsin-body">
      <div className="flex flex-col gap-opsin-1">
        <span className="text-opsin-headline">Example measurement</span>
        <TrendSparkline
          label="Example measurement"
          unit="steps"
          category="activity"
          window="the last six entries"
          series={DEMO_SERIES}
          minimumPoints={EXAMPLE_READINGS_A_TREND_NEEDS}
        />
      </div>
      <div className="flex flex-col gap-opsin-1">
        <span className="text-opsin-headline">Second example measurement</span>
        <TrendSparkline
          label="Second example measurement"
          unit="steps"
          category="activity"
          window="the last six entries"
          series={DEMO_SERIES.slice(0, 2)}
          minimumPoints={EXAMPLE_READINGS_A_TREND_NEEDS}
        />
      </div>
    </div>
  )
}
