/**
 * lib/opsinjs.ts — the shared substrate every opsinjs component imports.
 *
 * WHY THIS FILE EXISTS
 * A component under `registry/bases/<base>/` is distributed by `shadcn add`,
 * which copies source files into somebody else's project. Anything a component
 * imports has to travel with it or the copy will not compile, and a component
 * that compiles here and breaks there is worse than no component at all. So the
 * import surface of a registry file is exactly two modules: `@/lib/utils` for
 * `cn`, which `shadcn init` writes into every consumer, and this one, which
 * `scripts/build-registry.mts` appends to every component's `files[]` as a
 * `registry:lib` entry carrying real `content`. There is no third. Not
 * `@/components/*`, not `@/registry/*`, not `@/app/*`, not `@/tokens/*` — those
 * paths exist in this repository and nowhere else.
 *
 * `type: "registry:lib"` resolves through the consumer's `components.json`
 * `aliases.lib`, and shadcn 4.20 rewrites a `@/lib/...` import specifier to the
 * same alias, so `@/lib/opsinjs` names the same file in this repository and in a
 * project that installed from it. Nothing is rewritten by hand at either end.
 *
 * IT RE-EXPORTS AND IT NEVER RE-DECLARES. The clinical vocabulary lives in
 * `lib/status.ts`, which is the module the documentation chrome, the section
 * contracts and `assert-ia.mts` already read. A second copy of `CLINICAL_STATUSES`
 * here would be a second copy that can drift, and the two axes are the one thing
 * in this system that must never say two different things. `lib/status.ts` ships
 * beside this file for the same reason, as a second `registry:lib` entry.
 *
 * WHAT IS DECLARED HERE, AND WHY IT IS HERE RATHER THAN IN A COMPONENT
 * Only the shapes that more than one component has to agree on: a reference
 * range, a point on a trend, a sheet detent, a material rung, and the one string
 * every example is allowed to cite as its source. A shape used by exactly one
 * component belongs in that component's own file, because a type nobody else
 * consumes is not substrate, it is that component's API.
 *
 * CONSTRAINTS THIS FILE IS UNDER
 * No JSX and no non-erasable TypeScript — no `enum`, no parameter properties, no
 * `namespace` — and every relative import carries an explicit `.ts` extension,
 * because `scripts/*.mts` run under plain Node 24 with native type stripping and
 * some of them import `lib/` modules directly, with no resolver hook. The same
 * rule holds for `lib/status.ts`, `lib/catalogue.ts`, `lib/routes.ts` and
 * `registry/catalogue.ts`.
 *
 * `scripts/build-reference.mts` scans `lib/` and turns every exported type and
 * interface into a page under `content/docs/reference/api/`, taking the first
 * sentence of the doc comment directly above the declaration as the summary. The
 * comments below are therefore published documentation, not notes to the next
 * reader of the source.
 *
 * NOT YET HERE. `warnOnce()` and the `OPSIN_ERRORS` channel — the runtime that
 * reports OPSIN-0001 (both colour axes on one surface) and OPSIN-0004 (a range
 * with no source) — belong in this file and are owned by a later batch. Leave
 * room for them; do not add a second error module elsewhere when they arrive.
 */

import type { ClinicalStatus } from "./status.ts"

/* ------------------------------------------------------------------ *
 * The clinical vocabulary, re-exported from lib/status.ts             *
 *                                                                     *
 * A component imports these from `@/lib/opsinjs` and never from       *
 * `@/lib/status` directly. Both files ship, so either specifier would  *
 * resolve in a consumer — but one import surface is what makes the     *
 * substrate reviewable, and it is the specifier every specification    *
 * page's `## Usage` block prints.                                      *
 * ------------------------------------------------------------------ */

export {
  CLINICAL_STATUSES,
  CLINICAL_STATUS_META,
  HEALTH_CATEGORIES,
  HEALTH_CATEGORY_LABELS,
  isClinicalStatus,
  isHealthCategory,
  axisConflict,
} from "./status.ts"

export type {
  ClinicalStatus,
  UnknownStatus,
  ClinicalStatusOrUnknown,
  ClinicalStatusMeta,
  HealthCategory,
  AxisConflict,
} from "./status.ts"

/* ------------------------------------------------------------------ *
 * Example data                                                        *
 * ------------------------------------------------------------------ */

/**
 * The only citation an opsinjs example, demo or preview may carry.
 *
 * Every component ships a zero-prop default export that renders in the docs and
 * in a consumer's editor, and every one of those renders a measurement. A
 * plausible reference range in a demo is a reference range somebody will read as
 * theirs, so the demos cite this string instead — one literal, shared by all of
 * them, saying in the reader's own language that the numbers beside it mean
 * nothing. `ReferenceRange.source` in an example is always this and never a
 * laboratory, a guideline body, a device manufacturer or a study.
 */
export const EXAMPLE_SOURCE = "Example data — not a reference range"

/* ------------------------------------------------------------------ *
 * Shapes more than one component agrees on                            *
 * ------------------------------------------------------------------ */

/**
 * The interval a reading is being compared against, and who says so.
 *
 * Both bounds are optional because a one-sided range is a real range: some
 * measurements have a floor and no ceiling, and rendering a bound the product
 * did not supply would invent a threshold. An omitted bound renders as an open
 * end, never as zero and never as an assumed limit.
 *
 * `source` is required, and it is required because opsinjs does not own a single
 * clinical number. A range arriving with no attribution is the consuming
 * product asking this system to vouch for a threshold it has never seen, which
 * is the one thing it must not do; a component handed a range with no `source`
 * reports OPSIN-0004 rather than drawing it.
 */
export interface ReferenceRange {
  /** Lower bound, in the reading's own unit. Omitted means the range is open below. */
  low?: number
  /** Upper bound, in the reading's own unit. Omitted means the range is open above. */
  high?: number
  /** Who this interval came from. Never opsinjs, and never omitted. */
  source: string
  /**
   * When the range was published or last reviewed, ISO 8601. Omitted when the
   * product does not know — which is rendered as "we do not know", never as
   * today's date.
   */
  asOf?: string
}

/**
 * One reading in a series, for the components that draw change over time.
 *
 * `value` is `number | null` rather than `number` because a gap in a series is
 * information: a day with no reading is not a day with a reading of zero, and
 * charting it as zero invents a measurement. A `null` point is drawn as a break
 * in the line and described in words by the chart's text twin.
 *
 * `status` is optional and is an input, never a derivation. opsinjs does not
 * compare a point to a range and decide what it means, because it does not know
 * the reader; a point carries a verdict only when the consuming product attached
 * one.
 */
export interface TrendPoint {
  /** When this reading was taken, ISO 8601. */
  at: string
  /** The reading, or `null` where there is no reading for this point. */
  value: number | null
  /** The verdict the product assigned to this point, if it assigned one. */
  status?: ClinicalStatus
}

/**
 * How far a sheet is open.
 *
 * Three stops rather than a continuous height, because a sheet a reader can
 * leave at an arbitrary position is a sheet that will be left half over the
 * value it is explaining. `content` is as tall as what is inside it, `half` is
 * the resting stop that keeps the screen behind it readable, and `full` is the
 * whole surface.
 */
export type Detent = "content" | "half" | "full"

/**
 * A rung of the material ladder — how a surface sits above what is behind it.
 *
 * These six names are the token names: every rung resolves a matching set of
 * `--opsin-material-<rung>-*` custom properties for blur, tint, shadow and
 * border. Where a specification page names a different set, the tokens win,
 * because the tokens are what actually renders.
 */
export type MaterialRung =
  | "canvas"
  | "card"
  | "raised"
  | "sheet"
  | "overlay"
  | "scrim"
