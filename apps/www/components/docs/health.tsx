"use client"

import { useId, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"

import { docsPath } from "@/lib/routes"
import {
  CLINICAL_STATUS_META,
  HEALTH_CATEGORY_LABELS,
  type ClinicalStatus,
  type HealthCategory,
} from "@/lib/status"
import { cn } from "@/lib/utils"
import { NoDataYet } from "./stub"

/* ==========================================================================
   health.tsx defines <RangeDemo>, <Glossary> and <Term>.

   The docs site dogfooding its own vocabulary. <Term> here is the
   documentation's own version of the shipped `term` component. This version is
   a docs-chrome twin, not a copy of it, because the shipped one lives under
   registry/bases/base/ and renders in the product theme inside /view. It
   behaves the way the shipped one has to: plain English first, the clinical
   word kept, and a link to the full definition rather than a tooltip that a
   touch reader cannot open.

   <RangeDemo> is the shared host for the health-data pages. RangeBar,
   ResultCard, MetricTile all show a value against a reference range, and all
   three arguments are about the same three edge cases:

     - The value is outside the range. Which axis owns the colour?
     - The range is UNKNOWN. Most portals draw the bar anyway with a guessed
       range. opsinjs must refuse.
     - The value has no verdict attached. A number with no context is not a
       result; showing it as one is the commonest harm in this category.

   So the demo lets a reader move the value, clear the range and drop the
   verdict, and shows what the system does in each case. It renders a SPECIMEN,
   not the component, and that is still true now that `range-bar` is built: the
   real one lives under registry/bases/base/ and renders in the PRODUCT theme,
   which only exists inside a /view iframe, so a doctrine page cannot host it
   without <ComponentPreview>. <ComponentPreview> has no sliders. A reader
   who wants the shipped component wants that; a reader on a doctrine page wants
   to move one input at a time and watch the rule hold. This carries no
   not-implemented marker either way: it is not pretending to be an API, in
   either direction.
   ========================================================================== */

/* --------------------------------------------------------------------------
   <Term>
   -------------------------------------------------------------------------- */

export interface TermProps {
  /** The glossary id, kebab-case: `hba1c`, `systolic`. */
  id: string
  /** The plain-English gloss, when the page wants to inline it. */
  plain?: string
  children: ReactNode
  className?: string
}

/**
 * A clinical term inline in prose, linked to its entry in the A to Z.
 *
 * It is a link, not a tooltip. A tooltip needs a hover, which a phone does not
 * have, and it hides the one piece of information the reader stopped for. The
 * dotted underline says "there is more here" and the link delivers it in a
 * place that can be read, printed, and shared.
 */
export function Term({ id, plain, children, className }: TermProps) {
  return (
    <Link
      href={`${docsPath("content", "plain-english-a-z")}#${id}`}
      data-opsinjs-term={id}
      title={plain}
      className={cn(
        "underline decoration-muted-foreground decoration-dotted underline-offset-4",
        className
      )}
    >
      {children}
      {plain ? (
        <span className="sr-only">. In plain English: {plain}</span>
      ) : null}
    </Link>
  )
}

/* --------------------------------------------------------------------------
   <Glossary>
   -------------------------------------------------------------------------- */

export interface GlossaryEntry {
  id: string
  /** The clinical term as a reader will meet it. */
  term: string
  /** The plain-English definition, written here and never copied. */
  plain: string
  /** When both the clinical and plain forms should be shown together. */
  showBoth?: string
  /** Why the plain form is worded that way. */
  reason?: string
  /** Other spellings and the words people actually search for. */
  aliases?: string[]
}

export interface GlossaryProps {
  entries?: GlossaryEntry[]
  className?: string
}

/**
 * The filterable A to Z. Every definition is written for opsinjs.
 *
 * Nothing here is copied from the NHS A to Z or any other Crown-copyright
 * source. That is a licensing fact and also a quality one: a definition written
 * for a general health encyclopedia is written for a different reader than
 * somebody looking at their own result on a phone, and the difference shows.
 */
export function Glossary({ entries, className }: GlossaryProps) {
  const id = useId()
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const all = entries ?? []
    if (!needle) return all
    return all.filter((entry) =>
      [entry.term, entry.plain, ...(entry.aliases ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    )
  }, [entries, query])

  if (!entries?.length) {
    return (
      <NoDataYet
        what="The plain-English A to Z"
        script="scripts/build-tokens.mts"
        className={className}
      >
        Entries are authored in{" "}
        <code className="text-xs">tokens/glossary.json</code> and flattened into{" "}
        <code className="text-xs">lib/generated/glossary.json</code>, which is
        also what <code className="text-xs">&lt;Term&gt;</code> reads. Run{" "}
        <code className="text-xs">pnpm run generate</code>.
      </NoDataYet>
    )
  }

  return (
    <div className={cn("not-prose my-6", className)}>
      <label className="flex flex-col gap-1 text-xs" htmlFor={`${id}-q`}>
        Filter
        <input
          id={`${id}-q`}
          type="search"
          value={query}
          placeholder="a word, or the word a reader would type"
          onChange={(event) => setQuery(event.target.value)}
          className="w-full max-w-sm border border-border px-2 py-1 text-sm"
        />
      </label>

      <p aria-live="polite" className="mt-2 text-xs text-muted-foreground">
        {filtered.length} of {entries.length} entries
      </p>

      <dl className="m-0 mt-3">
        {filtered.map((entry) => (
          <div
            key={entry.id}
            id={entry.id}
            className="scroll-mt-24 border-b border-border/60 py-3 last:border-b-0"
          >
            <dt className="m-0 text-sm font-medium">{entry.term}</dt>
            <dd className="m-0 text-sm">{entry.plain}</dd>
            {entry.showBoth ? (
              <dd className="m-0 text-xs text-muted-foreground">
                Show both when: {entry.showBoth}
              </dd>
            ) : null}
            {entry.reason ? (
              <dd className="m-0 text-xs text-muted-foreground">
                {entry.reason}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <RangeDemo>
   -------------------------------------------------------------------------- */

export interface RangeDemoProps {
  /** What is being measured. */
  label?: string
  /** Units, exactly as they should be shown to a reader. */
  unit?: string
  /** Starting value. */
  value?: number
  /** The reference range. Omit either bound for an open-ended range. */
  low?: number
  high?: number
  /** The scale the bar is drawn on. */
  min?: number
  max?: number
  /** Category identity for the tile. Never the source of the verdict. */
  category?: HealthCategory
  className?: string
}

function verdictFor(
  value: number,
  low?: number,
  high?: number
): ClinicalStatus | null {
  if (low === undefined && high === undefined) return null
  const below = low !== undefined && value < low
  const above = high !== undefined && value > high
  if (!below && !above) return "steady"
  const span = (high ?? value) - (low ?? value) || 1
  const distance = below ? (low as number) - value : value - (high as number)
  if (distance > span * 0.5) return "urgent"
  if (distance > span * 0.2) return "attention"
  return "watch"
}

/**
 * The shared health-data specimen: a value, a reference range and a verdict,
 * all of which the reader can change.
 *
 * The thresholds in this demo are ARBITRARY and the caption says so. opsinjs
 * does not own clinical thresholds and never will. Clinical thresholds belong
 * to the service, to a guideline, or to the person's own clinician, and a
 * design system that shipped defaults for them would be quietly making clinical
 * decisions on behalf of every product that installed it. The demo exists to
 * show what the UI does with a threshold, not to supply one.
 */
export function RangeDemo({
  label = "Systolic blood pressure",
  unit = "mmHg",
  value: initialValue = 148,
  low: initialLow = 90,
  high: initialHigh = 130,
  min = 60,
  max = 200,
  category = "heart",
  className,
}: RangeDemoProps) {
  const id = useId()
  const [value, setValue] = useState(initialValue)
  const [hasRange, setHasRange] = useState(true)
  const [showVerdict, setShowVerdict] = useState(true)

  const low = hasRange ? initialLow : undefined
  const high = hasRange ? initialHigh : undefined
  const verdict = showVerdict ? verdictFor(value, low, high) : null
  const position = ((value - min) / (max - min)) * 100

  return (
    <div
      className={cn("not-prose my-6 border border-border", className)}
      data-opsinjs-specimen="range-demo"
    >
      <div className="flex flex-wrap items-end gap-4 border-b border-border/60 p-3">
        <label className="flex flex-col gap-1 text-xs" htmlFor={`${id}-v`}>
          Value ({unit})
          <input
            id={`${id}-v`}
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
            className="w-48"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={hasRange}
            onChange={(event) => setHasRange(event.target.checked)}
          />
          Reference range known
        </label>
        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={showVerdict}
            onChange={(event) => setShowVerdict(event.target.checked)}
          />
          Verdict supplied
        </label>
      </div>

      <div className="p-4">
        <div
          data-category={category}
          data-status={verdict ?? undefined}
          className="border p-4"
          style={
            verdict
              ? {
                  borderColor: `var(--opsin-status-${verdict}-line, var(--border))`,
                  background: `var(--opsin-status-${verdict}-surface, var(--muted))`,
                  color: `var(--opsin-status-${verdict}-ink, var(--foreground))`,
                }
              : undefined
          }
        >
          <p className="m-0 flex items-center gap-1.5 text-xs">
            <span
              aria-hidden="true"
              title={HEALTH_CATEGORY_LABELS[category]}
              className="size-2.5 shrink-0 rounded-full"
              style={{
                background: `var(--opsin-category-${category}-accent, var(--muted-foreground))`,
              }}
            />
            <span className="sr-only">
              {HEALTH_CATEGORY_LABELS[category]}.{" "}
            </span>
            {label}
          </p>
          <p
            data-opsinjs-value=""
            className="m-0 text-3xl leading-tight font-semibold"
          >
            {value}{" "}
            <span className="text-base font-normal opacity-80">{unit}</span>
          </p>

          {hasRange ? (
            <>
              <div
                className="relative mt-3 h-2 w-full bg-foreground/10"
                role="img"
                aria-label={`${value} ${unit} against a reference range of ${low} to ${high}`}
              >
                <span
                  className="absolute inset-y-0"
                  style={{
                    left: `${(((low ?? min) - min) / (max - min)) * 100}%`,
                    width: `${(((high ?? max) - (low ?? min)) / (max - min)) * 100}%`,
                    background:
                      "var(--opsin-status-steady-line, var(--muted-foreground))",
                    opacity: 0.35,
                  }}
                />
                <span
                  className="absolute top-[-3px] h-[14px] w-[3px] bg-foreground"
                  style={{ left: `${Math.min(100, Math.max(0, position))}%` }}
                />
              </div>
              <p className="m-0 mt-1 text-xs opacity-80">
                Your range: {low} to {high} {unit}
              </p>
            </>
          ) : (
            <p className="m-0 mt-3 text-sm">
              <strong className="font-medium">
                No reference range is on file for this reading.
              </strong>{" "}
              The bar is not drawn, because drawing it would require inventing
              the range it is drawn against.
            </p>
          )}

          {verdict ? (
            <p className="m-0 mt-2 text-sm font-medium">
              {CLINICAL_STATUS_META[verdict].word}.{" "}
              {CLINICAL_STATUS_META[verdict].sentence}
            </p>
          ) : (
            <p className="m-0 mt-2 text-sm">
              No verdict has been supplied, so none is shown. The number is
              presented as a number.
            </p>
          )}
        </div>
      </div>

      <p className="m-0 border-t border-border/60 px-3 py-2 text-[0.6875rem] text-muted-foreground">
        The thresholds in this demo are arbitrary and exist only to move the
        specimen. opsinjs does not own clinical thresholds: they come from the
        service, a guideline, or the reader&rsquo;s own clinician, and a design
        system that shipped defaults for them would be making clinical decisions
        for every product that installed it.
      </p>
    </div>
  )
}
