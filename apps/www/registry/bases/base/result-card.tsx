/**
 * ResultCard — one result, complete: what was measured, the number, where it
 * sits against the range somebody supplied, what that means in words, and what
 * to do next.
 *
 * THIS FILE COMPOSES AND IT DOES NOT RE-IMPLEMENT. Every number goes through
 * `Value`, every level goes through `StatusPill`, every comparison against an
 * interval goes through `RangeBar`, every instant goes through `RelativeTime`,
 * and every control that acts rather than navigates goes through `Button`.
 * Nothing here formats a number, draws a level, positions a tick or decides
 * when a reading is old. A composite that re-implemented any of those would be
 * a second copy of a rule, and the two colour axes are the one thing in this
 * system that must never say two different things in two places.
 *
 * WHAT IT ASSERTS. That a measurement was taken, at an instant, in a unit; and,
 * where the product supplied them, which interval it is being compared with and
 * which level of attention the product has assigned to it. Each of those is a
 * separate claim, each may be absent on its own, and an absent one renders as
 * an absence rather than as a substituted default.
 *
 * IT DERIVES NO LEVEL. `status` is an input. There is no comparison in this
 * file between a reading and a bound, and there will not be one: turning
 * "outside the range" into "needs attention" needs a clinician or a validated
 * rule, and it belongs to whoever owns the range. Most people sit outside at
 * least one reference interval at any moment.
 *
 * THE TWO AXES SIT ON DIFFERENT ELEMENTS, and this component is the worked
 * example of that rule. The card's surface is neutral at every level — a card
 * whose whole background turns amber converts one measurement into an emotional
 * event, and a screen of four of them is unreadable. The status axis reaches
 * exactly one element, the pill, which is a child of the header. The category
 * axis reaches exactly one element, the title, which is its sibling. No element
 * resolves both, so there is nothing here for `axisConflict()` to report — and
 * calling it on the props object would be the mistake, because a card given a
 * category AND a level is the correct shape rather than the collision.
 *
 * IT OWNS NO CLINICAL NUMBER. No interval, no staleness boundary, no
 * plausibility bound, no precision default. `staleAfterHours` is passed
 * straight through to `RelativeTime`, which is where the boundary is applied;
 * omit it and there is no staleness treatment at all, which is the honest
 * output when nobody has said what old means for this measurement.
 *
 * AND IT SHIPS NO DISCLAIMER. The specification's part list asks the footnote
 * to carry a not-medical-advice note "by rule"; this file renders provenance
 * there and nothing else. Default legal text is the one string opsinjs may
 * never ship — it is jurisdictional, it is the product's to write, and a
 * sentence supplied by a design system is a sentence nobody reviewed. The
 * component for it is `DisclaimerNote`, placed by the product.
 *
 * NOTHING ANIMATES. Not the number, not the bar, not the card's arrival. A
 * health value that comes in by animation has displayed, for every frame of the
 * journey, a figure that is not true.
 */

import { Fragment, type ReactNode } from "react"

import {
  EXAMPLE_SOURCE,
  HEALTH_CATEGORIES,
  isDevelopment,
  isHealthCategory,
  warnOnce,
  type ClinicalStatus,
  type HealthCategory,
  type ReferenceRange,
} from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/base-lyra/ui/button"
import { RangeBar } from "@/registry/base-lyra/ui/range-bar"
import { RelativeTime } from "@/registry/base-lyra/ui/relative-time"
import { StatusPill } from "@/registry/base-lyra/ui/status-pill"
import { Value } from "@/registry/base-lyra/ui/value"

/**
 * Development warnings, said once per distinct offender.
 *
 * `warnOnce` in the substrate is keyed to an `OpsinErrorCode`, and those codes
 * describe mistakes a consumer makes with the CLINICAL api. Most of what this
 * file complains about is a composition mistake instead — three actions, a
 * range with no unit to read it in, a reading supplied twice — and a component
 * may not mint a code: the table is generated from `tokens/errors.json` and is
 * a versioned contract. So this file keeps its own small set, keyed on the
 * offender rather than on the message, because a warning that repeats on every
 * render — and twice per render under Strict Mode — is a channel somebody
 * switches off, and switching it off costs the real warnings too.
 *
 * Declared rather than allocated. In a production bundle `isDevelopment()` is
 * statically false, every call below is dead code, and the set is never made.
 */
let warned: Set<string> | undefined

function warnDev(key: string, message: string): void {
  if (!isDevelopment()) return
  warned ??= new Set<string>()
  if (warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

/**
 * The category tint, on the title and on nothing else.
 *
 * Written out as literal class strings because Tailwind reads class names out
 * of source as text: `text-category-${category}-ink` generates no CSS at all
 * and the title renders in the inherited colour, which is the failure that
 * looks like nothing happening.
 *
 * `-ink` rather than the bare name, which is the ACCENT role on this axis —
 * the identity fill, chosen for recognition rather than for contrast, and never
 * text. The asymmetry between the axes is real and is worth restating: the bare
 * status name is the LINE role, the bare category name is the ACCENT role.
 *
 * Category colour is identity — what this reading is about — and never a
 * verdict, so no word accompanies it. In greyscale it says nothing, and nothing
 * is what it is entitled to say: the title beside it already names the
 * measurement in full.
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
 * The hit-area floor, carried in the component rather than in the theme.
 *
 * `app/product.css` has a backstop for this and it does not travel with the
 * file: `shadcn add` copies this component into a project whose stylesheet
 * opsinjs has never seen. Both axes, because a card in a narrow column is not
 * wide, and a floor that holds on one axis is not a floor. The token is a rem,
 * so it grows with the reader's own text size instead of pinning at 44 device
 * pixels — and the literal fallback is what keeps it a floor in a project that
 * has not imported the token sheet.
 */
const TARGET_FLOOR =
  "min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem)"

/**
 * An action that navigates, in its two weights.
 *
 * A link rather than a `Button`, because `Button` is a real `<button>` and
 * refuses `href` on purpose: a control that produces a new url can be opened in
 * a new tab, copied, and found in a screen reader's list of links, and none of
 * that survives being re-implemented as a button with a click handler.
 *
 * The recommended one is bordered, on a larger target, and set on its own
 * surface; the other has none of those. The two therefore differ by a boundary
 * and a size rather than by hue, which is what "not distinguished by colour
 * alone" has to mean on a surface where the only colours available are neutral:
 * a border and a bigger box survive greyscale and a black-and-white printout.
 *
 * BE PRECISE ABOUT THE FILL, because the page used to claim one. `bg-card` is
 * the card's own ground, so on a ResultCard it paints no visible fill at all —
 * it is the explicit surface that keeps the link readable if a caller gives the
 * card a different ground, and nothing more. The boundary and the target are
 * the difference a reader can see. All of it is argued rather than measured.
 */
const ACTION_LINK =
  `inline-flex ${TARGET_FLOOR} max-w-full items-center justify-center ` +
  "rounded-opsin-md border border-border bg-card px-opsin-5 py-opsin-2 " +
  "text-center text-opsin-headline text-foreground underline underline-offset-4 " +
  "hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

const ALTERNATIVE_LINK =
  `inline-flex ${TARGET_FLOOR} max-w-full items-center justify-center ` +
  "px-opsin-2 py-opsin-1 text-center text-opsin-headline " +
  "text-foreground underline underline-offset-4 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

/**
 * `Button variant="quiet"` has no border, no fill and no underline: a label
 * with a hover fill, which a touch reader never sees. The underline is what
 * makes the handler form of an alternative action look like the link form of
 * one, so the same prop does not render an obvious control in one card and
 * something indistinguishable from a paragraph in the next.
 */
const ALTERNATIVE_BUTTON = "underline underline-offset-4"

/**
 * One part of a compound reading — the two numbers that are one measurement.
 *
 * THIS IS THE RESOLUTION OF A CONTRADICTION IN THE SPECIFICATION, and it is
 * recorded here as well as on the page. The proposed interface typed `value` as
 * `number | string | null` so that "128/78" could be passed as text, while the
 * part tree routed every reading through `Value`, whose `value` is
 * `number | null`. A string has nowhere to go: it cannot be formatted to the
 * measurement's precision, cannot be shaped for a locale, cannot have its unit
 * spoken, and cannot be published as a machine-readable datum — every one of
 * which is a thing `Value` exists to do, and every one of which is a promise
 * the rest of this system has already made about numbers. So the compound
 * reading is a list of numbers, each of which is a real `Value`, which is the
 * same shape `ReadingInput` uses to take one in.
 *
 * Each segment carries a `label` because "128 over 78" is meaningless read
 * aloud without one, and the labels are the product's words rather than this
 * component's: opsinjs does not know which measurements are compound, and a
 * built-in list of them would be a clinical vocabulary shipped as a default.
 */
export interface ResultSegment {
  /**
   * What this part of the reading is, in the reader's language — the word a
   * listener needs before the number for the pair to mean anything. It is
   * announced and is not drawn: on screen the two numbers are separated by a
   * solidus, the way the measurement is written.
   */
  label: string
  /**
   * This part's number. `null` is a first-class state meaning this part is
   * missing, and it is never rendered as `0` — half a compound reading is not
   * a compound reading of zero.
   */
  value: number | null
}

/**
 * A next step attached to a result.
 *
 * `href` navigates and renders an anchor; `onSelect` acts and renders a button.
 * Supply one. A card given both renders the link, because a destination
 * survives a new tab, a copied address and a screen reader's list of links, and
 * a handler survives none of those.
 */
export interface ResultAction {
  /**
   * Imperative, specific, and honest about who is asking. The visible label is
   * the accessible name, so "Book a repeat test" is an action and "learn more"
   * is a link pretending to be one.
   */
  label: string
  /** Where it goes. Preferred over `onSelect` wherever the step has an address. */
  href?: string
  /**
   * What it does, where there is nowhere to go. A function cannot cross the
   * server/client boundary, so a card given one is being rendered by a client
   * component already — see the note on the client boundary at the foot of
   * this file.
   */
  onSelect?: () => void
  /**
   * At most one action per card. The recommended one is rendered in the fuller
   * treatment and is expected to be first; a card whose recommended action is
   * not the first one is reported in development rather than silently
   * re-ordered, because the order on screen is the caller's to decide.
   */
  recommended?: boolean
}

export interface ResultCardProps {
  /**
   * What was measured, in the reader's language rather than an internal code.
   * It is the card's accessible name and the card's heading, and it is the one
   * part with no honest fallback.
   */
  title: string
  /**
   * The heading level for the title, so the card fits the outline of the page
   * it is on rather than imposing one. Appearance does not follow it: the type
   * step is set explicitly, so an `h4` card and an `h2` card look identical.
   *
   * @default 3
   */
  titleLevel?: 2 | 3 | 4 | 5 | 6
  /**
   * The reading. `null` renders the absence form — in words, never as `0` and
   * never as a bare dash — because zero is a real measurement for several
   * metrics and a missing one is not a measurement at all.
   *
   * Omit it only when the reading is compound and arrives through `segments`.
   */
  value?: number | null
  /**
   * A compound reading: two or more numbers that are one measurement, such as
   * the pair in a blood-pressure result. Each segment is a real `Value`, so
   * each is formatted, shaped and spoken like every other number in the system.
   * When this is supplied, `value` is not read.
   */
  segments?: ResultSegment[]
  /**
   * Display symbol exactly as `tokens/units.json` spells it — "kg", "mmol/L",
   * "mmHg". It reaches every number on the card, so one card cannot show two
   * units. `Value` resolves the spoken form from that table, which is why a
   * listener hears "millimoles per mole" rather than the symbol read out letter
   * by letter, and why a unit the table does not hold is rendered as written
   * rather than pronounced by guesswork.
   */
  unit?: string
  /**
   * DECIMAL PLACES, from the precision of the measurement — the resolution of
   * the device, or the number of places the laboratory reported. Not
   * significant figures: the same metric shown to a different number of decimal
   * places at different magnitudes cannot be compared at a glance.
   *
   * It reaches the reading, every segment of a compound one, and both boundary
   * labels on the bar, because a reading and the bound it is compared with are
   * the same metric. Omitted, nothing is rounded and nothing is padded, and the
   * digits the caller was handed are the digits that show.
   */
  precision?: number
  /**
   * BCP 47 locale for separators, digit shaping and the dates. It reaches every
   * number and every instant on the card, so one card cannot show two
   * conventions. Omitted, the reader's own environment decides.
   */
  locale?: string
  /**
   * When the measurement was taken, ISO 8601 with an offset. The time of
   * MEASUREMENT, never of retrieval, of sync or of render: a fetch timestamp
   * here tells a reader their four-month-old reading was taken this morning.
   *
   * REQUIRED, AND WITH NO ABSENCE FORM — which is a known gap rather than a
   * decision. Every other claim on this card degrades to a stated absence, and
   * this one cannot: a card given `value={null}` still renders an instant at
   * which that missing reading was measured. Do not invent one to satisfy the
   * type. `RelativeTime`, which owns every instant in this system, has no
   * absence form either, and inventing a sentence here would be a second copy
   * of a rule that belongs there. Until it has one, a card whose reading is
   * absent should not be given a measurement time the product does not have.
   */
  measuredAt: string
  /**
   * The instant the card is being read against, in the same form as
   * `measuredAt`. Required, because a component that read the clock itself
   * would read it once per card rather than once per screen and make a page of
   * results disagree with itself across a minute boundary. Read it once where
   * the screen is rendered — `new Date().toISOString()` — and pass the same
   * value to every card on it.
   */
  now: string
  /**
   * Hours after which the card shows its staleness treatment. The product owns
   * this number because it is clinical rather than visual, and it differs
   * completely by measurement. There is no default: omit it and there is no
   * staleness treatment at all, which is the honest output when nobody has said
   * what old means here.
   */
  staleAfterHours?: number
  /**
   * The interval this reading is being compared with, and whose it is. Omit it
   * when there is none: the bar is then not drawn at all and nothing is
   * substituted. Never defaulted, in any population, for any metric.
   *
   * It is drawn only where there is also a `unit` and a single `value` — a bar
   * needs a scale, a scale needs a unit to be read in, and a compound reading
   * has no single position on one line.
   */
  range?: ReferenceRange
  /**
   * The level of attention the PRODUCT has assigned to this result. Never
   * derived here from `value` and `range`, and the derivation is not missing —
   * it is refused. Omitted, no pill is rendered and no level is stated, which
   * is what "nobody has made a judgement about this" looks like rather than a
   * quiet reassurance.
   */
  status?: ClinicalStatus
  /**
   * What the reading is ABOUT, for finding the heart results among the sleep
   * results. It tints the title and nothing else: never the card's surface,
   * never the pill, never the bar. Typed to the six rather than to `string`,
   * because a component that accepts an arbitrary category accepts a seventh
   * colour ramp that does not exist.
   */
  category?: HealthCategory
  /**
   * The plain-English paragraph: what the test looks at, what this result means
   * in context, what usually happens next. Absent, the card says in words that
   * there is no explanation rather than rendering nothing — silence reads as
   * reassurance, and it is the default nobody chose.
   */
  meaning?: ReactNode
  /**
   * The next steps, at most two. More than two is a screen rather than a card,
   * and a third is dropped with a warning rather than rendered.
   */
  actions?: ResultAction[]
  /**
   * Who measured it, with what device or assay, and — where it is not already
   * on the bar — where the range came from. Rendered as the footnote. Omitted,
   * there is no footnote: this component ships no default provenance and no
   * default disclaimer.
   *
   * FREE TEXT, WITH NO PROVENANCE CLASS, AND THAT LIMITS WHAT A `status` HERE
   * MAY MEAN. Data provenance and device accuracy sorts every value into four
   * classes — clinically measured, device measured, device estimated,
   * self-reported — and bounds what an interface may assert by the class: a
   * device-estimated or self-reported value may not carry a clinical status on
   * its own. This card cannot tell those apart, because nothing in the system
   * carries the class yet. So the rule is the caller's to keep: do not pass a
   * `status` derived from an estimated or self-reported value.
   */
  provenance?: string
  /**
   * Merged onto the root. Layout belongs here — a card sets no width and no
   * place in a grid, because those are decisions of the screen it is on. A
   * class passed here wins where the two conflict, `truncate` included, which
   * is the one way to make a reading come back to somebody with digits missing.
   */
  className?: string
}

export function ResultCard({
  title,
  titleLevel = 3,
  value,
  segments,
  unit,
  precision,
  locale,
  measuredAt,
  now,
  staleAfterHours,
  range,
  status,
  category,
  meaning,
  actions,
  provenance,
  className,
}: ResultCardProps) {
  const heading = typeof title === "string" ? title.trim() : ""
  if (heading === "") {
    warnDev(
      "no-title",
      "[opsinjs] <ResultCard> was given no title. The title is the card's " +
        "accessible name and its heading, and a result nobody can name is a " +
        "number on a page. There is no fallback for it: a card headed " +
        "'Result' tells a reader nothing they did not already know.",
    )
  }

  /* The category, checked rather than trusted. This file ships as source into
     JavaScript projects where a type is advice, and a seventh category is a
     seventh colour ramp that does not exist — so an unknown one is reported and
     the title is left in the inherited colour rather than tinted from a ramp
     picked at random. */
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

  /* THE COMPOUND READING WINS, AND IT SAYS SO. Two readings for one result is a
     contradiction rather than a preference, and the more specific of the two is
     the one the caller had to build deliberately. Rendering both would put two
     different numbers on one card under one title. */
  /* A LABEL IS THE WHOLE REASON A SEGMENT IS A SEGMENT, so a blank one is
     dropped rather than announced. `{ label: "", value: 128 }` renders an
     sr-only ", " and a listener hears ", 128 millimetres of mercury" — a bare
     number in a health context, which is the ambiguity the label exists to
     prevent. Trimmed like `title`, `provenance` and an action's label, which
     were already checked for content rather than for type. */
  const offered = segments ?? []
  const parts = offered.filter(
    (segment) => typeof segment?.label === "string" && segment.label.trim() !== "",
  )
  if (parts.length < offered.length) {
    warnDev(
      `segment-no-label:${heading}`,
      `[opsinjs] <ResultCard> titled "${heading}" was given a segment with no ` +
        "label. On screen the parts of a compound reading are separated by a " +
        "solidus; read aloud, the label is the only thing that says which part " +
        "is which, and \"128 over 78\" means nothing without one. The unlabelled " +
        "segments were dropped.",
    )
  }
  const compound = parts.length > 0
  if (compound && value !== undefined && value !== null) {
    warnDev(
      `two-readings:${heading}`,
      `[opsinjs] <ResultCard> titled "${heading}" was given both \`value\` and ` +
        "`segments`. They are two answers to one question, and the card cannot " +
        "show a result twice under one title. The segments were rendered and " +
        "the single value was not; pass one or the other.",
    )
  }

  /* A BAR NEEDS A SCALE, AND A SCALE NEEDS A UNIT TO BE READ IN. Three separate
     reasons to draw nothing, and each of them prints rather than being repaired
     with a guess: a compound reading has no single position on one line; a bar
     with no unit would label its bounds with bare numbers, which is the exact
     ambiguity OPSIN-0003 exists for; and RangeBar refuses an unattributed range
     itself, which is where OPSIN-0004 is reported rather than here. */
  const barReadable = range !== undefined && unit !== undefined && !compound
  if (range !== undefined && unit === undefined) {
    warnDev(
      `range-no-unit:${heading}`,
      `[opsinjs] <ResultCard> titled "${heading}" was given a \`range\` and no ` +
        "`unit`. A comparison drawn without one labels its bounds with bare " +
        "numbers, and the same digits are one interval in mmol/L and a very " +
        "different one in mg/dL. No bar was drawn. Pass the unit the reading " +
        "was measured in.",
    )
  }
  if (range !== undefined && compound) {
    warnDev(
      `range-compound:${heading}`,
      `[opsinjs] <ResultCard> titled "${heading}" was given a \`range\` and a ` +
        "compound reading. Two numbers have no single position on one line, so " +
        "no bar was drawn. A compound reading compared against an interval " +
        "needs one bar per part, which is a layout this component does not " +
        "have and a caller can build from RangeBar directly.",
    )
  }

  /* At most two, and the third is dropped rather than drawn. A card is the
     surface where a reader decides what to do next, and a list of choices is
     the shape that stops them deciding. */
  const supplied = actions?.filter((action) => typeof action?.label === "string") ?? []
  if (supplied.length > 2) {
    warnDev(
      `too-many-actions:${heading}`,
      `[opsinjs] <ResultCard> titled "${heading}" was given ${String(supplied.length)} ` +
        "actions. At most two are rendered: more than two is a screen rather " +
        "than a card, and a row of equal-weight choices is how a reader ends up " +
        "taking none of them. The rest were dropped.",
    )
  }
  const steps = supplied.slice(0, 2)
  if (steps.filter((action) => action.recommended === true).length > 1) {
    warnDev(
      `two-recommended:${heading}`,
      `[opsinjs] <ResultCard> titled "${heading}" marks more than one action as ` +
        "recommended. A recommendation that covers everything recommends " +
        "nothing. The first one was rendered in the fuller treatment.",
    )
  }
  if (steps.length > 1 && steps[0]?.recommended !== true && steps.some((a) => a.recommended)) {
    warnDev(
      `recommended-not-first:${heading}`,
      `[opsinjs] <ResultCard> titled "${heading}" puts its recommended action ` +
        "after another one. The order on screen is yours and nothing was " +
        "re-ordered — but a reader takes the first control they reach, and the " +
        "reading order is the one a keyboard and a screen reader follow.",
    )
  }
  const firstRecommended = steps.findIndex((action) => action.recommended === true)

  /* THE LEVEL IS CHECKED, LIKE EVERY OTHER PROP THIS FILE TRUSTS NOBODY ABOUT.
     A type is advice in the JavaScript project this file ships into, and
     `titleLevel={7}` builds `<h7>` — an unknown element with no heading role at
     all, so the card's own name silently stops being a heading and leaves the
     outline. `titleLevel={1}` puts a second `h1` on the page. Both fall back to
     the documented default rather than being rendered. */
  const LEVELS = [2, 3, 4, 5, 6]
  let level = titleLevel
  if (!LEVELS.includes(level)) {
    warnDev(
      `title-level:${String(titleLevel)}`,
      `[opsinjs] <ResultCard> was given titleLevel ${String(titleLevel)}. The ` +
        "title is a real heading and the level has to be one a document outline " +
        "has: 2 to 6. An h1 makes a card compete with the page's own name and " +
        "anything outside the range is not a heading element at all. It was " +
        "rendered at the default, 3.",
    )
    level = 3
  }
  const Heading = `h${String(level)}` as "h2" | "h3" | "h4" | "h5" | "h6"

  /* THE UNIT IS PRINTED AFTER THE LAST PART — but only when the last part is a
     number. A `null` one renders `Value`'s absence form, which carries no unit
     element at all, so suppressing the symbol on the parts before it would
     leave a real number on screen with nothing anywhere saying what it is
     measured in. That is OPSIN-0003's exact ambiguity, arrived at by layout
     rather than by a missing prop. */
  const lastPart = parts.length === 0 ? undefined : parts[parts.length - 1]
  const unitPrintedAfterLast = unit !== undefined && typeof lastPart?.value === "number"

  /* TRIMMED, LIKE `title` AND `provenance`. A `meaning` of " " renders a blank
     paragraph, and a blank paragraph is the silence this part exists to refuse:
     the one guarantee this component argues hardest for should not be defeated
     by a space. Only a string is trimmed — a node is taken as supplied, because
     a component this file cannot see inside may render anything. */
  const explained =
    typeof meaning === "string"
      ? meaning.trim() !== ""
      : meaning !== undefined && meaning !== null

  return (
    /* AN ARTICLE, AND NAMED. `<article>` is the element for a self-contained
       composition and is exposed to a screen reader's rotor whether or not it
       has a name; `<section>` is exposed only when it has one, which is the
       trap a card built from a `<div role="region">` falls into.

       THE NAME IS THE TITLE AND NOT THE TITLE PLUS THE READING, and the gap is
       stated rather than hidden. The specification asks for a name shaped as
       the measurement's title followed by its reading and its unit. Assembling
       that means either formatting the number here — which is the one thing
       this file will not do — or pointing `aria-labelledby` at the title and
       the reading, which needs ids this component cannot mint: `useId` is a
       hook and would put every card in the system into the client bundle to buy
       one string. The reading is the next thing announced after the name, and
       the page says so. */
    <article
      data-slot="result-card"
      aria-label={heading || undefined}
      className={cn(
        /* The surface is neutral at every level, deliberately and without an
           escape hatch: there is no prop on this component that tints it, and
           the status axis reaches the pill and stops. `bg-card` with a real
           border rather than a Surface, because the border is the boundary a
           printer keeps — a rung paints its edge with an inset shadow, which
           a browser drops when it prints unless the reader has gone looking for
           the setting that keeps it, and a card is how a reading most often
           reaches an appointment. */
        "flex w-full flex-col gap-opsin-4 rounded-opsin-md border border-border",
        "bg-card p-5 text-card-foreground [corner-shape:var(--opsin-corner-shape)]",
        className,
      )}
    >
      <div
        data-slot="result-card-header"
        /* `items-start` and `flex-wrap` rather than a row with a fixed height:
           at 200% text the title wraps to three lines and the pill drops
           beneath it, which is the reflow the specification asks for and is
           what a fixed height would clip. */
        className="flex flex-wrap items-start justify-between gap-opsin-3"
      >
        <div className="flex min-w-0 flex-col gap-opsin-0-5">
          {/* NO TITLE MEANS NO HEADING ELEMENT, not an empty one. An `<h3>` with
              nothing in it is a WCAG 1.3.1 / 2.4.6 failure and a standard axe
              `empty-heading`: it appears in the rotor and the outline as
              "heading level 3" with no content, so a reader navigating by
              heading lands on a card that names nothing and has no way back to
              what it was. The warning above has already said the card has no
              name; rendering an absence is what this file does everywhere else,
              and it is strictly better than rendering a broken thing. */}
          {heading === "" ? null : (
            <Heading
              data-slot="result-card-title"
              /* The category axis, and the only element on this card it reaches.
                 `data-category` and the ink class are two spellings of one
                 decision, and both are here because the attribute is the DOM
                 contract a product's own stylesheet and its tests key on, while
                 the class is what actually paints. */
              data-category={tint}
              /* The level is the page's and the size is this component's. Left
                 to the browser the same title would be one size in an h2 and
                 another in an h4, and the heading level would be carrying visual
                 weight it is not entitled to.

                 WHICH IS WHY THIS IS JOINED AND NOT `cn`. `cn` is
                 `twMerge(clsx(…))` and tailwind-merge is unconfigured: it has
                 never been told that `--text-opsin-*` is a font-size namespace,
                 so it filed `text-opsin-title3` and `text-category-<name>-ink`
                 in one conflict group and kept the later. A tinted title
                 therefore lost the exact type step the paragraph above insists
                 on, and only when a category was supplied — right in review,
                 wrong in the case the component exists for. The two utilities
                 set different CSS properties, so passing both through applies
                 both. `score-dial.tsx` keeps its own type-plus-colour strings
                 whole for the same reason; the repair belongs in `lib/utils.ts`
                 and is reported upward.

                 `wrap-break-word` IS THE REFLOW REPAIR, and it is the same one
                 `callout.tsx` and `alert-banner.tsx` carry. `flex-wrap` on the
                 header gets the pill out of the title's way and `min-w-0` on the
                 column above lets that column shrink, but neither does anything
                 about a single word wider than the column it lands in: at 320px
                 with text at 200% the pill leaves this column about 121px,
                 "measurement" alone paints about 247px, and a word cannot wrap
                 at a space that is not there. The line box overflowed while
                 every BOX stayed inside the viewport — which is why only a
                 measurement of the text itself found it — and the document
                 scrolled sideways at 346px against a 320px client width. That is
                 WCAG 1.4.10 Reflow, and a result card is where it bites: a long
                 single-word measurement name is the ordinary case here, not the
                 pathological one. `overflow-wrap: break-word` breaks such a word
                 only when it does not otherwise fit, so a title with spaces in it
                 still wraps at them and nothing changes below 200%. Not
                 `wrap-anywhere`, which would break mid-word while a usable space
                 was still available; not `hyphens`, which invents a hyphen inside
                 a name somebody has to read back to a clinician. */
              className={
                "m-0 wrap-break-word text-opsin-title3" +
                (tint === undefined ? "" : ` ${CATEGORY_INK[tint]}`)
              }
            >
              {heading}
            </Heading>
          )}

          {/* The part is the wrapper rather than the timestamp itself:
              `RelativeTime` stamps `data-slot="relative-time"` on its own root
              and one element cannot carry two slots. `showAbsolute` is on and
              is not a prop, because a result is durable and consequential — it
              is read weeks later, printed, and taken to an appointment, and
              "3 days ago" on paper has no date on it at all.

              `staleAfterHours` is passed straight through and is never
              defaulted here. This component does not know what was measured, so
              it cannot know when the reading stops being current; with no
              boundary there is no staleness treatment, which is the honest
              output rather than a silent guess.

              THE WRAPPER SETS A SIZE AND NOT A COLOUR, and that is load-bearing
              rather than a preference. `RelativeTime`'s staleness treatment is
              `text-muted-foreground` on its own parts; muting the whole
              timestamp here would pre-apply it to everything and a four-month
              old reading would render in exactly the tone of one taken this
              morning, leaving the words as the only difference. The card's own
              foreground is what makes the muting a change somebody can see. */}
          <span data-slot="result-card-time" className="text-opsin-footnote">
            <RelativeTime
              at={measuredAt}
              event="measured"
              now={now}
              staleAfterHours={staleAfterHours}
              showAbsolute
              locale={locale}
            />
          </span>
        </div>

        {/* The only status-coloured element on the card, and it is rendered
            only when the product assigned a level. There is no fallback pill:
            `StatusPillProps.status` is required with no neutral default, and a
            card that drew one anyway would be inventing a verdict — `unknown`
            most of all, because a reader who meets it reads it as "probably
            fine". `describes` is what stops a listener hearing a level floating
            free of the thing it applies to. */}
        {status === undefined ? null : (
          <StatusPill status={status} describes={heading || undefined} />
        )}
      </div>

      <div
        data-slot="result-card-reading"
        /* `items-baseline` so a compound reading sits on one line, `flex-wrap`
           so it stops being one line rather than being clipped when the text
           size goes up. */
        className="flex flex-wrap items-baseline gap-opsin-1"
      >
        {compound ? (
          parts.map((segment, index) => {
            const last = index === parts.length - 1
            return (
              <Fragment key={`${String(index)}:${segment.label}`}>
                {index === 0 ? null : (
                  /* A sibling of the numbers rather than a child of one, so the
                     row's own gap falls on both sides of it and the pair is not
                     spaced asymmetrically. Same type step and same family as the
                     digits, because the solidus is part of how the measurement
                     is written rather than punctuation between two of them. */
                  <span aria-hidden="true" className="font-opsin-numeric text-opsin-title1">
                    /
                  </span>
                )}
                {/* The part's name, announced and not drawn. On screen the
                    solidus is what says these two numbers are one measurement;
                    read aloud, a solidus is either skipped by speech synthesis
                    or said as "slash", so the words carry it instead. */}
                <span className="sr-only">{segment.label}, </span>
                <Value
                  value={segment.value}
                  unit={unit}
                  precision={precision}
                  locale={locale}
                  size="display"
                  /* THE UNIT IS PRINTED ONCE AND SPOKEN EVERY TIME. Every
                     segment is given the unit, so no `Value` here is a number
                     with nothing saying what it is measured in and each one
                     carries its own spoken form — a listener hears the unit
                     after each part, which is the unambiguous reading. What is
                     suppressed is only the visible symbol on every part but the
                     last, so the pair renders the way it is written: 12/8 mmHg
                     rather than 12 mmHg / 8 mmHg. The selector is the published
                     `data-slot` on the part, which is exactly what that contract
                     is for.

                     `sr-only` AND NOT `hidden`, WHICH IS THE WHOLE PROMISE.
                     `display: none` takes an element out of the accessibility
                     tree as well as off the screen. `Value` marks the visible
                     symbol `aria-hidden` only when it resolved a spoken form
                     from `tokens/units.json`, and leaves it announced when it
                     did not — "awkward to listen to, and true", in that file's
                     own words. Hiding it outright deletes that: for a unit the
                     table does not hold there is no sr-only spoken sibling to
                     survive, and every part but the last becomes a bare number.
                     Visually hidden leaves the symbol where a listener can
                     still reach it and renders identically. */
                  className={
                    last || !unitPrintedAfterLast
                      ? undefined
                      : "[&_[data-slot=value-unit]]:sr-only"
                  }
                />
              </Fragment>
            )
          })
        ) : (
          <Value
            value={value ?? null}
            unit={unit}
            precision={precision}
            locale={locale}
            size="display"
          />
        )}
      </div>

      {/* The bar is a direct child of the card, not a wrapper part, because the
          part tree names `RangeBar` itself at this position. It is given no
          `status` and no `category` on purpose: a bar handed a status draws its
          own word and glyph beside its label, and two objects for one assertion
          is the composition error the specification names. The label is
          announced and not drawn — the card's own heading is two elements above
          it, and a bar that repeated it would put the same words on screen
          twice. `measuredAt` is passed so the bar's footnote states the date
          rather than saying nobody knows when the reading was taken, which
          would be untrue on a card whose header says exactly that. */}
      {barReadable ? (
        <RangeBar
          label={heading}
          value={value ?? null}
          unit={unit}
          precision={precision}
          locale={locale}
          range={range}
          measuredAt={measuredAt}
          className="[&_[data-slot=range-bar-label]]:sr-only"
        />
      ) : null}

      <div data-slot="result-card-meaning" className="max-w-(--opsin-measure-comfortable,66ch)">
        {explained ? (
          meaning
        ) : (
          /* THE ABSENCE IS SAID OUT LOUD. A card with no explanation and no
             statement that there is none reads as a result nobody thought worth
             explaining, which a reader hears as reassurance. This sentence is
             the smallest honest thing that can go here: it says what is missing
             and it does not say what the result means. Where the product has
             somewhere that does explain the test, that is an action rather than
             a sentence this component could write. */
          <p className="m-0 text-opsin-body text-muted-foreground">
            We do not have an explanation for this result yet.
          </p>
        )}
      </div>

      {steps.length === 0 ? null : (
        <div
          data-slot="result-card-actions"
          /* The separation is a fixed token rather than a density-scaled step:
             the gap between two touch targets is a measurement that carries
             meaning, and it must not shrink because somebody asked for a denser
             list. */
          className="flex flex-wrap gap-(--opsin-target-separation,0.5rem)"
        >
          {steps.map((action, index) => (
            <ResultCardAction
              key={`${String(index)}:${action.label}`}
              action={action}
              emphasis={index === firstRecommended ? "recommended" : "alternative"}
              owner={heading}
            />
          ))}
        </div>
      )}

      {typeof provenance === "string" && provenance.trim() !== "" ? (
        /* Provenance, and nothing else. There is no default disclaimer here and
           there will not be one: a not-medical-advice note is jurisdictional,
           it is the product's to write, and a sentence supplied by a design
           system is a sentence nobody reviewed. DisclaimerNote is the component
           for it, placed once by the product where the product decides. */
        <p
          data-slot="result-card-footnote"
          className="m-0 text-opsin-footnote text-muted-foreground"
        >
          {provenance}
        </p>
      ) : null}
    </article>
  )
}

/**
 * One next step, as a link or as a control — or as nothing at all.
 *
 * Returning nothing rather than rendering something is the point. A control
 * with no name is unreachable by voice and announced as "button"; a control
 * with neither a destination nor a handler acknowledges a press and then does
 * nothing, which reads as a card that is out of order.
 *
 * Not exported. A registry file's public surface is the props interface, the
 * component and the zero-prop demo, and a part a caller cannot place is not a
 * part a caller needs to name.
 */
function ResultCardAction({
  action,
  emphasis,
  owner,
}: {
  action: ResultAction
  emphasis: "recommended" | "alternative"
  owner: string
}): ReactNode {
  const label = action.label?.trim() ? action.label.trim() : ""
  const navigates = typeof action.href === "string" && action.href.trim() !== ""
  const acts = typeof action.onSelect === "function"

  if (label === "") {
    warnDev(
      `action-no-label:${emphasis}:${owner}`,
      `[opsinjs] <ResultCard> titled "${owner}" was given an action with no ` +
        "label. The visible label is the accessible name, and a next step " +
        "nobody can read is not a next step. Nothing was rendered for it.",
    )
    return null
  }
  if (!navigates && !acts) {
    warnDev(
      `action-inert:${label}`,
      `[opsinjs] <ResultCard> was given the action "${label}" with neither ` +
        "`href` nor `onSelect`, so there is nothing for it to do. Nothing was " +
        "rendered for it.",
    )
    return null
  }
  if (navigates && acts) {
    warnDev(
      `action-both:${label}`,
      `[opsinjs] <ResultCard> was given the action "${label}" with both ` +
        "`href` and `onSelect`. It rendered as a link, because a destination " +
        "survives a new tab, a copied address and a screen reader's list of " +
        "links and a handler survives none of them. Move the work to the page " +
        "the link goes to, or drop the `href`.",
    )
  }

  if (navigates) {
    return (
      /* STAMPED, BECAUSE THE OTHER FORM IS. `Button` puts `data-slot="button"`
         on the handler form, and an anchor carrying nothing left the two forms
         of one prop selectable by different means — so a print stylesheet or a
         test written against the published attribute table could not reach half
         of them. */
      <a
        data-slot="result-card-action"
        href={action.href}
        className={emphasis === "recommended" ? ACTION_LINK : ALTERNATIVE_LINK}
      >
        {label}
      </a>
    )
  }

  return (
    <Button
      variant={emphasis === "recommended" ? "primary" : "quiet"}
      className={emphasis === "recommended" ? undefined : ALTERNATIVE_BUTTON}
      onClick={action.onSelect}
    >
      {label}
    </Button>
  )
}

/**
 * The instant the demo is read against.
 *
 * A literal rather than a clock read. `now` is required of every caller, so a
 * demo that quietly read the clock would be documenting a different component;
 * and a fixed instant is what makes this deterministic, in the same spirit as
 * every number in an opsinjs example being obviously synthetic — a clock here
 * would make the card say something different every time the page was built.
 */
const DEMO_NOW = "2026-03-14T11:12:00+00:00"

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the card whole — the part
 * a reader needs to see about this component is that the number, the
 * comparison, the sentence and the next step are one object, in that order.
 *
 * THE NUMBERS ARE UNREAL AND THE RANGE IS UNOWNED. The reading, the interval
 * and the unit are chosen so that nobody could take them for their own result,
 * and the interval cites `EXAMPLE_SOURCE` — the one string an opsinjs example
 * may name as its source — rather than a laboratory, a guideline body or a
 * study. This file is one `shadcn add` away from somebody else's project and
 * one screenshot away from outliving the page it was written for.
 *
 * IT CARRIES NO STALENESS BOUNDARY, so it demonstrates no staleness treatment.
 * A number here would be a clinical boundary shipped verbatim into every
 * repository that runs `shadcn add`, and no disclaimer in a comment undoes it:
 * the number is the part that gets copied. The cost is real and is stated
 * rather than hidden: no preview opsinjs ships shows that state, and none can.
 *
 * THE LEVEL AND THE BAR AGREE, which they have to. `status` is the product's
 * input and this component derives nothing from the reading — but a demo whose
 * pill says one thing while the bar beneath it says another teaches that a card
 * may contradict itself. The bar reads this fictional value as inside the
 * fictional interval, so the level beside it is the one whose shipped meaning
 * is "this reading is where it is expected to be". A product supplies its own,
 * from a range it owns.
 */
export default function ResultCardDemo() {
  return (
    <div className="w-full max-w-lg">
      <ResultCard
        title="Example measurement"
        value={14}
        unit="mg/dL"
        precision={0}
        measuredAt="2026-03-14T08:12:00+00:00"
        now={DEMO_NOW}
        range={{ low: 10, high: 20, source: EXAMPLE_SOURCE }}
        status="steady"
        category="labs"
        meaning="This example stands in for the plain-English paragraph a product writes: what the measurement looks at, what this reading means in context, and what usually happens next. It is two or three short sentences, in the second person, and it is the part most result screens leave out."
        actions={[
          { label: "Book a repeat example test", href: "#example", recommended: true },
          { label: "Read about this example test", href: "#example" },
        ]}
        provenance="Example provenance — who measured it, with what, and whose interval it is compared against."
      />
    </div>
  )
}
