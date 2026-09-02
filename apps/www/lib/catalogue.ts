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

/** The 24 rows that have a specification page. */
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

/** True when this id has a hand-written page at `/docs/components/<id>`. */
export function hasComponentPage(id: string): boolean {
  const entry = getEntry(id)
  return entry !== undefined && entry.status !== "considered"
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

/** Every component whose `governedBy` names this doctrine page. The reverse of `implements`. */
export function entriesGovernedBy(doctrineId: string): CatalogueEntry[] {
  return CATALOGUE.filter((entry) => entry.governedBy?.includes(doctrineId))
}

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
  implemented: false
  docs: string | null
  useInstead?: string[]
  why?: string
}

/**
 * One row of `/r/index.json` and of the generated catalogue reference page.
 *
 * `implemented` is hardcoded `false` and typed as the literal, so that the day
 * something ships this projection fails to compile rather than continuing to
 * tell every agent that nothing is built.
 */
export function toIndexRow(
  entry: CatalogueEntry,
  docsUrl: (id: string) => string
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
    implemented: false,
    docs: entry.status === "considered" ? null : docsUrl(entry.name),
    useInstead: entry.useInstead,
    why: entry.why,
  }
}
