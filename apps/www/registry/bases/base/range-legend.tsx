/**
 * RangeLegend is the key to a RangeBar, in words. It names the tones a bar
 * draws and asserts nothing about any one reading.
 *
 * IT NEVER FLOATS FREE OF ITS BAR. The roster declined a floating legend
 * because a legend that can be separated from its chart is a legend that
 * will be. The interface answers that objection the only way a component
 * can: it takes only the band definitions and takes no bar reference at all,
 * so the binding is a convention rather than code, and the caller is the one
 * who passes the same bands the bar was given and places the legend in the
 * same container. This file cannot enforce that placement, so it does the
 * one thing it can instead: it renders no scale, no reading and no verdict,
 * which means a legend that drifts onto the wrong screen is at worst useless
 * rather than misleading.
 *
 * IT OWNS NO RANGE AND NO THRESHOLD. Every word in every row arrives as a
 * prop. There is no built-in vocabulary of band names, no default range and
 * no table of levels decided in this file. The product owns the words
 * because the product owns the ranges those words describe.
 *
 * THE TWO AXES SIT ON DIFFERENT ROWS AND NEVER ON ONE ELEMENT. A swatch is
 * either the neutral reference-range band or one of the four clinical status
 * tones, and it is never a category tint. Category colour identifies what a
 * reading is about, and a legend of range tones is not about identity, so
 * `data-category` never appears anywhere in this file. A status row carries
 * `data-status`; the neutral row carries neither attribute, and no element
 * ever carries both.
 *
 * STATUS IS NEVER A COLOUR ALONE. A status row draws the fill, the distinct
 * glyph for that level and the word together, so the level survives
 * greyscale, colour-vision deficiency and forced colours. The measured CVD
 * audit finds two status pairs identical in greyscale, so the glyph shape
 * and the word are the carriers the colour is redundant to, not the other
 * way round.
 *
 * THE SWATCH COLOURS ARE THE BAR'S OWN. The neutral swatch takes RangeBar's
 * band colours and each status swatch takes RangeBar's tick tone, copied
 * verbatim, so a swatch in the key is the same colour as the mark it
 * explains on the bar. If the two ever disagree, the legend is lying about
 * the picture beside it.
 *
 * IT IS A SERVER COMPONENT AND IT IS NOT INTERACTIVE. Nothing here takes
 * focus, answers a key or a pointer, or animates. It is a list of names.
 */

import { Circle, CircleDot, Diamond, Octagon } from "lucide-react"

import {
  CLINICAL_STATUS_META,
  isClinicalStatus,
  isDevelopment,
  warnOnce,
  type ClinicalStatus,
} from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * The glyph per level, the same binding RangeBar writes out, because a
 * bundler cannot resolve `CLINICAL_STATUS_META[level].icon` to a component at
 * runtime without pulling the whole icon set into the bundle. Typed
 * `Record<ClinicalStatus, ...>` so a missing level is a compile error.
 */
const ICONS: Record<ClinicalStatus, typeof Circle> = {
  steady: Circle,
  watch: CircleDot,
  attention: Diamond,
  urgent: Octagon,
}

/* Development-only drift guard, kept in step with RangeBar's own copy. If
   somebody changes an icon name in lib/status.ts and not here, this file
   draws a plausible glyph for the wrong level, which is the exact failure
   the four-distinct-shapes rule exists to prevent. Not an OPSIN code: this is
   a defect in opsinjs itself, not a mistake a consumer made with the API. */
if (isDevelopment()) {
  for (const [level, Icon] of Object.entries(ICONS)) {
    const expected = CLINICAL_STATUS_META[level as ClinicalStatus].icon
    const actual = (Icon as { displayName?: string }).displayName
    if (actual && actual !== expected) {
      console.warn(
        `[opsinjs] RangeLegend renders <${actual}> for status "${level}", but ` +
          `CLINICAL_STATUS_META says the icon is "${expected}". The four levels ` +
          `must be four distinct glyph shapes; fix ICONS in range-legend.tsx.`,
      )
    }
  }
}

/**
 * The status swatch fill, one class per level, written out because Tailwind
 * reads class names out of source as literal strings. These are RangeBar's
 * `TICK_TONE` verbatim: the bare status name is the line role, which is the
 * boundary colour a small mark on a neutral row is, so a swatch here is the
 * same colour as the tick it explains.
 */
const SWATCH_TONE: Record<ClinicalStatus, string> = {
  steady: "bg-status-steady",
  watch: "bg-status-watch",
  attention: "bg-status-attention",
  urgent: "bg-status-urgent",
}

/**
 * The neutral reference-range band swatch, copied from RangeBar's own band:
 * an outlined near-neutral rather than a fill, because the band is a fact
 * about a laboratory and never a verdict.
 */
const NEUTRAL_SWATCH = "border border-muted-foreground bg-background"

/**
 * Development warnings, said once per offending call site and keyed on the
 * mistake rather than on a per-render value, mirroring RangeBar's own guard.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message) // starts "[opsinjs] RangeLegend ..."
}

/**
 * Types are advice in a JavaScript consumer, so a tone outside the four is
 * repaired to the least-asserting option: the neutral band. `unknown` gets
 * its own code because it is the likeliest and most dangerous wrong answer,
 * the absence of an assertion read as a level.
 */
function resolveTone(tone: ClinicalStatus | undefined): ClinicalStatus | undefined {
  if (tone === undefined) return undefined
  if (isClinicalStatus(tone)) return tone
  warnOnce(tone === "unknown" ? "OPSIN-0011" : "OPSIN-0021", {
    component: "RangeLegend",
    status: String(tone),
  })
  return undefined
}

export interface RangeLegendBand {
  /**
   * The row's word, in the reader's language: "The usual range", "Worth
   * watching", "Needs attention". For a status row this is the product's own
   * phrasing for that level rather than a fixed system word, because the
   * product owns the words.
   */
  label: string
  /**
   * An optional second line saying what the tone means in a little more
   * depth, for example who set the range or what the reader might do. Kept
   * short: a legend is a key, not the explanation itself.
   */
  description?: string
  /**
   * Which tone this row names. Omit it for the neutral reference-range band,
   * which is what the bar draws for the usual range and for a reading with
   * no verdict. Set it to a clinical status level to name a tone the product
   * has assigned. It is the four levels rather than `string`, because a
   * legend that accepted a fifth tone would be naming a colour the bar
   * cannot draw. A value outside the four is refused with a development
   * warning and the row falls back to the neutral band.
   */
  tone?: ClinicalStatus
}

export interface RangeLegendProps {
  /**
   * The rows of the key, in the order the reader should meet them. Each
   * names one tone a RangeBar draws: the neutral reference-range band, or one
   * of the four clinical status levels. The words are yours, because the
   * product owns the ranges those words describe; this component supplies
   * none.
   *
   * An empty array renders nothing and is reported in development. A legend
   * with no rows is a caption for a picture it forgot to name.
   */
  bands: RangeLegendBand[]
  /** Merged onto the root. A class passed here wins where the two conflict. */
  className?: string
}

export function RangeLegend({ bands, className }: RangeLegendProps) {
  if (bands.length === 0) {
    warnDev(
      "empty-bands",
      "[opsinjs] <RangeLegend> was given an empty `bands` array, so it rendered " +
        "nothing. A legend with no rows is a key to a picture it forgot to name. " +
        "Pass the band definitions the RangeBar beside it was given.",
    )
    return null
  }

  return (
    <ul
      data-slot="range-legend"
      className={cn(
        "m-0 flex w-full list-none flex-col gap-opsin-2 p-0 text-opsin-body",
        className,
      )}
    >
      {bands.map((band, index) => {
        const level = resolveTone(band.tone)
        const Glyph = level === undefined ? null : ICONS[level]
        return (
          <li
            key={`${band.label}:${index}`}
            data-slot="range-legend-item"
            data-status={level}
            className="m-0 flex items-start gap-opsin-2"
          >
            {/* The swatch: the bar's own colour for this tone. Decorative, so
                it is out of the accessibility tree; the label carries the
                meaning. The neutral swatch is outlined; a status swatch is a
                fill and gains a CanvasText outline under forced colours so
                the mark survives where a background alone is stripped. */}
            <span
              data-slot="range-legend-swatch"
              aria-hidden="true"
              className={
                "mt-[0.15em] size-opsin-4 shrink-0 rounded-opsin-xs forced-colors:[outline:1px_solid_CanvasText] " +
                (level === undefined ? NEUTRAL_SWATCH : SWATCH_TONE[level])
              }
            />

            {/* The glyph, on status rows only: the shape carrier the colour
                is redundant to, in a neutral ink so no new status-ink-on-host
                pairing is introduced. Decorative; the word below is the
                semantic level. */}
            {Glyph === null ? null : (
              <Glyph
                aria-hidden="true"
                className="mt-[0.15em] size-opsin-4 shrink-0 [color:var(--muted-foreground)]"
              />
            )}

            <span className="flex min-w-0 flex-col gap-opsin-0-5">
              <span
                data-slot="range-legend-label"
                className="[color:var(--foreground)]"
              >
                {band.label}
              </span>
              {band.description === undefined ? null : (
                <span className="text-opsin-footnote [color:var(--muted-foreground)]">
                  {band.description}
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is
 * public, reviewed code rather than a scratch demo. It shows the one
 * distinction worth seeing: the neutral reference-range band against two
 * status tones, so the two axes are visibly separate and every status row
 * carries a word, a glyph and a colour together. It renders no bar, because
 * the base file composes no sibling key; the paired examples on the page
 * show the legend beside its bar. The words are fictional and there is not a
 * number anywhere (ADR 0012), so nothing here can be mistaken for a real
 * range, and it triggers no development warning because bands is non-empty
 * and every tone is valid.
 */
export default function RangeLegendDemo() {
  return (
    <div className="w-full max-w-xs">
      <RangeLegend
        bands={[
          {
            label: "The usual range",
            description: "From your laboratory. Most results sit here.",
          },
          {
            label: CLINICAL_STATUS_META.watch.word,
            description:
              "Outside the usual range. Nothing to do before your next reading.",
            tone: "watch",
          },
          {
            label: CLINICAL_STATUS_META.attention.word,
            description:
              "Your care team set this. Contact them about this reading.",
            tone: "attention",
          },
        ]}
      />
    </div>
  )
}
