/**
 * TrendSparkline — a line through readings somebody else took, and a sentence
 * that says what the line shows without saying whether it is welcome news.
 *
 * A sparkline is a claim that a pattern exists, and four points with a slope
 * look exactly like forty points with a slope. Most of this file is about
 * refusing to draw a line the data does not support, and about making sure the
 * words beside the line carry everything the line carries.
 *
 * THE CAPTION IS NOT A CONVENIENCE. It is the component. There is no prop that
 * turns it off, no `sr-only` variant of it and no `showCaption={false}`, because
 * a graphic has no word in it at all — worse off than a status pill, whose
 * measured problem is only that four hues cannot be told apart. A reader who
 * cannot see the plot must lose the picture and keep the information, and the
 * only way to promise that is to make the sentence mandatory and visible.
 *
 * NOTHING HERE IS DERIVED FROM A NUMBER. There is no reference range in this
 * file, no change threshold, no smoothing, no minimum point count and no rule
 * about how much movement counts as movement. Every one of those is a clinical
 * judgement belonging to the product that knows what was measured and who the
 * reader is. `minimumPoints` is required and has no default for exactly that
 * reason: how many readings make a trend is not a question a design system is
 * entitled to answer, and three readings drawn as a slope is a picture that
 * carries far more authority than three readings deserve.
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
 * Direction is a fact about the series. Valence is a judgement, and not ours.
 *
 * All four members are the vocabulary a product may use in a caption of its own.
 * This component only ever produces `up`, `down` and `level`, and `level` only
 * on exact equality — see `directionOf` for why `unsettled` is unreachable from
 * here and what a product that wants it should do instead.
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

/** A reading that survived to be drawn: a finite value with a position. */
interface PlottedReading {
  /** Index into the caller's `series`, so a marker can be traced back. */
  index: number
  value: number
  x: number
  y: number
}

/**
 * Which readings are real.
 *
 * `null` is a recorded gap and is the shape the API asks for. A non-finite
 * number is a different failure — a parse that produced nothing, a division with
 * no divisor — and it is treated as a gap for drawing purposes because there is
 * no honest place to put it, with a development warning so the caller knows
 * their pipeline leaked rather than that their reader skipped a day.
 */
function isReading(point: TrendPoint): boolean {
  return point.value !== null && Number.isFinite(point.value)
}

/**
 * Direction, from the first real reading to the last, and nothing cleverer.
 *
 * FIRST AND LAST, NOT A FITTED SLOPE. A regression line is a better summary of a
 * noisy series and a worse thing to print beside one, because a reader cannot
 * check it against the picture. The content guidance for this component asks for
 * a caption whose every word can be checked against the plot, and first-to-last
 * is the only summary that qualifies.
 *
 * `level` ONLY ON EXACT EQUALITY, and this is the uncomfortable part. Doctrine
 * says a metric declares a change threshold below which a difference is
 * presented as unchanged — and `TrendSparklineProps` has no prop to carry one.
 * With no threshold from the caller, calling a small difference "unchanged"
 * would be this file inventing the threshold, which is the one thing it must not
 * do. So a difference of any size reads as up or down, the caption prints both
 * endpoints so the reader can see how small it is, and a product with a real
 * threshold passes its own `caption`. That is also why `unsettled` is
 * unreachable: deciding a series is unsettled needs a noise measure, and there
 * is no prop for one either.
 */
function directionOf(first: number, last: number): TrendDirection {
  if (last > first) return "up"
  if (last < first) return "down"
  return "level"
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
   * An interval to shade behind the line, in neutral tones. Never
   * status-coloured, and never invented: omit it and no band is drawn. Its
   * `source` is required and is named in the caption, because a shaded band with
   * no owner is an assertion with no author.
   */
  range?: ReferenceRange
  /**
   * Tints the line so it is findable in a grid of six. It is identity, not
   * meaning: in greyscale the tint is lost and nothing else is.
   */
  category?: HealthCategory
  /**
   * Your own sentence, replacing the composed one. Use it when you have a change
   * threshold, a cadence or a phrasing this component cannot know about.
   *
   * It replaces the direction-and-magnitude sentence only. The clause naming a
   * marked reading and the clause naming the band's source are appended by the
   * component and cannot be removed by any prop — one is a status that owes a
   * word, the other is an attribution.
   */
  caption?: string
  /** Merged onto the root. There is no class that hides the caption. */
  className?: string
}

export function TrendSparkline({
  label,
  unit,
  series,
  minimumPoints,
  window,
  range,
  category,
  caption,
  className,
}: TrendSparklineProps) {
  const points = Array.isArray(series) ? series : []
  const readings = points.filter(isReading)
  const gaps = points.length - readings.length

  if (isDevelopment()) {
    for (const point of points) {
      if (point.value === null || Number.isFinite(point.value)) continue
      console.warn(
        `[opsinjs] <TrendSparkline> received ${String(point.value)} as a reading ` +
          `at ${String(point.at)}, which is not a finite number. It has been drawn ` +
          "as a gap, and that is a guess: a gap means nobody took a reading, and " +
          "this one says a reading was taken and did not survive the trip. Pass " +
          "`value: null` for a gap and fix the pipeline for the rest.",
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
  const shaded =
    rangeIsOwned && (range.low !== undefined || range.high !== undefined) ? range : undefined

  /* THE RULE ABOUT DRAWING, AND IT FAILS TOWARDS NOT DRAWING.
     A `minimumPoints` that is not a whole number above zero is a caller who has
     not decided, and a component that treats "not decided" as "no rule" draws a
     two-point line. So an unusable value refuses the line, the same as too few
     readings, and the caption says which of the two happened. */
  const ruleIsUsable = Number.isInteger(minimumPoints) && minimumPoints > 0
  if (!ruleIsUsable && isDevelopment()) {
    console.warn(
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

  /* THE X-AXIS IS THE SERIES' OWN EXTENT, and it cannot be anything else.
     `window` is a display string, so this component is never told how long the
     period actually is and cannot lay the readings out against it. Timestamps
     are used where they parse, so a gap sits in the right place along the line
     rather than being collapsed to an even step; where they do not, position
     falls back to the index, which is at least stable. The consequence — two
     sparklines side by side are only comparable when their series cover the
     same span — is stated on the page, because the repair is a duration prop
     that the specification does not have. */
  const times = points.map((point) => Date.parse(String(point.at)))
  const firstTime = times.at(0)
  const lastTime = times.at(-1)
  const timesUsable =
    firstTime !== undefined &&
    lastTime !== undefined &&
    times.every((time) => Number.isFinite(time)) &&
    lastTime > firstTime
  if (!timesUsable && points.length > 1 && isDevelopment()) {
    console.warn(
      "[opsinjs] <TrendSparkline> could not read its timestamps as an increasing " +
        "run of ISO dates, so the readings have been spaced evenly by their " +
        "position in the array instead. A gap will therefore sit at the wrong " +
        "place along the line. `TrendPoint.at` is an ISO 8601 timestamp and the " +
        "series is chronological.",
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
     either; OPSIN-0013 is the code for the mistake this API cannot express. */
  const magnitudes = readings.flatMap((point) =>
    point.value === null ? [] : [point.value],
  )
  const shadedLow = shaded?.low
  const shadedHigh = shaded?.high
  const low = Math.min(0, ...magnitudes, ...(shadedLow === undefined ? [] : [shadedLow]))
  const high = Math.max(0, ...magnitudes, ...(shadedHigh === undefined ? [] : [shadedHigh]))
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
     fortnight of absent data leaves a fortnight of absent line.

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

     AT MOST ONE, and the last one wins. The specification is explicit that the
     status axis appears on a single emphasised point, and the reason is the same
     rule: the caption names one verdict in words, so the plot emphasises one
     reading. A caller who marked several is told which was drawn rather than
     left to discover it. */
  const marked = plotted.filter((reading) => points.at(reading.index)?.status !== undefined)
  const flagged = marked.at(-1)
  const flaggedStatus = flagged === undefined ? undefined : points.at(flagged.index)?.status
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
  const direction =
    first === undefined || last === undefined ? undefined : directionOf(first.value, last.value)

  const spoken = spokenUnit(unit, high) ?? unit
  const lowest = magnitudes.length > 0 ? Math.min(...magnitudes) : undefined
  const highest = magnitudes.length > 0 ? Math.max(...magnitudes) : undefined

  /* The plot's accessible name, which is the picture described as a picture:
     what was measured, over what period, how many readings there are and what
     they range between. It deliberately says something the caption does not —
     the extent — because a name identical to the sentence below it would be the
     same words read out twice. The pattern is the one in
     content/alt-text-and-descriptions: measure, period, coverage, extent,
     direction. It never says "chart of", "the red zone", or "trending up". */
  const extent =
    lowest === undefined || highest === undefined
      ? ""
      : lowest === highest
        ? `every one of them ${String(lowest)} ${spoken}`
        : `between ${String(lowest)} and ${String(highest)} ${spoken}`

  /* Said as whole entries rather than as a bare count, because "1 with no
     reading" leaves a listener asking one what. */
  const gapSentence =
    gaps === 0
      ? ""
      : gaps === 1
        ? " 1 entry has no reading."
        : ` ${String(gaps)} entries have no reading.`

  const plotName =
    direction === undefined || extent === ""
      ? `${label} over ${window}. No readings to draw.`
      : `${label} over ${window}: ${String(readings.length)} readings, ${extent}. ` +
        `From the first reading to the last, ` +
        `${DIRECTION_WORD[direction].toLowerCase()}.${gapSentence}`

  const gapClause =
    gaps === 0
      ? "with none missing."
      : gaps === 1
        ? "and 1 gap where nothing was recorded."
        : `and ${String(gaps)} gaps where nothing was recorded.`

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
        aria-hidden={caption === undefined ? "true" : undefined}
        className="m-0 text-opsin-caption1 text-muted-foreground"
      >
        {window}
      </p>

      {enoughReadings && direction !== undefined ? (
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
             is given. Every stroke below carries `vectorEffect` so that the
             uneven scale does not thin the line at one width and thicken it at
             another, and every marker is a zero-length round-capped segment
             rather than a circle, because a circle in a stretched viewBox is an
             ellipse. */
          preserveAspectRatio="none"
          className="h-opsin-12 w-full overflow-visible"
        >
          {shaded === undefined ? null : (
            <rect
              data-slot="trend-sparkline-band"
              /* Neutral, and neutral is the whole specification for this part. A
                 shaded interval in a status colour would be the two-axis
                 collision with extra steps: the reader would take the tint for a
                 verdict about the readings sitting inside it, which is a
                 comparison this component was never given. The dashed edge is
                 what distinguishes the band from the line without colour, in
                 greyscale and in print. */
              x={PLOT_INSET}
              width={PLOT_WIDTH - PLOT_INSET * 2}
              y={yAt(shadedHigh ?? high)}
              height={Math.max(0, yAt(shadedLow ?? low) - yAt(shadedHigh ?? high))}
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
              className="fill-muted stroke-border"
            />
          )}

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
          Three clauses, and only the first can be replaced by the caller: the
          marked reading owes a word because it is a status, and the band owes an
          attribution because it is somebody's comparison. */}
      <p data-slot="trend-sparkline-caption" className="m-0 text-pretty">
        {caption !== undefined && caption.trim() !== "" ? (
          caption
        ) : enoughReadings &&
          direction !== undefined &&
          first !== undefined &&
          last !== undefined ? (
          <>
            {DIRECTION_WORD[direction]}, from <Value value={first.value} unit={unit} /> to{" "}
            <Value value={last.value} unit={unit} />, over {window}.{" "}
            {String(readings.length)} readings, {gapClause}
          </>
        ) : (
          <>
            Not enough readings to draw a trend over {window}: there are{" "}
            {String(readings.length)}
            {ruleIsUsable
              ? `, and this needs ${String(minimumPoints)}.`
              : ", and the number this needs has not been set."}
          </>
        )}

        {flaggedStatus === undefined || flagged === undefined || !enoughReadings ? null : (
          <>
            {" "}
            One reading is marked: <Value value={flagged.value} unit={unit} />{" "}
            <StatusPill status={flaggedStatus} describes={label} size="sm" />
          </>
        )}

        {shaded === undefined || !enoughReadings ? null : (
          <> The shaded band comes from {rangeOwner}.</>
        )}
      </p>
    </div>
  )
}

/**
 * How many readings the demo's imaginary product decided make a trend.
 *
 * A named constant rather than a literal beside the prop, because a number
 * written next to `minimumPoints` is exactly the shape the accessibility gate
 * refuses — and it is right to. In a real product this number arrives from the
 * metric's own definition, decided by somebody who knows what is being measured.
 * Nothing in opsinjs supplies it, this demo is not a source for it, and it means
 * nothing outside this file.
 */
const DEMO_READINGS_A_TREND_NEEDS = 4

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
          minimumPoints={DEMO_READINGS_A_TREND_NEEDS}
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
          minimumPoints={DEMO_READINGS_A_TREND_NEEDS}
        />
      </div>
    </div>
  )
}
