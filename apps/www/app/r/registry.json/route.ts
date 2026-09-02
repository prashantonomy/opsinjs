/**
 * GET /r/registry.json — the shadcn registry catalog.
 *
 * This is the file `npx shadcn@latest mcp` fetches when a project has
 * `"@opsinjs": "https://opsinjs.dev/r/{name}.json"` in its components.json. If
 * it is absent or malformed the MCP server does not report an error; the
 * assistant simply learns nothing and answers from memory. So the catalog is
 * served even though there is no code behind it, and every row says so.
 *
 * Both rosters are published: the twenty-four ids that carry a written
 * specification, and the considered ids whose names are reserved. An agent
 * asking "does opsinjs have a symptom picker?" gets `status: "considered"`
 * rather than silence it will fill in.
 *
 * The registry specification requires a flat catalog served next to its items
 * (`/r/registry.json` alongside `/r/<name>.json`) and forbids a `content`
 * property inside a catalog's `files`. Neither is violated here: nothing is
 * built, so no item carries files at all.
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
