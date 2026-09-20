/**
 * GET /r/<name>.json serves one registry item at the default base and style.
 *
 * This is the URL the `@opsinjs` namespace resolves to: a project with
 * `"@opsinjs": "https://opsinjs.pensievelabs.org/r/{name}.json"` in its components.json
 * reaches exactly here when somebody runs `shadcn add @opsinjs/range-bar`.
 *
 * Aliases resolve. `/r/gauge.json` returns the `range-bar` item, with its
 * canonical name in the body. The alias namespace is declared once in
 * `registry/catalogue.ts`, so a synonym that works in the site's search works
 * on the wire too.
 *
 * An unknown name returns 404 with the nearest real ids in the body rather
 * than an empty page. See `serveRegistryItem`.
 */

import { getCatalogue } from "@/app/_machine/contracts"
import { serveRegistryItem } from "@/app/_machine/registry-payload"

export const dynamic = "force-static"
export const dynamicParams = true

export function generateStaticParams(): { name: string }[] {
  return getCatalogue().rows.map((row) => ({ name: `${row.name}.json` }))
}

export async function GET(
  _request: Request,
  context: RouteContext<"/r/[name]">
): Promise<Response> {
  const { name } = await context.params
  return serveRegistryItem(name)
}
