/**
 * GET /r/docs.json returns the offline bundle.
 *
 * Every page of the corpus as processed markdown, in one JSON document, with the
 * docs version. It exists for the agent that has a registry configured and no
 * general web access: `llms-full.txt` is the same corpus as prose, this is the
 * same corpus as data, addressable by URL, section and status without parsing.
 *
 * The markdown is `getText("processed")`: remark-processed, imports stripped,
 * headings given explicit ids. See `app/_machine/corpus.ts` for what that
 * processing does and does not include. Documentation components remain as JSX
 * elements with their attributes. A record for a `kind: component` page
 * carries `status` as a field, and every record for a page that documents a
 * component or a screen carries `implemented` too, rather than leaving either
 * to be read out of the prose. `implemented` used to be described here and not
 * emitted, so an offline reader had to join against `/r/index.json` to answer
 * the one question this whole surface exists to answer.
 *
 * THE BUNDLE IS CAPPED, AND EVERYTHING BELOW FOLLOWS FROM THAT.
 *
 * It drops a suffix of its own ordering, which `truncationOrder` defines. That
 * is the same order the concatenated corpus files use, so a component with real
 * source outranks a reserved name inside its section and the half that survives
 * is the useful half. It names every page it dropped in `omittedPages`, because
 * a reader who cannot name the gap cannot go and fetch it.
 *
 * And it publishes TWO status tallies, both of them over COMPONENT PAGES
 * ONLY. `componentCounts` is taken over the component pages this response
 * carries and `corpusComponentCounts` over every component page in the
 * corpus, so neither sums to `included` or to `total` any more: 342 of the
 * 402 pages declare no release phase, because the word answers a question
 * about code and only a component page documents any. Counting a phase over
 * the whole corpus would have put `"undefined": 342` in a published tally.
 * Two tallies rather than one, because a single tally taken over the pages
 * that fit, sitting next to `total`, is read as the corpus figure and is not
 * one: it under-reports every phase by whatever the budget dropped.
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
  pageImplemented,
  pageMarkdownUrl,
  pageUrl,
  sectionOf,
  truncationOrder,
} from "@/app/_machine/corpus"

export const dynamic = "force-static"

interface BundlePage {
  url: string
  markdownUrl: string
  slug: string[]
  section: string
  title: string
  description?: string
  /**
   * The release phase, on a `kind: component` page and nowhere else. Absent on
   * every other record rather than filled in with a default, because the word
   * used to mean "this prose is finished" off a component page and that is a
   * different claim wearing the same word.
   */
  status?: string
  /**
   * Whether the thing this page documents is built. Absent rather than `false`
   * on a page that documents nothing buildable, which is most of the corpus;
   * see `pageImplemented()`. It is the same answer as the twin's frontmatter
   * and the roster's `implemented` field, because it is the same function.
   */
  implemented?: boolean
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
  const pages = truncationOrder(allPages())

  const rendered: BundlePage[] = []
  let size = 0

  for (const page of pages) {
    const meta = metaOf(page)
    const markdown = (await page.data.getText("processed")).trim()

    /* `break`, not `continue`. Skipping one oversized page and then admitting
       the smaller pages behind it keeps `omitted` correct and makes the omitted
       SET arbitrary. The pages in it are scattered through the corpus, in no
       order a reader can reconstruct. A prefix of the ordering is what
       `assemble()` keeps for the concatenated files, and this is the same
       corpus truncated for the same reason; the tail is then exactly what
       `omittedPages` lists. */
    if (size + markdown.length > BUDGETS.bundle && rendered.length > 0) break
    size += markdown.length

    rendered.push({
      url: pageUrl(page),
      markdownUrl: pageMarkdownUrl(page),
      slug: page.slugs,
      section: sectionOf(page).title,
      title: meta.title,
      description: meta.description,
      status: meta.status,
      implemented: pageImplemented(page),
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

  /* The loop keeps a prefix, so the tail is precisely what the budget dropped. */
  const dropped = pages.slice(rendered.length)

  /* Both tallies skip a page with no phase, which is every page that is not a
     component. Without the guard the key `"undefined"` appears in a published
     count and an agent reads it as a fourth release phase. */
  const componentCounts: Record<string, number> = {}
  for (const page of rendered) {
    if (!page.status) continue
    componentCounts[page.status] = (componentCounts[page.status] ?? 0) + 1
  }

  const corpusComponentCounts: Record<string, number> = {}
  for (const page of pages) {
    const status = metaOf(page).status
    if (!status) continue
    corpusComponentCounts[status] = (corpusComponentCounts[status] ?? 0) + 1
  }

  return json({
    name: `${SITE_NAME}-docs`,
    version: DOCS_VERSION,
    ...provenance(),
    homepage: SITE_URL,
    format: "processed-markdown",
    characters: size,
    total: pages.length,
    included: rendered.length,
    omitted: dropped.length,
    ...(dropped.length > 0
      ? {
          truncated: true,
          truncationNote: `${dropped.length} page(s) did not fit the ${BUDGETS.bundle}-character budget for this bundle and are listed in \`omittedPages\`. Fetch them individually from their \`markdownUrl\`, or take the whole section from the shards.`,
          omittedPages: dropped.map((page) => {
            const meta = metaOf(page)
            return {
              url: pageUrl(page),
              markdownUrl: pageMarkdownUrl(page),
              section: sectionOf(page).title,
              title: meta.title,
              status: meta.status,
            }
          }),
        }
      : {}),
    sections: SECTIONS.map((section) => ({
      id: section.id === "" ? "index" : section.id,
      title: section.title,
      description: section.blurb,
      /** Pages of this section carried by THIS response. */
      pages: rendered.filter((page) => page.section === section.title).length,
      /** Pages of this section in the corpus, carried or not. */
      pagesInCorpus: pages.filter(
        (page) => sectionOf(page).title === section.title
      ).length,
    })),
    shards: Object.entries(SHARDS).map(([id, shard]) => ({
      id,
      title: shard.title,
      url: absoluteUrl(shard.file),
      sections: [...shard.sections],
    })),
    componentCounts,
    corpusComponentCounts,
    conventions: {
      markdownTwin:
        "Append `.md` to any documentation URL to get that page's processed markdown.",
      registryCatalog: absoluteUrl("/r/registry.json"),
      registryRoster: absoluteUrl("/r/index.json"),
      search: `${SITE_URL}/api/search?query=<term>&tag=<section>`,
      implemented:
        '`implemented` on a page record answers for the thing that page documents: a component id, or a screen specimen. It is ABSENT, not `false`, on a page that documents neither. A guide, a doctrine page or a token reference is not an unbuilt anything. Absent therefore means "the question does not apply here", and `false` means "this named thing has no code".',
      counts:
        "`componentCounts` tallies the component pages in this response. `corpusComponentCounts` tallies every component page in the corpus. Neither sums to `included` or to `total`, because a release phase is only carried by a `kind: component` page. Read the second one for any question about opsinjs; read the first for any question about this file.",
    },
    pages: rendered,
  })
}
