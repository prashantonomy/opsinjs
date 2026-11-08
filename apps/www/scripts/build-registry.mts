/**
 * build-registry.mts - registry/catalogue.ts to registry/__index__.ts and
 * lib/generated/catalogue.json.
 *
 *   node scripts/build-registry.mts            # write
 *   node scripts/build-registry.mts --check    # write nothing; fail on drift
 *
 * WRITES
 *   registry/__index__.ts          base/style/kind/name -> a renderable entry
 *   lib/generated/catalogue.json   the flattened roster, for /r/index.json,
 *                                  llms.txt and StatusMatrix
 *
 * WHAT IS BUILT IS A DIRECTORY LISTING. A component is implemented when
 * packages/react/src/components/<id>.tsx exists, and nothing else answers
 * that question: no placeholder rows and no flag in the catalogue. Its preview
 * is registry/demos/<id>.tsx, which imports the component from @opsinjs/react
 * the way a consumer does. Examples and screens come from registry/examples
 * and registry/screens. `getRegistryEntry()` returning null is what makes
 * <ComponentPreview> render <NotBuiltYet>.
 *
 * Each entry carries its file's text as `source`, which is what an example's
 * code tab shows a reader.
 *
 * DETERMINISM: no timestamps. `pnpm check:generated` regenerates and diffs.
 */

/* ------------------------------------------------------------------ *
 * Node version guard (addendum A5).                                   *
 * ------------------------------------------------------------------ */
const NODE_MAJOR = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10)
if (!Number.isFinite(NODE_MAJOR) || NODE_MAJOR < 24) {
  console.error(
    [
      "",
      "  opsinjs: scripts/build-registry.mts needs Node 24 or newer.",
      `  You are on Node ${process.versions.node}.`,
      "",
      "  These scripts are plain .mts run by node itself - no tsx, no ts-node -",
      "  which relies on native TypeScript type stripping. That is a Node 24",
      "  baseline, and it is why engines.node is >=24.0.0 in both package.json",
      "  files. Install Node 24 (nvm install 24) and run this again.",
      "",
    ].join("\n"),
  )
  process.exit(1)
}

import { createHash } from "node:crypto"
import {
  type Dirent,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs"
import * as nodeModule from "node:module"
import { dirname, join, relative } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const APP_DIR = fileURLToPath(new URL("../", import.meta.url))
const REGISTRY_DIR = join(APP_DIR, "registry")
const OUT_INDEX = join(REGISTRY_DIR, "__index__.ts")
const OUT_CATALOGUE_JSON = join(APP_DIR, "lib", "generated", "catalogue.json")
/* The @opsinjs/react component sources. Their listing is what "implemented"
   means; their text is a hash input, so a component edit regenerates. */
const COMPONENTS_DIR = join(APP_DIR, "..", "..", "packages", "react", "src", "components")
/* The @opsinjs/react entry point. Generated from the same listing, so a
   component added to the directory is exported without a second edit. */
const OUT_BARREL = join(APP_DIR, "..", "..", "packages", "react", "src", "index.ts")

function emitBarrel(componentFiles: string[]): string {
  return [
    "/* GENERATED FILE - DO NOT EDIT.",
    " *",
    " * Source:    packages/react/src/components/*.tsx",
    " * Generator: apps/www/scripts/build-registry.mts   (`pnpm run generate`)",
    " * Gate:      `pnpm check:generated` regenerates this file and fails on a diff.",
    " *",
    " * The @opsinjs/react entry point: the shared substrate, then every component.",
    " * Each component is also importable on its own as @opsinjs/react/<id>.",
    " */",
    "",
    'export * from "./opsinjs.ts"',
    'export { cn } from "./utils.ts"',
    "",
    ...componentFiles.map((file) => `export * from "./components/${file}"`),
    "",
  ].join("\n")
}

/**
 * Decision 6: the docs URL never carries a base or a style segment, but the
 * registry and the /view routes carry both as real path segments, because those
 * are the machine surfaces where the combination has to be addressable.
 */
const DEFAULT_BASE = "base"
const DEFAULT_STYLE = "base-lyra"
const KINDS = ["component", "example", "screen"]

/* ------------------------------------------------------------------ *
 * Helpers                                                             *
 * ------------------------------------------------------------------ */

function exists(file: string): boolean {
  try {
    statSync(file)
    return true
  } catch {
    return false
  }
}

function isDirectory(file: string): boolean {
  try {
    return statSync(file).isDirectory()
  } catch {
    return false
  }
}

function writeIfChanged(file: string, contents: string): boolean {
  mkdirSync(dirname(file), { recursive: true })
  let current: string | undefined
  try {
    current = readFileSync(file, "utf8")
  } catch {
    current = undefined
  }
  if (current === contents) return false
  writeFileSync(file, contents, "utf8")
  return true
}

function q(value: string): string {
  return JSON.stringify(value)
}

function listDirs(dir: string): string[] {
  if (!isDirectory(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry: Dirent) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry: Dirent) => entry.name)
    .sort()
}

function listFiles(dir: string): string[] {
  if (!isDirectory(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry: Dirent) => entry.isFile() && !entry.name.startsWith("."))
    .map((entry: Dirent) => entry.name)
    .sort()
}

/* ------------------------------------------------------------------ *
 * Importing the app's own TypeScript from a plain node script.        *
 *                                                                     *
 * registry/catalogue.ts, lib/catalogue.ts and lib/routes.ts are the    *
 * source of truth for the roster, its projection and its URLs, and     *
 * this script reads all three rather than reimplementing any of them.  *
 * They are written for Next, so a resolve hook covers the two things   *
 * node will not do on its own: the "@/*" path alias, and extensionless *
 * relative specifiers.                                                 *
 * ------------------------------------------------------------------ */

function installResolveHook(): void {
  const registerHooks = (nodeModule as unknown as { registerHooks?: unknown }).registerHooks
  if (typeof registerHooks !== "function") return

  const tryFiles = (base: string): string | undefined => {
    for (const candidate of [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.mts`,
      `${base}.js`,
      join(base, "index.ts"),
      join(base, "index.tsx"),
    ]) {
      if (exists(candidate) && !isDirectory(candidate)) return candidate
    }
    return undefined
  }

  const hook = registerHooks as (options: Record<string, unknown>) => void
  hook({
    resolve(
      specifier: string,
      context: { parentURL?: string },
      nextResolve: (s: string, c: unknown) => unknown,
    ) {
      if (specifier.startsWith("@/")) {
        const resolved = tryFiles(join(APP_DIR, specifier.slice(2)))
        if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true }
      }
      if (specifier.startsWith(".") && context.parentURL) {
        try {
          return nextResolve(specifier, context)
        } catch {
          const parentDir = dirname(fileURLToPath(context.parentURL))
          const resolved = tryFiles(join(parentDir, specifier))
          if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true }
          throw new Error(`cannot resolve ${specifier} from ${context.parentURL}`)
        }
      }
      return nextResolve(specifier, context)
    },
  })
}

async function importModule(relativePath: string): Promise<Record<string, unknown> | undefined> {
  const file = join(APP_DIR, relativePath)
  if (!exists(file)) return undefined
  try {
    return (await import(pathToFileURL(file).href)) as Record<string, unknown>
  } catch (error) {
    console.warn(
      `build-registry: ${relativePath} could not be imported by node - ${(error as Error).message}`,
    )
    return undefined
  }
}

/* ------------------------------------------------------------------ *
 * Types                                                               *
 * ------------------------------------------------------------------ */

/** The subset of registry/catalogue.ts's CatalogueEntry this script needs. */
interface CatalogueRow {
  name: string
  title?: string
  description?: string
  category?: string
  status?: string
  since?: string
  aliases?: string[]
  owner?: string
  governedBy?: string[]
  usedIn?: string[]
  [key: string]: unknown
}

interface BuiltItem {
  name: string
  base: string
  style: string
  kind: string
  /** Import specifier, relative to registry/. */
  specifier: string
  /** The real filename, extension included. */
  file: string
  source: string
}

/* ------------------------------------------------------------------ *
 * Loading                                                             *
 * ------------------------------------------------------------------ */

async function loadCatalogue(): Promise<{ rows: CatalogueRow[]; note?: string }> {
  const mod = await importModule(join("registry", "catalogue.ts"))
  if (!mod) {
    return {
      rows: [],
      note:
        "registry/catalogue.ts is missing or is not loadable by plain node, so the\n" +
        "    registry was generated empty. The catalogue must stay free of JSX and give\n" +
        "    every relative import an explicit .ts extension.",
    }
  }
  for (const key of ["CATALOGUE", "catalogue", "components", "entries", "items", "default"]) {
    const value = mod[key]
    if (Array.isArray(value) && value.length > 0) return { rows: value as CatalogueRow[] }
  }
  return {
    rows: [],
    note:
      "registry/catalogue.ts exports nothing this script recognises. Export the roster\n" +
      "    as `export const CATALOGUE: CatalogueEntry[]`.",
  }
}

/**
 * Everything under registry/demos/, registry/examples/ and registry/screens/
 * that looks like a component. A demo is indexed as kind `component`, under
 * the id of the component it shows.
 */
function findBuilt(styles: string[]): BuiltItem[] {
  const built: BuiltItem[] = []
  const collect = (dir: string, kind: string) => {
    for (const file of listFiles(dir)) {
      if (!file.endsWith(".tsx") && !file.endsWith(".ts")) continue
      if (file.startsWith("index.")) continue
      const name = file.replace(/\.(tsx|ts)$/, "")
      const source = readFileSync(join(dir, file), "utf8")
      const specifier = `./${relative(REGISTRY_DIR, join(dir, name)).split("\\").join("/")}`
      for (const style of styles) {
        built.push({ name, base: DEFAULT_BASE, style, kind, specifier, file, source })
      }
    }
  }

  collect(join(REGISTRY_DIR, "demos"), "component")
  collect(join(REGISTRY_DIR, "examples"), "example")
  collect(join(REGISTRY_DIR, "screens"), "screen")
  return built
}

/**
 * A stable, unique, readable identifier for a hoisted string constant.
 *
 * The emitted file names each file's text once and refers to it by identifier,
 * so a component's source appears in registry/__index__.ts exactly once even
 * though `source` and its `files[0].content` are both that text. Two distinct
 * paths can reduce to the same identifier ("a-b/c" and "a/b-c" both give
 * A_B_C), which would silently make one entry serve the other's bytes, so a
 * collision gets a numeric suffix rather than a coin flip.
 */
function uniqueIdentifier(prefix: string, key: string, taken: Set<string>): string {
  const stem = key
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase()
  const base = `${prefix}_${stem === "" ? "FILE" : stem}`
  let candidate = base
  let suffix = 2
  while (taken.has(candidate)) {
    candidate = `${base}_${suffix}`
    suffix += 1
  }
  taken.add(candidate)
  return candidate
}

/* ------------------------------------------------------------------ *
 * Emitters                                                            *
 * ------------------------------------------------------------------ */

function emitIndex(
  built: BuiltItem[],
  bases: string[],
  styles: string[],
  hash: string,
): string {
  /* Each distinct file text is named once and referred to by identifier, so a
     file shared by several styles is inlined once. */
  const taken = new Set<string>()

  const sourceIdentifiers = new Map<string, string>()
  const sourceConstants: string[] = []
  for (const item of built) {
    /* Keyed by specifier, not by index: findBuilt emits one item per style and
       every style imports the identical module, so two entries share one text. */
    if (sourceIdentifiers.has(item.specifier)) continue
    const identifier = uniqueIdentifier("SOURCE", item.specifier.slice(2), taken)
    sourceIdentifiers.set(item.specifier, identifier)
    sourceConstants.push(`const ${identifier} = ${q(item.source)}`)
  }

  for (const item of built) {
    const identifier = sourceIdentifiers.get(item.specifier)
    if (identifier && (item.source ?? "").length > 0) continue
    console.error(
      `build-registry: ${item.kind} "${item.name}" is empty (registry/${item.specifier.slice(2)}).`,
    )
    process.exit(1)
  }

  const entries = built
    .map((item) => {
      const key = `${item.base}/${item.style}/${item.kind}/${item.name}`
      const identifier = sourceIdentifiers.get(item.specifier) ?? "\"\""
      return [
        `  ${q(key)}: {`,
        `    name: ${q(item.name)},`,
        `    base: ${q(item.base)},`,
        `    style: ${q(item.style)},`,
        `    kind: ${q(item.kind)},`,
        `    component: () => import(${q(item.specifier)}),`,
        `    source: ${identifier},`,
        `    meta: null,`,
        `  },`,
      ].join("\n")
    })
    .join("\n")

  const fileTexts = sourceConstants.join("\n\n")

  return `/* eslint-disable */
/**
 * GENERATED FILE - DO NOT EDIT.
 *
 * Source:    registry/catalogue.ts + registry/{demos,examples,screens}/**
 * Generator: scripts/build-registry.mts   (\`pnpm run generate\`)
 * Gate:      \`pnpm check:generated\` regenerates this file and fails on a diff.
 *
 * REGISTRY_INDEX has an entry for a component and no stub for anything else.
 * \`getRegistryEntry()\` returning null is what makes <ComponentPreview> render
 * <NotBuiltYet>. A component's entry renders registry/demos/<id>.tsx, which
 * imports the component from @opsinjs/react.
 *
 * \`component\` is a dynamic import rather than a value so the preview surface can
 * code-split per component.
 *
 * \`REGISTRY_META.generatedAt\` carries the source hash rather than a build time:
 * this file is guarded by a byte-for-byte drift gate, and a timestamp would fail
 * it on every run.
 */

import type { ComponentType } from "react"

/** What a registry entry renders. Mirrors the \`kind\` segment of a \`/view\` URL. */
export type RegistryKind = "component" | "example" | "screen"

export interface RegistryEntry {
  /** The catalogue id, or an example name such as \`range-bar-status\`. */
  name: string
  /** Behaviour variant. \`base\` is the only one; the folder proves the axis exists. */
  base: string
  /** CSS-only variant. \`base-lyra\` is the default. */
  style: string
  kind: RegistryKind
  /**
   * Lazily loaded renderable. The type is \`| null\` because the field is part of
   * the shape a consumer checks, not because a generated entry ever carries one:
   * an entry exists only where a file does.
   */
  component: (() => Promise<{ default: ComponentType<Record<string, unknown>> }>) | null
  /** The file's own text, which an example's code tab shows. */
  source: string | null
  /** Reserved for per-entry metadata. Always \`null\` today. */
  meta: Record<string, unknown> | null
}

/** Behaviour variants. \`base\` is the only one. */
export const REGISTRY_BASES: string[] = [${bases.map(q).join(", ")}]

/** Style variants. Style is a stylesheet and nothing else; see decision 6. */
export const REGISTRY_STYLES: string[] = [${styles.map(q).join(", ")}]

${fileTexts}

/** Keyed \`\${base}/\${style}/\${kind}/\${name}\`. Empty until something is built. */
export const REGISTRY_INDEX: Record<string, RegistryEntry> = ${entries === "" ? "{}" : `{\n${entries}\n}`}

export const REGISTRY_META: { generatedAt: string | null; sourceHash: string; count: number } = {
  generatedAt: ${q(hash)},
  sourceHash: ${q(hash)},
  count: ${built.length},
}
`
}

interface IndexRow {
  name: string
  title: string
  description: string
  type: string
  category: string
  status: string
  since: string
  aliases: string[]
  implemented: boolean
  docs: string | null
  dependencies?: string[]
  registryDependencies?: string[]
}

function emitCatalogueJson(
  rows: IndexRow[],
  categories: Array<{ id: string; label: string; count: number }>,
  aliases: Record<string, string>,
  builtNames: Set<string>,
  hash: string,
): string {
  return `${JSON.stringify(
    {
      $comment:
        "GENERATED FILE - DO NOT EDIT. Source: registry/catalogue.ts, projected through lib/catalogue.ts. Generator: scripts/build-registry.mts (`pnpm run generate`). Gate: `pnpm check:generated`. Consumed by the /r routes, the llms shards and the generated catalogue reference page. It exists as JSON rather than being imported from the TypeScript because the route handlers, the llms shards and any external tool all need the same rows without loading the app's module graph. `generatedAt` carries the source hash rather than a build time, because this file is guarded by a byte-for-byte drift gate.",
      generatedAt: hash,
      sourceHash: hash,
      /* `shipped` counts the rows whose phase is `shipped`, and it has to be
         counted rather than taken as `rows.length`. The two are the same
         number today only because every row in the catalogue reads `shipped`,
         so the shortcut published a true figure under a name that would start
         lying with the first `planned` or `deprecated` row. Nothing reads this
         field yet, which is exactly why it would have gone wrong quietly:
         `--check` compares this file against what this generator writes, so a
         generator and its output agree just as happily on a wrong value as on
         a right one. */
      counts: {
        shipped: rows.filter((row) => row.status === "shipped").length,
        implemented: builtNames.size,
      },
      categories,
      items: rows,
      aliases,
    },
    null,
    2,
  )}\n`
}

/* ------------------------------------------------------------------ *
 * Main                                                                *
 * ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const checkOnly = process.argv.includes("--check")

  installResolveHook()
  const { rows: catalogue, note } = await loadCatalogue()
  if (note) console.warn(`build-registry: ${note}`)

  /* The projection to an index row lives in lib/catalogue.ts, next to the type
     it projects, so that the row a machine reads and the row the status matrix
     renders cannot diverge. If it is unavailable this script falls back to an
     equivalent inline projection rather than to nothing. */
  const catalogueLib = await importModule(join("lib", "catalogue.ts"))
  const routesLib = await importModule(join("lib", "routes.ts"))

  const componentPath =
    typeof routesLib?.componentPath === "function"
      ? (routesLib.componentPath as (id: string) => string)
      : (id: string) => ["", "docs", "components", id].join("/")

  /* The walk happens BEFORE the projection, and it has to. `implemented` on an
     index row is now a real answer rather than a hardcoded false, and the only
     honest source for it is this directory listing. Reading registry/__index__.ts
     instead would read the PREVIOUS run's output - the file this run is about to
     overwrite - so lib/generated/catalogue.json would lag one generate behind,
     two successive runs would differ, and `pnpm check:generated` would fail on a
     file nobody edited. */
  const bases = [DEFAULT_BASE]
  const styles = (() => {
    const found = listDirs(join(REGISTRY_DIR, "styles"))
    return found.length > 0 ? found : [DEFAULT_STYLE]
  })()

  const built = findBuilt(styles)
  /* Distinct names, deduplicated across styles AND across bases: two styles of
     one component are one implemented component. REGISTRY_META.count is the
     other number - index entries, i.e. files x styles - and the two diverge the
     day a second style directory exists. */
  const componentFiles = listFiles(COMPONENTS_DIR).filter((file) => file.endsWith(".tsx"))
  const builtNames = new Set(componentFiles.map((file) => file.replace(/\.tsx$/, "")))
  const isBuilt = (id: string): boolean => builtNames.has(id)

  const toIndexRow =
    typeof catalogueLib?.toIndexRow === "function"
      ? (catalogueLib.toIndexRow as (
          entry: CatalogueRow,
          docsUrl: (id: string) => string,
          isBuilt: (id: string) => boolean,
        ) => IndexRow)
      : (
          entry: CatalogueRow,
          docsUrl: (id: string) => string,
          built: (id: string) => boolean,
        ): IndexRow => ({
          name: entry.name,
          title: entry.title ?? entry.name,
          description: entry.description ?? "",
          type: "registry:ui",
          category: entry.category ?? "utility",
          status: entry.status ?? "planned",
          since: entry.since ?? "unreleased",
          aliases: entry.aliases ?? [],
          implemented: built(entry.name),
          docs: docsUrl(entry.name),
          dependencies: entry.dependencies as string[] | undefined,
          registryDependencies: entry.registryDependencies as string[] | undefined,
        })

  const rows = catalogue.map((entry) =>
    toIndexRow(entry, componentPath, isBuilt),
  )

  const categoryOrder = Array.isArray(catalogueLib?.CATALOGUE_CATEGORIES)
    ? (catalogueLib.CATALOGUE_CATEGORIES as string[])
    : [...new Set(rows.map((row) => row.category))]
  const categoryLabels =
    catalogueLib?.CATALOGUE_CATEGORY_LABELS &&
    typeof catalogueLib.CATALOGUE_CATEGORY_LABELS === "object"
      ? (catalogueLib.CATALOGUE_CATEGORY_LABELS as Record<string, string>)
      : {}
  const categories = categoryOrder.map((id) => ({
    id,
    label: categoryLabels[id] ?? id,
    count: rows.filter((row) => row.category === id).length,
  }))

  /* One alias namespace, declared once. A synonym that pointed at two
     components would give a reader and an agent different answers. */
  const aliases: Record<string, string> = {}
  const collisions: string[] = []
  for (const row of rows) {
    for (const alias of row.aliases) {
      const key = alias.trim().toLowerCase()
      if (key.length === 0) continue
      const owner = aliases[key]
      if (owner !== undefined && owner !== row.name) {
        collisions.push(`  "${alias}" is claimed by both ${owner} and ${row.name}`)
        continue
      }
      aliases[key] = row.name
    }
  }
  if (collisions.length > 0) {
    console.warn(
      [
        "build-registry: the alias namespace has collisions. `aliases` is global and is",
        "  declared once in registry/catalogue.ts; the first claimant wins here and",
        "  assert-ia reports it as an error.",
        ...collisions,
      ].join("\n"),
    )
  }

  const catalogueSource = exists(join(REGISTRY_DIR, "catalogue.ts"))
    ? readFileSync(join(REGISTRY_DIR, "catalogue.ts"), "utf8")
    : ""
  /* The component sources are a hash input, so an edit to a component in
     @opsinjs/react regenerates the index even when its demo did not change. */
  const componentSources = componentFiles
    .map((file) => readFileSync(join(COMPONENTS_DIR, file), "utf8"))
    .join(" ")
  const hash =
    catalogueSource === "" && built.length === 0 && componentSources === ""
      ? "empty"
      : createHash("sha256")
          .update(catalogueSource)
          .update(built.map((item) => item.source).join(" "))
          .update(componentSources)
          .digest("hex")
          .slice(0, 12)

  const outputs = [
    { file: OUT_INDEX, contents: emitIndex(built, bases, styles, hash) },
    { file: OUT_BARREL, contents: emitBarrel(componentFiles) },
    {
      file: OUT_CATALOGUE_JSON,
      contents: emitCatalogueJson(rows, categories, aliases, builtNames, hash),
    },
  ]

  if (checkOnly) {
    const drifted = outputs.filter((output) => {
      try {
        return readFileSync(output.file, "utf8") !== output.contents
      } catch {
        return true
      }
    })
    if (drifted.length > 0) {
      console.error(
        [
          "build-registry --check: generated output is out of date.",
          ...drifted.map((output) => `  ${relative(APP_DIR, output.file)}`),
          "",
          "  Run `pnpm run generate` and commit the result.",
        ].join("\n"),
      )
      process.exit(1)
    }
    console.log("build-registry --check: up to date.")
    return
  }

  let writtenCount = 0
  for (const output of outputs) {
    if (writeIfChanged(output.file, output.contents)) writtenCount += 1
  }
  console.log(
    [
      `build-registry: ${rows.length} catalogue rows, ${built.length} built (hash ${hash}).`,
      `  ${bases.length} base(s): ${bases.join(", ")} | ${styles.length} style(s): ${styles.join(", ")}` +
        ` | kinds: ${KINDS.join(", ")}`,
      `  ${builtNames.size} component(s) implemented in @opsinjs/react.`,
      ...outputs.map((output) => `  ${relative(APP_DIR, output.file)}`),
      `  ${writtenCount} file(s) changed.`,
    ].join("\n"),
  )

  if (rows.length === 0) {
    console.warn(
      "  note: zero catalogue rows. The generated files are valid and empty, which is\n" +
        "  what a machine should see before the roster exists.",
    )
  } else if (built.length === 0) {
    console.log(
      "  note: nothing is built, so REGISTRY_INDEX is empty and every lookup returns\n" +
        "  null. That is the honest state, and it is what makes <ComponentPreview>\n" +
        "  render <NotBuiltYet> rather than a blank frame.",
    )
  }
}

await main()
