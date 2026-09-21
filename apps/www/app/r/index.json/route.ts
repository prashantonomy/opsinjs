/**
 * GET /r/index.json serves the lightweight roster.
 *
 * `registry.json` is the shadcn-shaped catalog and has to keep that shape.
 * This is the opsinjs-shaped one: one flat row per id with the fields a
 * decision actually turns on. Those fields are status, `notice`, whether
 * anything is installable, the category, the search synonyms, the doctrine
 * pages that govern it, and the three URLs (documentation, its markdown twin,
 * its registry item).
 *
 * `notice` IS ON EVERY ROW AND ON THE PAYLOAD ROOT, AND IT IS SAFETY CARRIER
 * 6. This is the one machine surface an agent reads to decide whether to
 * install, without following any link and without fetching a second file. It
 * used to publish a bare `status` word per row and nothing else, so an agent
 * that read only this endpoint learned that sixty components were `beta` and
 * learned nothing about what `beta` was a promise of. It was a promise of
 * very little: every component in this catalogue has now been audited against
 * WCAG 2.2 AA by its own authors, and none has had an independent
 * accessibility review or a clinical review (ADR 0025 records that the audit
 * is author-run, not an independent one). The row-level string is the short
 * form, because it is
 * repeated sixty times; the root-level one is the full invariant sentence,
 * because it is written once and is the first thing a parser reaches. Both
 * are flat text rather than derived from `status`, which is the whole point:
 * the phase word collapsed and this sentence must not collapse with it. The
 * row-level string is `REVIEW_FLOOR_NOTICE` from `lib/status.ts`, reused
 * verbatim, so a row here and a status chip on a page cannot drift apart.
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
import { REVIEW_FLOOR_NOTICE } from "@/lib/status"

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
      notice: REVIEW_FLOOR_NOTICE,
      implemented: files.length > 0,
      since: row.since,
      owner: row.owner,
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
    /* THIS DELIBERATELY OVERRIDES THE `notice` THAT `provenance()` SPREADS IN
       ABOVE, and it is the one payload where that is the right trade. The
       provenance sentence counts how many components are implemented and
       tells a reader to check `implemented` before assuming one exists. On
       this endpoint both of those are already published as data: the count is
       `implementedCount` two keys up, and the per-id answer is `implemented`
       on every row. The review floor is published nowhere else here, and it
       is the thing an agent deciding whether to install cannot work out from
       the rows. So the root string spends itself on the sentence that has no
       other carrier in this file. Every other machine route keeps the
       provenance wording, which now names the review floor too. */
    notice:
      "Every opsinjs component has been audited against WCAG 2.2 AA by its own authors. None has had an independent accessibility review, and none has had a clinical review, which is still pending. `shipped` means the source installs, and it does not mean an independent review or a clinical review has happened. Nothing here is for a production health surface.",
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
