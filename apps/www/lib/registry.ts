/**
 * The typed read model over the generated registry index.
 *
 * Its most important behaviour is returning `null`, and returning it in a way
 * callers cannot ignore. Most of the catalogue has no code behind it: the
 * ids that carry a base implementation resolve to a real renderable, and every
 * other lookup fails with an explanation that names the component, its
 * catalogue status and where to read about it, so `<ComponentPreview>` can
 * render an honest empty state instead of a blank frame or a thrown error. The
 * count is not hardcoded here. `REGISTRY_INDEX` and `registryMeta()` are the
 * only places that know it, so this comment cannot go stale as the number moves.
 *
 * Relative `.ts` imports and erasable syntax only: the scripts import this.
 */

import type { RegistryEntry, RegistryKind } from "../registry/__index__.ts"
import {
  REGISTRY_BASES,
  REGISTRY_INDEX,
  REGISTRY_META,
  REGISTRY_STYLES,
} from "../registry/__index__.ts"
import { getEntry, isKnownId } from "./catalogue.ts"
import type { Status } from "./status.ts"

export type { RegistryEntry, RegistryKind }

export const DEFAULT_BASE = "base"
export const DEFAULT_STYLE = "base-lyra"

export interface RegistryQuery {
  name: string
  base?: string
  style?: string
  kind?: RegistryKind
}

/**
 * Both call shapes are supported on purpose.
 *
 * `getRegistryEntry("range-bar", base, style)` is what the preview surface and
 * the machine routes call, and it reads naturally at a call site that already
 * has three variables. The object form exists for the one caller that needs to
 * pass a `kind`, and because a fourth positional argument is where a signature
 * stops being readable.
 */
export type RegistryLookup = string | RegistryQuery

function key(query: Required<RegistryQuery>): string {
  return `${query.base}/${query.style}/${query.kind}/${query.name}`
}

function canonicalise(query: RegistryQuery): Required<RegistryQuery> {
  return {
    name: query.name,
    base: query.base ?? DEFAULT_BASE,
    style: query.style ?? DEFAULT_STYLE,
    kind: query.kind ?? "component",
  }
}

/**
 * Resolve one entry, or null.
 *
 * Falls back to the default style before giving up, because a style is a
 * stylesheet: a component that exists at `base-lyra` exists at every style, and
 * a missing style variant should degrade to the default rather than to nothing.
 * It does NOT fall back across bases. A base is a different implementation,
 * and silently rendering a different one would be a lie about what was asked
 * for.
 */
export function getRegistryEntry(
  lookup: RegistryLookup,
  base?: string,
  style?: string,
  kind?: RegistryKind
): RegistryEntry | null {
  const query: RegistryQuery =
    typeof lookup === "string" ? { name: lookup, base, style, kind } : lookup
  const wanted = canonicalise(query)
  const exact = REGISTRY_INDEX[key(wanted)]
  if (exact) return exact
  if (wanted.style !== DEFAULT_STYLE) {
    const fallback = REGISTRY_INDEX[key({ ...wanted, style: DEFAULT_STYLE })]
    if (fallback) return fallback
  }
  return null
}

/** Why a lookup came back empty. The input to `<NotBuiltYet>`. */
export interface UnresolvedReason {
  name: string
  /**
   * `unknown` means the id is not in the catalogue at all. It is a real 404.
   */
  reason: "not-built" | "considered" | "unknown"
  status: Status | null
  message: string
}

/**
 * Explain an empty lookup.
 *
 * Three distinct answers, and the distinction is the point. "Planned, not
 * built" is a specification an agent may read and must not generate against.
 * "Considered" is a decision with an alternative named. "Unknown" is the only
 * one that is genuinely a mistake. Separating the three is what stops an agent
 * treating a deliberate absence as a gap it should fill.
 */
export function explainUnresolved(name: string): UnresolvedReason {
  const entry = getEntry(name)
  if (!entry) {
    return {
      name,
      reason: "unknown",
      status: null,
      message: `"${name}" is not in the opsinjs catalogue under any status. Check the spelling against the components overview.`,
    }
  }
  if (entry.status === "considered") {
    return {
      name,
      reason: "considered",
      status: entry.status,
      message:
        `${entry.name} was considered and deliberately left off the roster. ${entry.why ?? ""} Use ${(entry.useInstead ?? []).join(" or ")} instead.`.trim(),
    }
  }
  return {
    name,
    reason: "not-built",
    status: entry.status,
    message: `${entry.name} is specified but not implemented. The page for it is a specification: read it, review it, do not generate code against it.`,
  }
}

/**
 * True only when a base component for this name is on disk, which a catalogue
 * row alone is not. A `considered` id and a specified-but-unbuilt id both
 * answer false, and so does a built id asked for at a base that does not
 * carry it.
 */
export function isBuilt(
  lookup: RegistryLookup,
  base?: string,
  style?: string
): boolean {
  const entry = getRegistryEntry(lookup, base, style)
  return entry !== null && entry.component !== null
}

/** True when the id exists in the catalogue, whatever its status. Used to decide 404 from "no". */
export function isResolvable(name: string): boolean {
  return isKnownId(name)
}

export function listBases(): string[] {
  return REGISTRY_BASES
}

export function listStyles(): string[] {
  return REGISTRY_STYLES
}

/** Every entry of a kind, for the examples gallery and the screens index. */
export function listByKind(kind: RegistryKind): RegistryEntry[] {
  return Object.values(REGISTRY_INDEX).filter((entry) => entry.kind === kind)
}

/**
 * How many distinct components have a real renderable behind them.
 *
 * This is for prose that states the number. The landing page and the 404 both
 * do, and a page that names a count is a page that can be caught being wrong.
 * Deriving it means the sentence cannot outlive the fact: delete a base file
 * and the claim moves with it, in the same build.
 *
 * DISTINCT NAMES, not `registryMeta().count`. That field counts index ENTRIES,
 * which is files × bases × styles, so it would report a doubled roster the day a
 * second style directory appears. It also counts examples and screens. The
 * number a reader means by "how many components are there" is this one.
 */
export function builtComponentCount(): number {
  return new Set(listByKind("component").map((entry) => entry.name)).size
}

/**
 * Provenance for the registry surfaces: when it was generated and from what.
 * `generatedAt: null` means the placeholder is still in place and `pnpm run
 * generate` has not run. The registry pages say that out loud rather than
 * rendering an empty table.
 */
export function registryMeta(): {
  generatedAt: string | null
  sourceHash: string
  count: number
} {
  return REGISTRY_META
}
