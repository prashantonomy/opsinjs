"use client"

import {
  useCallback,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"
import {
  Ban,
  Check,
  Eye,
  Minus,
  OctagonAlert,
  TriangleAlert,
} from "lucide-react"

import {
  axisConflict,
  CLINICAL_STATUSES,
  CLINICAL_STATUS_META,
  HEALTH_CATEGORIES,
  HEALTH_CATEGORY_LABELS,
  type ClinicalStatus,
  type ClinicalStatusOrUnknown,
  type HealthCategory,
} from "@/lib/status"
import { cn } from "@/lib/utils"
import { NoDataYet } from "./stub"

/* ==========================================================================
   colour.tsx holds <ColorScale>, <TokenSwatch>, <StatusLadder>,
   <StatusAxisDemo> and <CategoryGrid>.

   NOTE ON FILE NAMING. British spelling in prose, American in code. The file is
   `colour.tsx` because the manifest names it that and it is prose-adjacent;
   every identifier inside it is American. ColorScale and --color-* are two of
   them. That split is the one Tailwind and CSS force on everybody, and it is
   applied consistently rather than argued about per file.

   THE TWO AXES ARE THE WHOLE SYSTEM.

     AXIS 1 IS CATEGORY. What a reading is ABOUT: sleep, heart, activity,
     nutrition, mind, labs. Identity. Low chroma, and never a verdict. A
     heart-tinted card does not mean something is wrong with a heart reading.

     AXIS 2 IS CLINICAL STATUS. What to DO about it: steady, watch, attention,
     urgent. Verdict. High chroma, ordered, and never the only carrier of the
     meaning. A status always ships with a word and an icon.

   The invariant is that one SURFACE takes its colour from exactly one axis.
   Both axes may appear on one screen: a heart-tinted card containing a `watch`
   pill is correct and common. What may not happen is one element carrying both,
   because then a reader cannot tell which question the colour is answering.

   <StatusAxisDemo> is the artifact that makes that teachable. It calls
   `axisConflict()` from lib/status.ts and REFUSES to render the mixed pair,
   then shows the two legal alternatives rendered side by side. It is the one
   caller of that function in the repo, because no shipped component resolves
   both axes on one element and so none of them has anything to report. A rule
   you read is forgotten; a tool that declines to draw the thing you asked for
   is not.

   CUSTOM PROPERTIES AND THE PRE-GENERATE STATE. Every `var()` below carries a
   fallback, because `app/tokens.generated.css` is an empty placeholder until
   `pnpm run generate` has run. With the fallback a clean clone renders a quiet,
   correct-looking specimen; without one it would render invisible text on an
   invisible surface and look broken rather than ungenerated.
   ========================================================================== */

/** `--opsin-status-urgent-ink`, with a sane fallback before generation. */
function statusVar(
  status: ClinicalStatus,
  role: "surface" | "line" | "ink" | "accent",
  fallback: string
): string {
  return `var(--opsin-status-${status}-${role}, ${fallback})`
}

function categoryVar(
  category: HealthCategory,
  role: "surface" | "line" | "ink" | "accent",
  fallback: string
): string {
  return `var(--opsin-category-${category}-${role}, ${fallback})`
}

const STATUS_ICONS: Record<ClinicalStatusOrUnknown, typeof Check> = {
  steady: Check,
  watch: Eye,
  attention: TriangleAlert,
  urgent: OctagonAlert,
  unknown: Minus,
}

/* --------------------------------------------------------------------------
   Colour reading helpers that have no dependency and do no maths of our own
   -------------------------------------------------------------------------- */

/**
 * Ask the browser what a custom property currently resolves to.
 *
 * This is how a specimen shows a real value without importing the colour
 * engine: whatever the cascade decided is what the reader sees and what the
 * caption says. An authored fallback, a generated ramp, a wide-gamut escalation
 * and a dark theme all feed that decision. A specimen that quoted a hard-coded
 * value would be wrong the first time a token moved, and wrong silently.
 */
function useResolvedToken(variable: string): string {
  const subscribe = useCallback((onChange: () => void) => {
    // next-themes toggles `dark` on <html>, and the (view) shell writes
    // data-theme there. Either changes what the property resolves to, so a
    // caption never disagrees with the swatch beside it after a theme switch.
    const observer = new MutationObserver(onChange)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    })
    return () => observer.disconnect()
  }, [])

  return useSyncExternalStore(
    subscribe,
    () =>
      getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim() || "not generated",
    () => ""
  )
}

/** Let the browser do the sRGB conversion; canvas normalises any CSS colour. */
function toSrgbHex(color: string): string | null {
  if (typeof document === "undefined" || !color) return null
  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext("2d")
  if (!context) return null
  context.fillStyle = "#000000"
  context.fillStyle = color
  const normalized = context.fillStyle
  return typeof normalized === "string" ? normalized : null
}

/* --------------------------------------------------------------------------
   <TokenSwatch>
   -------------------------------------------------------------------------- */

export interface TokenSwatchProps {
  /** The custom property, with its leading dashes: `--opsin-status-urgent-ink`. */
  token: string
  /** What it is for, in one phrase. */
  label?: string
  /** The token it is meant to be read against, drawn as an inner ring. */
  against?: string
  className?: string
}

/**
 * One token: its name, what it currently resolves to, and the pair it is meant
 * to be read against.
 *
 * The measured contrast figure is deliberately NOT shown here. It belongs to
 * <ContrastReport>, which prints CI-measured numbers. A swatch that computed
 * its own would produce a second set of figures that could disagree with the
 * published ones, and nobody would know which to believe.
 */
export function TokenSwatch({
  token,
  label,
  against,
  className,
}: TokenSwatchProps) {
  const resolved = useResolvedToken(token)

  return (
    <div
      className={cn("not-prose flex items-center gap-3 py-1", className)}
      data-opsinjs-token={token}
    >
      <span
        aria-hidden="true"
        className="size-9 shrink-0 border border-border"
        style={{
          background: `var(${token}, var(--muted))`,
          ...(against
            ? { boxShadow: `inset 0 0 0 3px var(${against}, var(--border))` }
            : {}),
        }}
      />
      <span className="min-w-0">
        <code className="block text-xs break-all">{token}</code>
        <span className="block text-xs text-muted-foreground">
          {label ? `${label} · ` : null}
          {resolved || "reading…"}
        </span>
      </span>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <ColorScale>
   -------------------------------------------------------------------------- */

export interface ColorScaleStep {
  /** Step name: `50`…`900`, or a role name such as `surface`. */
  name: string
  /** The custom property that holds it. */
  token: string
  /** The authored OKLCH value, from the generated token map. */
  oklch?: string
  /** The Display-P3 escalation, when there is one. */
  p3?: string
  /** Whether the P3 value falls outside sRGB. Generated, never guessed. */
  outOfSrgb?: boolean
}

type ColorFormat = "var" | "computed" | "hex"

export interface ColorScaleProps {
  /** What this ramp is: `status-urgent`, `category-heart`, `neutral`. */
  name: string
  steps?: ColorScaleStep[]
  className?: string
}

/**
 * An OKLCH ramp with per-step values and a format switcher.
 *
 * `var()` is listed first and on purpose. It is the format a reader should
 * almost always copy: a raw OKLCH string pasted into a product stylesheet stops
 * following the theme, stops following the wide-gamut escalation, and stops
 * being covered by the contrast gate. A canvas, an email and a native shell are
 * places a variable cannot go, and the literal values exist for them.
 */
export function ColorScale({ name, steps, className }: ColorScaleProps) {
  const [format, setFormat] = useState<ColorFormat>("var")
  const id = useId()

  const formats: { value: ColorFormat; label: string; hint: string }[] = [
    { value: "var", label: "var()", hint: "Copy this one." },
    {
      value: "computed",
      label: "oklch",
      hint: "The value the cascade resolves.",
    },
    {
      value: "hex",
      label: "hex",
      hint: "Clamped into sRGB by the browser. Lossy for wide-gamut steps.",
    },
  ]

  if (!steps?.length) {
    return (
      <NoDataYet
        what={`The ${name} ramp`}
        script="scripts/build-tokens.mts"
        className={className}
      >
        Ramps are generated from{" "}
        <code className="text-xs">tokens/color.json</code>, including the
        Display-P3 escalation and the sRGB gamut boundary. Run{" "}
        <code className="text-xs">pnpm run generate</code>.
      </NoDataYet>
    )
  }

  return (
    <div
      className={cn("not-prose my-6 border border-border", className)}
      data-opsinjs-scale={name}
    >
      <fieldset className="m-0 flex flex-wrap items-center gap-1 border-0 border-b border-border/60 p-3">
        <legend className="sr-only">Value format</legend>
        {formats.map((option) => (
          <span key={option.value} className="contents">
            <input
              type="radio"
              className="sr-only"
              id={`${id}-${option.value}`}
              name={`${id}-format`}
              checked={format === option.value}
              onChange={() => setFormat(option.value)}
            />
            <label
              htmlFor={`${id}-${option.value}`}
              title={option.hint}
              className={cn(
                "cursor-pointer border border-border px-2 py-0.5 font-mono text-xs",
                format === option.value
                  ? "border-foreground bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </label>
          </span>
        ))}
      </fieldset>

      <ul className="m-0 list-none p-0">
        {steps.map((step) => (
          <ScaleStep key={step.token} step={step} format={format} />
        ))}
      </ul>
    </div>
  )
}

function ScaleStep({
  step,
  format,
}: {
  step: ColorScaleStep
  format: ColorFormat
}) {
  const resolved = useResolvedToken(step.token)
  // Derived, not stored: the hex is a pure function of the resolved value and
  // the chosen format, so there is nothing for state to remember.
  const hex = useMemo(
    () => (format === "hex" && resolved ? toSrgbHex(resolved) : null),
    [format, resolved]
  )

  const shown =
    format === "var"
      ? `var(${step.token})`
      : format === "computed"
        ? resolved || step.oklch || "reading…"
        : (hex ?? "…")

  return (
    <li className="m-0 flex items-center gap-3 border-b border-border/60 px-3 py-2 last:border-b-0">
      <span
        aria-hidden="true"
        className="size-10 shrink-0 border border-border"
        style={{ background: `var(${step.token}, var(--muted))` }}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{step.name}</span>
        <code className="block text-xs break-all text-muted-foreground">
          {shown}
        </code>
      </span>
      {step.outOfSrgb ? (
        <span
          className="shrink-0 text-[0.6875rem] text-muted-foreground"
          title="Outside sRGB. On an sRGB screen it displays as the clamped colour; the hue and lightness are unchanged, only the chroma. That is why every measured contrast figure holds in both gamuts."
        >
          beyond sRGB
        </span>
      ) : null}
    </li>
  )
}

/* --------------------------------------------------------------------------
   <StatusLadder>
   -------------------------------------------------------------------------- */

export interface StatusLadderProps {
  /** Hide the example sentences, for a compact legend. */
  compact?: boolean
  /** Include the `unknown` row. It is not a status; see the note it carries. */
  includeUnknown?: boolean
  className?: string
}

/**
 * The canonical specimen for axis 2: four ordered levels, each with its colour,
 * its icon, its word and the sentence a patient-facing product would actually
 * write.
 *
 * Every row carries the word and the icon. That is the specimen making its own
 * argument. Cover the swatches and the ladder still reads correctly, which is
 * exactly the property a status pill needs on a greyscale printout, in
 * sunlight, or for a reader with deuteranopia.
 *
 * "Who assigns this" is on every row because it is the boundary of the whole
 * system: opsinjs never decides that a reading is urgent. A product does, from
 * a threshold it owns and a clinician signed.
 */
export function StatusLadder({
  compact,
  includeUnknown,
  className,
}: StatusLadderProps) {
  const rows: ClinicalStatusOrUnknown[] = includeUnknown
    ? [...CLINICAL_STATUSES, "unknown"]
    : [...CLINICAL_STATUSES]

  return (
    <ol
      className={cn("not-prose m-0 list-none space-y-2 p-0", className)}
      data-opsinjs-specimen="status-ladder"
    >
      {rows.map((row) => {
        const meta = CLINICAL_STATUS_META[row]
        const Icon = STATUS_ICONS[row]
        const known = row !== "unknown"
        return (
          <li
            key={row}
            data-status={row}
            className="m-0 border-l-4 py-2 pl-3"
            style={
              known
                ? {
                    borderColor: statusVar(row, "line", "var(--border)"),
                    background: statusVar(row, "surface", "var(--muted)"),
                    color: statusVar(row, "ink", "var(--foreground)"),
                  }
                : {
                    borderColor: "var(--border)",
                    background: "var(--muted)",
                    color: "var(--muted-foreground)",
                  }
            }
          >
            <p className="m-0 flex items-center gap-2 text-sm font-semibold">
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span className="font-mono text-xs opacity-70">{meta.level}</span>
              {meta.word}
            </p>
            <p className="m-0 text-sm">{meta.sentence}</p>
            {!compact ? (
              <p className="m-0 pt-1 text-xs opacity-80">
                Assigned by: {meta.assignedBy}
              </p>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

/* --------------------------------------------------------------------------
   <CategoryGrid>
   -------------------------------------------------------------------------- */

/**
 * One line each, so the grid teaches what a category is FOR rather than only
 * naming it. This is prose about the axis, not token data. The values and the
 * ramp descriptions live in tokens/color.json and are rendered by <ColorScale>.
 */
const CATEGORY_EXAMPLES: Record<HealthCategory, string> = {
  sleep: "Duration, timing, consistency, stages",
  heart: "Blood pressure, resting heart rate, rhythm",
  activity: "Steps, active minutes, workouts",
  nutrition: "Intake, hydration, glucose in a dietary context",
  mind: "Mood, stress, questionnaire scores",
  labs: "Blood tests and anything reported with a reference range",
}

export interface CategoryGridProps {
  className?: string
}

/**
 * The six category identities.
 *
 * Deliberately low chroma. Put this beside <StatusLadder> and the difference in
 * saturation is the argument: category colour is quiet because it is a label,
 * status colour is loud because it is a verdict, and a reader who has seen the
 * two next to each other will not confuse them again.
 */
export function CategoryGrid({ className }: CategoryGridProps) {
  return (
    <ul
      className={cn(
        "not-prose m-0 grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
      data-opsinjs-specimen="category-grid"
    >
      {HEALTH_CATEGORIES.map((category) => (
        <li
          key={category}
          data-category={category}
          className="m-0 border p-3"
          style={{
            borderColor: categoryVar(category, "line", "var(--border)"),
            background: categoryVar(category, "surface", "var(--muted)"),
            color: categoryVar(category, "ink", "var(--foreground)"),
          }}
        >
          <p className="m-0 flex items-center gap-2 text-sm font-medium">
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-full"
              style={{
                background: categoryVar(
                  category,
                  "accent",
                  "var(--muted-foreground)"
                ),
              }}
            />
            {HEALTH_CATEGORY_LABELS[category]}
          </p>
          <p className="m-0 text-xs opacity-80">
            {CATEGORY_EXAMPLES[category]}
          </p>
        </li>
      ))}
    </ul>
  )
}

/* --------------------------------------------------------------------------
   <StatusAxisDemo> is the lab that refuses
   -------------------------------------------------------------------------- */

export interface StatusAxisDemoProps {
  className?: string
}

/**
 * Pick a category. Pick a status. Pick both, and it will not render.
 *
 * The refusal is the feature, and it is deliberately the SAME refusal a
 * component would get: this component calls `axisConflict()` from lib/status.ts,
 * the function reserved to report OPSIN-0001. It is the only caller in the
 * repo. No shipped component resolves both axes on one element, so none of them
 * raises this at runtime, and what catches the mistake in a source file today
 * is A11Y008 in scripts/check-a11y.mts. The demo cannot drift from the rule,
 * because the sentence a developer reads here is the one the function itself
 * returns.
 *
 * Both legal alternatives are shown rendered, because "use a glyph instead" is
 * only convincing when you can see that it works.
 */
export function StatusAxisDemo({ className }: StatusAxisDemoProps) {
  const id = useId()
  const [category, setCategory] = useState<HealthCategory | "none">("heart")
  const [status, setStatus] = useState<ClinicalStatus | "none">("none")

  const conflict = axisConflict({
    category: category === "none" ? null : category,
    status: status === "none" ? null : status,
  })

  return (
    <div
      className={cn("not-prose my-6 border border-border", className)}
      data-opsinjs-tool="status-axis-demo"
    >
      <div className="grid gap-3 border-b border-border/60 p-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs" htmlFor={`${id}-cat`}>
          Axis 1 is the category (what the reading is about)
          <select
            id={`${id}-cat`}
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as HealthCategory | "none")
            }
            className="border border-border px-2 py-1 text-sm"
          >
            <option value="none">None</option>
            {HEALTH_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {HEALTH_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs" htmlFor={`${id}-status`}>
          Axis 2 is the clinical status (what to do about it)
          <select
            id={`${id}-status`}
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ClinicalStatus | "none")
            }
            className="border border-border px-2 py-1 text-sm"
          >
            <option value="none">None</option>
            {CLINICAL_STATUSES.map((value) => (
              <option key={value} value={value}>
                {CLINICAL_STATUS_META[value].word}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="p-4" aria-live="polite">
        {conflict ? (
          <div
            role="alert"
            data-opsinjs-refused={conflict.code}
            className="border border-dashed border-border p-4"
          >
            <p className="m-0 flex items-center gap-2 text-sm font-medium text-foreground">
              <Ban aria-hidden="true" className="size-4" />
              {conflict.code}. This combination will not be rendered.
            </p>
            <p className="m-0 mt-2 text-sm text-muted-foreground">
              {conflict.message}
            </p>
            <p className="m-0 mt-2 text-sm text-muted-foreground">
              The reason is what a reader can conclude. Give one element two
              colours and they cannot tell which question the colour is
              answering. On a health screen the wrong answer is somebody
              ignoring an urgent result because the tile has always been that
              colour.
            </p>

            <p className="m-0 mt-4 text-sm font-medium text-foreground">
              The two ways to say both things
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <figure className="m-0">
                <figcaption className="mb-1 text-xs text-muted-foreground">
                  Status owns the surface; category is a glyph and a label.
                </figcaption>
                <div
                  data-status={conflict.status}
                  className="border-l-4 p-3"
                  style={{
                    borderColor: statusVar(
                      conflict.status,
                      "line",
                      "var(--border)"
                    ),
                    background: statusVar(
                      conflict.status,
                      "surface",
                      "var(--muted)"
                    ),
                    color: statusVar(
                      conflict.status,
                      "ink",
                      "var(--foreground)"
                    ),
                  }}
                >
                  <p className="m-0 flex items-center gap-1.5 text-xs">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        background: categoryVar(
                          conflict.category,
                          "accent",
                          "currentColor"
                        ),
                      }}
                    />
                    {HEALTH_CATEGORY_LABELS[conflict.category]}
                  </p>
                  <p className="m-0 text-lg font-semibold">148/92</p>
                  <p className="m-0 text-sm font-medium">
                    {CLINICAL_STATUS_META[conflict.status].word}
                  </p>
                </div>
              </figure>

              <figure className="m-0">
                <figcaption className="mb-1 text-xs text-muted-foreground">
                  Category owns the surface; status is a word inside a pill.
                </figcaption>
                <div
                  data-category={conflict.category}
                  className="border p-3"
                  style={{
                    borderColor: categoryVar(
                      conflict.category,
                      "line",
                      "var(--border)"
                    ),
                    background: categoryVar(
                      conflict.category,
                      "surface",
                      "var(--muted)"
                    ),
                    color: categoryVar(
                      conflict.category,
                      "ink",
                      "var(--foreground)"
                    ),
                  }}
                >
                  <p className="m-0 text-xs">
                    {HEALTH_CATEGORY_LABELS[conflict.category]}
                  </p>
                  <p className="m-0 text-lg font-semibold">148/92</p>
                  <p
                    data-status={conflict.status}
                    className="m-0 mt-1 inline-block border px-1.5 text-xs font-medium"
                    style={{
                      borderColor: statusVar(
                        conflict.status,
                        "line",
                        "var(--border)"
                      ),
                      background: statusVar(
                        conflict.status,
                        "surface",
                        "var(--background)"
                      ),
                      color: statusVar(
                        conflict.status,
                        "ink",
                        "var(--foreground)"
                      ),
                    }}
                  >
                    {CLINICAL_STATUS_META[conflict.status].word}
                  </p>
                </div>
              </figure>
            </div>
            <p className="m-0 mt-3 text-xs text-muted-foreground">
              In both, exactly one axis owns the surface and the other is
              carried by a shape or a word. That is the whole rule.
            </p>
          </div>
        ) : category !== "none" ? (
          <figure className="m-0">
            <figcaption className="mb-1 text-xs text-muted-foreground">
              Category only. Identity, no verdict.
            </figcaption>
            <div
              data-category={category}
              className="border p-3"
              style={{
                borderColor: categoryVar(category, "line", "var(--border)"),
                background: categoryVar(category, "surface", "var(--muted)"),
                color: categoryVar(category, "ink", "var(--foreground)"),
              }}
            >
              <p className="m-0 text-xs">{HEALTH_CATEGORY_LABELS[category]}</p>
              <p className="m-0 text-lg font-semibold">148/92</p>
              <p className="m-0 text-xs opacity-80">
                {CATEGORY_EXAMPLES[category]}
              </p>
            </div>
          </figure>
        ) : status !== "none" ? (
          <figure className="m-0">
            <figcaption className="mb-1 text-xs text-muted-foreground">
              Status only. Verdict, with the word that always accompanies it.
            </figcaption>
            <div
              data-status={status}
              className="border-l-4 p-3"
              style={{
                borderColor: statusVar(status, "line", "var(--border)"),
                background: statusVar(status, "surface", "var(--muted)"),
                color: statusVar(status, "ink", "var(--foreground)"),
              }}
            >
              <p className="m-0 text-lg font-semibold">148/92</p>
              <p className="m-0 text-sm font-medium">
                {CLINICAL_STATUS_META[status].word}
              </p>
              <p className="m-0 text-sm">
                {CLINICAL_STATUS_META[status].sentence}
              </p>
            </div>
          </figure>
        ) : (
          <p className="m-0 text-sm text-muted-foreground">
            Choose one axis. Choosing both is the case this tool exists to
            refuse.
          </p>
        )}
      </div>
    </div>
  )
}
