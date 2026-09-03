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
 * and it is the caller's: their boundaries, their names, and their decision
 * about whether any of them maps to a clinical status. Handed none, this
 * component renders the number and says in words that it has no band for it,
 * because a default band set would be a score interpretation with no clinical
 * owner — the single worst thing this file could contain.
 *
 * IT DERIVES NOTHING. The indicator's angle is arithmetic on `value`, `min` and
 * `max`; it never becomes a verdict. There is no comparison with other people,
 * no percentage, no rank, and no rule anywhere below of the shape "if the score
 * is past here then it is serious". `status` arrives on a band, from the
 * product, or it does not arrive at all.
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
 * THE TWIN IS NOT AN OPTION AND NO PROP CAN TURN IT OFF. `ScoreDial.BandName`
 * and `ScoreDial.Derivation` always render, visibly, in the document. The
 * measured CVD audit in `tokens/color.json` is why a graphic is worse than a
 * pill here: four ordered levels cannot be made mutually distinguishable by hue
 * for every form of colour vision, and an arc has no word in it at all.
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
 * The indicator's colour, one class list per level, written out.
 *
 * Tailwind reads class names out of source as literal strings, so this cannot
 * be built from the level at runtime: `text-status-${status}-ink` generates no
 * CSS at all and the mark renders in whatever it inherits.
 *
 * `-ink` rather than the bare `-<level>` (which is the LINE role) because the
 * indicator sits on the card rather than on the level's own tinted surface, and
 * `status.<level>.ink-on-page` is a pair the contrast rig actually measures.
 * `line-on-page` is not measured by anything, so a thin mark painted with it
 * would be a contrast claim nobody has checked.
 */
const INDICATOR_TONE: Record<ClinicalStatus, string> = {
  steady: "text-status-steady-ink",
  watch: "text-status-watch-ink",
  attention: "text-status-attention-ink",
  urgent: "text-status-urgent-ink",
}

/**
 * The fill for the one band the score fell in, when the product mapped it.
 *
 * `-accent` is the identity fill: chosen for recognition rather than for
 * contrast, never carrying text, never a sole boundary. That is exactly what a
 * band segment is here — the word, the glyph, `data-status` and the indicator
 * all say the same thing beside it — and `status.<level>.accent-on-page` is
 * measured against the non-text floor in both themes.
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
 * It is not `warnOnce` because none of these four complaints has an OPSIN code.
 * That table is generated from `tokens/errors.json`, and allocating a code in
 * it is not this component's to do; the omissions are reported upward instead.
 * The channel and the wording are the same either way.
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
   lower left. None of these five numbers is a clinical decision — they are the
   shape of a picture, in the SVG's own user units, and they are constants only
   so that the path, the boundary marks and the indicator cannot drift apart. */
const SWEEP_DEGREES = 240
const START_DEGREES = 210
const RADIUS = 38
const CENTRE_X = 50
const CENTRE_Y = 46

/** The track's thickness, and how far the two kinds of mark reach past it. */
const TRACK_WIDTH = 8
const BOUNDARY_REACH = 7
const INDICATOR_REACH = 10

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
   * The clinical status the product has mapped this band to, if it has mapped
   * one. Omit it and the band is drawn in neutral tones — bands are not
   * statuses unless the product says so, and a three-band dial coloured green,
   * amber and red is a traffic light, which is a verdict.
   */
  status?: ClinicalStatus
}

export interface ScoreDialProps {
  /** What the score is called, in the reader's language. Not an internal code. */
  label: string
  /**
   * The score. `null` renders the no-score state, which is not a score of zero:
   * zero is a real result on many scales and an absent one is not a result.
   */
  value: number | null
  /** The scale's lower bound. Required: an unbounded dial is unreadable. */
  min: number
  /** The scale's upper bound. Required, and it is stated to the reader. */
  max: number
  /**
   * The product's bands: contiguous, non-overlapping, covering the whole scale.
   * opsinjs ships none and never supplies a default. An empty list renders the
   * number with no band and says so, rather than inventing one.
   */
  bands: ScoreBand[]
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
   * not carry, so a caller who wants "2 hours ago" renders a RelativeTime
   * beside the dial and passes it one `now` for the whole screen.
   */
  measuredAt?: string
  /**
   * Decimal places for the score, from the product. Omitted, the number is
   * shown with exactly the digits it arrived with — nothing is rounded and
   * nothing is padded, because precision belongs to the metric and there is no
   * honest default for a composite score.
   */
  precision?: number
  /** BCP 47 locale for the number and the date. Omitted, the reader's own environment decides. */
  locale?: string
  /** Merged onto the root. A class passed here wins where the two conflict. */
  className?: string
}

/* ------------------------------------------------------------------ *
 * The component                                                       *
 * ------------------------------------------------------------------ */

/**
 * The band a score falls in, or `undefined`.
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
 * The one place this file formats a number, and it exists so that the spoken
 * sentence and the printed reading cannot disagree: `Value` prints the reading
 * with these same options, and a label that said "62" beside a dial reading
 * "62.0" would be two answers to one question. Everything else on screen —
 * the bounds, the coverage counts — is the product's description of its own
 * scale rather than the reader's measurement, and is rendered as written.
 */
function spokenScore(score: number, places: number | undefined, locale: string | undefined): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: places,
    maximumFractionDigits: places ?? MAX_FRACTION_DIGITS,
    roundingMode: "halfExpand",
  }).format(score)
}

export function ScoreDial({
  label,
  value,
  min,
  max,
  bands,
  derivation,
  coverage,
  category,
  measuredAt,
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
      `[opsinjs] <ScoreDial> was given min=${String(min)} and max=${String(max)}, ` +
        "which is not a scale: the upper bound must be above the lower one. The " +
        "arc was drawn empty and no indicator was placed, because a position on a " +
        "scale of no width is a picture with no meaning. The score and its words " +
        "are unaffected.",
    )
  }

  /* A number that arrived broken is not a missing score, and neither is treated
     as a position. `Value` keeps the two apart in words; this file only needs
     to know that there is nothing to place on the arc. */
  const score = value !== null && Number.isFinite(value) ? value : null

  const usableBands = Array.isArray(bands) ? bands : []
  if (usableBands.length === 0) {
    reportOnce(
      "bands",
      "[opsinjs] <ScoreDial> was given no bands. The score has been drawn with no " +
        "band and the words say so, which is the honest output: opsinjs ships no " +
        "scales, no bands and no cut-offs, and a substituted default would be a " +
        "score interpretation with no clinical owner. Pass the bands your product " +
        "defined, each with its own name.",
    )
  }

  /* Placement, and it is the whole of the arithmetic this component does. A
     score outside its own scale is clamped so the mark stays on the arc, and
     reported — the number and the bounds are both on screen in words, so a
     reader sees "120, on a scale of 0 to 100" and is not misled by the mark. */
  const rawFraction = scaleUsable && score !== null ? (score - min) / span : 0
  const fraction = clampFraction(rawFraction)
  if (score !== null && scaleUsable && rawFraction !== fraction) {
    reportOnce(
      "off-scale",
      `[opsinjs] <ScoreDial> was given the score ${String(score)} on a scale of ` +
        `${String(min)} to ${String(max)}. The indicator was drawn at the end of ` +
        "the arc rather than off it. Either the scale is wrong or the score is; " +
        "this component cannot tell which, and it will not widen a scale a product " +
        "declared.",
    )
  }

  const band = score !== null && scaleUsable ? bandAt(usableBands, score, max) : undefined

  /* The band's status, and it is an INPUT. This file ships as source into
     JavaScript projects where a type is advice, so a value outside the four
     levels is refused rather than approximated: there is no glyph for it, no
     word for it, and drawing a plausible one would be this component inventing
     a verdict about somebody's health. `unknown` gets its own code because it
     is the likeliest wrong answer and the most dangerous — it is the absence of
     an assertion, and a reader who sees it rendered as a level reads it as
     reassurance. */
  let status: ClinicalStatus | undefined
  if (band?.status !== undefined) {
    if (isClinicalStatus(band.status)) {
      status = band.status
    } else {
      warnOnce(band.status === "unknown" ? "OPSIN-0011" : "OPSIN-0021", {
        component: "ScoreDial",
        status: String(band.status),
      })
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

  /* The band in words, and there is always something to say. Where the product
     supplied no bands, or supplied bands this score falls outside, the words
     say exactly that rather than reaching for a nearby one: a band this
     component chose would be a score interpretation with no clinical owner. */
  const bandWords =
    score === null
      ? "No band, because there is no score."
      : band
        ? band.name
        : usableBands.length === 0
          ? "We do not have bands for this score."
          : "We do not have a band for this score."

  const scoreWords = score === null ? "no score yet" : spokenScore(score, precision, locale)
  /* "on a scale of 0 to 100" rather than "out of 100". This component's own
     specification is explicit that a score is not a mark out of a hundred, and
     "out of" is the phrasing that produces exactly that reading. */
  const scaleWords = `on a scale of ${String(min)} to ${String(max)}`
  const scaleSentence = `On a scale of ${String(min)} to ${String(max)}.`
  const derivationWords = derivationGiven
    ? derivation
    : "We cannot say what went into this score."

  /**
   * The accessible name for the arc: the whole component in one utterance.
   *
   * It repeats the visible twin on purpose. A reader who lands on the graphic
   * hears everything it depicts without having to go looking for the words,
   * and the words are still there, visible and readable, for everyone else.
   * The alternative — a graphic labelled only "dial" — is the tree of unlabelled
   * shapes that accessible-charts.mdx names as the failure.
   */
  const spoken = [
    `${label}: ${scoreWords}, ${scaleWords}.`,
    `${bandWords}${score !== null && band ? "." : ""}`,
    status ? `${CLINICAL_STATUS_META[status].word}.` : "",
    coverageShort && coverage
      ? `Based on ${String(coverage.available)} of ${String(coverage.expected)}.`
      : "",
    derivationWords,
  ]
    .filter((part) => part !== "")
    .join(" ")

  const StatusIcon = status === undefined ? undefined : ICONS[status]

  /* The internal boundaries only. The two ends of the scale are already drawn
     by the track's own ends, and a mark on top of them is a mark that reads as
     a band edge where there is no band beyond it. */
  const boundaries = scaleUsable
    ? usableBands
        .slice(1)
        .map((entry) => clampFraction((entry.from - min) / span))
        .filter((edge) => edge > 0 && edge < 1)
    : []

  /* No mark when there is no score to place, and none when the scale cannot be
     read. A mark drawn anyway would be a position asserted about a number that
     does not exist. */
  const indicator =
    score === null || !scaleUsable
      ? undefined
      : {
          inner: pointAt(fraction, RADIUS - INDICATOR_REACH),
          outer: pointAt(fraction, RADIUS + INDICATOR_REACH),
        }

  const measuredOn =
    measuredAt !== undefined && !Number.isNaN(Date.parse(measuredAt))
      ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(measuredAt))
      : undefined
  if (measuredAt !== undefined && measuredOn === undefined) {
    reportOnce(
      "measured-at",
      `[opsinjs] <ScoreDial> could not read measuredAt="${String(measuredAt)}" as a ` +
        "date, so no date was rendered. Pass ISO 8601 with an offset — " +
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
        viewBox="0 0 100 74"
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
              const active = band === entry && status !== undefined
              return (
                <path
                  key={`${String(index)}:${String(entry.from)}:${entry.name}`}
                  data-slot="score-dial-band"
                  /* Only the band the score fell in, and only when the product
                     mapped it. Colouring every band at once is the traffic
                     light this component exists not to be. */
                  data-status={active ? status : undefined}
                  d={TRACK_PATH}
                  pathLength={100}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={TRACK_WIDTH}
                  strokeLinecap="butt"
                  strokeDasharray={`${String(round(reach))} 100`}
                  strokeDashoffset={-round(opens * 100)}
                  className={active && status ? BAND_TONE[status] : "text-border"}
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
            data-status={status}
            x1={indicator.inner.x}
            y1={indicator.inner.y}
            x2={indicator.outer.x}
            y2={indicator.outer.y}
            stroke="currentColor"
            strokeWidth={4}
            strokeLinecap="round"
            className={status ? INDICATOR_TONE[status] : "text-foreground"}
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

        {/* Never omitted, never colour alone, and no prop can remove it. */}
        <p data-slot="score-dial-band-name" className="m-0 text-opsin-headline">
          {bandWords}
        </p>

        {status && StatusIcon ? (
          <p
            data-slot="score-dial-status"
            data-status={status}
            className={`${STATUS_ROW} ${INDICATOR_TONE[status]}`}
          >
            {/* Decorative: the word beside it carries the meaning, and
                announcing the glyph too would say the level twice. */}
            <StatusIcon aria-hidden="true" className="size-[1em] shrink-0" />
            <span>{CLINICAL_STATUS_META[status].word}</span>
          </p>
        ) : null}
      </div>

      <div
        data-slot="score-dial-scale"
        className="flex flex-col items-center gap-opsin-0-5 text-center text-opsin-footnote text-muted-foreground"
      >
        <p className="m-0">{scaleSentence}</p>
        {usableBands.length > 0 ? (
          <ul className="m-0 flex list-none flex-col gap-opsin-0-5 p-0">
            {usableBands.map((entry, index) => (
              <li key={`${String(index)}:${String(entry.from)}:${entry.name}`}>
                {String(entry.from)} up to {String(entry.to)} — {entry.name}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <p
        data-slot="score-dial-derivation"
        className="m-0 text-center text-opsin-footnote text-muted-foreground"
      >
        {coverageShort && coverage ? (
          <span data-slot="score-dial-coverage">
            Based on {String(coverage.available)} of {String(coverage.expected)}.{" "}
          </span>
        ) : null}
        {derivationWords}
        {measuredOn === undefined ? null : (
          <>
            {" "}
            <time data-slot="score-dial-measured-at" dateTime={measuredAt}>
              {measuredOn}
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
 * else's project, so it is public, reviewed code rather than a scratch demo.
 *
 * Every number in it is invented and every band is named for its position in a
 * list rather than for a judgement, because this file is one screenshot away
 * from outliving the page it was written for. There is no scale here anybody
 * uses, no threshold, and no band set that came from anywhere: the derivation
 * sentence says as much in the reader's own language, which is the only kind of
 * provenance an example is allowed to carry.
 */
export default function ScoreDialDemo() {
  return (
    <ScoreDial
      label="Example composite score"
      value={62}
      min={0}
      max={100}
      precision={0}
      bands={[
        { from: 0, to: 40, name: "First example band" },
        { from: 40, to: 70, name: "Second example band", status: "watch" },
        { from: 70, to: 100, name: "Third example band" },
      ]}
      coverage={{ available: 4, expected: 6 }}
      derivation={`${EXAMPLE_SOURCE}. The score, the scale and the bands here are invented, and nothing was calculated from anybody.`}
    />
  )
}
