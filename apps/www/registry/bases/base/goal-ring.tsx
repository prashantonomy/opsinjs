/**
 * GoalRing shows how far a reading has come towards a goal the product set,
 * drawn as a ring, with the same fact stated in words beside it.
 *
 * THE RING REWARDS NOTHING, AND THAT IS THE WHOLE DESIGN. The roster declined
 * goal rings for years because the pattern they come from turns progress into a
 * game: a ring that closes, a streak that must not break, a celebration when it
 * does and a quiet reproach when it does not. That is a fine incentive for
 * somebody training and a bad one for somebody managing a condition, for whom a
 * missed day is information rather than a failure. So this ring closes and stops.
 * Nothing counts up on first paint, nothing sweeps, no streak is tracked, no
 * confetti fires and no shame is implied. It draws where a number the product
 * supplied sits against a goal the product supplied, and the words beside it
 * carry every fact. Cover the ring with your hand and nothing is lost.
 *
 * OPSINJS OWNS NEITHER THE GOAL NOR THE WORDS. `goal` is the product's target,
 * `label` is the product's name for what the ring counts, and `unit` is the
 * product's unit. This component ships no default goal, no default label and no
 * clinical vocabulary of any kind. It asserts one thing only, that a value is
 * this far towards a goal somebody else chose, and it is careful never to be read
 * as a verdict or as a target opsinjs set.
 *
 * IT IS A PRESENTATION LAYER. It renders what the product hands it and works out
 * nothing a product should own. The one number it derives is the fraction of the
 * goal reached, which is arithmetic over two numbers the product supplied, and it
 * is shown as a plain progress sentence rather than a score. It reads no
 * reference range, assigns no clinical status, and takes no `status` prop at all,
 * because progress towards a goal is not a clinical verdict and must never be
 * coloured as one.
 *
 * WHY `role="img"` AND NOT `meter` OR `progressbar`. `meter` announces a value
 * within a measured range, which is a reading, and this is not one: it is a
 * position against a goal a product set. `progressbar` implies a task advancing
 * to completion under the interface's control, and a person's steps are not a
 * task the app is running. Both roles also carry no words. So the ring is a
 * labelled image, never focusable and never in the tab order, and every fact it
 * carries is repeated in a visible text twin that no prop of this component turns
 * off.
 *
 * THE THREE STATES ARE KEPT THREE. A finite value is progress and draws a fill.
 * `null` is no reading yet, and it draws an empty ring with words that say so; it
 * is never rendered as a value of zero, because an empty ring that meant zero and
 * an empty ring that meant "nothing measured" would be the same picture telling
 * two different truths. A value that is not a finite number is a third state
 * again, a reading that arrived broken, and it is announced as one rather than
 * drawn.
 *
 * COLOUR IS THE CATEGORY AXIS ONLY. The fill may take the identity tint of the
 * kind of thing it counts, an activity ring in the activity colour, so a reader
 * who keeps several rings can tell them apart. It never takes the status axis:
 * this ring makes no clinical claim, so it carries `data-category` and never
 * `data-status`, and the two are never on one element. Given no category it draws
 * a neutral ring, which is the honest default rather than a borrowed colour.
 */

import {
  HEALTH_CATEGORIES,
  isDevelopment,
  isHealthCategory,
  warnOnce,
  type HealthCategory,
} from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * The fill's identity tint, one class list per category, written out because
 * Tailwind reads class names out of source as literal strings and a computed
 * `text-category-${x}-accent` generates no CSS at all.
 *
 * `-accent` is the identity fill: chosen for recognition rather than for
 * contrast, and it is exactly what a ring's colour is here. It never carries
 * text and it is never the only thing that tells the fill from the track, because
 * the words beside the ring say the progress in full and the fill's own arc
 * length shows it. The track stays neutral in every case, so one colour on the
 * surface answers one question, which kind of thing this ring counts, and never
 * doubles as a verdict.
 */
const CATEGORY_TONE: Record<HealthCategory, string> = {
  sleep: "text-category-sleep-accent",
  heart: "text-category-heart-accent",
  activity: "text-category-activity-accent",
  nutrition: "text-category-nutrition-accent",
  mind: "text-category-mind-accent",
  labs: "text-category-labs-accent",
}

/**
 * Which of this file's own complaints the session has already printed.
 *
 * The same shape `divider.tsx` uses, and for the same reason: in a production
 * bundle `isDevelopment()` is statically false, the body that touches this is
 * dead code, and the set is never allocated. In development it lives for the
 * session, so a grid of rings with the same misconfiguration prints one warning
 * rather than one per ring. It is not `warnOnce` because none of these complaints
 * has an `OPSIN-00xx` code; allocating one is not this file's to do, so the
 * omission is reported upward and the channel is the same.
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

/* The ring, in the SVG's own user units. None of these numbers is a clinical
   decision: they are the shape of a picture, and they are constants only so that
   the track, the fill and the viewBox cannot drift apart. The circle is drawn
   with `pathLength={100}` so a dash length is a percentage of the whole ring and
   the fraction arithmetic below is unchanged by the radius. */
const CENTRE = 50
const RADIUS = 42
const TRACK_WIDTH = 10
const VIEW = 100

/** `Intl.NumberFormat`'s ceiling, and the way to say "show the digits you were handed". */
const MAX_FRACTION_DIGITS = 20

/**
 * Keeps a DRAWING inside the ring. Never applied to a reading.
 *
 * A value past the goal fills the whole ring, because a full ring is all the ring
 * there is, and a value below zero draws nothing. That is a fact about the
 * picture. The words beside it always print the real numbers the product handed
 * over, so a value past the goal reads its true figure there even though the arc
 * has stopped growing.
 */
function clampFraction(fraction: number): number {
  if (!Number.isFinite(fraction)) return 0
  return Math.min(Math.max(fraction, 0), 1)
}

/**
 * Every number this component prints: the value, the goal, the percentage.
 *
 * They go through the reader's locale, so a `de-DE` ring does not print the value
 * with a comma two lines above a goal spelled with a point, and `String()` does
 * not turn a large figure into exponent notation.
 */
function plain(figure: number, locale: string | undefined): string {
  if (!Number.isFinite(figure)) return String(figure)
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: MAX_FRACTION_DIGITS,
  }).format(figure)
}

/* ------------------------------------------------------------------ *
 * The API                                                             *
 * ------------------------------------------------------------------ */

export interface GoalRingProps {
  /**
   * What the ring counts, in the reader's language: "Steps today", "Water", the
   * product's own name for the thing, not an internal code. Required, because a
   * ring with no label is a coloured arc a reader cannot name.
   */
  label: string
  /**
   * The reading. `null` renders the no-reading state, an empty ring with words
   * that say nothing has been measured yet. That is not a value of zero: zero is a
   * real reading on a goal a person has not started against, and an absent reading
   * is not a reading at all. A value that is not a finite number is a third state
   * again, a reading that arrived broken, and it is announced rather than drawn.
   */
  value: number | null
  /**
   * The target the product set, on the value's own scale. opsinjs ships no
   * default goal and never invents one: a goal is a target somebody chose for
   * somebody, and this component does not know the reader. A goal of zero or less,
   * or one that is not a finite number, is not a goal a fraction can be taken
   * against, so the ring is drawn empty and the words say the progress cannot be
   * shown.
   */
  goal: number
  /**
   * The unit the value and the goal are counted in, in the reader's language,
   * such as "steps" or "ml". Optional: a goal that is a plain count needs none.
   * It is printed after the numbers in the readout and never abbreviated by this
   * component, because opsinjs does not own the reader's units.
   */
  unit?: string
  /**
   * Tints the ring's fill with the identity colour of the kind of thing it
   * counts, so a reader with several rings can tell them apart. It is the category
   * axis and only the category axis: it says what the ring is about, never how
   * urgent it is. Given none, the ring is drawn in a neutral tone. A value outside
   * the known categories has no ramp, so it is refused with a development warning
   * and the ring falls back to neutral rather than losing its fill silently.
   */
  category?: HealthCategory
  /**
   * BCP 47 locale for every number. Omitted, the reader's own environment
   * decides.
   */
  locale?: string
  /**
   * Merged onto the root, and a class passed here wins over the component's own
   * where the two conflict.
   *
   * That includes `truncate`, `sr-only`, a zeroed type size and any fixed height.
   * The label, the readout and the progress sentence are mandatory content that no
   * prop of this component removes, and a class that clips or hides them is the
   * one way left to remove them anyway. The ring's own accessible name would
   * survive; the words a sighted reader needs would not.
   */
  className?: string
}

/* ------------------------------------------------------------------ *
 * The component                                                       *
 * ------------------------------------------------------------------ */

export function GoalRing({
  label,
  value,
  goal,
  unit,
  category,
  locale,
  className,
}: GoalRingProps) {
  /* THREE STATES, NOT TWO. A number that arrived broken is a reading that ran and
     failed; an absent one is a reading that never ran. Keeping them apart in the
     words is the whole of the null handling here, because a reader told "no
     reading yet" about a number that did exist and arrived broken has been told
     something untrue about their own record. */
  const broken = value !== null && !Number.isFinite(value)
  const reading = value !== null && !broken ? value : null

  /* THE GOAL HAS TO BE A GOAL. A target of zero or less has no fraction to take
     against it, and dividing by it would draw a full or empty ring that asserts a
     definite progress nobody can read. Reported, and the ring is drawn empty so
     that the words stay true. */
  const goalUsable = Number.isFinite(goal) && goal > 0
  if (!goalUsable) {
    reportOnce(
      "goal",
      `[opsinjs] <GoalRing> was given goal=${plain(goal, locale)}, which is not a ` +
        "target a fraction can be taken against: a goal must be a finite number " +
        "above zero. The ring was drawn empty and the words say the progress " +
        "cannot be shown. Pass the target your product set, in the same unit as " +
        "the value.",
    )
  }

  /* OPSIN-0010. A category outside the six has no ramp, so the fill would take no
     tint at all and the identity axis would silently be gone. */
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

  const placeable = reading !== null && goalUsable
  const fraction = placeable && reading !== null ? clampFraction(reading / goal) : 0
  /* Only a fill with length draws, so a genuine reading of zero and an absent
     reading both show an empty ring, and the words below are what tell the two
     apart. A round cap on a zero-length dash paints a stray dot, so nothing is
     drawn at all when there is no progress. */
  const drawsFill = placeable && fraction > 0
  const reached = placeable && reading !== null && reading >= goal
  const percent = placeable && reading !== null ? Math.round((reading / goal) * 100) : 0

  /* The readout, always the real numbers the product handed over, so the arc
     stopping at full never hides a value that went past the goal. */
  const unitWords = typeof unit === "string" && unit.trim() !== "" ? ` ${unit.trim()}` : ""
  const valueWords = broken
    ? "not available"
    : reading === null
      ? "no reading yet"
      : `${plain(reading, locale)} of ${plain(goal, locale)}${unitWords}`

  /* The progress sentence, derived from the two numbers and nothing else. It
     names the fraction of the goal reached in plain words. It never celebrates a
     closed ring and never reproaches an open one: reaching the goal is stated as
     a fact, and no reading yet is stated as a fact, because a ring for somebody
     managing a condition owes them information rather than a verdict on their
     day. */
  const derivationWords = broken
    ? "This reading could not be worked out, so there is no progress to show."
    : reading === null
      ? "No reading yet, so there is no progress to show."
      : !goalUsable
        ? "The goal is not a number progress can be measured against, so the ring is empty."
        : reached
          ? "This meets the goal the app set."
          : `That is ${plain(percent, locale)} out of every 100 towards the goal the app set.`

  /**
   * The accessible name for the ring: the whole component in one utterance.
   *
   * It repeats the visible twin on purpose. The ring is a labelled image rather
   * than a tree of unlabelled shapes, and a linear reader hears the label, the
   * readout and the progress sentence in one breath here as well as reading them
   * beside the ring.
   */
  const spoken = `${label}: ${valueWords}. ${derivationWords}`

  return (
    <div
      data-slot="goal-ring"
      className={cn(
        /* Stacked, always. The ring sits above the words, the column is capped at
           the tight measure token so the progress sentence never runs wider than
           a short line should, and the 40ch fallback keeps the cap for a
           consumer who installed the component without the token layer. The
           rhythm is two space steps: `gap-opsin-4` between the ring and the block
           of words, `gap-opsin-1` between the lines of that block. */
        "flex w-full max-w-(--opsin-measure-tight,40ch) flex-col items-center gap-opsin-4",
        className,
      )}
    >
      <svg
        /* A labelled image, and nothing more. Not a meter, not a progressbar,
           not a slider, and never in the tab order: this is a picture of a
           reading against a goal somebody else set, with no value semantics of
           its own to offer. */
        role="img"
        aria-label={spoken}
        focusable="false"
        viewBox={`0 0 ${String(VIEW)} ${String(VIEW)}`}
        /* Capped by the --opsin-graphic-dial token, spelled in rem so the ring
           grows with the reader's root font size instead of staying put while the
           words grow. The cap yields to w-full when the column is narrower, so a
           cramped layout shrinks the ring rather than clipping it. */
        className="h-auto w-full max-w-(--opsin-graphic-dial,12rem)"
      >
        {/* The track: the whole ring, always fully drawn, so the goal's extent is
            visible whether or not there is a reading to place on it. It is the
            neutral border role, never a category or a status colour, so the one
            tinted thing on the surface is the fill. Forced colours leaves an SVG
            stroke where the author set it, so the track carries a rule that maps
            it to CanvasText and stays visible on a theme somebody turned on
            precisely because pale lines are invisible to them. */}
        <circle
          data-slot="goal-ring-track"
          cx={CENTRE}
          cy={CENTRE}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={TRACK_WIDTH}
          className="text-border forced-colors:stroke-[CanvasText]"
        />

        {/* The fill: the arc from the top, clockwise, its length the fraction of
            the goal reached. It carries the category tint and `data-category`,
            never `data-status`, because progress is not a verdict. It is drawn
            only when there is progress with length, so an absent or zero reading
            shows the bare track. Nothing animates it: `motion-in-health-ui` names
            the ring sweep specifically, and a sweep shows, for every frame of its
            travel, a progress that is not true. Under forced colours the tint is
            stripped, so the fill maps to Highlight to stay distinct from the
            track, and the words carry the progress regardless. */}
        {drawsFill ? (
          <circle
            data-slot="goal-ring-fill"
            data-category={tint}
            cx={CENTRE}
            cy={CENTRE}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={TRACK_WIDTH}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${String(Math.round(fraction * 100))} 100`}
            /* Rotated a quarter turn anticlockwise so the arc opens at the top
               rather than at three o'clock, which is where a person reads a ring
               as starting. */
            transform={`rotate(-90 ${String(CENTRE)} ${String(CENTRE)})`}
            className={cn(
              tint ? CATEGORY_TONE[tint] : "text-foreground",
              "forced-colors:stroke-[Highlight]",
            )}
          />
        ) : null}
      </svg>

      {/* The text twin, never omitted and never hidden, so a reader who cannot
          read the arc gets every fact in words. It is not an option and no prop of
          this component turns it off. */}
      <div
        data-slot="goal-ring-words"
        className="flex flex-col items-center gap-opsin-1 text-center"
      >
        <p
          data-slot="goal-ring-label"
          className={cn("m-0 text-opsin-subheadline", "[color:var(--muted-foreground)]")}
        >
          {label}
        </p>
        <p
          data-slot="goal-ring-value"
          className={cn("m-0 text-opsin-title2 font-medium tabular-nums", "[color:var(--foreground)]")}
        >
          {valueWords}
        </p>
        <p
          data-slot="goal-ring-derivation"
          className={cn("m-0 text-opsin-footnote", "[color:var(--muted-foreground)]")}
        >
          {derivationWords}
        </p>
      </div>
    </div>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it into somebody
 * else's project, so it is public, reviewed code rather than a scratch demo. It
 * shows a reading part-way towards a goal, in the activity category so the fill
 * carries an identity tint. Every number is invented and non-clinical: a step
 * count towards a daily step goal, which is exactly the shape ADR 0012 asks for,
 * a figure nobody could mistake for their own reading, and no reference range,
 * threshold or clinical vocabulary appears anywhere.
 */
export default function GoalRingDemo() {
  return (
    <GoalRing
      label="Steps today"
      value={6200}
      goal={8000}
      unit="steps"
      category="activity"
    />
  )
}
