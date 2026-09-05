/**
 * app/_machine/registry-payload.ts — the shadcn-spec registry, built from the
 * catalogue.
 *
 * WHY EVERY CLAIMED ID IS PUBLISHED, BUILT OR NOT
 * `npx shadcn@latest mcp` points an assistant at `/r/registry.json`. If that
 * catalog is missing or malformed the MCP server fails quietly and the
 * assistant falls back on what it thinks it remembers about a "RangeBar" —
 * which is nothing, so it invents one. A catalog that lists every id opsinjs
 * has claimed, each carrying `meta.opsinjs.status`, `meta.opsinjs.implemented`
 * and a `docs` sentence that says which of the two it is, converts that silent
 * failure into a definitive answer in either direction. That was the whole
 * reason these routes existed before any component did, and it is still the
 * reason the reserved names are served now that some ids install real source:
 * the answer an assistant must not have to guess at is "no", and it is only
 * trustworthy if "yes" comes from the same place.
 *
 * Every payload below therefore branches on `getBuiltFiles(...)` — the actual
 * source in `registry/__index__.ts` — rather than on a status word or a
 * constant. `implemented` in `meta.opsinjs`, the presence of `files`, and the
 * `docs` sentence are three renderings of that one lookup, and they cannot
 * disagree.
 *
 * Item names never carry a base or style. The docs page for a component has
 * exactly one canonical URL; the base × style matrix is addressable here, at
 * `/r/styles/[style]/[name]`, and on the chrome-less `/view` routes (locked
 * decision 6).
 */

import { source } from "@/lib/source"
import {
  DEFAULT_BASE,
  DEFAULT_STYLE,
  KNOWN_BASES,
  KNOWN_STYLES,
  REGISTRY_ITEM_SCHEMA_URL,
  REGISTRY_NAMESPACE,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  findCatalogueRow,
  getBuiltFiles,
  json,
  suggestNames,
  type CatalogueRow,
} from "./contracts"

export interface RegistryItemFile {
  path: string
  type: string
  target?: string
  /**
   * The file's bytes. Optional in shadcn's schema and mandatory in practice: its
   * installer skips any `files[]` entry without one, silently, and still reports
   * success. See `RegistrySourceFile` in `./contracts`.
   */
  content?: string
}

export interface RegistryItem {
  $schema?: string
  name: string
  type: string
  title: string
  description: string
  author?: string
  categories?: string[]
  dependencies?: string[]
  registryDependencies?: string[]
  files?: RegistryItemFile[]
  cssVars?: Record<string, Record<string, string>>
  docs?: string
  meta?: Record<string, unknown>
}

/* ------------------------------------------------------------------ *
 * Documentation links, resolved through the page tree
 * ------------------------------------------------------------------ */

/**
 * Resolve a component's documentation URL by asking the loader for the page,
 * rather than assembling a path. Two things fall out of that: no literal
 * documentation prefix appears in this file (the prefix is owned by
 * `lib/routes.ts` and read by `lib/source.ts`), and a link is only ever
 * emitted for a page that exists — so `/r/index.json` cannot advertise a 404.
 */
export function componentDocsUrl(name: string): string | undefined {
  const page = source.getPage(["components", name])
  return page ? absoluteUrl(page.url) : undefined
}

export function componentMarkdownUrl(name: string): string | undefined {
  const url = componentDocsUrl(name)
  return url ? `${url}.md` : undefined
}

/** Where to send a reader when a component has no page of its own. */
export function componentIndexUrl(): string | undefined {
  const page = source.getPage(["components"])
  return page ? absoluteUrl(page.url) : undefined
}

/* ------------------------------------------------------------------ *
 * The `docs` string
 * ------------------------------------------------------------------ */

/**
 * The shadcn CLI prints an item's `docs` string after `add`. It is therefore
 * the only channel that reaches a developer who never opened this site, and the
 * only place either half of the answer — "this does not exist yet", or "this
 * exists and here is how far you may lean on it" — can arrive at the exact
 * moment somebody tries to install it.
 *
 * Every branch below is chosen on the PAYLOAD where it can be, and on
 * `row.status` only for the part status actually decides. A sentence about
 * whether files were written must never be derived from a phase word, and a
 * sentence about stability must never be typed as a constant.
 */
function docsSentence(row: CatalogueRow, files: RegistryItemFile[]): string {
  const url = componentDocsUrl(row.name) ?? componentIndexUrl() ?? SITE_URL

  if (row.status === "considered") {
    return [
      `${row.title} is on the considered roster: the name is reserved and the id resolves,`,
      `but no specification has been written and no code exists.`,
      `Build it yourself, or open a proposal — ${url}`,
    ].join(" ")
  }

  /* `planned` has two shapes, and they need two sentences rather than one
     sentence with a patched clause.

     A row keeps `status: "planned"` until its page has been rewritten from a
     specification into documentation, and source can land under
     `registry/bases/<base>/` before that rewrite happens. No row is in that
     window today — the catalogue holds `alpha` and `considered` rows and
     nothing else — but the window is a real state of this repository and it is
     where the failure lives: in it the single old sentence contradicted itself
     twice, opening "is NOT IMPLEMENTED" and going on to say "there are no files
     to install yet", beside a payload that shipped some. So the branch is
     chosen on the payload, not on the status, and each branch says one coherent
     thing. */
  if (row.status === "planned" && files.length === 0) {
    return [
      `${row.title} is NOT IMPLEMENTED. This registry entry is a specification, not a component:`,
      `it publishes the intended name, category and clinical contract so that tooling gets a`,
      `definitive answer instead of a 404. There are no files to install yet.`,
      `Read the specification before building your own — it names the safety questions the`,
      `component has to answer — at ${url}`,
    ].join(" ")
  }

  if (row.status === "planned") {
    return [
      `${row.title} installs source from this entry, and its documentation page is still marked`,
      `a specification (status: planned) — the two have not been declared to agree yet.`,
      `Treat the page as the contract and this code as an implementation under review:`,
      `read it before you depend on the API, because it names the safety questions the`,
      `component has to answer — at ${url}`,
    ].join(" ")
  }

  /* A row that is neither `considered` nor `planned` and has source behind it —
     today that is every `alpha` id. The CLI has just written this component into
     somebody's project, so `Title — url` is the one moment where saying nothing
     costs something: the reader has the code and no statement about how much
     they may rely on it. The caveat is read off `row.status` rather than typed,
     so the day a row is promoted the sentence stops making it. */
  if (files.length > 0 && row.status !== "stable") {
    return [
      `${row.title} installs real source, and its documentation page is \`${row.status}\` rather than \`stable\`,`,
      `so the API may still change. Read the page before you depend on it — it names the clinical`,
      `contract and the accessibility bar this component has to clear — at ${url}`,
    ].join(" ")
  }

  return `${row.title} — ${url}`
}

/**
 * Bare catalogue ids in, namespaced registry references out.
 *
 * A catalogue row composes by id — `result-card` names `status-pill` — because
 * the catalogue is the roster of what opsinjs contains and has no business
 * knowing what a registry namespace is. shadcn does not read it that way: a
 * dependency with no namespace is resolved against its own default registry, so
 * a bare `status-pill` on the wire sends a consumer to
 * `ui.shadcn.com/r/styles/<style>/status-pill.json` and they get a 404 or, worse,
 * somebody else's component with the same name. `@opsinjs/status-pill` resolves
 * through the `registries` entry the consumer already has in `components.json`,
 * which is how they reached this item in the first place.
 *
 * An id that already carries a namespace or is an absolute URL is passed through
 * untouched — that is how a row would declare a dependency on an upstream
 * shadcn item, and rewriting it would break exactly that case.
 */
function namespaceRegistryDependencies(ids: string[]): string[] {
  return ids.map((id) =>
    id.startsWith("@") || /^https?:\/\//.test(id)
      ? id
      : `${REGISTRY_NAMESPACE}/${id}`
  )
}

/* ------------------------------------------------------------------ *
 * Items
 * ------------------------------------------------------------------ */

function opsinjsMeta(
  row: CatalogueRow,
  base: string,
  style: string,
  files: RegistryItemFile[]
): Record<string, unknown> {
  return {
    opsinjs: {
      /** The single most load-bearing field on this surface. */
      implemented: files.length > 0,
      status: row.status,
      category: row.category,
      base,
      style,
      since: row.since,
      owner: row.owner,
      a11yDate: row.a11yDate,
      aliases: row.aliases,
      governedBy: row.governedBy,
      usedIn: row.usedIn,
      docs: componentDocsUrl(row.name),
      markdown: componentMarkdownUrl(row.name),
      catalogue: absoluteUrl("/r/index.json"),
      ...row.extra,
    },
  }
}

/**
 * A full `registry-item.json`. `files` is omitted rather than sent empty while
 * nothing is built for this id: an empty array reads as "this component has no
 * source", whereas an absent one, next to `implemented: false`, reads as "there
 * is nothing to install yet" — which is the true statement.
 *
 * When there IS something to install, every entry in `files` carries `content`.
 * That is not a nicety: an entry without it is skipped by shadcn's installer
 * with no error and no output, so an item published without content resolves,
 * prints this `docs` sentence, writes nothing, and reports success. The bytes
 * come from `registry/__index__.ts`, which the generator fills at build time.
 *
 * `dependencies` and `registryDependencies` are omitted when empty rather than
 * sent as `[]`, for the same reason `files` is: shadcn merges dependency arrays
 * across an item tree, and an empty array adds a key to the payload that says
 * nothing an absent key does not already say.
 */
export function buildRegistryItem(
  row: CatalogueRow,
  options: { base?: string; style?: string; withSchema?: boolean } = {}
): RegistryItem {
  const base = options.base ?? DEFAULT_BASE
  const style = options.style ?? DEFAULT_STYLE
  const files = getBuiltFiles(row.name, base, style)

  const item: RegistryItem = {
    ...(options.withSchema === false
      ? {}
      : { $schema: REGISTRY_ITEM_SCHEMA_URL }),
    name: row.name,
    type: "registry:ui",
    title: row.title,
    description: row.description,
    author: SITE_NAME,
    categories: [row.category],
    docs: docsSentence(row, files),
    meta: opsinjsMeta(row, base, style, files),
  }
  if (row.dependencies.length > 0) item.dependencies = [...row.dependencies]
  if (row.registryDependencies.length > 0) {
    item.registryDependencies = namespaceRegistryDependencies(
      row.registryDependencies
    )
  }
  if (files.length > 0) item.files = files
  return item
}

/**
 * The catalog form of an item.
 *
 * A catalog carries no `content` inside `files`: shadcn's own registry builder
 * strips it when it publishes one, and repeating every component's whole source
 * across a sixty-row listing turns a roster into a download. The paths, types
 * and targets survive, because "what does this item install, and where" is
 * precisely what a catalog is read for. `$schema` and `author` are dropped
 * because they belong to the catalog document, not to each of its rows.
 *
 * `docs` is kept, deliberately and at the cost of some length. It is the string
 * `npx shadcn mcp` shows an assistant that asked what opsinjs has, and it is the
 * sentence that says a given id is a specification rather than a component. A
 * roster of sixty ids with no such sentence is exactly the silent gap this
 * surface exists to close.
 *
 * NOTE: the comment that stood here before claimed `docs` was dropped. It never
 * was, and dropping it would have contradicted this module's own header.
 */
export function buildCatalogEntry(row: CatalogueRow): RegistryItem {
  const item = buildRegistryItem(row, { withSchema: false })
  return {
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    categories: item.categories,
    dependencies: item.dependencies,
    registryDependencies: item.registryDependencies,
    files: item.files?.map((file) => ({
      path: file.path,
      type: file.type,
      ...(file.target === undefined ? {} : { target: file.target }),
    })),
    docs: item.docs,
    meta: item.meta,
  }
}

/* ------------------------------------------------------------------ *
 * Serving one item
 * ------------------------------------------------------------------ */

/** Registry item URLs carry a `.json` suffix; the item name does not. */
export function stripJsonSuffix(segment: string): string {
  return segment.replace(/\.json$/i, "")
}

/**
 * Resolve one id and answer.
 *
 * A miss returns 404 with a body an agent can act on: the fact that the name
 * is unknown, the nearest ids in the catalogue, and where the full roster
 * lives. A bare 404 is what makes a model guess; a 404 that names five real
 * component ids is what makes it stop.
 */
export function serveRegistryItem(
  rawName: string,
  options: { base?: string; style?: string } = {}
): Response {
  const name = stripJsonSuffix(decodeURIComponent(rawName)).trim()
  const row = findCatalogueRow(name)

  if (!row) {
    return json(
      {
        error: "unknown-item",
        name,
        message: `${SITE_NAME} has no registry item called "${name}".`,
        didYouMean: suggestNames(name),
        roster: absoluteUrl("/r/index.json"),
        catalog: absoluteUrl("/r/registry.json"),
        hint: "Every id opsinjs has claimed — specified or merely considered — appears in the roster. If it is not there, it does not exist and must not be invented.",
      },
      { status: 404 }
    )
  }

  const base = options.base ?? DEFAULT_BASE
  const style = options.style ?? DEFAULT_STYLE

  if (!(KNOWN_BASES as readonly string[]).includes(base)) {
    return json(
      {
        error: "unknown-base",
        base,
        knownBases: [...KNOWN_BASES],
        message: `"${base}" is not a base in this registry.`,
      },
      { status: 404 }
    )
  }
  if (!(KNOWN_STYLES as readonly string[]).includes(style)) {
    return json(
      {
        error: "unknown-style",
        style,
        knownStyles: [...KNOWN_STYLES],
        message: `"${style}" is not a style in this registry.`,
      },
      { status: 404 }
    )
  }

  // Canonical id, not the alias that may have been asked for.
  const item = buildRegistryItem(row, { base, style })

  /* This route serves ONE item, so `x-opsinjs-implemented` answers about that
     item and overrides the system-wide default `json()` sets. Without this
     override a `HEAD /r/card.json` answered `true` — because something,
     somewhere, was built — while the body it described carried
     `implemented: false` and no `files` at all. A tool deciding whether to
     install would have been told yes about a component that has no code, which
     is exactly the failure every other surface in this repository is built to
     prevent. The system-wide answer is still on the response, unambiguously, as
     `x-opsinjs-implemented-count`. */
  return json(item, {
    headers: {
      "x-opsinjs-status": row.status,
      "x-opsinjs-implemented": item.files && item.files.length > 0 ? "true" : "false",
    },
  })
}
