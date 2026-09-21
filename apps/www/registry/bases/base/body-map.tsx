"use client"

/**
 * BodyMap is a neutral body schematic for pointing at where something is, and
 * a controlled multi-select of the regions a reader marks.
 *
 * IT IS A SCHEMATIC, NOT A FIGURE, AND THAT IS THE WHOLE DESIGN. A realistic
 * body diagram has to represent a range of bodies, ages, skin tones and
 * disabilities, or it tells some readers they are not the intended user. So
 * this component draws an abstract, blocky outline that is deliberately not
 * anyone in particular. It refuses realism on purpose, and the page carries
 * the full statement of that limit.
 *
 * IT ASSERTS ONLY THAT THE READER POINTED HERE. It records a set of region
 * keys. It is not a symptom checker, it does not name a symptom, it does not
 * diagnose, it does not grade severity, and it does not decide what a marked
 * region means. The consuming product owns the region vocabulary and every
 * interpretation of a selection.
 *
 * NEITHER COLOUR AXIS. A marked region carries no clinical level and names no
 * category, so the component carries neither `data-status` nor `data-category`
 * and draws only neutral chrome. A selected region is lifted with a muted
 * fill, a hairline and a tick, never a hue, so the selection survives
 * greyscale and the semantic carrier underneath it is `aria-pressed` rather
 * than any pixel. Colouring a region for severity would be the two-axis
 * violation this component exists to refuse.
 *
 * LEFT AND RIGHT ARE THE SUBJECT'S OWN SIDES. Clinical convention names sides
 * from the person's point of view, so on the front figure the `left-arm`
 * marker sits on the viewer's right. This is intended, and the page says so.
 *
 * THE SCHEMATIC OWNS ITS GEOMETRY; THE PRODUCT OWNS THE WORDS. The component
 * ships a fixed set of nine generic region keys, each with a built-in position
 * on the front or back figure. The `regions` prop lets a product subset those
 * regions and relabel them for its own copy or language. A region whose `key`
 * has no built-in geometry cannot be placed on the figure, so it is warned
 * once in development and skipped rather than drawn somewhere arbitrary.
 *
 * THE CHECKBOX LIST IS THE ROBUST PATH. Every region is a real, focusable,
 * labelled button, so the map is keyboard reachable. A map is still a spatial
 * control, so the page pairs it with a plain checkbox list bound to the same
 * value, and a product should ship that list beside the map rather than
 * making the diagram the only way to answer.
 *
 * IT DERIVES NOTHING AND STORES NOTHING. It is controlled: `value` is the
 * selected keys and `onValueChange` reports the next set. The component keeps
 * no selection state of its own.
 *
 * IT IS A CLIENT COMPONENT because it attaches click handlers to each region
 * and the default demo holds its own selection state with `useState`.
 */

import { useState } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * The shipped region keys. Kept as a local type rather than a fourth public
 * export, for the reason `segmented-control.tsx` gives about its own option
 * type: the registry contract fixes a file at three public exports, so a
 * consumer names this shape as `BodyMapProps["regions"][number]` rather than
 * importing a fourth symbol.
 */
type BodyRegionKey =
  | "head"
  | "chest"
  | "abdomen"
  | "left-arm"
  | "right-arm"
  | "left-leg"
  | "right-leg"
  | "upper-back"
  | "lower-back"

interface RegionGeometry {
  view: "front" | "back"
  xPct: number
  yPct: number
}

/**
 * Built-in placement for each shipped region, as a percentage of the figure
 * box. Left and right are the subject's own sides, so the person's left arm
 * is drawn on the viewer's right. A key absent here has no place on the
 * figure and is skipped rather than guessed at.
 */
const GEOMETRY: Record<BodyRegionKey, RegionGeometry> = {
  head: { view: "front", xPct: 50, yPct: 9.3 },
  chest: { view: "front", xPct: 50, yPct: 25 },
  abdomen: { view: "front", xPct: 50, yPct: 39 },
  "right-arm": { view: "front", xPct: 20.8, yPct: 31.7 },
  "left-arm": { view: "front", xPct: 79.2, yPct: 31.7 },
  "right-leg": { view: "front", xPct: 41.7, yPct: 66.7 },
  "left-leg": { view: "front", xPct: 57.5, yPct: 66.7 },
  "upper-back": { view: "back", xPct: 50, yPct: 26.7 },
  "lower-back": { view: "back", xPct: 50, yPct: 40.7 },
}

/** The default region vocabulary, used when `regions` is omitted. */
const DEFAULT_REGIONS: { key: string; label: string }[] = [
  { key: "head", label: "Head" },
  { key: "chest", label: "Chest" },
  { key: "abdomen", label: "Abdomen" },
  { key: "left-arm", label: "Left arm" },
  { key: "right-arm", label: "Right arm" },
  { key: "left-leg", label: "Left leg" },
  { key: "right-leg", label: "Right leg" },
  { key: "upper-back", label: "Upper back" },
  { key: "lower-back", label: "Lower back" },
]

/** The accessible group name and printed caption for each figure. */
const VIEW_META: Record<"front" | "back", { groupLabel: string; caption: string }> = {
  front: { groupLabel: "Front of the body", caption: "Front" },
  back: { groupLabel: "Back of the body", caption: "Back" },
}

/**
 * The relative box each figure is drawn into. The silhouette fills it and the
 * region buttons are positioned by percentage over it.
 */
const FIGURE_BOX = "relative mx-auto aspect-[120/300] w-full max-w-[10rem]"

/**
 * A region marker, spelled once. The 44pt target floor sits on both axes with
 * the rem fallback, so it grows with the reader's text size. The focus ring is
 * carried here rather than left to the product stylesheet. Neutral chrome
 * only: a hairline in both states, a card fill at rest and a muted fill when
 * selected, and the ink is written as the arbitrary property
 * `[color:var(--foreground)]` rather than `text-foreground`, for the reason
 * `segmented-control.tsx` sets out at length: tailwind-merge files a `text-*`
 * colour in the same conflict group as a `text-opsin-*` type step and drops
 * one of them, where the arbitrary property lands in the `color` group
 * instead.
 */
const REGION_BASE =
  "absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center " +
  "rounded-full border border-border " +
  "min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem) " +
  "cursor-pointer transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"

const REGION_REST = "bg-card [color:var(--muted-foreground)] hover:bg-state-hover"
const REGION_SELECTED = "bg-muted [color:var(--foreground)]"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a
 * consumer makes with the clinical API, and BodyMap asserts nothing clinical.
 * `segmented-control.tsx` keeps the same small set for the same reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

function TickIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-[1.25em]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12l5 5L20 6" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-[1.25em]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

/**
 * The abstract silhouette: a circle for the head and rounded rectangles for
 * the trunk, arms and legs, filled with the muted chrome role and outlined
 * with a hairline. It is `aria-hidden` and `pointer-events-none`, so only the
 * region buttons over it are interactive, and it is the same outline for both
 * views because there are no facial or sex features to differ.
 */
function renderSilhouette() {
  return (
    <svg
      viewBox="0 0 120 300"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full [stroke-width:var(--opsin-space-px)] fill-muted stroke-border"
    >
      <circle cx="60" cy="28" r="18" />
      <rect x="41" y="49" width="38" height="92" rx="16" />
      <rect x="17" y="58" width="16" height="82" rx="8" />
      <rect x="87" y="58" width="16" height="82" rx="8" />
      <rect x="43" y="138" width="15" height="128" rx="7" />
      <rect x="62" y="138" width="15" height="128" rx="7" />
    </svg>
  )
}

export interface BodyMapProps {
  /**
   * The controlled vocabulary of regions, in the order they are considered.
   * Each entry is a stable `key` and the visible words the product wants for
   * it. Defaults to the nine generic regions the schematic ships with. Pass
   * your own to subset the regions or to relabel them for your copy or
   * language. A `key` with no built-in place on the figure cannot be drawn:
   * it is warned once in development and skipped on the diagram, because a
   * marker placed at a guessed position would be worse than no marker. The
   * shipped keys are `head`, `chest`, `abdomen`, `left-arm`, `right-arm`,
   * `left-leg`, `right-leg`, `upper-back` and `lower-back`.
   */
  regions?: { key: string; label: string }[]
  /**
   * The keys currently marked. This is a controlled component with no
   * selection state of its own, so a key here that matches no region simply
   * shows nothing marked for it.
   */
  value: string[]
  /**
   * Called with the next set of marked keys when the reader toggles a region.
   * The caller stores it and passes it back as `value`.
   */
  onValueChange: (value: string[]) => void
  /**
   * Required. The accessible name for the whole group, applied as
   * `aria-label`. Name it as the question the reader is answering, for
   * example "Where are you noticing something?", so a screen-reader user
   * hears what the regions are for before the regions themselves. There is
   * no default, because a guessed name would describe the wrong thing on
   * most screens.
   */
  label: string
  /**
   * Which figure or figures to show. `both` draws the front then the back
   * side by side, `front` and `back` draw one. Defaults to `both`. A figure
   * only ever shows the regions whose geometry belongs to that view.
   */
  view?: "front" | "back" | "both"
  /**
   * Merged onto the root group. Layout, width and place in a form belong
   * here. A class you pass wins over the root's own where the two conflict,
   * because it is merged last.
   */
  className?: string
}

export function BodyMap({
  regions = DEFAULT_REGIONS,
  value,
  onValueChange,
  label,
  view = "both",
  className,
}: BodyMapProps) {
  if (isDevelopment()) {
    if (typeof label !== "string" || label.trim() === "") {
      warnDev(
        "no-label",
        "[opsinjs] <BodyMap> was rendered with no `label`. The root is a group " +
          "and needs an accessible name: without one a screen-reader user hears " +
          "a set of regions with no idea what they are for. Pass `label` as the " +
          'question the reader is answering, such as "Where are you noticing ' +
          'something?".',
      )
    }

    if (Array.isArray(regions) && regions.length === 0) {
      warnDev(
        "empty-regions",
        "[opsinjs] <BodyMap> was given an empty `regions` array, so the figure " +
          "draws the silhouette with no markers on it. That is almost never " +
          "intended; omit `regions` to use the nine default regions, or pass " +
          "at least one entry.",
      )
    }

    if (Array.isArray(regions)) {
      for (const region of regions) {
        if (!(region.key in GEOMETRY)) {
          warnDev(
            `unknown-region:${region.key}`,
            `[opsinjs] <BodyMap> was given a region with key "${region.key}", ` +
              "which has no built-in place on the shipped schematic, so it is " +
              "skipped on the figure rather than drawn at a guessed position. " +
              "The shipped keys are head, chest, abdomen, left-arm, right-arm, " +
              "left-leg, right-leg, upper-back and lower-back.",
          )
        }
      }
    }

    if (view !== "front" && view !== "back" && view !== "both") {
      warnDev(
        `unknown-view:${String(view)}`,
        `[opsinjs] <BodyMap view="${String(view)}"> is not "front", "back" or ` +
          '"both", so it is treated as "both". Pass one of those three values.',
      )
    }
  }

  const safeView = view === "front" || view === "back" ? view : "both"
  const showFront = safeView === "front" || safeView === "both"
  const showBack = safeView === "back" || safeView === "both"

  function toggle(key: string) {
    const next = value.includes(key) ? value.filter((k) => k !== key) : [...value, key]
    onValueChange(next)
  }

  function renderFigure(v: "front" | "back") {
    const meta = VIEW_META[v]
    const here = regions.filter(
      (r) => (GEOMETRY as Record<string, RegionGeometry | undefined>)[r.key]?.view === v,
    )
    return (
      <div
        key={v}
        data-slot="body-map-figure"
        role="group"
        aria-label={meta.groupLabel}
        className="flex flex-col items-center gap-opsin-2"
      >
        <div className={FIGURE_BOX}>
          {renderSilhouette()}
          {here.map((r) => {
            const g = (GEOMETRY as Record<string, RegionGeometry | undefined>)[r.key]!
            const selected = value.includes(r.key)
            return (
              <button
                key={r.key}
                type="button"
                data-slot="body-map-region"
                aria-pressed={selected}
                aria-label={r.label}
                onClick={() => toggle(r.key)}
                style={{ left: `${g.xPct}%`, top: `${g.yPct}%` }}
                className={cn(REGION_BASE, selected ? REGION_SELECTED : REGION_REST)}
              >
                {selected ? <TickIcon /> : <PlusIcon />}
              </button>
            )
          })}
        </div>
        <p className="text-opsin-footnote [color:var(--muted-foreground)]">{meta.caption}</p>
      </div>
    )
  }

  return (
    <div
      data-slot="body-map"
      role="group"
      aria-label={label}
      className={cn("flex flex-wrap justify-center gap-opsin-8", className)}
    >
      {showFront ? renderFigure("front") : null}
      {showBack ? renderFigure("back") : null}
    </div>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is
 * public, reviewed code. It closes the controlled loop with its own state,
 * shows both figures, and starts with one region marked so the one thing
 * worth seeing is visible at a glance: a marked region is lifted with a
 * muted fill, a hairline and a tick, and no colour does the work. Read it in
 * greyscale to check that.
 *
 * The label is a question, never a measurement (ADR 0012). Nothing here is
 * data a reader could mistake for their own.
 */
export default function BodyMapDemo() {
  const [value, setValue] = useState<string[]>(["left-arm"])
  return (
    <BodyMap
      label="Example: where are you noticing something?"
      value={value}
      onValueChange={setValue}
    />
  )
}
