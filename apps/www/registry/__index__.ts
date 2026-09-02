/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source:    registry/catalogue.ts + registry/{bases,examples,screens}/**
 * Generator: scripts/build-registry.mts   (`pnpm run generate`)
 * Gate:      `pnpm check:generated` regenerates this file and fails on a diff.
 *
 * This is the committed placeholder, and it is deliberately EMPTY of entries
 * rather than full of stubs. `getRegistryEntry()` returning null is what makes
 * `<ComponentPreview>` render `<NotBuiltYet>`; a placeholder entry with a null
 * component would make the same call return an object and every preview would
 * have to re-check the same emptiness one level deeper.
 *
 * SHAPE CONTRACT for scripts/build-registry.mts — the generator must emit
 * exactly these five exports, because `lib/registry.ts` is typed against them:
 *
 *   REGISTRY_BASES     string[]                        behaviour variants
 *   REGISTRY_STYLES    string[]                        CSS-only variants
 *   REGISTRY_INDEX     Record<string, RegistryEntry>   keyed `base/style/kind/name`
 *   REGISTRY_META      { generatedAt, sourceHash, count }
 *   RegistryEntry, RegistryKind                        the types below
 *
 * `component` is a dynamic import rather than a value so that the preview
 * surface can code-split per component and so that this file stays free of
 * top-level imports of things that do not exist yet.
 */

import type { ComponentType } from "react"

/** What a registry entry renders. Mirrors the `kind` segment of a `/view` URL. */
export type RegistryKind = "component" | "example" | "screen"

/** One file a registry item distributes. The shape `/r/<name>.json` serves. */
export interface RegistrySourceFile {
  path: string
  type: string
  target?: string
}

export interface RegistryEntry {
  /** The catalogue id, or an example name such as `range-bar-status`. */
  name: string
  /** Behaviour variant. `base` is the only one; the folder proves the axis exists. */
  base: string
  /** CSS-only variant. `base-lyra` is the default. */
  style: string
  kind: RegistryKind
  /**
   * Lazily loaded renderable. `null` while nothing is built, which is the
   * current and only state.
   */
  component: (() => Promise<{ default: ComponentType<Record<string, unknown>> }>) | null
  /** The real source text, for `<ComponentSource>`. `null` while nothing is built. */
  source: string | null
  /** The registry-item.json payload served at `/r/<name>.json`. `null` while nothing is built. */
  meta: Record<string, unknown> | null
  /**
   * The files this item distributes. Empty while nothing is built; the machine
   * routes read it directly to build a registry-item response.
   */
  files?: RegistrySourceFile[]
}

/** Behaviour variants. A second base is a folder under `registry/bases/`, never a URL migration. */
export const REGISTRY_BASES: string[] = ["base"]

/** Style variants. Style is a stylesheet and nothing else; see decision 6. */
export const REGISTRY_STYLES: string[] = ["base-lyra"]

/** Keyed `${base}/${style}/${kind}/${name}`. Empty until something is built. */
export const REGISTRY_INDEX: Record<string, RegistryEntry> = {}

export const REGISTRY_META: { generatedAt: string | null; sourceHash: string; count: number } = {
  generatedAt: null,
  sourceHash: "placeholder",
  count: 0,
}
