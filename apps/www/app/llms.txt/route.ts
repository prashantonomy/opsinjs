/**
 * GET /llms.txt — the curated index of the whole site.
 *
 * One entry per page, grouped under the sixteen documentation sections, with
 * absolute URLs, the page's release status and its search synonyms. Every page
 * appears exactly once — `check-llms.mts` asserts both that and that every URL
 * printed here answers 200, which is what stops this file rotting into a list
 * of paths that used to exist.
 *
 * The header does the work the list cannot. A model that reaches an opsinjs
 * page through a search has no way to know whether the component described on
 * it has been written, so the answer is stated once at the top, and again per
 * page in the markdown twins, and again per row in the registry. Repeating it
 * is not redundancy; each of those is a separate entry point. It has to stay
 * honest in both directions, which is why the summary and the existence rule
 * below are computed from `implementedComponents()` rather than asserted.
 *
 * ALIASES. The synonyms come from the catalogue, which owns the whole alias
 * namespace — so the phrase a clinician would use ("reference range") reaches
 * the same page here, in search, and in `/r/index.json`.
 */

import {
  SITE_NAME,
  siteSummary,
  SITE_TAGLINE,
  DOCS_VERSION,
  GENERATED_AT,
  absoluteUrl,
  implementedComponents,
  text,
} from "@/app/_machine/contracts"
import {
  SHARDS,
  allPages,
  groupBySection,
  metaOf,
  renderIndexEntry,
} from "@/app/_machine/corpus"

export const dynamic = "force-static"

export function GET(): Response {
  const pages = allPages()
  const groups = groupBySection(pages)

  const counts: Record<string, number> = {}
  for (const page of pages) {
    const status = metaOf(page).status
    counts[status] = (counts[status] ?? 0) + 1
  }
  const tally = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => `${count} ${status}`)
    .join(" · ")

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_TAGLINE}`,
    "",
    siteSummary(),
    "",
    `Docs version ${DOCS_VERSION}. Corpus compiled ${GENERATED_AT}. ${pages.length} pages${tally ? ` (${tally})` : ""}.`,
    "",
    "## Reading this site as a machine",
    "",
    "- Append `.md` to any documentation URL to get that page as markdown, with its frontmatter. The JSX is already resolved to text, so a stub notice arrives as the sentence it renders rather than as a tag.",
    `- [The whole corpus in one file](${absoluteUrl("/llms-full.txt")}) — size-capped; use the shards below if it is truncated.`,
    ...Object.values(SHARDS).map(
      (shard) =>
        `- [${shard.title}](${absoluteUrl(shard.file)}) — ${shard.blurb}`
    ),
    `- [The registry catalog](${absoluteUrl("/r/registry.json")}) — the shadcn-spec catalog, and the file \`npx shadcn@latest mcp\` reads.`,
    `- [The component roster](${absoluteUrl("/r/index.json")}) — every id opsinjs has claimed, its status, and whether anything is installable. This is the definitive answer to "does opsinjs have a …?".`,
    `- [The offline bundle](${absoluteUrl("/r/docs.json")}) — the same corpus as JSON, one record per page.`,
    "- `GET /api/search?query=<term>&tag=<section>` — full-text search. The parameter is `query`; `q` returns nothing.",
    "- `GET /r/<name>.json` — one registry item. Aliases resolve: `gauge` reaches `range-bar`.",
    "",
    "## Rules for generating against opsinjs",
    "",
    "- Never state that an opsinjs component exists. None does. Cite its specification instead.",
    "- Never invent a prop, a variant or a token name. The catalogue and the generated reference are the only authorities.",
    "- Never carry clinical status in a category colour, or category identity in a status colour. The two axes are separate and mixing them is the failure this system is built to prevent.",
    '- Never present a number without its unit and its precision rule, and never label a value "normal".',
    "",
  ]

  for (const group of groups) {
    lines.push(`## ${group.section.title}`)
    lines.push("")
    lines.push(group.section.blurb)
    lines.push("")
    for (const page of group.pages) lines.push(renderIndexEntry(page))
    lines.push("")
  }

  return text(`${lines.join("\n").trimEnd()}\n`)
}
