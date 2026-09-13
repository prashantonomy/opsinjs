/**
 * app/_machine/contracts.ts is the single seam between the machine-route layer
 * (`app/r/**`, `app/api/**`, the `llms-*` family, `/og`, `/rss.xml`) and the
 * modules other workers own (`lib/catalogue.ts`, `lib/registry.ts`,
 * `lib/color/*`).
 *
 * WHY THIS FILE EXISTS
 * The seventeen route handlers below it are written in the same parallel phase
 * as `lib/`. If each of them imported `{ getCatalogue }` directly and that
 * export turned out to be spelled `catalogue`, seventeen files would fail
 * typecheck at once and the green build that is this scaffold's one hard
 * constraint would be lost to a naming coin-flip. So every borrowed symbol is
 * resolved HERE, once, through a namespace import plus a runtime lookup across
 * the plausible spellings. A namespace import type-checks whatever the module
 * actually exports; the lookup either finds the function or reports, in the
 * response body, that it could not. A machine surface that answers
 * `{"error":"catalogue-unavailable"}` is strictly better than one that fails
 * to compile, and strictly better than one that silently serves an empty list.
 *
 * WHEN `lib/` IS FROZEN: replace each `resolve*` body with a direct import.
 * The routes never change, because they only ever see the shapes declared
 * here.
 *
 * NOTE ON DOCUMENTATION PATHS: nothing in this file constructs one. Page URLs
 * come from fumadocs (`page.url`, built from the `baseUrl` that
 * `lib/source.ts` reads from `lib/routes.ts`); this module only ever prefixes
 * an origin onto a path it was handed. That is why the documentation prefix
 * never appears here as a literal, and why `absoluteUrl` is not a second route
 * builder. The same holds for every file under `app/_machine` and every route
 * that imports them.
 */

import * as catalogueModule from "@/lib/catalogue"
import * as registryModule from "@/lib/registry"
import * as apcaModule from "@/lib/color/apca"
import * as wcagModule from "@/lib/color/wcag"
import pkg from "@/package.json"

/* ------------------------------------------------------------------ *
 * Site identity
 * ------------------------------------------------------------------ */

/**
 * Canonical origin, no trailing slash. Matches the `@opsinjs` registry entry
 * already written into `components.json`
 * (`https://opsinjs.dev/r/{name}.json`), so the registry URL an agent reads
 * out of a consuming project and the URL this app serves cannot drift.
 *
 * Overridable for preview deployments. Every route below is statically
 * rendered, so this is baked at build time. Set it in the build environment,
 * not at request time.
 *
 * THE DEFAULT DOES NOT RESOLVE. `dig opsinjs.dev` returns no record, so every
 * absolute URL built from this constant is a name the project intends to own
 * rather than a URL an agent can fetch. Those URLs appear in `llms.txt`, in
 * the four shards, in every `/r` payload, in each `.md` twin's frontmatter, in
 * the sitemap and in the feed. Set `NEXT_PUBLIC_SITE_URL` to the origin that
 * actually serves the build, and do not treat the fallback as a contract until
 * the domain exists.
 */
/**
 * NOTE FOR THE SEQUENTIAL FINISH: `app/_shared/site.ts` (the human-facing
 * routes) declares the same origin, name and repository URL, resolved from the
 * same environment variable and with the same fallback. The two were written
 * in parallel and agree exactly. Once both file sets are settled they should
 * be collapsed into one module, with this one importing from that one. They
 * are kept separate here only so that neither worker's build depends on the
 * other's file landing first.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://opsinjs.dev"
).replace(/\/+$/, "")

/** Prefix the canonical origin onto a root-relative path. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export const SITE_NAME = "opsinjs"

export const SITE_TAGLINE =
  "A React design system for consumer- and patient-facing health apps."

/**
 * The one paragraph every machine surface opens with. It has to do two jobs at
 * once: say what the system is for, and say exactly how much of it is built.
 * The second job has to land before anything else is read, so a model
 * neither invents the API of a component that does not exist nor hand-rolls
 * one that does.
 *
 * It is computed rather than asserted, and computed LAZILY.
 *
 * It cannot be a module-level `const`. `implementedComponents()` reaches through
 * the reflective `pick()` seam into `lib/registry.ts`, which imports
 * `lib/catalogue.ts`, which imports back through this module's own import graph;
 * evaluating it while this module is still initialising throws a ReferenceError
 * from inside `lib/catalogue.ts` and every `/r/*` route answers 500. Every caller
 * is a `force-static` route, so this runs once at build time either way. The
 * only thing eagerness bought was the crash.
 */
export function siteSummary(): string {
  const built = implementedComponents()
  const opening = [
    "opsinjs is a design system for screens where somebody who is not a",
    "clinician reads their own health data, such as a blood-pressure reading,",
    "an HbA1c result or a symptom log, and has to decide what, if anything, to",
    "do about it.",
    "",
  ]

  /* While nothing is built this is the original paragraph, word for word. It is
     the string this scaffold exists to publish, and the whole point of it is
     that a model reads it before it reads a proposed API. */
  if (built.length === 0) {
    return [
      ...opening,
      "NOTHING IN THIS SYSTEM IS IMPLEMENTED YET. Every component page is a",
      "specification: intent, when not to use it (naming the alternative), the",
      "clinical contract, the proposed anatomy and API, and the accessibility bar",
      "the implementation must clear. Pages carry a machine-readable status. Do not",
      "generate code against a proposed API and do not describe a component as",
      "shipping. The tokens, the doctrine (health, accessibility, content,",
      "foundations) and the measured contrast figures are real today; the React",
      "components are not.",
    ].join("\n")
  }

  /* Once something is built the old paragraph is simply false, on the surface a
     model trusts most. The replacement has to do the same job in the other
     direction: say how many, name them, and say what the REST of the roster
     actually is. A reader who saw "nothing is implemented" last week must not
     conclude that the whole roster shipped, and a reader arriving today must
     not conclude that none of it did. The ids are listed here, and only here,
     because this is the one payload that has no per-item rows to carry the
     answer instead.

     Every number below is read off the catalogue. The first version of this
     paragraph typed "24 specified components" as a literal; it was true on the
     day it was written and became a self-contradiction the moment the
     twenty-fourth component landed, shouting that most of the system was
     unbuilt one line above a computed sentence saying all of it was. A
     denominator somebody has to remember to change is a denominator that
     rots. */
  const rows = getCatalogue().rows
  /* `shipped` is the catalogue's own word for "more than a reserved name":
     every row that is not `considered` has a written specification page. */
  const specified = rows.filter((row) => row.shipped).length
  const reserved = rows.length - specified
  const builtSet = new Set(built)
  const builtRows = rows.filter((row) => builtSet.has(row.name))
  /* Derived, not asserted. "They are all alpha" is true today and is exactly
     the kind of sentence that stops being true on the first promotion. */
  const allAlpha =
    builtRows.length === built.length &&
    builtRows.every((row) => row.status === "alpha")

  const roster =
    built.length === 1
      ? `only one component is implemented: ${built[0]}.`
      : `${built.length} components are implemented: ${built.join(", ")}.`

  /* The headline is the ratio, not a slogan. While the built set is a minority
     of the specified set the caution is the true reading and is kept word for
     word; once it covers that set, the same shout becomes the falsehood this
     paragraph exists to prevent, running backwards. `getCatalogue()` never
     throws and can degrade to no rows at all, so a zero denominator is never
     printed as though it were a count. */
  const lede =
    specified === 0
      ? ["PART OF THIS SYSTEM IS IMPLEMENTED AND PART OF IT IS NOT.", roster]
      : built.length >= specified
        ? [
            `ALL ${specified} SPECIFIED COMPONENTS ARE IMPLEMENTED AND INSTALLABLE.`,
            built.length === 1
              ? `The one implemented id is ${built[0]}.`
              : `They are: ${built.join(", ")}.`,
          ]
        : [
            built.length * 2 <= specified
              ? `MOST OF THIS SYSTEM IS NOT IMPLEMENTED. Of the ${specified} specified components,`
              : `PART OF THIS SYSTEM IS NOT IMPLEMENTED. Of the ${specified} specified components,`,
            roster,
          ]

  /* What everything else on the roster is. Deleting this clause once the
     specified set is covered would trade one omission for another: it is the
     only sentence here that tells a reader the `considered` ids and the screen
     pages have no code. */
  const remainder =
    specified > 0 && built.length >= specified
      ? [
          reserved > 0
            ? `The other ${reserved} ids in the catalogue are \`considered\`: reserved names, recorded so the URL answers with something better than a 404, with no specification and no code behind them.`
            : "Every id in the catalogue is implemented; none is merely reserved.",
          "The screen pages are specimens; none of them is implemented either.",
        ]
      : [
          "Every other component page is either a specification or a `considered`",
          "id. A specification carries intent, when not to use it (naming the",
          "alternative), the clinical contract, the proposed anatomy and API, and",
          "the accessibility bar the implementation must clear. A `considered` id",
          "is a reserved name with no specification and no code.",
        ]

  return [
    ...opening,
    ...lede,
    ...remainder,
    allAlpha
      ? "Every implemented component is `alpha`: its API may change in any release without a deprecation cycle."
      : "Read `status` on a roster row before you depend on that component's API.",
    "Pages carry a machine-readable status, and `/r/index.json` carries",
    "`implemented` per id. Do not generate code against a proposed API and do",
    "not describe an unimplemented component as shipping. The tokens, the",
    "doctrine (health, accessibility, content, foundations) and the measured",
    "contrast figures are real today.",
  ].join("\n")
}



/**
 * The repository these routes link to.
 *
 * THIS REPOSITORY DOES NOT EXIST YET, in exactly the sense `SITE_URL` above
 * does not resolve: `github.com/opsinjs/opsinjs` is a name the project intends
 * to own, not a page anybody can open today. The constant is written down here
 * rather than in the four routes that link to it so that publishing the
 * repository is one edit, and so that nobody has to discover the fact by
 * following a link.
 *
 * It matters most on `/api/feedback`, whose whole answer to "we do not store
 * your report" is a pre-filled issue URL built from these two segments. Until
 * the repository is real that link is a promise rather than a destination.
 * That is why that route also echoes the report back in the response body, so
 * the reader still holds what they typed.
 */
export const GITHUB_OWNER = "opsinjs"
export const GITHUB_REPO = "opsinjs"
export const GITHUB_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`
export const GITHUB_NEW_ISSUE_URL = `${GITHUB_URL}/issues/new`

/* ------------------------------------------------------------------ *
 * Registry identity
 * ------------------------------------------------------------------ */

/** The namespace a consuming project puts in its `components.json`. */
export const REGISTRY_NAMESPACE = "@opsinjs"

/** The `{name}` template that namespace resolves to. */
export const REGISTRY_URL_TEMPLATE = absoluteUrl("/r/{name}.json")

export const REGISTRY_SCHEMA_URL = "https://ui.shadcn.com/schema/registry.json"
export const REGISTRY_ITEM_SCHEMA_URL =
  "https://ui.shadcn.com/schema/registry-item.json"

/**
 * The base × style matrix (locked decision 6). `base` is behaviour authored
 * per primitive library; `style` is only a stylesheet. Docs pages have exactly
 * one un-namespaced URL; the matrix is addressable on the machine surfaces
 * (`/r/styles/[style]/[name]`) and the chrome-less preview routes.
 */
export const DEFAULT_BASE = "base"
export const DEFAULT_STYLE = "base-lyra"
export const KNOWN_BASES = ["base"] as const
export const KNOWN_STYLES = ["base-lyra"] as const

/* ------------------------------------------------------------------ *
 * Version stamp
 * ------------------------------------------------------------------ */

/** Version of the docs app that produced this payload. */
export const DOCS_VERSION: string =
  typeof pkg.version === "string" ? pkg.version : "0.0.0"

/**
 * Build-time stamp. These routes are `force-static`, so this is the moment the
 * corpus was compiled, not the moment it was requested. That is exactly the
 * property an offline bundle needs.
 */
export const GENERATED_AT = new Date().toISOString()

/**
 * Every machine payload carries the same provenance block.
 *
 * `implemented` and `notice` are computed from the built set rather than
 * asserted, and they have to stay honest in both directions. While nothing is
 * built the notice is the original sentence, word for word, because that is the
 * string this scaffold exists to publish. Once something is built, "no opsinjs
 * component is implemented yet" becomes a false statement on the surface an
 * agent trusts most. The replacement has to say how many, so that a reader who
 * saw the old sentence does not conclude the whole roster shipped.
 *
 * The notice deliberately does NOT list the implemented ids. Every payload that
 * carries this block already carries the per-item answer (`implemented` on a
 * roster row, `meta.opsinjs.implemented` on an item), and a second list in prose
 * is a second thing to keep in step.
 */
export function provenance(): {
  generator: string
  docsVersion: string
  generatedAt: string
  site: string
  implemented: boolean
  implementedCount: number
  notice: string
} {
  const count = implementedComponents().length
  return {
    generator: `${SITE_NAME}-docs`,
    docsVersion: DOCS_VERSION,
    generatedAt: GENERATED_AT,
    site: SITE_URL,
    implemented: count > 0,
    implementedCount: count,
    notice:
      count === 0
        ? "No opsinjs component is implemented yet. Every entry is a specification. Do not generate code against a proposed API."
        : `${count} opsinjs component${count === 1 ? " is" : "s are"} implemented. Every other entry is a specification or a reserved name, not code. Check \`implemented\` on the roster row, or \`meta.opsinjs.implemented\` on the item, before you assume a component exists, and never generate code against a proposed API.`,
  }
}

/* ------------------------------------------------------------------ *
 * Borrowed symbol resolution
 * ------------------------------------------------------------------ */

function bag(mod: unknown): Record<string, unknown> {
  return (mod ?? {}) as Record<string, unknown>
}

function pick(mod: unknown, names: readonly string[]): unknown {
  const source = bag(mod)
  for (const name of names) {
    const value = source[name]
    if (value !== undefined && value !== null) return value
  }
  const fallback = source.default
  if (fallback !== undefined && fallback !== null) return fallback
  return undefined
}

function callable(value: unknown): ((...args: unknown[]) => unknown) | null {
  return typeof value === "function"
    ? (value as (...args: unknown[]) => unknown)
    : null
}

/* ------------------------------------------------------------------ *
 * The catalogue
 * ------------------------------------------------------------------ */

/**
 * The row shape the machine routes need. `registry/catalogue.ts` is the source
 * of truth (addendum A13: it owns the entire alias namespace); this is the
 * subset the registry and index surfaces publish. Anything the upstream row
 * carries that is not listed here is passed through untouched under `extra`.
 */
export interface CatalogueRow {
  /** The kebab-case id is the registry item name and the docs path segment. */
  name: string
  /** PascalCase display name. Derived from `name` when absent. */
  title: string
  description: string
  /** e.g. `health-data-display`, `surfaces`, `feedback`. */
  category: string
  status: string
  /**
   * `true` for every id that is more than a reserved name. An id qualifies
   * when it has a written specification page behind it, whether or not that
   * page's component has been built yet. It is NOT an implementation flag:
   * `implemented` on the roster row answers that, from the registry index.
   * Defaulted from `status !== "considered"` when the catalogue row does not
   * declare it, which is the same rule stated twice; no count is written down
   * here, because a count in a comment is a count nobody updates.
   */
  shipped: boolean
  since?: string
  owner?: string
  a11yDate?: string
  aliases: string[]
  governedBy: string[]
  usedIn: string[]
  /**
   * npm packages a consumer's `shadcn add` must install for this component's
   * source to compile. Published as the item's `dependencies`.
   */
  dependencies: string[]
  /**
   * Other opsinjs components this one composes, as bare catalogue ids.
   * `buildRegistryItem` namespaces them on the way out, because shadcn
   * resolves a bare dependency name against ui.shadcn.com, not against us.
   */
  registryDependencies: string[]
  extra: Record<string, unknown>
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}

function pascalise(id: string): string {
  return id
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
}

const KNOWN_ROW_KEYS = new Set([
  "name",
  "id",
  "title",
  "description",
  "category",
  "status",
  "shipped",
  "since",
  "owner",
  "a11yDate",
  "aliases",
  "governedBy",
  "usedIn",
  "dependencies",
  "registryDependencies",
])

function normaliseRow(input: unknown): CatalogueRow | null {
  if (typeof input !== "object" || input === null) return null
  const row = input as Record<string, unknown>
  const name = typeof row.name === "string" ? row.name : row.id
  if (typeof name !== "string" || name.length === 0) return null

  const status = typeof row.status === "string" ? row.status : "planned"
  const extra: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    if (!KNOWN_ROW_KEYS.has(key)) extra[key] = value
  }

  return {
    name,
    title: typeof row.title === "string" ? row.title : pascalise(name),
    description:
      typeof row.description === "string"
        ? row.description
        : "No description in the catalogue yet.",
    category: typeof row.category === "string" ? row.category : "uncategorised",
    status,
    shipped:
      typeof row.shipped === "boolean" ? row.shipped : status !== "considered",
    since: typeof row.since === "string" ? row.since : undefined,
    owner: typeof row.owner === "string" ? row.owner : undefined,
    a11yDate: typeof row.a11yDate === "string" ? row.a11yDate : undefined,
    aliases: toStringArray(row.aliases),
    governedBy: toStringArray(row.governedBy),
    usedIn: toStringArray(row.usedIn),
    /* Named here rather than swept into `extra`. `extra` is spread into
       `meta.opsinjs` verbatim, which is the wrong home for two fields the
       registry specification has top-level slots for: an installer reads
       `dependencies`, not `meta.opsinjs.dependencies`. */
    dependencies: toStringArray(row.dependencies),
    registryDependencies: toStringArray(row.registryDependencies),
    extra,
  }
}

export interface CatalogueResult {
  rows: CatalogueRow[]
  /** Non-empty when the catalogue could not be read, or rows were dropped. */
  diagnostics: string[]
}

let catalogueCache: CatalogueResult | null = null

/**
 * Read `lib/catalogue.ts` and normalise it. Never throws: a machine surface
 * must answer, and an answer that names its own failure is more useful to an
 * agent than a 500.
 */
export function getCatalogue(): CatalogueResult {
  if (catalogueCache) return catalogueCache

  const diagnostics: string[] = []
  const candidate = pick(catalogueModule, [
    "getCatalogue",
    "catalogue",
    "getCatalogueEntries",
    "entries",
    "all",
  ])

  let raw: unknown = candidate
  const fn = callable(candidate)
  if (fn) {
    try {
      raw = fn()
    } catch (error) {
      diagnostics.push(
        `lib/catalogue.ts threw while reading the catalogue: ${String(error)}`
      )
      raw = []
    }
  }

  if (!Array.isArray(raw)) {
    // Tolerate a keyed map as well as an array.
    if (typeof raw === "object" && raw !== null) {
      raw = Object.values(raw as Record<string, unknown>)
    } else {
      diagnostics.push(
        "lib/catalogue.ts exposed no readable catalogue (expected getCatalogue() or a catalogue array). Serving an empty roster."
      )
      raw = []
    }
  }

  const rows: CatalogueRow[] = []
  let dropped = 0
  for (const item of raw as unknown[]) {
    const row = normaliseRow(item)
    if (row) rows.push(row)
    else dropped += 1
  }
  if (dropped > 0) {
    diagnostics.push(
      `${dropped} catalogue row(s) had no usable \`name\` and were omitted.`
    )
  }

  rows.sort((a, b) => a.name.localeCompare(b.name))
  catalogueCache = { rows, diagnostics }
  return catalogueCache
}

export function findCatalogueRow(name: string): CatalogueRow | undefined {
  const wanted = name.toLowerCase()
  return getCatalogue().rows.find(
    (row) =>
      row.name.toLowerCase() === wanted ||
      row.aliases.some((alias) => alias.toLowerCase() === wanted)
  )
}

/** Cheap edit-distance-free suggestion list for an unknown item name. */
export function suggestNames(name: string, limit = 5): string[] {
  const needle = name.toLowerCase().replace(/[^a-z0-9]/g, "")
  if (needle.length === 0) return []
  const scored = getCatalogue()
    .rows.map((row) => {
      const haystack = row.name.replace(/[^a-z0-9]/g, "")
      let score = 0
      if (haystack.includes(needle) || needle.includes(haystack)) score += 10
      for (const alias of row.aliases) {
        if (alias.toLowerCase().includes(name.toLowerCase())) score += 5
      }
      const shared = [...new Set(needle)].filter((ch) =>
        haystack.includes(ch)
      ).length
      score += shared / 10
      return { name: row.name, score }
    })
    .filter((item) => item.score > 0.4)
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((item) => item.name)
}

/* ------------------------------------------------------------------ *
 * The built-artefact index
 * ------------------------------------------------------------------ */

export interface RegistrySourceFile {
  path: string
  type: string
  target?: string
  /**
   * The file's own text, inlined.
   *
   * THIS FIELD IS THE DIFFERENCE BETWEEN AN INSTALL AND A NO-OP. shadcn 4.20's
   * installer loop is `for (…) { if (!file.content) continue; … }`. A `files[]`
   * entry with a path and a type but no content is skipped in silence, with no
   * warning and a success message at the end. Every entry served from `/r`
   * therefore carries its bytes; `scripts/build-registry.mts` reads them at
   * generate time and inlines them into `registry/__index__.ts`, so nothing here
   * touches the filesystem at request time.
   */
  content?: string
}

/**
 * `lib/registry.ts` provides `getRegistryEntry(name, base, style)` over
 * `registry/__index__.ts`, which returns null for an id nothing is built for.
 * The lookup is by `kind: "component"`, so examples and screens are unreachable
 * from here by construction. They exist in the index but are never distributed.
 */
export function getBuiltFiles(
  name: string,
  base: string,
  style: string
): RegistrySourceFile[] {
  const fn = callable(
    pick(registryModule, ["getRegistryEntry", "getEntry", "resolve"])
  )
  if (!fn) return []
  let entry: unknown
  try {
    entry = fn(name, base, style)
  } catch {
    return []
  }
  if (typeof entry !== "object" || entry === null) return []
  const files = (entry as Record<string, unknown>).files
  if (!Array.isArray(files)) return []
  const result: RegistrySourceFile[] = []
  for (const file of files) {
    if (typeof file !== "object" || file === null) continue
    const record = file as Record<string, unknown>
    if (typeof record.path !== "string") continue
    result.push({
      path: record.path,
      type: typeof record.type === "string" ? record.type : "registry:ui",
      target: typeof record.target === "string" ? record.target : undefined,
      content: typeof record.content === "string" ? record.content : undefined,
    })
  }
  return result
}

/**
 * Every distinct component id that has a real renderable behind it.
 *
 * This one question is answered once, here, from the generated index rather
 * than from a constant somebody has to remember to change. Three separate
 * surfaces ask it: the `implemented` flag and the notice in `provenance()`,
 * and the `x-opsinjs-implemented` header on every response.
 *
 * `REGISTRY_META.count` is deliberately not used: it counts index entries, which
 * is files × styles, so it would report two implemented components the day a
 * second style directory appears. Distinct names is the number a reader means.
 *
 * Memoised because `registry/__index__.ts` is a compile-time constant and `json`
 * calls this on every response. The cache has the same lifetime as
 * `catalogueCache`: the module, and the routes are all `force-static`. It is
 * keyed by registry kind because `implementedScreens()` below asks the same
 * index the same way, and one memo for two questions would answer the second
 * with the first one's list.
 */
const builtNameCache = new Map<string, string[]>()

function builtNamesOfKind(kind: string): string[] {
  const cached = builtNameCache.get(kind)
  if (cached) return cached

  const names = new Set<string>()
  const fn = callable(
    pick(registryModule, ["listByKind", "listBuilt", "listOfKind"])
  )
  if (fn) {
    let entries: unknown
    try {
      entries = fn(kind)
    } catch {
      entries = undefined
    }
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        if (typeof entry !== "object" || entry === null) continue
        const record = entry as Record<string, unknown>
        if (typeof record.name !== "string") continue
        /* An entry with a null `component` is a placeholder, not something
           built. The generator never emits one today, and the guard costs
           nothing. */
        if (record.component === null || record.component === undefined) continue
        names.add(record.name)
      }
    }
  }

  const sorted = [...names].sort((a, b) => a.localeCompare(b))
  builtNameCache.set(kind, sorted)
  return sorted
}

export function implementedComponents(): string[] {
  return builtNamesOfKind("component")
}

/**
 * Every screen specimen that has a real renderable behind it.
 *
 * Today this is empty, and it is READ rather than written down as `false`. A
 * hardcoded negative is precisely the shape of the claim this repair spent
 * three rounds deleting: it is true until the moment somebody builds the thing,
 * and then it is the system's loudest lie, in the file an agent trusts most.
 * Asking the generated index costs one array filter and cannot go stale.
 *
 * Screens are never distributed, because `getBuiltFiles()` looks up components
 * only. This therefore answers "has this specimen been composed", which is the
 * question a `/docs/screens/<name>.md` twin is asked, and nothing about
 * installability.
 */
export function implementedScreens(): string[] {
  return builtNamesOfKind("screen")
}

/* ------------------------------------------------------------------ *
 * Colour maths
 * ------------------------------------------------------------------ */

/**
 * `lib/color/apca.ts` computes APCA-W3 lightness contrast. Signed: negative Lc
 * means light text on a dark background. `/api/contrast` reports both the
 * signed value and its magnitude, because the sign is the polarity and the
 * magnitude is what a threshold is compared against.
 */
export function resolveApca(): ((fg: string, bg: string) => number) | null {
  const fn = callable(
    pick(apcaModule, ["apca", "apcaContrast", "contrast", "lc", "apcaLc"])
  )
  if (!fn) return null
  return (fg, bg) => Number(fn(fg, bg))
}

/**
 * `lib/color/wcag.ts` computes the WCAG 2.2 relative-luminance ratio, 1 to 21.
 */
export function resolveWcag(): ((fg: string, bg: string) => number) | null {
  const fn = callable(
    pick(wcagModule, [
      "contrastRatio",
      "wcagContrast",
      "contrast",
      "ratio",
      "wcag",
    ])
  )
  if (!fn) return null
  return (fg, bg) => Number(fn(fg, bg))
}

/* ------------------------------------------------------------------ *
 * Response helpers
 * ------------------------------------------------------------------ */

/** Long-lived cache for build-time-stable machine payloads. */
export const STATIC_CACHE_CONTROL =
  "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"

/**
 * `x-opsinjs-implemented` answers "is the thing at THIS URL implemented".
 *
 * On a route that serves one registry item it is that item's answer; on a
 * documentation twin that documents one component or one screen it is that
 * subject's answer; everywhere else the URL is the system, so it is the
 * system's answer. That last case covers the index, the catalog, the corpus,
 * `/llms.txt`, and prose pages whose subject is the system rather than a
 * buildable thing. `serveRegistryItem()` and `/llms.mdx/<slug>` supply their
 * per-subject value through the caller-headers-last spread in `json()` and
 * `text()`, and both send `x-opsinjs-status` beside it so a reader can tell
 * which scope it got.
 *
 * The alternative was to make it uniformly system-scoped on every response, on
 * the grounds that one header meaning two things is a header nobody can read
 * without knowing the route. That reasoning is good and the conclusion was
 * still wrong, because the failure it produces is not confusion but a false
 * statement: `HEAD /r/card.json` would answer `true` for a component with no
 * code, and a tool deciding whether to install would be told yes. A header that
 * is ambiguous is worse than one that is precise; a header that is WRONG is
 * worse than both. Nothing else in this repository is allowed to claim a
 * component is built, and neither is this.
 *
 * `x-opsinjs-implemented-count` carries the system answer on every response, so
 * the number the uniform header used to imply is still available and is now
 * unambiguous about what it counts: distinct component ids with real source.
 */
function implementedHeaders(): Record<string, string> {
  const count = implementedComponents().length
  return {
    "x-opsinjs-implemented": count > 0 ? "true" : "false",
    "x-opsinjs-implemented-count": String(count),
  }
}

export function json(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {}
): Response {
  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    status: init.status ?? 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": STATIC_CACHE_CONTROL,
      "x-opsinjs-docs-version": DOCS_VERSION,
      ...implementedHeaders(),
      ...init.headers,
    },
  })
}

/**
 * `init.headers` is spread LAST, exactly as in `json()`, so a route that serves
 * one nameable thing can replace the system-scoped `x-opsinjs-implemented`
 * with that thing's own answer. `/llms.mdx/<slug>` is the caller that needs it:
 * a documentation twin is read as a page about one component, and answering
 * "yes, something in this system is built" to `HEAD /docs/components/toast.md`
 * is the wrong-value failure the docblock above calls worse than ambiguity.
 */
export function text(
  body: string,
  init: {
    status?: number
    contentType?: string
    headers?: Record<string, string>
  } = {}
): Response {
  return new Response(body, {
    status: init.status ?? 200,
    headers: {
      "content-type": init.contentType ?? "text/plain; charset=utf-8",
      "cache-control": STATIC_CACHE_CONTROL,
      "x-opsinjs-docs-version": DOCS_VERSION,
      ...implementedHeaders(),
      ...init.headers,
    },
  })
}
