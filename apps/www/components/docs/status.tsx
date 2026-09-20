import type { ReactNode } from "react"
import Link from "next/link"

import {
  CATALOGUE_CATEGORY_LABELS,
  getCatalogue,
  hasComponentPage,
  statusCounts,
  type CatalogueEntry,
} from "@/lib/catalogue"
import { componentPath, docsPath, routes } from "@/lib/routes"
import {
  isStatus,
  STATUSES,
  STATUS_META,
  STATUS_ORDER,
  type Status,
} from "@/lib/status"
import { cn } from "@/lib/utils"

/* ==========================================================================
   status.tsx defines <StatusBadge>, <StatusLegend>, <SectionProgress>,
   <StatusMatrix>, <ComponentsList>.

   THREE AXES THAT ARE CONSTANTLY CONFUSED, AND ONLY ONE OF THEM IS HERE.

     RELEASE PHASE   planned · shipped · deprecated
                     Whether there is CODE, and whether it is on its way out.
                     A property of opsinjs, and of a component page only.
                     This file.

     CLINICAL STATUS steady · watch · attention · urgent
                     How urgent a READING is. A property of somebody's data.
                     lib/status.ts, rendered by <StatusLadder> in colour.tsx.

     HEALTH CATEGORY sleep · heart · activity · nutrition · mind · labs
                     What KIND of reading it is. Identity, never a verdict.

   A `planned` component is not "watch". The badge in this file is therefore
   deliberately NEUTRAL, and it is drawn with borders, weight and a word rather
   than with a clinical hue. Tinting release phase with the clinical ramp would
   teach a reader that the two vocabularies are one, which is the single most
   damaging thing this site could do to somebody who then ships a product with
   it.

   AND `shipped` IS NOT A REVIEW. It says the source installs. No component in
   this catalogue has had an accessibility review or a clinical review, which
   is why `STATUS_META.shipped.summary` says so and why that sentence is the
   chip's title and its aria-label. The chip is the smallest carrier of that
   fact and it is on every component page, so do not trade the sentence for a
   shorter one that fits a tooltip better.

   SERVER-ONLY BY DESIGN. Everything here reads registry/catalogue.ts through
   lib/catalogue.ts, which is a real, populated array: every row resolves to a
   file under registry/bases/base/. The matrix and the card index read
   each row's phase from the row rather than from a sentence somebody maintained.
   Do not add "use client" to this file, and do
   not import it from a client component: it would drag the whole catalogue into
   a browser bundle for the sake of a badge.
   ========================================================================== */

/* --------------------------------------------------------------------------
   <StatusBadge>
   -------------------------------------------------------------------------- */

export interface StatusBadgeProps {
  status: Status
  /** Suppress the link to Release phases. Use inside a table row. */
  plain?: boolean
  className?: string
}

/**
 * Three phases, three shapes, no hue. A dashed border for `planned`, because
 * the outline of a thing that is not there is the right picture; a solid
 * neutral fill for `shipped`; a strike-through for `deprecated`. A reader
 * printing this site in greyscale can still tell them apart, which is the same
 * rule the product's own status pills follow.
 */
const PHASE_CLASS: Record<Status, string> = {
  planned:
    "border-dashed border-foreground/30 bg-transparent text-muted-foreground",
  shipped: "border-foreground/20 bg-muted text-muted-foreground dark:bg-muted/50",
  deprecated:
    "border-foreground/30 bg-foreground/[0.04] text-muted-foreground line-through decoration-1",
}

/**
 * The release phase of a page or a catalogue row. Always a word, never a bare
 * colour: the docs chrome inherits the same colour-independence rule the
 * product does, because a reviewer printing this site in greyscale still has to
 * be able to tell `shipped` from `planned`.
 */
export function StatusBadge({
  status: requested,
  plain,
  className,
}: StatusBadgeProps) {
  /**
   * MDX props are not typechecked. An unrecognised release phase must not take
   * the prerender down; it renders as `planned` and logs. That default is the
   * conservative one, claiming less than the truth for anything already built,
   * and exactly the truth for anything not. assert-ia is the real gate.
   */
  const status: Status = isStatus(requested) ? requested : "planned"
  if (!isStatus(requested) && typeof window === "undefined") {
    console.warn(
      `[opsinjs:vocabulary] StatusBadge status="${String(requested)}" is not a release phase. Use one of ${STATUSES.join(", ")}.`
    )
  }
  const meta = STATUS_META[status]
  const body = (
    <span
      data-release-phase={status}
      title={meta.summary}
      className={cn(
        "inline-flex items-center gap-1 border px-1.5 py-px align-middle text-[0.6875rem] leading-5 font-medium tracking-wide uppercase",
        PHASE_CLASS[status],
        className
      )}
    >
      {meta.label}
    </span>
  )

  if (plain) return body

  return (
    <Link
      href={routes.releasePhases()}
      className="no-underline"
      aria-label={`Release phase: ${meta.label}. ${meta.summary}`}
    >
      {body}
    </Link>
  )
}

/* --------------------------------------------------------------------------
   <StatusLegend> in the sidebar footer
   -------------------------------------------------------------------------- */

/**
 * Rendered in the docs sidebar footer. A reader meets status chips before they
 * meet the page that explains them, so the legend is permanently on screen.
 *
 * The first line COUNTS the catalogue rather than restating it. What was here
 * before said "nothing is built yet" on all 400 pages, and went on saying it
 * through the run that built twenty-four components. It said so beside their
 * own phase chips and their own working install commands. A sentence about how
 * much exists, maintained by hand, in chrome that renders everywhere, is a
 * falsehood with a delay fuse. Do not put a number in this JSX.
 *
 * The chip list is `STATUS_ORDER` rather than a hand-typed array for the same
 * reason. It used to name four of the six phases, so the legend explaining the
 * vocabulary silently left two of it out. Reading the vocabulary is what makes
 * that impossible.
 */
export function StatusLegend({ className }: { className?: string }) {
  const rows = getCatalogue()
  /* Everything that is not `planned` has code. `deprecated` still installs,
     which is the whole reason it is a separate phase from the empty one, so
     testing for the one phase that means "no code" is the form that cannot
     forget a phase. */
  const built = rows.filter((row) => row.status !== "planned").length

  return (
    <div
      data-opsinjs-chrome=""
      data-print="hide"
      className={cn("flex flex-col gap-2 text-xs", className)}
    >
      <p className="m-0 leading-snug text-muted-foreground">
        {built} of the {rows.length} catalogued components are built and
        installable. The rest are specifications: a page marked planned has no
        code behind it.
      </p>
      <ul className="m-0 flex list-none flex-wrap gap-1 p-0">
        {STATUS_ORDER.map((phase) => (
          <li key={phase} className="m-0">
            <StatusBadge status={phase} plain />
          </li>
        ))}
      </ul>
      <Link
        href={routes.releasePhases()}
        className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        What these mean
      </Link>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <SectionProgress>
   -------------------------------------------------------------------------- */

export interface SectionProgressProps {
  /** Restrict the count to one catalogue category prefix, e.g. `health-`. */
  category?: string
  /** Override the counts entirely, for a section the catalogue does not model. */
  counts?: Partial<Record<Status, number>>
  className?: string
}

/**
 * "60 shipped" on a section index. Honesty as a feature: a
 * reader arriving at Components should learn in one line how much of it is
 * real, without opening a page to find out.
 *
 * The counts come from the catalogue, not from a number somebody typed, so this
 * line cannot become quietly wrong the way a hand-maintained "we have this many
 * components" sentence always does.
 */
export function SectionProgress({
  category,
  counts,
  className,
}: SectionProgressProps) {
  const entries = category
    ? getCatalogue().filter((entry) => entry.category.startsWith(category))
    : getCatalogue()

  const resolved: { status: Status; count: number }[] = counts
    ? STATUS_ORDER.map((status) => ({ status, count: counts[status] ?? 0 }))
    : statusCounts(entries)

  const shown = resolved.filter((row) => row.count > 0)

  if (shown.length === 0) {
    return (
      <p
        data-opsinjs-no-data="catalogue"
        className={cn("m-0 text-sm text-muted-foreground", className)}
      >
        No entries in this section yet.
      </p>
    )
  }

  return (
    <p
      className={cn("m-0 text-sm text-muted-foreground", className)}
      data-opsinjs-section-progress=""
    >
      {shown.map((row, index) => (
        <span key={row.status}>
          {index > 0 ? " · " : null}
          <strong className="font-medium text-foreground">
            {row.count}
          </strong>{" "}
          {STATUS_META[row.status].label.toLowerCase()}
        </span>
      ))}
    </p>
  )
}

/* --------------------------------------------------------------------------
   <StatusMatrix> is the Components overview
   -------------------------------------------------------------------------- */

export interface StatusMatrixProps {
  /** Override the rows. Omit it and the whole catalogue is used. */
  rows?: CatalogueEntry[]
  /** Restrict to one category prefix. */
  category?: string
  caption?: ReactNode
  className?: string
}

/**
 * Every catalogue row in one table: id, what it is, category, release phase,
 * last accessibility review, search synonyms.
 *
 * Filtering is done in CSS, not JavaScript. The facet controls are real radio
 * inputs and non-matching rows are hidden with `:has()`, which means the matrix
 * works with JavaScript disabled, prints complete (the print block re-shows
 * every row), and adds nothing to the bundle. Free-text search is deliberately
 * NOT reimplemented here: the site search already indexes every row's aliases,
 * and a second, worse search box beside it would send people to the wrong one.
 *
 * It is the one place a reader or an agent can see the whole namespace at once,
 * which is what stops either of them guessing at a name opsinjs does not have.
 */
export function StatusMatrix({
  rows,
  category,
  caption,
  className,
}: StatusMatrixProps) {
  const all = rows ?? getCatalogue()
  const entries = category
    ? all.filter((entry) => entry.category.startsWith(category))
    : all

  if (entries.length === 0) {
    return (
      <div
        data-opsinjs-no-data="catalogue"
        className={cn(
          "border border-dashed border-border p-4 text-sm text-muted-foreground",
          className
        )}
      >
        <p className="m-0">
          No catalogue rows match. The roster is declared in{" "}
          <code className="text-xs">registry/catalogue.ts</code>.
        </p>
      </div>
    )
  }

  const categories = Array.from(
    new Set(entries.map((row) => row.category))
  ).sort()
  const phases = STATUS_ORDER.filter((phase) =>
    entries.some((row) => row.status === phase)
  )

  return (
    <div
      className={cn(
        "opsin-matrix not-prose my-6 flex flex-col gap-3",
        className
      )}
    >
      {/* The facet rules. Scoped to `.opsin-matrix` so two matrices on one page
          do not fight, and written with :has() so no state lives in React. */}
      <style>{`
.opsin-matrix input[name$="-phase"], .opsin-matrix input[name$="-category"] { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.opsin-matrix input:checked + label { background: var(--foreground); color: var(--background); border-color: var(--foreground); }
.opsin-matrix input:focus-visible + label { outline: 2px solid var(--ring); outline-offset: 2px; }
${phases
  .map(
    (phase) =>
      `.opsin-matrix:has(#opsin-phase-${phase}:checked) tbody tr:not([data-release-phase="${phase}"]) { display: none; }`
  )
  .join("\n")}
${categories
  .map(
    (id) =>
      `.opsin-matrix:has(#opsin-cat-${id}:checked) tbody tr:not([data-category="${id}"]) { display: none; }`
  )
  .join("\n")}
@media print { .opsin-matrix tbody tr { display: table-row !important; } .opsin-matrix fieldset { display: none; } }
`}</style>

      {/* SAFETY CARRIER 5, and the one carrier that belongs in chrome. It is a
          statement about the catalogue rather than about any one page, so it
          has no authored home: the overview page renders the matrix and owns
          no per-row prose to hang it on. It is unconditional on purpose. Tying
          it to a phase count would silence it the day the roster changed
          shape, which is the failure the five other carriers were written to
          prevent. The per-page version of this sentence lives in authored MDX
          inside <StubNotice> and is held by SAFE001; this one is not gated,
          because a React string is a string a reviewer reads in the diff. */}
      <p
        data-opsinjs-unreviewed=""
        className="m-0 text-sm text-muted-foreground"
      >
        No component in this catalogue has had an accessibility review and no
        component has had a clinical review. The phase word says how installable
        the source is and says nothing about either review. Nothing here is for
        a production health surface.
      </p>

      <fieldset className="m-0 flex flex-wrap items-baseline gap-1 border-0 p-0">
        <legend className="sr-only">Filter by release phase</legend>
        <span className="mr-1 text-xs text-muted-foreground">Phase</span>
        <input
          type="radio"
          name="opsin-matrix-phase"
          id="opsin-phase-all"
          defaultChecked
        />
        <label
          htmlFor="opsin-phase-all"
          className="cursor-pointer border border-border px-2 py-0.5 text-xs"
        >
          All {entries.length}
        </label>
        {phases.map((phase) => (
          <span key={phase} className="contents">
            <input
              type="radio"
              name="opsin-matrix-phase"
              id={`opsin-phase-${phase}`}
            />
            <label
              htmlFor={`opsin-phase-${phase}`}
              title={STATUS_META[phase].summary}
              className="cursor-pointer border border-border px-2 py-0.5 text-xs"
            >
              {STATUS_META[phase].label}
            </label>
          </span>
        ))}
      </fieldset>

      <fieldset className="m-0 flex flex-wrap items-baseline gap-1 border-0 p-0">
        <legend className="sr-only">Filter by category</legend>
        <span className="mr-1 text-xs text-muted-foreground">Category</span>
        <input
          type="radio"
          name="opsin-matrix-category"
          id="opsin-cat-all"
          defaultChecked
        />
        <label
          htmlFor="opsin-cat-all"
          className="cursor-pointer border border-border px-2 py-0.5 text-xs"
        >
          All
        </label>
        {categories.map((id) => (
          <span key={id} className="contents">
            <input
              type="radio"
              name="opsin-matrix-category"
              id={`opsin-cat-${id}`}
            />
            <label
              htmlFor={`opsin-cat-${id}`}
              className="cursor-pointer border border-border px-2 py-0.5 text-xs"
            >
              {CATALOGUE_CATEGORY_LABELS[id]}
            </label>
          </span>
        ))}
      </fieldset>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {caption ? (
            <caption className="pb-2 text-left text-xs text-muted-foreground">
              {caption}
            </caption>
          ) : null}
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="py-2 pr-3 font-medium">
                Component
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                What a reader sees
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                Category
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                Phase
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                A11y reviewed
              </th>
              <th scope="col" className="py-2 font-medium">
                Also known as
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((row) => (
              <tr
                key={row.name}
                data-release-phase={row.status}
                data-category={row.category}
                className="border-b border-border/60 align-top"
              >
                <th scope="row" className="py-2 pr-3 text-left font-medium">
                  {hasComponentPage(row.name) ? (
                    <Link href={componentPath(row.name)}>{row.title}</Link>
                  ) : (
                    <span className="text-muted-foreground">{row.title}</span>
                  )}
                  <span className="block font-mono text-[0.6875rem] font-normal text-muted-foreground">
                    {row.name}
                  </span>
                </th>
                <td className="py-2 pr-3 text-muted-foreground">
                  {row.description}
                </td>
                <td className="py-2 pr-3 whitespace-nowrap">
                  {CATALOGUE_CATEGORY_LABELS[row.category]}
                </td>
                <td className="py-2 pr-3">
                  <StatusBadge status={row.status} plain />
                </td>
                <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                  {row.a11yDate ?? "Not yet"}
                </td>
                <td className="py-2 text-xs text-muted-foreground">
                  {row.aliases.length ? row.aliases.join(", ") : "none"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <ComponentsList>
   -------------------------------------------------------------------------- */

export interface ComponentsListProps {
  /** Restrict to one category prefix, e.g. `health-` or `health-input`. */
  category?: string
  className?: string
}

/**
 * The card index used on section pages. Each card's subtitle is the component's
 * plain-language definition, because that sentence is what a reader who does
 * not yet know the name is actually choosing between.
 */
export function ComponentsList({
  category,
  className,
}: ComponentsListProps) {
  const entries = getCatalogue().filter(
    (entry) => !category || entry.category.startsWith(category)
  )

  if (entries.length === 0) {
    return (
      <p
        data-opsinjs-no-data="catalogue"
        className={cn("text-sm text-muted-foreground", className)}
      >
        Nothing in this group yet. The roster is declared in{" "}
        <code className="text-xs">registry/catalogue.ts</code>.
      </p>
    )
  }

  return (
    <ul
      className={cn(
        "not-prose m-0 grid list-none gap-3 p-0 sm:grid-cols-2",
        className
      )}
    >
      {entries.map((entry) => (
        <li key={entry.name} className="m-0">
          <Link
            href={
              hasComponentPage(entry.name)
                ? componentPath(entry.name)
                : docsPath("components")
            }
            className="flex h-full flex-col gap-1 border border-border p-3 no-underline hover:bg-muted/50"
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-medium text-foreground">{entry.title}</span>
              <StatusBadge status={entry.status} plain />
            </span>
            <span className="text-sm text-muted-foreground">
              {entry.description}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
