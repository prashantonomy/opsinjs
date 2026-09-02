/**
 * app/_machine/registry-payload.ts — the shadcn-spec registry, built from the
 * catalogue.
 *
 * WHY A REGISTRY WITH NO CODE IN IT
 * `npx shadcn@latest mcp` points an assistant at `/r/registry.json`. If that
 * catalog is missing or malformed the MCP server fails quietly and the
 * assistant falls back on what it thinks it remembers about a "RangeBar" —
 * which is nothing, so it invents one. A catalog that lists every id opsinjs
 * has claimed, each carrying `meta.opsinjs.status` and a `docs` sentence
 * saying it is not built, converts that silent failure into a definitive
 * negative answer. That is the whole reason these routes exist before any
 * component does.
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
 * the only channel that reaches a developer who never opened this site, and
 * the only place a "this does not exist yet" can arrive at the exact moment
 * somebody tries to install it.
 */
function docsSentence(row: CatalogueRow): string {
  const url = componentDocsUrl(row.name) ?? componentIndexUrl() ?? SITE_URL

  if (row.status === "considered") {
    return [
      `${row.title} is on the considered roster: the name is reserved and the id resolves,`,
      `but no specification has been written and no code exists.`,
      `Build it yourself, or open a proposal — ${url}`,
    ].join(" ")
  }

  if (row.status === "planned") {
    return [
      `${row.title} is NOT IMPLEMENTED. This registry entry is a specification, not a component:`,
      `it publishes the intended name, category and clinical contract so that tooling gets a`,
      `definitive answer instead of a 404. There are no files to install yet.`,
      `Read the specification before building your own — it names the safety questions the`,
      `component has to answer — at ${url}`,
    ].join(" ")
  }

  return `${row.title} — ${url}`
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
 * nothing is built: an empty array reads as "this component has no source",
 * whereas an absent one, next to `implemented: false`, reads as "there is
 * nothing to install yet" — which is the true statement.
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
    docs: docsSentence(row),
    meta: opsinjsMeta(row, base, style, files),
  }
  if (files.length > 0) item.files = files
  return item
}

/**
 * The catalog form of an item. The registry specification forbids a `content`
 * property inside `files` in a catalog, and there is no reason to repeat the
 * long `docs` sentence on every row of a list, so both are dropped and the
 * per-item URL is published instead.
 */
export function buildCatalogEntry(row: CatalogueRow): RegistryItem {
  const item = buildRegistryItem(row, { withSchema: false })
  return {
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    categories: item.categories,
    files: item.files,
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
  return json(buildRegistryItem(row, { base, style }), {
    headers: { "x-opsinjs-status": row.status },
  })
}
