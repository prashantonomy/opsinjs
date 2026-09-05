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
  SECTIONS,
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

  /* The existence rule is the one line in this file an assistant is most
     likely to lift verbatim into a system prompt, so it is computed from the
     built set for the same reason `siteSummary()` is. Asserting emptiness was
     right while the set was empty and became the site's largest false statement
     the day the first component landed; a hardcoded count would rot the same
     way on the day the next one does. */
  const built = implementedComponents()
  const existenceRule =
    built.length === 0
      ? "- Never state that an opsinjs component exists. None does. Cite its specification instead."
      : `- Never state that an opsinjs component exists without checking. ${built.length} are implemented and named in the summary above; every other id is a specification or a reserved name. \`implemented\` on the roster row in ${absoluteUrl("/r/index.json")} is the authority, and code generated against a \`planned\` or \`considered\` id is generated against a proposal.`

  /* What the shards actually cover, computed rather than implied.

     This line used to read "use the shards below if it is truncated", which is
     advice that works for the sections a shard names and silently fails for
     every other one — at the time of writing, Introduction, Start here,
     Recipes, Patterns, Handbook, Agents, Registry and Project had no shard at
     all, so a reader sent to "the shards below" for a handbook chapter found
     three files that did not contain it and no explanation. The recovery route
     is real, so it is named instead: every capped file lists the pages it
     dropped, and every page in the index below answers to a `.md` suffix.
     Both the count and the names are derived from SHARDS and SECTIONS, so
     adding a fourth shard rewrites the sentence rather than dating it. */
  const shardedSections = new Set<string>(
    Object.values(SHARDS).flatMap((shard) => [...shard.sections])
  )
  const unsharded = SECTIONS.filter(
    (section) => !shardedSections.has(section.id)
  )
  const shardCoverage =
    unsharded.length === 0
      ? `The shards below carry the same corpus, split into ${Object.keys(SHARDS).length} smaller files.`
      : `The shards below cover ${SECTIONS.length - unsharded.length} of the ${SECTIONS.length} sections; ${unsharded.map((section) => section.title).join(", ")} have no shard, so take those pages one at a time from the list further down this file — every documentation URL answers to a \`.md\` suffix.`

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
    "- Append `.md` to any documentation URL to get that page as processed markdown, with its frontmatter: imports stripped, headings with explicit ids, code and tables as markdown. Documentation components are NOT rendered to prose — a stub notice arrives as `<StubNotice … />`, attributes and all. Those attributes are the content; the values behind them are published separately at `/r/index.json` and under Reference.",
    `- [The whole corpus in one file](${absoluteUrl("/llms-full.txt")}) — size-capped, and it names every page it had to drop. ${shardCoverage}`,
    ...Object.values(SHARDS).map(
      (shard) =>
        `- [${shard.title}](${absoluteUrl(shard.file)}) — ${shard.blurb}`
    ),
    `- [The registry catalog](${absoluteUrl("/r/registry.json")}) — the shadcn-spec catalog, and the file \`npx shadcn@latest mcp\` reads.`,
    `- [The component roster](${absoluteUrl("/r/index.json")}) — every id opsinjs has claimed, its status, and whether anything is installable. This is the definitive answer to "does opsinjs have a …?".`,
    `- [The offline bundle](${absoluteUrl("/r/docs.json")}) — the same corpus as JSON, one record per page.`,
    "- `GET /api/search?query=<term>&tag=<section>` — full-text search. The parameter is `query`; `q` returns nothing.",
    "- `GET /r/<name>.json` — one registry item. Single-word aliases resolve: `modal` reaches `dialog`. Multi-word aliases are not slugs and have no URL of their own — `/r/gauge-bar.json` is a 404 — so map a phrase to an id through the `aliases` field on the roster.",
    "",
    "## Rules for generating against opsinjs",
    "",
    existenceRule,
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
