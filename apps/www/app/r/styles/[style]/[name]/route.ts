/**
 * GET /r/styles/<style>/<name>.json — one registry item at an explicit style.
 *
 * The docs page for a component has exactly one canonical URL and never a
 * style segment; the full base × style matrix is addressable here and on the
 * chrome-less `/view` routes, because those are the surfaces where a machine
 * or an iframe has to name a specific combination (locked decision 6).
 *
 * `base` is behaviour, authored once per primitive library. `style` is only a
 * stylesheet. Adding a second base later is a folder under `registry/bases/`,
 * not a URL migration — which is the property this split exists to protect.
 *
 * Today the matrix has one cell: base `base`, style `base-lyra`. An unknown
 * style returns 404 naming the styles that do exist, so an agent probing the
 * matrix learns its shape instead of guessing at it.
 */

import {
  DEFAULT_BASE,
  KNOWN_STYLES,
  getCatalogue,
} from "@/app/_machine/contracts"
import { serveRegistryItem } from "@/app/_machine/registry-payload"

export const dynamic = "force-static"
export const dynamicParams = true

export function generateStaticParams(): { style: string; name: string }[] {
  const rows = getCatalogue().rows
  return KNOWN_STYLES.flatMap((style) =>
    rows.map((row) => ({ style, name: `${row.name}.json` }))
  )
}

export async function GET(
  _request: Request,
  context: RouteContext<"/r/styles/[style]/[name]">
): Promise<Response> {
  const { style, name } = await context.params
  return serveRegistryItem(name, { base: DEFAULT_BASE, style })
}
