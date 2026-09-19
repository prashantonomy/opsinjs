"use client"

/**
 * ScaleInput is a row of numbered points for a self-report the product reads:
 * a rating between two ends, where the reader taps one point to say where they
 * sit. Its home is a single question a product asks over and over so a reader
 * can watch it move, a comfort rating or a mood rating being the shape it was
 * built for, where the same scale on Monday and on Friday is the whole value.
 *
 * IT SHIPS NO SCALE OF ITS OWN, AND THAT IS THE REASON THE ROSTER DECLINED IT
 * FOR SO LONG. A rating scale is only comparable over time when its number of
 * points and its end words stay fixed, and those belong to whichever validated
 * instrument the consuming product has chosen rather than to a component
 * library. So this component ships no anchor words, no default number of points,
 * no scale, no scoring and no reading of what a point means. The reader is
 * rating something the product names through `label`; the scale runs across as
 * many points as the product passes through `points`; and the two end words, if
 * there are any, arrive through `minLabel` and `maxLabel`. opsinjs supplies the
 * chrome and the keyboard behaviour and nothing a clinician would recognise.
 *
 * IT RECORDS A SELF-REPORT AND DERIVES NOTHING FROM IT. The value is the point
 * the reader chose, handed straight back to the product through `onValueChange`.
 * This component adds no total, no band, no verdict and no interpretation on top
 * of it. A rating is what the reader says about themselves, so the product owns
 * what the number means and what, if anything, happens next.
 *
 * IT IS BUILT ON BASE UI'S RadioGroup, AND IT IS ONE TAB STOP. A rating is a
 * single choice from N points, so the tested pattern is a radio group: the group
 * takes one tab stop, each point is a `role="radio"` with `aria-checked`, and the
 * Arrow keys move a roving focus along the row while selection follows focus.
 * That is the WAI-ARIA radio group pattern rather than a bespoke one nobody has
 * listened to, and it is the same primitive `radio-group.tsx` and
 * `segmented-control.tsx` are built on. A row of ten separate buttons would be
 * ten tab stops, which is exactly the contract this control exists to refuse.
 *
 * NEITHER COLOUR AXIS, AND THE SELECTED POINT IS PRIMARY EMPHASIS RATHER THAN A
 * STATUS. The chosen point is filled with the neutral primary role, the same
 * fill `checkbox.tsx` uses for a ticked box, and it is deliberately not painted
 * from the clinical status axis. A rating is a self-report, not a verdict, so a
 * point at the far end must not be dressed as urgent by the component: whether a
 * high rating matters is the product's to say through its own status surfaces,
 * with the word and the glyph those surfaces carry. This component therefore
 * writes neither `data-status` nor `data-category` and draws only neutral chrome.
 *
 * NULL IS AN HONEST EMPTY STATE. Before the reader answers, `value` is `null` and
 * the row draws with no point chosen rather than defaulting to a middle point the
 * reader never picked. A rating library that guessed a starting answer would put
 * words in the reader's mouth, so the empty scale stays empty until it is
 * answered, and the product can tell "no answer yet" from any real point.
 */

import { Radio } from "@base-ui/react/radio"
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group"
import { useState } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * The root, spelled once. A vertical stack that holds the row of points and,
 * beneath it, the two end words. It draws colour from neither axis and sets no
 * surface of its own, so the points sit on whatever ground the product provides.
 */
const ROOT = "flex w-full flex-col gap-opsin-2"

/**
 * The row of points, spelled once. It wraps rather than scrolls sideways, so a
 * ten point scale on a narrow phone folds onto a second line where every point
 * still clears the target floor, instead of shrinking below it to stay on one
 * row.
 */
const TRACK = "flex w-full flex-wrap gap-opsin-1"

/**
 * One point, spelled once.
 *
 * The chosen point is carried three ways so none of them is load-bearing alone:
 * `aria-checked` for assistive technology, the primary fill for a sighted reader,
 * and the loss of the resting hairline as the fill takes over for greyscale. The
 * fill is the neutral primary role rather than a status colour, because the point
 * is a rating the reader gave, not a level the component reached.
 *
 * The ink is written as the arbitrary property `[color:var(--foreground)]` and
 * the selected ink as `[color:var(--primary-foreground)]`, not `text-foreground`
 * or `text-primary-foreground`, for the reason `button.tsx` records at length:
 * tailwind-merge files a `text-*` colour in the same group as the `text-opsin-*`
 * type step and drops one of them, so the arbitrary property keeps both the size
 * and the ink. A disabled point drops to the measured muted ink rather than an
 * opacity wash, so the number stays legible while it reads as unavailable, and
 * the Arrow keys skip it.
 *
 * The focus ring is carried here rather than left to the product stylesheet, so a
 * project installed without that sheet does not lose it, and the target floors at
 * `--opsin-target-minimum` in rem on both axes so a 44pt point survives and grows
 * with the reader's text size rather than pinning at a device pixel.
 */
const POINT =
  "relative inline-flex flex-1 select-none items-center justify-center " +
  "min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem) " +
  "cursor-pointer rounded-opsin-md border border-border bg-card align-middle " +
  "text-opsin-headline font-medium [color:var(--foreground)] " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "data-[unchecked]:hover:bg-state-hover " +
  "data-[checked]:border-transparent data-[checked]:bg-primary data-[checked]:[color:var(--primary-foreground)] " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:[color:var(--muted-foreground)] data-[disabled]:hover:bg-transparent " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

/**
 * The two end words row, spelled once. `justify-between` pins the minimum word
 * under the first point and the maximum word under the last, and the words sit in
 * the muted ink a couple of steps quieter than the points, because they name the
 * ends of the scale rather than competing with the reader's answer.
 */
const ANCHORS =
  "flex w-full items-start justify-between gap-opsin-4 text-opsin-footnote [color:var(--muted-foreground)]"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a
 * consumer makes with the clinical API, and a rating scale asserts nothing
 * clinical of its own. `radio-group.tsx` and `segmented-control.tsx` keep the
 * same small set for the same reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface ScaleInputProps {
  /**
   * Required. What is being rated, applied as the `aria-label` on the radiogroup
   * so a screen-reader user hears the question before its points. Name the thing
   * the reader is rating, "Comfort right now" rather than "1 to 10". There is no
   * default, because a guessed name would describe the wrong thing on most
   * screens, and a radiogroup with no accessible name is a set of radios a reader
   * cannot place.
   */
  label: string
  /**
   * How many points the scale has, supplied by the product from whichever
   * instrument it uses. The points are numbered 1 to `points`. There is no
   * default: opsinjs ships no scale length of its own, because the number of
   * points is part of what makes a rating comparable over time and belongs to the
   * product. Fewer than two points is not a scale, and it renders nothing with a
   * development warning.
   */
  points: number
  /**
   * The chosen point, from 1 to `points`, or `null` for no answer yet. This is a
   * controlled component with no internal selection state: the product stores the
   * value and passes it back. `null` draws the scale with nothing chosen rather
   * than defaulting to a middle point, so an unanswered scale is honestly empty
   * and the product can tell it from any real rating. A number outside 1 to
   * `points` draws nothing chosen and warns in development.
   */
  value: number | null
  /**
   * Called with the point the reader chose, from 1 to `points`. The product
   * stores it and passes it back as `value`; the scale keeps no state of its own
   * and derives nothing from the number.
   */
  onValueChange: (value: number) => void
  /**
   * The word for the low end of the scale, supplied by the product, shown under
   * the first point and read to a screen-reader user as part of that point. Omit
   * it for a bare numeric scale with no end words. opsinjs ships no anchor words,
   * because the end words belong to the product's instrument.
   */
  minLabel?: string
  /**
   * The word for the high end of the scale, supplied by the product, shown under
   * the last point and read to a screen-reader user as part of that point. Omit
   * it for a bare numeric scale with no end words.
   */
  maxLabel?: string
  /**
   * Merged onto the root. Width, margin and place in a layout belong here. It is
   * the one route by which colour can reach the scale, and the two-colour-axes
   * rule applies to it in full: a rating scale takes neither a status nor a
   * category tint, because a self-report is on neither axis. A class you pass wins
   * over the root's own where the two conflict, because it is merged last.
   */
  className?: string
}

export function ScaleInput({
  label,
  points,
  value,
  onValueChange,
  minLabel,
  maxLabel,
  className,
}: ScaleInputProps) {
  const count = Number.isInteger(points) ? points : 0

  if (isDevelopment()) {
    if (!Number.isInteger(points) || points < 2) {
      warnDev(
        "points",
        "[opsinjs] <ScaleInput> needs `points` to be a whole number of two or " +
          "more. A rating with one point is not a scale, and opsinjs ships no " +
          "scale length of its own: pass the number of points from the instrument " +
          "the product uses.",
      )
    }

    if (typeof label !== "string" || label.trim() === "") {
      warnDev(
        "no-label",
        "[opsinjs] <ScaleInput> was rendered with no `label`. The row is a " +
          "radiogroup and needs an accessible name: without one a screen-reader " +
          "user hears a set of radios with no idea what they rate. Pass `label` " +
          'with the thing being rated, such as "Comfort right now".',
      )
    }

    if (value !== null && (!Number.isInteger(value) || value < 1 || value > count)) {
      warnDev(
        `value-out-of-range:${String(value)}`,
        `[opsinjs] <ScaleInput value={${String(value)}}> is outside 1 to ${String(count)}, ` +
          "so the row renders with nothing chosen. This is a controlled component: " +
          "pass a whole number from 1 to `points`, or `null` for no answer yet.",
      )
    }
  }

  if (!Number.isInteger(points) || points < 2) {
    return null
  }

  const chosen = value !== null && Number.isInteger(value) && value >= 1 && value <= count
  const groupValue = chosen ? value : null
  const hasAnchors =
    (typeof minLabel === "string" && minLabel.trim() !== "") ||
    (typeof maxLabel === "string" && maxLabel.trim() !== "")

  const anchorFor = (point: number): string | undefined => {
    if (point === 1 && typeof minLabel === "string" && minLabel.trim() !== "") {
      return `${point}, ${minLabel}`
    }
    if (point === count && typeof maxLabel === "string" && maxLabel.trim() !== "") {
      return `${point}, ${maxLabel}`
    }
    return undefined
  }

  return (
    <BaseRadioGroup
      data-slot="scale-input"
      aria-label={label}
      value={groupValue}
      onValueChange={(next) => onValueChange(Number(next))}
      className={cn(ROOT, className)}
    >
      <div data-slot="scale-input-track" className={TRACK}>
        {Array.from({ length: count }, (_, index) => {
          const point = index + 1
          const spoken = anchorFor(point)
          return (
            <Radio.Root
              key={point}
              value={point}
              aria-label={spoken}
              data-slot="scale-input-option"
              className={POINT}
            >
              <span data-slot="scale-input-option-label">{point}</span>
            </Radio.Root>
          )
        })}
      </div>
      {hasAnchors ? (
        <div className={ANCHORS}>
          <span data-slot="scale-input-anchor">{minLabel ?? ""}</span>
          <span data-slot="scale-input-anchor" className="text-right">
            {maxLabel ?? ""}
          </span>
        </div>
      ) : null}
    </BaseRadioGroup>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It holds its own selection state,
 * because the scale is controlled and a demo has to close that loop somewhere,
 * and it shows a five point scale with two end words and one point chosen, which
 * is the one thing worth seeing at a glance: the chosen point is lifted by the
 * primary fill rather than by a status colour, so read it in greyscale and it is
 * still plainly the answer.
 *
 * The words are a fictional rating with abstract ends (ADR 0012). There is no
 * real instrument here, no clinical vocabulary and nothing a reader could mistake
 * for a scale their own product uses: the label, the point count and the end
 * words are all invented for the demo.
 */
export default function ScaleInputDemo() {
  const [rating, setRating] = useState<number | null>(3)
  return (
    <ScaleInput
      label="Example rating"
      points={5}
      value={rating}
      onValueChange={setRating}
      minLabel="Not at all"
      maxLabel="Completely"
    />
  )
}
