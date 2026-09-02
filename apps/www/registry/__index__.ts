/* eslint-disable */
/**
 * GENERATED FILE - DO NOT EDIT.
 *
 * Source:    registry/catalogue.ts + registry/{bases,examples,screens}/**
 * Generator: scripts/build-registry.mts   (`pnpm run generate`)
 * Gate:      `pnpm check:generated` regenerates this file and fails on a diff.
 *
 * REGISTRY_INDEX is EMPTY of entries rather than full of stubs, and that is
 * deliberate. `getRegistryEntry()` returning null is what makes
 * <ComponentPreview> render <NotBuiltYet>; an entry whose `component` was null
 * would make the same call return an object, and every consumer would have to
 * re-check the same emptiness one level deeper. An entry appears here the
 * moment a real file exists under registry/bases/<base>/, and not before.
 *
 * `component` is a dynamic import rather than a value so the preview surface can
 * code-split per component, and so this file stays free of top-level imports of
 * things that do not exist yet.
 *
 * `REGISTRY_META.generatedAt` carries the source hash rather than a build time:
 * this file is guarded by a byte-for-byte drift gate, and a timestamp would fail
 * it on every run.
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
  generatedAt: "94e90e8387af",
  sourceHash: "94e90e8387af",
  count: 0,
}
