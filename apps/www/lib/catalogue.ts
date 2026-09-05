/**
 * The typed read model over `registry/catalogue.ts`.
 *
 * The catalogue file is data. This file is everything that asks a question of
 * it: the status matrix, the sidebar chips, `/r/index.json`, `llms.txt`, the
 * roadmap, the search-synonym index, and the "considered, not implemented"
 * answer. Nothing outside this module reads the raw arrays, so a change to the
 * catalogue's shape lands in one place.
 *
 * Relative `.ts` imports and erasable syntax only: `scripts/build-registry.mts`
 * and `scripts/assert-ia.mts` import this under plain `node`.
 */

import {
  CATALOGUE,
  CATALOGUE_CATEGORIES,
  CATALOGUE_CATEGORY_LABELS,
  CONSIDERED,
  RESERVED_ALIASES,
  SHIPPED,
} from "../registry/catalogue.ts"
import type {
  CatalogueCategory,
  CatalogueEntry,
} from "../registry/catalogue.ts"
import type { Status } from "./status.ts"
import { STATUS_ORDER } from "./status.ts"

export type { CatalogueCategory, CatalogueEntry }
export { CATALOGUE_CATEGORIES, CATALOGUE_CATEGORY_LABELS }

/** Every row, shipped then considered. */
export function getCatalogue(): CatalogueEntry[] {
  return CATALOGUE
}

/**
 * The 24 rows on the roster: the ids opsinjs has committed to, each with a
 * hand-written page. Not a claim about code — read `implemented` in
 * `/r/index.json`, or `toIndexRow`'s `isBuilt` argument, for that.
 */
export function getShipped(): CatalogueEntry[] {
  return SHIPPED
}

/** The rows that were considered and deliberately left off the roster. */
export function getConsidered(): CatalogueEntry[] {
  return CONSIDERED
}

export function getEntry(id: string): CatalogueEntry | undefined {
  return CATALOGUE.find((entry) => entry.name === id)
}

/**
 * True when `/docs/components/<id>` resolves to a page.
 *
 * EVERY catalogue id does, considered ones included. This used to exclude
 * `considered`, on the assumption that a row decided against had no address —
 * which was true before ADR 0008 and has not been true since: `pnpm generate`
 * writes a stub for each of the 36, precisely "so that this address answers
 * instead of returning a 404". The stale answer was visible, because
 * `<StatusMatrix>` and `<ComponentsList>` ask this question to decide whether to
 * link a row: all 36 rendered as inert grey text, or linked to the index, while
 * the page that says why the name was declined sat one click away and unreachable
 * from the table that named it.
 *
 * It is therefore the same predicate as `isKnownId` today, and deliberately kept
 * separate: they answer different questions and will diverge the moment an id
 * exists without a page, or a page exists without a row.
 */
export function hasComponentPage(id: string): boolean {
  return isKnownId(id)
}

/**
 * Does this id exist at all, under any status?
 *
 * The question `/r` and the agent surfaces actually need. An id that is in the
 * catalogue and has no page still deserves an answer; an id that is in neither
 * is a genuine 404 and should be one.
 */
export function isKnownId(id: string): boolean {
  return CATALOGUE.some((entry) => entry.name === id)
}

export function getByCategory(category: CatalogueCategory): CatalogueEntry[] {
  return CATALOGUE.filter((entry) => entry.category === category)
}

/** Every category that has at least one row, in the declared order, with its rows. */
export function groupedByCategory(entries: CatalogueEntry[] = CATALOGUE): {
  category: CatalogueCategory
  label: string
  entries: CatalogueEntry[]
}[] {
  return CATALOGUE_CATEGORIES.map((category) => ({
    category,
    label: CATALOGUE_CATEGORY_LABELS[category],
    entries: entries.filter((entry) => entry.category === category),
  })).filter((group) => group.entries.length > 0)
}

/** True for the four `health-*` categories, which carry the extra clinical obligations. */
export function isHealthCategory(category: string): boolean {
  return category.startsWith("health-")
}

/* ── status ─────────────────────────────────────────────────────────────── */

export function getByStatus(status: Status): CatalogueEntry[] {
  return CATALOGUE.filter((entry) => entry.status === status)
}

/** Counts per status, in display order. The input to `<SectionProgress>`. */
export function statusCounts(
  entries: CatalogueEntry[] = CATALOGUE
): { status: Status; count: number }[] {
  return STATUS_ORDER.map((status) => ({
    status,
    count: entries.filter((entry) => entry.status === status).length,
  })).filter((row) => row.count > 0)
}

/**
 * "4 stable · 2 beta · 61 planned", the honest one-line summary every section
 * index carries. Written with the counts rather than a percentage on purpose: a
 * percentage invites rounding, and rounding is how a system ends up claiming to
 * be 98% complete.
 */
export function progressSummary(
  entries: CatalogueEntry[] = CATALOGUE,
  labels: Record<Status, string>
): string {
  return statusCounts(entries)
    .map((row) => `${row.count} ${labels[row.status].toLowerCase()}`)
    .join(" · ")
}

/* ── aliases: the search-synonym namespace ──────────────────────────────── */

/**
 * alias → the id or page it resolves to. Lower-cased, because a reader typing
 * "Blood Pressure" and a reader typing "blood pressure" want the same page.
 */
export function aliasIndex(): Map<string, string> {
  const index = new Map<string, string>()
  for (const entry of CATALOGUE) {
    for (const alias of entry.aliases)
      index.set(alias.toLowerCase(), entry.name)
  }
  for (const [page, aliases] of Object.entries(RESERVED_ALIASES)) {
    for (const alias of aliases) index.set(alias.toLowerCase(), page)
  }
  return index
}

/** The exact array a page's `aliases` frontmatter must contain. */
export function aliasesFor(id: string): string[] {
  return getEntry(id)?.aliases ?? RESERVED_ALIASES[id] ?? []
}

export function findByAlias(alias: string): CatalogueEntry | undefined {
  const id = aliasIndex().get(alias.trim().toLowerCase())
  return id ? getEntry(id) : undefined
}

export interface AliasProblem {
  alias: string
  reason: "duplicate" | "collides-with-id"
  owners: string[]
}

/**
 * The uniqueness check, as a function rather than as a comment.
 *
 * Called by `assert-ia.mts` on every build. An alias owned by two pages
 * resolves to neither, and the reason the whole namespace lives in one file is
 * that fifteen authors writing frontmatter in parallel cannot maintain this
 * property by agreement.
 */
export function findAliasProblems(): AliasProblem[] {
  const ids = new Set(CATALOGUE.map((entry) => entry.name))
  const owners = new Map<string, string[]>()
  const record = (alias: string, owner: string) => {
    const key = alias.toLowerCase()
    owners.set(key, [...(owners.get(key) ?? []), owner])
  }

  for (const entry of CATALOGUE)
    for (const alias of entry.aliases) record(alias, entry.name)
  for (const [page, aliases] of Object.entries(RESERVED_ALIASES))
    for (const alias of aliases) record(alias, page)

  const problems: AliasProblem[] = []
  for (const [alias, holders] of owners) {
    if (holders.length > 1)
      problems.push({ alias, reason: "duplicate", owners: holders })
    if (ids.has(alias))
      problems.push({ alias, reason: "collides-with-id", owners: holders })
  }
  return problems
}

/* ── search and reverse lookups ─────────────────────────────────────────── */

/**
 * The filter behind `<StatusMatrix>`: matches an id, a name, the description or
 * any alias. Substring matching, because the reader typing "range" wants both
 * RangeBar and the reference-range guidance and has no reason to know which
 * word the system chose.
 */
export function searchCatalogue(
  query: string,
  entries: CatalogueEntry[] = CATALOGUE
): CatalogueEntry[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return entries
  return entries.filter((entry) =>
    [entry.name, entry.title, entry.description, ...entry.aliases].some(
      (field) => field.toLowerCase().includes(needle)
    )
  )
}

/* `entriesGovernedBy(doctrineId)` used to live here: the reverse index, every
   component whose catalogue `governedBy` names a doctrine page. It was exported
   and imported by nothing, because a doctrine page lists what it governs from
   its own `implements:` frontmatter instead, and has since the templates were
   written. Deleted rather than left as a plausible-looking helper somebody
   reaches for and then wonders why the two lists disagree — the catalogue's
   `governedBy` and a page's `implements` are maintained separately and nothing
   compares them. If the reverse index is ever wanted, write it back with a
   consumer and a check that the two directions agree, in one commit. */

/**
 * Validate a doctrine page's `implements` list. Every entry must be a real
 * catalogue id, shipped or considered — the check that would have caught
 * `implements: [alert-banner, care-card, toast]` before `toast` was on the
 * roster.
 */
export function unknownImplementsIds(ids: string[]): string[] {
  return ids.filter((id) => !isKnownId(id))
}

/* ── projections ────────────────────────────────────────────────────────── */

export interface CatalogueIndexRow {
  name: string
  title: string
  description: string
  type: "registry:ui"
  category: CatalogueCategory
  status: Status
  since: string
  aliases: string[]
  /**
   * True when a real source file exists under `registry/bases/<base>/` for this
   * id. Answered by the caller — see `toIndexRow` — because the only honest
   * answer is a directory listing, and this module cannot see one.
   */
  implemented: boolean
  docs: string | null
  /** npm packages a consumer's `shadcn add` installs alongside this component. */
  dependencies?: string[]
  /** Other opsinjs components this one composes, by bare catalogue id. */
  registryDependencies?: string[]
  useInstead?: string[]
  why?: string
}

/**
 * One row of `/r/index.json` and of the generated catalogue reference page.
 *
 * `implemented` used to be a hardcoded `false` typed as the literal, with a
 * comment promising the projection would fail to compile the day something
 * shipped. It would not have: a constant is not derived from anything, so
 * shipping a component changed no input and `tsc` stayed green. Something has
 * now shipped, and the field is a real `boolean` supplied by a caller that can
 * see the built set.
 *
 * `isBuilt` is a REQUIRED parameter and deliberately has no default. Two
 * defaults were considered and both rejected. Defaulting to `false` reinstates
 * exactly the lie this change removes. Defaulting to a read of `REGISTRY_INDEX`
 * from `../registry/__index__.ts` looks better and is worse: this projection's
 * one caller is `scripts/build-registry.mts`, which is the program that *writes*
 * that index, so during a generate run it would read the previous run's output —
 * `lib/generated/catalogue.json` would lag a run behind `registry/__index__.ts`,
 * two successive generates would differ, and `pnpm check:generated` would fail on
 * a file nobody edited. A required parameter makes every call site answer the
 * question from something it can actually see; the generator answers it from the
 * `findBuilt()` walk it has already done.
 */
export function toIndexRow(
  entry: CatalogueEntry,
  docsUrl: (id: string) => string,
  isBuilt: (id: string) => boolean
): CatalogueIndexRow {
  return {
    name: entry.name,
    title: entry.title,
    description: entry.description,
    type: "registry:ui",
    category: entry.category,
    status: entry.status,
    since: entry.since,
    aliases: entry.aliases,
    implemented: isBuilt(entry.name),
    docs: entry.status === "considered" ? null : docsUrl(entry.name),
    dependencies: entry.dependencies,
    registryDependencies: entry.registryDependencies,
    useInstead: entry.useInstead,
    why: entry.why,
  }
}
