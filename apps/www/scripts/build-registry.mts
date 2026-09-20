/**
 * build-registry.mts - registry/catalogue.ts to registry/__index__.ts and
 * lib/generated/catalogue.json.
 *
 *   node scripts/build-registry.mts            # write
 *   node scripts/build-registry.mts --check    # write nothing; fail on drift
 *
 * WRITES
 *   registry/__index__.ts          base/style/kind/name -> a renderable entry
 *   lib/generated/catalogue.json   the flattened roster, for /r, llms.txt and StatusMatrix
 *
 * IT DOES NOT WRITE public/r. Next serves public/ at the site root and a static
 * file there BEATS a route handler at the same path - verified on Next 16.3.4
 * by the author of app/r/themes/[preset]/route.ts. Every /r payload is served
 * by a route handler under app/r/ that builds it from the catalogue at build
 * time, and a generated file at the same URL would silently replace those
 * responses with a copy that has no provenance envelope and drifts. The one
 * generated artefact those routes do read is the theme payload, which
 * build-tokens.mts writes to registry/generated/themes/ for the same reason.
 *
 * AN ENTRY EXISTS ONLY WHERE A FILE DOES. The index is generated from the
 * directory listing of registry/bases/<base>/ and nothing else - no placeholder
 * rows, no entries derived from the catalogue. `getRegistryEntry()` returning
 * null is what makes <ComponentPreview> render <NotBuiltYet>; an entry whose
 * `component` was null would make that lookup return an object, and every
 * consumer would have to re-check the same emptiness one level deeper.
 *
 * IT INLINES THE BYTES, NOT ONLY THE PATHS. Each files[] entry carries the file
 * text as `content`, because shadcn 4.20's installer loop skips any entry
 * without one - silently, and then reports success. An item published with paths
 * alone resolves, prints its docs sentence and writes nothing. Every component
 * additionally ships the shared substrate (SHARED_FILES below), because a
 * component importing @/lib/opsinjs compiles here and fails in the project that
 * installed it unless that module travels with it.
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

/**
 * Decision 6: the docs URL never carries a base or a style segment, but the
 * registry and the /view routes carry both as real path segments, because those
 * are the machine surfaces where the combination has to be addressable.
 */
const DEFAULT_BASE = "base"
const DEFAULT_STYLE = "base-lyra"
const KINDS = ["component", "example", "screen"]

/**
 * The substrate every distributed component ships alongside its own source.
 *
 * `shadcn add` copies files into a project that has none of this repository, so
 * a component that imports `@/lib/opsinjs` compiles here and breaks there unless
 * that module is in the same payload. Two files cover the whole allowed import
 * surface: `lib/opsinjs.ts`, which every component imports, and `lib/status.ts`,
 * which `lib/opsinjs.ts` re-exports and therefore imports. `@/lib/utils` is
 * absent from this list on purpose - `shadcn init` writes it into every consumer
 * before any item can be added, so shipping a third copy would collide with a
 * file they already have and that they may have extended.
 *
 * `type: "registry:lib"` puts the file under the consumer's `components.json`
 * `aliases.lib`, and the same alias is what shadcn rewrites a `@/lib/...` import
 * specifier to, so `@/lib/opsinjs` names the same module at both ends with no
 * rewriting by hand. `target` says that explicitly as `@lib/<basename>`: without
 * one, shadcn derives the destination by looking for the alias directory's last
 * path segment inside the file's own path and falling back to the basename, and
 * that heuristic gives a surprising answer for a consumer whose lib alias
 * happens to end in a segment this path also contains.
 *
 * Only `component`-kind items get these. Examples and screens are addressable at
 * /view and rendered by <ComponentPreview>; they are never served from /r and
 * never installed, so shipping the substrate with them would be dead weight in a
 * payload nobody fetches.
 */
interface SharedFile {
  /** Where the file lives, relative to apps/www. */
  from: string
  /** The `files[].path` published for it. */
  path: string
  /** The `files[].target` published for it. */
  target: string
  /** The `files[].type` published for it. */
  type: string
}

const SHARED_FILES: SharedFile[] = [
  {
    from: join("lib", "opsinjs.ts"),
    path: "lib/opsinjs.ts",
    target: "@lib/opsinjs.ts",
    type: "registry:lib",
  },
  {
    from: join("lib", "status.ts"),
    path: "lib/status.ts",
    target: "@lib/status.ts",
    type: "registry:lib",
  },
]

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
  /**
   * The real filename, extension included. The published `files[].path` and
   * `files[].type` are both derived from it rather than assumed: this walk
   * accepts `.ts` as well as `.tsx`, and an emitted path with the wrong
   * extension points at a file that does not exist.
   */
  file: string
  source: string
}

/** A `SharedFile` with its text read off disk. */
interface LoadedSharedFile extends SharedFile {
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
 * Everything under registry/bases/<base>/ and registry/{examples,screens}/ that
 * looks like a component. There is nothing there yet, and the walk exists so
 * that the first file to land is picked up without a change to this script.
 */
function findBuilt(bases: string[], styles: string[]): BuiltItem[] {
  const built: BuiltItem[] = []
  const collect = (dir: string, kind: string, base: string) => {
    for (const file of listFiles(dir)) {
      if (!file.endsWith(".tsx") && !file.endsWith(".ts")) continue
      if (file.startsWith("index.")) continue
      const name = file.replace(/\.(tsx|ts)$/, "")
      const source = readFileSync(join(dir, file), "utf8")
      const specifier = `./${relative(REGISTRY_DIR, join(dir, name)).split("\\").join("/")}`
      for (const style of styles) {
        built.push({ name, base, style, kind, specifier, file, source })
      }
    }
  }

  for (const base of bases) collect(join(REGISTRY_DIR, "bases", base), "component", base)
  collect(join(REGISTRY_DIR, "examples"), "example", DEFAULT_BASE)
  collect(join(REGISTRY_DIR, "screens"), "screen", DEFAULT_BASE)
  return built
}

/**
 * Read the shared substrate, or stop.
 *
 * A missing file here is not a degraded build, it is a build that publishes
 * components a consumer cannot compile - and it would do it quietly, because
 * every other gate in this repository would stay green. So this is one of the
 * two places the generator exits non-zero, the other being the Node version
 * guard. Restoring the file, or editing SHARED_FILES if the substrate genuinely
 * moved, is the fix; there is no fallback that produces an honest payload.
 */
function loadSharedFiles(): LoadedSharedFile[] {
  const loaded: LoadedSharedFile[] = []
  const missing: string[] = []
  for (const file of SHARED_FILES) {
    const absolute = join(APP_DIR, file.from)
    if (!exists(absolute) || isDirectory(absolute)) {
      missing.push(file.from)
      continue
    }
    loaded.push({ ...file, source: readFileSync(absolute, "utf8") })
  }
  if (missing.length > 0) {
    console.error(
      [
        "",
        "  build-registry: the shared substrate is missing.",
        ...missing.map((file) => `    ${file}`),
        "",
        "  Every component's registry item ships these files so that a component",
        "  importing @/lib/opsinjs compiles in the project that installed it. With",
        "  one of them absent this script can only publish items that install",
        "  something broken, so it stops here instead.",
        "",
      ].join("\n"),
    )
    process.exit(1)
  }
  return loaded
}

/**
 * The one edit made to a shared file on its way into a registry payload: a
 * relative import's explicit `.ts` extension is dropped.
 *
 * THIS EXISTS BECAUSE TWO CORRECT RULES COLLIDE, and both were verified rather
 * than reasoned about.
 *
 * On disk, `lib/opsinjs.ts` imports `./status.ts` with the extension, because
 * every lib module a `scripts/*.mts` might load under plain node has to carry
 * one - node's ESM resolver does not guess extensions, and only
 * build-registry.mts installs a hook that covers it. `import("./lib/opsinjs.ts")`
 * from bare node with `./status` in it is ERR_MODULE_NOT_FOUND.
 *
 * In a project that installed the file, the extension is a compile error:
 * TS5097, "an import path can only end with a '.ts' extension when
 * 'allowImportingTsExtensions' is enabled". This repository enables it;
 * create-next-app's tsconfig does not. Shipping the extension turns
 * `shadcn add` from an install that writes nothing - the defect this whole
 * change exists to fix - into an install that writes a project which will not
 * build. Dropping it resolves identically under `moduleResolution: "bundler"`,
 * which is what a consumer has.
 *
 * So the file keeps the extension and the payload drops it. The rewrite is
 * deliberately the narrowest thing that works: a `from "…"` specifier that
 * begins `./` or `../` and ends `.ts`. It is applied ONLY to shared files. A
 * component's own text is published byte-for-byte, because that text is also its
 * `source` - what <ComponentSource> renders - and a component whose published
 * code differed from its displayed code would be lying about itself. Components
 * need no rewrite anyway: they import `@/lib/utils` and `@/lib/opsinjs` and
 * nothing else, and shadcn resolves both through the consumer's aliases.
 */
function forDistribution(source: string): string {
  return source.replace(/(\bfrom\s+")(\.{1,2}\/[^"]*?)\.ts(")/g, "$1$2$3")
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

/**
 * What one built file publishes as its own `files[]` entry.
 *
 * Both halves come from the real filename. `.tsx` is a component and lands under
 * the consumer's `aliases.ui`; `.ts` is a module and lands under `aliases.lib`.
 * The previous version of this function hardcoded `.tsx` and `registry:ui` for
 * everything, which meant a `.ts` file under registry/bases/<base>/ advertised a
 * path that does not exist on disk.
 */
function ownFileEntry(item: BuiltItem): { path: string; type: string; target: string } {
  const isComponentFile = item.file.endsWith(".tsx")
  return {
    path: `registry/${item.specifier.slice(2)}${isComponentFile ? ".tsx" : ".ts"}`,
    type: isComponentFile ? "registry:ui" : "registry:lib",
    target: `${isComponentFile ? "@ui" : "@lib"}/${item.file}`,
  }
}

/* ------------------------------------------------------------------ *
 * Emitters                                                            *
 * ------------------------------------------------------------------ */

function emitIndex(
  built: BuiltItem[],
  shared: LoadedSharedFile[],
  bases: string[],
  styles: string[],
  hash: string,
): string {
  /* Each distinct file text is named once and referred to by identifier.
     `source` (what <ComponentSource> renders) and the matching `files[].content`
     (what `shadcn add` writes to disk) are the same bytes by definition, and one
     component's source inlined twice would double the size of this file to say
     the same thing twice. The shared substrate is named once for the whole file
     rather than once per component, which is the difference between two copies
     of lib/status.ts and twenty-four. */
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

  const sharedConstants: string[] = []
  const sharedEntries: string[] = []
  for (const file of shared) {
    const identifier = uniqueIdentifier("SHARED", file.path, taken)
    sharedConstants.push(`const ${identifier} = ${q(forDistribution(file.source))}`)
    sharedEntries.push(
      `  { path: ${q(file.path)}, type: ${q(file.type)}, target: ${q(file.target)}, content: ${identifier} },`,
    )
  }

  /* THE GATE ON THE SILENT NO-OP.
   *
   * shadcn's installer loop is `if (!y.content) continue`. A `files[]` entry
   * with no content is not an error, not a warning and not a retry: the file is
   * skipped, the install reports success, and nothing is written. That failure
   * mode is why this whole emitter exists, and nothing else in the repository
   * would notice if it came back. `check:generated` only diffs the output
   * against itself, so an emitter that stopped writing content would regenerate
   * cleanly and every gate would stay green while `shadcn add` did nothing.
   *
   * So the invariant is asserted here, at the only place that can see it.
   */
  for (const item of built) {
    const identifier = sourceIdentifiers.get(item.specifier)
    if (identifier && (item.source ?? "").length > 0) continue
    console.error(
      [
        `build-registry: ${item.kind} "${item.name}" would be emitted with no file content.`,
        "",
        "  shadcn skips a files[] entry that has no `content`, silently, and reports",
        "  the install as successful. A component published this way resolves, prints",
        "  its docs sentence, and writes nothing to disk.",
        "",
        `  Source read from: registry/${item.specifier.slice(2)}`,
      ].join("\n"),
    )
    process.exit(1)
  }
  for (const file of shared) {
    if (file.source.length > 0) continue
    console.error(
      `build-registry: the shared substrate file ${file.path} is empty, so every component would ship an empty ${file.target}.`,
    )
    process.exit(1)
  }

  const entries = built
    .map((item) => {
      const key = `${item.base}/${item.style}/${item.kind}/${item.name}`
      const identifier = sourceIdentifiers.get(item.specifier) ?? "\"\""
      const own = ownFileEntry(item)
      const ownLiteral = `{ path: ${q(own.path)}, type: ${q(own.type)}, target: ${q(own.target)}, content: ${identifier} }`
      /* Only a component is ever installed, so only a component carries the
         substrate. An example or a screen publishes its own file and nothing
         else - it is reachable at /view and from <ComponentPreview>, and it is
         unreachable from /r, which looks entries up as kind "component". */
      const files =
        item.kind === "component" && sharedEntries.length > 0
          ? `[\n      ${ownLiteral},\n      ...SHARED_FILES,\n    ]`
          : `[${ownLiteral}]`
      return [
        `  ${q(key)}: {`,
        `    name: ${q(item.name)},`,
        `    base: ${q(item.base)},`,
        `    style: ${q(item.style)},`,
        `    kind: ${q(item.kind)},`,
        `    component: () => import(${q(item.specifier)}),`,
        `    source: ${identifier},`,
        `    meta: null,`,
        `    files: ${files},`,
        `  },`,
      ].join("\n")
    })
    .join("\n")

  const fileTexts = [...sourceConstants, ...sharedConstants].join("\n\n")

  return `/* eslint-disable */
/**
 * GENERATED FILE - DO NOT EDIT.
 *
 * Source:    registry/catalogue.ts + registry/{bases,examples,screens}/**
 * Generator: scripts/build-registry.mts   (\`pnpm run generate\`)
 * Gate:      \`pnpm check:generated\` regenerates this file and fails on a diff.
 *
 * REGISTRY_INDEX has an entry for a component and no stub for anything else.
 * \`getRegistryEntry()\` returning null is what makes <ComponentPreview> render
 * <NotBuiltYet>; an entry whose \`component\` was null would make the same call
 * return an object, and every consumer would have to re-check the same emptiness
 * one level deeper. An entry appears here the moment a real file exists under
 * registry/bases/<base>/, and not before.
 *
 * \`component\` is a dynamic import rather than a value so the preview surface can
 * code-split per component, and so this file stays free of top-level imports of
 * things that do not exist yet.
 *
 * THE FILE TEXTS ARE HOISTED AND NAMED. Each one appears once and is referred to
 * by identifier, because a component's \`source\` and the \`content\` of its own
 * files[] entry are the same bytes, and the shared substrate is the same bytes
 * for every component. \`content\` is what \`shadcn add\` writes to disk: its
 * installer skips a files[] entry that has none, without an error and without
 * changing its success message, so an entry with a path and no content installs
 * nothing at all.
 *
 * \`REGISTRY_META.generatedAt\` carries the source hash rather than a build time:
 * this file is guarded by a byte-for-byte drift gate, and a timestamp would fail
 * it on every run.
 */

import type { ComponentType } from "react"

/** What a registry entry renders. Mirrors the \`kind\` segment of a \`/view\` URL. */
export type RegistryKind = "component" | "example" | "screen"

/** One file a registry item distributes. The shape \`/r/<name>.json\` serves. */
export interface RegistrySourceFile {
  path: string
  type: string
  target?: string
  /**
   * The file's own text. Mandatory in practice: shadcn's installer skips any
   * entry without one, silently, and still reports the install as a success.
   */
  content?: string
}

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
  /** The real source text, for \`<ComponentSource>\`. */
  source: string | null
  /**
   * A pre-built registry-item.json payload. Always \`null\`: the item served at
   * \`/r/<name>.json\` is assembled from the catalogue row and \`files\` by
   * \`app/_machine/registry-payload.ts\`, so a second copy here would be a second
   * thing to keep in step.
   */
  meta: Record<string, unknown> | null
  /**
   * The files this item distributes, own file first and the shared substrate
   * after it. The machine routes read this directly to build a registry-item
   * response, so what is here is what \`shadcn add\` writes to disk.
   */
  files?: RegistrySourceFile[]
}

/** Behaviour variants. A second base is a folder under \`registry/bases/\`, never a URL migration. */
export const REGISTRY_BASES: string[] = [${bases.map(q).join(", ")}]

/** Style variants. Style is a stylesheet and nothing else; see decision 6. */
export const REGISTRY_STYLES: string[] = [${styles.map(q).join(", ")}]

${fileTexts}

/**
 * The substrate appended to every component's \`files\`, named once and shared by
 * reference so that twenty-four components cost one copy of each file rather
 * than twenty-four. Nothing mutates these; the machine layer copies each entry
 * into a fresh object on the way out.
 *
 * These texts differ from the files on disk in exactly one way: a relative
 * import's \`.ts\` extension is dropped, because the repository needs it (plain
 * node resolves no extensions) and a consumer cannot compile with it (TS5097,
 * unless they enable \`allowImportingTsExtensions\`). See \`forDistribution\` in
 * scripts/build-registry.mts. A component's own text is never rewritten.
 */
const SHARED_FILES: RegistrySourceFile[] = ${sharedEntries.length === 0 ? "[]" : `[\n${sharedEntries.join("\n")}\n]`}

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

  const shared = loadSharedFiles()

  /* The walk happens BEFORE the projection, and it has to. `implemented` on an
     index row is now a real answer rather than a hardcoded false, and the only
     honest source for it is this directory listing. Reading registry/__index__.ts
     instead would read the PREVIOUS run's output - the file this run is about to
     overwrite - so lib/generated/catalogue.json would lag one generate behind,
     two successive runs would differ, and `pnpm check:generated` would fail on a
     file nobody edited. */
  const bases = (() => {
    const found = listDirs(join(REGISTRY_DIR, "bases"))
    return found.length > 0 ? found : [DEFAULT_BASE]
  })()
  const styles = (() => {
    const found = listDirs(join(REGISTRY_DIR, "styles"))
    return found.length > 0 ? found : [DEFAULT_STYLE]
  })()

  const built = findBuilt(bases, styles)
  /* Distinct names, deduplicated across styles AND across bases: two styles of
     one component are one implemented component. REGISTRY_META.count is the
     other number - index entries, i.e. files x styles - and the two diverge the
     day a second style directory exists. */
  const builtNames = new Set(
    built.filter((item) => item.kind === "component").map((item) => item.name),
  )
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
  /* The shared substrate is a hash input because it is part of what this script
     publishes: editing lib/opsinjs.ts changes the bytes every component's
     registry item ships, and a hash that ignored that would let the drift gate
     pass over a real change to installed output. It is hashed unconditionally,
     including in the state where nothing is built and nothing references it,
     because a drift key with an exception is a drift key that is sometimes
     wrong. */
  const hash =
    catalogueSource === "" && built.length === 0 && shared.length === 0
      ? "empty"
      : createHash("sha256")
          .update(catalogueSource)
          .update(built.map((item) => item.source).join(" "))
          .update(shared.map((file) => file.source).join(" "))
          .digest("hex")
          .slice(0, 12)

  const outputs = [
    { file: OUT_INDEX, contents: emitIndex(built, shared, bases, styles, hash) },
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
      `  ${builtNames.size} component(s) installable, each shipping ${shared.length} shared file(s): ` +
        `${shared.map((file) => file.path).join(", ")}`,
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
