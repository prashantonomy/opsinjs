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
 * REGISTRY_INDEX IS EMPTY, AND THAT IS THE DESIGN. An entry is emitted only
 * when a real source file exists under registry/bases/<base>/. Nothing is
 * built, so the index is empty, and `getRegistryEntry()` returns null - which
 * is exactly what makes <ComponentPreview> render <NotBuiltYet>. Emitting a
 * placeholder entry whose `component` is null would make that lookup return an
 * object, and every consumer would have to re-check the same emptiness one
 * level deeper. The shape contract in the committed placeholder says so
 * explicitly, and it is right.
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
  rmSync,
  writeFileSync,
} from "node:fs"
import * as nodeModule from "node:module"
import { dirname, join, relative } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const APP_DIR = fileURLToPath(new URL("../", import.meta.url))
const REGISTRY_DIR = join(APP_DIR, "registry")
const OUT_INDEX = join(REGISTRY_DIR, "__index__.ts")
const OUT_CATALOGUE_JSON = join(APP_DIR, "lib", "generated", "catalogue.json")
const COMPONENTS_CONTENT_DIR = join(APP_DIR, "content", "docs", "components")

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
  a11yDate?: string | null
  governedBy?: string[]
  usedIn?: string[]
  why?: string
  useInstead?: string[]
  [key: string]: unknown
}

interface BuiltItem {
  name: string
  base: string
  style: string
  kind: string
  /** Import specifier, relative to registry/. */
  specifier: string
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
        built.push({ name, base, style, kind, specifier, source })
      }
    }
  }

  for (const base of bases) collect(join(REGISTRY_DIR, "bases", base), "component", base)
  collect(join(REGISTRY_DIR, "examples"), "example", DEFAULT_BASE)
  collect(join(REGISTRY_DIR, "screens"), "screen", DEFAULT_BASE)
  return built
}

/* ------------------------------------------------------------------ *
 * Emitters                                                            *
 * ------------------------------------------------------------------ */

function emitIndex(built: BuiltItem[], bases: string[], styles: string[], hash: string): string {
  const entries = built
    .map((item) => {
      const key = `${item.base}/${item.style}/${item.kind}/${item.name}`
      return [
        `  ${q(key)}: {`,
        `    name: ${q(item.name)},`,
        `    base: ${q(item.base)},`,
        `    style: ${q(item.style)},`,
        `    kind: ${q(item.kind)},`,
        `    component: () => import(${q(item.specifier)}),`,
        `    source: ${q(item.source)},`,
        `    meta: null,`,
        `    files: [{ path: ${q(`registry/${item.specifier.slice(2)}.tsx`)}, type: "registry:ui" }],`,
        `  },`,
      ].join("\n")
    })
    .join("\n")

  return `/* eslint-disable */
/**
 * GENERATED FILE - DO NOT EDIT.
 *
 * Source:    registry/catalogue.ts + registry/{bases,examples,screens}/**
 * Generator: scripts/build-registry.mts   (\`pnpm run generate\`)
 * Gate:      \`pnpm check:generated\` regenerates this file and fails on a diff.
 *
 * REGISTRY_INDEX is EMPTY of entries rather than full of stubs, and that is
 * deliberate. \`getRegistryEntry()\` returning null is what makes
 * <ComponentPreview> render <NotBuiltYet>; an entry whose \`component\` was null
 * would make the same call return an object, and every consumer would have to
 * re-check the same emptiness one level deeper. An entry appears here the
 * moment a real file exists under registry/bases/<base>/, and not before.
 *
 * \`component\` is a dynamic import rather than a value so the preview surface can
 * code-split per component, and so this file stays free of top-level imports of
 * things that do not exist yet.
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
   * Lazily loaded renderable. \`null\` while nothing is built, which is the
   * current and only state.
   */
  component: (() => Promise<{ default: ComponentType<Record<string, unknown>> }>) | null
  /** The real source text, for \`<ComponentSource>\`. \`null\` while nothing is built. */
  source: string | null
  /** The registry-item.json payload served at \`/r/<name>.json\`. \`null\` while nothing is built. */
  meta: Record<string, unknown> | null
  /**
   * The files this item distributes. Empty while nothing is built; the machine
   * routes read it directly to build a registry-item response.
   */
  files?: RegistrySourceFile[]
}

/** Behaviour variants. A second base is a folder under \`registry/bases/\`, never a URL migration. */
export const REGISTRY_BASES: string[] = [${bases.map(q).join(", ")}]

/** Style variants. Style is a stylesheet and nothing else; see decision 6. */
export const REGISTRY_STYLES: string[] = [${styles.map(q).join(", ")}]

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
  useInstead?: string[]
  why?: string
}

/**
 * ADR 0008 - considered components resolve, never 404.
 *
 * Emits one thin MDX page per `considered` catalogue row at the guessable URL
 * `docs/components/<id>`. A 404 is the worst possible answer to "do you have a
 * Tooltip", because a code-generating assistant cannot tell it from a typo and
 * will invent an API rather than stop - and the invented component will be
 * rendering somebody's blood pressure.
 *
 * These pages are deliberately thin and deliberately NOT shaped like a
 * specification: a `considered` page that looks like a `planned` page is a lie
 * with extra steps. They are excluded from the sidebar (the components
 * `meta.json` lists its pages explicitly and must never use the rest token) and
 * from the sitemap, but they are present in search, in the `.md` twins and in
 * `/r/index.json`, which are the surfaces where a definitive negative answer is
 * worth having.
 *
 * ALIASES ARE DEDUPLICATED, not copied wholesale. `assert-ia.mts` requires
 * globally unique aliases, and a shipped component page may already claim a
 * synonym this row also lists. Shipped rows win; a dropped alias still resolves
 * through the catalogue and `/r/index.json`, which carry the full list.
 */
function emitConsideredStub(
  row: IndexRow,
  aliases: string[],
  hash: string,
  titleOf: (id: string) => string,
): string {
  const title = row.title ?? row.name
  const alternatives = row.useInstead ?? []
  const description =
    row.description ?? `A component name reserved in the catalogue, with no specification.`

  const frontmatter = [
    "---",
    `title: ${q(title)}`,
    `description: ${q(description)}`,
    "status: considered",
    "kind: component",
    `since: ${q(String(row.since ?? "unreleased"))}`,
    `category: ${q(String(row.category ?? "utility"))}`,
    aliases.length > 0 ? `aliases: [${aliases.map(q).join(", ")}]` : "",
    "---",
  ]
    .filter((line) => line !== "")
    .join("\n")

  const instead =
    alternatives.length === 0
      ? "There is no direct replacement. The [component catalogue](index.mdx) is the definitive list of what does exist."
      : `Use ${alternatives
          .map((id, index) => {
            const link = `[${titleOf(id)}](${id}.mdx)`
            if (index === 0) return link
            if (index === alternatives.length - 1) return ` or ${link}`
            return `, ${link}`
          })
          .join("")} instead.`

  return [
    frontmatter,
    "",
    `{/* GENERATED FILE - DO NOT EDIT. Source: registry/catalogue.ts (status: considered).`,
    `    Generator: scripts/build-registry.mts (\`pnpm run generate\`). Gate: \`pnpm check:generated\`.`,
    `    Rationale: content/docs/project/decisions/0008-considered-components-resolve.mdx.`,
    `    Source hash ${hash}. */}`,
    "",
    `<PageTemplate kind="component" status="considered" category=${q(String(row.category ?? "utility"))} />`,
    "",
    `<StubNotice name=${q(row.name)} status="considered">`,
    `  **${title} is not built, and it has no specification.** The name is recorded in`,
    `  the catalogue so that this address answers instead of returning a 404 — not`,
    `  because the component is coming.`,
    `</StubNotice>`,
    "",
    "## What this name refers to",
    "",
    description,
    "",
    "## Why it is not on the roster",
    "",
    row.why ??
      "No rationale is recorded. That is a gap in the catalogue, not a signal that the component is planned.",
    "",
    "## What to use instead",
    "",
    instead,
    "",
    "Do not generate code against this page. It documents an absence. The",
    "machine-readable list of every component id and its status is at",
    "`/r/index.json`, and the [status matrix](index.mdx) shows the same rows for",
    "a human reader.",
    "",
  ].join("\n")
}

function emitCatalogueJson(
  rows: IndexRow[],
  categories: Array<{ id: string; label: string; count: number }>,
  aliases: Record<string, string>,
  builtNames: Set<string>,
  hash: string,
): string {
  const shipped = rows.filter((row) => row.status !== "considered")
  const considered = rows.filter((row) => row.status === "considered")
  return `${JSON.stringify(
    {
      $comment:
        "GENERATED FILE - DO NOT EDIT. Source: registry/catalogue.ts, projected through lib/catalogue.ts. Generator: scripts/build-registry.mts (`pnpm run generate`). Gate: `pnpm check:generated`. Consumed by the /r routes, the llms shards and the generated catalogue reference page. It exists as JSON rather than being imported from the TypeScript because the route handlers, the llms shards and any external tool all need the same rows without loading the app's module graph. `generatedAt` carries the source hash rather than a build time, because this file is guarded by a byte-for-byte drift gate.",
      generatedAt: hash,
      sourceHash: hash,
      counts: {
        shipped: shipped.length,
        considered: considered.length,
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

  const toIndexRow =
    typeof catalogueLib?.toIndexRow === "function"
      ? (catalogueLib.toIndexRow as (entry: CatalogueRow, docsUrl: (id: string) => string) => IndexRow)
      : (entry: CatalogueRow): IndexRow => ({
          name: entry.name,
          title: entry.title ?? entry.name,
          description: entry.description ?? "",
          type: "registry:ui",
          category: entry.category ?? "utility",
          status: entry.status ?? "planned",
          since: entry.since ?? "unreleased",
          aliases: entry.aliases ?? [],
          implemented: false,
          docs: entry.status === "considered" ? null : componentPath(entry.name),
          useInstead: entry.useInstead,
          why: entry.why,
        })

  const rows = catalogue.map((entry) => toIndexRow(entry, componentPath))

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

  const bases = (() => {
    const found = listDirs(join(REGISTRY_DIR, "bases"))
    return found.length > 0 ? found : [DEFAULT_BASE]
  })()
  const styles = (() => {
    const found = listDirs(join(REGISTRY_DIR, "styles"))
    return found.length > 0 ? found : [DEFAULT_STYLE]
  })()

  const built = findBuilt(bases, styles)
  const builtNames = new Set(built.map((item) => item.name))

  const catalogueSource = exists(join(REGISTRY_DIR, "catalogue.ts"))
    ? readFileSync(join(REGISTRY_DIR, "catalogue.ts"), "utf8")
    : ""
  const hash =
    catalogueSource === "" && built.length === 0
      ? "empty"
      : createHash("sha256")
          .update(catalogueSource)
          .update(built.map((item) => item.source).join(" "))
          .digest("hex")
          .slice(0, 12)

  /* ADR 0008. Aliases are claimed in catalogue order, shipped rows first, so the
     result is deterministic and never collides with a hand-authored page's
     frontmatter - which assert-ia requires to be globally unique. */
  const claimedAliases = new Set<string>()
  for (const row of rows) {
    if (row.status === "considered") continue
    for (const alias of row.aliases ?? []) claimedAliases.add(alias.toLowerCase())
  }

  const titleOf = (id: string): string =>
    rows.find((row) => row.name === id)?.title ?? id

  const consideredStubs = rows
    .filter((row) => row.status === "considered")
    .map((row) => {
      const unique: string[] = []
      for (const alias of row.aliases ?? []) {
        const key = alias.toLowerCase()
        if (claimedAliases.has(key)) continue
        claimedAliases.add(key)
        unique.push(alias)
      }
      return {
        file: join(COMPONENTS_CONTENT_DIR, `${row.name}.mdx`),
        contents: emitConsideredStub(row, unique, hash, titleOf),
      }
    })

  const outputs = [
    { file: OUT_INDEX, contents: emitIndex(built, bases, styles, hash) },
    {
      file: OUT_CATALOGUE_JSON,
      contents: emitCatalogueJson(rows, categories, aliases, builtNames, hash),
    },
    ...consideredStubs,
  ]

  /* A row removed from the catalogue must not leave its page behind: a stub with
     no catalogue row is exactly the dead documentation ADR 0008 exists to avoid,
     and assert-ia fails on it in the other direction. Only files carrying the
     generator's marker are ever removed, so a hand-authored specification can
     never be deleted by this. */
  const stubPaths = new Set(consideredStubs.map((stub) => stub.file))
  const staleStubs: string[] = []
  for (const entry of listFiles(COMPONENTS_CONTENT_DIR)) {
    if (!entry.endsWith(".mdx")) continue
    const file = join(COMPONENTS_CONTENT_DIR, entry)
    if (stubPaths.has(file)) continue
    try {
      if (readFileSync(file, "utf8").includes("Generator: scripts/build-registry.mts")) {
        staleStubs.push(file)
      }
    } catch {
      /* unreadable is not stale */
    }
  }

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
  for (const file of staleStubs) {
    rmSync(file)
    writtenCount += 1
    console.log(`  removed  ${relative(APP_DIR, file)} (no catalogue row)`)
  }

  const shipped = rows.filter((row) => row.status !== "considered").length
  const considered = rows.length - shipped
  console.log(
    [
      `build-registry: ${rows.length} catalogue rows - ${shipped} specified, ` +
        `${considered} considered, ${built.length} built (hash ${hash}).`,
      `  ${bases.length} base(s): ${bases.join(", ")} | ${styles.length} style(s): ${styles.join(", ")}` +
        ` | kinds: ${KINDS.join(", ")}`,
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
