/**
 * GET /r/index.json — the lightweight roster.
 *
 * `registry.json` is the shadcn-shaped catalog and has to keep that shape.
 * This is the opsinjs-shaped one: one flat row per id with the fields a
 * decision actually turns on — status, whether anything is installable, the
 * category, the search synonyms, the doctrine pages that govern it, and the
 * three URLs (documentation, its markdown twin, its registry item).
 *
 * The `aliases` published here are the same namespace declared once in
 * `registry/catalogue.ts`, which is what keeps a reader's search synonyms and
 * an agent's synonyms from diverging.
 */

import {
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  getBuiltFiles,
  getCatalogue,
  json,
  provenance,
  DEFAULT_BASE,
  DEFAULT_STYLE,
  KNOWN_BASES,
  KNOWN_STYLES,
} from "@/app/_machine/contracts"
import {
  componentDocsUrl,
  componentMarkdownUrl,
} from "@/app/_machine/registry-payload"

export const dynamic = "force-static"

export function GET(): Response {
  const { rows, diagnostics } = getCatalogue()

  const items = rows.map((row) => {
    const files = getBuiltFiles(row.name, DEFAULT_BASE, DEFAULT_STYLE)
    return {
      name: row.name,
      title: row.title,
      type: "registry:ui",
      description: row.description,
      category: row.category,
      status: row.status,
      implemented: files.length > 0,
      since: row.since,
      owner: row.owner,
      a11yDate: row.a11yDate,
      aliases: row.aliases,
      governedBy: row.governedBy,
      usedIn: row.usedIn,
      links: {
        docs: componentDocsUrl(row.name),
        markdown: componentMarkdownUrl(row.name),
        item: absoluteUrl(`/r/${row.name}.json`),
      },
    }
  })

  const counts: Record<string, number> = {}
  for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1

  return json({
    name: SITE_NAME,
    homepage: SITE_URL,
    ...provenance(),
    matrix: {
      bases: [...KNOWN_BASES],
      styles: [...KNOWN_STYLES],
      defaultBase: DEFAULT_BASE,
      defaultStyle: DEFAULT_STYLE,
      item: absoluteUrl("/r/{name}.json"),
      itemAtStyle: absoluteUrl("/r/styles/{style}/{name}.json"),
    },
    total: items.length,
    counts,
    items,
    ...(diagnostics.length > 0 ? { diagnostics } : {}),
  })
}
