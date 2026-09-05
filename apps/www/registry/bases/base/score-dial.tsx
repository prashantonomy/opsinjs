/**
 * ScoreDial — a composite number somebody's product calculated, drawn as an
 * arc, with the band it falls in named in words and a sentence saying what the
 * number is made of.
 *
 * THE RING IS THE DANGEROUS PART, and everything below is arranged around it. A
 * number inside a ring reads as authoritative, complete and personal however
 * thin the evidence behind it is, and a ring that fills up reads as a mark out
 * of a maximum. So the arc is never the message: it is a picture of where a
 * number the product supplied sits between two bounds the product supplied, and
 * the words beside it carry everything a reader needs. Cover the arc with your
 * hand and nothing is lost.
 *
 * OPSINJS SHIPS NO BANDS, NO SCALES AND NO CUT-OFFS. `bands` is a required prop
 * and it is the caller's: their boundaries, their names, and the name of
 * whoever chose them. Handed none, this component renders the number and says
 * in words that it has no band for it, because a default band set would be a
 * score interpretation with no clinical owner — the single worst thing this
 * file could contain. The zero-prop demo at the bottom therefore ships with no
 * bands at all, since `shadcn add` copies it into somebody else's project.
 *
 * IT ASSIGNS NO LEVEL. Band membership is arithmetic and it selects a NAME —
 * the product's own word for a stretch of its own scale. It never selects a
 * clinical status: `status` is a top-level prop, it is the product's verdict on
 * this reading, and this component has no rule anywhere of the shape "if the
 * score is past here then it is serious". An earlier version of this file hung
 * `status` off each band and let the comparison pick one, which meant a
 * rendering component was deciding what somebody's number meant. It no longer
 * does. `CLINICAL_STATUS_META.watch.assignedBy` is "The consuming product, from
 * a reference range it owns", and that is now literally who assigned it.
 *
 * AND IT PLACES NOTHING IT CANNOT PLACE HONESTLY. A score outside the scale it
 * was given gets no mark at all and a sentence saying so, rather than a mark
 * pinned to the end of the arc — a clamped indicator draws 140 and 100 in the
 * same place, which is the picture saying something definite and false while
 * the words say something true.
 *
 * WHY `role="img"` AND NOT `meter`. `meter` is exactly the role a dial looks
 * like it wants and exactly the one it must not have: it announces a value
 * within a range, which is the assertion this component is not entitled to
 * make, and it carries no band vocabulary. `progressbar` is worse — it implies
 * a task advancing towards completion, and a score is something that happened
 * to a person rather than something they are part-way through. `slider` implies
 * a value they can change. So: a labelled image, never focusable, never in the
 * tab order, with a mandatory visible text twin beside it.
 *
 * THE TWIN IS NOT AN OPTION AND NO PROP OF THIS COMPONENT TURNS IT OFF.
 * `ScoreDial.BandName` and `ScoreDial.Derivation` always render, visibly, in
 * the document. The one way a caller can still lose them is `className` — a
 * class that clips or hides wins the merge, and the doc comment on that prop
 * says so. The measured CVD audit in `tokens/color.json` is why a graphic is
 * worse than a pill here: four ordered levels cannot be made mutually
 * distinguishable by hue for every form of colour vision, and an arc has no
 * word in it at all.
 *
 * NOTHING ANIMATES. Not on first paint, not on a change, not under any prop.
 * `health/motion-in-health-ui` names the dial sweep specifically, and a sweep
 * has displayed, for every frame of its travel, a score that is not true.
 */

import { Check, Eye, OctagonAlert, TriangleAlert } from "lucide-react"

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
} from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { Value } from "@/registry/base-lyra/ui/value"

/**
 * The glyph for each level, bound from `CLINICAL_STATUS_META[level].icon`.
 *
 * The same map StatusPill holds, and it is written out here rather than shared
 * for the reason the substrate contract gives: a registry file may import
 * `@/lib/utils`, `@/lib/opsinjs` and another registry component, and nothing
 * else, and a bundler cannot resolve a `lucide-react` export from a runtime
 * string without pulling the whole icon set into a consumer's bundle. Typing it
 * `Record<ClinicalStatus, …>` makes a missing level a compile error rather than
 * a status with no glyph.
 */
const ICONS: Record<ClinicalStatus, typeof Check> = {
  steady: Check,
  watch: Eye,
  attention: TriangleAlert,
  urgent: OctagonAlert,
}

/* Development-only, and the same assertion StatusPill carries. If somebody
   changes an icon name in lib/status.ts and not here, this file keeps drawing a
   plausible glyph for the wrong level — which is the precise failure the
   four-distinct-shapes rule exists to prevent, and it is invisible in review
   because the dial still looks right. */
if (isDevelopment()) {
  for (const [level, Icon] of Object.entries(ICONS)) {
    const expected = CLINICAL_STATUS_META[level as ClinicalStatus].icon
    const actual = (Icon as { displayName?: string }).displayName
    if (actual && actual !== expected) {
      console.warn(
        `[opsinjs] ScoreDial renders <${actual}> for status "${level}", but ` +
          `CLINICAL_STATUS_META says the icon is "${expected}". Fix ICONS in ` +
          "score-dial.tsx; the four levels must be four distinct glyph shapes.",
      )
    }
  }
}

/**
 * The two levels a dial may carry, and the two it refuses.
 *
 * `attention` "always carries a named action" and `urgent` puts the action in
 * the first line — that is `health/clinical-status-semantics`, not a house
 * style. This component has nowhere to put an action: it renders a number, a
 * band name and a sentence about arithmetic, and a bare "Urgent" beside a
 * composite score is a level with no route to a person attached to it. So the
 * two upper levels are refused rather than rendered flat, and the refusal is
 * reported. A score that needs somebody to act belongs in a CareCard, which has
 * the action, or an AlertBanner, which has the assertive live region.
 */
const DIAL_STATUSES = ["steady", "watch"] as const

type DialStatus = (typeof DIAL_STATUSES)[number]

function isDialStatus(candidate: string): candidate is DialStatus {
  return (DIAL_STATUSES as readonly string[]).includes(candidate)
}

/**
 * The indicator's colour, one class list per level, written out.
 *
 * Tailwind reads class names out of source as literal strings, so this cannot
 * be built from the level at runtime: `text-status-${status}-ink` generates no
 * CSS at all and the mark renders in whatever it inherits.
 *
 * `-ink` rather than the bare `-<level>` (which is the LINE role) because the
 * indicator sits on the card rather than on the level's own tinted surface, and
 * `status.<level>.ink-on-page` is a pair the contrast rig actually measures —
 * and passes, in both themes, for both levels this component accepts.
 *
 * BE EXACT ABOUT WHAT "PAGE" IS THERE, because a card is not always it. The rig
 * measures those rows against `--opsin-neutral-0` in light and
 * `--opsin-neutral-950` in dark. In light `--card` is `oklch(1 0 0)`, which is
 * `--opsin-neutral-0` exactly, so a dial on a card is on the measured ground. In
 * dark `--card` sits one step lighter than `--opsin-neutral-950`, so the
 * recorded figure is near neighbour to the pairing on a card rather than the
 * pairing itself, and nothing has measured that one. `range-bar.tsx` reads the
 * same rows for the same roles and says the same thing; neither file asserts a
 * number for a pair the rig has not produced.
 */
const INDICATOR_TONE: Record<ClinicalStatus, string> = {
  steady: "text-status-steady-ink",
  watch: "text-status-watch-ink",
  attention: "text-status-attention-ink",
  urgent: "text-status-urgent-ink",
}

/**
 * The fill for the one band the score fell in, when the product assigned a
 * level to the reading.
 *
 * `-accent` is the identity fill: chosen for recognition rather than for
 * contrast, never carrying text, never a sole boundary. That is exactly what a
 * band segment is here — the word, the glyph, `data-status` and the indicator
 * all say the same thing beside it. It is worth stating what "never a sole
 * boundary" is doing for us: `lib/generated/contrast.json` measures
 * `status.watch.accent-on-page` at Lc 39.29 in light, below the Lc 45 non-text
 * floor, so a reader who could not tell this segment from its neighbours would
 * lose nothing that the words do not also carry. The page says so in the same
 * words rather than leaving the number in a generated file.
 */
const BAND_TONE: Record<ClinicalStatus, string> = {
  steady: "text-status-steady-accent",
  watch: "text-status-watch-accent",
  attention: "text-status-attention-accent",
  urgent: "text-status-urgent-accent",
}

/**
 * The label's tint, and the only place the category axis touches this
 * component.
 *
 * `-ink` because the label is text on the page, and `category.<name>.ink-on-page`
 * is measured. The track, the bands and the indicator never take a category
 * colour: a reader looking at one colour has to know whether it is answering
 * what the reading is about or how much attention it wants, and a dial that
 * mixed the two would make that unanswerable.
 */
const CATEGORY_TONE: Record<HealthCategory, string> = {
  sleep: "text-category-sleep-ink",
  heart: "text-category-heart-ink",
  activity: "text-category-activity-ink",
  nutrition: "text-category-nutrition-ink",
  mind: "text-category-mind-ink",
  labs: "text-category-labs-ink",
}

/**
 * The two class lists that have to sit beside a colour, kept whole.
 *
 * `cn()` cannot be used where a type step meets a colour. tailwind-merge
 * classifies an unfamiliar `text-*` utility as a colour, so
 * `cn("text-opsin-footnote", "text-status-urgent-ink")` returns only the second
 * and the element silently loses its size, its leading, its tracking and its
 * weight — verified against tailwind-merge 3.6.0. Joining them with a template
 * passes both through, and the two utilities set different CSS properties, so
 * both apply. Every place in this file where a type step meets a colour is
 * written this way.
 */
const LABEL_ROW = "m-0 text-center text-opsin-subheadline"
const STATUS_ROW = "m-0 inline-flex items-center gap-opsin-1 text-opsin-footnote"

/**
 * Which of this file's own complaints the session has already printed.
 *
 * The same shape `Value` uses, and for the same reason: in a production bundle
 * `isDevelopment()` is statically false, the body that touches this is dead
 * code, and the set is never allocated. In development it lives for the
 * session, so a grid of twelve dials with no bands prints one warning rather
 * than twelve.
 *
 * It is not `warnOnce` because none of these complaints has an OPSIN code. That
 * table is generated from `tokens/errors.json`, and allocating a code in it is
 * not this component's to do; the omissions are reported upward instead. The
 * channel and the wording are the same either way.
 *
 * The keys name WHICH complaint rather than what the component was holding at
 * the time — keying on a score would turn "warn once" into "warn every render".
 */
let reported: Set<string> | undefined

function reportOnce(key: string, message: string): void {
  if (!isDevelopment()) return
  reported ??= new Set<string>()
  if (reported.has(key)) return
  reported.add(key)
  console.warn(message)
}

/* ------------------------------------------------------------------ *
 * Geometry                                                            *
 * ------------------------------------------------------------------ */

/* The arc: a 240-degree sweep opening at the bottom, drawn clockwise from the
   lower left. None of these numbers is a clinical decision — they are the shape
   of a picture, in the SVG's own user units, and they are constants only so
   that the path, the boundary marks, the indicator and the viewBox cannot drift
   apart. */
const SWEEP_DEGREES = 240
const START_DEGREES = 210
const RADIUS = 38

/** The track's thickness, and how far the two kinds of mark reach past it. */
const TRACK_WIDTH = 8
const BOUNDARY_REACH = 7
const INDICATOR_REACH = 10
const INDICATOR_WIDTH = 4

/**
 * The furthest from the centre anything is drawn, and the box that fits it.
 *
 * Derived rather than typed in, because the previous constants were typed in
 * and were wrong: the indicator's outer tip reached radius 48 while the centre
 * sat at y=46, so for every score in the middle of the scale the tip was cut
 * off at the top of the viewBox — about a fifth of the only mark that shows
 * position, missing at exactly the place a reader looks first.
 *
 * `INDICATOR_WIDTH / 2` is the round cap, which extends the mark past its
 * endpoint. The half of `OUTER_REACH` in the height is `sin(30°)`: the sweep
 * ends at 210° and -30°, so the lowest drawn point is half a radius below the
 * centre. The `+ 1` and `+ 2` are margin, in user units.
 */
const OUTER_REACH = RADIUS + INDICATOR_REACH + INDICATOR_WIDTH / 2
const CENTRE_X = 50
const CENTRE_Y = OUTER_REACH + 1
const VIEW_WIDTH = 100
const VIEW_HEIGHT = Math.ceil(CENTRE_Y + OUTER_REACH / 2) + 2

/** `Intl.NumberFormat`'s ceiling, and the way to say "show the digits you were handed". */
const MAX_FRACTION_DIGITS = 20

function round(figure: number): number {
  return Math.round(figure * 1000) / 1000
}

/** A point on the sweep. `fraction` runs 0 at the low bound to 1 at the high one. */
function pointAt(fraction: number, radius: number): { x: number; y: number } {
  const radians = ((START_DEGREES - fraction * SWEEP_DEGREES) * Math.PI) / 180
  return {
    x: round(CENTRE_X + radius * Math.cos(radians)),
    /* Minus, because SVG's y grows downwards and the angle does not. */
    y: round(CENTRE_Y - radius * Math.sin(radians)),
  }
}

/**
 * The whole sweep, as one path, drawn once and reused for every segment.
 *
 * Every band is this same path with a dash pattern over it rather than a path
 * of its own, which is what keeps the segments exactly on the track and saves
 * working out an arc flag per band. `pathLength={100}` normalises the path's
 * length to 100 user units, so a dash offset is a percentage of the sweep and
 * the arithmetic below is the fraction arithmetic, unchanged.
 *
 * The two flags: large-arc is 1 because 240 degrees is more than half a turn,
 * and sweep is 1 because the path runs clockwise on screen — lower left, over
 * the top, lower right.
 */
const TRACK_PATH = (() => {
  const from = pointAt(0, RADIUS)
  const to = pointAt(1, RADIUS)
  return `M ${from.x} ${from.y} A ${RADIUS} ${RADIUS} 0 1 1 ${to.x} ${to.y}`
})()

/**
 * Keeps a DRAWING inside the arc. Never applied to a reading.
 *
 * A band whose bounds overhang the scale is clipped to the sweep, because the
 * sweep is all the arc there is; that is a fact about the picture. A score
 * outside the scale is a different thing entirely and is not clamped anywhere
 * below — it gets no mark and a sentence instead.
 */
function clampFraction(fraction: number): number {
  if (!Number.isFinite(fraction)) return 0
  return Math.min(Math.max(fraction, 0), 1)
}

/* ------------------------------------------------------------------ *
 * The API                                                             *
 * ------------------------------------------------------------------ */

/**
 * One named region of the scale, defined by the consuming product.
 *
 * Half-open: `from` is inclusive and `to` is exclusive, so contiguous bands can
 * be written without a gap and without an overlap. The one exception is the top
 * of the scale — a score exactly equal to `max` falls in the band whose `to` is
 * `max`, because otherwise the highest score a scale allows would belong to no
 * band at all.
 */
export interface ScoreBand {
  /** Inclusive lower bound, on the score's own scale. */
  from: number
  /** Exclusive upper bound, on the score's own scale. */
  to: number
  /**
   * The band in words, in the reader's language. Required: a band with no name
   * cannot be read aloud, cannot survive a black-and-white printout, and cannot
   * be told from its neighbour by anybody who does not see the colour.
   */
  name: string
  /**
   * Whose band this is, named for the reader: a published instrument, a
   * guideline body, your own clinical review. Required, and rendered on screen
   * beneath the band list.
   *
   * Two numbers that define an interval somebody is compared against are a
   * comparison a person chose, exactly like a reference range, and OPSIN-0004
   * says the thing to do about one with nobody's name on it. A band set carries
   * more weight than a bare range rather than less, because it comes with a
   * word for each interval. In an example this is `EXAMPLE_SOURCE`.
   */
  source: string
}

export interface ScoreDialProps {
  /** What the score is called, in the reader's language. Not an internal code. */
  label: string
  /**
   * The score. `null` renders the no-score state, which is not a score of zero:
   * zero is a real result on many scales and an absent one is not a result. A
   * value that is not a finite number is a third state again — a calculation
   * that ran and failed — and it is announced as one.
   */
  value: number | null
  /** The scale's lower bound. Required: an unbounded dial is unreadable. */
  min: number
  /** The scale's upper bound. Required, and it is stated to the reader. */
  max: number
  /**
   * The product's bands: contiguous, non-overlapping, covering the whole scale,
   * each named and each with a source. opsinjs ships none and never supplies a
   * default. An empty list renders the number with no band and says so, rather
   * than inventing one.
   */
  bands: ScoreBand[]
  /**
   * The level of attention this reading needs, assigned by the product from a
   * reference range or a threshold the product owns. An INPUT, never a
   * derivation: this component does not compare the score with anything and
   * decide what it means, because it does not know the reader.
   *
   * Only `steady` and `watch` are accepted. `attention` and `urgent` are
   * refused and reported, because both are defined as carrying a named action
   * and a dial has nowhere to put one — use CareCard or AlertBanner, which do.
   */
  status?: DialStatus
  /**
   * One sentence saying what went into the score and over what window.
   * Required, and always rendered. A dial that cannot explain itself is a
   * decorative authority claim, and Value is the honest component instead.
   */
  derivation: string
  /**
   * How much of the expected input the score was actually calculated from —
   * `{ available: 4, expected: 6 }`. When it is short the dial says so on its
   * face, because a reader has no other way to know that today's number rests
   * on a third of the usual evidence. What was counted is the derivation
   * sentence's job to name: this component does not know whether they were
   * nights, readings or days.
   */
  coverage?: { available: number; expected: number }
  /**
   * Tints the label, and nothing else. Never the track, the bands or the
   * indicator — those belong to the status axis, and one surface carries one
   * axis.
   */
  category?: HealthCategory
  /**
   * When the score was calculated, ISO 8601. Rendered as a date beside the
   * derivation. It gets no staleness treatment and no relative phrasing: a
   * relative phrase needs the instant to measure against, which this API does
   * not carry, and a staleness window is a number opsinjs does not own for any
   * metric. A caller who needs "2 hours ago", or needs an old score to LOOK
   * old, renders a RelativeTime beside the dial and passes it one `now` for the
   * whole screen. This prop is not `measuredAt`: nothing here was measured.
   */
  calculatedAt?: string
  /**
   * Decimal places for the score, from the product. Omitted, the number is
   * shown with exactly the digits it arrived with — nothing is rounded and
   * nothing is padded, because precision belongs to the metric and there is no
   * honest default for a composite score. It is load-bearing for layout as well
   * as for honesty: an unstated precision can print nineteen digits of a double
   * as one unbreakable token.
   */
  precision?: number
  /** BCP 47 locale for every number and the date. Omitted, the reader's own environment decides. */
  locale?: string
  /**
   * Merged onto the root, and a class passed here WINS over the component's own
   * where the two conflict.
   *
   * That includes `truncate`, `sr-only`, a zeroed type size and any fixed
   * height. The band name, the scale and the derivation are mandatory content
   * that no prop of this component removes, and a class that clips or hides
   * them is the one way left to remove them anyway. The accessible sentence on
   * the arc would survive; the words a sighted reader needs would not.
   */
  className?: string
}

/* ------------------------------------------------------------------ *
 * The component                                                       *
 * ------------------------------------------------------------------ */

/**
 * The band a score falls in, or `undefined`.
 *
 * This selects a NAME and nothing else — the product's own word for a stretch
 * of the product's own scale. It does not select a level, and no level is
 * reachable from it: `status` arrives as a prop or it does not arrive.
 *
 * First match wins, so overlapping bands resolve in the order the product
 * declared them rather than by any rule of this component's. The `max` clause
 * is the top-of-scale exception described on `ScoreBand`.
 */
function bandAt(list: ScoreBand[], score: number, max: number): ScoreBand | undefined {
  return list.find(
    (entry) =>
      (score >= entry.from && score < entry.to) || (score === max && score === entry.to),
  )
}

/**
 * The score as the accessible sentence will say it.
 *
 * It exists so that the spoken sentence and the printed reading cannot
 * disagree: `Value` prints the reading with these same options, and a label
 * that said "14" beside a dial reading "14.0" would be two answers to one
 * question.
 *
 * Rounding is `halfExpand` — round-half-away-from-zero, `numbers-units-precision`
 * rule 3 — and it is INHERITED rather than named. `roundingMode` is an ES2023
 * addition to `Intl.NumberFormatOptions`, so spelling it out here makes this
 * file fail to typecheck in a consumer whose `lib` stops at ES2022, and this
 * file ships as source into those projects. `halfExpand` is the formatter's own
 * default, so the behaviour is identical either way; see the longer note in
 * `value.tsx`, which records where the regression was found. Do not put it back.
 */
function spokenScore(score: number, places: number | undefined, locale: string | undefined): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: places,
    maximumFractionDigits: places ?? MAX_FRACTION_DIGITS,
  }).format(score)
}

/**
 * Every other number this component prints: the bounds, the band edges, the
 * coverage counts.
 *
 * They go through the reader's locale too. They are the product's description
 * of its own scale rather than the reader's measurement, which settles whether
 * they need a unit and settles nothing about how a numeral is spelled — a
 * reader does not change number systems between two lines of one card. Before
 * this existed, a `de-DE` dial printed the score with a comma three lines above
 * a scale sentence spelling its bounds with a point, and `String()` printed
 * 1e21 as "1e+21".
 */
function plain(figure: number, locale: string | undefined): string {
  if (!Number.isFinite(figure)) return String(figure)
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: MAX_FRACTION_DIGITS,
  }).format(figure)
}

export function ScoreDial({
  label,
  value,
  min,
  max,
  bands,
  status,
  derivation,
  coverage,
  category,
  calculatedAt,
  precision,
  locale,
  className,
}: ScoreDialProps) {
  /* THE SCALE HAS TO BE A SCALE. A span of zero or less has no positions in it,
     and every fraction below would be a division by zero rendered as an
     indicator pinned to one end — a picture that says something definite about
     a scale nobody can read. Reported, and the arc is drawn without bands or an
     indicator so that the words are still true. */
  const span = max - min
  const scaleUsable = Number.isFinite(span) && span > 0
  if (!scaleUsable) {
    reportOnce(
      "scale",
      `[opsinjs] <ScoreDial> was given min=${plain(min, locale)} and max=${plain(max, locale)}, ` +
        "which is not a scale: the upper bound must be above the lower one. The " +
        "arc was drawn empty, no indicator was placed and no band list was shown, " +
        "because a position on a scale of no width is a picture with no meaning. " +
        "The score and its words are unaffected.",
    )
  }

  /* THREE STATES, NOT TWO, and keeping them three is the whole of the null
     handling here. A number that arrived broken is a calculation that ran and
     failed; an absent one is a calculation that never ran. `Value` keeps them
     apart in the visible words, and this file has to keep them apart in the
     spoken ones — the aria-label is this component's own string, and a reader
     told "no score yet" about a number that DID exist and arrived broken has
     been told something untrue about their own record. */
  const broken = value !== null && !Number.isFinite(value)
  const score = value !== null && !broken ? value : null

  const usableBands = Array.isArray(bands) ? bands : []
  if (usableBands.length === 0) {
    reportOnce(
      "bands",
      "[opsinjs] <ScoreDial> was given no bands. The score has been drawn with no " +
        "band and the words say so, which is the honest output: opsinjs ships no " +
        "scales, no bands and no cut-offs, and a substituted default would be a " +
        "score interpretation with no clinical owner. Pass the bands your product " +
        "defined, each with its own name and its own source.",
    )
  }

  /* OPSIN-0004, in the shape a band set takes. A band is two numbers that
     define an interval somebody is compared against, which is the same class of
     claim as a reference range: somebody chose those boundaries, and the reader
     is entitled to know who. The type requires `source`; this file ships as
     source into JavaScript projects where a type is advice. */
  const bandSources = Array.from(
    new Set(
      usableBands
        .map((entry) => (typeof entry.source === "string" ? entry.source.trim() : ""))
        .filter((entry) => entry !== ""),
    ),
  )
  const bandSourcesComplete =
    usableBands.length > 0 &&
    usableBands.every((entry) => typeof entry.source === "string" && entry.source.trim() !== "")
  if (usableBands.length > 0 && !bandSourcesComplete) {
    warnOnce("OPSIN-0004", { component: "ScoreDial" })
  }

  /* THE LEVEL IS AN INPUT. Refused rather than approximated when it is not one
     this surface can discharge: there is no glyph for a level outside the four,
     no action attached to the two upper ones here, and `unknown` is the absence
     of an assertion rather than a fifth level — a reader who sees it rendered
     as one reads it as reassurance. `String()` first, because a JavaScript
     caller can pass anything at all. */
  const given = status === undefined ? undefined : String(status)
  let level: DialStatus | undefined
  if (given !== undefined) {
    if (isDialStatus(given)) {
      level = given
    } else if (given === "unknown") {
      warnOnce("OPSIN-0011", { component: "ScoreDial" })
    } else if (isClinicalStatus(given)) {
      reportOnce(
        "status-level",
        `[opsinjs] <ScoreDial> was given status="${given}" and rendered no status ` +
          "at all. That level is defined as carrying a named action — who to " +
          "contact, what to do, in the first line — and a dial has nowhere to put " +
          "one: it renders a number, a band name and a sentence about arithmetic. " +
          "A bare status word beside a composite score is a level with no route to " +
          "a person attached to it. Render a CareCard, which carries the action, or " +
          "an AlertBanner, and keep the dial for the number.",
      )
    } else {
      warnOnce("OPSIN-0021", { component: "ScoreDial", status: given })
    }
  }

  /* OPSIN-0010. A category outside the six has no ramp, so the label would take
     no tint at all and the axis would silently be gone. */
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

  /* NO OPSIN-0001 HERE, AND THAT IS DELIBERATE. This component takes both a
     category and a status, and that is not the conflict the code describes: the
     conflict is two axes resolving on ONE element. The category reaches the
     label and nothing else; the status reaches the indicator and the band the
     score fell in and nothing else. Putting the category on the surface and the
     status inside it is the repair OPSIN-0001 asks for, built in. */

  /* Derivation is mandatory content, so an empty one is reported and replaced
     by words that say what is missing, rather than by an empty line the reader
     would read as "there was nothing to say". There is no OPSIN code for this
     yet; allocating one is not this file's to do, so the omission is reported
     upward and the channel is the same. */
  const derivationGiven = typeof derivation === "string" && derivation.trim() !== ""
  if (!derivationGiven) {
    reportOnce(
      "derivation",
      "[opsinjs] <ScoreDial> was given no derivation. A sentence saying what went " +
        "into the score and over what window is mandatory content, not an option: " +
        "a bare number with no method invites the reader to supply one, and they " +
        "will supply something worse than the truth. The dial now says that it " +
        "cannot explain itself, which is true and is not what you want on screen. " +
        "If nobody can write that sentence, render a Value instead of a dial.",
    )
  }

  const coverageShort =
    coverage !== undefined &&
    Number.isFinite(coverage.available) &&
    Number.isFinite(coverage.expected) &&
    coverage.available < coverage.expected

  /* OFF THE SCALE IS NOT AT THE END OF IT. The mark is refused and the words
     say why, because an indicator clamped to the terminal draws 140 and 100 in
     the same place: the picture asserts something specific and false while the
     words beside it are true, which is the one configuration the two-channel
     design exists to prevent. This component will not widen a scale a product
     declared either — it cannot tell whether the scale is wrong or the score
     is. */
  const offScale = score !== null && scaleUsable && (score < min || score > max)
  if (offScale && score !== null) {
    reportOnce(
      "off-scale",
      `[opsinjs] <ScoreDial> was given the score ${plain(score, locale)} on a scale ` +
        `of ${plain(min, locale)} to ${plain(max, locale)}. No indicator was drawn ` +
        "and the dial says in words that the score is outside its scale, because a " +
        "mark at the end of the arc would show an off-scale score in the same place " +
        "as one exactly at the bound. Either the scale is wrong or the score is; " +
        "this component cannot tell which.",
    )
  }

  const placeable = score !== null && scaleUsable && !offScale
  const fraction = placeable && score !== null ? (score - min) / span : 0

  const band = placeable && score !== null ? bandAt(usableBands, score, max) : undefined

  /* The band in words, and there is always something to say. Where the product
     supplied no bands, or supplied bands this score falls outside, the words
     say exactly that rather than reaching for a nearby one: a band this
     component chose would be a score interpretation with no clinical owner. */
  const bandWords = broken
    ? "No band, because the score did not arrive."
    : score === null
      ? "No band, because there is no score."
      : !scaleUsable
        ? "We cannot place this score, because the scale has no width."
        : offScale
          ? "We cannot place this score, because it is outside the scale it was given."
          : band
            ? band.name
            : usableBands.length === 0
              ? "We do not have bands for this score."
              : "We do not have a band for this score."

  /* The same three states again, in the same words `Value` prints for them, so
     the ear and the eye get one answer between them. */
  const scoreWords = broken
    ? "not available"
    : score === null
      ? "no score yet"
      : spokenScore(score, precision, locale)

  /* "on a scale of" rather than "out of". This component's own specification is
     explicit that a score is not a mark out of its upper bound, and "out of" is
     the phrasing that produces exactly that reading. */
  const scaleWords = `on a scale of ${plain(min, locale)} to ${plain(max, locale)}`
  const scaleSentence = `On a scale of ${plain(min, locale)} to ${plain(max, locale)}.`
  const derivationWords = derivationGiven
    ? derivation
    : "We cannot say what went into this score."
  /* ATTRIBUTION IS ALL-OR-NOTHING. The gate is `bandSourcesComplete`, not
     "some band named a source": printing "Bands from Dr Okafor's 2025 review."
     over a list where only the first interval came from that review credits the
     rest of the scale to somebody who never chose it, which is a
     reference-range-class claim with a false author — the thing OPSIN-0004
     exists to stop. One unattributed band makes the whole set unattributed. */
  const bandSourceWords = bandSourcesComplete
    ? `Bands from ${bandSources.join("; ")}.`
    : "We do not know whose bands these are."

  /* The level is about the reading, so with no reading there is no level to
     show. It is not attached to the band: a band is a stretch of a scale and a
     status is what the product says about this number. */
  const shownLevel = score === null ? undefined : level

  /**
   * The accessible name for the arc: the whole component in one utterance.
   *
   * It repeats the visible twin on purpose, and the substrate contract requires
   * `role="img"` with a label here rather than an `aria-hidden` graphic. The
   * alternative — a graphic labelled only "dial" — is the tree of unlabelled
   * shapes that accessible-charts.mdx names as the failure.
   */
  const spoken = [
    `${label}: ${scoreWords}, ${scaleWords}.`,
    `${bandWords}${score !== null && band ? "." : ""}`,
    shownLevel ? `${CLINICAL_STATUS_META[shownLevel].word}.` : "",
    coverageShort && coverage
      ? `Based on ${plain(coverage.available, locale)} of ${plain(coverage.expected, locale)}.`
      : "",
    derivationWords,
  ]
    .filter((part) => part !== "")
    .join(" ")

  const StatusIcon = shownLevel === undefined ? undefined : ICONS[shownLevel]

  /* THE INTERNAL EDGES, BY VALUE RATHER THAN BY POSITION IN THE ARRAY. The API
     permits unordered and non-contiguous bands and says this component does not
     reorder, merge or repair them, so taking every edge but the first DECLARED
     one drew the wrong marks for any band set written out of order, and silently
     dropped a real edge. Every `from` and every `to` becomes a candidate; the
     two ends of the scale are excluded because the track's own ends already draw
     them, and a mark on top of one reads as a band edge with no band beyond it. */
  const boundaries = scaleUsable
    ? Array.from(
        new Set(
          usableBands
            .flatMap((entry) => [entry.from, entry.to])
            .map((edge) => round((edge - min) / span))
            .filter((edge) => edge > 0 && edge < 1),
        ),
      )
    : []

  /* No mark when there is no score to place, none when the scale cannot be
     read, and none when the score is off the scale. A mark drawn anyway would
     be a position asserted about a number that does not have one. */
  const indicator = placeable
    ? {
        inner: pointAt(fraction, RADIUS - INDICATOR_REACH),
        outer: pointAt(fraction, RADIUS + INDICATOR_REACH),
      }
    : undefined

  const calculatedOn =
    calculatedAt !== undefined && !Number.isNaN(Date.parse(calculatedAt))
      ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(calculatedAt))
      : undefined
  if (calculatedAt !== undefined && calculatedOn === undefined) {
    reportOnce(
      "calculated-at",
      `[opsinjs] <ScoreDial> could not read calculatedAt="${String(calculatedAt)}" as ` +
        "a date, so no date was rendered. Pass ISO 8601 with an offset — " +
        "2026-03-14T08:12:00+01:00 — because an instant with no offset is read in " +
        "whichever zone the code happens to be running in.",
    )
  }

  return (
    <div
      data-slot="score-dial"
      className={cn(
        /* Stacked, always, and there is no overlaid variant to reflow from.
           A score sitting inside the ring is the arrangement that breaks first
           when a reader turns their text up, and the requirement is that the
           derivation sentence never truncates. Laying it out this way once
           means 200% is not a special case that has to be remembered. */
        "flex w-full max-w-[32em] flex-col items-center gap-opsin-2 text-opsin-body",
        className
      )}
    >
      {/* Joined rather than merged - see LABEL_ROW above for why `cn()` cannot
          be used where a type step meets a colour. */}
      <p
        data-slot="score-dial-label"
        data-category={tint}
        className={`${LABEL_ROW} ${tint ? CATEGORY_TONE[tint] : "text-muted-foreground"}`}
      >
        {label}
      </p>

      <svg
        data-slot="score-dial-track"
        /* A labelled image, and nothing more. Not a meter, not a progressbar,
           not a slider, and never in the tab order: this is a picture of a
           reading somebody else assigned, and it has no value semantics of its
           own to offer. */
        role="img"
        aria-label={spoken}
        focusable="false"
        viewBox={`0 0 ${String(VIEW_WIDTH)} ${String(VIEW_HEIGHT)}`}
        /* Sized in em rather than px so the arc grows with the reader's own
           text size instead of staying put while the words around it grow. */
        className="h-auto w-full max-w-[16em]"
      >
        {/* The full sweep, always fully drawn, so the scale's extent is visible
            whether or not there is a score to place on it. */}
        <path
          d={TRACK_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth={TRACK_WIDTH}
          strokeLinecap="butt"
          className="text-border"
        />

        {scaleUsable
          ? usableBands.map((entry, index) => {
              const opens = clampFraction((entry.from - min) / span)
              const closes = clampFraction((entry.to - min) / span)
              const reach = Math.max(closes - opens, 0) * 100
              if (reach <= 0) return null
              const active = band === entry && shownLevel !== undefined
              return (
                <path
                  key={`${String(index)}:${String(entry.from)}:${entry.name}`}
                  data-slot="score-dial-band"
                  /* Only the band the score fell in, and only when the product
                     assigned a level to the reading. Colouring every band at
                     once is the traffic light this component exists not to be. */
                  data-status={active ? shownLevel : undefined}
                  d={TRACK_PATH}
                  pathLength={100}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={TRACK_WIDTH}
                  strokeLinecap="butt"
                  strokeDasharray={`${String(round(reach))} 100`}
                  strokeDashoffset={-round(opens * 100)}
                  className={active && shownLevel ? BAND_TONE[shownLevel] : "text-border"}
                />
              )
            })
          : null}

        {/* Boundary marks: how the bands are told apart with no colour at all,
            alongside their position and their names below. */}
        {boundaries.map((edge) => {
          const inner = pointAt(edge, RADIUS - BOUNDARY_REACH)
          const outer = pointAt(edge, RADIUS + BOUNDARY_REACH)
          return (
            <line
              key={`boundary:${String(edge)}`}
              data-slot="score-dial-boundary"
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="currentColor"
              strokeWidth={1.5}
              className="text-muted-foreground"
            />
          )
        })}

        {indicator === undefined ? null : (
          <line
            data-slot="score-dial-indicator"
            data-status={shownLevel}
            x1={indicator.inner.x}
            y1={indicator.inner.y}
            x2={indicator.outer.x}
            y2={indicator.outer.y}
            stroke="currentColor"
            strokeWidth={INDICATOR_WIDTH}
            strokeLinecap="round"
            className={shownLevel ? INDICATOR_TONE[shownLevel] : "text-foreground"}
          />
        )}
      </svg>

      <div
        data-slot="score-dial-reading"
        className="flex flex-col items-center gap-opsin-0-5 text-center"
      >
        <span data-slot="score-dial-score">
          <Value
            value={value}
            precision={precision}
            locale={locale}
            absenceLabel="no score yet"
            size="display"
          />
        </span>

        {/* Never omitted, never colour alone, and no prop of this component
            removes it. */}
        <p data-slot="score-dial-band-name" className="m-0 text-opsin-headline">
          {bandWords}
        </p>

        {shownLevel && StatusIcon ? (
          <p
            data-slot="score-dial-status"
            data-status={shownLevel}
            className={`${STATUS_ROW} ${INDICATOR_TONE[shownLevel]}`}
          >
            {/* Decorative: the word beside it carries the meaning, and
                announcing the glyph too would say the level twice. */}
            <StatusIcon aria-hidden="true" className="size-[1em] shrink-0" />
            <span>{CLINICAL_STATUS_META[shownLevel].word}</span>
          </p>
        ) : null}
      </div>

      <div
        data-slot="score-dial-scale"
        className="flex flex-col items-center gap-opsin-0-5 text-center text-opsin-footnote text-muted-foreground"
      >
        <p className="m-0">{scaleSentence}</p>
        {usableBands.length > 0 && scaleUsable ? (
          <>
            <ul className="m-0 flex list-none flex-col gap-opsin-0-5 p-0">
              {usableBands.map((entry, index) => (
                <li key={`${String(index)}:${String(entry.from)}:${entry.name}`}>
                  {plain(entry.from, locale)} up to {plain(entry.to, locale)} — {entry.name}
                </li>
              ))}
            </ul>
            {/* Whose bands these are. A band set is a comparison somebody chose,
                and the reader is entitled to the name — or to be told plainly
                that there isn't one. */}
            <p data-slot="score-dial-band-source" className="m-0">
              {bandSourceWords}
            </p>
          </>
        ) : null}
        {usableBands.length > 0 && !scaleUsable ? (
          /* The band list is suppressed rather than left standing, because a
             reader told "we cannot place this score" while looking at a list
             whose first row contains it has been given two answers. */
          <p className="m-0">No bands are shown, because the scale has no width.</p>
        ) : null}
      </div>

      <p
        data-slot="score-dial-derivation"
        className="m-0 text-center text-opsin-footnote text-muted-foreground"
      >
        {coverageShort && coverage ? (
          <span data-slot="score-dial-coverage">
            Based on {plain(coverage.available, locale)} of {plain(coverage.expected, locale)}.{" "}
          </span>
        ) : null}
        {derivationWords}
        {calculatedOn === undefined ? null : (
          <>
            {" "}
            <time data-slot="score-dial-calculated-at" dateTime={calculatedAt}>
              {calculatedOn}
            </time>
          </>
        )}
      </p>
    </div>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it into somebody
 * else's project, so it is public, reviewed code rather than a scratch demo —
 * and that is why it has no bands. An earlier version of this function shipped
 * three of them, with a level mapped to the middle one, on the exact scale and
 * score shape every consumer wellness index uses: a score interpretation with no
 * clinical owner, copied verbatim into every project that ran
 * `shadcn add score-dial`, and served as text at /r/score-dial.json to programs
 * that read it as fact. ADR 0012 forbids exactly that, "not even as an example".
 *
 * So the demo shows the refusal instead, which is the most important thing this
 * component does. The scale is ten to twenty and the score is fourteen, which
 * is ADR 0012's own shape for a number nobody could mistake for their own.
 */
export default function ScoreDialDemo() {
  return (
    <ScoreDial
      label="Example composite score"
      value={14}
      min={10}
      max={20}
      precision={0}
      bands={[]}
      derivation={`${EXAMPLE_SOURCE}. The score and the scale here are invented, nothing was calculated from anybody, and no bands are supplied because opsinjs has none to supply.`}
    />
  )
}
