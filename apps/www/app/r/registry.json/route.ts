/**
 * GET /r/registry.json serves the shadcn registry catalog.
 *
 * This is the file `npx shadcn@latest mcp` fetches when a project has
 * `"@opsinjs": "https://opsinjs.pensievelabs.org/r/{name}.json"` in its
 * components.json. If
 * it is absent or malformed the MCP server does not report an error; the
 * assistant simply learns nothing and answers from memory. So every id opsinjs
 * has claimed is published here, whether or not there is code behind it, and
 * each row says which it is.
 *
 * The per-row answers are `meta.opsinjs.status`, `meta.opsinjs.implemented`
 * and the presence of `files`; no count is asserted in this comment, because a
 * count written in a comment is a count nobody updates.
 *
 * The registry specification requires a flat catalog served next to its items
 * (`/r/registry.json` alongside `/r/<name>.json`) and forbids a `content`
 * property inside a catalog's `files`. Neither is violated here. A built id
 * does carry `files`, with their paths, types and targets, because that is what
 * a catalog is read for. `buildCatalogEntry` strips the bytes, so the catalog
 * stays a roster rather than becoming a sixty-row download.
 */

import {
  REGISTRY_SCHEMA_URL,
  SITE_NAME,
  SITE_URL,
  getCatalogue,
  json,
} from "@/app/_machine/contracts"
import { buildCatalogEntry } from "@/app/_machine/registry-payload"

export const dynamic = "force-static"

export function GET(): Response {
  const { rows, diagnostics } = getCatalogue()

  return json({
    $schema: REGISTRY_SCHEMA_URL,
    name: SITE_NAME,
    homepage: SITE_URL,
    items: rows.map(buildCatalogEntry),
    ...(diagnostics.length > 0 ? { "x-opsinjs-diagnostics": diagnostics } : {}),
  })
}
