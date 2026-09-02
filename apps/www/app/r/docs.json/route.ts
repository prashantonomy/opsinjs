/**
 * GET /r/docs.json — the offline bundle.
 *
 * Every page of the corpus as processed markdown, in one JSON document, with a
 * version stamp. It exists for the agent that has a registry configured and no
 * general web access: `llms-full.txt` is the same corpus as prose, this is the
 * same corpus as data, addressable by URL, section and status without parsing.
 *
 * The markdown is `getText("processed")`: remark-processed, imports stripped,
 * headings given explicit ids. Documentation components remain as JSX elements
 * with their attributes — see `app/_machine/corpus.ts` for what that does and
 * does not include — which is why every record also carries `status` and
 * `implemented` as fields rather than leaving them to be read out of the prose.
 *
 * The bundle is capped. When the corpus outgrows the budget the response says
 * how many pages were dropped and points at the shards, because a truncated
 * bundle that admits it is truncated is usable and one that does not is a
 * quiet source of wrong answers.
 */

import {
  DOCS_VERSION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  json,
  provenance,
} from "@/app/_machine/contracts"
import {
  BUDGETS,
  SECTIONS,
  SHARDS,
  allPages,
  metaOf,
  pageMarkdownUrl,
  pageUrl,
  sectionOf,
} from "@/app/_machine/corpus"

export const dynamic = "force-static"

interface BundlePage {
  url: string
  markdownUrl: string
  slug: string[]
  section: string
  title: string
  description?: string
  status: string
  kind?: string
  evidence?: string
  aliases: string[]
  implements: string[]
  governedBy: string[]
  usedIn: string[]
  reviewed?: string
  markdown: string
}

export async function GET(): Promise<Response> {
  const pages = allPages()

  const rendered: BundlePage[] = []
  let size = 0
  let omitted = 0

  for (const page of pages) {
    const meta = metaOf(page)
    const markdown = (await page.data.getText("processed")).trim()

    if (size + markdown.length > BUDGETS.bundle && rendered.length > 0) {
      omitted += 1
      continue
    }
    size += markdown.length

    rendered.push({
      url: pageUrl(page),
      markdownUrl: pageMarkdownUrl(page),
      slug: page.slugs,
      section: sectionOf(page).title,
      title: meta.title,
      description: meta.description,
      status: meta.status,
      kind: meta.kind,
      evidence: meta.evidence,
      aliases: meta.aliases,
      implements: meta.implements,
      governedBy: meta.governedBy,
      usedIn: meta.usedIn,
      reviewed: meta.reviewed,
      markdown,
    })
  }

  const counts: Record<string, number> = {}
  for (const page of rendered)
    counts[page.status] = (counts[page.status] ?? 0) + 1

  return json({
    name: `${SITE_NAME}-docs`,
    version: DOCS_VERSION,
    ...provenance(),
    homepage: SITE_URL,
    format: "processed-markdown",
    characters: size,
    total: pages.length,
    included: rendered.length,
    omitted,
    ...(omitted > 0
      ? {
          truncated: true,
          truncationNote: `${omitted} page(s) exceeded the ${BUDGETS.bundle}-character budget for this bundle. Fetch the missing sections from the shards instead.`,
        }
      : {}),
    sections: SECTIONS.map((section) => ({
      id: section.id === "" ? "index" : section.id,
      title: section.title,
      description: section.blurb,
      pages: rendered.filter((page) => page.section === section.title).length,
    })),
    shards: Object.entries(SHARDS).map(([id, shard]) => ({
      id,
      title: shard.title,
      url: absoluteUrl(shard.file),
      sections: [...shard.sections],
    })),
    counts,
    conventions: {
      markdownTwin:
        "Append `.md` to any documentation URL to get that page's processed markdown.",
      registryCatalog: absoluteUrl("/r/registry.json"),
      registryRoster: absoluteUrl("/r/index.json"),
      search: `${SITE_URL}/api/search?query=<term>&tag=<section>`,
    },
    pages: rendered,
  })
}
